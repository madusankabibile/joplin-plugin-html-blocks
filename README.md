# HTML Blocks - a Joplin plugin

Write styled HTML sections in your notes with a simple markdown fence. No HTML,
no inline CSS.

```
!!! card_light_blue My card title
Card contents, with the usual **markdown** you'd expect.
!!!->
```

...renders as a light blue card in the note viewer, in exported HTML and in PDF
exports. 47 block types are included: cards, admonition-style callouts, six list
styles, steps, timelines, stat tiles, grids, banners, collapsible sections and
more.

## Installation

Search for **HTML Blocks** in *Tools &rarr; Options &rarr; Plugins*, or install
`com.madusanka.htmlBlocks.jpl` with *Install from file*. Requires Joplin 3.0 or
later on desktop.

## Documentation

[**User manual (PDF)**](docs/HTML-Blocks-Manual.pdf) - 20 pages covering every
block, with a rendered preview beside the markdown for each one. It is generated
by the plugin's own renderer via `npm run manual`, so the previews always match
what Joplin actually draws.

## The syntax

```
!!! <type> <optional title>
<contents>
!!!->
```

* The opening fence is `!!!` followed by a block type. A type always starts with
  a letter, which is what keeps it from being confused with a closing fence.
* Anything after the type on the same line is the block **title**. It is
  optional, and inline markdown works in it.
* The closing fence can be written `!!!->`, `!!!<-`, or just `!!!`.
* Blocks **nest**. A card can contain a callout, which can contain a list.
* An unclosed block runs to the end of the note rather than disappearing, so the
  preview stays useful while you are still typing.
* An unrecognised type still renders (as a plain dashed box with the type shown
  in the corner) instead of silently vanishing.

Most blocks treat their contents as ordinary markdown. The list-like ones
(`list_*`, `steps`, `timeline`, `stats`, `keyvalue`, `badges`) treat **one line
as one item** instead, and split fields on `::`:

```
!!! steps How it works
Install it :: Download and run the installer
Configure it :: Open the settings screen
Use it :: You are done
!!!->
```

Grids split their cells on a `---` line:

```
!!! grid_2 Two things
**Left**

Left hand contents
---
**Right**

Right hand contents
!!!->
```

## Inserting blocks

Three ways, whichever suits you:

* **Toolbar button** in the editor, or **Ctrl+Alt+H** - opens a searchable
  picker. If you had text selected, it becomes the body of the new block.
* **Tools → HTML Blocks** - every block, grouped by category.
* **Command palette** - type "Insert block" and the block name.

**Tools → HTML Blocks → Insert cheat sheet** drops one example of every single
block type into the current note, which is the quickest way to see what they all
look like.

## Block reference

**Cards** - a titled, tinted box with a coloured left edge.

| Type | Renders | Aliases |
|---|---|---|
| `card_light_blue` | Light blue card | `card_lightblue`, `card_sky` |
| `card_blue` | Blue card | |
| `card_indigo` | Indigo card | |
| `card_teal` | Teal card | |
| `card_green` | Green card | |
| `card_light_green` | Light green card | `card_lightgreen`, `card_lime` |
| `card_yellow` | Yellow card | |
| `card_orange` | Orange card | |
| `card_red` | Red card | |
| `card_pink` | Pink card | |
| `card_purple` | Purple card | |
| `card_gray` | Gray card | `card_grey` |
| `card_dark` | Dark card | |

**Callouts** - like cards, but with an icon and a default title, in the style of
the admonition plugin.

| Type | Renders | Aliases |
|---|---|---|
| `callout_info` | ℹ️ Info | `info` |
| `callout_tip` | 💡 Tip | `tip`, `hint` |
| `callout_note` | 📝 Note | `note` |
| `callout_success` | ✅ Success | `success`, `done` |
| `callout_warning` | ⚠️ Warning | `warning`, `caution` |
| `callout_danger` | ⛔ Danger | `danger`, `error` |
| `callout_question` | ❓ Question | `question`, `faq` |
| `callout_example` | 🧪 Example | `example` |
| `callout_bug` | 🐛 Bug | `bug` |
| `callout_todo` | 📌 To do | `todo` |

**Lists** - one line per item. A leading `-` is optional, and two spaces of
indentation nests an item one level (up to three).

