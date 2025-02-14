import { search as searchIsTriggered } from "./_is-triggered.js";

document.addEventListener("DOMContentLoaded", () => {
	const SEARCH_INPUT = document.querySelector(".Search-input");
	const SEARCH_CLEAR = document.querySelector(".Search-clear");

	const COMPONENTS = Array.from(document.querySelectorAll(".Nav-item")).map(
		(node) => {
			return {
				node,
				listItem: node.closest(".Nav-entry"),
				label: node.textContent,
				lowercaseLabel: node.textContent.toLowerCase(),
				matchesQuery: false,
				toggle: node.previousElementSibling || null,
				parentToggles: getParentToggles(node),
				initiallyOpened: node.previousElementSibling
					? node.previousElementSibling.getAttribute("aria-expanded") === "true"
						? true
						: false
					: false,
			};
		},
	);

	if (SEARCH_INPUT) {
		if (SEARCH_CLEAR) {
			SEARCH_CLEAR.addEventListener("click", onClearSearch);
		}

		SEARCH_INPUT.addEventListener("input", onInputSearch);
		SEARCH_INPUT.addEventListener("keyup", onInputKeyup);

		window.addEventListener("keyup", (e) => {
			const { path, originalTarget, target, key } = e;
			const el = path ? path[0] : originalTarget || target;

			if (searchIsTriggered(el, key)) {
				SEARCH_INPUT.focus();
			}
		});
		window.addEventListener("searchTriggered", () => {
			SEARCH_INPUT.focus();
		});
	}

	/**
	 * @returns {void}
	 */
	function onClearSearch() {
		SEARCH_INPUT.value = "";
		resetMenu();
	}

	/**
	 * @param {object} event
	 * @param {HTMLInputElement} event.target
	 */
	function onInputSearch({ target }) {
		const QUERY = target.value.toLowerCase();

		if (QUERY.length > 0) {
			updateMenu(QUERY);
		} else {
			resetMenu();
		}
	}

	/**
	 * @param {object} root0
	 * @param {HTMLInputElement} root0.target
	 * @param {string} root0.key
	 */
	function onInputKeyup({ target, key }) {
		if (key.toLowerCase() === "escape") {
			target.value = "";
			target.blur();
			resetMenu();
		}
	}

	/**
	 * @param {string} query
	 */
	function updateMenu(query) {
		SEARCH_CLEAR.hidden = false;

		COMPONENTS.forEach((component) => {
			if (component.toggle) {
				document.getElementById(
					component.toggle.getAttribute("aria-controls"),
				).hidden = true;
				component.toggle.setAttribute("aria-expanded", "false");
			}
			component.parentToggles.forEach((toggle) => {
				toggle.parentNode.classList.remove("has-match");
			});
		});

		COMPONENTS.forEach((component) => {
			component.matchesQuery = component.lowercaseLabel.includes(query);
			component.listItem.classList.toggle("is-match", component.matchesQuery);
			component.listItem.classList.toggle(
				"is-no-match",
				!component.matchesQuery,
			);

			if (component.matchesQuery) {
				component.node.innerHTML = component.label.replace(
					new RegExp(query, "g"),
					`<mark>${query}</mark>`,
				);
				component.parentToggles.forEach((toggle) => {
					toggle.parentNode.classList.add("has-match");
					toggle.parentNode.classList.remove("has-no-match");
					document.getElementById(toggle.getAttribute("aria-controls")).hidden =
						false;
					toggle.setAttribute("aria-expanded", "true");
				});
			} else {
				component.node.textContent = component.label;
			}
		});

		COMPONENTS.forEach((component) => {
			if (!component.listItem.classList.contains("has-match")) {
				component.listItem.classList.add("has-no-match");
			}
		});
	}

	/**
	 * @returns {void}
	 */
	function resetMenu() {
		SEARCH_CLEAR.hidden = true;

		COMPONENTS.forEach((component) => {
			if (component.matchesQuery) {
				component.node.textContent = component.label;
			}

			component.matchesQuery = false;

			if (component.toggle) {
				document.getElementById(
					component.toggle.getAttribute("aria-controls"),
				).hidden = !component.initiallyOpened;
				component.toggle.setAttribute(
					"aria-expanded",
					component.initiallyOpened ? "true" : "false",
				);
			}
		});

		document
			.querySelectorAll(".is-match, .is-no-match, .has-match, .has-no-match")
			.forEach((el) =>
				el.classList.remove(
					"is-match",
					"is-no-match",
					"has-match",
					"has-no-match",
				),
			);
	}

	/**
	 * @param {HTMLElement} node
	 * @returns {Array}
	 */
	function getParentToggles(node) {
		const parentToggles = [];
		let element = node;

		while (element.closest(".Nav-entry").parentNode.closest(".Nav-entry")) {
			const toggle = element
				.closest(".Nav-entry")
				.parentNode.closest(".Nav-entry")
				.querySelector(".Nav-toggle");

			if (toggle) {
				parentToggles.push(toggle);
			}
			element = element.closest(".Nav-entry").parentNode.closest(".Nav-entry");
		}

		return parentToggles;
	}
});
