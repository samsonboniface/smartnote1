"use strict";

// ══════════════════════════════════════════════════════════════════════════════
// AUTH — simple localStorage-based user store
// Users are stored as: { name, email, passwordHash } in localStorage key
// "sn_users". Active session stored under "sn_session" as { email, name }.
// ══════════════════════════════════════════════════════════════════════════════

const authOverlay  = document.getElementById("auth-overlay");
const appShell     = document.getElementById("app-shell");
const signinForm   = document.getElementById("signin-form");
const signupForm   = document.getElementById("signup-form");
const signinError  = document.getElementById("signin-error");
const signupError  = document.getElementById("signup-error");
const authTitle    = document.getElementById("auth-title");
const authSub      = document.getElementById("auth-sub");
const authToggleBtn = document.getElementById("auth-toggle-btn");
const authToggleText = document.getElementById("auth-toggle-text");
const signoutBtn   = document.getElementById("signout-btn");
const avatarBtn    = document.getElementById("avatar-btn");

let authMode = "signin"; // "signin" | "signup"

// ── Simple hash (not cryptographic — fine for a local study tool) ──────────
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem("sn_users") || "[]"); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem("sn_users", JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem("sn_session") || "null"); } catch { return null; }
}
function saveSession(session) {
  localStorage.setItem("sn_session", JSON.stringify(session));
}
function clearSession() {
  localStorage.removeItem("sn_session");
}

function showApp(session) {
  authOverlay.hidden = true;
  appShell.hidden = false;
  // Update avatar with user initial
  avatarBtn.textContent = (session.name || session.email).charAt(0).toUpperCase();
  avatarBtn.setAttribute("aria-label", session.name || session.email);
}

function showAuth() {
  authOverlay.hidden = false;
  appShell.hidden = true;
}

function setAuthMode(mode) {
  authMode = mode;
  signinForm.hidden = mode !== "signin";
  signupForm.hidden = mode !== "signup";
  signinError.textContent = "";
  signupError.textContent = "";
  if (mode === "signin") {
    authTitle.textContent = "Welcome back";
    authSub.textContent = "Sign in to continue studying";
    authToggleText.textContent = "Don't have an account?";
    authToggleBtn.textContent = "Sign up";
  } else {
    authTitle.textContent = "Create your account";
    authSub.textContent = "Free to use — just need your email";
    authToggleText.textContent = "Already have an account?";
    authToggleBtn.textContent = "Sign in";
  }
}

authToggleBtn.addEventListener("click", function () {
  setAuthMode(authMode === "signin" ? "signup" : "signin");
});

// ── Sign Up ────────────────────────────────────────────────────────────────
signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  signupError.textContent = "";
  const name     = document.getElementById("signup-name").value.trim();
  const email    = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;

  if (!name)  { signupError.textContent = "Please enter your name."; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    signupError.textContent = "Please enter a valid email address."; return;
  }
  if (password.length < 6) {
    signupError.textContent = "Password must be at least 6 characters."; return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    signupError.textContent = "An account with this email already exists. Sign in instead."; return;
  }

  const submitBtn = signupForm.querySelector(".auth-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account…";

  const hash = await hashPassword(password);
  users.push({ name, email, passwordHash: hash });
  saveUsers(users);

  const session = { email, name };
  saveSession(session);
  showApp(session);

  submitBtn.disabled = false;
  submitBtn.textContent = "Create account";
});

// ── Sign In ────────────────────────────────────────────────────────────────
signinForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  signinError.textContent = "";
  const email    = document.getElementById("signin-email").value.trim().toLowerCase();
  const password = document.getElementById("signin-password").value;

  if (!email) { signinError.textContent = "Please enter your email."; return; }
  if (!password) { signinError.textContent = "Please enter your password."; return; }

  const submitBtn = signinForm.querySelector(".auth-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in…";

  const hash  = await hashPassword(password);
  const users = getUsers();
  const user  = users.find(u => u.email === email && u.passwordHash === hash);

  submitBtn.disabled = false;
  submitBtn.textContent = "Sign in";

  if (!user) {
    signinError.textContent = "Incorrect email or password. Try again."; return;
  }

  const session = { email: user.email, name: user.name };
  saveSession(session);
  showApp(session);
});

// ── Password show/hide toggles ─────────────────────────────────────────────
document.querySelectorAll(".eye-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    const input = document.getElementById(btn.dataset.target);
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.querySelector(".eye-icon").hidden = isHidden;
    btn.querySelector(".eye-off-icon").hidden = !isHidden;
    btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
});

// ── Sign Out ───────────────────────────────────────────────────────────────
signoutBtn.addEventListener("click", function () {
  clearSession();

  // Clear the current study workspace so the next user starts fresh.
  if (typeof clearFile === "function") clearFile();
  if (typeof historyList !== "undefined") historyList.replaceChildren();
  if (typeof notesText !== "undefined") notesText.value = "";
  if (typeof questionText !== "undefined") questionText.value = "";
  if (typeof languageSelect !== "undefined") languageSelect.value = "Simple English";
  if (typeof updateEmptyState === "function") updateEmptyState();

  setAuthMode("signin");
  showAuth();
});

