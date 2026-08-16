// Generates the plugin icon set and the promo tile in /images.
//
//   node tools/generate-icons.js
//
// Everything is drawn from signed distance fields and written out with a
// minimal PNG encoder, so there are no image dependencies to install and the
// artwork can be regenerated from source at any size.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.resolve(__dirname, '..', 'images');

// ---------------------------------------------------------------- PNG output

function crc32(buf) {
	let table = crc32.table;
	if (!table) {
		table = crc32.table = new Int32Array(256);
		for (let n = 0; n < 256; n++) {
			let c = n;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			table[n] = c;
		}
	}
	let c = -1;
	for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	return (c ^ -1) >>> 0;
}

function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body), 0);
	return Buffer.concat([len, body, crc]);
}

// pixels: Uint8Array of RGBA, alpha = true keeps the alpha channel.
function encodePng(width, height, pixels, alpha) {
	const channels = alpha ? 4 : 3;
	const raw = Buffer.alloc(height * (1 + width * channels));
	let p = 0;
	for (let y = 0; y < height; y++) {
		raw[p++] = 0; // filter: none
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			raw[p++] = pixels[i];
			raw[p++] = pixels[i + 1];
			raw[p++] = pixels[i + 2];
			if (alpha) raw[p++] = pixels[i + 3];
		}
	}

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = alpha ? 6 : 2; // colour type
	ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

// ------------------------------------------------------------------- drawing

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;
const hex = h => [
	parseInt(h.substr(1, 2), 16),
	parseInt(h.substr(3, 2), 16),
	parseInt(h.substr(5, 2), 16),
];

// A canvas of `w` x `h` pixels covering `uw` x `uh` drawing units, so the same
// artwork description renders at every icon size.
class Canvas {
	constructor(w, h, uw, uh) {
		this.w = w;
		this.h = h;
		this.sx = uw / w;
		this.sy = uh / h;
		this.px = Math.max(this.sx, this.sy); // one pixel, in units
		this.data = new Float64Array(w * h * 4); // straight RGBA, 0..1
	}

	// sdf(x, y) < 0 inside. colour is [r,g,b] 0..255 or a function of (x, y).
	// blur softens the edge outwards (used for shadows), clip limits the area.
	paint(sdf, colour, opts = {}) {
		const { alpha = 1, blur = 0, clip = null } = opts;
		const feather = blur > 0 ? blur : this.px;
		const constant = typeof colour === 'function' ? null : colour;

		for (let py = 0; py < this.h; py++) {
			const y = (py + 0.5) * this.sy;
			if (clip && (y < clip[1] || y > clip[3])) continue;
			for (let px = 0; px < this.w; px++) {
				const x = (px + 0.5) * this.sx;
				if (clip && (x < clip[0] || x > clip[2])) continue;

				const d = sdf(x, y);
				let cov = blur > 0
					? clamp(1 - d / feather, 0, 1)
					: clamp(0.5 - d / feather, 0, 1);
				if (cov <= 0) continue;
				cov *= alpha;

				const c = constant || colour(x, y);
				const i = (py * this.w + px) * 4;
				const a = this.data[i + 3];
				const na = cov + a * (1 - cov);
				for (let k = 0; k < 3; k++) {
					const src = c[k] / 255;
					this.data[i + k] = (src * cov + this.data[i + k] * a * (1 - cov)) / na;
				}
				this.data[i + 3] = na;
			}
		}
	}

	toPng(alpha) {
		const out = new Uint8Array(this.w * this.h * 4);
		for (let i = 0; i < this.w * this.h; i++) {
			const a = this.data[i * 4 + 3];
			for (let k = 0; k < 3; k++) {
				// Composite onto white when flattening, so the promo tile has
				// no alpha as the Joplin manifest requires.
				const v = alpha ? this.data[i * 4 + k] : mix(1, this.data[i * 4 + k], a);
				out[i * 4 + k] = Math.round(clamp(v, 0, 1) * 255);
			}
			out[i * 4 + 3] = Math.round(clamp(a, 0, 1) * 255);
		}
		return encodePng(this.w, this.h, out, alpha);
	}
}

// ---------------------------------------------------------------------- SDFs

const sdBox = (x0, y0, w, h, r = 0) => (x, y) => {
	const qx = Math.abs(x - (x0 + w / 2)) - (w / 2 - r);
	const qy = Math.abs(y - (y0 + h / 2)) - (h / 2 - r);
	const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
	return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
};

// Line segment of thickness t with square-ish caps.
const sdSegment = (x1, y1, x2, y2, t) => (x, y) => {
	const dx = x2 - x1, dy = y2 - y1;
	const len2 = dx * dx + dy * dy;
	const h = clamp(((x - x1) * dx + (y - y1) * dy) / len2, 0, 1);
	return Math.hypot(x - x1 - dx * h, y - y1 - dy * h) - t / 2;
};

