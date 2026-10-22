"use strict";

const fileInput = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");
const selectedFile = document.getElementById("selected-file");
const uploadStatus = document.getElementById("upload-status");
const notesText = document.getElementById("notes-text");
const questionText = document.getElementById("question-text");
const languageSelect = document.getElementById("language-select");
const toast = document.getElementById("toast");
const resultBadge = document.getElementById("result-badge");
const sampleCallout = document.getElementById("sample-callout");
const explanationText = document.getElementById("explanation-text");
const keyPoints = document.getElementById("key-points");
const practiceList = document.getElementById("practice-list");
const languageTag = document.getElementById("language-tag");
const explainButton = document.getElementById("explain-button");
const explainButtonLabel = explainButton.querySelector("span");
const resultsPanel = document.getElementById("results-panel");
const prototypeNote = document.getElementById("prototype-note");
const aiStatusLabel = document.getElementById("ai-status-label");
const MAX_FILE_SIZE = 15 * 1024 * 1024;
let activeFile = null;
let toastTimeout;
let currentGuide;
let currentGuideIsSample = true;

const sampleStudyGuide = {
  "Simple English": {
    explanation: "Plants make their own food using sunlight. They take in water from the soil and a gas called carbon dioxide from the air. Their leaves turn these ingredients into sugar, which gives the plant energy.",
    keyPoints: [
      "Plants use sunlight to make food.",
      "Leaves take in carbon dioxide from the air.",
      "Water comes up from the roots."
    ],
    questions: [
      "What do plants use sunlight for?",
      "Where does a plant get its water?"
    ],
    answers: [
      "Plants use sunlight to make their own food.",
      "A plant absorbs water from the soil through its roots."
    ]
  },
  Pidgin: {
    explanation: "Plant dey make their own food with sunlight. Dem collect water from soil and carbon dioxide gas from air. The leaves mix everything together to make sugar, wey give the plant energy.",
    keyPoints: [
      "Plant dey use sunlight make food.",
      "Leaves collect carbon dioxide from the air.",
      "Roots dey carry water from the soil."
    ],
    questions: [
      "Wetin plant dey use sunlight do?",
      "Where plant dey get water from?"
    ],
    answers: [
      "Plant dey use sunlight make their own food.",
      "Plant roots dey collect water from the soil."
    ]
  }
};

function showToast(message) {
  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimeout = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 4300);
}

function renderGuide(guide, language, isSample) {
  currentGuide = guide;
  currentGuideIsSample = isSample;
  explanationText.textContent = guide.explanation;
  languageTag.textContent = language;
  resultBadge.textContent = isSample ? "SAMPLE" : "AI STUDY GUIDE";
  sampleCallout.hidden = !isSample;

  keyPoints.replaceChildren();
  guide.keyPoints.forEach(function (point, index) {
    const item = document.createElement("li");
    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    item.append(number, document.createTextNode(point));
    keyPoints.append(item);
  });

  practiceList.replaceChildren();
  guide.questions.forEach(function (question) {
    const item = document.createElement("li");
    item.textContent = question;
    practiceList.append(item);
  });
  const answer = document.querySelector(".quiz-answer");
  if (answer) answer.remove();
  const quizButton = document.getElementById("quiz-button");
  quizButton.textContent = "Test yourself →";
  quizButton.setAttribute("aria-expanded", "false");
}

function renderSampleGuide() {
  renderGuide(sampleStudyGuide[languageSelect.value], languageSelect.value, true);
}

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

function setProcessing(isProcessing) {
  explainButton.disabled = isProcessing;
  fileInput.disabled = isProcessing;
  notesText.disabled = isProcessing;
  questionText.disabled = isProcessing;
  languageSelect.disabled = isProcessing;
  resultsPanel.setAttribute("aria-busy", String(isProcessing));
  explainButtonLabel.textContent = isProcessing ? "Making your guide..." : "Make it make sense";
}

