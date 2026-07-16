"use strict";

const DateTime = luxon.DateTime;

const typeLabels = {
	talk: "Talk",
	workshop: "Workshop",
	familyworkshop: "Family Workshop",
	youthworkshop: "Youth Workshop",
	performance: "Performance",
	film: "Film",
	music: "Music",
	djset: "DJ Set",
	meetup: "Meetup"
};

window.onload = () => {
	const stored = localStorage.getItem("state");
	const favIds = stored ? new Set(JSON.parse(stored).pos) : new Set();

	const xhr = new XMLHttpRequest();
	xhr.open("GET", "schedule.json?nocache=" + DateTime.now().toMillis());
	xhr.onreadystatechange = () => {
		if (xhr.readyState !== XMLHttpRequest.DONE) return;

		const status = xhr.status;
		if (!(status === 0 || (status >= 200 && status < 400))) {
			console.error(xhr.responseText);
			alert("oops, something went wrong - check console logs?");
			return;
		}

		const faves = JSON.parse(xhr.responseText)
			.flatMap(event =>
				(event["occurrences"] ?? []).map(occ => ({
					...event,
					...occ,
					id: event["id"] * 100 + occ["occurrence_num"] // unique per occurrence, matches the schedule view
				}))
			)
			.filter(e => favIds.has(e["id"]))
			.sort((a, b) => a["start_date"].localeCompare(b["start_date"]));

		render(faves);
	};
	xhr.send();
};

function parseTimes(event) {
	return {
		start: DateTime.fromFormat(event["start_date"], "yyyy-MM-dd TT"),
		end: DateTime.fromFormat(event["end_date"], "yyyy-MM-dd TT")
	};
}

function render(faves) {
	// A fave conflicts if its time range overlaps any other fave's.
	const conflicting = new Set();
	for (let i = 0; i < faves.length; i++) {
		const a = parseTimes(faves[i]);
		for (let j = i + 1; j < faves.length; j++) {
			const b = parseTimes(faves[j]);
			if (a.start < b.end && b.start < a.end) {
				conflicting.add(faves[i]["id"]);
				conflicting.add(faves[j]["id"]);
			}
		}
	}

	const table = document.getElementById("favourites");
	table.textContent = "";

	const header = table.insertRow();
	["Name", "Location", "Time", "Category", "Link"].forEach(text => {
		const th = document.createElement("th");
		th.textContent = text;
		header.appendChild(th);
	});

	if (faves.length === 0) {
		const cell = table.insertRow().insertCell();
		cell.colSpan = 5;
		cell.textContent = "No favourites yet.";
		return;
	}

	faves.forEach(event => {
		const { start, end } = parseTimes(event);
		const row = table.insertRow();

		if (conflicting.has(event["id"])) {
			row.style.background = "orange";
			row.style.color = "white";
		}

		row.insertCell().textContent = event["title"];
		row.insertCell().textContent = event["venue"];
		row.insertCell().textContent = `${start.toFormat("ccc HH:mm")} - ${end.toFormat("HH:mm")}`;
		row.insertCell().textContent = typeLabels[event["type"]] ?? event["type"];

		const link = document.createElement("a");
		link.href = event["link"];
		link.target = "_blank";
		link.textContent = "EMF";
		row.insertCell().appendChild(link);
	});
}
