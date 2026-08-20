// The block registry, written as families rather than as one long list.
//
// `tools/generate-blocks.js` expands this file into `src/blocks/blocks.json`,
// which is what the plugin actually reads. Editing a family here adds a whole
// row of blocks at once - a colour, a theme or a list style is only ever
// spelled out in one place.
//
// Every id that has ever shipped must keep working, so the legacy ids are
// listed explicitly instead of being generated from a pattern.

'use strict';

// --------------------------------------------------------------------------
// Palette
// --------------------------------------------------------------------------

const COLORS = {
	sky: { hex: '#38bdf8', label: 'Sky' },
	blue: { hex: '#3b82f6', label: 'Blue' },
	indigo: { hex: '#6366f1', label: 'Indigo' },
	violet: { hex: '#8b5cf6', label: 'Violet' },
	purple: { hex: '#a855f7', label: 'Purple' },
	fuchsia: { hex: '#d946ef', label: 'Fuchsia' },
	pink: { hex: '#ec4899', label: 'Pink' },
	rose: { hex: '#f43f5e', label: 'Rose' },
	red: { hex: '#ef4444', label: 'Red' },
	orange: { hex: '#f97316', label: 'Orange' },
	amber: { hex: '#f59e0b', label: 'Amber' },
	yellow: { hex: '#eab308', label: 'Yellow' },
	lime: { hex: '#84cc16', label: 'Lime' },
	green: { hex: '#22c55e', label: 'Green' },
	emerald: { hex: '#10b981', label: 'Emerald' },
	teal: { hex: '#14b8a6', label: 'Teal' },
	cyan: { hex: '#06b6d4', label: 'Cyan' },
	slate: { hex: '#64748b', label: 'Slate' },
	gray: { hex: '#6b7280', label: 'Gray' },
	dark: { hex: '#334155', label: 'Dark' },
	brown: { hex: '#a16207', label: 'Brown' },
};

const hex = key => {
	if (!COLORS[key]) throw new Error(`Unknown colour: ${key}`);
	return COLORS[key].hex;
};

const colorLabel = key => COLORS[key].label;

/** Colours offered for the themes that suit the whole palette. */
const WIDE = [
	'blue', 'indigo', 'violet', 'purple', 'pink', 'red',
	'orange', 'amber', 'green', 'teal', 'cyan', 'slate',
];

/** A tighter set for the more decorative themes. */
const NARROW = ['blue', 'violet', 'pink', 'red', 'orange', 'green', 'teal', 'slate'];

// --------------------------------------------------------------------------
// Sample content, per mode. Doubles as the snippet placeholder and as the
// content of the preview shown in the picker, so what you see is what you get.
// --------------------------------------------------------------------------

const HINTS = {
	card: { title: 'Card title', body: 'Card contents' },
	plain: { title: 'Box title', body: 'Box contents' },
	list: { title: 'List title', body: 'First item\nSecond item\nThird item' },
	steps: {
		title: 'How it works',
		body: 'Install it :: Download and run the installer\nConfigure it :: Open the settings screen\nUse it :: You are done',
	},
	timeline: {
		title: 'History',
		body: '2024 :: Started :: The first commit\n2025 :: Shipped :: Version 1.0 released',
	},
	stats: { title: 'Numbers', body: '42 :: Open issues\n1.2k :: Users\n98% :: Uptime' },
	progress: { title: 'Progress', body: 'Design :: 90\nBuild :: 65\nShip :: 20' },
	rating: { title: 'Review', body: 'Story :: 5\nMusic :: 4\nPacing :: 3' },
	keyvalue: { title: 'Details', body: 'Status :: Active\nOwner :: Me\nDue :: Tomorrow' },
	table: { title: 'Team', body: 'Name :: Role :: Since\nAna :: Design :: 2021\nBo :: Code :: 2023' },
	compare: { title: 'Worth knowing', body: '+ Plain text notes\n+ Works offline\n- One more plugin\n- No live preview' },
	faq: { title: 'Questions', body: 'What is it? :: A markdown fence that renders as HTML.\nIs it free? :: Yes - MIT licensed.' },
	feature: {
		title: 'Why bother',
		body: '🚀 Fast :: Renders as you type\n🎨 Themed :: Follows your Joplin theme\n🧩 Simple :: One fence to remember',
	},
	chat: { title: 'Conversation', body: 'Ana :: Did you see the new blocks?\nBo :: Just tried them - they look great.' },
	badges: { title: '', body: 'typescript, joplin, plugin, markdown' },
	chart: { title: 'Monthly totals', body: 'Jan :: 12\nFeb :: 28\nMar :: 19\nApr :: 34\nMay :: 25' },
	flow: { title: 'Pipeline', body: 'Draft :: Write it down\nReview :: Check it over\nShip :: Publish it' },
	tree: { title: 'Project layout', body: 'src\n  blocks\n    render.ts\n    syntax.ts\n  index.ts\nREADME.md' },
	buttons: {
		title: 'Where to go next',
		body: '📖 Documentation :: https://joplinapp.org\n⬇️ Download :: https://joplinapp.org/download\n💬 Forum :: https://discourse.joplinapp.org',
	},
	art: { title: 'ASCII art', body: '  /\\_/\\\n ( o.o )\n  > ^ <' },
	bigtext: { title: '', body: 'JOPLIN' },
	quote: { title: 'Author name', body: 'The quoted text goes here.' },
	details: { title: 'Click to expand', body: 'Hidden contents' },
	grid: { title: 'Grid title', body: '**Left cell**\n\nContent of the first cell\n---\n**Right cell**\n\nContent of the second cell' },
};

const hints = (mode, over = {}) => {
	const base = HINTS[mode] || HINTS.plain;
	return {
		titleHint: over.titleHint !== undefined ? over.titleHint : base.title,
		bodyHint: over.bodyHint !== undefined ? over.bodyHint : base.body,
	};
};

// --------------------------------------------------------------------------
// Themes
// --------------------------------------------------------------------------
// A theme changes the chrome (fill, border, shadow) without touching the
// renderer: it becomes a `jhtml-t-<theme>` class that the stylesheet picks up.

const THEMES = {
	soft: 'Soft',
	solid: 'Solid',
	outline: 'Outline',
	gradient: 'Gradient',
	elevated: 'Elevated',
	glass: 'Glass',
	neon: 'Neon',
	minimal: 'Minimal',
	ribbon: 'Ribbon',
	dashed: 'Dashed',
	underline: 'Underline',
};