// ── Boot: check for existing session ──────────────────────────────────────
(function boot() {
  const session = getSession();
  if (session && session.email) {
    showApp(session);
  } else {
    setAuthMode("signin");
    showAuth();
  }
})();

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════

const fileInput       = document.getElementById("file-input");
const dropZone        = document.getElementById("drop-zone");
const selectedFile    = document.getElementById("selected-file");
const uploadStatus    = document.getElementById("upload-status");
const notesText       = document.getElementById("notes-text");
const questionText    = document.getElementById("question-text");
const languageSelect  = document.getElementById("language-select");
const toast           = document.getElementById("toast");
const explainButton   = document.getElementById("explain-button");
const sendLabel       = document.getElementById("send-label");
const historyList     = document.getElementById("history-list");
const emptyState      = document.getElementById("empty-state");
const prototypeNote   = document.getElementById("prototype-note");
const aiStatusLabel   = document.getElementById("ai-status-label");

const MAX_FILE_SIZE = 15 * 1024 * 1024;
let activeFile = null;
let toastTimeout;
let pendingCount = 0; // how many requests are in-flight

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(message) {
  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimeout = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 4300);
}

// ── Empty state visibility ─────────────────────────────────────────────────
function updateEmptyState() {
  emptyState.hidden = historyList.children.length > 0;
}

// ── Build a history entry card ─────────────────────────────────────────────
function createHistoryCard(label, guide, language) {
  const entry = document.createElement("details");
  entry.className = "history-entry";
  entry.open = true;

  // Summary row
  const summary = document.createElement("summary");
  summary.className = "history-summary";

  const qSpan = document.createElement("span");
  qSpan.className = "history-q";
  qSpan.textContent = label;

  const meta = document.createElement("span");
  meta.className = "history-meta";

  const badge = document.createElement("span");
  badge.className = "lang-badge";
  badge.textContent = language;

  const chev = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chev.setAttribute("viewBox", "0 0 16 16");
  chev.setAttribute("fill", "none");
  chev.setAttribute("aria-hidden", "true");
  chev.classList.add("entry-chevron");
  chev.innerHTML = '<path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';

  meta.append(badge, chev);
  summary.append(qSpan, meta);
  entry.append(summary);

  // Body
  const body = document.createElement("div");
  body.className = "history-body";

  const answerEl = document.createElement("p");
  answerEl.className = "history-answer";
  answerEl.textContent = guide.explanation;
  body.append(answerEl);

  entry.append(body);
  return entry;
}

// ── Create a loading placeholder card ─────────────────────────────────────
function createLoadingCard(label) {
  const card = document.createElement("div");
  card.className = "loading-card";
  card.innerHTML =
    '<span class="loading-q">' + label + '</span>' +
    '<span class="loading-spinner" aria-label="Generating…"></span>';
  return card;
}

// ── File handling ──────────────────────────────────────────────────────────
function setUploadError(message) {
  uploadStatus.textContent = message;
}

function readableFileSize(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function acceptFile(file) {
  uploadStatus.textContent = "";
  if (!file) return;
  const extension = file.name.split(".").pop().toLowerCase();
  const supportedExtensions = ["pdf", "jpg", "jpeg", "png", "webp"];
  if (!supportedExtensions.includes(extension)) {
    setUploadError("Please choose a PDF, JPG, PNG, or WEBP file.");
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setUploadError("That file is over 15 MB. Choose a smaller file to continue.");
    return;
  }
  activeFile = file;
  document.getElementById("file-name").textContent = file.name;
  document.getElementById("file-size").textContent = readableFileSize(file.size);
  document.getElementById("file-icon").textContent = extension === "pdf" ? "PDF" : "IMG";
  dropZone.hidden = true;
  selectedFile.hidden = false;
}

function clearFile() {
  activeFile = null;
  fileInput.value = "";
  selectedFile.hidden = true;
  dropZone.hidden = false;
  uploadStatus.textContent = "";
}

function readFileData(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.addEventListener("load", function () {
      if (typeof reader.result !== "string") {
        reject(new Error("The file could not be read."));
        return;
      }
      resolve(reader.result);
    });
    reader.addEventListener("error", function () {
      reject(new Error("The file could not be read. Please choose it again."));
    });
    reader.readAsDataURL(file);
  });
}

