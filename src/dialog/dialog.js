// Picker dialog: click to select a block, type to filter.

(function() {
	function init() {
		const root = document.getElementById('jhtml-picker');
		if (!root) return;

		const hidden = document.getElementById('jhtml-selected');
		const search = document.getElementById('jhtml-search');
		const cards = Array.prototype.slice.call(root.querySelectorAll('.block-card'));

		function select(card) {
			cards.forEach(function(other) { other.classList.remove('selected'); });
			card.classList.add('selected');
			hidden.value = card.getAttribute('data-id');
		}

		cards.forEach(function(card) {
			card.addEventListener('click', function() { select(card); });
		});

		if (cards.length) select(cards[0]);

		if (search) {
			search.addEventListener('input', function() {
				const needle = search.value.trim().toLowerCase();
				let firstVisible = null;

				cards.forEach(function(card) {
					const match = !needle || card.getAttribute('data-search').indexOf(needle) !== -1;
					card.style.display = match ? '' : 'none';
					if (match && !firstVisible) firstVisible = card;
				});

				// Hide category headings that no longer have any visible card.
				Array.prototype.slice.call(root.querySelectorAll('.category')).forEach(function(section) {
					const visible = Array.prototype.slice.call(section.querySelectorAll('.block-card'))
						.some(function(card) { return card.style.display !== 'none'; });
					section.style.display = visible ? '' : 'none';
				});

				if (firstVisible) select(firstVisible);
			});
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
