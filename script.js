"use strict";

const DateTime = luxon.DateTime;
let events;
let allVenues;
let state;

const negTalkClasses = ["o30"];
const posTalkClasses = ["bc-white", "ba", "baw3"];
const knownVenues = [
	"Stage A",
	"Stage B",
	"Stage C",
	"Workshop 0 (Drop-in)",
	"Workshop 1 (NottingHack)",
	"Workshop 2 (Milliways)",
	"Workshop 3 (Furry High Commission)",
	"Workshop 4 (FieldFX)",
	"Workshop 5 (Maths)",
	"Workshop 6 (Hardware Hacking)",
	"Youth Workshop"
];

const excludedEventIds = [
	682, 683, 684, 685, // Tea tent - all day event
	695, 696, 697 // Blacksmithing - misleading times
];


window.onload = (_) => {
	bindControls();
	const xhr = new XMLHttpRequest();
	xhr.open("GET", "schedule.json?nocache=" + DateTime.now().toMillis());

	xhr.onreadystatechange = () => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			const status = xhr.status;
			if (status === 0 || (status >= 200 && status < 400)) {
				events = JSON.parse(xhr.responseText).sort((a, b) => {
					const x = a["start_date"].localeCompare(b["start_date"]);
					const y = a["venue"].localeCompare(b["venue"]);

					return x !== 0 ? x : y
				}).filter(e => !excludedEventIds.includes(e["id"]));

				const tempVenues = new Set(events.map(v => v["venue"]));
				knownVenues.forEach(v => tempVenues.delete(v));
				allVenues = knownVenues.concat([...tempVenues].sort());

				populateCalendar("2024-05-31");
			} else {
				console.error(xhr.responseText);
				alert("oops, something went wrong - check console logs?")
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

	initializeState();
	populateClock();
	bindCardHandlers();
}

function initializeState() {
	if (localStorage.getItem("state")) {
		decode(localStorage.getItem("state"));
	} else {
		state = {
			pos: new Set(),
			neg: new Set()
		}
	}
}

function populateCalendar(baseDate) {
	const baseTime = DateTime.fromISO(baseDate).plus({ hours: 8, minutes: 0 });
	const endOfDay = baseTime.plus({ hours: 24 })
	const calendar = document.getElementsByClassName("talks")[0];
	calendar.textContent = "";

	const dayVenues = allVenues.filter(v =>
		events.some(e => {
			const start = DateTime.fromFormat(e["start_date"], "yyyy-MM-dd TT");
			return (start >= baseTime && start < endOfDay && e.venue === v);
		})
	);
	populateVenues(dayVenues);

	events.forEach(event => {
		const start = DateTime.fromFormat(event["start_date"], "yyyy-MM-dd TT");
		const end = DateTime.fromFormat(event["end_date"], "yyyy-MM-dd TT");
		const venueIndex = dayVenues.indexOf(event["venue"]);

		if (start < baseTime || start >= endOfDay || venueIndex === -1) {
			return;
		}

		const startLine = Math.floor(start.diff(baseTime).as("minutes") / 5 + 1); // why is CSS 1-indexed
		const endLine = Math.ceil(end.diff(baseTime).as("minutes") / 5 + 1);

		let type;
		switch (event["type"]) {
			case "talk": type = "Talk"; break;
			case "workshop": type = "Workshop"; break;
			case "youthworkshop": type = "Youth Workshop"; break;
			case "performance": type = "Film/Performance"; break;
		}

		const div = calendar.appendChild(document.createElement("div"));
		div.style.gridRowStart = startLine;
		div.style.gridRowEnd = endLine;
		div.style.gridColumnStart = venueIndex + 2;
		div.dataset.talkId = event["id"];
		div.className = "talk s-card overflow-y-auto d-flex fd-column jc-space-between";

		div.innerHTML = `
			<div class="flex-item">
				<h2 class="fs-body2 fw-bold lh-xs fc-dark m0">${event["title"]}</h2>
				<p class="fs-body1 lh-xs fc-dark my6 c-default us-none">
					${start.toLocaleString(DateTime.TIME_24_SIMPLE)} - 
					${end.toLocaleString(DateTime.TIME_24_SIMPLE)} 
				</p> 
			</div>
			<div class="flex--item">
				<p class="fs-body1 fc-dark mt0 mb0 c-default us-none">
					${event["venue"]} | ${type}
				</p>
				<p class="fs-body1 fc-dark mt0 mb0 c-default us-none">
					<a href="${event["link"]}" target="_blank" class="link">
						EMF <i class="fa-solid fa-arrow-up-right-from-square fa-sm"></i>
					</a>
					${event["may_record"] === false ? "| <i class=\"fa-solid fa-video-slash \"></i>" : ""}
					${event["requires_ticket"] === true ? `|  <i class="fa-solid fa-ticket"></i>` : ""}
				</p>
			</div>
		`
	});

	stateToDom();
}

function populateClock() {
	const clock = document.getElementsByClassName("clock")[0];
	for (let i = 8.5; i <= 26; i = i + 0.5) {
		const div = clock.appendChild(document.createElement("div"));
		div.style.gridRowStart = (i - 8) * 12 + 1;
		div.style.gridColumnStart = "clock";

		const hour = (Math.floor(i) % 24).toString().padStart(2, "0");
		const min = (i * 2 % 2) === 1 ? "30" : "00";

		div.innerHTML = `${hour}:${min}`;
	}
 
  // Draw current time
  const currentTime = DateTime.now();
  const currentHourWithFraction = currentTime.hour + currentTime.minute / 60;
  const line = Math.floor(((currentHourWithFraction) - 8) * 12 + 1); // Also why is CSS 1-indexed
  const currentTimeDiv = clock.appendChild(document.createElement("div"));
  currentTimeDiv.style.gridRowStart = line;
  currentTimeDiv.style.gridColumnStart = "clock";
  currentTimeDiv.className = "currentTime"
}

function populateVenues(dayVenues) {
	const venueContainer = document.getElementsByClassName("venues")[0];
	venueContainer.textContent = "";

	const empty = venueContainer.appendChild(document.createElement("div"));
	empty.className = "empty-talk-header";

	for (let i = 0; i < dayVenues.length; i++) {
		const venueName = dayVenues[i].replace("(", "<br>(");

		const div = venueContainer.appendChild(document.createElement("div"));
		div.className = "talk-header s-card d-flex jc-center ai-center";
		div.innerHTML = `<h2 class="fs-subheading">${venueName}</h2>`;
	}
}

function bindCardHandlers() {
	const calendar = document.getElementsByClassName("talks")[0];
	calendar.addEventListener("click", event => {
		const link = elementOrAncestorWithClass(event.target, "link");
		if (link !== null) return;

		const talk = elementOrAncestorWithClass(event.target, "talk");
		if (talk === null) return;

		const talkId = parseInt(talk.dataset.talkId);

		if (state.pos.has(talkId)) {
			state.pos.delete(talkId);
			state.neg.add(talkId);
		} else if (state.neg.has(talkId)) {
			state.neg.delete(talkId);
		} else {
			state.pos.add(talkId);
		}

		saveToLocalStorage();
	});
}

function stateToDom() {
	[...document.getElementsByClassName("talk")].forEach(talk => {
		const talkId = parseInt(talk.dataset.talkId);
		talk.classList.remove(...negTalkClasses, ...posTalkClasses);
		if (state.pos.has(talkId)) {
			talk.classList.add(...posTalkClasses);
		} else if (state.neg.has(talkId)) {
			talk.classList.add(...negTalkClasses);
		}
	});
}

function saveToLocalStorage() {
	localStorage.setItem("state", encode());
	stateToDom();
}

function elementOrAncestorWithClass(element, className) {
	while (element != null) {
		if (element.classList?.contains(className)) return element;
		element = element.parentNode;
	};
	return null;
}

function bindControls() {
	document.getElementById("button-reset").addEventListener("click", _ => {
		if (window.confirm("Are you sure?")) {
			state = {
				pos: new Set(),
				neg: new Set()
			}

			saveToLocalStorage();
		}
	});

	document.getElementById("button-export").addEventListener("click", _ => {
		navigator.clipboard.writeText(encode());
	});

	document.getElementById("button-import").addEventListener("click", _ => {
		decode(window.prompt("Enter your state code:"));
		saveToLocalStorage();
	})
}

function encode() {
	return JSON.stringify({
		pos: [...state.pos],
		neg: [...state.neg]
	})
}

function decode(value) {
	var temp = JSON.parse(value);
	state = {
		pos: new Set(temp.pos),
		neg: new Set(temp.neg)
	}
}
