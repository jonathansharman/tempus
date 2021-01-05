"use strict";

function twoDigit(n) {
	return n < 10 ? "0" + n.toString() : n.toString();
}

class TimeSpan {
	constructor(h, m, s) {
		this.h = h;
		this.m = m;
		this.s = s;
	}

	// Copies that into this.
	clone(that) {
		this.h = that.h;
		this.m = that.m;
		this.s = that.s;
	}

	// Increments this time span by one second, wrapping if needed.
	increment() {
		++this.s;
		if (this.s >= 60) {
			this.s = 0;
			++this.m;
			if (this.m >= 60) {
				this.m = 0;
				++this.h;
				if (this.h >= 24) {
					this.h = 0;
				}
			}
		}
	}

	// Decrements this time span by one second, wrapping if needed.
	decrement() {
		--this.s;
		if (this.s < 0) {
			this.s = 59;
			--this.m;
			if (this.m < 0) {
				this.m = 59;
				--this.h;
				if (this.h < 0) {
					this.h = 23;
				}
			}
		}
	}
	// Adds another time span to this one, wrapping if needed.
	add(that) {
		this.s += that.s;
		this.m += that.m;
		this.h += that.h;
		// Wrap seconds/minutes.
		this.m += Math.floor(this.s / 60);
		this.s = ((this.s % 60) + 60) % 60;
		// Wrap minutes/hours.
		this.h += Math.floor(this.m / 60);
		this.m = ((this.m % 60) + 60) % 60;
		// Wrap hours.
		this.h = ((this.h % 60) + 60) % 60;
	}

	// Whether this time span is 0:00:00.
	isZero() {
		return this.s == 0 && this.m == 0 && this.h == 0;
	}

	get text() {
		return twoDigit(this.h) + ":" + twoDigit(this.m) + ":" + twoDigit(this.s);
	}
}

class TimeOfDay {
	constructor(h, m, s) {
		this.h = h;
		this.m = m;
		this.s = s;
	}

	// Sets this based on the given Date object.
	setToDate(date) {
		this.h = date.getHours();
		this.m = date.getMinutes();
		this.s = date.getSeconds();
	}

	// Sets this based on the current system time.
	setToNow() {
		const date = new Date();
		this.setToDate(new Date());
	}

	text(military, includeS = false) {
		let time = military
			? twoDigit(this.h)
			: this.h == 0 || this.h == 12 ? "12" : (this.h % 12).toString();
		time += ":" + twoDigit(this.m);
		if (includeS) {
			time += ":" + twoDigit(this.s);
		}
		const amPm = military ? "" : this.h < 12 ? "am" : "pm"
		return [time, amPm];
	}
}

// Gets the time of day timeSpan after timeOfDay. timeSpan must be positive.
function timeAfter(timeOfDay, timeSpan) {
	let h = timeOfDay.h + timeSpan.h;
	let m = timeOfDay.m + timeSpan.m;
	let s = timeOfDay.s + timeSpan.s;
	if (s >= 60) {
		s -= 60;
		++m;
	}
	if (m >= 60) {
		m -= 60;
		++h;
	}
	h = h % 24;
	return new TimeOfDay(h, m, s);
}

// Gets the amount of time from startTimeOfDay until endTimeOfDay, assuming it's between 0 and 24 hours.
function timeUntil(startTimeOfDay, endTimeOfDay) {
	let h = endTimeOfDay.h - startTimeOfDay.h;
	let m = endTimeOfDay.m - startTimeOfDay.m;
	let s = endTimeOfDay.s - startTimeOfDay.s;
	if (s < 0) {
		s += 60;
		--m;
	}
	if (m < 0) {
		m += 60;
		--h;
	}
	h = (h + 24) % 24;
	return new TimeSpan(h, m, s);
}

// The amount of time to snooze.
const snoozeTime = new TimeSpan(0, 9, 0);

// Whether the alarm clock or countdown timer is currently set.
let alarm_set = false;

// Current time
let cur = new TimeOfDay(null, null, null);

// Alarm time
let alarm = new TimeOfDay(null, 0, 0);

// Time until alarm
let left = new TimeSpan(0, 0, 0);

// The second component of the time during which the last tick occurred.
let lastTickS = null;

// If true, currently in countdown mode, otherwise in alarm clock mode.
let countdown = null;

// If true, currently using 24-hour ("military") time, otherwise 12-hour time.
let military = null;

const content = document.getElementById("content");

const clockMode = document.getElementById("clock-mode");
const countdownMode = document.getElementById("countdown-mode");

const twelveHour = document.getElementById("12-hour");
const twentyFourHour = document.getElementById("24-hour");

const tableH = document.getElementById("hours").tBodies[0];
const tableHLabel = document.getElementById("hours-label");
const tableM = document.getElementById("minutes").tBodies[0];
const tableMLabel = document.getElementById("minutes-label");

let selectedH = null;
let selectedM = 0;

