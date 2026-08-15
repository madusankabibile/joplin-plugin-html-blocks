// Prose and per-block examples for the user manual.
// Kept separate from generate-manual.js so the wording can be edited without
// touching the build logic.

// Sample bodies keyed by block mode. `title` is appended to the opening fence,
// `body` sits between the fences. Anything not listed falls back to `plain`.
const SAMPLES = {
	card: {
		title: 'Release checklist',
		body: 'Cards accept **full markdown** - lists, links, `code`, images.\n\n- Bump the version\n- Tag the release',
	},
	callout: {
		title: '',
		body: 'Leave the title off and the callout uses its own default heading.',
	},
	plain: {
		title: 'Box title',
		body: 'A simple container. The body is ordinary markdown.',
	},
	quote: {
		title: 'Ada Lovelace',
		body: 'The Analytical Engine weaves algebraic patterns, just as the Jacquard loom weaves flowers and leaves.',
	},
	details: {
		title: 'Show the full error log',
		body: 'Hidden until the reader clicks the summary bar.\n\n    TypeError: cannot read property of undefined',
	},
	grid: {
		title: 'Side by side',
		body: '### Before\nOne long column of text.\n---\n### After\nTwo balanced columns.',
	},
	list: {
		title: 'Deployment steps',
		body: 'Run the test suite\nBuild the archive\nUpload to the store',
	},
	steps: {
		title: 'Installing the plugin',
		body: 'Download :: Grab the `.jpl` file from the releases page\nInstall :: Tools > Options > Plugins > Install from file\nRestart :: Reopen Joplin so the viewer picks it up',
	},
	timeline: {
		title: 'Project history',
		body: '2024 :: Prototype :: A single card type and no editor support\n2025 :: Public beta :: Callouts, lists and the block picker\nToday :: Version 1.0 :: 47 blocks across six categories',
	},
	stats: {
		title: 'At a glance',
		body: '47 :: Block types\n6 :: Categories\n1 :: Fence to remember',
	},
	badges: {
		title: 'Tags',
		body: 'markdown, joplin, plugin, css, no-dependencies',
	},
	keyvalue: {
		title: 'Environment',
		body: 'Joplin :: 3.6.15 (desktop)\nPlugin :: 1.0.0\nEditor :: CodeMirror 6\nTheme :: Follows Joplin',
	},
};

// Overrides for blocks whose generic mode sample would undersell them.
const SAMPLE_OVERRIDES = {
	list_check: {
		title: 'Pre-flight',
		body: '[x] Version bumped\n[x] Changelog written\n[ ] Archive uploaded\n[ ] Announcement posted',
	},
	list_style2: {
		title: 'In order',
		body: 'Numbers are added for you\nSo you can reorder lines freely\nWithout renumbering anything',
	},
	columns_2: {
		title: '',
		body: 'No frame, no heading - just two columns of text sitting next to each other.\n---\nUseful when you want the layout without the box around it.',
	},
	grid_3: {
		title: 'Three across',
		body: '### Write\nPlain markdown\n---\n### Preview\nStyled HTML\n---\n### Export\nPDF and HTML',
	},
	banner: {
		title: 'Version 1.0 is out',
		body: 'Gradient banners are good for the top of a note.',
	},
	hero: {
		title: 'HTML Blocks',
		body: 'Styled sections for Joplin, written in plain markdown.',
	},
	highlight: {
		title: '',
		body: 'A thin strip for a single important line.',
	},
	details_open: {
		title: 'Already expanded',
		body: 'Same as the collapsible section, but it starts open and the reader can fold it away.',
	},
	box_plain: { title: 'Plain box', body: 'A neutral container with a light border.' },
	box_dashed: { title: 'Draft', body: 'The dashed border reads as provisional or optional.' },
	box_shadow: { title: 'Raised box', body: 'A soft shadow lifts the box off the page.' },
};

const sampleFor = (block) => {
	const override = SAMPLE_OVERRIDES[block.id];
	if (override) return override;

	const base = SAMPLES[block.mode] || SAMPLES.plain;
	return {
		title: base.title === '' ? '' : (base.title || block.titleHint || ''),
		body: base.body,
	};
};

// Categories whose members share one syntax. These are documented with a single
// worked example followed by a gallery of every variant, instead of repeating
// the same three lines of markdown a dozen times.
const GALLERY_CATEGORIES = {
	Cards: {
		lead: 'card_light_blue',
		note: 'Every card in this family uses the identical syntax - only the accent colour changes. Swap the id for any of the previews below.',
		sample: { title: 'Card title', body: 'Card contents, in ordinary markdown.' },
	},
	Callouts: {
		lead: 'callout_info',
		note: 'Callouts carry an icon and a built-in default title. Give them a title to override the default, or leave the fence bare and take the default heading.',
		sample: { title: '', body: 'A short admonition.' },
	},
};

const INTRO = {
	tagline: 'Styled HTML sections for Joplin notes, written in plain markdown.',
	blurb: 'HTML Blocks adds a single markdown fence to Joplin. Between <code>!!! type</code> and <code>!!!-&gt;</code> you get cards, callouts, checklists, step sequences, timelines, stat tiles, grids and more - rendered in the note viewer, highlighted in the editor, and carried through to PDF and HTML exports. Notes stay readable as plain text, and nothing is stored in your note but the fence itself.',
};

module.exports = { sampleFor, GALLERY_CATEGORIES, INTRO };