// Elliptical ring, optionally limited to an angle range (degrees, y down,
// measured counter-clockwise from east).
const sdArc = (cx, cy, rx, ry, t, a0 = 0, a1 = 360) => {
	const s0 = (a0 * Math.PI) / 180, s1 = (a1 * Math.PI) / 180;
	return (x, y) => {
		const nx = (x - cx) / rx, ny = -(y - cy) / ry;
		const len = Math.hypot(nx, ny) || 1e-6;
		// Gradient normalisation, so the stroke keeps an even weight all the
		// way round the ellipse instead of swelling along the flatter axis.
		const grad = Math.hypot(nx / rx, ny / ry) / len || 1e-6;
		let ang = Math.atan2(ny, nx);
		while (ang < s0) ang += Math.PI * 2;
		if (ang <= s1) return Math.abs((len - 1) / grad) - t / 2;
		// Outside the sweep: fall back to the distance to the nearest cap.
		const cap = a => Math.hypot(x - (cx + Math.cos(a) * rx), y - (cy - Math.sin(a) * ry)) - t / 2;
		return Math.min(cap(s0), cap(s1));
	};
};

const union = (...fns) => (x, y) => {
	let m = Infinity;
	for (const f of fns) {
		const d = f(x, y);
		if (d < m) m = d;
	}
	return m;
};

const linearGradient = (x0, y0, x1, y1, from, to) => {
	const a = hex(from), b = hex(to);
	const dx = x1 - x0, dy = y1 - y0;
	const len2 = dx * dx + dy * dy;
	return (x, y) => {
		const t = clamp(((x - x0) * dx + (y - y0) * dy) / len2, 0, 1);
		return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
	};
};

// ------------------------------------------------------------------ the mark

const BLUE = '#1d4ed8';
const CYAN = '#06b6d4';
const AMBER = '#f59e0b';
const SHADOW = hex('#062244');

// Three stacked cards with an accent rule down their left edge: the shape of a
// `!!! card ... !!!->` block as it renders in a note.
function drawCards(c, ox, oy, s, opts = {}) {
	// At tiny sizes the shadows and the tint differences turn to mud, so the
	// small icons get a flatter, chunkier version of the same mark.
	const { shadow = true, stripe = 8, flat = false } = opts;
	const cards = [
		{ y: 0, w: 84, alpha: 1 },
		{ y: 33, w: 66, alpha: flat ? 1 : 0.93 },
		{ y: 66, w: 76, alpha: flat ? 1 : 0.86 },
	];
	const H = 22, R = 6;

	for (const card of cards) {
		const x = ox, y = oy + card.y * s, w = card.w * s, h = H * s;
		if (shadow) c.paint(sdBox(x, y + 2.5 * s, w, h, R * s), SHADOW, { alpha: 0.28 * card.alpha, blur: 4 * s });
		c.paint(sdBox(x, y, w, h, R * s), [255, 255, 255], { alpha: card.alpha });
		c.paint(sdBox(x, y, stripe * 2 * s, h, R * s), hex(AMBER), {
			alpha: card.alpha,
			clip: [x - s, y - s, x + stripe * s, y + h + s],
		});
	}
}

function buildIcon(size) {
	const c = new Canvas(size, size, 128, 128);
	const small = size <= 32;

	c.paint(sdBox(0, 0, 128, 128, small ? 22 : 28), linearGradient(0, 0, 128, 128, BLUE, CYAN));
	// A soft highlight across the top left keeps the plate from looking flat.
	if (!small) c.paint(sdBox(-40, -60, 150, 110, 40), [255, 255, 255], { alpha: 0.1, blur: 40 });
	drawCards(c, 22, 20, 1, small ? { shadow: false, stripe: 12, flat: true } : {});

	return c.toPng(true);
}

// ------------------------------------------------------------------ lettering