async function createStudyGuide() {
  const notes = notesText.value.trim();
  const question = questionText.value.trim();
  const file = activeFile;
  if (!file && !notes && !question) {
    showToast("Add notes, ask a question, or choose a file first.");
    return;
  }

  uploadStatus.textContent = "";
  setProcessing(true);
  try {
    const requestBody = {
      notes: notes,
      question: question,
      language: languageSelect.value
    };

    if (file) {
      const extension = file.name.split(".").pop().toLowerCase();
      const mimeTypes = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp"
      };
      requestBody.file = {
        name: file.name,
        mimeType: mimeTypes[extension],
        data: await readFileData(file)
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
        !result.keyPoints.every((item) => typeof item === "string") ||
        !result.questions.every((item) => typeof item === "string") ||
        !result.answers.every((item) => typeof item === "string") ||
        result.questions.length !== result.answers.length) {
      throw new Error("The AI returned an incomplete study guide. Please try again.");
    }

    renderGuide(result, requestBody.language, false);
    showToast("Your study guide is ready.");
  } catch (error) {
    const message = error instanceof TypeError
      ? "Could not connect to SmartNote. Run npm start and open http://localhost:3000."
      : error.message;
    setUploadError(message);
    showToast(message);
  } finally {
    setProcessing(false);
  }
}

function addQuizAnswers() {
  const existingAnswer = document.querySelector(".quiz-answer");
  const quizButton = document.getElementById("quiz-button");
  if (existingAnswer) {
    existingAnswer.remove();
    quizButton.textContent = "Test yourself →";
    quizButton.setAttribute("aria-expanded", "false");
    return;
  }

  const answer = document.createElement("p");
  answer.className = "quiz-answer";
  answer.textContent = "Answers: " + currentGuide.answers.join(" ");
  practiceList.insertAdjacentElement("afterend", answer);
  quizButton.textContent = "Hide answers ↑";
  quizButton.setAttribute("aria-expanded", "true");
}

dropZone.addEventListener("click", function () {
  fileInput.click();
});

dropZone.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", function () {
  acceptFile(fileInput.files[0]);
});

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

dropZone.addEventListener("drop", function (event) {
  acceptFile(event.dataTransfer.files[0]);
});

explainButton.addEventListener("click", createStudyGuide);

document.getElementById("try-sample").addEventListener("click", function () {
  renderSampleGuide();
  showToast("Showing a sample guide about photosynthesis.");
});

document.getElementById("quiz-button").addEventListener("click", addQuizAnswers);
languageSelect.addEventListener("change", function () {
  if (currentGuideIsSample) {
    renderSampleGuide();
    return;
  }
  showToast("Your current guide is in " + languageTag.textContent + ". Generate it again to use " + languageSelect.value + ".");
});

document.getElementById("reset-button").addEventListener("click", function () {
  clearFile();
  notesText.value = "";
  questionText.value = "";
  languageSelect.value = "Simple English";
  renderSampleGuide();
  showToast("Your guide is reset. Add new notes whenever you're ready.");
});

fetch("/api/health")
  .then(function (response) {
    if (!response.ok) throw new Error("SmartNote server is unavailable.");
    return response.json();
  })
  .then(function (status) {
    if (status.configured) {
      aiStatusLabel.textContent = "OpenAI connected";
      prototypeNote.textContent = "Your notes and questions are sent to OpenAI for processing. SmartNote doesn't store them.";
    } else {
      aiStatusLabel.textContent = "AI setup needed";
      prototypeNote.textContent = "AI is not connected yet. Add OPENAI_API_KEY to .env; notes and questions are sent to OpenAI only when you request a guide.";
    }
  })
  .catch(function () {
    aiStatusLabel.textContent = "Server not connected";
    prototypeNote.textContent = "Run npm start and open http://localhost:3000 to connect SmartNote to AI.";
  });

renderSampleGuide();
