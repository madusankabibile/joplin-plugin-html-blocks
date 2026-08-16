// Renders a small, self contained sample of a block, used for the thumbnails
// in the picker dialog.
//
// It goes through the same renderer as the note viewer, so a preview is the
// real thing rather than a drawing of it. The only difference is the inline
// renderer: the dialog has no markdown-it, so a deliberately small subset
// (`**bold**`, `*italic*`, `` `code` ``) is handled here instead.

import { BlockDefinition } from './types';
import {
	BlockMeta,
	containerClose,
	containerOpen,
	escapeHtml,
	isMarkdownMode,
	rawHtml,
} from './render';
import { isCellSeparator } from './syntax';

const inlineMarkdown = (text: string): string => escapeHtml(text)
	.replace(/`([^`]+)`/g, '<code>$1</code>')
	.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
	.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

/** Paragraphs and headings - enough for the sample bodies in the registry. */
const blockMarkdown = (text: string): string => text
	.split(/\n{2,}/)
	.map(part => part.trim())
	.filter(part => part !== '')
	.map(part => {
		const heading = /^(#{1,6})\s+(.*)$/.exec(part);
		if (heading) return `<h4 class="jhtml-h">${inlineMarkdown(heading[2])}</h4>`;

		const lines = part.split('\n').map(line => inlineMarkdown(line.trim()));
		return `<p>${lines.join('<br>')}</p>`;
	})
	.join('');

export const previewHtml = (block: BlockDefinition): string => {
	const meta: BlockMeta = {
		def: block,
		rawType: block.id,
		title: block.titleHint || '',
	};

	const body = block.bodyHint || '';

	if (!isMarkdownMode(block)) return rawHtml(meta, body, inlineMarkdown);

	if (block.mode === 'grid') {
		const cells: string[] = [];
		let current: string[] = [];

		for (const line of body.split('\n')) {
			if (isCellSeparator(line)) {
				cells.push(current.join('\n'));
				current = [];
			} else {
				current.push(line);
			}
		}
		cells.push(current.join('\n'));

		const inner = cells
			.map(cell => `<div class="jhtml-cell">${blockMarkdown(cell)}</div>`)
			.join('');

		return containerOpen(meta, inlineMarkdown) + inner + containerClose(meta, inlineMarkdown);
	}

	return containerOpen(meta, inlineMarkdown) + blockMarkdown(body) + containerClose(meta, inlineMarkdown);
};
