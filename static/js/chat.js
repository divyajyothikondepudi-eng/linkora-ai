"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // =====================================================
    // SIDEBAR
    // =====================================================
    const sidebar = document.getElementById("sidebar");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const openSidebarBtn = document.getElementById("openSidebar");
    const closeSidebarBtn = document.getElementById("closeSidebar");

    function isMobileSidebar() {
        return window.matchMedia("(max-width: 850px)").matches;
    }

    function closeMobileSidebar() {
        if (isMobileSidebar()) {
            document.body.classList.remove("sidebar-open");
        }
    }

    openSidebarBtn?.addEventListener("click", () => {
        if (isMobileSidebar()) {
            document.body.classList.toggle("sidebar-open");
        } else {
            document.body.classList.toggle("sidebar-collapsed");
        }
    });

    closeSidebarBtn?.addEventListener("click", closeMobileSidebar);
    sidebarBackdrop?.addEventListener("click", closeMobileSidebar);

    window.addEventListener("resize", () => {
        if (!isMobileSidebar()) {
            document.body.classList.remove("sidebar-open");
        }
    });

    // =====================================================
    // THEME
    // =====================================================
    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");

    function applyTheme(dark) {
        document.body.classList.toggle("dark", dark);

        if (themeIcon) themeIcon.textContent = dark ? "☀" : "☾";
        if (themeLabel) themeLabel.textContent = dark ? "Light mode" : "Dark mode";

        try {
            localStorage.setItem("linkora-theme", dark ? "dark" : "light");
        } catch (_) {
            // Theme preference is optional.
        }
    }

    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem("linkora-theme") || "light";
    } catch (_) {
        // Use the default theme.
    }

    applyTheme(savedTheme === "dark");

    themeToggle?.addEventListener("click", () => {
        applyTheme(!document.body.classList.contains("dark"));
    });

    // =====================================================
    // PROFILE MENU
    // =====================================================
    const profileMenuBtn = document.getElementById("profileMenuBtn");
    const profileMenu = document.getElementById("profileMenu");
    const addAccountBtn = document.getElementById("addAccountBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    profileMenuBtn?.addEventListener("click", event => {
        event.stopPropagation();

        const shouldOpen = profileMenu?.classList.contains("hidden");
        profileMenu?.classList.toggle("hidden", !shouldOpen);
        profileMenuBtn.setAttribute("aria-expanded", String(!!shouldOpen));
    });

    profileMenu?.addEventListener("click", event => event.stopPropagation());

    document.addEventListener("click", event => {
        if (
            profileMenu &&
            profileMenuBtn &&
            !profileMenu.contains(event.target) &&
            !profileMenuBtn.contains(event.target)
        ) {
            profileMenu.classList.add("hidden");
            profileMenuBtn.setAttribute("aria-expanded", "false");
        }
    });

    // =====================================================
    // LOGIN / REGISTER MODAL
    // =====================================================
    const modal = document.getElementById("authModal");
    const closeButton = document.getElementById("closeAuth");
    const authForm = document.getElementById("authForm");

    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const nameField = document.getElementById("nameField");
    const confirmPasswordField = document.getElementById("confirmPasswordField");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const submitButton = document.getElementById("authSubmit");
    const switchPrompt = document.getElementById("switchPrompt");
    const switchButton = document.getElementById("switchAuth");
    const authMessage = document.getElementById("authMessage");

    let authMode = "login";
    let submitting = false;
    let lastFocusedElement = null;

    function clearErrors() {
        document.querySelectorAll(".field-error").forEach(element => {
            element.textContent = "";
        });

        authForm?.querySelectorAll("input").forEach(input => {
            input.removeAttribute("aria-invalid");
        });

        if (authMessage) authMessage.textContent = "";
    }

    function showError(input, errorId, message) {
        input?.setAttribute("aria-invalid", "true");

        const errorElement = document.getElementById(errorId);
        if (errorElement) errorElement.textContent = message;
    }

    function showMessage(message, isError = true) {
        if (!authMessage) return;

        authMessage.textContent = message;
        authMessage.style.color = isError ? "#c53535" : "#168252";
    }

    function resetForm() {
        authForm?.reset();
        clearErrors();
    }

    function setMode(mode) {
        authMode = mode === "register" ? "register" : "login";
        const registering = authMode === "register";

        if (title) {
            title.textContent = registering ? "Create your account" : "Welcome back!";
        }

        if (subtitle) {
            subtitle.textContent = registering
                ? "Create an account to start your journey."
                : "Log in to continue your journey.";
        }

        if (nameField) nameField.hidden = !registering;
        if (confirmPasswordField) confirmPasswordField.hidden = !registering;

        if (fullName) fullName.required = registering;
        if (confirmPassword) confirmPassword.required = registering;

        if (password) {
            password.autocomplete = registering ? "new-password" : "current-password";
        }

        if (submitButton) {
            submitButton.textContent = registering ? "Create account" : "Log in";
        }

        if (switchPrompt) {
            switchPrompt.textContent = registering
                ? "Already have an account?"
                : "Don't have an account?";
        }

        if (switchButton) {
            switchButton.textContent = registering ? "Log in" : "Sign up";
        }

        resetForm();
    }

    function openModal(mode = "login") {
        if (!modal) return;

        lastFocusedElement = document.activeElement;
        setMode(mode);

        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        requestAnimationFrame(() => {
            modal.classList.add("is-open");
            email?.focus();
        });
    }

    function closeModal() {
        if (!modal || modal.hidden) return;

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");

        window.setTimeout(() => {
            if (!modal.classList.contains("is-open")) {
                modal.hidden = true;
            }
        }, 200);

        if (typeof lastFocusedElement?.focus === "function") {
            lastFocusedElement.focus();
        }
    }

    addAccountBtn?.addEventListener("click", () => {
        profileMenu?.classList.add("hidden");
        profileMenuBtn?.setAttribute("aria-expanded", "false");
        openModal("login");
    });

    closeButton?.addEventListener("click", closeModal);

    modal?.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    switchButton?.addEventListener("click", () => {
        setMode(authMode === "login" ? "register" : "login");
        email?.focus();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMobileSidebar();
            profileMenu?.classList.add("hidden");
            profileMenuBtn?.setAttribute("aria-expanded", "false");

            if (modal && !modal.hidden) closeModal();
        }
    });

    [
        [fullName, "nameError"],
        [email, "emailError"],
        [password, "passwordError"],
        [confirmPassword, "confirmPasswordError"]
    ].forEach(([input, errorId]) => {
        input?.addEventListener("input", () => {
            input.removeAttribute("aria-invalid");

            const errorElement = document.getElementById(errorId);
            if (errorElement) errorElement.textContent = "";

            if (authMessage) authMessage.textContent = "";
        });
    });

    authForm?.addEventListener("submit", async event => {
        event.preventDefault();

        if (submitting) return;

        clearErrors();

        let valid = true;
        const nameValue = fullName?.value.trim() || "";
        const emailValue = email?.value.trim() || "";
        const passwordValue = password?.value || "";

        if (authMode === "register" && nameValue.length < 2) {
            showError(fullName, "nameError", "Please enter your full name.");
            valid = false;
        }

        // Correct email validation.
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(emailValue)) {
            showError(email, "emailError", "Please enter a valid email address.");
            valid = false;
        }

        if (passwordValue.length < 8 || passwordValue.length > 128) {
            showError(
                password,
                "passwordError",
                "Password must contain 8 to 128 characters."
            );
            valid = false;
        }

        if (
            authMode === "register" &&
            confirmPassword?.value !== passwordValue
        ) {
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
        const endpoint = registering ? "/api/register" : "/api/login";

        const payload = {
            email: emailValue,
            password: passwordValue
        };

        if (registering) {
            payload.fullName = nameValue;
            payload.confirmPassword = confirmPassword.value;
        }

        submitting = true;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = registering
                ? "Creating account..."
                : "Logging in...";
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(payload)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                showMessage(
                    result.message || "Something went wrong. Please check your details."
                );
                return;
            }

            showMessage(result.message || "Success!", false);
            window.location.assign(result.redirect || "/chat");
        } catch (error) {
            console.error("Linkora authentication error:", error);
            showMessage("Unable to contact the server. Check Flask and try again.");
        } finally {
            submitting = false;

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent =
                    authMode === "register" ? "Create account" : "Log in";
            }
        }
    });

    // =====================================================
    // LOG OUT
    // =====================================================
    logoutBtn?.addEventListener("click", async () => {
        logoutBtn.disabled = true;

        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            if (response.redirected) {
                window.location.assign(response.url);
            } else if (response.ok) {
                window.location.assign("/");
            } else {
                alert("Unable to log out. Please try again.");
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("Could not connect to the server.");
        } finally {
            logoutBtn.disabled = false;
        }
    });

    // =====================================================
    // CHAT ELEMENTS AND STATE
    // =====================================================
    const newChatBtn = document.getElementById("newChatBtn");
    const historySearch = document.getElementById("historySearch");
    const chatHistory = document.getElementById("chatHistory");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const messages = document.getElementById("messages");
    const typingIndicator = document.getElementById("typingIndicator");
    const composer = document.getElementById("composer");
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const attachmentPreview = document.getElementById("attachmentPreview");

    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");
    const profileMenuName = document.getElementById("profileMenuName");
    const profileMenuEmail = document.getElementById("profileMenuEmail");

    let conversations = [];
    let currentConversationId = null;
    let selectedFiles = [];
    let sending = false;
    let historyLoaded = false;
    let saveQueue = Promise.resolve();

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    // DOCX is included for Word certificates and documents.
    const allowedExtensions = [
        "pdf", "docx", "txt", "md", "csv",
        "png", "jpg", "jpeg", "webp"
    ];

    function createId() {
        return window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    // Basic safe Markdown rendering for AI responses.
    function renderMarkdown(value) {
        let safe = escapeHTML(String(value || ""));

        safe = safe.replace(/^### (.+)$/gm, "<h4>$1</h4>");
        safe = safe.replace(/^## (.+)$/gm, "<h3>$1</h3>");
        safe = safe.replace(/^# (.+)$/gm, "<h2>$1</h2>");
        safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
        safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
        safe = safe.replace(/^[ \t]*[-*] +(.+)$/gm, "• $1");

        return safe.replace(/\n/g, "<br>");
    }

    function getInitials(name) {
        return String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");
    }

    // =====================================================
    // LOAD PROFILE
    // =====================================================
    async function loadProfile() {
        try {
            const response = await fetch("/api/me", {
                credentials: "same-origin"
            });

            if (response.status === 401) {
                window.location.assign("/");
                return;
            }

            if (!response.ok) return;

            const data = await response.json();

            if (data.success && data.user) {
                const name = data.user.full_name || "Linkora User";
                const userEmail = data.user.email || "";

                if (userName) userName.textContent = name;
                if (userAvatar) userAvatar.textContent = getInitials(name) || "L";
                if (profileMenuName) profileMenuName.textContent = name;
                if (profileMenuEmail) profileMenuEmail.textContent = userEmail;
            }
        } catch (error) {
            console.error("Unable to load profile:", error);
        }
    }

    // =====================================================
    // LOAD AND SAVE DATABASE-BACKED CONVERSATIONS
    // =====================================================
    async function loadConversations() {
        const response = await fetch("/api/conversations", {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        });

        if (response.status === 401) {
            window.location.assign("/");
            throw new Error("Your session has expired. Please log in again.");
        }

        const result = await response.json().catch(() => ({}));

        if (
            !response.ok ||
            result.success !== true ||
            !Array.isArray(result.conversations)
        ) {
            throw new Error(result.message || "Unable to load chat history.");
        }

        conversations = result.conversations.filter(item =>
            item &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            Array.isArray(item.messages)
        );

        historyLoaded = true;
    }

    function saveConversations() {
        if (!historyLoaded) return Promise.resolve();

        const snapshot = JSON.stringify({ conversations });

        saveQueue = saveQueue
            .catch(() => {})
            .then(async () => {
                const response = await fetch("/api/conversations", {
                    method: "PUT",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: snapshot
                });

                if (response.status === 401) {
                    window.location.assign("/");
                    throw new Error("Your session has expired. Please log in again.");
                }

                const result = await response.json().catch(() => ({}));

                if (!response.ok || result.success !== true) {
                    throw new Error(result.message || "Unable to save chat history.");
                }
            })
            .catch(error => {
                console.error("Unable to save chat history:", error);
            });

        return saveQueue;
    }

    function getCurrentConversation() {
        return conversations.find(item => item.id === currentConversationId);
    }

    // =====================================================
    // CHAT HISTORY SIDEBAR
    // =====================================================
    function renderHistory() {
        if (!chatHistory || !historySearch) return;

        const term = historySearch.value.trim().toLowerCase();

        const filtered = conversations.filter(item =>
            item.title.toLowerCase().includes(term)
        );

        if (!filtered.length) {
            chatHistory.innerHTML =
                '<p class="empty-history">No conversations found.</p>';
            return;
        }

        chatHistory.innerHTML = filtered.map(item => `
            <button
                class="history-item ${item.id === currentConversationId ? "active" : ""}"
                type="button"
                data-id="${escapeHTML(item.id)}"
                title="${escapeHTML(item.title)}"
            >
                <span>▤</span>
                <span class="history-item-title">${escapeHTML(item.title)}</span>
            </button>
        `).join("");

        chatHistory.querySelectorAll(".history-item").forEach(button => {
            button.addEventListener("click", () => {
                openConversation(button.dataset.id);
                closeMobileSidebar();
            });
        });
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            const area = document.querySelector(".chat-area");
            if (area) area.scrollTop = area.scrollHeight;
        });
    }

    function resizeTextarea() {
        if (!messageInput) return;
        messageInput.style.height = "auto";
        messageInput.style.height = `${Math.min(messageInput.scrollHeight, 180)}px`;
    }

    // =====================================================
    // RENDER MESSAGES
    // =====================================================
    function renderMessage(message, addToDOM = true) {
        if (!messages || !welcomeScreen) return;

        if (addToDOM) {
            welcomeScreen.classList.add("hidden");
            messages.classList.remove("hidden");
        }

        const wrapper = document.createElement("article");
        wrapper.className =
            `message ${message.role === "assistant" ? "assistant" : "user"}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = message.role === "user"
            ? (getInitials(userName?.textContent) || "Y")
            : "L";

        const content = document.createElement("div");
        content.className = "message-content";

        const label = document.createElement("div");
        label.className = "message-label";
        label.textContent = message.role === "user" ? "You" : "Linkora AI";

        const text = document.createElement("div");
        text.className = "message-text";

        if (message.role === "assistant") {
            text.innerHTML = renderMarkdown(message.content || "");
        } else {
            text.textContent = message.content || "";
        }

        content.append(label, text);

        if (message.role === "assistant") {
            const actions = document.createElement("div");
            actions.className = "message-actions";

            const copy = document.createElement("button");
            copy.type = "button";
            copy.textContent = "Copy";

            copy.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(message.content || "");
                    copy.textContent = "Copied!";
                    window.setTimeout(() => {
                        copy.textContent = "Copy";
                    }, 1200);
                } catch (_) {
                    alert("Copy was blocked by your browser.");
                }
            });

            const edit = document.createElement("button");
            edit.type = "button";
            edit.textContent = "Edit last prompt";

            edit.addEventListener("click", () => {
                const conversation = getCurrentConversation();
                const last = conversation &&
                    [...conversation.messages].reverse()
                        .find(item => item.role === "user");

                if (last && messageInput) {
                    messageInput.value = last.content || "";
                    resizeTextarea();
                    messageInput.focus();
                }
            });

            const regenerate = document.createElement("button");
            regenerate.type = "button";
            regenerate.textContent = "Regenerate";

            regenerate.addEventListener("click", () => {
                const conversation = getCurrentConversation();
                if (!conversation || sending) return;

                const last = [...conversation.messages].reverse()
                    .find(item => item.role === "user");

                if (last && messageInput) {
                    messageInput.value = last.content || "";
                    resizeTextarea();
                    sendMessage();
                }
            });

            actions.append(copy, edit, regenerate);
            content.appendChild(actions);
        }

        wrapper.append(avatar, content);
        messages.appendChild(wrapper);

        if (addToDOM) scrollToBottom();
    }
    // =====================================================
    // OPEN AN EXISTING CONVERSATION
    // =====================================================
    function openConversation(id) {
        const conversation = conversations.find(item => item.id === id);
        if (!conversation) return;

        currentConversationId = id;

        welcomeScreen?.classList.add("hidden");
        messages?.classList.remove("hidden");

        if (messages) messages.innerHTML = "";

        conversation.messages.forEach(message => {
            renderMessage(message, false);
        });

        renderHistory();
        scrollToBottom();
    }

    // =====================================================
    // START A NEW CHAT
    // =====================================================
    function startNewChat() {
        if (sending) return;

        currentConversationId = null;

        if (messages) {
            messages.innerHTML = "";
            messages.classList.add("hidden");
        }

        welcomeScreen?.classList.remove("hidden");
        typingIndicator?.classList.add("hidden");

        selectedFiles = [];

        if (fileInput) fileInput.value = "";
        renderAttachments();

        if (messageInput) {
            messageInput.value = "";
            resizeTextarea();
        }

        renderHistory();
        closeMobileSidebar();
        messageInput?.focus();
    }

    function ensureConversation(firstMessage) {
        let conversation = getCurrentConversation();

        if (!conversation) {
            conversation = {
                id: createId(),
                title: String(firstMessage || "New conversation").slice(0, 42),
                messages: [],
                updatedAt: Date.now()
            };

            conversations.unshift(conversation);
            currentConversationId = conversation.id;
        }

        return conversation;
    }

    // =====================================================
    // FILE ATTACHMENTS
    // =====================================================
    function renderAttachments() {
        if (!attachmentPreview) return;

        attachmentPreview.innerHTML = "";

        if (!selectedFiles.length) {
            attachmentPreview.classList.add("hidden");
            return;
        }

        attachmentPreview.classList.remove("hidden");

        selectedFiles.forEach((file, index) => {
            const chip = document.createElement("div");
            chip.className = "attachment-chip";

            const name = document.createElement("span");
            name.textContent = file.name;

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "×";
            remove.setAttribute("aria-label", `Remove ${file.name}`);

            remove.addEventListener("click", () => {
                selectedFiles.splice(index, 1);
                renderAttachments();
            });

            chip.append(name, remove);
            attachmentPreview.appendChild(chip);
        });
    }

    // =====================================================
    // SEND MESSAGE TO REAL AI BACKEND
    // =====================================================
    async function sendMessage() {
        if (sending || !historyLoaded) return;

        const prompt = messageInput?.value.trim() || "";
        const files = [...selectedFiles];

        if (!prompt && files.length === 0) return;

        // When a certificate is uploaded without a prompt,
        // ask the AI to create a LinkedIn post from its contents.
        const requestPrompt = prompt || (
            "Read the attached certificate carefully and create " +
            "a professional LinkedIn post using the verified details. " +
            "Do not invent missing information. Provide two different " +
            "professional post versions."
        );

        const conversation = ensureConversation(
            prompt || files.map(file => file.name).join(", ")
        );

        // Include recent context so follow-up requests can refer
        // to earlier messages in this conversation.
        const history = conversation.messages
            .slice(-12)
            .filter(message =>
                ["user", "assistant"].includes(message.role)
            )
            .map(message => ({
                role: message.role,
                content: String(message.content || "")
            }));

        const visiblePrompt = requestPrompt + (
            files.length
                ? `\n\nAttachments: ${files.map(file => file.name).join(", ")}`
                : ""
        );

        const userMessage = {
            role: "user",
            content: visiblePrompt,
            createdAt: Date.now()
        };

        conversation.messages.push(userMessage);
        conversation.updatedAt = Date.now();

        renderMessage(userMessage);
        renderHistory();

        // Clear the input after capturing the original files and prompt.
        messageInput.value = "";
        resizeTextarea();

        selectedFiles = [];
        if (fileInput) fileInput.value = "";
        renderAttachments();

        sending = true;

        if (sendBtn) sendBtn.disabled = true;
        if (uploadBtn) uploadBtn.disabled = true;

        typingIndicator?.classList.remove("hidden");
        scrollToBottom();

        try {
            // Save the user's message before requesting the AI response.
            await saveConversations();

            // IMPORTANT: use FormData for text and file uploads.
            // Do not manually set Content-Type; the browser adds
            // the multipart boundary automatically.
            const formData = new FormData();

            formData.append("message", requestPrompt);
            formData.append("history", JSON.stringify(history));

            files.forEach(file => {
                formData.append("files", file, file.name);
            });

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                credentials: "same-origin",
                body: formData
            });

            const data = await response.json().catch(() => ({}));

            if (response.status === 401) {
                window.location.assign("/?auth=login");
                return;
            }

            if (!response.ok || data.success !== true || !data.reply) {
                throw new Error(
                    data.message ||
                    "Linkora AI could not generate a response. Please try again."
                );
            }

            const assistantMessage = {
                role: "assistant",
                content: String(data.reply),
                createdAt: Date.now()
            };

            conversation.messages.push(assistantMessage);
            conversation.updatedAt = Date.now();

            renderMessage(assistantMessage);
            renderHistory();

            await saveConversations();
            scrollToBottom();

        } catch (error) {
            console.error("Linkora AI request failed:", error);

            alert(
                error.message ||
                "Something went wrong while generating the AI response."
            );

        } finally {
            sending = false;

            if (sendBtn) sendBtn.disabled = false;
            if (uploadBtn) uploadBtn.disabled = false;

            typingIndicator?.classList.add("hidden");
            messageInput?.focus();
        }
    }

    // =====================================================
    // CHAT EVENTS
    // =====================================================
    newChatBtn?.addEventListener("click", startNewChat);

    historySearch?.addEventListener("input", renderHistory);

    messageInput?.addEventListener("input", resizeTextarea);

    messageInput?.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    composer?.addEventListener("submit", event => {
        event.preventDefault();
        sendMessage();
    });

    // Welcome-screen suggestion buttons.
    document.querySelectorAll(".suggestion-card").forEach(button => {
        button.addEventListener("click", () => {
            if (!messageInput) return;

            messageInput.value = button.dataset.prompt || "";
            resizeTextarea();
            messageInput.focus();
        });
    });

    // =====================================================
    // UPLOAD CERTIFICATES AND DOCUMENTS
    // =====================================================
    uploadBtn?.addEventListener("click", () => {
        if (!sending) fileInput?.click();
    });

    fileInput?.addEventListener("change", () => {
        const files = Array.from(fileInput.files || []);

        for (const file of files) {
            const extension = file.name.includes(".")
                ? file.name.split(".").pop().toLowerCase()
                : "";

            if (!allowedExtensions.includes(extension)) {
                alert(
                    `Unsupported file type: ${file.name}\n` +
                    "Allowed types: PDF, DOCX, TXT, MD, CSV, PNG, JPG, JPEG and WEBP."
                );
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                alert(`${file.name} is larger than 10 MB.`);
                continue;
            }

            const alreadySelected = selectedFiles.some(item =>
                item.name === file.name &&
                item.size === file.size &&
                item.lastModified === file.lastModified
            );

            if (!alreadySelected) {
                selectedFiles.push(file);
            }
        }

        // Reset so the same file can be selected again later.
        fileInput.value = "";
        renderAttachments();
    });

    // =====================================================
    // INITIALIZE CHAT
    // =====================================================
    loadProfile();

    if (messageInput) messageInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    if (uploadBtn) uploadBtn.disabled = true;

    loadConversations()
        .then(() => {
            renderHistory();

            if (messageInput) messageInput.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            if (uploadBtn) uploadBtn.disabled = false;
        })
        .catch(error => {
            console.error("Chat history initialization failed:", error);

            if (chatHistory) {
                chatHistory.innerHTML =
                    '<p class="empty-history">Unable to load conversations. Please refresh the page.</p>';
            }

            if (messageInput) messageInput.disabled = true;
            if (sendBtn) sendBtn.disabled = true;
            if (uploadBtn) uploadBtn.disabled = true;
        });
});