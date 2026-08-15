// Builds the user manual (HTML, then PDF via headless Chrome).
//
//   node tools/generate-manual.js
//
// Every preview in the manual is produced by running the *built* markdown-it
// content script over real block markdown, styled with the plugin's own
// stylesheet. If the renderer changes, the manual changes with it - there are
// no hand-drawn screenshots to fall out of date.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const MarkdownIt = require('markdown-it');

const { sampleFor, GALLERY_CATEGORIES, INTRO } = require('./manual-content');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/manifest.json'), 'utf8'));
const blocks = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/blocks/blocks.json'), 'utf8')).blocks;

const rendererPath = path.join(distDir, 'markdownItPlugin/index.js');
if (!fs.existsSync(rendererPath)) {
	console.error('dist/markdownItPlugin/index.js is missing - run `npm run dist` first.');
	process.exit(1);
}

const pluginCss = fs.readFileSync(path.join(distDir, 'markdownItPlugin/style.css'), 'utf8');

// --------------------------------------------------------------------------
// Renderer - the same content script Joplin loads
// --------------------------------------------------------------------------

const rendererModule = require(rendererPath);
const contentScript = (rendererModule.default || rendererModule)({ contentScriptId: 'manual' });

const md = new MarkdownIt({ html: true, linkify: true });
md.use(contentScript.plugin);

const escapeHtml = (text) => String(text)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

/** Assembles the markdown a user would actually type for a block. */
const sourceFor = (block, sample) => {
	const open = sample.title ? `!!! ${block.id} ${sample.title}` : `!!! ${block.id}`;
	return `${open}\n${sample.body}\n!!!->`;
};

const preview = (source) => `<div class="jh-preview">${md.render(source)}</div>`;
const sourceBlock = (source) => `<pre class="jh-source"><code>${escapeHtml(source)}</code></pre>`;

// --------------------------------------------------------------------------
// Block reference
// --------------------------------------------------------------------------

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const aliasHtml = (block) => {
	if (!block.aliases || !block.aliases.length) return '';
	const list = block.aliases.map(a => `<code>${escapeHtml(a)}</code>`).join(' ');
	return `<span class="jh-aliases">also: ${list}</span>`;
};

const swatch = (block) => `<span class="jh-swatch" style="background:${escapeHtml(block.color)}"></span>`;

const blockEntry = (block) => {
	const sample = sampleFor(block);
	const source = sourceFor(block, sample);

	return `
	<article class="jh-entry">
		<header class="jh-entry-head">
			${swatch(block)}
			<h3 id="block-${escapeHtml(block.id)}">${escapeHtml(block.label)}</h3>
			<code class="jh-id">${escapeHtml(block.id)}</code>
			${aliasHtml(block)}
		</header>
		<div class="jh-cols">
			<div class="jh-col">
				<div class="jh-col-label">You type</div>
				${sourceBlock(source)}
			</div>
			<div class="jh-col">
				<div class="jh-col-label">Joplin shows</div>
				${preview(source)}
			</div>
		</div>
	</article>`;
};

const galleryCategory = (category, list) => {
	const config = GALLERY_CATEGORIES[category];
	const lead = list.find(b => b.id === config.lead) || list[0];
	const leadSource = sourceFor(lead, config.sample);

	const tiles = list.map(block => `
		<figure class="jh-tile">
			<figcaption>${swatch(block)}<code>${escapeHtml(block.id)}</code>${aliasHtml(block)}</figcaption>
			${preview(sourceFor(block, config.sample))}
		</figure>`).join('');

	return `
	<p class="jh-note">${config.note}</p>
	<article class="jh-entry">
		<header class="jh-entry-head">
			${swatch(lead)}
			<h3>${escapeHtml(lead.label)}</h3>
			<code class="jh-id">${escapeHtml(lead.id)}</code>
		</header>
		<div class="jh-cols">
			<div class="jh-col">
				<div class="jh-col-label">You type</div>
				${sourceBlock(leadSource)}
			</div>
			<div class="jh-col">
				<div class="jh-col-label">Joplin shows</div>
				${preview(leadSource)}
			</div>
		</div>
	</article>
	<h3 class="jh-gallery-title">All ${list.length} ${category.toLowerCase()}</h3>
	<div class="jh-gallery">${tiles}</div>`;
};

const categories = [];
for (const block of blocks) {
	let entry = categories.find(c => c.name === block.category);
	if (!entry) {
		entry = { name: block.category, list: [] };
		categories.push(entry);
	}
	entry.list.push(block);
}

