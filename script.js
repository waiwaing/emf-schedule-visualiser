"use strict";

var DateTime = luxon.DateTime;
let events;

window.onload = (_) => {
	const xhr = new XMLHttpRequest();
	xhr.open("GET", "/schedule.json");

	xhr.onreadystatechange = () => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			const status = xhr.status;
			if (status === 0 || (status >= 200 && status < 400)) {
				events = JSON.parse(xhr.responseText);
				populateCalendar("2024-05-31");
			} else {
				console.error(xhr.responseText);
				alert("check console logs?")
			}
		}
	};

	xhr.send();

	[...document.querySelectorAll("button.date")].forEach(elem => {
		elem.addEventListener("click", _ => {
			populateCalendar(elem.dataset.value);
		})
	});
}

function populateCalendar(baseDate) {
	const baseTime = DateTime.fromISO(baseDate).plus({ hours: 8, minutes: 30 });
	const calendar = document.getElementsByClassName("calendar")[0];
	calendar.textContent = "";

	events.forEach(event => {
		const start = DateTime.fromFormat(event["start_date"], "yyyy-MM-dd TT");
		const end = DateTime.fromFormat(event["end_date"], "yyyy-MM-dd TT");

		if (start.toISODate() != baseDate) {
			return;
		}

		let venue;
		switch (event["venue"]) {
			case "Stage A": venue = "stage-a"; break;
			case "Stage B": venue = "stage-b"; break;
			case "Stage C": venue = "stage-c"; break;
			// case "Stage C": venue = "other-1"; break;
			default: return;
		}

		const startLine = start.diff(baseTime).as("minutes") / 5 + 1; // why is CSS 1-indexed
		const endLine = end.diff(baseTime).as("minutes") / 5 + 1;

		const div = calendar.appendChild(document.createElement("div"));
		div.style.gridRowStart = startLine;
		div.style.gridRowEnd = endLine;
		div.style.gridColumnStart = venue;
		div.className = "card talk";

		div.innerHTML = `
			<span class="talkTimes">${start.toLocaleString(DateTime.TIME_24_SIMPLE)} - ${end.toLocaleString(DateTime.TIME_24_SIMPLE)}</span>
			<br>
			<span class="talkTitle">${event["title"]}</span>
		`
	});
}