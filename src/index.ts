import joplin from 'api';
import {
	ContentScriptType,
	MenuItem,
	MenuItemLocation,
	SettingItemType,
	ToolbarButtonLocation,
} from 'api/types';
import {
	BlockDefinition,
	blocks,
	blocksInCategory,
	buildSnippet,
	categories,
	commandNameFor,
	resolveBlock,
} from './blocks';

const MARKDOWN_IT_SCRIPT_ID = 'htmlBlocks.markdownIt';
const CODE_MIRROR_SCRIPT_ID = 'htmlBlocks.codeMirror';
const PICKER_COMMAND = 'htmlBlocks.showPicker';
const CHEAT_SHEET_COMMAND = 'htmlBlocks.insertCheatSheet';

/**
 * Inserts a block at the cursor. The markdown editor gets the rich treatment
 * (wraps the selection, then selects the title placeholder); anything else
 * falls back to a plain text insertion.
 */
const insertBlock = async (blockId: string) => {
	const def = resolveBlock(blockId);
	if (!def) return;

	try {
		await joplin.commands.execute('editor.execCommand', {
			name: 'htmlBlocks.insert',
			args: [def.id],
		});
	} catch (_error) {
		const selected = await joplin.commands.execute('selectedText').catch(() => '');
		const snippet = buildSnippet(def, selected && selected.trim() ? { body: selected } : {});
		await joplin.commands.execute('insertText', snippet.text);
	}
};

const escapeHtml = (text: string): string => text
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

const pickerHtml = (): string => {
	const sections = categories().map(category => {
		const cards = blocksInCategory(category).map(block => {
			const sample = `!!! ${block.id}${block.titleHint ? ` ${block.titleHint}` : ''}`;
			return `
				<button type="button" class="block-card" data-id="${escapeHtml(block.id)}"
						data-search="${escapeHtml(`${block.id} ${block.label} ${category}`.toLowerCase())}">
					<span class="swatch" style="background:${escapeHtml(block.color)}"></span>
					<span class="block-text">
						<span class="block-label">${escapeHtml(block.icon ? `${block.icon} ` : '')}${escapeHtml(block.label)}</span>
						<code class="block-sample">${escapeHtml(sample)}</code>
					</span>
				</button>`;
		}).join('');

		return `<section class="category" data-category="${escapeHtml(category)}">
			<h3>${escapeHtml(category)}</h3>
			<div class="cards">${cards}</div>
		</section>`;
	}).join('');

	return `
		<form name="blockForm" id="jhtml-picker">
			<h2>Insert an HTML block</h2>
			<input type="text" id="jhtml-search" placeholder="Filter blocks..." autocomplete="off">
			<input type="hidden" name="blockId" id="jhtml-selected" value="${escapeHtml(blocks[0].id)}">
			<div id="jhtml-list">${sections}</div>
			<p class="hint">Select a block, then press OK. Any text you had selected becomes the block body.</p>
		</form>`;
};

const cheatSheet = (): string => {
	const parts = ['# HTML Blocks cheat sheet\n'];
	let currentCategory = '';

	for (const block of blocks) {
		if (block.category !== currentCategory) {
			currentCategory = block.category;
			parts.push(`\n## ${currentCategory}\n`);
		}
		parts.push(buildSnippet(block).text);
		parts.push('');
	}

	return parts.join('\n');
};

const registerBlockCommands = async () => {
	for (const block of blocks) {
		await joplin.commands.register({
			name: commandNameFor(block),
			label: `Insert block: ${block.label}`,
			execute: async () => insertBlock(block.id),
		});
	}
};

const buildMenu = (): MenuItem[] => {
	const items: MenuItem[] = [
		{ commandName: PICKER_COMMAND, label: 'Insert block...', accelerator: 'CmdOrCtrl+Alt+H' },
		{ type: 'separator' },
	];

	for (const category of categories()) {
		items.push({
			label: category,
			type: 'submenu',
			submenu: blocksInCategory(category).map((block: BlockDefinition) => ({
				commandName: commandNameFor(block),
				label: block.label,
			})),
		});
	}

	items.push({ type: 'separator' });
	items.push({ commandName: CHEAT_SHEET_COMMAND, label: 'Insert cheat sheet' });

	return items;
};

joplin.plugins.register({
	onStart: async () => {
		// -------------------------------------------------------------
		// Settings
		// -------------------------------------------------------------
		await joplin.settings.registerSection('htmlBlocks', {
			label: 'HTML Blocks',
			iconName: 'fas fa-layer-group',
		});

		await joplin.settings.registerSettings({
			editorHighlighting: {
				value: true,
				type: SettingItemType.Bool,
				section: 'htmlBlocks',
				public: true,
				label: 'Highlight blocks in the markdown editor',
				description: 'Reopen the note for a change to take effect.',
			},
			showToolbarButton: {
				value: true,
				type: SettingItemType.Bool,
				section: 'htmlBlocks',
				public: true,
				label: 'Show the toolbar button',
				description: 'Restart Joplin for a change to take effect.',
			},
		});

		// -------------------------------------------------------------
		// Content scripts
		// -------------------------------------------------------------
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			MARKDOWN_IT_SCRIPT_ID,
			'./markdownItPlugin/index.js',
		);

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			CODE_MIRROR_SCRIPT_ID,
			'./codeMirrorPlugin/index.js',
		);

		await joplin.contentScripts.onMessage(CODE_MIRROR_SCRIPT_ID, async (message: any) => {
			if (message && message.type === 'getSettings') {
				return {
					editorHighlighting: await joplin.settings.value('editorHighlighting'),
				};
			}
			return null;
		});

		// -------------------------------------------------------------
		// Picker dialog
		// -------------------------------------------------------------
		const dialog = await joplin.views.dialogs.create('htmlBlocksPicker');
		await joplin.views.dialogs.setHtml(dialog, pickerHtml());
		await joplin.views.dialogs.addScript(dialog, './dialog/dialog.css');
		await joplin.views.dialogs.addScript(dialog, './dialog/dialog.js');
		await joplin.views.dialogs.setButtons(dialog, [
			{ id: 'ok', title: 'Insert' },
			{ id: 'cancel', title: 'Cancel' },
		]);

		// -------------------------------------------------------------
		// Commands
		// -------------------------------------------------------------
		await registerBlockCommands();

		await joplin.commands.register({
			name: PICKER_COMMAND,
			label: 'Insert HTML block...',
			iconName: 'fas fa-layer-group',
			execute: async () => {
				const result = await joplin.views.dialogs.open(dialog);
				if (result.id !== 'ok') return;

				const blockId = result.formData && result.formData.blockForm
					? result.formData.blockForm.blockId
					: '';
				if (blockId) await insertBlock(blockId);
			},
		});

		await joplin.commands.register({
			name: CHEAT_SHEET_COMMAND,
			label: 'Insert HTML blocks cheat sheet',
			execute: async () => {
				await joplin.commands.execute('insertText', cheatSheet());
			},
		});

		// -------------------------------------------------------------
		// Menus and toolbar
		// -------------------------------------------------------------
		await joplin.views.menus.create(
			'htmlBlocksMenu',
			'HTML Blocks',
			buildMenu(),
			MenuItemLocation.Tools,
		);

		if (await joplin.settings.value('showToolbarButton')) {
			await joplin.views.toolbarButtons.create(
				'htmlBlocksToolbarButton',
				PICKER_COMMAND,
				ToolbarButtonLocation.EditorToolbar,
			);
		}
	},
});
