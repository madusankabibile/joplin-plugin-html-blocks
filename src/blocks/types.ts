// Shared block-registry types. Kept in its own file so the markdown-it script,
// the CodeMirror script and the main plugin script can all import them without
// dragging in each other's dependencies.

export type BlockMode =
	| 'card'
	| 'callout'
	| 'list'
	| 'plain'
	| 'quote'
	| 'details'
	| 'grid'
	| 'steps'
	| 'timeline'
	| 'stats'
	| 'badges'
	| 'keyvalue'
	| 'progress'
	| 'rating'
	| 'table'
	| 'compare'
	| 'faq'
	| 'feature'
	| 'chat'
	| 'chart'
	| 'flow'
	| 'tree'
	| 'buttons'
	| 'art'
	| 'bigtext';

/** The shape a `chart` block is drawn as. Everything is CSS - no SVG, no script. */
export type ChartKind =
	| 'column'
	| 'bar'
	| 'pie'
	| 'donut'
	| 'line'
	| 'area'
	| 'gauge'
	| 'stack';

/**
 * The chrome around a block: fill, border, shadow. Themes are orthogonal to
 * modes - any theme can be put on any mode, and it only ever changes CSS.
 */
export type BlockTheme =
	| 'soft'
	| 'solid'
	| 'outline'
	| 'gradient'
	| 'elevated'
	| 'glass'
	| 'neon'
	| 'minimal'
	| 'ribbon'
	| 'dashed'
	| 'underline';

export type ListStyle =
	| 'dot'
	| 'number'
	| 'check'
	| 'arrow'
	| 'boxed'
	| 'separated'
	| 'checkbox'
	| 'checkbox-boxed'
	| 'square'
	| 'dash'
	| 'star'
	| 'alpha'
	| 'roman'
	| 'chevron'
	| 'plus'
	| 'numbox'
	| 'cards'
	| 'pill'
	| 'rank'
	| 'icon'
	| 'striped'
	| 'inline';

export interface BlockDefinition {
	/** The identifier typed after the opening fence, e.g. `!!! card_light_blue`. */
	id: string;
	/** Human readable name, used in menus and in the picker dialog. */
	label: string;
	/** Menu / dialog grouping. */
	category: string;
	/** Decides which renderer is used. */
	mode: BlockMode;
	/** Base colour. Every other colour in the block is mixed from this one so
	 * that the block adapts to the current Joplin theme. */
	color: string;
	/** Chrome style. Defaults to `soft`. */
	theme?: BlockTheme;
	/** Alternative ids accepted by the parser. */
	aliases?: string[];
	/** Emoji shown in the header (callouts). */
	icon?: string;
	/** Header text used when the author does not write one (callouts). */
	defaultTitle?: string;
	/** Extra class modifier, on top of the theme. */
	variant?: string;
	/** `chart` only: which chart is drawn. */
	chart?: ChartKind;
	/** Adds a `jhtml-anim-<name>` class. Every animation is disabled again under
	 * `prefers-reduced-motion`. */
	animation?: string;
	listStyle?: ListStyle;
	ordered?: boolean;
	columns?: number;
	/** `grid` only: drop the card chrome around each cell. */
	bare?: boolean;
	/** `details` only: expanded on load. */
	open?: boolean;
	/** Placeholder text used when inserting a snippet, and as the preview body. */
	titleHint?: string;
	bodyHint?: string;
}

export interface Snippet {
	text: string;
	/** Offsets, relative to `text`, of the placeholder worth selecting first. */
	selectionStart: number;
	selectionEnd: number;
}