const curTime = document.getElementById("cur-time");
const curAmPm = document.getElementById("cur-am-pm");
const primaryTime = document.getElementById("primary-time");
const primaryAmPm = document.getElementById("primary-am-pm");
const secondaryTime = document.getElementById("secondary-time");
const secondaryAmPm = document.getElementById("secondary-am-pm");

const snoozeButton = document.getElementById("snooze");
const stopButton = document.getElementById("stop");

let alarmSound = document.getElementById("alarm-sound");

const noSleep = new NoSleep();

// Perform no-sleep/audio setup when user first interacts with page.
function setup() {
	document.removeEventListener("click", setup, false);
	document.removeEventListener("touchstart", setup, false);
	// Use NoSleep.js to prevent the device from sleeping.
	noSleep.enable();
	// Set up alarm audio.
	alarmSound.loop = true;
	alarmSound.play();
	alarmSound.pause();
}
document.addEventListener("click", setup, false);
document.addEventListener("touchstart", setup, false);

function makeTableH() {
	tableH.innerHTML = "";
	// Split hours across two rows.
	for (let rowIdx = 0; rowIdx < 2; ++rowIdx) {
		const row = tableH.insertRow(rowIdx);
		for (let colIdx = 0; colIdx < 12; ++colIdx) {
			const h = 12 * rowIdx + colIdx;
			const cell = row.insertCell(colIdx);
			if (military || countdown) {
				cell.innerHTML = twoDigit(h);
			} else {
				cell.innerHTML = colIdx == 0 ? "12" : colIdx.toString();
			}
			cell.id = "h" + h;
			cell.className = "selectable";
			if (alarm.h === h) {
				cell.className += " selected";
			}
			cell.onclick = () => {
				turnOffAlarm();
				if (countdown) {
					left.h = h;
					alarm = timeAfter(cur, left);
				} else {
					alarm.h = h;
					alarm.s = 0;
					left = timeUntil(cur, alarm);
				}
				alarm_set = true;
				updateDisplay();
			};
		}
		if (!military && !countdown) {
			// Add am/pm to the beginning and end of the rows under 12-hour time.
			const amPm = rowIdx == 0 ? "am" : "pm";
			row.insertCell(12).innerHTML = amPm;
			row.insertCell(0).innerHTML = amPm;
		}
	}
	// Add "OFF" option to the third row.
	const row = tableH.insertRow(2);
	const offButton = row.insertCell(0);
	offButton.innerHTML = "OFF";
	offButton.colSpan = military ? 12 : 14;
	offButton.style += "; text-align: center";
	offButton.className = "selectable";
	offButton.onclick = () => {
		stop();
	}
}

function makeTableM() {
	tableM.innerHTML = "";
	for (let rowIdx = 0; rowIdx < 6; ++rowIdx) {
		let row = tableM.insertRow(rowIdx);
		for (let colIdx = 0; colIdx < 10; ++colIdx) {
			let m = 10 * rowIdx + colIdx;
			const cell = row.insertCell(colIdx);
			cell.innerHTML = twoDigit(m);
			cell.id = "m" + m;
			cell.className = "selectable";
			if (alarm.m === m) {
				cell.className += " selected";
			}
			cell.onclick = () => {
				turnOffAlarm();
				if (countdown) {
					left.m = m;
					left.s = 0;
					alarm = timeAfter(cur, left);
					alarm_set = true;
				} else {
					alarm.m = m;
					alarm.s = 0;
					left = timeUntil(cur, alarm);
					if (alarm.h != null) {
						// In alarm clock mode, changing the minute only sets the alarm to active if
						// the hour has already been set.
						alarm_set = true;
					}
				}
				updateDisplay();
			};
		}
	}
}

function updateTableSelections() {
	// Determine updated selections.
	if (countdown) {
		var updatedSelectedH = left.h;
		var updatedSelectedM = left.m;
	} else {
		var updatedSelectedH = alarm.h;
		var updatedSelectedM = alarm.m;
	}
	if (selectedH != updatedSelectedH) {
		// Deselect hour.
		if (selectedH != null) {
			document.getElementById("h" + selectedH).className = "selectable";
		}
		// Select hour.
		selectedH = updatedSelectedH;
		if (selectedH != null) {
			document.getElementById("h" + selectedH).className = "selectable selected";
		}
	}
	if (selectedM != updatedSelectedM) {
		// Deselect minute.
		if (selectedM != null) {
			document.getElementById("m" + selectedM).className = "selectable";
		}
		// Select minute.
		selectedM = updatedSelectedM;
		if (selectedM != null) {
			document.getElementById("m" + selectedM).className = "selectable selected";
		}
	}
}

