"use strict";

// Use NoSleep.js to prevent the screen from sleeping.
const noSleep = new NoSleep();
document.addEventListener('click', function enableNoSleep() {
	document.removeEventListener('click', enableNoSleep, false);
	noSleep.enable();
}, false);

let military;

let alarmHour = null;
let alarmMinute = null;
let currentHour = null;
let currentMinute = null;

function twoDigit(n) {
	return n < 10 ? "0" + n.toString() : n.toString();
}

function makeHoursTable() {
	const hours = document.getElementById("hours").tBodies[0];
	hours.innerHTML = "";
	for (let rowIdx = 0; rowIdx < 2; ++rowIdx) {
		const row = hours.insertRow(rowIdx);
		for (let colIdx = 0; colIdx < 12; ++colIdx) {
			const cell = row.insertCell(colIdx);
			if (military) {
				cell.innerHTML = twoDigit(12 * rowIdx + colIdx);
			} else {
				const hour = (colIdx == 0 ? "12" : colIdx.toString()) + (rowIdx == 0 ? "am" : "pm");
				cell.innerHTML = hour;
			}
		}
	}
}
function makeMinutesTable() {
	const minutes = document.getElementById("minutes").tBodies[0];
	minutes.innerHTML = "";
	let tens = minutes.insertRow(0);
	for (let colIdx = 0; colIdx < 6; ++colIdx) {
		tens.insertCell(colIdx).innerHTML = colIdx;
	}
	const ones = minutes.insertRow(1);
	for (let colIdx = 0; colIdx < 10; ++colIdx) {
		ones.insertCell(colIdx).innerHTML = colIdx;
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

function updateCurrentTime() {
	const date = new Date();
	currentHour = date.getHours();
	currentMinute = date.getMinutes();
	const second = date.getSeconds();
	document.getElementById("currentTime").innerHTML = timeString(currentHour, currentMinute, second);
	// Update time left.
	let hoursLeft = alarmHour - currentHour;
	let minutesLeft = alarmMinute - currentMinute - (second == 0 ? 0 : 1);
	const secondsLeft = (60 - second) % 60;
	if (minutesLeft < 0) {
		minutesLeft += 60;
		--hoursLeft;
	}
	if (hoursLeft < 0) {
		hoursLeft += 24;
	}
	document.getElementById("timeLeft").innerHTML = "-" + twoDigit(hoursLeft) + ":" + minutesLeft + ":" + twoDigit(secondsLeft);
};

function updateAlarmTime() {
	document.getElementById("alarmTime").innerHTML = alarmHour != null && alarmMinute != null
		? timeString(alarmHour, alarmMinute)
		: "OFF";
}

function updateTimeLeft() {
}

function setMilitary(value) {
	military = value;
	makeHoursTable();
	makeMinutesTable();
	updateCurrentTime();
	updateAlarmTime();
}

function toggleMilitary(checkbox) {
	setMilitary(checkbox.checked);
}

setInterval(updateCurrentTime, 100);

setMilitary(true);

alarmHour = 12;
alarmMinute = 10;
updateAlarmTime();

// Unhide body after building page.
document.getElementsByTagName("body")[0].style.visibility = "visible";