const referenceSections = categories.map((category, index) => {
	const body = GALLERY_CATEGORIES[category.name]
		? galleryCategory(category.name, category.list)
		: category.list.map(blockEntry).join('');

	return `
	<section class="jh-section" id="cat-${slug(category.name)}">
		<h2><span class="jh-num">5.${index + 1}</span> ${escapeHtml(category.name)}
			<span class="jh-count">${category.list.length} blocks</span></h2>
		${body}
	</section>`;
}).join('');

// --------------------------------------------------------------------------
// Inline examples used by the prose sections
// --------------------------------------------------------------------------

const demo = (source) => `
	<div class="jh-cols jh-cols-tight">
		<div class="jh-col">${sourceBlock(source)}</div>
		<div class="jh-col">${preview(source)}</div>
	</div>`;

const nestingDemo = demo(
	'!!! card_indigo Outer card\nCards can hold other blocks.\n\n!!! callout_tip\nIncluding callouts.\n!!!->\n\n!!!->',
);

const markdownDemo = demo(
	'!!! box_shadow Markdown still works\n**Bold**, *italic*, `code`, [links](https://joplinapp.org)\n\n1. Ordered lists\n2. Tables, images, footnotes\n!!!->',
);

const fieldsDemo = demo(
	'!!! stats Two fields per line\n99.9% :: Uptime\n1.2s :: Load time\n!!!->',
);

// --------------------------------------------------------------------------
// The document
// --------------------------------------------------------------------------

const contents = [
	['1', 'Installation', 'installation'],
	['2', 'The fence syntax', 'syntax'],
	['3', 'Inserting blocks', 'inserting'],
	['4', 'Settings', 'settings'],
	['5', 'Block reference', 'reference'],
	...categories.map((c, i) => [`5.${i + 1}`, c.name, `cat-${slug(c.name)}`]),
	['6', 'Behaviour worth knowing', 'behaviour'],
	['7', 'Troubleshooting', 'troubleshooting'],
	['A', 'Index of every block id', 'index'],
];

const tocHtml = contents.map(([num, label, id]) => `
	<li class="${num.includes('.') ? 'jh-toc-sub' : ''}">
		<span class="jh-toc-num">${num}</span>
		<a href="#${id}">${escapeHtml(label)}</a>
	</li>`).join('');

