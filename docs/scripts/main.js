"use strict";

// Use NoSleep.js to prevent the screen from sleeping.
const noSleep = new NoSleep();
document.addEventListener('click', function enableNoSleep() {
	document.removeEventListener('click', enableNoSleep, false);
	noSleep.enable();
}, false);

const snoozeM = 9;

let military = null;

let alarm = false;

let alarmH = null;
let alarmM = 0;

let curH = null;
let curM = null;
let curS = null;

let leftH = null;
let leftM = null;
let leftS = null;

const tableH = document.getElementById("hours").tBodies[0];
const tableM = document.getElementById("minutes").tBodies[0];
const snoozeButton = document.getElementById("snooze");
const stopButton = document.getElementById("stop");
let alarmSound =  document.getElementById("alarm-sound");

function twoDigit(n) {
	return n < 10 ? "0" + n.toString() : n.toString();
}

function makeTableH() {
	tableH.innerHTML = "";
	// Split hours across two rows.
	for (let rowIdx = 0; rowIdx < 2; ++rowIdx) {
		const row = tableH.insertRow(rowIdx);
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
			if (alarmH === hour) {
				cell.className += " selected";
			}
			cell.onclick = () => {
				setAlarmH(hour);
				updateAlarmDisplay();
				updateLeft();
			};
		}
		if (!military) {
			// Add am/pm to the beginning and end of the rows under 12-hour time.
			const amPm = rowIdx == 0 ? "am" : "pm";
			row.insertCell(12).innerHTML = amPm;
			row.insertCell(0).innerHTML = amPm;
		}
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
			cell.className = "time min";
			if (alarmM === m) {
				cell.className += " selected";
			}
			cell.onclick = () => {
				setAlarmM(m);
				updateAlarmDisplay();
				updateLeft();
			};
		}
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
function updateAlarmDisplay() {
	if (alarmH != null) {
		var alarmTimeText = timeString(alarmH, alarmM);
	} else {
		var alarmTimeText = "OFF";
	}
	document.getElementById("alarm-time").innerHTML = alarmTimeText;
}

// Sets the hour component of the alarm time.
function setAlarmH(value) {
	if (alarmH != null) {
		// Deselect the previously selected cell.
		document.getElementById("h" + alarmH).className = "time";
	}
	alarmH = value;
	// Select the new cell, if any.
	if (alarmH != null) {
		document.getElementById("h" + alarmH).className = "time selected";
	}
}

// Sets the minute component of the alarm time.
function setAlarmM(value) {
	// Deselect the previously selected cell.
	document.getElementById("m" + alarmM).className = "time";
	alarmM = value;
	// Select the new cell.
	document.getElementById("m" + alarmM).className = "time selected";
	// Update display.
	updateAlarmDisplay();
	updateLeft();
}

// Updates the current system time.
function updateCur() {
	const date = new Date();
	curH = date.getHours();
	curM = date.getMinutes();
	curS = date.getSeconds();
	document.getElementById("cur-time").innerHTML = timeString(curH, curM, curS);
};

// Updates and displays the time left until alarm.
function updateLeft() {
	if (alarmH != null) {
		leftH = alarmH - curH;
		leftM = alarmM - curM - (curS == 0 ? 0 : 1);
		leftS = (60 - curS) % 60;
		if (leftM < 0) {
			leftM += 60;
			--leftH;
		}
		if (leftH < 0) {
			leftH += 24;
		}
		if (leftH == 0 && leftM == 0 && leftS == 0) {
			// Alarm time!
			alarm = true;
			snoozeButton.disabled = false;
			stopButton.disabled = false;
		}
		var leftText = "-" + twoDigit(leftH) + ":" + twoDigit(leftM) + ":" + twoDigit(leftS);
	} else {
		leftH = null;
		leftM = null;
		leftS = null;
		var leftText = "--:--:--";
	}
	document.getElementById("time-left").innerHTML = leftText;
}

// Sets the military time setting and updates all the elements accordingly.
function setMilitary(value) {
	military = value;
	localStorage.setItem("military", value);
	makeTableH();
	makeTableM();
	updateAlarmDisplay();
	updateCur();
}

// Load military time setting from local storage and initialize everything.
setMilitary((() => {
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

function turnOffAlarm() {
	alarm = false;
	// Stop the sound.
	alarmSound.pause();
	alarmSound.currentTime = 0;
	// Disable snooze and stop buttons.
	snoozeButton.disabled = true;
	stopButton.disabled = true;
	// Update display.
	updateAlarmDisplay();
	updateLeft();
}

// Reset the alarm for some number of minutes later.
function snooze() {
	let newAlarmM = alarmM + snoozeM;
	let newAlarmH = alarmH;
	if (alarmM >= 60) {
		alarmM -= 60;
		alarmH = (alarmH + 1) % 24;
	}
	setAlarmM(newAlarmM);
	setAlarmH(newAlarmH);
	turnOffAlarm();
}

// Stop the alarm and reset the alarm time.
function stop() {
	setAlarmH(null);
	setAlarmM(0);
	turnOffAlarm();
}

// Update every 100 ms.
setInterval(() => {
	updateCur();
	updateLeft();
	if (alarm && alarmSound.paused) {
		alarmSound.play().catch(error => { log("Could not play alarm!"); });
	}
}, 100);