const blocks = [];

const add = block => {
	blocks.push(block);
	return block;
};

// --------------------------------------------------------------------------
// Cards
// --------------------------------------------------------------------------

// The original soft cards, ids and aliases untouched.
const SOFT_CARDS = [
	{ id: 'card_light_blue', color: 'sky', label: 'Light blue', aliases: ['card_lightblue', 'card_sky'] },
	{ id: 'card_blue', color: 'blue', label: 'Blue' },
	{ id: 'card_indigo', color: 'indigo', label: 'Indigo' },
	{ id: 'card_violet', color: 'violet', label: 'Violet' },
	{ id: 'card_purple', color: 'purple', label: 'Purple' },
	{ id: 'card_fuchsia', color: 'fuchsia', label: 'Fuchsia' },
	{ id: 'card_pink', color: 'pink', label: 'Pink' },
	{ id: 'card_rose', color: 'rose', label: 'Rose' },
	{ id: 'card_red', color: 'red', label: 'Red' },
	{ id: 'card_orange', color: 'orange', label: 'Orange' },
	{ id: 'card_amber', color: 'amber', label: 'Amber' },
	{ id: 'card_yellow', color: 'yellow', label: 'Yellow' },
	{ id: 'card_light_green', color: 'lime', label: 'Light green', aliases: ['card_lightgreen', 'card_lime'] },
	{ id: 'card_green', color: 'green', label: 'Green' },
	{ id: 'card_emerald', color: 'emerald', label: 'Emerald' },
	{ id: 'card_teal', color: 'teal', label: 'Teal' },
	{ id: 'card_cyan', color: 'cyan', label: 'Cyan' },
	{ id: 'card_slate', color: 'slate', label: 'Slate' },
	{ id: 'card_gray', color: 'gray', label: 'Gray', aliases: ['card_grey'] },
	{ id: 'card_brown', color: 'brown', label: 'Brown' },
	{ id: 'card_dark', color: 'dark', label: 'Dark' },
];

for (const card of SOFT_CARDS) {
	add({
		id: card.id,
		label: `${card.label} card`,
		category: 'Cards',
		mode: 'card',
		theme: 'soft',
		color: hex(card.color),
		aliases: card.aliases,
		...hints('card'),
	});
}

const CARD_THEMES = [
	{ theme: 'solid', palette: WIDE, note: 'Filled with the colour, white text.' },
	{ theme: 'outline', palette: WIDE, note: 'Just an outline - no fill at all.' },
	{ theme: 'gradient', palette: WIDE, note: 'A diagonal gradient behind white text.' },
	{ theme: 'elevated', palette: WIDE, note: 'Raised off the page with a coloured cap.' },
	{ theme: 'glass', palette: NARROW, note: 'Frosted, translucent panel.' },
	{ theme: 'neon', palette: NARROW, note: 'Dark panel with a glowing edge.' },
	{ theme: 'minimal', palette: NARROW, note: 'One coloured rule, nothing else.' },
	{ theme: 'ribbon', palette: NARROW, note: 'Coloured title bar over a plain body.' },
	{ theme: 'dashed', palette: NARROW, note: 'Dashed outline - reads as provisional.' },
	{ theme: 'underline', palette: NARROW, note: 'Underscored by a thick coloured rule.' },
];

for (const family of CARD_THEMES) {
	for (const color of family.palette) {
		add({
			id: `card_${family.theme}_${color}`,
			label: `${colorLabel(color)} ${family.theme} card`,
			category: `Cards · ${THEMES[family.theme]}`,
			mode: 'card',
			theme: family.theme,
			color: hex(color),
			...hints('card'),
		});
	}
}

// --------------------------------------------------------------------------
// Callouts
// --------------------------------------------------------------------------

const CALLOUTS = [
	{ id: 'callout_info', label: 'Info', icon: 'ℹ️', color: 'blue', aliases: ['info'], body: 'Something worth knowing.' },
	{ id: 'callout_tip', label: 'Tip', icon: '💡', color: 'emerald', aliases: ['tip', 'hint'], body: 'A helpful tip.' },
	{ id: 'callout_note', label: 'Note', icon: '📝', color: 'slate', aliases: ['note'], body: 'A side note.' },
	{ id: 'callout_success', label: 'Success', icon: '✅', color: 'green', aliases: ['success', 'done'], body: 'It worked.' },
	{ id: 'callout_warning', label: 'Warning', icon: '⚠️', color: 'amber', aliases: ['warning', 'caution'], body: 'Be careful here.' },
	{ id: 'callout_danger', label: 'Danger', icon: '⛔', color: 'red', aliases: ['danger', 'error'], body: 'This can break things.' },
	{ id: 'callout_question', label: 'Question', icon: '❓', color: 'violet', aliases: ['question', 'faq'], body: 'Something to figure out.' },
	{ id: 'callout_example', label: 'Example', icon: '🧪', color: 'cyan', aliases: ['example'], body: 'For instance...' },
	{ id: 'callout_bug', label: 'Bug', icon: '🐛', color: 'rose', aliases: ['bug'], body: 'What goes wrong.' },
	{ id: 'callout_todo', label: 'To do', icon: '📌', color: 'orange', aliases: ['todo'], body: 'What is left to do.' },

	// Added in 1.1
	{ id: 'callout_abstract', label: 'Abstract', icon: '📄', color: 'cyan', aliases: ['abstract', 'summary', 'tldr'], body: 'The short version.' },
	{ id: 'callout_important', label: 'Important', icon: '❗', color: 'rose', aliases: ['important'], body: 'Do not skip this.' },
	{ id: 'callout_key', label: 'Key point', icon: '🔑', color: 'amber', aliases: ['key', 'takeaway'], body: 'The one thing to remember.' },
	{ id: 'callout_idea', label: 'Idea', icon: '🧠', color: 'purple', aliases: ['idea'], body: 'Worth trying one day.' },
	{ id: 'callout_quote', label: 'Quote', icon: '💬', color: 'indigo', body: 'What somebody said.' },
	{ id: 'callout_security', label: 'Security', icon: '🔒', color: 'red', aliases: ['security'], body: 'Handle credentials carefully.' },
	{ id: 'callout_link', label: 'Link', icon: '🔗', color: 'blue', aliases: ['link', 'seealso'], body: 'Where to read more.' },
	{ id: 'callout_download', label: 'Download', icon: '⬇️', color: 'sky', aliases: ['download'], body: 'Where to get it.' },
	{ id: 'callout_update', label: 'Update', icon: '🔄', color: 'teal', aliases: ['update', 'changelog'], body: 'What changed.' },
	{ id: 'callout_deprecated', label: 'Deprecated', icon: '🚫', color: 'gray', aliases: ['deprecated'], body: 'Kept only for old notes.' },
	{ id: 'callout_experimental', label: 'Experimental', icon: '🧬', color: 'fuchsia', aliases: ['experimental', 'beta'], body: 'This may change without warning.' },
	{ id: 'callout_performance', label: 'Performance', icon: '⚡', color: 'yellow', aliases: ['performance', 'perf'], body: 'The fast path.' },
	{ id: 'callout_cost', label: 'Cost', icon: '💰', color: 'lime', aliases: ['cost', 'money'], body: 'What it costs.' },
	{ id: 'callout_deadline', label: 'Deadline', icon: '⏱️', color: 'orange', aliases: ['deadline', 'due'], body: 'When it is due.' },
	{ id: 'callout_reference', label: 'Reference', icon: '📚', color: 'brown', aliases: ['reference', 'source'], body: 'Where this came from.' },
	{ id: 'callout_star', label: 'Highlight', icon: '⭐', color: 'amber', aliases: ['highlight_note'], body: 'The pick of the bunch.' },
	{ id: 'callout_people', label: 'People', icon: '👥', color: 'indigo', aliases: ['people', 'who'], body: 'Who is involved.' },
	{ id: 'callout_location', label: 'Location', icon: '📍', color: 'red', aliases: ['location', 'where'], body: 'Where it happens.' },
];

