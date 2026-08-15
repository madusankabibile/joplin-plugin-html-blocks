// CodeMirror 6 content script: colours the `!!! type` / `!!!->` fences and the
// lines between them while editing, and provides the editor-side command used
// to insert a new block.

import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { EditorState, RangeSetBuilder, StateField } from '@codemirror/state';
import { buildSnippet, isCloseFence, parseOpenFence, resolveBlock } from '../blocks';

const MAX_HIGHLIGHTED_LINES = 50000;

const markerMark = Decoration.mark({ class: 'cm-jhtml-marker' });
const typeMark = Decoration.mark({ class: 'cm-jhtml-type' });
const unknownTypeMark = Decoration.mark({ class: 'cm-jhtml-type cm-jhtml-type-unknown' });
const titleMark = Decoration.mark({ class: 'cm-jhtml-title' });

const lineDecorationCache: Record<string, Decoration> = {};
const lineDecoration = (classes: string): Decoration => {
	if (!lineDecorationCache[classes]) {
		lineDecorationCache[classes] = Decoration.line({ class: classes });
	}
	return lineDecorationCache[classes];
};

const buildDecorations = (state: EditorState): DecorationSet => {
	const builder = new RangeSetBuilder<Decoration>();
	if (state.doc.lines > MAX_HIGHLIGHTED_LINES) return builder.finish();

	// Ids of the blocks we are currently inside of, innermost last.
	const stack: string[] = [];

	for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
		const line = state.doc.line(lineNumber);
		const text = line.text;
		const open = parseOpenFence(text);

		if (open) {
			const def = resolveBlock(open.type);
			const id = def ? def.id : 'unknown';
			stack.push(id);

			const depth = Math.min(stack.length, 4);
			builder.add(line.from, line.from, lineDecoration(
				`cm-jhtml-line cm-jhtml-fence cm-jhtml-fence-open cm-jhtml-b-${id} cm-jhtml-depth-${depth}`,
			));
			builder.add(line.from + open.markerStart, line.from + open.markerEnd, markerMark);
			builder.add(line.from + open.typeStart, line.from + open.typeEnd, def ? typeMark : unknownTypeMark);
			if (open.title) builder.add(line.from + open.titleStart, line.to, titleMark);
			continue;
		}

		if (isCloseFence(text) && stack.length) {
			const id = stack[stack.length - 1];
			const depth = Math.min(stack.length, 4);
			builder.add(line.from, line.from, lineDecoration(
				`cm-jhtml-line cm-jhtml-fence cm-jhtml-fence-close cm-jhtml-b-${id} cm-jhtml-depth-${depth}`,
			));
			if (line.to > line.from) builder.add(line.from, line.to, markerMark);
			stack.pop();
			continue;
		}

		if (stack.length) {
			const id = stack[stack.length - 1];
			const depth = Math.min(stack.length, 4);
			builder.add(line.from, line.from, lineDecoration(
				`cm-jhtml-line cm-jhtml-body cm-jhtml-b-${id} cm-jhtml-depth-${depth}`,
			));
		}
	}

	return builder.finish();
};

const highlightField = StateField.define<DecorationSet>({
	create: state => buildDecorations(state),
	update: (decorations, transaction) =>
		transaction.docChanged ? buildDecorations(transaction.state) : decorations,
	provide: field => EditorView.decorations.from(field),
});

export default (context: { contentScriptId: string; postMessage: (message: any)=> Promise<any> }) => {
	return {
		plugin: async (editorControl: any) => {
			// The decorations below are CodeMirror 6 only. On the legacy
			// CodeMirror 5 editor there is no addExtension, so we skip the
			// highlighting rather than throwing and losing the insert command.
			const isCodeMirror6 = typeof editorControl.addExtension === 'function';

			let highlighting = true;
			try {
				const settings = await context.postMessage({ type: 'getSettings' });
				if (settings && typeof settings.editorHighlighting === 'boolean') {
					highlighting = settings.editorHighlighting;
				}
			} catch (_error) {
				// Older Joplin versions, or the plugin not being ready yet: keep the default.
			}

			if (highlighting && isCodeMirror6) editorControl.addExtension(highlightField);

			// Called from the main script through:
			//   joplin.commands.execute('editor.execCommand', { name: 'htmlBlocks.insert', args: [id] })
			editorControl.registerCommand('htmlBlocks.insert', (blockId: string) => {
				const def = resolveBlock(blockId);
				if (!def) return;

				const view: EditorView = editorControl.editor;
				const state = view.state;
				const range = state.selection.main;
				const selected = state.sliceDoc(range.from, range.to);

				const snippet = buildSnippet(def, selected.trim() ? { body: selected } : {});

				// Never start a block in the middle of an existing line.
				const currentLine = state.doc.lineAt(range.from);
				const prefix = range.from > currentLine.from ? '\n' : '';
				const insert = prefix + snippet.text;
				const base = range.from + prefix.length;

				view.dispatch({
					changes: { from: range.from, to: range.to, insert },
					selection: {
						anchor: base + snippet.selectionStart,
						head: base + snippet.selectionEnd,
					},
					scrollIntoView: true,
				});
				view.focus();
			});
		},

		assets: () => [{ name: './style.css' }],
	};
};