// ── Submit handler — does NOT block the input form ─────────────────────────
async function submitGuide() {
  const notes = notesText.value.trim();
  const question = questionText.value.trim();
  const file = activeFile;

  if (!file && !notes && !question) {
    showToast("Add notes, ask a question, or choose a file first.");
    return;
  }

  // Build a short label for the history entry
  const label = question || (file ? file.name : notes.slice(0, 60) + (notes.length > 60 ? "…" : ""));

  // Snapshot inputs NOW so the user can change them for the next request
  const snapshotNotes = notes;
  const snapshotQuestion = question;
  const snapshotFile = file;
  const snapshotLanguage = languageSelect.value;

  // Clear ONLY the question field immediately — notes and file stay for follow-ups
  questionText.value = "";
  questionText.focus();
  uploadStatus.textContent = "";

  // Insert a loading placeholder at the top of the history list
  const loadingCard = createLoadingCard(label);
  historyList.insertBefore(loadingCard, historyList.firstChild);
  updateEmptyState();

  // Only disable the button if this is the very first in-flight request
  pendingCount++;
  if (pendingCount === 1) {
    explainButton.disabled = true;
    sendLabel.textContent = "Sending…";
  }

  try {
    const requestBody = {
      notes: snapshotNotes,
      question: snapshotQuestion,
      language: snapshotLanguage
    };

    if (snapshotFile) {
      const extension = snapshotFile.name.split(".").pop().toLowerCase();
      const mimeTypes = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp"
      };
      requestBody.file = {
        name: snapshotFile.name,
        mimeType: mimeTypes[extension],
        data: await readFileData(snapshotFile)
      };
    }

    const response = await fetch("/api/study-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("SmartNote received an unexpected response. Please try again.");
    }
    if (!response.ok) {
      throw new Error(typeof result.error === "string" ? result.error : "The AI couldn't process these notes. Please try again.");
    }
    if (!result || typeof result.explanation !== "string" ||
        !Array.isArray(result.keyPoints) || !Array.isArray(result.questions) ||
        !Array.isArray(result.answers) ||
        !result.keyPoints.every(function (i) { return typeof i === "string"; }) ||
        !result.questions.every(function (i) { return typeof i === "string"; }) ||
        !result.answers.every(function (i) { return typeof i === "string"; }) ||
        result.questions.length !== result.answers.length) {
      throw new Error("The AI returned an incomplete study guide. Please try again.");
    }

    // Replace the loading card with the real guide card
    const guideCard = createHistoryCard(label, result, snapshotLanguage);
    historyList.replaceChild(guideCard, loadingCard);
    showToast("Guide ready.");

  } catch (error) {
    // Replace loading card with an error card
    loadingCard.classList.remove("loading-card");
    loadingCard.classList.add("error-card");
    loadingCard.innerHTML =
      '<span class="loading-q">' + label + '</span>' +
      '<span class="error-msg">' + (error instanceof TypeError
        ? "Could not connect. Is the server running?"
        : error.message) + '</span>';
    showToast(error instanceof TypeError ? "Could not connect to SmartNote." : error.message);
  } finally {
    pendingCount--;
    if (pendingCount === 0) {
      explainButton.disabled = false;
      sendLabel.textContent = "Send";
    }
  }
}

// ── Event listeners ────────────────────────────────────────────────────────
dropZone.addEventListener("click", function () { fileInput.click(); });
dropZone.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
});
fileInput.addEventListener("change", function () { acceptFile(fileInput.files[0]); });
document.getElementById("remove-file").addEventListener("click", clearFile);

["dragenter", "dragover"].forEach(function (eventName) {
  dropZone.addEventListener(eventName, function (event) {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
});
["dragleave", "drop"].forEach(function (eventName) {
  dropZone.addEventListener(eventName, function (event) {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
});
dropZone.addEventListener("drop", function (event) { acceptFile(event.dataTransfer.files[0]); });

explainButton.addEventListener("click", submitGuide);

// Allow Ctrl+Enter / Cmd+Enter inside textareas to submit
[notesText, questionText].forEach(function (ta) {
  ta.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submitGuide();
    }
  });
});

document.getElementById("reset-button").addEventListener("click", function () {
  historyList.replaceChildren();
  updateEmptyState();
  clearFile();
  notesText.value = "";
  questionText.value = "";
  languageSelect.value = "Simple English";
  showToast("All guides cleared.");
});

languageSelect.addEventListener("change", function () {
  // nothing to do — each submission snapshots its own language
});

// ── Health check ───────────────────────────────────────────────────────────
fetch("/api/health")
  .then(function (response) {
    if (!response.ok) throw new Error("unavailable");
    return response.json();
  })
  .then(function (status) {
    if (status.configured) {
      aiStatusLabel.textContent = "OpenRouter connected";
      prototypeNote.textContent = "Notes and questions are sent to OpenRouter's free-model router. SmartNote doesn't store them.";
    } else {
      aiStatusLabel.textContent = "AI setup needed";
      prototypeNote.textContent = "Add OPENROUTER_API_KEY to .env and restart to enable AI.";
    }
  })
  .catch(function () {
    aiStatusLabel.textContent = "Server not connected";
    prototypeNote.textContent = "Run npm start and open http://localhost:3000.";
  });

updateEmptyState();