for (const callout of CALLOUTS) {
	add({
		id: callout.id,
		label: callout.label,
		category: 'Callouts',
		mode: 'callout',
		theme: 'soft',
		color: hex(callout.color),
		icon: callout.icon,
		defaultTitle: callout.label,
		aliases: callout.aliases,
		titleHint: callout.label,
		bodyHint: callout.body,
	});
}

// Themed versions of the ten classic admonitions.
const THEMED_CALLOUTS = CALLOUTS.slice(0, 10);

for (const theme of ['solid', 'outline', 'minimal']) {
	for (const callout of THEMED_CALLOUTS) {
		add({
			id: `${callout.id}_${theme}`,
			label: `${callout.label} (${THEMES[theme].toLowerCase()})`,
			category: `Callouts · ${THEMES[theme]}`,
			mode: 'callout',
			theme,
			color: hex(callout.color),
			icon: callout.icon,
			defaultTitle: callout.label,
			titleHint: callout.label,
			bodyHint: callout.body,
		});
	}
}

// --------------------------------------------------------------------------
// Lists
// --------------------------------------------------------------------------

const LISTS = [
	{ id: 'list_style1', label: 'Dot pills', listStyle: 'dot', color: 'blue', aliases: ['list_dot'] },
	{ id: 'list_style2', label: 'Numbered circles', listStyle: 'number', ordered: true, color: 'indigo', aliases: ['list_number'] },
	{ id: 'list_style3', label: 'Check marks', listStyle: 'check', color: 'green', aliases: ['list_check_marks'] },
	{ id: 'list_style4', label: 'Arrows', listStyle: 'arrow', color: 'orange', aliases: ['list_arrow'] },
	{ id: 'list_style5', label: 'Boxed rows', listStyle: 'boxed', color: 'teal', aliases: ['list_boxed'] },
	{ id: 'list_style6', label: 'Separated rows', listStyle: 'separated', color: 'purple', aliases: ['list_separated'] },

	// Added in 1.1
	{ id: 'list_square', label: 'Square bullets', listStyle: 'square', color: 'slate' },
	{ id: 'list_dash', label: 'Dashes', listStyle: 'dash', color: 'gray' },
	{ id: 'list_star', label: 'Stars', listStyle: 'star', color: 'amber' },
	{ id: 'list_alpha', label: 'Lettered', listStyle: 'alpha', ordered: true, color: 'cyan' },
	{ id: 'list_roman', label: 'Roman numerals', listStyle: 'roman', ordered: true, color: 'brown' },
	{ id: 'list_chevron', label: 'Chevrons', listStyle: 'chevron', color: 'sky' },
	{ id: 'list_plus', label: 'Plus signs', listStyle: 'plus', color: 'emerald' },
	{ id: 'list_number_boxed', label: 'Numbered boxes', listStyle: 'numbox', ordered: true, color: 'violet' },
	{ id: 'list_cards', label: 'Card rows', listStyle: 'cards', color: 'blue' },
	{ id: 'list_pills', label: 'Pill rows', listStyle: 'pill', color: 'fuchsia' },
	{ id: 'list_ranked', label: 'Ranked (medals)', listStyle: 'rank', ordered: true, color: 'amber' },
	{ id: 'list_icons', label: 'Icon bullets', listStyle: 'icon', color: 'rose' },
	{ id: 'list_striped', label: 'Striped rows', listStyle: 'striped', color: 'teal' },
	{ id: 'list_inline', label: 'Inline / comma free', listStyle: 'inline', color: 'indigo' },
];

for (const list of LISTS) {
	add({
		id: list.id,
		label: list.label,
		category: 'Lists',
		mode: 'list',
		theme: 'soft',
		color: hex(list.color),
		listStyle: list.listStyle,
		ordered: list.ordered,
		aliases: list.aliases,
		...hints('list'),
	});
}

// Themed lists: same markers, different chrome.
for (const theme of ['solid', 'outline', 'minimal']) {
	for (const list of [LISTS[0], LISTS[1], LISTS[2]]) {
		add({
			id: `${list.id}_${theme}`,
			label: `${list.label} (${THEMES[theme].toLowerCase()})`,
			category: 'Lists · Themed',
			mode: 'list',
			theme,
			color: hex(list.color),
			listStyle: list.listStyle,
			ordered: list.ordered,
			...hints('list'),
		});
	}
}

const CHECKLISTS = [
	{ id: 'list_check', label: 'Checklist', color: 'emerald', theme: 'soft' },
	{ id: 'checklist_outline', label: 'Checklist (outline)', color: 'blue', theme: 'outline' },
	{ id: 'checklist_boxed', label: 'Checklist (boxed rows)', color: 'teal', theme: 'soft', listStyle: 'checkbox-boxed' },
	{ id: 'checklist_minimal', label: 'Checklist (minimal)', color: 'slate', theme: 'minimal' },
];

