// Markdown-it content script: turns
//
//     !!! card_light_blue My card title
//     Card contents
//     !!!->
//
// into a styled HTML section in the note viewer (and in exported HTML/PDF).

import {
	BlockDefinition,
	isCellSeparator,
	isCloseFence,
	parseOpenFence,
	resolveBlock,
	splitFields,
} from '../blocks';

interface BlockMeta {
	def: BlockDefinition | null;
	rawType: string;
	title: string;
}

// Modes whose contents are plain markdown and are therefore handed back to the
// normal block tokenizer. Everything else is consumed line by line instead.
const MARKDOWN_MODES = ['card', 'callout', 'plain', 'quote', 'details', 'grid'];

const isMarkdownMode = (def: BlockDefinition | null): boolean => {
	if (!def) return true; // Unknown types fall back to a plain markdown box.
	return MARKDOWN_MODES.includes(def.mode);
};

const classesFor = (meta: BlockMeta): string => {
	const def = meta.def;
	const out = ['jhtml'];

	if (!def) {
		out.push('jhtml-plain', 'jhtml-unknown');
	} else {
		out.push(`jhtml-${def.mode}`);
		out.push(`jhtml-b-${def.id}`);
		if (def.variant) out.push(`jhtml-v-${def.variant}`);
		if (def.listStyle) out.push(`jhtml-ls-${def.listStyle}`);
		if (def.columns) out.push(`jhtml-cols-${def.columns}`);
		if (def.bare) out.push('jhtml-bare');
	}

	return out.join(' ');
};

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
			// HTML generation
			// ---------------------------------------------------------------

			const headHtml = (meta: BlockMeta): string => {
				const def = meta.def;
				const title = meta.title || (def && def.defaultTitle) || '';
				const icon = def && def.icon ? `<span class="jhtml-icon">${def.icon}</span>` : '';
				const typeBadge = !def ? `<span class="jhtml-type-badge">${escape(meta.rawType)}</span>` : '';

				if (!title && !icon && !typeBadge) return '';

				return `<div class="jhtml-head">${icon}<span class="jhtml-title">${inline(title)}</span>${typeBadge}</div>`;
			};

			const wrapperOpen = (meta: BlockMeta, extraClass = ''): string => {
				const classes = `${classesFor(meta)}${extraClass ? ` ${extraClass}` : ''}`;
				const type = escape(meta.def ? meta.def.id : meta.rawType);
				return `<div class="${classes}" data-jhtml-type="${type}">`;
			};

			const containerOpen = (meta: BlockMeta): string => {
				const def = meta.def;
				const mode = def ? def.mode : 'plain';

				if (mode === 'quote') {
					return `<blockquote class="${classesFor(meta)}" data-jhtml-type="${escape(def.id)}">` +
						'<div class="jhtml-body">';
				}

				if (mode === 'details') {
					const title = meta.title || def.titleHint || def.label;
					const open = def.open ? ' open' : '';
					return `<details class="${classesFor(meta)}" data-jhtml-type="${escape(def.id)}"${open}>` +
						`<summary class="jhtml-summary">${inline(title)}</summary>` +
						'<div class="jhtml-body">';
				}

				if (mode === 'grid') {
					return `${wrapperOpen(meta)}${headHtml(meta)}<div class="jhtml-grid-inner">`;
				}

				const head = headHtml(meta);
				const noTitle = head ? '' : 'jhtml-no-head';
				return `${wrapperOpen(meta, noTitle)}${head}<div class="jhtml-body">`;
			};

			const containerClose = (meta: BlockMeta): string => {
				const def = meta.def;
				const mode = def ? def.mode : 'plain';

				if (mode === 'quote') {
					const cite = meta.title ? `<footer class="jhtml-cite">${inline(meta.title)}</footer>` : '';
					return `</div>${cite}</blockquote>`;
				}

				if (mode === 'details') return '</div></details>';

				return '</div></div>';
			};

			// --- line based renderers ---------------------------------------

			const contentLines = (content: string): string[] =>
				content.split('\n').filter(line => line.trim() !== '');

			const listHtml = (meta: BlockMeta, content: string): string => {
				const def = meta.def;
				const style = def.listStyle || 'dot';
				const tag = def.ordered ? 'ol' : 'ul';
				let counter = 0;

				const items = contentLines(content).map(line => {
					const indent = (/^[ \t]*/.exec(line))[0].replace(/\t/g, '  ').length;
					const level = Math.min(3, Math.floor(indent / 2));

					// A leading bullet is optional - people type it out of habit.
					let text = line.trim().replace(/^[-*+]\s+/, '');

					let marker = '';
					if (style === 'checkbox') {
						const checkbox = /^\[([ xX])\]\s*/.exec(text);
						const checked = checkbox && checkbox[1].toLowerCase() === 'x';
						if (checkbox) text = text.slice(checkbox[0].length);
						marker = `<input class="jhtml-checkbox" type="checkbox" disabled${checked ? ' checked' : ''}>`;
						return `<li class="jhtml-item jhtml-lvl-${level}${checked ? ' jhtml-checked' : ''}">` +
							`<span class="jhtml-marker">${marker}</span>` +
							`<span class="jhtml-text">${inline(text)}</span></li>`;
					}

					if (style === 'number') {
						counter += 1;
						marker = String(counter);
					} else if (style === 'check') {
						marker = '&check;';
					} else if (style === 'arrow') {
						marker = '&rarr;';
					}

					return `<li class="jhtml-item jhtml-lvl-${level}">` +
						`<span class="jhtml-marker">${marker}</span>` +
						`<span class="jhtml-text">${inline(text)}</span></li>`;
				}).join('');

				return `${wrapperOpen(meta)}${headHtml(meta)}` +
					`<${tag} class="jhtml-items">${items}</${tag}>` +
					'</div>';
			};

			const stepsHtml = (meta: BlockMeta, content: string): string => {
				let counter = 0;
				const items = contentLines(content).map(line => {
					counter += 1;
					const fields = splitFields(line);
					const title = fields[0] || '';
					const text = fields.slice(1).join(' :: ');
					const textHtml = text ? `<div class="jhtml-step-text">${inline(text)}</div>` : '';

					return '<li class="jhtml-step">' +
						`<span class="jhtml-step-num">${counter}</span>` +
						'<div class="jhtml-step-body">' +
						`<div class="jhtml-step-title">${inline(title)}</div>${textHtml}` +
						'</div></li>';
				}).join('');

				return `${wrapperOpen(meta)}${headHtml(meta)}<ol class="jhtml-steps-items">${items}</ol></div>`;
			};

			const timelineHtml = (meta: BlockMeta, content: string): string => {
				const items = contentLines(content).map(line => {
					const fields = splitFields(line);
					let when = '';
					let title = '';
					let text = '';

					if (fields.length === 1) {
						title = fields[0];
					} else if (fields.length === 2) {
						when = fields[0];
						title = fields[1];
					} else {
						when = fields[0];
						title = fields[1];
						text = fields.slice(2).join(' :: ');
					}

					return '<li class="jhtml-tl-item"><span class="jhtml-tl-dot"></span>' +
						'<div class="jhtml-tl-body">' +
						(when ? `<span class="jhtml-tl-when">${inline(when)}</span>` : '') +
						`<div class="jhtml-tl-title">${inline(title)}</div>` +
						(text ? `<div class="jhtml-tl-text">${inline(text)}</div>` : '') +
						'</div></li>';
				}).join('');

				return `${wrapperOpen(meta)}${headHtml(meta)}<ul class="jhtml-tl-items">${items}</ul></div>`;
			};

			const statsHtml = (meta: BlockMeta, content: string): string => {
				const items = contentLines(content).map(line => {
					const fields = splitFields(line);
					const value = fields[0] || '';
					const label = fields.slice(1).join(' :: ');

					return '<div class="jhtml-stat">' +
						`<div class="jhtml-stat-value">${inline(value)}</div>` +
						(label ? `<div class="jhtml-stat-label">${inline(label)}</div>` : '') +
						'</div>';
				}).join('');

				return `${wrapperOpen(meta)}${headHtml(meta)}<div class="jhtml-stats-items">${items}</div></div>`;
			};

			const badgesHtml = (meta: BlockMeta, content: string): string => {
				const items = content
					.split(/[\n,]/)
					.map(item => item.trim())
					.filter(item => item !== '')
					.map(item => `<span class="jhtml-badge">${inline(item)}</span>`)
					.join('');

				return `${wrapperOpen(meta)}${headHtml(meta)}<div class="jhtml-badge-row">${items}</div></div>`;
			};

			const keyValueHtml = (meta: BlockMeta, content: string): string => {
				const items = contentLines(content).map(line => {
					const fields = splitFields(line);
					const key = fields[0] || '';
					const value = fields.slice(1).join(' :: ');

					return '<div class="jhtml-kv">' +
						`<div class="jhtml-kv-key">${inline(key)}</div>` +
						`<div class="jhtml-kv-value">${inline(value)}</div>` +
						'</div>';
				}).join('');

				return `${wrapperOpen(meta)}${headHtml(meta)}<div class="jhtml-kv-items">${items}</div></div>`;
			};

			const rawHtml = (meta: BlockMeta, content: string): string => {
				switch (meta.def.mode) {
				case 'list': return listHtml(meta, content);
				case 'steps': return stepsHtml(meta, content);
				case 'timeline': return timelineHtml(meta, content);
				case 'stats': return statsHtml(meta, content);
				case 'badges': return badgesHtml(meta, content);
				case 'keyvalue': return keyValueHtml(meta, content);
				default: return `${wrapperOpen(meta)}${headHtml(meta)}<div class="jhtml-body">${inline(content)}</div></div>`;
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
				containerOpen(tokens[idx].meta);
			markdownIt.renderer.rules.jhtml_close = (tokens: any[], idx: number) =>
				containerClose(tokens[idx].meta);
			markdownIt.renderer.rules.jhtml_cell_open = () => '<div class="jhtml-cell">';
			markdownIt.renderer.rules.jhtml_cell_close = () => '</div>';
			markdownIt.renderer.rules.jhtml_raw = (tokens: any[], idx: number) =>
				rawHtml(tokens[idx].meta, tokens[idx].content);
		},

		assets: () => [{ name: './style.css' }],
	};
};
