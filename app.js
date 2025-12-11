const addTimerButton = document.getElementById('add-timer-btn');
const timerList = document.getElementById('timer-list-view');
const singleTimer = document.getElementById('single-timer-view');
const formContainer = document.getElementById('timer-form-container');
const form = document.getElementById('timer-form');
const backButton = document.getElementById('back-btn');
const singleTimerContent = document.getElementById('single-timer-content');

let timers = [];
let viewMode = "list";
let selectedTimerId = null;

/* Handles switching to form view to add a new timer */
addTimerButton.addEventListener('click', () => {
    formContainer.classList.remove('hidden');
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
    form.reset();
    formContainer.classList.add('hidden');
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
    const { showZoom = false, onZoom, onDelete } = options;

    const timerElement = document.createElement('div');
    const playPauseButton = document.createElement('button');
    const resetButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    timerElement.textContent = `${timer.name} - ${formatTime(timer.remaining)}`;

    playPauseButton.textContent = timer.isRunning ? 'Pause' : 'Start';
    playPauseButton.addEventListener('click', () => {
        timer.isRunning = !timer.isRunning;
        render();
    });

    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', () => {
        timer.remaining = timer.duration;
        timer.isRunning = false;
        render();
    });

    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        timers = timers.filter(t => t.id !== timer.id);
        if (onDelete) onDelete(); 
        render();
    });

    timerElement.appendChild(playPauseButton);
    timerElement.appendChild(resetButton);
    timerElement.appendChild(deleteButton);

    // Optional Zoom button (for list view)
    if (showZoom && onZoom) {
        const zoomButton = document.createElement('button');
        zoomButton.textContent = 'Zoom';
        zoomButton.addEventListener('click', () => {
            onZoom();
            render();
        });
        timerElement.appendChild(zoomButton);
    }

    return timerElement;
}

/* Renders the appropriate view based on current mode */
function render() {
    if (viewMode === "list") {
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