for (const item of CHECKLISTS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Checklists',
		mode: 'list',
		theme: item.theme,
		color: hex(item.color),
		listStyle: item.listStyle || 'checkbox',
		titleHint: 'Checklist',
		bodyHint: '[x] Done item\n[ ] Pending item\n[ ] Another thing',
	});
}

// --------------------------------------------------------------------------
// Steps, timelines
// --------------------------------------------------------------------------

const STEPS = [
	{ id: 'steps', label: 'Steps', color: 'blue', theme: 'soft' },
	{ id: 'steps_solid', label: 'Steps (solid)', color: 'indigo', theme: 'solid' },
	{ id: 'steps_outline', label: 'Steps (outline)', color: 'teal', theme: 'outline' },
	{ id: 'steps_minimal', label: 'Steps (minimal)', color: 'slate', theme: 'minimal' },
	{ id: 'steps_elevated', label: 'Steps (elevated)', color: 'violet', theme: 'elevated' },
];

for (const item of STEPS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Steps',
		mode: 'steps',
		theme: item.theme,
		color: hex(item.color),
		...hints('steps'),
	});
}

const TIMELINES = [
	{ id: 'timeline', label: 'Timeline', color: 'violet', theme: 'soft' },
	{ id: 'timeline_solid', label: 'Timeline (solid)', color: 'indigo', theme: 'solid' },
	{ id: 'timeline_outline', label: 'Timeline (outline)', color: 'cyan', theme: 'outline' },
	{ id: 'timeline_minimal', label: 'Timeline (minimal)', color: 'slate', theme: 'minimal' },
	{ id: 'timeline_elevated', label: 'Timeline (elevated)', color: 'rose', theme: 'elevated' },
];

for (const item of TIMELINES) {
	add({
		id: item.id,
		label: item.label,
		category: 'Timelines',
		mode: 'timeline',
		theme: item.theme,
		color: hex(item.color),
		...hints('timeline'),
	});
}

// --------------------------------------------------------------------------
// Numbers: stats, progress bars, ratings
// --------------------------------------------------------------------------

const STATS = [
	{ id: 'stats', label: 'Stat tiles', color: 'cyan', theme: 'soft' },
	{ id: 'stats_solid', label: 'Stat tiles (solid)', color: 'blue', theme: 'solid' },
	{ id: 'stats_outline', label: 'Stat tiles (outline)', color: 'slate', theme: 'outline' },
	{ id: 'stats_gradient', label: 'Stat tiles (gradient)', color: 'violet', theme: 'gradient' },
	{ id: 'stats_elevated', label: 'Stat tiles (elevated)', color: 'emerald', theme: 'elevated' },
];

for (const item of STATS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Numbers',
		mode: 'stats',
		theme: item.theme,
		color: hex(item.color),
		...hints('stats'),
	});
}

const PROGRESS = [
	{ id: 'progress', label: 'Progress bars', color: 'blue', theme: 'soft' },
	{ id: 'progress_striped', label: 'Progress bars (striped)', color: 'indigo', theme: 'soft', variant: 'striped' },
	{ id: 'progress_slim', label: 'Progress bars (slim)', color: 'emerald', theme: 'minimal', variant: 'slim' },
	{ id: 'progress_outline', label: 'Progress bars (outline)', color: 'teal', theme: 'outline' },
];

for (const item of PROGRESS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Numbers',
		mode: 'progress',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.id === 'progress' ? ['bars'] : undefined,
		...hints('progress'),
	});
}

add({
	id: 'rating',
	label: 'Star ratings',
	category: 'Numbers',
	mode: 'rating',
	theme: 'soft',
	color: hex('amber'),
	aliases: ['stars'],
	...hints('rating'),
});

add({
	id: 'rating_minimal',
	label: 'Star ratings (minimal)',
	category: 'Numbers',
	mode: 'rating',
	theme: 'minimal',
	color: hex('yellow'),
	...hints('rating'),
});

// --------------------------------------------------------------------------
// Grids and columns
// --------------------------------------------------------------------------

const GRIDS = [
	{ id: 'grid_2', label: 'Grid - 2 columns', columns: 2, color: 'slate' },
	{ id: 'grid_3', label: 'Grid - 3 columns', columns: 3, color: 'slate', bodyHint: '**One**\n\nFirst cell\n---\n**Two**\n\nSecond cell\n---\n**Three**\n\nThird cell' },
	{ id: 'grid_4', label: 'Grid - 4 columns', columns: 4, color: 'slate', bodyHint: '**One**\n---\n**Two**\n---\n**Three**\n---\n**Four**' },
	{ id: 'grid_2_solid', label: 'Grid - 2 solid', columns: 2, color: 'blue', theme: 'solid' },
	{ id: 'grid_2_outline', label: 'Grid - 2 outline', columns: 2, color: 'teal', theme: 'outline' },
	{ id: 'grid_3_elevated', label: 'Grid - 3 elevated', columns: 3, color: 'indigo', theme: 'elevated', bodyHint: '**One**\n\nFirst cell\n---\n**Two**\n\nSecond cell\n---\n**Three**\n\nThird cell' },
	{ id: 'columns_2', label: 'Plain 2 columns', columns: 2, color: 'slate', bare: true, titleHint: '', bodyHint: 'Left hand text\n---\nRight hand text' },
	{ id: 'columns_3', label: 'Plain 3 columns', columns: 3, color: 'slate', bare: true, titleHint: '', bodyHint: 'First column\n---\nSecond column\n---\nThird column' },
];

for (const grid of GRIDS) {
	add({
		id: grid.id,
		label: grid.label,
		category: 'Grids & columns',
		mode: 'grid',
		theme: grid.theme || 'soft',
		color: hex(grid.color),
		columns: grid.columns,
		bare: grid.bare,
		...hints('grid', grid),
	});
}

const FEATURES = [
	{ id: 'features_2', label: 'Feature grid - 2 columns', columns: 2, color: 'blue', theme: 'soft' },
	{ id: 'features_3', label: 'Feature grid - 3 columns', columns: 3, color: 'indigo', theme: 'soft' },
	{ id: 'features_solid', label: 'Feature grid - solid', columns: 3, color: 'violet', theme: 'solid' },
	{ id: 'features_outline', label: 'Feature grid - outline', columns: 3, color: 'teal', theme: 'outline' },
	{ id: 'features_elevated', label: 'Feature grid - elevated', columns: 2, color: 'emerald', theme: 'elevated' },
];

