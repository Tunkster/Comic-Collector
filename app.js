// Element references keep event handlers and rendering tied to the page markup.
const storageKey = "panel-comic-collection";
const welcomeScreen = document.querySelector("#welcome-screen");
const libraryScreen = document.querySelector("#library-screen");
const comicGrid = document.querySelector("#comic-grid");
const emptyState = document.querySelector("#empty-state");
const addDialog = document.querySelector("#add-dialog");
const addComicForm = document.querySelector("#add-comic-form");
const searchInput = document.querySelector("#comic-search");
let activeFilter = "All";

// Load saved comics; return an empty shelf for a first-time user. Replace this with a database read later.
function loadCollection() {
	try {
		const savedCollection = localStorage.getItem(storageKey);
		return savedCollection ? JSON.parse(savedCollection) : [];
	} catch {
		return [];
	}
}

let comics = loadCollection();

// Save locally for now; replace this with a database write when the backend is connected.
function saveCollection() {
	localStorage.setItem(storageKey, JSON.stringify(comics));
}

// Apply the active search and genre filter, then rebuild the visible cards and totals.
function renderCollection() {
	const searchTerm = searchInput.value.trim().toLowerCase();
	const visibleComics = comics.filter((comic) => {
		const matchesFilter = activeFilter === "All" || comic.genre === activeFilter;
		const matchesSearch = `${comic.title} ${comic.series} ${comic.genre}`.toLowerCase().includes(searchTerm);
		return matchesFilter && matchesSearch;
	});

	comicGrid.replaceChildren(...visibleComics.map((comic) => {
		const card = document.createElement("article");
		card.className = "comic-card";

		const cover = document.createElement("div");
		cover.className = `cover-art ${comic.cover || "cover-purple"}`;
		cover.setAttribute("role", "img");
		cover.setAttribute("aria-label", `${comic.title}, issue ${comic.issue}`);

		const issue = document.createElement("span");
		issue.className = "cover-issue";
		issue.textContent = `NO. ${comic.issue}`;
		const stamp = document.createElement("span");
		stamp.className = "cover-stamp";
		stamp.setAttribute("aria-hidden", "true");
		stamp.textContent = "✦";
		const coverTitle = document.createElement("span");
		coverTitle.className = "cover-title";
		coverTitle.textContent = comic.title;
		cover.append(issue, stamp, coverTitle);

		const details = document.createElement("div");
		details.className = "card-details";
		const text = document.createElement("div");
		text.className = "card-text";
		const title = document.createElement("h2");
		title.className = "card-title";
		title.textContent = comic.title;
		const series = document.createElement("p");
		series.className = "card-series";
		series.textContent = comic.series;
		const genre = document.createElement("span");
		genre.className = "card-genre";
		genre.textContent = comic.genre;
		text.append(title, series);
		details.append(text, genre);
		card.append(cover, details);
		return card;
	}));

	document.querySelector("#comic-count").textContent = comics.length;
	document.querySelector("#series-count").textContent = new Set(comics.map((comic) => comic.series.toLowerCase())).size;
	emptyState.hidden = visibleComics.length > 0;
}

// Switch between the welcome screen and the collection screen.
document.querySelector("#enter-library").addEventListener("click", () => {
	welcomeScreen.hidden = true;
	libraryScreen.hidden = false;
	renderCollection();
	window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelector("#back-to-welcome").addEventListener("click", () => {
	libraryScreen.hidden = true;
	welcomeScreen.hidden = false;
	window.scrollTo({ top: 0, behavior: "smooth" });
});

// Selecting a genre updates the active tab and redraws the matching comics.
document.querySelectorAll(".filter-tab").forEach((button) => {
	button.addEventListener("click", () => {
		activeFilter = button.dataset.filter;
		document.querySelector(".filter-tab.is-active").classList.remove("is-active");
		button.classList.add("is-active");
		renderCollection();
	});
});

// Wire up live search and the add-dialog open/close controls.
searchInput.addEventListener("input", renderCollection);
document.querySelector("#open-add-dialog").addEventListener("click", () => addDialog.showModal());
document.querySelector("#close-add-dialog").addEventListener("click", () => addDialog.close());
addDialog.addEventListener("click", (event) => {
	if (event.target === addDialog) addDialog.close();
});

// Validate the form, add its comic to the front of the shelf, and save the result.
addComicForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const formData = new FormData(addComicForm);
	const covers = ["cover-purple", "cover-gold", "cover-blue", "cover-red"];
	comics.unshift({
		id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
		title: formData.get("title").trim(),
		series: formData.get("series").trim(),
		issue: Number(formData.get("issue")),
		genre: formData.get("genre"),
		cover: covers[Math.floor(Math.random() * covers.length)]
	});
	saveCollection();
	addComicForm.reset();
	addDialog.close();
	activeFilter = "All";
	document.querySelectorAll(".filter-tab").forEach((button) => {
		button.classList.toggle("is-active", button.dataset.filter === "All");
	});
	searchInput.value = "";
	renderCollection();
});

// Draw the initial sample or saved shelf as soon as the script loads.
renderCollection();
