import { BlockDefinition, Snippet } from './types';
import blocksJson from './blocks.json';

export * from './types';
export * from './syntax';

export const blocks: BlockDefinition[] = (blocksJson as { blocks: BlockDefinition[] }).blocks;

const byId: Record<string, BlockDefinition> = {};
for (const block of blocks) {
	byId[block.id.toLowerCase()] = block;
	for (const alias of block.aliases || []) byId[alias.toLowerCase()] = block;
}

/** Looks up a block by its id or by any of its aliases. Case insensitive. */
export const resolveBlock = (type: string): BlockDefinition | null => {
	if (!type) return null;
	return byId[type.toLowerCase()] || null;
};

export const categories = (): string[] => {
	const seen: string[] = [];
	for (const block of blocks) {
		if (!seen.includes(block.category)) seen.push(block.category);
	}
	return seen;
};

export const blocksInCategory = (category: string): BlockDefinition[] =>
	blocks.filter(block => block.category === category);

export const commandNameFor = (block: BlockDefinition): string => `htmlBlocks.insert.${block.id}`;

interface SnippetOptions {
	/** Text to use as the body - typically whatever the author had selected. */
	body?: string;
	/** Text to use as the title. */
	title?: string;
}

/**
 * Builds the text inserted into the note, plus the range of the placeholder
 * that should end up selected so the author can start typing straight away.
 */
export const buildSnippet = (block: BlockDefinition, options: SnippetOptions = {}): Snippet => {
	const title = options.title !== undefined ? options.title : (block.titleHint || '');
	const body = options.body !== undefined ? options.body : (block.bodyHint || '');

	const openLine = title ? `!!! ${block.id} ${title}` : `!!! ${block.id}`;

	let selectionStart: number;
	let selectionEnd: number;

	if (title) {
		selectionStart = openLine.length - title.length;
		selectionEnd = openLine.length;
	} else {
		// No title for this block type - select the first body line instead.
		const firstLine = body.split('\n')[0];
		selectionStart = openLine.length + 1;
		selectionEnd = selectionStart + firstLine.length;
	}

	const text = `${openLine}\n${body}\n!!!->\n`;

	return { text, selectionStart, selectionEnd };
};