for (const item of FEATURES) {
	add({
		id: item.id,
		label: item.label,
		category: 'Grids & columns',
		mode: 'feature',
		theme: item.theme,
		color: hex(item.color),
		columns: item.columns,
		...hints('feature'),
	});
}

// --------------------------------------------------------------------------
// Boxes
// --------------------------------------------------------------------------

const BOXES = [
	{ id: 'box_plain', label: 'Plain box', color: 'slate', theme: 'soft' },
	{ id: 'box_dashed', label: 'Dashed box', color: 'gray', theme: 'dashed' },
	{ id: 'box_shadow', label: 'Shadow box', color: 'dark', theme: 'elevated' },
	{ id: 'box_outline', label: 'Outline box', color: 'blue', theme: 'outline' },
	{ id: 'box_solid', label: 'Solid box', color: 'indigo', theme: 'solid' },
	{ id: 'box_glass', label: 'Glass box', color: 'cyan', theme: 'glass' },
	{ id: 'box_neon', label: 'Neon box', color: 'fuchsia', theme: 'neon' },
	{ id: 'box_ribbon', label: 'Ribbon box', color: 'violet', theme: 'ribbon' },
	{ id: 'box_underline', label: 'Underlined box', color: 'teal', theme: 'underline' },
	{ id: 'highlight', label: 'Highlight strip', color: 'yellow', theme: 'soft', variant: 'strip', aliases: ['highlight_box'], titleHint: '', bodyHint: 'Text you want to stand out.' },
	{ id: 'note_paper', label: 'Sticky note', color: 'amber', theme: 'soft', variant: 'sticky', aliases: ['sticky'], titleHint: 'Reminder', bodyHint: 'Do not forget this.' },
	{ id: 'box_terminal', label: 'Terminal window', color: 'dark', theme: 'soft', variant: 'terminal', aliases: ['terminal'], titleHint: 'bash', bodyHint: '`npm run dist`' },
	{ id: 'box_ticket', label: 'Ticket', color: 'rose', theme: 'soft', variant: 'ticket', titleHint: 'Ticket #128', bodyHint: 'What needs doing.' },
	{ id: 'box_corner', label: 'Corner accent box', color: 'purple', theme: 'soft', variant: 'corner', titleHint: 'Box title', bodyHint: 'Box contents' },
	{ id: 'box_frame', label: 'Framed box', color: 'brown', theme: 'soft', variant: 'frame', titleHint: 'Box title', bodyHint: 'Box contents' },
	{ id: 'box_center', label: 'Centred box', color: 'slate', theme: 'soft', variant: 'center', titleHint: 'Box title', bodyHint: 'Centred contents' },
];

for (const box of BOXES) {
	add({
		id: box.id,
		label: box.label,
		category: 'Boxes',
		mode: 'plain',
		theme: box.theme,
		variant: box.variant,
		color: hex(box.color),
		aliases: box.aliases,
		...hints('plain', box),
	});
}

// --------------------------------------------------------------------------
// Banners and heroes
// --------------------------------------------------------------------------

const BANNERS = [
	{ id: 'banner', label: 'Gradient banner', color: 'indigo', variant: 'banner', title: 'Banner headline', body: 'Supporting text for the banner' },
	{ id: 'banner_blue', label: 'Blue banner', color: 'blue', variant: 'banner', title: 'Banner headline', body: 'Supporting text for the banner' },
	{ id: 'banner_green', label: 'Green banner', color: 'emerald', variant: 'banner', title: 'Banner headline', body: 'Supporting text for the banner' },
	{ id: 'banner_red', label: 'Red banner', color: 'red', variant: 'banner', title: 'Banner headline', body: 'Supporting text for the banner' },
	{ id: 'banner_orange', label: 'Orange banner', color: 'orange', variant: 'banner', title: 'Banner headline', body: 'Supporting text for the banner' },
	{ id: 'banner_dark', label: 'Dark banner', color: 'dark', variant: 'banner', title: 'Banner headline', body: 'Supporting text for the banner' },
	{ id: 'banner_flat', label: 'Flat banner', color: 'violet', variant: 'flatbanner', title: 'Banner headline', body: 'Supporting text for the banner' },
	{ id: 'hero', label: 'Hero section', color: 'sky', variant: 'hero', title: 'Big headline', body: 'A short introduction paragraph.' },
	{ id: 'hero_dark', label: 'Dark hero', color: 'dark', variant: 'hero', title: 'Big headline', body: 'A short introduction paragraph.' },
	{ id: 'hero_purple', label: 'Purple hero', color: 'purple', variant: 'hero', title: 'Big headline', body: 'A short introduction paragraph.' },
	{ id: 'hero_outline', label: 'Outlined hero', color: 'indigo', variant: 'herooutline', title: 'Big headline', body: 'A short introduction paragraph.' },
	{ id: 'section_title', label: 'Section divider', color: 'slate', variant: 'divider', title: 'Section title', body: 'An optional line of context.' },
];

for (const banner of BANNERS) {
	add({
		id: banner.id,
		label: banner.label,
		category: 'Banners & heroes',
		mode: 'plain',
		theme: 'soft',
		variant: banner.variant,
		color: hex(banner.color),
		titleHint: banner.title,
		bodyHint: banner.body,
	});
}

// --------------------------------------------------------------------------
// Quotes
// --------------------------------------------------------------------------

const QUOTES = [
	{ id: 'quote_box', label: 'Quote', color: 'violet', theme: 'soft', aliases: ['quote'] },
	{ id: 'quote_solid', label: 'Quote (solid)', color: 'indigo', theme: 'solid' },
	{ id: 'quote_minimal', label: 'Quote (minimal)', color: 'slate', theme: 'minimal' },
	{ id: 'quote_pull', label: 'Pull quote', color: 'blue', theme: 'soft', variant: 'pull' },
	{ id: 'quote_card', label: 'Testimonial card', color: 'teal', theme: 'elevated', variant: 'testimonial' },
];

for (const quote of QUOTES) {
	add({
		id: quote.id,
		label: quote.label,
		category: 'Quotes',
		mode: 'quote',
		theme: quote.theme,
		variant: quote.variant,
		color: hex(quote.color),
		aliases: quote.aliases,
		...hints('quote'),
	});
}

// --------------------------------------------------------------------------
// Collapsible sections
// --------------------------------------------------------------------------

