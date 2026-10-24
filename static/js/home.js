
document.addEventListener("DOMContentLoaded", () => {
    // Authentication elements
    const modal = document.getElementById("authModal");
    const closeButton = document.getElementById("closeAuth");
    const authForm = document.getElementById("authForm");

    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const nameField = document.getElementById("nameField");
    const confirmPasswordField =
        document.getElementById("confirmPasswordField");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const submitButton = document.getElementById("authSubmit");
    const switchPrompt = document.getElementById("switchPrompt");
    const switchButton = document.getElementById("switchAuth");
    const authMessage = document.getElementById("authMessage");

    const mobileMenu = document.getElementById("mobileMenu");
    const navLinks = document.getElementById("navLinks");
    const yearElement = document.getElementById("currentYear");

    // Check that essential HTML elements exist.
    const requiredElements = [
        modal, closeButton, authForm, title, subtitle,
        nameField, confirmPasswordField, fullName, email,
        password, confirmPassword, submitButton,
        switchPrompt, switchButton, authMessage
    ];

    if (requiredElements.some(element => !element)) {
        console.error(
            "Linkora AI: An authentication HTML element is missing. " +
            "Check the IDs in home.html."
        );
        return;
    }

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    let authMode = "login";
    let lastFocusedElement = null;
    let submitting = false;
    let closeTimer = null;

    // Clear validation messages.
    function clearErrors() {
        document.querySelectorAll(".field-error").forEach(element => {
            element.textContent = "";
        });

        authForm.querySelectorAll("input").forEach(input => {
            input.removeAttribute("aria-invalid");
        });

        authMessage.textContent = "";
    }

    function showError(input, errorId, message) {
        input.setAttribute("aria-invalid", "true");

        const errorElement = document.getElementById(errorId);

        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function showMessage(message, isError = true) {
        authMessage.textContent = message;
        authMessage.style.color = isError ? "#c53535" : "#168252";
    }

    function resetForm() {
        authForm.reset();
        clearErrors();
    }

    // Switch between login and registration.
    function setMode(mode) {
        authMode = mode === "register" ? "register" : "login";

        const registering = authMode === "register";

        title.textContent = registering
            ? "Create your account"
            : "Welcome back!";

        subtitle.textContent = registering
            ? "Create an account to start your journey."
            : "Log in to continue your journey.";

        nameField.hidden = !registering;
        confirmPasswordField.hidden = !registering;

        fullName.required = registering;
        confirmPassword.required = registering;

        password.autocomplete = registering
            ? "new-password"
            : "current-password";

        submitButton.textContent = registering
            ? "Create account"
            : "Log in";

        switchPrompt.textContent = registering
            ? "Already have an account?"
            : "Don't have an account?";

        switchButton.textContent = registering
            ? "Log in"
            : "Sign up";

        resetForm();
    }

    // Open authentication popup.
    function openModal(mode) {
        if (closeTimer !== null) {
            window.clearTimeout(closeTimer);
            closeTimer = null;
        }

        lastFocusedElement = document.activeElement;

        setMode(mode);

        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        requestAnimationFrame(() => {
            modal.classList.add("is-open");
            email.focus();
        });
    }

    // Close authentication popup.
    function closeModal() {
        if (modal.hidden) return;

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");

        if (closeTimer !== null) {
            window.clearTimeout(closeTimer);
        }

        closeTimer = window.setTimeout(() => {
            if (!modal.classList.contains("is-open")) {
                modal.hidden = true;
            }

            closeTimer = null;
        }, 200);

        if (lastFocusedElement &&
            typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    }

    // Open popup from landing-page buttons.
    document.querySelectorAll("[data-open-auth]").forEach(button => {
        button.addEventListener("click", () => {
            openModal(button.dataset.openAuth);
        });
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    switchButton.addEventListener("click", () => {
        setMode(authMode === "login" ? "register" : "login");
        email.focus();
    });

    // Clear individual field errors while typing.
    [
        [fullName, "nameError"],
        [email, "emailError"],
        [password, "passwordError"],
        [confirmPassword, "confirmPasswordError"]
    ].forEach(([input, errorId]) => {
        input.addEventListener("input", () => {
            input.removeAttribute("aria-invalid");

            const errorElement = document.getElementById(errorId);

            if (errorElement) {
                errorElement.textContent = "";
            }

            authMessage.textContent = "";
        });
    });

    // Registration and login submission.
    authForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (submitting) return;

        clearErrors();

        let valid = true;
        const nameValue = fullName.value.trim();
        const emailValue = email.value.trim();
        const passwordValue = password.value;

        // Validate name during registration.
        if (authMode === "register" && nameValue.length < 2) {
            showError(
                fullName,
                "nameError",
                "Please enter your full name."
            );
            valid = false;
        }

        // Validate email.
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(emailValue)) {
            showError(
                email,
                "emailError",
                "Please enter a valid email address."
            );
            valid = false;
        }

        // Validate password.
        if (passwordValue.length < 8 ||
            passwordValue.length > 128) {
            showError(
                password,
                "passwordError",
                "Password must contain 8 to 128 characters."
            );
            valid = false;
        }

        // Confirm password during registration.
        if (authMode === "register" &&
            confirmPassword.value !== passwordValue) {
            showError(
                confirmPassword,
                "confirmPasswordError",
                "The passwords do not match."
            );
            valid = false;
        }

        if (!valid) {
            showMessage("Please correct the highlighted fields.");
            return;
        }

        const registering = authMode === "register";

        const endpoint = registering
            ? "/api/register"
            : "/api/login";

        // These property names must match app.py.
        const payload = {
            email: emailValue,
            password: passwordValue
        };

        if (registering) {
            payload.fullName = nameValue;
            payload.confirmPassword = confirmPassword.value;
        }

        submitting = true;
        submitButton.disabled = true;
        submitButton.textContent = registering
            ? "Creating account..."
            : "Logging in...";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                showMessage(
                    result.message || "Something went wrong. Please try again."
                );
                return;
            }

            showMessage(
                result.message || "Success!",
                false
            );

            // Redirect only after the server confirms success.
            window.location.assign(result.redirect || "/chat");

        } catch (error) {
            console.error("Linkora AI authentication error:", error);

            showMessage(
                "Unable to contact the server. Check Flask and try again."
            );

        } finally {
            submitting = false;
            submitButton.disabled = false;
            submitButton.textContent = authMode === "register"
                ? "Create account"
                : "Log in";
        }
    });

    // Mobile navigation.
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("nav-open");

            mobileMenu.setAttribute("aria-expanded", String(isOpen));
            mobileMenu.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );
            mobileMenu.textContent = isOpen ? "✕" : "☰";
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("nav-open");
                mobileMenu.setAttribute("aria-expanded", "false");
                mobileMenu.setAttribute(
                    "aria-label",
                    "Open navigation"
                );
                mobileMenu.textContent = "☰";
            });
        });
    }

    // If /chat redirects to /?auth=login, open the login popup.
    const params = new URLSearchParams(window.location.search);

    if (params.get("auth") === "login") {
        openModal("login");
        window.history.replaceState(
            {},
            "",
            window.location.pathname
        );
    }
});
