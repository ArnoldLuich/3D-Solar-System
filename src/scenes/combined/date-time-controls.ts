//#region setup time unit values

const seconds = [1, 5, 10, 15, 30];

const minutes = [1, 2, 5, 10, 30];
const minutesInSeconds = minutes.map(a => a*60);

const hours = [1, 5, 9, 12]
const hoursInSeconds = hours.map(a => a*60*60);

const days = [1, 3, 5];
const daysInSeconds = days.map(a => a*60*60*24);

const weeks = [1, 3];
const weeksInSeconds = weeks.map(a => a*60*60*24*7);

const months = [1, 2, 6];
const monthsInSeconds = months.map(a => a*60*60*24*30.436875);

const years = [1, 2, 3];
const yearsInSeconds = years.map(a => a*60*60*24*365.25);

const positiveTimeUnits = [...seconds, ...minutesInSeconds, ...hoursInSeconds, ...daysInSeconds, ...weeksInSeconds, ...monthsInSeconds, ...yearsInSeconds];
const timeUnits = [...positiveTimeUnits.map(a => a*-1).reverse(), ...positiveTimeUnits];

//#endregion

let cursor = timeUnits.indexOf(1); // start at 1 second = 1 second
function increaseTimeRate() {
    if (cursor >= timeUnits.length - 1) return timeUnits.length - 1;
    return cursor++;
}

function decreaseTimeRate() {
    if (cursor <= 0) return 0;
    return cursor--;
}

function updateButtonVisibility(element: HTMLElement, visible: boolean) {
    element.style.visibility = visible ? 'visible' : 'hidden';
}

let paused = false;
function pause() {
    paused = true;
}
function unpause() {
    paused = false;
}

function getActualTimeRate() {
    return timeUnits[cursor];
}

function getDerivedTimeRate() {
    if (paused) return 0;
    return getActualTimeRate();
}

function getLabelFor(originalUnits: number[], secondsPerUnit: number[], timeRate: number, negative: boolean, singular: string, plural: string) {
    const idx = secondsPerUnit.indexOf(timeRate);
    if (idx === -1) return '';
    if (idx === 0) return `${negative ? '-' : ''}${originalUnits?.[idx]} ${singular}/s`;
    return `${negative ? '-' : ''}${originalUnits?.[idx]} ${plural}/s`
}

function getTimeRateTitle() {
    let timeRate = getDerivedTimeRate();
    if (timeRate === 0) return 'paused';
    if (timeRate === 1) return 'real rate';
    const isNegative = timeRate < 0;
    timeRate = Math.abs(timeRate);
    if (seconds.includes(timeRate)) return getLabelFor(seconds, seconds, timeRate, isNegative, 'sec', 'secs');
    if (minutesInSeconds.includes(timeRate)) return getLabelFor(minutes, minutesInSeconds, timeRate, isNegative, 'min', 'mins');
    if (hoursInSeconds.includes(timeRate)) return getLabelFor(hours, hoursInSeconds, timeRate, isNegative, 'hour', 'hours');
    if (daysInSeconds.includes(timeRate)) return getLabelFor(days, daysInSeconds, timeRate, isNegative, 'day', 'days');
    if (weeksInSeconds.includes(timeRate)) return getLabelFor(weeks, weeksInSeconds, timeRate, isNegative, 'week', 'weeks');
    if (monthsInSeconds.includes(timeRate)) return getLabelFor(months, monthsInSeconds, timeRate, isNegative, 'month', 'months');
    if (yearsInSeconds.includes(timeRate)) return getLabelFor(years, yearsInSeconds, timeRate, isNegative, 'year', 'years');
    return "???";
}

function getTimeRateSubtitle() {
    let timeRate = getActualTimeRate();
    if (!getIsPaused()) return '';
    const isNegative = timeRate < 0;
    timeRate = Math.abs(timeRate);
    if (seconds.includes(timeRate)) return getLabelFor(seconds, seconds, timeRate, isNegative, 'sec', 'secs');
    if (minutesInSeconds.includes(timeRate)) return getLabelFor(minutes, minutesInSeconds, timeRate, isNegative, 'min', 'mins');
    if (hoursInSeconds.includes(timeRate)) return getLabelFor(hours, hoursInSeconds, timeRate, isNegative, 'hour', 'hours');
    if (daysInSeconds.includes(timeRate)) return getLabelFor(days, daysInSeconds, timeRate, isNegative, 'day', 'days');
    if (weeksInSeconds.includes(timeRate)) return getLabelFor(weeks, weeksInSeconds, timeRate, isNegative, 'week', 'weeks');
    if (monthsInSeconds.includes(timeRate)) return getLabelFor(months, monthsInSeconds, timeRate, isNegative, 'month', 'months');
    if (yearsInSeconds.includes(timeRate)) return getLabelFor(years, yearsInSeconds, timeRate, isNegative, 'year', 'years');
    return "???";
}


window.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') {
        increaseTimeRate();
        updateTimeRateControls()
    } else if (event.key === 'ArrowLeft') {
        decreaseTimeRate();
        updateTimeRateControls()
    } else if (event.key === 'ArrowDown') {
        pause();
        updateTimeRateControls()
    } else if (event.key === 'ArrowUp') {
        unpause();
        updateTimeRateControls()
    }
});


const dateLabel = document.getElementById('date-label')!;
const rateLabel = document.getElementById('rate-label')!;
const rateLabelTitle = document.getElementById('rate-label-title')!;
const rateLabelSubTitle = document.getElementById('rate-label-subtitle')!;
const timeLabel = document.getElementById('time-label')!;
const pauseButton = document.getElementById('pause-button')!;
const playButton = document.getElementById('play-button')!;
const forwardButton = document.getElementById('forward-button')!;
const backButton = document.getElementById('back-button')!;

pauseButton.onclick = () => {
    pause();
    updateTimeRateControls()
}
playButton.onclick = () => {
    unpause();
    updateTimeRateControls();
}
forwardButton.onclick = () => {
    increaseTimeRate();
    updateTimeRateControls();
}
backButton.onclick = () => {
    decreaseTimeRate();
    updateTimeRateControls();
}

function updateTimeRateControls() {
    rateLabelTitle.innerText = getTimeRateTitle();
    rateLabelSubTitle.innerText = getTimeRateSubtitle();
    updateButtonVisibility(playButton, paused);
    updateButtonVisibility(pauseButton, !paused);
}
updateTimeRateControls();

export function updateDateTimeLabels(current: Date) {
    dateLabel.innerText = current.toLocaleDateString('en-GB');
    timeLabel.innerText = current.toLocaleTimeString('en-GB', { hour12: false });
}

export function getNextDateTime(previous: Date, deltaTime: number) {
    const timeRate = getDerivedTimeRate();
    return new Date(previous.getTime() + deltaTime * timeRate);
}

export function getIsPaused() {
    return paused;
}