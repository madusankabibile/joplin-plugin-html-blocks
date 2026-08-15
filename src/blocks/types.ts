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
	| 'keyvalue';

export type ListStyle =
	| 'dot'
	| 'number'
	| 'check'
	| 'arrow'
	| 'boxed'
	| 'separated'
	| 'checkbox';

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
	/** Alternative ids accepted by the parser. */
	aliases?: string[];
	/** Emoji shown in the header (callouts). */
	icon?: string;
	/** Header text used when the author does not write one (callouts). */
	defaultTitle?: string;
	/** Extra class modifier for `plain` blocks. */
	variant?: string;
	listStyle?: ListStyle;
	ordered?: boolean;
	columns?: number;
	/** `grid` only: drop the card chrome around each cell. */
	bare?: boolean;
	/** `details` only: expanded on load. */
	open?: boolean;
	/** Placeholder text used when inserting a snippet. */
	titleHint?: string;
	bodyHint?: string;
}

export interface Snippet {
	text: string;
	/** Offsets, relative to `text`, of the placeholder worth selecting first. */
	selectionStart: number;
	selectionEnd: number;
}
