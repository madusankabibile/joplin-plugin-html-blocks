// All of the HTML generation, in one place.
//
// The markdown-it content script uses this to render the note viewer, and the
// picker dialog uses it to draw the little previews next to each block name.
// Both therefore produce byte-identical markup, so a preview can never drift
// away from what the viewer actually draws.
//
// Nothing here knows about markdown-it: the caller passes in whatever should
// render inline markup, which is `markdownIt.renderInline` in the viewer and a
// plain escaper in the preview.

import { BlockDefinition } from './types';
import { splitFields } from './syntax';

export interface BlockMeta {
	def: BlockDefinition | null;
	rawType: string;
	title: string;
}

/** Renders inline markdown (or just escapes, in the preview). */
export type InlineRenderer = (text: string)=> string;

export const escapeHtml = (text: string): string => String(text)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

// Modes whose contents are plain markdown and are therefore handed back to the
// normal block tokenizer. Everything else is consumed line by line instead.
const MARKDOWN_MODES = ['card', 'callout', 'plain', 'quote', 'details', 'grid'];

export const isMarkdownMode = (def: BlockDefinition | null): boolean => {
	if (!def) return true; // Unknown types fall back to a plain markdown box.
	return MARKDOWN_MODES.includes(def.mode);
};

export const classesFor = (meta: BlockMeta): string => {
	const def = meta.def;
	const out = ['jhtml'];

	if (!def) {
		out.push('jhtml-plain', 'jhtml-unknown', 'jhtml-t-soft');
	} else {
		out.push(`jhtml-${def.mode}`);
		out.push(`jhtml-b-${def.id}`);
		out.push(`jhtml-t-${def.theme || 'soft'}`);
		if (def.variant) out.push(`jhtml-v-${def.variant}`);
		if (def.listStyle) out.push(`jhtml-ls-${def.listStyle}`);
		if (def.columns) out.push(`jhtml-cols-${def.columns}`);
		if (def.bare) out.push('jhtml-bare');
	}

	return out.join(' ');
};

// --------------------------------------------------------------------------
// Shared chrome
// --------------------------------------------------------------------------

export const headHtml = (meta: BlockMeta, inline: InlineRenderer): string => {
	const def = meta.def;
	const title = meta.title || (def && def.defaultTitle) || '';
	const icon = def && def.icon ? `<span class="jhtml-icon">${def.icon}</span>` : '';
	const typeBadge = !def ? `<span class="jhtml-type-badge">${escapeHtml(meta.rawType)}</span>` : '';

	if (!title && !icon && !typeBadge) return '';

	return `<div class="jhtml-head">${icon}<span class="jhtml-title">${inline(title)}</span>${typeBadge}</div>`;
};

const wrapperOpen = (meta: BlockMeta, extraClass = ''): string => {
	const classes = `${classesFor(meta)}${extraClass ? ` ${extraClass}` : ''}`;
	const type = escapeHtml(meta.def ? meta.def.id : meta.rawType);
	return `<div class="${classes}" data-jhtml-type="${type}">`;
};

export const containerOpen = (meta: BlockMeta, inline: InlineRenderer): string => {
	const def = meta.def;
	const mode = def ? def.mode : 'plain';

	if (mode === 'quote') {
		return `<blockquote class="${classesFor(meta)}" data-jhtml-type="${escapeHtml(def.id)}">` +
			'<div class="jhtml-body">';
	}

	if (mode === 'details') {
		const title = meta.title || def.titleHint || def.label;
		const open = def.open ? ' open' : '';
		return `<details class="${classesFor(meta)}" data-jhtml-type="${escapeHtml(def.id)}"${open}>` +
			`<summary class="jhtml-summary">${inline(title)}</summary>` +
			'<div class="jhtml-body">';
	}

	if (mode === 'grid') {
		return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-grid-inner">`;
	}

	const head = headHtml(meta, inline);
	const noTitle = head ? '' : 'jhtml-no-head';
	return `${wrapperOpen(meta, noTitle)}${head}<div class="jhtml-body">`;
};

export const containerClose = (meta: BlockMeta, inline: InlineRenderer): string => {
	const def = meta.def;
	const mode = def ? def.mode : 'plain';

	if (mode === 'quote') {
		const cite = meta.title ? `<footer class="jhtml-cite">${inline(meta.title)}</footer>` : '';
		return `</div>${cite}</blockquote>`;
	}

	if (mode === 'details') return '</div></details>';

	return '</div></div>';
};

