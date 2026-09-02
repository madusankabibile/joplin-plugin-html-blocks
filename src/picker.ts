// The "Insert an HTML block" dialog.
//
// Every entry is a real preview: the block is rendered here, by the same code
// the note viewer uses, and shown at thumbnail size. The viewer stylesheet is
// inlined into the HTML, so the colours and themes are the ones you will
// actually get in the note.

import { blocks, blocksInCategory, categories, resolveBlock } from './blocks';
import { BlockDefinition } from './blocks/types';
import { escapeHtml } from './blocks/render';
import { previewHtml } from './blocks/preview';
import { viewerCss } from './blocks/viewerCss';

/** Pseudo category id for the "recently used" group. */
export const RECENT_CATEGORY = '__recent';

/** How many recently used blocks the dialog shows. */
export const RECENT_LIMIT = 12;

export interface PickerOptions {
	/** Draw thumbnails, rather than a plain list of names. */
	previews: boolean;
	/** Block ids, most recently inserted first. */
	recent?: string[];
}

const searchTerms = (block: BlockDefinition): string => [
	block.id,
	block.label,
	block.category,
	block.mode,
	block.theme || 'soft',
	...(block.aliases || []),
].join(' ').toLowerCase();

const tileHtml = (
	block: BlockDefinition,
	options: PickerOptions,
	recent = false,
	selected = false,
): string => {
	const preview = options.previews
		? `<div class="jhtml-thumb"><div class="jhtml-thumb-inner">${previewHtml(block)}</div></div>`
		: '';

	const aliases = (block.aliases || []).length
		? `<span class="tile-alias">${escapeHtml((block.aliases || []).join(', '))}</span>`
		: '';

	// The recently used copies are duplicates of tiles that also live in their
	// own category, so they are marked and hidden while a filter is active -
	// otherwise every search would show them twice.
	return `<button type="button" class="tile${selected ? ' selected' : ''}" data-id="${escapeHtml(block.id)}"
			data-category="${escapeHtml(recent ? RECENT_CATEGORY : block.category)}"
			${recent ? 'data-recent="1"' : ''}
			data-search="${escapeHtml(searchTerms(block))}"
			title="${escapeHtml(`!!! ${block.id}`)}">
		${preview}
		<span class="tile-foot">
			<span class="tile-swatch" style="background:${escapeHtml(block.color)}"></span>
			<span class="tile-names">
				<span class="tile-label">${escapeHtml(block.label)}</span>
				<code class="tile-id">${escapeHtml(block.id)}</code>
			</span>
			${aliases}
		</span>
	</button>`;
};

// Groups other than the one the dialog opens on start out hidden, so the first
// paint is a single category rather than 383 previews - and so the dialog is
// already right if the script has not run yet.
const groupHtml = (category: string, tiles: string, open: boolean, extraClass = ''): string =>
	`<section class="group${open ? '' : ' hidden'}${extraClass ? ` ${extraClass}` : ''}"
			data-category="${escapeHtml(category)}">
		<h3 class="group-title">${escapeHtml(category)}</h3>
		<div class="tiles">${tiles}</div>
	</section>`;

/** Resolves stored ids into blocks, dropping any that no longer exist. */
const recentBlocks = (ids: string[] | undefined): BlockDefinition[] => {
	const out: BlockDefinition[] = [];
	for (const id of ids || []) {
		const block = resolveBlock(id);
		if (block && !out.includes(block)) out.push(block);
		if (out.length >= RECENT_LIMIT) break;
	}
	return out;
};

export const pickerHtml = (options: PickerOptions): string => {
	const list = categories();
	const recent = recentBlocks(options.recent);

	// The dialog opens on whatever you reached for last; on a fresh profile
	// there is nothing to go on, so it opens on the first category.
	const startCategory = recent.length ? RECENT_CATEGORY : (list[0] || '*');
	const selected = recent.length ? recent[0].id : blocks[0].id;

	const catButton = (category: string, label: string, count: number): string =>
		`<button type="button" class="cat${category === startCategory ? ' active' : ''}"
				data-category="${escapeHtml(category)}">` +
		`${escapeHtml(label)}<span class="cat-count">${count}</span></button>`;

	const sidebar = [
		catButton('*', 'All blocks', blocks.length),
		...(recent.length ? [catButton(RECENT_CATEGORY, 'Recently used', recent.length)] : []),
		...list.map(category => catButton(category, category, blocksInCategory(category).length)),
	].join('');

	const sections = [
		...(recent.length
			? [groupHtml(
				RECENT_CATEGORY,
				recent.map((block, index) => tileHtml(block, options, true, index === 0)).join(''),
				startCategory === RECENT_CATEGORY,
				'group-recent',
			)]
			: []),
		...list.map(category => groupHtml(
			category,
			blocksInCategory(category)
				.map((block, index) => tileHtml(
					block,
					options,
					false,
					category === startCategory && index === 0 && !recent.length,
				))
				.join(''),
			category === startCategory,
		)),
	].join('');

	// Joplin replaces the dialog's content on every open and only loads linked
	// scripts once, so the stylesheet the previews need travels with the HTML.
	const style = options.previews ? `<style>${viewerCss}</style>` : '';

	return `
		${style}
		<form name="blockForm" id="jhtml-picker"
				class="${options.previews ? 'with-previews' : 'compact'} single-group"
				data-start="${escapeHtml(startCategory)}">
			<header class="picker-head">
				<h2>Insert an HTML block</h2>
				<input type="text" id="jhtml-search" placeholder="Filter by name, id, colour or theme..." autocomplete="off">
			</header>

			<div class="picker-body">
				<nav id="jhtml-cats">${sidebar}</nav>
				<div id="jhtml-list">
					${sections}
					<p id="jhtml-empty" class="empty hidden">Nothing matches that filter.</p>
				</div>
			</div>

			<footer class="picker-foot">
				<input type="hidden" name="blockId" id="jhtml-selected" value="${escapeHtml(selected)}">
				<span id="jhtml-current" class="current">!!! ${escapeHtml(selected)}</span>
				<span class="hint">Pick a block, then press Insert. Selected text becomes the block body.</span>
			</footer>
		</form>`;
};

/** Puts `id` at the front of the recently used list and trims it to size. */
export const withRecent = (ids: string[], id: string): string[] => {
	const out = [id, ...ids.filter(other => other !== id)];
	return out.slice(0, RECENT_LIMIT * 2);
};
