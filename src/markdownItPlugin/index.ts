// Markdown-it content script: turns
//
//     !!! card_light_blue My card title
//     Card contents
//     !!!->
//
// into a styled HTML section in the note viewer (and in exported HTML/PDF).
//
// The HTML itself is built by `blocks/render.ts`, which the picker dialog uses
// as well. This file only deals with the tokenizer.

import { isCellSeparator, isCloseFence, parseOpenFence, resolveBlock } from '../blocks';
import {
	BlockMeta,
	containerClose,
	containerOpen,
	isMarkdownMode,
	rawHtml,
} from '../blocks/render';

export default (_context: { contentScriptId: string }) => {
	return {
		plugin: (markdownIt: any) => {
			const escape = markdownIt.utils.escapeHtml;
			const inline = (text: string): string => {
				if (!text) return '';
				try {
					return markdownIt.renderInline(text);
				} catch (_error) {
					return escape(text);
				}
			};

			// ---------------------------------------------------------------
			// Block rule
			// ---------------------------------------------------------------

			const lineAt = (state: any, line: number): string => {
				const start = state.bMarks[line] + state.tShift[line];
				const end = state.eMarks[line];
				return state.src.slice(start, end);
			};

			const rule = (state: any, startLine: number, endLine: number, silent: boolean): boolean => {
				// Four spaces of indentation means it is an indented code block.
				if (state.sCount[startLine] - state.blkIndent >= 4) return false;

				const open = parseOpenFence(lineAt(state, startLine));
				if (!open) return false;
				if (silent) return true;

				const def = resolveBlock(open.type);
				const meta: BlockMeta = { def, rawType: open.type, title: open.title };

				// Find the matching closing fence, allowing for nested blocks.
				let nextLine = startLine;
				let depth = 1;
				let haveEndMarker = false;

				while (nextLine + 1 < endLine) {
					nextLine += 1;
					if (state.sCount[nextLine] - state.blkIndent >= 4) continue;

					const text = lineAt(state, nextLine);
					if (parseOpenFence(text)) {
						depth += 1;
					} else if (isCloseFence(text)) {
						depth -= 1;
						if (depth === 0) {
							haveEndMarker = true;
							break;
						}
					}
				}

				// Unclosed blocks run to the end of the note rather than being
				// dropped - that keeps the preview usable while still typing.
				const contentEnd = haveEndMarker ? nextLine : endLine;

				const oldParent = state.parentType;
				const oldLineMax = state.lineMax;
				state.parentType = 'jhtml';

				if (!isMarkdownMode(def)) {
					const content = state.getLines(startLine + 1, contentEnd, state.blkIndent, false);
					const token = state.push('jhtml_raw', 'div', 0);
					token.block = true;
					token.map = [startLine, contentEnd];
					token.meta = meta;
					token.content = content;
				} else if (def && def.mode === 'grid') {
					state.lineMax = contentEnd;

					const tokenOpen = state.push('jhtml_open', 'div', 1);
					tokenOpen.block = true;
					tokenOpen.markup = '!!!';
					tokenOpen.map = [startLine, contentEnd];
					tokenOpen.meta = meta;

					let cellStart = startLine + 1;
					let innerDepth = 0;

					for (let line = startLine + 1; line <= contentEnd; line++) {
						const isEnd = line === contentEnd;
						let isSeparator = false;

						if (!isEnd) {
							const text = lineAt(state, line);
							if (parseOpenFence(text)) innerDepth += 1;
							else if (isCloseFence(text)) innerDepth -= 1;
							else if (innerDepth === 0 && isCellSeparator(text)) isSeparator = true;
						}

						if (isEnd || isSeparator) {
							state.push('jhtml_cell_open', 'div', 1).block = true;
							state.lineMax = line;
							state.md.block.tokenize(state, cellStart, line);
							state.lineMax = contentEnd;
							state.push('jhtml_cell_close', 'div', -1).block = true;
							cellStart = line + 1;
						}
					}

					const tokenClose = state.push('jhtml_close', 'div', -1);
					tokenClose.block = true;
					tokenClose.markup = '!!!->';
					tokenClose.meta = meta;
				} else {
					state.lineMax = contentEnd;

					const tokenOpen = state.push('jhtml_open', 'div', 1);
					tokenOpen.block = true;
					tokenOpen.markup = '!!!';
					tokenOpen.map = [startLine, contentEnd];
					tokenOpen.meta = meta;

					state.md.block.tokenize(state, startLine + 1, contentEnd);

					const tokenClose = state.push('jhtml_close', 'div', -1);
					tokenClose.block = true;
					tokenClose.markup = '!!!->';
					tokenClose.meta = meta;
				}

				state.parentType = oldParent;
				state.lineMax = oldLineMax;
				state.line = contentEnd + (haveEndMarker ? 1 : 0);

				return true;
			};

			markdownIt.block.ruler.before('fence', 'jhtml_block', rule, {
				alt: ['paragraph', 'reference', 'blockquote', 'list'],
			});

			markdownIt.renderer.rules.jhtml_open = (tokens: any[], idx: number) =>
				containerOpen(tokens[idx].meta, inline);
			markdownIt.renderer.rules.jhtml_close = (tokens: any[], idx: number) =>
				containerClose(tokens[idx].meta, inline);
			markdownIt.renderer.rules.jhtml_cell_open = () => '<div class="jhtml-cell">';
			markdownIt.renderer.rules.jhtml_cell_close = () => '</div>';
			markdownIt.renderer.rules.jhtml_raw = (tokens: any[], idx: number) =>
				rawHtml(tokens[idx].meta, tokens[idx].content, inline);
		},

		assets: () => [{ name: './style.css' }],
	};
};
