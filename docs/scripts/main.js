"use strict";

let alarm = false;

let alarmH = null;
let alarmM = 0;

let curH = null;
let curM = null;
let curS = null;

let leftH = null;
let leftM = null;
let leftS = null;

const content = document.getElementById("content");
const military = document.getElementById("military");
const tableH = document.getElementById("hours").tBodies[0];
const tableM = document.getElementById("minutes").tBodies[0];
const snoozeButton = document.getElementById("snooze");
const stopButton = document.getElementById("stop");
let alarmSound =  document.getElementById("alarm-sound");

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
			if (military.checked) {
				cell.innerHTML = twoDigit(hour);
			} else {
				cell.innerHTML = colIdx == 0 ? "12" : colIdx.toString();
			}
			cell.id = "h" + hour;
			cell.className = "time";
			if (alarmH === hour) {
				cell.className += " selected";
			}
			cell.onclick = () => {
				turnOffAlarm();
				setAlarmH(hour);
				updateAlarmDisplay();
				updateLeft();
			};
		}
		if (!military.checked) {
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
	offButton.colSpan = military.checked ? 12 : 14;
	offButton.style += "; text-align: center";
	offButton.className = "time";
	
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
			cell.className = "time";
			if (alarmM === m) {
				cell.className += " selected";
			}
			cell.onclick = () => {
				turnOffAlarm();
				setAlarmM(m);
				updateAlarmDisplay();
				updateLeft();
			};
		}
	}
}

function timeString(hour, minute, second = null) {
	var result = military.checked
		? twoDigit(hour)
		: hour == 0 || hour == 12 ? "12" : (hour % 12).toString();
	result += ":" + twoDigit(minute);
	if (second != null) {
		result += ":" + twoDigit(second);
	}
	if (!military.checked) {
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
			alarmSound.play();
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
	// Update checkbox and local storage.
	military.checked = value;
	localStorage.setItem("military", value);
	// Remake tables.
	makeTableH();
	makeTableM();
	// Update display.
	updateAlarmDisplay();
	updateCur();
}

function turnOffAlarm() {
	// Stop the sound.
	alarmSound.pause();
	alarmSound.currentTime = 0;
	// Disable snooze and stop buttons.
	snoozeButton.disabled = true;
	stopButton.disabled = true;
}

// Reset the alarm for some number of minutes later.
function snooze() {
	// The number of minutes to snooze.
	const snoozeM = 9;
	// Set new alarm time.
	let newAlarmM = alarmM + snoozeM;
	let newAlarmH = alarmH;
	if (newAlarmM >= 60) {
		newAlarmM -= 60;
		newAlarmH = (newAlarmH + 1) % 24;
	}
	setAlarmM(newAlarmM);
	setAlarmH(newAlarmH);
	turnOffAlarm();
	// Update display.
	updateAlarmDisplay();
	updateLeft();
}

// Stop the alarm and reset the alarm time.
function stop() {
	setAlarmH(null);
	setAlarmM(0);
	turnOffAlarm();
	// Update display.
	updateAlarmDisplay();
	updateLeft();
}

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

// Load military time setting from local storage and initialize everything.
setMilitary(localStorage["military"] === "true");

// Update every 100 ms.
setInterval(() => {
	updateCur();
	updateLeft();
}, 100);

// Scale the content initially.
scaleContent();

// Show body after building page.
document.getElementsByTagName("body")[0].style.visibility = "visible";