| Type | Renders |
|---|---|
| `list_style1` | Coloured dot bullets |
| `list_style2` | Numbered circles |
| `list_style3` | Check marks |
| `list_style4` | Arrows |
| `list_style5` | Boxed rows |
| `list_style6` | Rows separated by rules |
| `list_check` | Checkboxes - prefix a line with `[x]` or `[ ]` |

**Layout**

| Type | Renders | Line format |
|---|---|---|
| `steps` | Numbered steps joined by a rail | `title :: description` |
| `timeline` | Vertical timeline | `when :: title :: description` |
| `stats` | Row of big-number tiles | `value :: label` |
| `grid_2` | Two column grid of cards | cells split on `---` |
| `grid_3` | Three column grid of cards | cells split on `---` |
| `columns_2` | Two plain columns, no card chrome | cells split on `---` |

**Boxes**

| Type | Renders | Aliases |
|---|---|---|
| `box_plain` | Neutral box | |
| `box_dashed` | Dashed outline box | |
| `box_shadow` | Box with a drop shadow | |
| `banner` | Gradient banner, white text | |
| `hero` | Large centred hero section | |
| `highlight` | Thick coloured left strip | `highlight_box` |

**Special**

| Type | Renders | Aliases |
|---|---|---|
| `quote_box` | Pull quote; the title becomes the attribution | `quote` |
| `details` | Collapsible `<details>` section | `collapse`, `spoiler` |
| `details_open` | Collapsible, expanded by default | |
| `badges` | Row of pill badges, split on commas and newlines | |
| `keyvalue` | Two column key/value table (`key :: value`) | `kv`, `fields` |

## Editor highlighting

In the markdown editor the fences are coloured with the block's own colour, the
lines inside get a tinted background and a coloured left bar, and nested blocks
are indented. An unknown block type is underlined in red so typos are obvious
before you switch to the viewer.

Turn it off in **Tools → Options → HTML Blocks** if you'd rather not have it.

## Theming

Every block derives all of its colours from one base colour, mixed against the
current Joplin theme with `color-mix()`. That means the blocks follow your theme
automatically - no separate dark mode stylesheet, and no hard-coded white
backgrounds glaring at you in dark mode. On renderers without `color-mix()`
support the blocks fall back to plain outlines.

To restyle a block yourself, target it in your userstyle:

```css
/* every block carries its type in a data attribute */
.jhtml[data-jhtml-type="card_light_blue"] { --jh-color: #ff00aa; }
```

## Adding your own block types

`src/blocks/blocks.json` is the single source of truth. Add an entry:

```json
{
	"id": "card_brown",
	"label": "Brown card",
	"category": "Cards",
	"mode": "card",
	"color": "#92400e",
	"titleHint": "Card title",
	"bodyHint": "Card contents"
}
```

...then `npm run dist`. The new type is immediately available in the parser, the
viewer stylesheet, the editor highlighter, the menus and the picker dialog -
there is nowhere else to register it.

`mode` picks the renderer: `card`, `callout`, `plain`, `quote`, `details`,
`grid`, `list`, `steps`, `timeline`, `stats`, `badges` or `keyvalue`. The
remaining fields (`icon`, `defaultTitle`, `variant`, `listStyle`, `ordered`,
`columns`, `bare`, `open`, `aliases`) are documented in `src/blocks/types.ts`.

## Building

```sh
npm install
npm run dist
```

That regenerates the stylesheets, compiles everything and writes
`publish/com.madusanka.htmlBlocks.jpl`.

To install the built plugin: **Tools → Options → Plugins → the gear icon →
Install from file**, and pick the `.jpl`.

For development, point **Tools → Options → Plugins → Advanced → Development
plugins** at this folder (`H:\Projects\joplin_html`) and restart Joplin. Joplin
then loads `dist/` directly, so a `npm run dist` plus a restart picks up your
changes.

## Layout

```
src/
  index.ts                  main script: settings, commands, menus, picker dialog
  blocks/
    blocks.json             the registry - every block type lives here
    types.ts                registry types
    syntax.ts               the fence grammar, shared by viewer and editor
    index.ts                lookup helpers and the snippet builder
  markdownItPlugin/         markdown-it content script (the viewer)
  codeMirrorPlugin/         CodeMirror 6 content script (the editor)
  dialog/                   assets for the block picker
tools/
  generate-styles.js        builds both stylesheets from the registry
  styles/                   hand written CSS the generator wraps
```

`src/markdownItPlugin/style.css` and `src/codeMirrorPlugin/style.css` are
generated - edit `tools/styles/*.css` instead.
