// Picker dialog: pick a category, click a preview, type to filter.
//
// Joplin loads this file once, into the dialog frame's <head>, and then swaps
// the dialog's content with innerHTML on every open. Two things follow, and
// both are the reason this file looks the way it does:
//
//   * the script may run before there is any content to bind to, and
//   * anything bound directly to an element is thrown away on the next open.
//
// So: every listener is delegated to `document`, which survives, and a
// MutationObserver re-runs the setup whenever Joplin injects fresh content.

(function() {
	const slice = Array.prototype.slice;
	let activeCategory = '*';
	let mobile = false;

	const root = () => document.getElementById('jhtml-picker');
	const searchBox = () => document.getElementById('jhtml-search');
	const tiles = () => slice.call(document.querySelectorAll('.tile'));
	const cats = () => slice.call(document.querySelectorAll('.cat'));

	const visibleTiles = () => tiles().filter(tile => !tile.classList.contains('hidden'));

	function select(tile, scroll) {
		if (!tile) return;

		const previous = document.querySelector('.tile.selected');
		if (previous) previous.classList.remove('selected');
		tile.classList.add('selected');

		const id = tile.getAttribute('data-id');
		const hidden = document.getElementById('jhtml-selected');
		const current = document.getElementById('jhtml-current');
		if (hidden) hidden.value = id;
		if (current) current.textContent = '!!! ' + id;
		if (scroll && tile.scrollIntoView) tile.scrollIntoView({ block: 'nearest' });
	}

	function apply() {
		const form = root();
		if (!form) return;

		const search = searchBox();
		const needle = search ? search.value.trim().toLowerCase() : '';
		const words = needle ? needle.split(/\s+/) : [];
		const all = tiles();
		let shown = 0;

		for (let i = 0; i < all.length; i++) {
			const tile = all[i];
			const haystack = tile.getAttribute('data-search') || '';

			let match = true;
			for (let w = 0; w < words.length; w++) {
				if (haystack.indexOf(words[w]) === -1) {
					match = false;
					break;
				}
			}

			if (words.length) {
				// A filter searches every category at once, so the copies in
				// "recently used" would otherwise turn up twice.
				if (tile.getAttribute('data-recent')) match = false;
			} else if (activeCategory !== '*') {
				match = tile.getAttribute('data-category') === activeCategory;
			} else {
				match = !tile.getAttribute('data-recent');
			}

			tile.classList.toggle('hidden', !match);
			if (match) shown++;
		}

		const groups = slice.call(document.querySelectorAll('.group'));
		for (let g = 0; g < groups.length; g++) {
			const group = groups[g];
			group.classList.toggle('hidden', !group.querySelector('.tile:not(.hidden)'));
		}

		// Category headings only earn their space when more than one is on
		// screen at a time.
		form.classList.toggle('single-group', !words.length && activeCategory !== '*');

		const empty = document.getElementById('jhtml-empty');
		if (empty) empty.classList.toggle('hidden', shown > 0);

		const list = document.getElementById('jhtml-list');
		if (list) list.scrollTop = 0;

		// Keep the selection if it is still on screen, otherwise move it to the
		// first block now on show.
		const selected = document.querySelector('.tile.selected');
		if (!selected || selected.classList.contains('hidden')) select(visibleTiles()[0]);
	}

	function setCategory(category) {
		activeCategory = category;

		const all = cats();
		for (let i = 0; i < all.length; i++) {
			const active = all[i].getAttribute('data-category') === category;
			all[i].classList.toggle('active', active);
			// The categories are a scrolling chip row on a phone, so the one in
			// use can easily be off the side of it.
			if (active && mobile && all[i].scrollIntoView) {
				all[i].scrollIntoView({ block: 'nearest', inline: 'center' });
			}
		}

		const search = searchBox();
		if (search && search.value) search.value = '';
		apply();
	}

	// How many tiles sit on one row, so up/down move by a row.
	function rowLength() {
		const visible = visibleTiles();
		if (visible.length < 2) return 1;

		const top = visible[0].offsetTop;
		let count = 1;
		while (count < visible.length && visible[count].offsetTop === top) count++;
		return count;
	}

	function move(delta) {
		const visible = visibleTiles();
		if (!visible.length) return;

		const selected = document.querySelector('.tile.selected');
		let index = visible.indexOf(selected);
		index = index === -1 ? 0 : Math.max(0, Math.min(visible.length - 1, index + delta));
		select(visible[index], true);
	}

	const closest = (node, selector) => {
		while (node && node !== document) {
			if (node.nodeType === 1 && node.matches && node.matches(selector)) return node;
			node = node.parentNode;
		}
		return null;
	};

	document.addEventListener('click', function(event) {
		const cat = closest(event.target, '.cat');
		if (cat) {
			setCategory(cat.getAttribute('data-category'));
			return;
		}

		const tile = closest(event.target, '.tile');
		if (tile) select(tile);
	});

	// Double clicking a block is "insert this one", so it does not need a trip
	// to the button bar. Joplin closes the dialog with OK on a form submit.
	document.addEventListener('dblclick', function(event) {
		const tile = closest(event.target, '.tile');
		const form = root();
		if (!tile || !form) return;

		select(tile);
		if (form.requestSubmit) form.requestSubmit();
		else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
	});

	document.addEventListener('input', function(event) {
		if (event.target && event.target.id === 'jhtml-search') apply();
	});

	document.addEventListener('keydown', function(event) {
		if (!root()) return;

		const search = searchBox();

		// Joplin submits the dialog itself when Enter is pressed in a text
		// input, so all that is left to do here is make sure the top match is
		// what gets inserted.
		if (event.key === 'Enter' && event.target === search) {
			select(visibleTiles()[0]);
			return;
		}

		if (event.ctrlKey || event.metaKey || event.altKey) return;

		const steps = {
			ArrowDown: rowLength,
			ArrowUp: function() { return -rowLength(); },
			ArrowRight: function() { return 1; },
			ArrowLeft: function() { return -1; },
		};

		if (!steps[event.key]) return;
		// Left and right belong to the caret while typing.
		if (event.target === search && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return;

		event.preventDefault();
		move(steps[event.key]());
	});

	// Desktop and mobile want opposite things from the frame - see fitToScreen -
	// and a viewport media query cannot tell them apart, because the desktop
	// dialog frame also starts out phone width and only grows once the picker
	// has asked for room. So the platform is decided here, from the device.
	function isMobile() {
		// Joplin's mobile app draws its webviews with react-native-webview,
		// which is the one signal that means "the Joplin mobile app" and
		// nothing else.
		if (window.ReactNativeWebView) return true;

		const ua = navigator.userAgent || '';
		if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;

		// Belt and braces for a mobile build this does not know about: a touch
		// screen with no pointer, on a small display.
		const touch = window.matchMedia
			&& window.matchMedia('(hover: none) and (pointer: coarse)').matches;
		const screen = window.screen;
		return !!(touch && screen && screen.availWidth && screen.availWidth <= 900);
	}

	// The picker cannot measure the Joplin window: it lives in a frame that
	// Joplin sizes from the picker's own box, so asking about the space
	// available is circular. The screen is the one honest number in reach, so
	// the dialog takes a share of it and leaves room for the window frame, the
	// dialog's padding and the button bar underneath.
	function fitToScreen(form) {
		const screen = window.screen || {};

		if (mobile) {
			// Nothing to ask for on a phone: the frame is already as wide as
			// the screen, so the picker fills it rather than demanding a
			// desktop sized box and pushing half of itself off the side.
			//
			// A cap rather than a height, so a short list gives a short dialog,
			// and a long one scrolls the list while the search field and the
			// Insert button stay where they are.
			const available = screen.availHeight || window.innerHeight || 0;
			form.style.width = '100%';
			form.style.height = 'auto';
			if (available) {
				form.style.maxHeight = Math.max(320, Math.min(760, Math.round(available * 0.68))) + 'px';
			}
			return;
		}

		if (!screen.availWidth || !screen.availHeight) return;

		const width = Math.max(720, Math.min(1500, Math.round(screen.availWidth * 0.78)));
		const height = Math.max(420, Math.min(900, Math.round(screen.availHeight * 0.72)));

		form.style.width = width + 'px';
		form.style.height = height + 'px';
	}

	// Runs on load and again every time Joplin swaps in fresh dialog content.
	function setup() {
		const form = root();
		if (!form || form.getAttribute('data-ready') === '1') return;
		form.setAttribute('data-ready', '1');

		mobile = isMobile();
		if (mobile) {
			form.classList.add('mobile');
			// On <body> as well: the rule that lets the desktop frame grow
			// past its default width lives on Joplin's own wrapper element,
			// outside the picker.
			if (document.body) document.body.classList.add('jhtml-mobile');
		}

		fitToScreen(form);
		setCategory(form.getAttribute('data-start') || '*');

		// Focusing the field opens the on-screen keyboard, which would cover
		// the blocks the dialog was opened to show.
		const search = searchBox();
		if (search && !mobile) search.focus();
	}

	function watch() {
		setup();
		if (typeof MutationObserver === 'undefined') return;
		new MutationObserver(setup).observe(document.body, { childList: true, subtree: true });
	}

	if (document.body) watch();
	else document.addEventListener('DOMContentLoaded', watch);
})();
