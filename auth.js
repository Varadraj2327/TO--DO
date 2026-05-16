document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const elements = {
        themeToggle: document.getElementById('theme-toggle'),
        loginForm: document.getElementById('login-form'),
        signupForm: document.getElementById('signup-form'),
        toggleToSignupBtn: document.querySelector('#toggle-to-signup .text-btn'),
        toggleToLoginBtn: document.querySelector('#toggle-to-login .text-btn'),
        toggleToSignupText: document.getElementById('toggle-to-signup'),
        toggleToLoginText: document.getElementById('toggle-to-login'),
        passwordToggles: document.querySelectorAll('.toggle-password')
    };

    // State Constants
    const THEME_KEY = 'smart-todo-theme';
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Initialize
    init();

    function init() {
        loadTheme();
        setupEventListeners();
        setupFormValidation(elements.loginForm);
        setupFormValidation(elements.signupForm);
    }

    function setupEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // View Toggles
        elements.toggleToSignupBtn.addEventListener('click', () => switchView('signup'));
        elements.toggleToLoginBtn.addEventListener('click', () => switchView('login'));

        // Password Visibility Toggles
        elements.passwordToggles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.currentTarget.previousElementSibling;
                const icon = e.currentTarget.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('ph-eye', 'ph-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('ph-eye-slash', 'ph-eye');
                }
            });
        });

        // Form Submission
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.signupForm.addEventListener('submit', handleSignup);
    }

    // --- View Toggling ---
    function switchView(view) {
        if (view === 'signup') {
            elements.loginForm.classList.remove('active');
            elements.toggleToSignupText.classList.add('hidden');
            
            elements.signupForm.classList.add('active');
            elements.toggleToLoginText.classList.remove('hidden');
        } else {
            elements.signupForm.classList.remove('active');
            elements.toggleToLoginText.classList.add('hidden');
            
            elements.loginForm.classList.add('active');
            elements.toggleToSignupText.classList.remove('hidden');
        }
    }

    // --- Validation Logic ---
    function setupFormValidation(form) {
        const inputs = form.querySelectorAll('input:not([type="checkbox"])');
        const submitBtn = form.querySelector('button[type="submit"]');

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInput(input);
                checkFormValidity(form, inputs, submitBtn);
            });
            input.addEventListener('blur', () => {
                validateInput(input);
            });
        });
    }

    function validateInput(input) {
        const group = input.closest('.form-group');
        const errorSpan = group.querySelector('.error-msg');
        let isValid = true;
        let errorMessage = '';

        if (!input.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (input.type === 'email' && !EMAIL_REGEX.test(input.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (input.id.includes('password') && input.id !== 'signup-confirm' && input.value.length < 6) {
            isValid = false;
            errorMessage = 'Password must be at least 6 characters';
        } else if (input.id === 'signup-confirm') {
            const passwordInput = document.getElementById('signup-password');
            if (input.value !== passwordInput.value) {
                isValid = false;
                errorMessage = 'Passwords do not match';
            }
        }

        if (!isValid) {
            group.classList.add('invalid');
            if (errorSpan) errorSpan.textContent = errorMessage;
        } else {
            group.classList.remove('invalid');
            if (errorSpan) errorSpan.textContent = '';
        }

        return isValid;
    }

    function checkFormValidity(form, inputs, submitBtn) {
        const allValid = Array.from(inputs).every(input => {
            if (!input.value.trim()) return false;
            if (input.type === 'email' && !EMAIL_REGEX.test(input.value)) return false;
            if (input.id.includes('password') && input.id !== 'signup-confirm' && input.value.length < 6) return false;
            if (input.id === 'signup-confirm') {
                const passwordInput = document.getElementById('signup-password');
                if (input.value !== passwordInput.value) return false;
            }
            return true;
        });

        submitBtn.disabled = !allValid;
    }

    // --- Submissions ---
    function handleLogin(e) {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        mockAuthenticationRequest(btn);
    }

    function handleSignup(e) {
        e.preventDefault();
        const btn = document.getElementById('signup-btn');
        mockAuthenticationRequest(btn);
    }

    function mockAuthenticationRequest(btn) {
        btn.classList.add('loading');
        btn.disabled = true;

        // Simulate network delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    // --- Theme Utils ---
    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
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
});
