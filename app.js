// ==============================
// DraftVerify Frontend – v0.2
// Modern UI + animations + haptics + PWA hooks
// ==============================

const API_URL =
  "https://script.google.com/macros/s/AKfycbwbF0o9-zAbzuY-q-dItaIUrPjj1XV6ucMCMBXDaoSlTw8Pgn17LdApM2OEmQfCZ37mhA/exec";

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

// ===============
// Helper: status
// ===============
function setStatus(status) {
  // Reset classes
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
    pillText = "Info";
    iconClass = "dv-icon-info";
    iconEmoji = "📡";
  }

  pillTextEl.textContent = pillText;

  // Update icon
  if (iconEl) {
    iconEl.innerHTML = `
      <div class="dv-icon-circle ${iconClass}">
        <span class="dv-icon-symbol">${iconEmoji}</span>
      </div>
    `;
  }
}

// ===============
// Helper: haptics
// ===============
function triggerHaptics(status) {
  if (!("vibrate" in navigator)) return;

  if (status === "ok") {
    // Short happy pulse
    navigator.vibrate([25, 40, 25]);
  } else if (status === "warn") {
    // Stronger pattern
    navigator.vibrate([50, 40, 50]);
  } else {
    navigator.vibrate(20);
  }
}

// ===============
// Helper: animations
// ===============
function playCardAnimation(status) {
  if (!cardEl) return;

  // Clear previous animation classes
  cardEl.classList.remove("dv-animate-pop", "dv-animate-shake");
  void cardEl.offsetWidth; // force reflow

  if (status === "warn") {
    cardEl.classList.add("dv-animate-shake");
  } else {
    cardEl.classList.add("dv-animate-pop");
  }
}

// ===============
// Main fetch logic
// ===============
function loadVerification(tagId) {
  if (!tagId) {
    setStatus("warn");
    titleEl.textContent = "NO TAG DETECTED";
    subEl.textContent =
      "This link does not contain a DraftVerify tag ID. Scan an official coupler or keg tag.";
    detailsEl.innerHTML =
      "<p class='dv-label'>What to do</p>" +
      "<p class='dv-value'>Ask your DraftVerify admin for a registered NFC tag.</p>";
    playCardAnimation("warn");
    return;
  }

  // Show loading overlay
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

      const newTitle = data.title || "DraftVerify";
      const newSub =
        data.subtitle ||
        "Verification details for this NA draft line are shown below.";
      const detailsHtml = data.detailsHtml;

      titleEl.textContent = newTitle;
      subEl.textContent = newSub;

      if (detailsHtml) {
        detailsEl.innerHTML = detailsHtml;
      } else {
        detailsEl.innerHTML =
          "<p class='dv-label'>Tag ID</p>" +
          `<p class='dv-value'>${tagId}</p>` +
          "<p class='dv-footer-note'>No additional details returned by backend.</p>";
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
      subEl.textContent =
        "There was a problem contacting the DraftVerify backend.";

      detailsEl.innerHTML =
        "<p class='dv-label'>Tag ID</p>" +
        `<p class='dv-value'>${tagId}</p>` +
        "<p class='dv-footer-note'>Check your connection and try again. If this persists, your DraftVerify admin can review the Apps Script deployment.</p>`;

      playCardAnimation("warn");
    });
}

// ===============
// Read tag from URL
// ===============
function initDraftVerify() {
  const params = new URLSearchParams(window.location.search);
  const tagId = params.get("tag");

  if (!tagId) {
    setStatus("info");
    titleEl.textContent = "Scan a DraftVerify tag";
    subEl.textContent =
      "Hold your phone near a DraftVerify coupler or keg tag to begin.";
    detailsEl.innerHTML =
      "<p class='dv-label'>How it works</p>" +
      "<p class='dv-value'>Tap the NA draft coupler, then tap the matching keg tag within 60 seconds to confirm the NA line is correctly paired.</p>";
    playCardAnimation("info");
    return;
  }

  loadVerification(tagId);
}

// ===============
// PWA: service worker registration
// ===============
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch((err) => console.log("SW registration failed:", err));
    });
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  initDraftVerify();
  registerServiceWorker();
});
