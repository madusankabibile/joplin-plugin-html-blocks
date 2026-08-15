// The fence syntax, in one place, so the viewer and the editor can never
// disagree about what is a block and what is not.
//
//     !!! card_light_blue My card title
//     Card contents
//     !!!->
//
// The closing fence may be written `!!!->`, `!!!<-` or just `!!!`.
// A type must start with a letter, which is what keeps `!!!->` from ever
// looking like an opening fence.

export const OPEN_RE = /^(\s{0,3})(!!!)[ \t]*([A-Za-z][A-Za-z0-9_-]*)[ \t]*(.*)$/;
export const CLOSE_RE = /^\s{0,3}!!!(?:->|<-)?[ \t]*$/;

export interface OpenFence {
	type: string;
	title: string;
	/** Offsets within the line, for editor decorations. */
	markerStart: number;
	markerEnd: number;
	typeStart: number;
	typeEnd: number;
	titleStart: number;
}

export const parseOpenFence = (line: string): OpenFence | null => {
	const m = OPEN_RE.exec(line);
	if (!m) return null;

	const indent = m[1].length;
	const markerStart = indent;
	const markerEnd = markerStart + m[2].length;
	const typeStart = line.indexOf(m[3], markerEnd);
	const typeEnd = typeStart + m[3].length;
	const title = m[4].trim();

	return {
		type: m[3],
		title,
		markerStart,
		markerEnd,
		typeStart,
		typeEnd,
		titleStart: title ? line.indexOf(title, typeEnd) : typeEnd,
	};
};

export const isCloseFence = (line: string): boolean => CLOSE_RE.test(line);

/** The separator used inside `steps`, `timeline`, `stats` and `keyvalue` blocks. */
export const FIELD_SEPARATOR = '::';

/** The line that splits a `grid` block into cells. */
export const isCellSeparator = (line: string): boolean => /^\s{0,3}(-{3,}|\+{3,})\s*$/.test(line);

export const splitFields = (line: string): string[] => {
	return line.split(FIELD_SEPARATOR).map(part => part.trim());
};
