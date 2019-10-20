"use strict";

// Use NoSleep.js to prevent the screen from sleeping.
const noSleep = new NoSleep();
document.addEventListener('click', function enableNoSleep() {
	document.removeEventListener('click', enableNoSleep, false);
	noSleep.enable();
}, false);

let military = null;

let alarmHour = null;
let alarmMinTens = 0;
let alarmMinOnes = 0;
let currentHour = null;
let currentMinute = null;
let currentSecond = null;

const hoursTable = document.getElementById("hours").tBodies[0];
const minutesTable = document.getElementById("minutes").tBodies[0];
const snoozeButton = document.getElementById("snooze");
const stopButton = document.getElementById("stop");

function twoDigit(n) {
	return n < 10 ? "0" + n.toString() : n.toString();
}

function makeHoursTable() {
	hoursTable.innerHTML = "";
	// Split hours across two rows.
	for (let rowIdx = 0; rowIdx < 2; ++rowIdx) {
		const row = hoursTable.insertRow(rowIdx);
		for (let colIdx = 0; colIdx < 12; ++colIdx) {
			const hour = 12 * rowIdx + colIdx;
			const cell = row.insertCell(colIdx);
			if (military) {
				cell.innerHTML = twoDigit(hour);
			} else {
				cell.innerHTML = colIdx == 0 ? "12" : colIdx.toString();
			}
			cell.id = "h" + hour;
			cell.className = "time hour";
			if (alarmHour === hour) {
				cell.className += " selected";
			}
			cell.onclick = function() { setAlarmHour(hour); };
		}
		if (!military) {
			// Add am/pm to the beginning and end of the rows under 12-hour time.
			const amPm = rowIdx == 0 ? "am" : "pm";
			row.insertCell(12).innerHTML = amPm;
			row.insertCell(0).innerHTML = amPm;
		}
	}
}

function makeMinutesTable() {
	minutesTable.innerHTML = "";
	// Make tens place row.
	let tens = minutesTable.insertRow(0);
	for (let colIdx = 0; colIdx < 6; ++colIdx) {
		const cell = tens.insertCell(colIdx);
		cell.innerHTML = colIdx;
		cell.id = "mt" + colIdx;
		cell.className = "time min-tens";
		if (alarmMinTens === colIdx) {
			cell.className += " selected";
		}
		cell.onclick = function() { setAlarmMinTens(colIdx); };
	}
	// Make ones place row.
	const ones = minutesTable.insertRow(1);
	for (let colIdx = 0; colIdx < 10; ++colIdx) {
		const cell = ones.insertCell(colIdx);
		cell.innerHTML = colIdx;
		cell.id = "mo" + colIdx;
		cell.className = "time min-ones";
		if (alarmMinOnes === colIdx) {
			cell.className += " selected";
		}
		cell.onclick = function() { setAlarmMinOnes(colIdx); };
	}
}

function timeString(hour, minute, second = null) {
	var result = military
		? twoDigit(hour)
		: hour == 0 || hour == 12 ? "12" : (hour % 12).toString();
	result += ":" + twoDigit(minute);
	if (second != null) {
		result += ":" + twoDigit(second);
	}
	if (!military) {
		result += hour < 12 ? " am" : " pm";
	}
	return result;
}

// Updates the alarm time display based on current alarm values.
function updateAlarmTime() {
	if (alarmHour != null) {
		var alarmTimeText = timeString(alarmHour, 10 * alarmMinTens + alarmMinOnes);
		snoozeButton.disabled = false;
		stopButton.disabled = false;
	} else {
		var alarmTimeText = "OFF";
		snoozeButton.disabled = true;
		stopButton.disabled = true;
	}
	document.getElementById("alarm-time").innerHTML = alarmTimeText;
}

function setAlarmHour(value) {
	if (alarmHour != null) {
		// Deselect the previously selected cell.
		document.getElementById("h" + alarmHour).className = "time hour";
	}
	alarmHour = value;
	// Select the new cell, if any.
	if (alarmHour != null) {
		document.getElementById("h" + alarmHour).className = "time hour selected";
	}
	// Update display.
	updateAlarmTime();
	updateTimeLeft();
}

function setAlarmMinTens(value) {
	// Deselect the previously selected cell.
	document.getElementById("mt" + alarmMinTens).className = "time min-tens";
	alarmMinTens = value;
	// Select the new cell.
	document.getElementById("mt" + alarmMinTens).className = "time min-tens selected";
	// Update display.
	updateAlarmTime();
	updateTimeLeft();
}

function setAlarmMinOnes(value) {
	// Deselect the previously selected cell.
	document.getElementById("mo" + alarmMinOnes).className = "time min-tens";
	alarmMinOnes = value;
	// Select the new cell, if any.
	document.getElementById("mo" + alarmMinOnes).className = "time min-tens selected";
	// Update display.
	updateAlarmTime();
	updateTimeLeft();
}

function updateCurrentTime() {
	const date = new Date();
	currentHour = date.getHours();
	currentMinute = date.getMinutes();
	currentSecond = date.getSeconds();
	document.getElementById("current-time").innerHTML = timeString(currentHour, currentMinute, currentSecond);
	updateTimeLeft();
};

function updateTimeLeft() {
	let hoursLeft = alarmHour - currentHour;
	let minutesLeft = 10 * alarmMinTens + alarmMinOnes - currentMinute - (currentSecond == 0 ? 0 : 1);
	const secondsLeft = (60 - currentSecond) % 60;
	if (minutesLeft < 0) {
		minutesLeft += 60;
		--hoursLeft;
	}
	if (hoursLeft < 0) {
		hoursLeft += 24;
	}
	document.getElementById("time-left").innerHTML = "-" + twoDigit(hoursLeft) + ":" + twoDigit(minutesLeft) + ":" + twoDigit(secondsLeft);
}

// Sets the military time setting and updates all the elements accordingly.
function setMilitary(value) {
	military = value;
	localStorage.setItem("military", value);
	makeHoursTable();
	makeMinutesTable();
	updateCurrentTime();
	updateAlarmTime();
}

// Update the time every 100 ms.
setInterval(updateCurrentTime, 100);

// Load military time setting from local storage and initialize everything.
setMilitary((function() {
	let current = localStorage["military"];
	if (current === null) {
		return true;
	}
	return current;
})());

// Unhide body after building page.
document.getElementsByTagName("body")[0].style.visibility = "visible";

function toggleMilitary(checkbox) {
	setMilitary(checkbox.checked);
}

function snooze() {
	alert("SNOOZE");
}

function stop() {
	setAlarmHour(null);
	setAlarmMinTens(0);
	setAlarmMinOnes(0);
}
