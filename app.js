// ==============================
// DraftVerify Frontend – v0.3
// Robust tag detection + animations + haptics + PWA hooks
// ==============================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwKkSetsObgwrgJyLfzApkDpmdkKU0hhZtu8gp5TllwUbzQvbGxpRemCn7RuajQx26Dsw/exec";

// DOM refs
const app = document.getElementById("dv-app");
const titleEl = document.getElementById("dv-title");
const subEl = document.getElementById("dv-sub");
const detailsEl = document.getElementById("dv-details");
const pillEl = document.getElementById("dv-pill");
const pillTextEl = document.getElementById("dv-pill-text");
const cardEl = document.getElementById("dv-card");
const iconEl = document.getElementById("dv-icon");
const loadingOverlay = document.getElementById("dv-loading-overlay");

// ==============================
// Helper: extract tag from URL
// ==============================
function getTagFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const tag = params.get("tag");
    if (tag) return tag;
  } catch (e) {
    // ignore
  }

  const href = window.location.href || "";
  const match = href.match(/[?&]tag=([^&]+)/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch (e) {
      return match[1];
    }
  }

  return null;
}

// ==============================
// Helper: status styling
// ==============================
function setStatus(status) {
  app.classList.remove("dv-status-ok", "dv-status-warn", "dv-status-info");
  pillEl.classList.remove("dv-pill-ok", "dv-pill-warn", "dv-pill-info");

  let pillText = "";
  let iconClass = "dv-icon-info";
  let iconEmoji = "📡";

  if (status === "ok") {
    app.classList.add("dv-status-ok");
    pillEl.classList.add("dv-pill-ok");
    pillText = "Verified";
    iconClass = "dv-icon-ok";
    iconEmoji = "✅";
  } else if (status === "warn") {
    app.classList.add("dv-status-warn");
    pillEl.classList.add("dv-pill-warn");
    pillText = "Attention";
    iconClass = "dv-icon-warn";
    iconEmoji = "⚠️";
  } else {
    app.classList.add("dv-status-info");
    pillEl.classList.add("dv-pill-info");
    pillText = "Checking tag";
    iconClass = "dv-icon-info";
    iconEmoji = "📡";
  }

  pillTextEl.textContent = pillText;

  if (iconEl) {
    iconEl.innerHTML = `
      <div class="dv-icon-circle ${iconClass}">
        <span class="dv-icon-symbol">${iconEmoji}</span>
      </div>
    `;
  }
}

// ==============================
// Helper: haptics
// ==============================
function triggerHaptics(status) {
  if (!("vibrate" in navigator)) return;

  if (status === "ok") {
    navigator.vibrate([25, 40, 25]);
  } else if (status === "warn") {
    navigator.vibrate([50, 40, 50]);
  } else {
    navigator.vibrate(20);
  }
}

// ==============================
// Helper: animations
// ==============================
function playCardAnimation(status) {
  if (!cardEl) return;

  cardEl.classList.remove("dv-animate-pop", "dv-animate-shake");
  void cardEl.offsetWidth;

  if (status === "warn") {
    cardEl.classList.add("dv-animate-shake");
  } else {
    cardEl.classList.add("dv-animate-pop");
  }
}

// ==============================
// Main fetch logic
// ==============================
function loadVerification(tagId) {
  if (!tagId) {
    setStatus("info");
    titleEl.textContent = "Scan a tag";
    subEl.textContent = "Tap a coupler or keg tag to check the NA draft line.";
    detailsEl.innerHTML =
      "<p class='dv-label'>How it works</p>" +
      "<p class='dv-value'>Tap the NA draft coupler, then tap the matching keg tag within 60 seconds to confirm the line is correctly paired.</p>";
    playCardAnimation("info");
    return;
  }

  titleEl.textContent = "Reading tag…";
  subEl.textContent = "Please wait a moment.";
  detailsEl.innerHTML =
    "<p class='dv-label'>Tag ID</p>" +
    `<p class='dv-value'>${tagId}</p>` +
    "<p class='dv-footer-note'>If this screen doesn’t update, check your connection.</p>";

  setStatus("info");
  playCardAnimation("info");

  if (loadingOverlay) {
    loadingOverlay.classList.remove("dv-hidden");
  }
  pillTextEl.textContent = "Checking tag…";

  fetch(`${API_URL}?tag=${encodeURIComponent(tagId)}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error("Network error");
      }
      return res.json();
    })
    .then((data) => {
      if (loadingOverlay) {
        loadingOverlay.classList.add("dv-hidden");
      }

      const status = data.status || "info";
      setStatus(status);
      triggerHaptics(status);

      const newTitle = data.title || "Result";
      const newSub =
        data.subtitle || "Verification details are shown below.";
      const detailsHtml = data.detailsHtml;

      titleEl.textContent = newTitle;
      subEl.textContent = newSub;

      if (detailsHtml) {
        detailsEl.innerHTML = detailsHtml;
      } else {
        detailsEl.innerHTML =
          "<p class='dv-label'>Tag ID</p>" +
          `<p class='dv-value'>${tagId}</p>` +
          "<p class='dv-footer-note'>No additional details returned by the server.</p>";
      }

      playCardAnimation(status);
    })
    .catch((err) => {
      console.error("DraftVerify fetch error:", err);
      if (loadingOverlay) {
        loadingOverlay.classList.add("dv-hidden");
      }

      setStatus("warn");
      triggerHaptics("warn");

      titleEl.textContent = "UNABLE TO VERIFY";
      subEl.textContent = "There was a problem contacting the server.";

      detailsEl.innerHTML =
        "<p class='dv-label'>Tag ID</p>" +
        `<p class='dv-value'>${tagId}</p>` +
        "<p class='dv-footer-note'>Check Wi-Fi or data and try again. If this keeps happening, your admin can review the Apps Script deployment.</p>";

      playCardAnimation("warn");
    });
}

// ==============================
// Init
// ==============================
function initDraftVerify() {
  const tagId = getTagFromUrl();
  console.log("DraftVerify tag detected:", tagId);
  loadVerification(tagId);
}

// ==============================
// PWA: service worker registration
// ==============================
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch((err) => console.log("SW registration failed:", err));
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDraftVerify();
  registerServiceWorker();
});
