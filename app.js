document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const elements = {
        themeToggle: document.getElementById('theme-toggle'),
        taskInput: document.getElementById('task-input'),
        taskDate: document.getElementById('task-date'),
        taskPriority: document.getElementById('task-priority'),
        addTaskBtn: document.getElementById('add-task-btn'),
        taskList: document.getElementById('task-list'),
        emptyState: document.getElementById('empty-state'),
        totalTaskCount: document.getElementById('total-task-count'),
        tasksCompletedCount: document.getElementById('tasks-completed-count'),
        dailyProgress: document.getElementById('daily-progress'),
        dailyProgressText: document.getElementById('daily-progress-text'),
        focusList: document.getElementById('focus-list'),
        suggestedContainer: document.getElementById('suggested-task-container'),
        pomoTimeDisplay: document.getElementById('pomodoro-time'),
        pomoToggleBtn: document.getElementById('pomo-toggle'),
        pomoToggleIcon: document.getElementById('pomo-toggle-icon'),
        pomoResetBtn: document.getElementById('pomo-reset')
    };

    // State
    const STATE_KEY = 'smart-todo-tasks';
    const THEME_KEY = 'smart-todo-theme';
    const DAILY_HISTORY_KEY = 'smart-todo-daily-history';
    let tasks = [];
    let completedTodaySessions = 0; // Local counter for session

    // Pomodoro State
    const POMO_KEY = 'smart-todo-pomodoro-seconds';
    const POMO_WORK_SECONDS = 25 * 60;
    let pomoSecondsRemaining = POMO_WORK_SECONDS;
    let pomoInterval = null;
    let totalPomoSecondsTracked = parseInt(localStorage.getItem(POMO_KEY) || '0');

    // Initialize
    init();

    function init() {
        loadTheme();
        loadTasks();
        setupEventListeners();
        render();
    }

    function setupEventListeners() {
        elements.themeToggle.addEventListener('click', toggleTheme);
        elements.addTaskBtn.addEventListener('click', handleAddTask);
        elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddTask();
        });
        
        // Setup Date picker default to today
        const today = new Date().toISOString().split('T')[0];
        elements.taskDate.min = today;

        // Setup Pomodoro listeners
        if (elements.pomoToggleBtn) {
            elements.pomoToggleBtn.addEventListener('click', togglePomodoro);
            elements.pomoResetBtn.addEventListener('click', resetPomodoro);
        }
    }

    // --- State Management ---
    function updateDailyHistory(type, value) {
        const today = new Date().toISOString().split('T')[0];
        const history = JSON.parse(localStorage.getItem(DAILY_HISTORY_KEY) || '{}');
        if (!history[today]) {
            history[today] = { tasks: 0, pomo: 0 };
        }
        if (type === 'task') {
            history[today].tasks = Math.max(0, history[today].tasks + value);
        } else if (type === 'pomo') {
            history[today].pomo += value;
        }
        localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(history));
    }

    function loadTasks() {
        const stored = localStorage.getItem(STATE_KEY);
        if (stored) {
            tasks = JSON.parse(stored);
            // Rough approximation of today's completed for the demo
            completedTodaySessions = tasks.filter(t => t.completed).length; 
        } else {
            // Demo data for first time users
            tasks = [
                { id: '1', title: 'Review project requirements', dueDate: new Date().toISOString().split('T')[0], priority: 'high', completed: false, createdAt: Date.now() },
                { id: '2', title: 'Design minimal UI mockups', dueDate: '', priority: 'medium', completed: true, createdAt: Date.now() - 1000 },
                { id: '3', title: 'Set up repository', dueDate: '', priority: 'low', completed: false, createdAt: Date.now() - 2000 }
            ];
            completedTodaySessions = 1;
            saveTasks();
        }
    }

    function saveTasks() {
        localStorage.setItem(STATE_KEY, JSON.stringify(tasks));
        render();
    }

    // --- Core Actions ---
    function handleAddTask() {
        const title = elements.taskInput.value.trim();
        if (!title) return;

        const newTask = {
            id: Date.now().toString(),
            title: title,
            dueDate: elements.taskDate.value,
            priority: elements.taskPriority.value,
            completed: false,
            createdAt: Date.now()
        };

        tasks.unshift(newTask);
        saveTasks();

        // Reset input
        elements.taskInput.value = '';
        elements.taskDate.value = '';
        elements.taskPriority.value = 'medium';
    }

    function toggleTaskCompletion(id) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            if (tasks[taskIndex].completed) {
                completedTodaySessions++;
                updateDailyHistory('task', 1);
            } else {
                completedTodaySessions = Math.max(0, completedTodaySessions - 1);
                updateDailyHistory('task', -1);
            }
            saveTasks();
        }
    }

    function deleteTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('task-exit');
            // Wait for animation
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
            }, 300);
        } else {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
        }
    }

    // --- Pomodoro Timer Actions ---
    function formatPomoTime(secs) {
        const min = Math.floor(secs / 60);
        const s = secs % 60;
        return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function togglePomodoro() {
        if (pomoInterval) {
            // Pause
            clearInterval(pomoInterval);
            pomoInterval = null;
            elements.pomoToggleIcon.classList.replace('ph-pause', 'ph-play');
        } else {
            // Start
            elements.pomoToggleIcon.classList.replace('ph-play', 'ph-pause');
            pomoInterval = setInterval(() => {
                pomoSecondsRemaining--;
                
                // Track globally
                totalPomoSecondsTracked++;
                if (totalPomoSecondsTracked % 5 === 0) {
                    // save every 5 seconds to minimize writes
                    localStorage.setItem(POMO_KEY, totalPomoSecondsTracked);
                    updateDailyHistory('pomo', 5);
                }

                if (pomoSecondsRemaining <= 0) {
                    clearInterval(pomoInterval);
                    pomoInterval = null;
                    elements.pomoToggleIcon.classList.replace('ph-pause', 'ph-play');
                    // Alert user
                    alert("Pomodoro session completed! Great job.");
                    resetPomodoro();
                } else {
                    elements.pomoTimeDisplay.textContent = formatPomoTime(pomoSecondsRemaining);
                }
            }, 1000);
        }
    }

    function resetPomodoro() {
        if (pomoInterval) {
            clearInterval(pomoInterval);
            pomoInterval = null;
            elements.pomoToggleIcon.classList.replace('ph-pause', 'ph-play');
        }
        // Force save tracking
        localStorage.setItem(POMO_KEY, totalPomoSecondsTracked);
        pomoSecondsRemaining = POMO_WORK_SECONDS;
        elements.pomoTimeDisplay.textContent = formatPomoTime(pomoSecondsRemaining);
    }

    // --- Rendering logic ---
    function render() {
        renderTaskList();
        updateProductivityStats();
        updateSmartFeatures();
    }

    function renderTaskList() {
        elements.taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            elements.taskList.style.display = 'none';
            elements.emptyState.style.display = 'flex';
        } else {
            elements.taskList.style.display = 'flex';
            elements.emptyState.style.display = 'none';

            // Sort tasks: Incomplete first, then by priority, then by creation date
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            
            const sortedTasks = [...tasks].sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
                    return priorityWeight[b.priority] - priorityWeight[a.priority];
                }
                return b.createdAt - a.createdAt;
            });

            sortedTasks.forEach(task => {
                elements.taskList.appendChild(createTaskElement(task));
            });
        }

        elements.totalTaskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    }

    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-card ${task.completed ? 'completed' : ''} task-enter`;
        div.setAttribute('data-id', task.id);
        div.setAttribute('data-priority', task.priority);

        const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
        const dateHtml = formattedDate ? `<span class="meta-item"><i class="ph ph-calendar"></i> ${formattedDate}</span>` : '';
        
        const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const priorityHtml = `<span class="meta-item"><div class="meta-dot dot-${task.priority}"></div> ${priorityLabel}</span>`;

        div.innerHTML = `
            <input type="checkbox" class="custom-checkbox" aria-label="Mark task ${task.completed ? 'incomplete' : 'complete'}" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-title">${escapeHTML(task.title)}</span>
                <div class="task-meta">
                    ${priorityHtml}
                    ${dateHtml}
                </div>
            </div>
            <button class="delete-btn" aria-label="Delete task">
                <i class="ph ph-trash"></i>
            </button>
        `;

        // Event listeners for generated elements
        const checkbox = div.querySelector('.custom-checkbox');
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        return div;
    }

    function updateProductivityStats() {
        elements.tasksCompletedCount.textContent = completedTodaySessions;
        
        // Calculate progress based on total incomplete + completedToday
        const total = tasks.length;
        const progressPercentage = total === 0 ? 0 : Math.round((completedTodaySessions / total) * 100);
        const clampedProg = Math.min(100, Math.max(0, progressPercentage));
        
        elements.dailyProgress.style.width = `${clampedProg}%`;
        elements.dailyProgressText.textContent = `${clampedProg}%`;
    }

    function updateSmartFeatures() {
        const pendingTasks = tasks.filter(t => !t.completed);
        
        // Update Focus List (Top 3 tasks by priority/dueDate)
        elements.focusList.innerHTML = '';
        if (pendingTasks.length === 0) {
            elements.focusList.innerHTML = '<li class="empty-focus">All caught up for today!</li>';
            elements.suggestedContainer.innerHTML = '<span class="empty-suggested">Take a break. You earned it.</span>';
            return;
        }

        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const sortedForFocus = [...pendingTasks].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]).slice(0, 3);
        
        sortedForFocus.forEach(task => {
            const li = document.createElement('li');
            li.className = 'focus-item';
            li.textContent = task.title;
            elements.focusList.appendChild(li);
        });

        // Update Suggested Next Task
        const suggested = sortedForFocus[0]; // Just take highest priority pending
        elements.suggestedContainer.innerHTML = `
            <div class="suggested-task-card">
                <span class="suggested-title">${escapeHTML(suggested.title)}</span>
                <div class="suggested-meta">
                    <span style="color: var(--priority-${suggested.priority}); text-transform: capitalize; font-weight: 500;">
                        ${suggested.priority} Priority
                    </span>
                </div>
            </div>
        `;
    }

    // --- Theme & Utils ---
    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        // Default to dark if prefers-color-scheme dark
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.setAttribute('data-theme', 'dark');
            updateThemeIcon(true);
        } else {
            updateThemeIcon(false);
        }
    }

    function toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem(THEME_KEY, 'light');
            updateThemeIcon(false);
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem(THEME_KEY, 'dark');
            updateThemeIcon(true);
        }
    }

    function updateThemeIcon(isDark) {
        if (isDark) {
             elements.themeToggle.innerHTML = '<i class="ph ph-sun"></i>';
        } else {
             elements.themeToggle.innerHTML = '<i class="ph ph-moon"></i>';
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