const DETAILS = [
	{ id: 'details', label: 'Collapsible section', color: 'slate', theme: 'soft', aliases: ['collapse', 'spoiler'] },
	{ id: 'details_open', label: 'Collapsible (open by default)', color: 'slate', theme: 'soft', open: true, titleHint: 'Expanded by default', bodyHint: 'Visible contents' },
	{ id: 'details_solid', label: 'Collapsible (solid header)', color: 'indigo', theme: 'solid' },
	{ id: 'details_outline', label: 'Collapsible (outline)', color: 'teal', theme: 'outline' },
	{ id: 'details_minimal', label: 'Collapsible (minimal)', color: 'gray', theme: 'minimal' },
];

for (const item of DETAILS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Collapsible',
		mode: 'details',
		theme: item.theme,
		color: hex(item.color),
		open: item.open,
		aliases: item.aliases,
		...hints('details', item),
	});
}

// Not `faq` - that alias has always pointed at the question callout, and old
// notes must keep rendering the way they were written.
add({
	id: 'faq_list',
	label: 'FAQ list',
	category: 'Collapsible',
	mode: 'faq',
	theme: 'soft',
	color: hex('blue'),
	aliases: ['questions', 'qa'],
	...hints('faq'),
});

add({
	id: 'faq_list_minimal',
	label: 'FAQ list (minimal)',
	category: 'Collapsible',
	mode: 'faq',
	theme: 'minimal',
	color: hex('slate'),
	...hints('faq'),
});

// --------------------------------------------------------------------------
// Badges
// --------------------------------------------------------------------------

const BADGES = [
	{ id: 'badges', label: 'Badge row', color: 'sky', theme: 'soft' },
	{ id: 'badges_solid', label: 'Badges (solid)', color: 'blue', theme: 'solid' },
	{ id: 'badges_outline', label: 'Badges (outline)', color: 'teal', theme: 'outline' },
	{ id: 'badges_tags', label: 'Tags', color: 'violet', theme: 'soft', variant: 'tag', aliases: ['tags'] },
	{ id: 'badges_square', label: 'Square badges', color: 'slate', theme: 'soft', variant: 'square' },
];

for (const item of BADGES) {
	add({
		id: item.id,
		label: item.label,
		category: 'Badges & tags',
		mode: 'badges',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('badges'),
	});
}

// --------------------------------------------------------------------------
// Tables and comparisons
// --------------------------------------------------------------------------

const KEYVALUES = [
	{ id: 'keyvalue', label: 'Key / value table', color: 'teal', theme: 'soft', aliases: ['kv', 'fields'] },
	{ id: 'keyvalue_striped', label: 'Key / value (striped)', color: 'blue', theme: 'soft', variant: 'striped' },
	{ id: 'keyvalue_solid', label: 'Key / value (solid)', color: 'indigo', theme: 'solid' },
	{ id: 'keyvalue_minimal', label: 'Key / value (minimal)', color: 'slate', theme: 'minimal' },
];

for (const item of KEYVALUES) {
	add({
		id: item.id,
		label: item.label,
		category: 'Tables & data',
		mode: 'keyvalue',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('keyvalue'),
	});
}

const TABLES = [
	{ id: 'table', label: 'Table', color: 'blue', theme: 'soft' },
	{ id: 'table_striped', label: 'Table (striped)', color: 'indigo', theme: 'soft', variant: 'striped' },
	{ id: 'table_minimal', label: 'Table (minimal)', color: 'slate', theme: 'minimal' },

	// Added in 1.1
	{ id: 'table_bordered', label: 'Table (bordered)', color: 'teal', theme: 'soft', variant: 'bordered' },
	{ id: 'table_compact', label: 'Table (compact)', color: 'cyan', theme: 'soft', variant: 'compact' },
	{ id: 'table_solid', label: 'Table (solid header)', color: 'violet', theme: 'solid' },
	{ id: 'table_outline', label: 'Table (outline)', color: 'emerald', theme: 'outline' },
	{ id: 'table_elevated', label: 'Table (elevated)', color: 'blue', theme: 'elevated' },
	{
		id: 'table_rowhead', label: 'Table (row headings)', color: 'indigo', theme: 'soft', variant: 'rowhead',
		bodyHint: 'Plan :: Free :: Pro\nPrice :: 0 :: 9\nSeats :: 1 :: 25\nSupport :: Forum :: Email',
	},
	{
		id: 'table_matrix', label: 'Feature matrix', color: 'green', theme: 'soft', variant: 'matrix',
		aliases: ['matrix'],
		titleHint: 'What you get',
		bodyHint: 'Feature :: Free :: Pro\nBlocks :: yes :: yes\nThemes :: partly :: yes\nSupport :: no :: yes',
	},
];

for (const item of TABLES) {
	add({
		id: item.id,
		label: item.label,
		category: 'Tables & data',
		mode: 'table',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('table', item),
	});
}

const COMPARES = [
	{ id: 'pros_cons', label: 'Pros and cons', color: 'green', theme: 'soft', aliases: ['proscons', 'compare'] },
	{ id: 'pros_cons_outline', label: 'Pros and cons (outline)', color: 'teal', theme: 'outline' },
];

for (const item of COMPARES) {
	add({
		id: item.id,
		label: item.label,
		category: 'Tables & data',
		mode: 'compare',
		theme: item.theme,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('compare'),
	});
}

// --------------------------------------------------------------------------
// Chat
// --------------------------------------------------------------------------

add({
	id: 'chat',
	label: 'Chat transcript',
	category: 'Tables & data',
	mode: 'chat',
	theme: 'soft',
	color: hex('blue'),
	aliases: ['conversation'],
	...hints('chat'),
});

add({
	id: 'chat_minimal',
	label: 'Chat transcript (minimal)',
	category: 'Tables & data',
	mode: 'chat',
	theme: 'minimal',
	color: hex('slate'),
	...hints('chat'),
});

// --------------------------------------------------------------------------
// Charts
// --------------------------------------------------------------------------
// Drawn entirely in CSS, so they render in the viewer, in the picker preview
// and in a PDF export without a script or an image anywhere.

const SHARE_DATA = 'Chrome :: 62\nFirefox :: 18\nSafari :: 12\nOther :: 8';
const SERIES_DATA = 'Mon :: 12\nTue :: 19\nWed :: 15\nThu :: 27\nFri :: 34\nSat :: 22\nSun :: 18';
const DIAL_DATA = 'Storage :: 72%\nMemory :: 45%\nCPU :: 88%';