// A geometric uppercase alphabet, just the glyphs the promo tile needs. Each
// glyph is drawn in a box of its own width by `cap`, with stroke weight `t`,
// with the origin at its top left.
const glyphs = {
	H: (cap, t) => { const w = 0.62 * cap; return { width: w, sdf: union(
		sdBox(0, 0, t, cap), sdBox(w - t, 0, t, cap), sdBox(0, cap / 2 - t / 2, w, t)) }; },
	T: (cap, t) => { const w = 0.60 * cap; return { width: w, sdf: union(
		sdBox(0, 0, w, t), sdBox(w / 2 - t / 2, 0, t, cap)) }; },
	M: (cap, t) => { const w = 0.80 * cap; return { width: w, sdf: union(
		sdBox(0, 0, t, cap), sdBox(w - t, 0, t, cap),
		sdSegment(t / 2, t / 2, w / 2, cap * 0.58, t),
		sdSegment(w - t / 2, t / 2, w / 2, cap * 0.58, t)) }; },
	L: (cap, t) => { const w = 0.54 * cap; return { width: w, sdf: union(
		sdBox(0, 0, t, cap), sdBox(0, cap - t, w, t)) }; },
	K: (cap, t) => { const w = 0.62 * cap; return { width: w, sdf: union(
		sdBox(0, 0, t, cap),
		sdSegment(t * 0.7, cap * 0.53, w - t / 2, t / 2, t),
		sdSegment(t * 0.7, cap * 0.47, w - t / 2, cap - t / 2, t)) }; },
	B: (cap, t) => {
		const w = 0.64 * cap, cx = t * 0.8;
		const rx = w - t / 2 - cx, ry = cap / 4 - t / 2;
		return { width: w, sdf: union(
			sdBox(0, 0, t, cap),
			sdBox(0, 0, cx + rx * 0.5, t),
			sdBox(0, cap / 2 - t / 2, cx + rx * 0.5, t),
			sdBox(0, cap - t, cx + rx * 0.5, t),
			sdArc(cx, cap / 4, rx, ry, t, -90, 90),
			sdArc(cx, (cap * 3) / 4, rx, ry, t, -90, 90)) };
	},
	O: (cap, t) => { const w = 0.70 * cap; return { width: w,
		sdf: sdArc(w / 2, cap / 2, (w - t) / 2, (cap - t) / 2, t) }; },
	C: (cap, t) => { const w = 0.68 * cap; return { width: w,
		sdf: sdArc(w / 2, cap / 2, (w - t) / 2, (cap - t) / 2, t, 40, 320) }; },
	S: (cap, t) => {
		const w = 0.62 * cap, rx = (w - t) / 2, ry = (cap - t) / 4;
		return { width: w, sdf: union(
			sdArc(w / 2, t / 2 + ry, rx, ry, t, 30, 275),
			sdArc(w / 2, cap - t / 2 - ry, rx, ry, t, -155, 90)) };
	},
	'!': (cap, t) => ({ width: t, sdf: union(
		sdBox(0, 0, t, cap * 0.66, t / 2),
		sdBox(0, cap - t, t, t, t / 2)) }),
};

function drawText(c, text, x, y, cap, colour, opts = {}) {
	const { t = cap * 0.155, tracking = cap * 0.14, alpha = 1 } = opts;
	let cursor = x;
	for (const ch of text) {
		if (ch === ' ') { cursor += cap * 0.35; continue; }
		const g = glyphs[ch](cap, t);
		c.paint((px, py) => g.sdf(px - cursor, py - y), colour, { alpha });
		cursor += g.width + tracking;
	}
	return cursor - tracking;
}

function textWidth(text, cap, opts = {}) {
	const { t = cap * 0.155, tracking = cap * 0.14 } = opts;
	let total = 0;
	for (const ch of text) {
		total += (ch === ' ' ? cap * 0.35 - tracking : glyphs[ch](cap, t).width) + tracking;
	}
	return total - tracking;
}

// ---------------------------------------------------------------- promo tile

function buildPromoTile() {
	const W = 440, H = 280;
	const c = new Canvas(W, H, W, H);

	c.paint(() => -1, linearGradient(0, 0, W, H, BLUE, CYAN));
	c.paint(sdSegment(-60, 300, 260, -80, 150), [255, 255, 255], { alpha: 0.09, blur: 80 });

	drawCards(c, 32, 80, 1.5);

	const textX = 196, cap = 42;
	drawText(c, '!!!', textX, 58, 26, hex(AMBER), { t: 7, tracking: 9 });
	drawText(c, 'HTML', textX, 104, cap, [255, 255, 255]);
	drawText(c, 'BLOCKS', textX, 162, cap, [255, 255, 255]);
	c.paint(sdBox(textX, 222, textWidth('BLOCKS', cap), 5, 2.5), hex(AMBER), { alpha: 0.95 });

	return c.toPng(false);
}

// ----------------------------------------------------------------------- run

fs.mkdirSync(outDir, { recursive: true });

const written = [];
for (const size of [16, 32, 48, 128, 256]) {
	const file = path.join(outDir, `icon${size}.png`);
	fs.writeFileSync(file, buildIcon(size));
	written.push(file);
}
const promo = path.join(outDir, 'promo_tile.png');
fs.writeFileSync(promo, buildPromoTile());
written.push(promo);

for (const file of written) {
	console.info(`${path.relative(path.resolve(__dirname, '..'), file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
}
