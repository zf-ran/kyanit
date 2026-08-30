//* TOP NAVIGATION
const topNavigation = document.getElementById('top-navigation');
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const searchSubmit = document.getElementById('search-submit');
const searchCancel = document.getElementById('search-cancel');

searchButton.addEventListener('click', () => {
	topNavigation.dataset.search = !JSON.parse(topNavigation.dataset.search);

	if(topNavigation.dataset.search) {
		searchInput.focus();
	}
});

searchCancel.addEventListener('click', () => {
	if(searchInput.value) {
		searchInput.value = '';
	} else {
		topNavigation.dataset.search = false;
	}
});

searchSubmit.addEventListener('click', () => {
	location.assign(`/explore?search=${encodeURIComponent(searchInput.value)}`);
});

searchInput.addEventListener('keydown', ({ key }) => {
	if(key === 'Enter') {
		searchSubmit.click();
	}
});

//* SIDE NAVIGATION
const sidebar = document.getElementById('sidebar');
const openSidebarButton = document.getElementById('open-sidebar');
const closeSidebarButton = document.getElementById('close-sidebar');

openSidebarButton.addEventListener('click', () => {
	sidebar.classList.add('open');
});

closeSidebarButton.addEventListener('click', () => {
	sidebar.classList.remove('open');
});