const CHARTS = [
	{ id: 'chart_column', label: 'Column chart', chart: 'column', color: 'blue', theme: 'soft', aliases: ['chart', 'bars_vertical'] },
	{ id: 'chart_column_multi', label: 'Column chart (multi-colour)', chart: 'column', variant: 'multi', color: 'indigo', theme: 'soft' },
	{ id: 'chart_column_minimal', label: 'Column chart (minimal)', chart: 'column', color: 'slate', theme: 'minimal' },
	{ id: 'chart_column_elevated', label: 'Column chart (elevated)', chart: 'column', color: 'violet', theme: 'elevated' },

	{ id: 'chart_bar', label: 'Bar chart', chart: 'bar', color: 'teal', theme: 'soft', aliases: ['barchart'] },
	{ id: 'chart_bar_multi', label: 'Bar chart (multi-colour)', chart: 'bar', variant: 'multi', color: 'purple', theme: 'soft' },
	{ id: 'chart_bar_minimal', label: 'Bar chart (minimal)', chart: 'bar', color: 'slate', theme: 'minimal' },

	{ id: 'chart_pie', label: 'Pie chart', chart: 'pie', color: 'amber', theme: 'soft', aliases: ['pie'], body: SHARE_DATA, title: 'Browser share' },
	{ id: 'chart_donut', label: 'Donut chart', chart: 'donut', color: 'cyan', theme: 'soft', aliases: ['donut'], body: SHARE_DATA, title: 'Browser share' },
	{ id: 'chart_donut_elevated', label: 'Donut chart (elevated)', chart: 'donut', color: 'indigo', theme: 'elevated', body: SHARE_DATA, title: 'Browser share' },
	{ id: 'chart_stacked', label: 'Stacked bar', chart: 'stack', color: 'violet', theme: 'soft', aliases: ['stacked'], body: SHARE_DATA, title: 'Browser share' },

	{ id: 'chart_line', label: 'Line chart', chart: 'line', color: 'blue', theme: 'soft', aliases: ['graph', 'linechart'], body: SERIES_DATA, title: 'Visitors this week' },
	{ id: 'chart_area', label: 'Area chart', chart: 'area', color: 'emerald', theme: 'soft', aliases: ['areachart'], body: SERIES_DATA, title: 'Visitors this week' },
	{ id: 'chart_line_minimal', label: 'Line chart (minimal)', chart: 'line', color: 'slate', theme: 'minimal', body: SERIES_DATA, title: 'Visitors this week' },
	{ id: 'chart_sparkline', label: 'Sparkline', chart: 'line', variant: 'spark', color: 'rose', theme: 'minimal', aliases: ['sparkline'], body: SERIES_DATA, title: 'Trend' },

	{ id: 'chart_gauge', label: 'Gauges', chart: 'gauge', color: 'green', theme: 'soft', aliases: ['gauge', 'dials'], body: DIAL_DATA, title: 'Capacity' },
	{ id: 'chart_gauge_multi', label: 'Gauges (multi-colour)', chart: 'gauge', variant: 'multi', color: 'indigo', theme: 'soft', body: DIAL_DATA, title: 'Capacity' },
	{ id: 'chart_gauge_minimal', label: 'Gauges (minimal)', chart: 'gauge', color: 'slate', theme: 'minimal', body: DIAL_DATA, title: 'Capacity' },
];

for (const item of CHARTS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Charts',
		mode: 'chart',
		chart: item.chart,
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('chart', {
			titleHint: item.title,
			bodyHint: item.body,
		}),
	});
}

// --------------------------------------------------------------------------
// Diagrams: flows and trees
// --------------------------------------------------------------------------

const FLOWS = [
	{ id: 'flow', label: 'Flow chart', color: 'blue', theme: 'soft', aliases: ['pipeline'] },
	{ id: 'flow_down', label: 'Flow chart (top to bottom)', color: 'indigo', theme: 'soft', variant: 'down' },
	{ id: 'flow_solid', label: 'Flow chart (solid)', color: 'violet', theme: 'solid' },
	{ id: 'flow_outline', label: 'Flow chart (outline)', color: 'teal', theme: 'outline' },
	{ id: 'flow_minimal', label: 'Flow chart (minimal)', color: 'slate', theme: 'minimal' },
];

for (const item of FLOWS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Diagrams',
		mode: 'flow',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('flow'),
	});
}

const TREES = [
	{ id: 'tree', label: 'Tree / hierarchy', color: 'emerald', theme: 'soft', aliases: ['hierarchy', 'filetree'] },
	{ id: 'tree_outline', label: 'Tree (outline)', color: 'teal', theme: 'outline' },
	{ id: 'tree_minimal', label: 'Tree (minimal)', color: 'slate', theme: 'minimal' },
	{ id: 'tree_terminal', label: 'Tree (terminal)', color: 'dark', theme: 'soft', variant: 'terminal' },
];

for (const item of TREES) {
	add({
		id: item.id,
		label: item.label,
		category: 'Diagrams',
		mode: 'tree',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('tree'),
	});
}

// --------------------------------------------------------------------------
// Buttons
// --------------------------------------------------------------------------

const BUTTONS = [
	{ id: 'buttons', label: 'Button row', color: 'blue', theme: 'soft', aliases: ['links'] },
	{ id: 'buttons_solid', label: 'Buttons (solid)', color: 'indigo', theme: 'soft', variant: 'solidbtn' },
	{ id: 'buttons_outline', label: 'Buttons (outline)', color: 'teal', theme: 'soft', variant: 'outlinebtn' },
	{ id: 'buttons_pill', label: 'Buttons (pill)', color: 'violet', theme: 'soft', variant: 'pill' },
	{ id: 'buttons_block', label: 'Buttons (full width)', color: 'emerald', theme: 'soft', variant: 'block' },
	{ id: 'buttons_ghost', label: 'Buttons (ghost)', color: 'slate', theme: 'minimal', variant: 'ghost' },
	{
		id: 'buttons_cta', label: 'Call to action', color: 'orange', theme: 'soft', variant: 'cta',
		title: 'Ready to try it?',
		body: '⬇️ Download the plugin :: https://joplinapp.org/plugins\n📖 Read the manual :: https://joplinapp.org',
	},
];

for (const item of BUTTONS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Buttons & links',
		mode: 'buttons',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('buttons', {
			titleHint: item.title,
			bodyHint: item.body,
		}),
	});
}

