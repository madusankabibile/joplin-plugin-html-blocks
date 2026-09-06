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
import { pickerHtml, withRecent } from './picker';

const MARKDOWN_IT_SCRIPT_ID = 'htmlBlocks.markdownIt';
const CODE_MIRROR_SCRIPT_ID = 'htmlBlocks.codeMirror';
const PICKER_COMMAND = 'htmlBlocks.showPicker';
const CHEAT_SHEET_COMMAND = 'htmlBlocks.insertCheatSheet';
const RECENT_SETTING = 'recentBlocks';

/** The ids of the blocks inserted most recently, newest first. */
const readRecent = async (): Promise<string[]> => {
	try {
		const raw = await joplin.settings.value(RECENT_SETTING);
		const parsed = JSON.parse(raw || '[]');
		return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
	} catch (_error) {
		return [];
	}
};

const rememberBlock = async (blockId: string) => {
	const recent = withRecent(await readRecent(), blockId);
	await joplin.settings.setValue(RECENT_SETTING, JSON.stringify(recent));
};

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

	await rememberBlock(def.id);
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
			showPickerPreviews: {
				value: true,
				type: SettingItemType.Bool,
				section: 'htmlBlocks',
				public: true,
				label: 'Show previews in the block picker',
				description: 'Draw every block in the picker instead of listing names only.',
			},
			[RECENT_SETTING]: {
				value: '[]',
				type: SettingItemType.String,
				section: 'htmlBlocks',
				public: false,
				label: 'Recently used blocks',
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
		// The thumbnails are real blocks, so they need the viewer's own rules.
		// Those are inlined into the HTML by `pickerHtml` rather than linked
		// here: Joplin replaces the dialog's content on every open, and the
		// previews are the one thing that must not depend on a second file
		// resolving inside the dialog frame.
		await joplin.views.dialogs.addScript(dialog, './dialog/dialog.css');
		await joplin.views.dialogs.addScript(dialog, './dialog/dialog.js');
		await joplin.views.dialogs.setButtons(dialog, [
			{ id: 'ok', title: 'Insert' },
			{ id: 'cancel', title: 'Cancel' },
		]);

		// Rebuilt on every open so the "recently used" row is up to date.
		const refreshDialog = async () => {
			await joplin.views.dialogs.setHtml(dialog, pickerHtml({
				previews: await joplin.settings.value('showPickerPreviews'),
				recent: await readRecent(),
			}));
		};

		await refreshDialog();

		// -------------------------------------------------------------
		// Commands
		// -------------------------------------------------------------
		await registerBlockCommands();

		await joplin.commands.register({
			name: PICKER_COMMAND,
			label: 'Insert HTML block...',
			iconName: 'fas fa-layer-group',
			execute: async () => {
				await refreshDialog();

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
		// Toolbar and menus
		// -------------------------------------------------------------
		// The editor toolbar exists on both desktop and mobile, so it is
		// registered first: it is the only entry point on mobile.
		if (await joplin.settings.value('showToolbarButton')) {
			await joplin.views.toolbarButtons.create(
				'htmlBlocksToolbarButton',
				PICKER_COMMAND,
				ToolbarButtonLocation.EditorToolbar,
			);
		}

		// `views.menus` is desktop-only - mobile has no menu bar - so a failure
		// here must not abort onStart and take the rest of the plugin with it.
		try {
			await joplin.views.menus.create(
				'htmlBlocksMenu',
				'HTML Blocks',
				buildMenu(),
				MenuItemLocation.Tools,
			);
		} catch (_error) {
			// No menu bar on this platform.
		}
	},
});