// --------------------------------------------------------------------------
// Line based renderers
// --------------------------------------------------------------------------

const contentLines = (content: string): string[] =>
	content.split('\n').filter(line => line.trim() !== '');

/** Roman numerals, for `list_roman`. Lists never get long enough to need more. */
const ROMAN: [number, string][] = [
	[100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
	[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
];

const toRoman = (value: number): string => {
	let left = value;
	let out = '';
	for (const [amount, numeral] of ROMAN) {
		while (left >= amount) {
			out += numeral;
			left -= amount;
		}
	}
	return out.toUpperCase();
};

const toAlpha = (value: number): string => {
	let left = value;
	let out = '';
	while (left > 0) {
		const remainder = (left - 1) % 26;
		out = String.fromCharCode(65 + remainder) + out;
		left = Math.floor((left - 1) / 26);
	}
	return out;
};

const MEDALS = ['🥇', '🥈', '🥉'];

const listHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const def = meta.def;
	const style = def.listStyle || 'dot';
	const tag = def.ordered ? 'ol' : 'ul';
	const checkboxStyle = style === 'checkbox' || style === 'checkbox-boxed';
	let counter = 0;

	const items = contentLines(content).map(line => {
		const indent = (/^[ \t]*/.exec(line))[0].replace(/\t/g, '  ').length;
		const level = Math.min(3, Math.floor(indent / 2));

		// A leading bullet is optional - people type it out of habit.
		let text = line.trim().replace(/^[-*+]\s+/, '');

		let marker = '';
		if (checkboxStyle) {
			const checkbox = /^\[([ xX])\]\s*/.exec(text);
			const checked = checkbox && checkbox[1].toLowerCase() === 'x';
			if (checkbox) text = text.slice(checkbox[0].length);
			marker = `<input class="jhtml-checkbox" type="checkbox" disabled${checked ? ' checked' : ''}>`;
			return `<li class="jhtml-item jhtml-lvl-${level}${checked ? ' jhtml-checked' : ''}">` +
				`<span class="jhtml-marker">${marker}</span>` +
				`<span class="jhtml-text">${inline(text)}</span></li>`;
		}

		counter += 1;

		switch (style) {
		case 'number':
		case 'numbox':
			marker = String(counter);
			break;
		case 'alpha':
			marker = toAlpha(counter);
			break;
		case 'roman':
			marker = toRoman(counter);
			break;
		case 'rank':
			marker = MEDALS[counter - 1] || String(counter);
			break;
		case 'check':
			marker = '&check;';
			break;
		case 'arrow':
			marker = '&rarr;';
			break;
		case 'chevron':
			marker = '&rsaquo;';
			break;
		case 'dash':
			marker = '&ndash;';
			break;
		case 'plus':
			marker = '+';
			break;
		case 'star':
			marker = '&starf;';
			break;
		case 'icon':
			marker = '&bull;';
			break;
		default:
			marker = '';
		}

		return `<li class="jhtml-item jhtml-lvl-${level}">` +
			`<span class="jhtml-marker">${marker}</span>` +
			`<span class="jhtml-text">${inline(text)}</span></li>`;
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}` +
		`<${tag} class="jhtml-items">${items}</${tag}>` +
		'</div>';
};

const stepsHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
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

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<ol class="jhtml-steps-items">${items}</ol></div>`;
};

const timelineHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
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

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<ul class="jhtml-tl-items">${items}</ul></div>`;
};

const statsHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const items = contentLines(content).map(line => {
		const fields = splitFields(line);
		const value = fields[0] || '';
		const label = fields.slice(1).join(' :: ');

		return '<div class="jhtml-stat">' +
			`<div class="jhtml-stat-value">${inline(value)}</div>` +
			(label ? `<div class="jhtml-stat-label">${inline(label)}</div>` : '') +
			'</div>';
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-stats-items">${items}</div></div>`;
};

/**
 * Reads `70`, `70%` or `7/10` as a percentage. Anything unreadable counts as
 * zero rather than breaking the layout.
 */
const asPercent = (raw: string): { percent: number; text: string } => {
	const text = raw.trim();
	const fraction = /^([\d.]+)\s*\/\s*([\d.]+)$/.exec(text);

	if (fraction) {
		const top = parseFloat(fraction[1]);
		const bottom = parseFloat(fraction[2]);
		const percent = bottom > 0 ? (top / bottom) * 100 : 0;
		return { percent: Math.max(0, Math.min(100, percent)), text };
	}

	const value = parseFloat(text.replace(/%/g, ''));
	if (isNaN(value)) return { percent: 0, text };

	return { percent: Math.max(0, Math.min(100, value)), text: /%/.test(text) ? text : `${value}%` };
};

const progressHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const rows = contentLines(content).map(line => {
		const fields = splitFields(line);
		const label = fields[0] || '';
		const { percent, text } = asPercent(fields[1] || '0');
		const note = fields.slice(2).join(' :: ');

		return '<div class="jhtml-bar-row">' +
			'<div class="jhtml-bar-head">' +
			`<span class="jhtml-bar-label">${inline(label)}</span>` +
			`<span class="jhtml-bar-value">${escapeHtml(text)}</span>` +
			'</div>' +
			'<div class="jhtml-bar-track">' +
			`<div class="jhtml-bar-fill" style="width:${percent.toFixed(1)}%"></div>` +
			'</div>' +
			(note ? `<div class="jhtml-bar-note">${inline(note)}</div>` : '') +
			'</div>';
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-bars">${rows}</div></div>`;
};

const ratingHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const rows = contentLines(content).map(line => {
		const fields = splitFields(line);
		const label = fields[0] || '';
		const raw = fields[1] || '0';
		const { percent, text } = asPercent(raw);
		const note = fields.slice(2).join(' :: ');
		// A bare number is out of five; `8/10` is already a proportion.
		const outOfFive = !/[/%]/.test(raw);
		const scaled = outOfFive
			? Math.max(0, Math.min(100, (parseFloat(raw) || 0) * 20))
			: percent;
		// `4` is a score, not 4% - only a written proportion is shown as one.
		const value = outOfFive ? raw.trim() : text;

		return '<div class="jhtml-rate-row">' +
			`<span class="jhtml-rate-label">${inline(label)}</span>` +
			'<span class="jhtml-stars">' +
			'<span class="jhtml-stars-off">★★★★★</span>' +
			`<span class="jhtml-stars-on" style="width:${scaled.toFixed(1)}%">★★★★★</span>` +
			'</span>' +
			`<span class="jhtml-rate-value">${escapeHtml(note || value)}</span>` +
			'</div>';
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-rates">${rows}</div></div>`;
};

const badgesHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const items = content
		.split(/[\n,]/)
		.map(item => item.trim())
		.filter(item => item !== '')
		.map(item => `<span class="jhtml-badge">${inline(item)}</span>`)
		.join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-badge-row">${items}</div></div>`;
};

const keyValueHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const items = contentLines(content).map(line => {
		const fields = splitFields(line);
		const key = fields[0] || '';
		const value = fields.slice(1).join(' :: ');

		return '<div class="jhtml-kv">' +
			`<div class="jhtml-kv-key">${inline(key)}</div>` +
			`<div class="jhtml-kv-value">${inline(value)}</div>` +
			'</div>';
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-kv-items">${items}</div></div>`;
};

const tableHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const lines = contentLines(content);
	if (!lines.length) return `${wrapperOpen(meta)}${headHtml(meta, inline)}</div>`;

	const cells = (line: string, tag: string): string => splitFields(line)
		.map(field => `<${tag}>${inline(field)}</${tag}>`)
		.join('');

	const head = `<thead><tr>${cells(lines[0], 'th')}</tr></thead>`;
	const body = lines.slice(1).map(line => `<tr>${cells(line, 'td')}</tr>`).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}` +
		`<div class="jhtml-table-wrap"><table class="jhtml-table">${head}<tbody>${body}</tbody></table></div>` +
		'</div>';
};

const compareHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const lines = contentLines(content);
	let leftTitle = 'Pros';
	let rightTitle = 'Cons';

	// An optional first line of `:: Left :: Right` renames the two columns.
	if (lines.length && /^\s*::/.test(lines[0])) {
		const fields = splitFields(lines.shift().replace(/^\s*::/, ''));
		if (fields[0]) leftTitle = fields[0];
		if (fields[1]) rightTitle = fields[1];
	}

	const left: string[] = [];
	const right: string[] = [];

	for (const line of lines) {
		const text = line.trim();
		const isCon = /^[-−–x✗✘]\s+/i.test(text);
		const stripped = text.replace(/^[+✓✔\-−–x✗✘]\s+/i, '');
		const item = `<li class="jhtml-cmp-item">${inline(stripped)}</li>`;
		(isCon ? right : left).push(item);
	}

	const column = (side: string, title: string, items: string[]): string =>
		`<div class="jhtml-cmp-col jhtml-cmp-${side}">` +
		`<div class="jhtml-cmp-title">${escapeHtml(title)}</div>` +
		`<ul class="jhtml-cmp-items">${items.join('')}</ul></div>`;

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}` +
		'<div class="jhtml-cmp-cols">' +
		column('pro', leftTitle, left) +
		column('con', rightTitle, right) +
		'</div></div>';
};

const faqHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const items = contentLines(content).map(line => {
		const fields = splitFields(line);
		const question = fields[0] || '';
		const answer = fields.slice(1).join(' :: ');

		return '<details class="jhtml-faq-item">' +
			`<summary class="jhtml-faq-q">${inline(question)}</summary>` +
			`<div class="jhtml-faq-a">${inline(answer)}</div>` +
			'</details>';
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-faq-items">${items}</div></div>`;
};

/**
 * Splits a leading emoji off a feature title: the first word counts as an icon
 * when it is short and holds no ASCII letters or digits.
 */
const splitIcon = (text: string): { icon: string; rest: string } => {
	const match = /^(\S{1,6})\s+(.+)$/.exec(text.trim());
	if (!match || /[A-Za-z0-9]/.test(match[1])) return { icon: '', rest: text.trim() };
	return { icon: match[1], rest: match[2] };
};

const featureHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const items = contentLines(content).map(line => {
		const fields = splitFields(line);
		const { icon, rest } = splitIcon(fields[0] || '');
		const text = fields.slice(1).join(' :: ');

		return '<div class="jhtml-feature">' +
			(icon ? `<div class="jhtml-feature-icon">${escapeHtml(icon)}</div>` : '') +
			`<div class="jhtml-feature-title">${inline(rest)}</div>` +
			(text ? `<div class="jhtml-feature-text">${inline(text)}</div>` : '') +
			'</div>';
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-feature-grid">${items}</div></div>`;
};

const chatHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	const speakers: string[] = [];

	const items = contentLines(content).map(line => {
		let text = line.trim();
		// A leading `>` forces the message to the right hand side.
		let forcedSide = '';
		if (text.startsWith('>')) {
			forcedSide = 'right';
			text = text.slice(1).trim();
		}

		const fields = splitFields(text);
		const who = fields.length > 1 ? fields[0] : '';
		const said = fields.length > 1 ? fields.slice(1).join(' :: ') : fields[0];

		if (who && !speakers.includes(who)) speakers.push(who);
		const side = forcedSide || (speakers.indexOf(who) > 0 ? 'right' : 'left');
		const initial = who ? who.trim().charAt(0).toUpperCase() : '?';

		return `<div class="jhtml-chat-row jhtml-chat-${side}">` +
			`<span class="jhtml-chat-avatar">${escapeHtml(initial)}</span>` +
			'<div class="jhtml-chat-bubble">' +
			(who ? `<div class="jhtml-chat-who">${inline(who)}</div>` : '') +
			`<div class="jhtml-chat-text">${inline(said)}</div>` +
			'</div></div>';
	}).join('');

	return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-chat">${items}</div></div>`;
};

/** Renders the line-based modes - everything `isMarkdownMode` says no to. */
export const rawHtml = (meta: BlockMeta, content: string, inline: InlineRenderer): string => {
	switch (meta.def.mode) {
	case 'list': return listHtml(meta, content, inline);
	case 'steps': return stepsHtml(meta, content, inline);
	case 'timeline': return timelineHtml(meta, content, inline);
	case 'stats': return statsHtml(meta, content, inline);
	case 'progress': return progressHtml(meta, content, inline);
	case 'rating': return ratingHtml(meta, content, inline);
	case 'badges': return badgesHtml(meta, content, inline);
	case 'keyvalue': return keyValueHtml(meta, content, inline);
	case 'table': return tableHtml(meta, content, inline);
	case 'compare': return compareHtml(meta, content, inline);
	case 'faq': return faqHtml(meta, content, inline);
	case 'feature': return featureHtml(meta, content, inline);
	case 'chat': return chatHtml(meta, content, inline);
	default:
		return `${wrapperOpen(meta)}${headHtml(meta, inline)}<div class="jhtml-body">${inline(content)}</div></div>`;
	}
};
