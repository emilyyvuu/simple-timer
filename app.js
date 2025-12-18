const addTimerButton = document.getElementById('add-timer-btn');
const timerList = document.getElementById('timer-list-view');
const singleTimer = document.getElementById('single-timer-view');
const formContainer = document.getElementById('timer-form-container');
const form = document.getElementById('timer-form');
const backButton = document.getElementById('back-btn');
const singleTimerContent = document.getElementById('single-timer-content');
const cancelTimerButton = document.getElementById('cancel-timer-btn');

let timers = [];
const STORAGE_KEY = 'multi-timer-app';
let viewMode = "list";
let selectedTimerId = null;

/* Load timers from localStorage */
function loadTimers() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Failed to parse timers from storage', e);
        return [];
    }
}

function saveTimers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
}

timers = loadTimers();

function openTimerForm() {
    form.reset();
    formContainer.classList.remove('hidden');
    document.body.classList.add('form-open');
}

function closeTimerForm() {
    formContainer.classList.add('hidden');
    document.body.classList.remove('form-open');
    form.reset();
}

/* Handles switching to form view to add a new timer */
addTimerButton.addEventListener('click', () => {
    openTimerForm();
});

cancelTimerButton.addEventListener('click', () => {
    viewMode = "list";
    selectedTimerId = null;
    closeTimerForm();
    render();
});

/* Handles form submission to add a new timer */
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements['timer-name'].value;
    const hours = parseInt(form.elements['hours'].value) || 0;
    const minutes = parseInt(form.elements['minutes'].value) || 0;
    const seconds = parseInt(form.elements['seconds'].value) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    const newTimer = {
        id: Date.now(),
        name: name,
        duration: totalSeconds,
        remaining: totalSeconds,
        isRunning: false,
        lastStartedAt: null
    };

    timers.push(newTimer);
    saveTimers();
    closeTimerForm();
    render();
});

/* Handles back button to return to list view */
backButton.addEventListener('click', () => {
    viewMode = "list";
    selectedTimerId = null;
    render();
});

/* Formats seconds into MM:SS */
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    // If hours is 0, show MM:SS instead of HH:MM:SS
    if (hours > 0) {
        return `${h}:${m}:${s}`;
    } else {
        return `${m}:${s}`;
    }
}

/* Creates a timer element */
function createTimerElement(timer, options = {}) {
    const { showZoom = false, onZoom, onDelete, showHero = false } = options;

    const timerElement = document.createElement('div');
    timerElement.className = 'timer-card';

    const topActions = document.createElement('div');
    topActions.className = 'timer-top-actions';

    const info = document.createElement('div');
    info.className = 'timer-info';

    const title = document.createElement('h2');
    title.className = 'timer-name';
    title.textContent = timer.name;

    const remaining = document.createElement('p');
    remaining.className = 'timer-remaining';
    remaining.textContent = formatTime(timer.remaining);

    info.appendChild(title);

    if (showHero) {
        const heroImg = document.createElement('img');
        heroImg.src = 'icons/rocket-ship.gif';
        heroImg.alt = '';
        heroImg.setAttribute('aria-hidden', 'true');
        heroImg.className = 'timer-hero';
        info.appendChild(heroImg);
    }

    info.appendChild(remaining);

    const bottomActions = document.createElement('div');
    bottomActions.className = 'timer-bottom-actions';

    function createIconButton({ label, iconSrc, className, onClick }) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className ? `icon-button ${className}` : 'icon-button';
        button.setAttribute('aria-label', label);
        button.addEventListener('click', onClick);

        if (iconSrc) {
            const icon = document.createElement('img');
            icon.src = iconSrc;
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
            icon.loading = 'lazy';
            icon.addEventListener('error', () => {
                icon.remove();
            });
            button.appendChild(icon);
        }

        return button;
    }

    const playPauseButton = createIconButton({
        label: timer.isRunning ? 'Pause timer' : 'Start timer',
        iconSrc: timer.isRunning ? 'icons/pause-button.png' : 'icons/play.png',
        className: 'play-pause-btn',
        onClick: () => {
            timer.isRunning = !timer.isRunning;
            saveTimers();
            render();
        }
    });

    const resetButton = createIconButton({
        label: 'Reset timer',
        iconSrc: 'icons/reset.png',
        className: 'reset-btn',
        onClick: () => {
            timer.remaining = timer.duration;
            timer.isRunning = false;
            saveTimers();
            render();
        }
    });

    const deleteButton = createIconButton({
        label: 'Delete timer',
        iconSrc: 'icons/delete.png',
        className: 'delete-btn',
        onClick: () => {
            timers = timers.filter(t => t.id !== timer.id);
            saveTimers();
            if (onDelete) onDelete();
            render();
        }
    });

    topActions.appendChild(deleteButton);

    if (showZoom && onZoom) {
        const zoomButton = createIconButton({
            label: 'Open single timer view',
            iconSrc: 'icons/fullscreen.png',
            className: 'zoom-btn',
            onClick: () => {
                onZoom();
                render();
            }
        });
        topActions.appendChild(zoomButton);
    } else {
        const spacer = document.createElement('span');
        spacer.className = 'top-action-spacer';
        topActions.appendChild(spacer);
    }

    bottomActions.appendChild(playPauseButton);
    bottomActions.appendChild(resetButton);

    timerElement.appendChild(topActions);
    timerElement.appendChild(info);
    timerElement.appendChild(bottomActions);

    return timerElement;
}

/* Renders the appropriate view based on current mode */
function render() {
    const isListView = viewMode === "list";
    document.body.classList.toggle('single-view-active', !isListView);

    if (isListView) {
        timerList.classList.remove('hidden');
        singleTimer.classList.add('hidden');

        timerList.textContent = '';

        timers.forEach(timer => {
            const el = createTimerElement(timer, {
                showZoom: true,
                onZoom: () => {
                    viewMode = "single";
                    selectedTimerId = timer.id;
                }
            });

            timerList.appendChild(el);
        });

    } else if (viewMode === "single") {
        timerList.classList.add('hidden');
        singleTimer.classList.remove('hidden');

        singleTimerContent.textContent = '';

        const timer = timers.find(t => t.id === selectedTimerId);
        if (!timer) return;

        const el = createTimerElement(timer, {
            showZoom: false,
            showHero: true,
            onDelete: () => {
                viewMode = "list";
                selectedTimerId = null;
            }
        });

        singleTimerContent.appendChild(el);
    }
}

/* Timer countdown logic */
setInterval(() => {
    timers.forEach(timer => {
    if (timer.isRunning && timer.remaining > 0) {
        timer.remaining -= 1;
    } else if (timer.remaining === 0) {
        timer.isRunning = false;
    }
    });
    render();
}, 1000);

render();