// Updates all the display elements that might change per tick or when an option changes.
function updateDisplay() {
	updateTableSelections();
	// Current time
	const curText = cur.text(military, true);
	curTime.innerHTML = curText[0];
	curAmPm.innerHTML = curText[1];
	// Turn off primary/secondary displays if alarm not set.
	if (!alarm_set) {
		primaryTime.innerHTML = "OFF";
		primaryAmPm.innerHTML = "";
		secondaryTime.innerHTML = "";
		secondaryAmPm.innerHTML = "";
		return;
	}
	if (countdown) {
		// Alarm time
		const alarmText = alarm.text(military, true);
		secondaryTime.innerHTML = alarmText[0];
		secondaryAmPm.innerHTML = alarmText[1];
		// Time left
		primaryTime.innerHTML = left.text;
		primaryAmPm.innerHTML = "";
	} else {
		// Alarm time
		const alarmText = alarm.text(military, alarm.s != 0);
		primaryTime.innerHTML = alarmText[0];
		primaryAmPm.innerHTML = alarmText[1];
		// Time left
		secondaryTime.innerHTML = left.text;
		secondaryAmPm.innerHTML = "";
	}
}

// Performs timing updates.
function tick() {
	// Update current time.
	cur.setToNow();
	// Advance alarm.
	if (cur.s == lastTickS) {
		// Already handled this tick.
		return;
	}
	lastTickS = cur.s;
	if (!left.isZero()) {
		left.decrement();
	}
	if (alarm_set && left.isZero()) {
		// Alarm time!
		alarmSound.play();
		snoozeButton.disabled = false;
		stopButton.disabled = false;
	}
}

// Sets the alarm clock/countdown mode and updates all the elements accordingly.
function setCountdown(value) {
	if (countdown == value) {
		// Do nothing if the countdown is set to its current value.
		return;
	}
	countdown = value;
	// Turn off the alarm.
	turnOffAlarm();
	// Set the alarm to inactive.
	alarm_set = false;
	// Update local storage.
	localStorage.setItem("countdown", countdown);
	if (countdown) {
		// Update selectors.
		clockMode.className = "selectable";
		countdownMode.className = "selectable selected";
		// Update table labels.
		tableHLabel.innerHTML = "Hours";
		tableMLabel.innerHTML = "Minutes";
		// Reset time left.
		left.h = 0;
		left.m = 0;
		left.s = 0;
		// Set color theme.
		document.body.className = "green";
	} else {
		// Update selectors.
		clockMode.className = "selectable selected";
		countdownMode.className = "selectable";
		// Update table labels.
		tableHLabel.innerHTML = "Hour";
		tableMLabel.innerHTML = "Minute";
		// Reset alarm time.
		alarm.h = null;
		alarm.m = 0;
		// Set color theme.
		document.body.className = "blue";
	}
	// Remake hours table if necessary.
	if (!military) {
		makeTableH();
	}
}

// Sets the time format and updates all the elements accordingly.
function setMilitary(value) {
	military = value;
	// Update selectors and local storage.
	twelveHour.className = military ? "selectable" : "selectable selected";
	twentyFourHour.className = military ? "selectable selected" : "selectable";
	localStorage.setItem("military", military);
	// Remake tables.
	makeTableH();
	makeTableM();
}

// Resets the alarm sound and disables the snooze/stop buttons.
function turnOffAlarm() {
	// Stop the sound.
	alarmSound.pause();
	alarmSound.currentTime = 0;
	// Disable snooze and stop buttons.
	snoozeButton.disabled = true;
	stopButton.disabled = true;
}

// Reset the alarm for a short time after the current time.
function snooze() {
	left.clone(snoozeTime);
	alarm = timeAfter(cur, snoozeTime);
	turnOffAlarm();
	updateDisplay();
}

// Stop the alarm and reset the alarm time.
function stop() {
	alarm = new TimeOfDay(null, 0, 0)
	left = new TimeSpan(0, 0, 0);
	alarm_set = false;
	turnOffAlarm();
	updateDisplay();
}

// Keyboard shortcuts for snooze/stop.
document.addEventListener("keydown", (event) => {
	if (event.keyCode == 32) { // space
		snoozeButton.click();
	} else if (event.keyCode == 27) { // escape
		stopButton.click();
	}
});

// Scales the page contents to fit the screen.
function scaleContent() {
	// The width of the body in pixels prior to scaling.
	const standardBodyWidth = 1000;
	// Reset width and zoom to normal.
	document.body.style.width = standardBodyWidth;
	content.style.zoom = "100%";
	// Calculate zoom factor 
	let w = content.offsetWidth;
	let h = content.offsetHeight;
	let wFactor = window.innerWidth / w;
	let hFactor = window.innerHeight / h;
	let zoom = 0.95 * Math.min(wFactor, hFactor);
	// Scale body width and content zoom.
	document.body.style.width = zoom * standardBodyWidth;
	content.style.zoom = (100 * zoom) + "%";
}

// Load mode from local storage.
setCountdown(localStorage["countdown"] === "true");

// Load time format from local storage.
setMilitary(localStorage["military"] === "true");

// Finish initial page and then show document body.
tick();
updateDisplay();
scaleContent();
document.getElementsByTagName("body")[0].style.visibility = "visible";

// Update every 100 ms.
setInterval(() => {
	tick();
	updateDisplay();
}, 100);
