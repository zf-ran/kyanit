const tabElements = document.getElementsByClassName('tabs');

for (const tabElement of tabElements) {
	tabElement.addEventListener('click', event => {
		if (event.target.role === 'tab') {
			if (event.target.classList.contains('tab-active'))
				return;

			for (const activeTab of tabElement.getElementsByClassName('tab-active')) {
				activeTab.classList.remove('tab-active');
				activeTab.setAttribute('aria-selected', 'false');

				const activePanelId = activeTab.getAttribute('aria-controls');
				const activePanel = document.getElementById(activePanelId);

				activePanel.setAttribute('hidden', '');
				activePanel.classList.remove('panel-active');
			}

			event.target.classList.add('tab-active');
			event.target.setAttribute('aria-selected', 'true');

			const panelId = event.target.getAttribute('aria-controls');
			const panel = document.getElementById(panelId);

			panel.removeAttribute('hidden');
			panel.classList.add('panel-active');
		}
	});
}