const indexRows = blocks.map(block => `
	<tr>
		<td>${swatch(block)}<code>${escapeHtml(block.id)}</code></td>
		<td>${escapeHtml(block.label)}</td>
		<td>${escapeHtml(block.category)}</td>
		<td>${block.aliases ? block.aliases.map(a => `<code>${escapeHtml(a)}</code>`).join(' ') : '<span class="jh-dash">-</span>'}</td>
	</tr>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>HTML Blocks ${escapeHtml(manifest.version)} - User Manual</title>
<style>
${MANUAL_CSS()}

/* ---- the plugin's own stylesheet, scoped to the preview panes ---- */
${pluginCss}
</style>
</head>
<body>

<section class="jh-cover">
	<div class="jh-cover-mark">!!!</div>
	<h1>HTML Blocks</h1>
	<p class="jh-cover-tagline">${INTRO.tagline}</p>
	<dl class="jh-cover-meta">
		<div><dt>Version</dt><dd>${escapeHtml(manifest.version)}</dd></div>
		<div><dt>Requires</dt><dd>Joplin ${escapeHtml(manifest.app_min_version)} or later (desktop)</dd></div>
		<div><dt>Author</dt><dd>${escapeHtml(manifest.author)}</dd></div>
		<div><dt>Plugin id</dt><dd><code>${escapeHtml(manifest.id)}</code></dd></div>
	</dl>
	<p class="jh-cover-foot">Every preview in this manual is rendered by the plugin itself.</p>
</section>

<section class="jh-section jh-page" id="contents">
	<h2>Contents</h2>
	<ol class="jh-toc">${tocHtml}</ol>
	<p class="jh-note">${INTRO.blurb}</p>
</section>

<section class="jh-section jh-page" id="installation">
	<h2><span class="jh-num">1</span> Installation</h2>
	<ol class="jh-steps-doc">
		<li><strong>Open the plugin settings.</strong> In Joplin desktop, go to <em>Tools &rarr; Options &rarr; Plugins</em>.</li>
		<li><strong>Install from file.</strong> Press the gear icon next to the search box, choose <em>Install from file</em>, and select <code>${escapeHtml(manifest.id)}.jpl</code>.</li>
		<li><strong>Restart Joplin.</strong> The note viewer only picks up new content scripts on start-up.</li>
		<li><strong>Check it worked.</strong> Type the example from section 2 into a note and switch to the viewer.</li>
	</ol>
	<p class="jh-note"><strong>Upgrading from an earlier build?</strong> Remove the installed copy first, restart, then install the new <code>.jpl</code>. Joplin caches the old manifest in your profile directory, so installing over the top can leave the previous version in place.</p>
</section>

<section class="jh-section jh-page" id="syntax">
	<h2><span class="jh-num">2</span> The fence syntax</h2>
	<p>There is one thing to learn. Open with <code>!!!</code> and a block type, close with <code>!!!-&gt;</code>:</p>
	${demo('!!! callout_tip Keyboard shortcut\nPress Ctrl+Alt+H to open the block picker.\n!!!->')}

	<h3>The opening fence</h3>
	<p>Everything after the type is an optional title, rendered as inline markdown:</p>
	<pre class="jh-source"><code>!!! card_green My title with **bold** in it</code></pre>
	<ul class="jh-bullets">
		<li>The type must start with a letter. That is what stops <code>!!!-&gt;</code> from ever looking like an opening fence.</li>
		<li>Up to three spaces of indentation are allowed. Four or more makes it an indented code block, as in normal markdown.</li>
		<li>Types are case sensitive and use <code>snake_case</code>. Many have shorter aliases - see appendix A.</li>
	</ul>

	<h3>The closing fence</h3>
	<p>Three spellings are accepted, so use whichever reads best to you:</p>
	<pre class="jh-source"><code>!!!-&gt;      !!!&lt;-      !!!</code></pre>

	<h3>Two fields per line</h3>
	<p>Steps, timelines, stat tiles and key/value tables split each line on <code>::</code>. Extra fields are joined back together, so a line may contain more than one separator.</p>
	${fieldsDemo}

	<h3>Grid cells</h3>
	<p>Grid blocks split on a line of three or more dashes (<code>---</code>) or plus signs (<code>+++</code>). Each cell is parsed as full markdown.</p>

	<h3>Nesting</h3>
	<p>Blocks nest. The plugin counts opening and closing fences, so an inner block will not close the outer one.</p>
	${nestingDemo}
</section>

<section class="jh-section jh-page" id="inserting">
	<h2><span class="jh-num">3</span> Inserting blocks</h2>
	<p>You never have to memorise an id. There are four ways in:</p>
	<table class="jh-table">
		<thead><tr><th>Route</th><th>How</th></tr></thead>
		<tbody>
			<tr><td><strong>Block picker</strong></td><td>Press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd> (<kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd> on macOS), or use the toolbar button. Filter by name, pick a block, press <em>Insert</em>.</td></tr>
			<tr><td><strong>Tools menu</strong></td><td><em>Tools &rarr; HTML Blocks</em> lists every block, grouped by category.</td></tr>
			<tr><td><strong>Toolbar button</strong></td><td>The layer icon in the editor toolbar opens the same picker. It can be hidden in settings.</td></tr>
			<tr><td><strong>Cheat sheet</strong></td><td><em>Tools &rarr; HTML Blocks &rarr; Insert cheat sheet</em> drops one example of every block into the current note - handy as a scratch reference.</td></tr>
		</tbody>
	</table>
	<p class="jh-note"><strong>Selected text is kept.</strong> If you have text selected when you insert a block, it becomes the block body instead of the placeholder. The title placeholder is left selected so you can type straight over it.</p>
</section>

<section class="jh-section jh-page" id="settings">
	<h2><span class="jh-num">4</span> Settings</h2>
	<p>Found under <em>Tools &rarr; Options &rarr; HTML Blocks</em>.</p>
	<table class="jh-table">
		<thead><tr><th>Setting</th><th>Default</th><th>What it does</th></tr></thead>
		<tbody>
			<tr><td>Highlight blocks in the markdown editor</td><td>On</td><td>Colours the fences and tints the lines between them while you edit. Reopen the note for a change to take effect.</td></tr>
			<tr><td>Show the toolbar button</td><td>On</td><td>Shows or hides the picker button in the editor toolbar. Restart Joplin for a change to take effect.</td></tr>
		</tbody>
	</table>
</section>

<section class="jh-section jh-page" id="reference">
	<h2><span class="jh-num">5</span> Block reference</h2>
	<p>All ${blocks.length} blocks, grouped by category. The right-hand pane of each entry is live output from the plugin, not a screenshot.</p>
	${referenceSections}
</section>

<section class="jh-section jh-page" id="behaviour">
	<h2><span class="jh-num">6</span> Behaviour worth knowing</h2>

	<h3>Markdown inside blocks</h3>
	<p>Cards, callouts, boxes, quotes, collapsible sections and grid cells run their contents through Joplin's normal markdown pipeline, so anything you can write in a note works inside them.</p>
	${markdownDemo}

	<h3>Line-based blocks</h3>
	<p>Lists, steps, timelines, stat tiles, badges and key/value tables read one item per line. Blank lines are ignored, and a leading <code>-</code>, <code>*</code> or <code>+</code> is stripped if you type one out of habit. Inline markdown still applies within each line.</p>

	<h3>Unclosed blocks</h3>
	<p>A block with no closing fence runs to the end of the note rather than disappearing. That keeps the preview usable while you are still typing.</p>

	<h3>Unknown types</h3>
	<p>A type the plugin does not recognise is not an error. It renders as a neutral box with the type shown as a badge, so a typo is visible rather than silent.</p>
	${demo('!!! card_turquoise Not a real type\nStill rendered, with the type shown as a badge.\n!!!->')}

	<h3>Export and themes</h3>
	<p>Blocks are plain HTML and CSS, so they survive export to PDF and HTML. Colours are mixed against the current Joplin theme background, which means the same block reads correctly in both light and dark themes.</p>
</section>

<section class="jh-section jh-page" id="troubleshooting">
	<h2><span class="jh-num">7</span> Troubleshooting</h2>
	<table class="jh-table">
		<thead><tr><th>Symptom</th><th>Cause and fix</th></tr></thead>
		<tbody>
			<tr>
				<td>"Please upgrade Joplin to version X to use this plugin"</td>
				<td>The installed build declares a minimum Joplin version newer than yours. This release requires ${escapeHtml(manifest.app_min_version)}. Remove the plugin, restart, and install the current <code>.jpl</code>.</td>
			</tr>
			<tr>
				<td>Blocks show as literal <code>!!!</code> text in the viewer</td>
				<td>The content script is not loaded - usually the plugin failed to start. Check <em>Tools &rarr; Options &rarr; Plugins</em> that it is enabled, then restart Joplin.</td>
			</tr>
			<tr>
				<td>Nothing renders after an update</td>
				<td>Joplin caches content scripts. Restart the app; a full quit is more reliable than closing the window.</td>
			</tr>
			<tr>
				<td>No colour in the editor</td>
				<td>Editor highlighting is off, or the note was open before you changed the setting. Close and reopen the note.</td>
			</tr>
			<tr>
				<td>The block swallowed the rest of my note</td>
				<td>A missing closing fence. Add <code>!!!-&gt;</code> where the block should end.</td>
			</tr>
			<tr>
				<td>A block renders as a plain box with a badge</td>
				<td>The type is misspelled. Check the id against appendix A, or insert it from the picker instead.</td>
			</tr>
		</tbody>
	</table>
</section>

<section class="jh-section jh-page" id="index">
	<h2><span class="jh-num">A</span> Index of every block id</h2>
	<table class="jh-table jh-index">
		<thead><tr><th>Id</th><th>Name</th><th>Category</th><th>Aliases</th></tr></thead>
		<tbody>${indexRows}</tbody>
	</table>
</section>

<footer class="jh-running-foot">HTML Blocks ${escapeHtml(manifest.version)} &middot; User manual</footer>

</body>
</html>`;

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

function MANUAL_CSS() {
	return `
@page { size: A4; margin: 16mm 14mm 18mm; }

:root {
	--ink: #1a1d23;
	--muted: #5b6472;
	--rule: #dfe3e9;
	--accent: #4f46e5;
	--code-bg: #f5f6f8;
	--sans: "Segoe UI", -apple-system, Roboto, Helvetica, Arial, sans-serif;
	--serif: Georgia, "Times New Roman", serif;
	--mono: "Cascadia Mono", Consolas, "SF Mono", Menlo, monospace;
}

* { box-sizing: border-box; }

body {
	margin: 0;
	font-family: var(--serif);
	font-size: 10.5pt;
	line-height: 1.6;
	color: var(--ink);
	background: #fff;
	-webkit-print-color-adjust: exact;
	print-color-adjust: exact;
}

h1, h2, h3, h4 { font-family: var(--sans); line-height: 1.25; }

/* ---- cover ---- */
.jh-cover {
	height: 247mm;
	display: flex;
	flex-direction: column;
	justify-content: center;
	page-break-after: always;
	border-top: 6px solid var(--accent);
	padding-top: 14mm;
}
.jh-cover-mark {
	font-family: var(--mono);
	font-size: 46pt;
	font-weight: 700;
	color: var(--accent);
	letter-spacing: 2px;
	margin-bottom: 6mm;
}
.jh-cover h1 { font-size: 34pt; margin: 0 0 3mm; letter-spacing: -0.5px; }
.jh-cover-tagline { font-size: 13pt; color: var(--muted); margin: 0 0 14mm; max-width: 120mm; }
.jh-cover-meta { margin: 0 0 14mm; border-top: 1px solid var(--rule); padding-top: 6mm; max-width: 120mm; }
.jh-cover-meta > div { display: flex; gap: 8mm; padding: 1.6mm 0; }
.jh-cover-meta dt { font-family: var(--sans); font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); width: 26mm; flex: 0 0 26mm; }
.jh-cover-meta dd { margin: 0; }
.jh-cover-foot { font-size: 9pt; color: var(--muted); font-style: italic; margin: 0; }

/* ---- sections ---- */
.jh-page { page-break-before: always; }
.jh-section { margin-bottom: 8mm; }

h2 {
	font-size: 17pt;
	margin: 0 0 5mm;
	padding-bottom: 2.5mm;
	border-bottom: 2px solid var(--accent);
	display: flex;
	align-items: baseline;
	gap: 4mm;
}
.jh-num { color: var(--accent); font-variant-numeric: tabular-nums; }
.jh-count { margin-left: auto; font-size: 8.5pt; font-weight: 400; color: var(--muted); letter-spacing: 0.04em; text-transform: uppercase; }

h3 { font-size: 11.5pt; margin: 6mm 0 2.5mm; }
h3.jh-gallery-title { margin-top: 7mm; padding-bottom: 1.5mm; border-bottom: 1px solid var(--rule); color: var(--muted); font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.08em; }
p { margin: 0 0 3mm; }

/* ---- table of contents ---- */
.jh-toc { list-style: none; margin: 0 0 8mm; padding: 0; columns: 2; column-gap: 12mm; }
.jh-toc li { display: flex; gap: 4mm; padding: 1.2mm 0; break-inside: avoid; border-bottom: 1px dotted var(--rule); }
.jh-toc-sub { padding-left: 6mm !important; font-size: 9.5pt; color: var(--muted); }
.jh-toc-num { font-family: var(--mono); font-size: 8.5pt; color: var(--accent); width: 11mm; flex: 0 0 11mm; }
.jh-toc a { color: inherit; text-decoration: none; }

/* ---- prose bits ---- */
.jh-note {
	background: #f6f7fb;
	border-left: 3px solid var(--accent);
	padding: 3mm 4mm;
	margin: 4mm 0;
	font-size: 9.5pt;
	break-inside: avoid;
}
.jh-bullets { margin: 0 0 4mm; padding-left: 5mm; }
.jh-bullets li { margin-bottom: 1.5mm; }
.jh-steps-doc { padding-left: 5mm; margin: 0 0 4mm; }
.jh-steps-doc li { margin-bottom: 2.5mm; }

code { font-family: var(--mono); font-size: 0.88em; background: var(--code-bg); padding: 0.5mm 1.2mm; border-radius: 2px; }
kbd {
	font-family: var(--sans); font-size: 8.5pt; border: 1px solid var(--rule);
	border-bottom-width: 2px; border-radius: 3px; padding: 0.3mm 1.5mm; background: #fafbfc;
}

/* ---- tables ---- */
.jh-table { width: 100%; border-collapse: collapse; margin: 3mm 0 5mm; font-size: 9.5pt; }
.jh-table th {
	text-align: left; font-family: var(--sans); font-size: 8.5pt; text-transform: uppercase;
	letter-spacing: 0.06em; color: var(--muted); border-bottom: 1.5px solid var(--rule);
	padding: 2mm 3mm 1.5mm 0;
}
.jh-table td { padding: 2mm 3mm 2mm 0; border-bottom: 1px solid var(--rule); vertical-align: top; }
.jh-table tr { break-inside: avoid; }
.jh-index td:first-child { white-space: nowrap; }
.jh-dash { color: var(--muted); }

/* ---- block reference entries ---- */
.jh-entry { break-inside: avoid; margin: 0 0 6mm; }
.jh-entry-head { display: flex; align-items: baseline; gap: 2.5mm; margin-bottom: 2mm; flex-wrap: wrap; }
.jh-entry-head h3 { margin: 0; font-size: 11pt; }
.jh-swatch {
	width: 3.2mm; height: 3.2mm; border-radius: 50%; flex: 0 0 auto;
	align-self: center; box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
.jh-id { background: #eef0ff; color: var(--accent); font-size: 8.5pt; }
.jh-aliases { font-size: 8.5pt; color: var(--muted); font-family: var(--sans); }
.jh-aliases code { background: none; color: var(--muted); font-size: 8.5pt; }

.jh-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-items: start; }
.jh-cols-tight { margin: 3mm 0 5mm; }
.jh-col { min-width: 0; }
.jh-col-label {
	font-family: var(--sans); font-size: 7.5pt; text-transform: uppercase;
	letter-spacing: 0.09em; color: var(--muted); margin-bottom: 1.5mm;
}

.jh-source {
	font-family: var(--mono); font-size: 8pt; line-height: 1.5;
	background: var(--code-bg); border: 1px solid var(--rule); border-radius: 3px;
	padding: 2.5mm 3mm; margin: 0; white-space: pre-wrap; word-break: break-word;
}
.jh-source code { background: none; padding: 0; font-size: inherit; }

/* ---- preview panes: a small slice of the Joplin note viewer ---- */
.jh-preview {
	--joplin-background-color: #ffffff;
	--joplin-color: #24292e;
	font-family: var(--sans);
	font-size: 9pt;
	background: #fff;
	border: 1px solid var(--rule);
	border-radius: 3px;
	padding: 3mm;
}
.jh-preview > .jhtml:first-child { margin-top: 0; }
.jh-preview > .jhtml:last-child { margin-bottom: 0; }
.jh-preview p { margin: 0 0 0.6em; }
.jh-preview p:last-child { margin-bottom: 0; }
.jh-preview h3 { margin: 0 0 0.4em; font-size: 10pt; }
.jh-preview code { font-size: 8pt; }

/* ---- galleries ---- */
.jh-gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 5mm; }
.jh-tile { margin: 0; break-inside: avoid; }
.jh-tile figcaption { display: flex; align-items: center; gap: 2mm; margin-bottom: 1.5mm; font-size: 8.5pt; }
.jh-tile figcaption code { background: none; padding: 0; color: var(--accent); }

/* ---- repeating footer ---- */
.jh-running-foot {
	position: fixed;
	bottom: -12mm;
	left: 0;
	right: 0;
	font-family: var(--sans);
	font-size: 7.5pt;
	color: var(--muted);
	letter-spacing: 0.05em;
	border-top: 1px solid var(--rule);
	padding-top: 1.5mm;
}
`;
}

// --------------------------------------------------------------------------
// Output
// --------------------------------------------------------------------------

fs.mkdirSync(docsDir, { recursive: true });

const htmlPath = path.join(docsDir, 'manual.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`Wrote ${path.relative(rootDir, htmlPath)}`);

const CHROME_CANDIDATES = [
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	`${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium',
];

const chrome = CHROME_CANDIDATES.find(candidate => candidate && fs.existsSync(candidate));
if (!chrome) {
	console.error('No Chrome or Edge found - open docs/manual.html and print to PDF manually.');
	process.exit(1);
}

const pdfPath = path.join(docsDir, 'HTML-Blocks-Manual.pdf');
const profileDir = path.join(require('os').tmpdir(), 'jhtml-manual-profile');

execFileSync(chrome, [
	'--headless=new',
	'--disable-gpu',
	`--user-data-dir=${profileDir}`,
	'--no-pdf-header-footer',
	'--print-to-pdf-no-header',
	`--print-to-pdf=${pdfPath}`,
	`file:///${htmlPath.replace(/\\/g, '/')}`,
], { stdio: 'inherit' });

const size = fs.statSync(pdfPath).size;
console.log(`Wrote ${path.relative(rootDir, pdfPath)} (${(size / 1024).toFixed(0)} KB)`);
