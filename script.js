"use strict";

var DateTime = luxon.DateTime;
let events;

window.onload = (_) => {
	const xhr = new XMLHttpRequest();
	xhr.open("GET", "schedule.json");

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

	const dateButtons = [...document.querySelectorAll("button.date")]
	dateButtons.forEach(elem => {
		elem.addEventListener("click", _ => {
			dateButtons.forEach(btn => btn.className = "date s-btn");
			elem.className = "date s-btn is-selected";
			populateCalendar(elem.dataset.value);
		})
	});

	populateClock();
}

function populateCalendar(baseDate) {
	const baseTime = DateTime.fromISO(baseDate).plus({ hours: 8, minutes: 0 });
	const calendar = document.getElementsByClassName("talks")[0];
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

		const startLine = Math.floor(start.diff(baseTime).as("minutes") / 5 + 1); // why is CSS 1-indexed
		const endLine = Math.ceil(end.diff(baseTime).as("minutes") / 5 + 1);

		const summary = event["description"].substring(0, 500) + "...";

		const a = calendar.appendChild(document.createElement("a"));
		a.style.gridRowStart = startLine;
		a.style.gridRowEnd = endLine;
		a.style.gridColumnStart = venue;
		a.className = "talk s-card fc-dark";
		a.href = event["link"];
		a.target = "_blank";

		a.innerHTML = `
			<span class="talkTimes">
				${start.toLocaleString(DateTime.TIME_24_SIMPLE)} - 
				${end.toLocaleString(DateTime.TIME_24_SIMPLE)} 
			</span> 
			<br>
			<span class="talkTitle">${event["title"]}</span>	
			${event["may_record"] === false ? "<br><i class=\"bi bi-camera-video-off\"></i>" : ""}
		`
	});
}

function populateClock() {
	const clock = document.getElementsByClassName("clock")[0];
	for (let i = 8.5; i <= 26; i = i + 0.5) {
		const div = clock.appendChild(document.createElement("div"));
		div.style.gridRowStart = (i - 8) * 12 + 1;
		div.style.gridColumnStart = "clock";

		const hour = Math.floor(i).toString().padStart(2, "0");
		const isHalf = (i * 2 % 2) === 1;

		div.innerHTML = `${hour}:${isHalf ? "30" : "00"}`;
	}
}