// --------------------------------------------------------------------------
// Text art
// --------------------------------------------------------------------------
// Two kinds: `art` keeps whatever you typed exactly as you typed it, and
// `bigtext` spells a line out in five-row block letters.

const ART_CAT = 'ASCII & text art';

const CAT_ART = '  /\\_/\\\n ( o.o )\n  > ^ <';
const DIAGRAM_ART = '  +---------+      +---------+\n  |  Editor | ---> | Viewer  |\n  +---------+      +---------+';

const ARTS = [
	{ id: 'ascii_art', label: 'ASCII art', color: 'slate', theme: 'soft', aliases: ['ascii', 'art'], body: CAT_ART },
	{ id: 'ascii_terminal', label: 'ASCII art (terminal)', color: 'dark', theme: 'soft', variant: 'terminal', title: 'output', body: CAT_ART },
	{ id: 'ascii_frame', label: 'ASCII art (framed)', color: 'brown', theme: 'soft', variant: 'frame', body: DIAGRAM_ART },
	{ id: 'ascii_minimal', label: 'ASCII art (minimal)', color: 'gray', theme: 'minimal', body: DIAGRAM_ART },
	{ id: 'ascii_center', label: 'ASCII art (centred)', color: 'violet', theme: 'soft', variant: 'centerart', body: CAT_ART },
];

for (const item of ARTS) {
	add({
		id: item.id,
		label: item.label,
		category: ART_CAT,
		mode: 'art',
		theme: item.theme,
		variant: item.variant,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('art', {
			titleHint: item.title !== undefined ? item.title : '',
			bodyHint: item.body,
		}),
	});
}

const BIG_TEXTS = [
	{ id: 'big_text', label: 'Big text banner', color: 'blue', theme: 'soft', aliases: ['banner_text', 'figlet'] },
	{ id: 'big_text_solid', label: 'Big text (solid)', color: 'indigo', theme: 'solid' },
	{ id: 'big_text_gradient', label: 'Big text (gradient)', color: 'violet', theme: 'gradient' },
	{ id: 'big_text_neon', label: 'Big text (neon)', color: 'fuchsia', theme: 'neon' },
	{ id: 'big_text_minimal', label: 'Big text (minimal)', color: 'slate', theme: 'minimal' },
];

for (const item of BIG_TEXTS) {
	add({
		id: item.id,
		label: item.label,
		category: ART_CAT,
		mode: 'bigtext',
		theme: item.theme,
		color: hex(item.color),
		aliases: item.aliases,
		...hints('bigtext'),
	});
}

// Display type: ordinary text, drawn large and treated as a graphic.
const FANCY_TEXTS = [
	{ id: 'text_gradient', label: 'Gradient headline', color: 'violet', variant: 'gradtext', body: 'Gradient headline' },
	{ id: 'text_neon', label: 'Neon headline', color: 'fuchsia', variant: 'neontext', body: 'Neon headline' },
	{ id: 'text_outline', label: 'Outlined headline', color: 'blue', variant: 'outlinetext', body: 'Outlined headline' },
	{ id: 'text_3d', label: '3D headline', color: 'orange', variant: 'text3d', body: 'Three dimensional' },
	{ id: 'text_stamp', label: 'Rubber stamp', color: 'red', variant: 'stamp', body: 'APPROVED' },
	{ id: 'text_spaced', label: 'Spaced caps', color: 'slate', variant: 'spaced', body: 'Quiet confidence' },
	{ id: 'text_shadow', label: 'Long shadow headline', color: 'teal', variant: 'longshadow', body: 'Long shadow' },
];

for (const item of FANCY_TEXTS) {
	add({
		id: item.id,
		label: item.label,
		category: ART_CAT,
		mode: 'plain',
		theme: 'soft',
		variant: item.variant,
		color: hex(item.color),
		titleHint: '',
		bodyHint: item.body,
	});
}

// --------------------------------------------------------------------------
// Animations
// --------------------------------------------------------------------------
// Every one of these is switched off again under `prefers-reduced-motion`, so
// a reader who has asked the system for less movement gets a plain box.

const ANIMATIONS = [
	{ id: 'anim_fade', label: 'Fade in', animation: 'fade', color: 'blue', body: 'This box fades in when the note is opened.' },
	{ id: 'anim_slide', label: 'Slide in', animation: 'slide', color: 'indigo', body: 'This box slides in from the left.' },
	{ id: 'anim_rise', label: 'Rise up', animation: 'rise', color: 'violet', body: 'This box rises into place.' },
	{ id: 'anim_zoom', label: 'Zoom in', animation: 'zoom', color: 'purple', body: 'This box zooms in.' },
	{ id: 'anim_flip', label: 'Flip in', animation: 'flip', color: 'cyan', body: 'This box flips into view.' },
	{ id: 'anim_reveal', label: 'Wipe reveal', animation: 'reveal', color: 'teal', body: 'This box is wiped into view.' },
	{ id: 'anim_pulse', label: 'Pulse', animation: 'pulse', color: 'rose', body: 'This box keeps a slow pulse.' },
	{ id: 'anim_bounce', label: 'Bounce', animation: 'bounce', color: 'amber', body: 'This box bounces gently.' },
	{ id: 'anim_shake', label: 'Shake', animation: 'shake', color: 'red', body: 'This box shakes for attention.' },
	{ id: 'anim_float', label: 'Float', animation: 'float', color: 'sky', body: 'This box drifts up and down.' },
	{ id: 'anim_glow', label: 'Glow', animation: 'glow', color: 'emerald', body: 'This box glows on and off.' },
	{ id: 'anim_gradient', label: 'Moving gradient', animation: 'gradient', color: 'fuchsia', body: 'The background of this box keeps moving.' },
	{ id: 'anim_blink', label: 'Blinking border', animation: 'blink', color: 'orange', body: 'The border of this box blinks.' },
	{ id: 'anim_typewriter', label: 'Typewriter', animation: 'type', color: 'green', body: 'Typed out one character at a time.' },
	{ id: 'anim_marquee', label: 'Scrolling marquee', animation: 'marquee', color: 'brown', body: 'This line scrolls across the block, over and over.' },
];

for (const item of ANIMATIONS) {
	add({
		id: item.id,
		label: item.label,
		category: 'Animations',
		mode: 'plain',
		theme: 'soft',
		animation: item.animation,
		color: hex(item.color),
		titleHint: item.label,
		bodyHint: item.body,
	});
}

module.exports = { blocks, COLORS, THEMES };
