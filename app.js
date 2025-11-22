// ==============================
// DraftVerify Frontend (GitHub Pages)
// ==============================

// 🔧 Your live Apps Script backend URL
const API_URL =
  "https://script.google.com/macros/s/AKfycbzoND-aB_hEYpmWrOnRmGoQoLicquaJ53k6-KW19cr_OK2zX8fIGDCcyJWXMrLQpzlHug/exec";

// ==============================
// Main loader
// ==============================
function loadVerification(tagId) {
  const app = document.getElementById("dv-app");
  const statusPill = document.getElementById("dv-pill");
  const title = document.getElementById("dv-title");
  const subtitle = document.getElementById("dv-sub");
  const card = document.getElementById("dv-card");

  // Loading state
  app.classList.add("dv-loading");

  fetch(`${API_URL}?tag=${encodeURIComponent(tagId)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response not OK");
      }
      return response.json();
    })
    .then((data) => {
      // Remove loading state
      app.classList.remove("dv-loading");

      // Update status pill
      if (statusPill) {
        statusPill.className = "dv-pill"; // reset base class
        if (data.status === "ok") statusPill.classList.add("dv-pill-ok");
        else if (data.status === "warn") statusPill.classList.add("dv-pill-warn");
        else statusPill.classList.add("dv-pill-info");
      }

      // Update title
      if (title) {
        title.textContent = data.title || "DraftVerify";
      }

      // Update subtitle
      if (subtitle) {
        subtitle.textContent =
          data.subtitle || "Verification details are shown below.";
      }

      // Update card HTML (details)
      if (card) {
        if (data.detailsHtml) {
          card.innerHTML = data.detailsHtml;
        } else {
          card.innerHTML =
            '<p class="dv-label">Tag ID</p>' +
            `<p class="dv-value">${tagId}</p>` +
            '<p class="dv-footer-note">No details were returned by the backend.</p>';
        }
      }

      // ==============================
      // POP ANIMATION
      // ==============================

      if (title) {
        title.classList.remove("dv-pop");
        void title.offsetWidth; // restart animation
        title.classList.add("dv-pop");
      }

      if (card) {
        card.classList.remove("dv-pop");
        void card.offsetWidth;
        card.classList.add("dv-pop");
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);

      app.classList.remove("dv-loading");

      if (title) {
        title.textContent = "Unable to verify";
      }

      if (subtitle) {
        subtitle.textContent =
          "There was a problem contacting the DraftVerify backend.";
      }

      if (card) {
        card.innerHTML =
          '<p class="dv-label">Tag ID</p>' +
          `<p class="dv-value">${tagId}</p>` +
          '<p class="dv-footer-note">Failed to fetch</p>';
      }

      if (statusPill) {
        statusPill.className = "dv-pill dv-pill-warn";
      }

      if (title) {
        title.classList.remove("dv-pop");
        void title.offsetWidth;
        title.classList.add("dv-pop");
      }

      if (card) {
        card.classList.remove("dv-pop");
        void card.offsetWidth;
        card.classList.add("dv-pop");
      }
    });
}

// ==============================
// On page load: detect ?tag=URL
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const tagId = params.get("tag");

  if (!tagId) {
    // No tag provided -> default view
    const title = document.getElementById("dv-title");
    const subtitle = document.getElementById("dv-sub");
    const card = document.getElementById("dv-card");

    if (title) title.textContent = "No tag detected";
    if (subtitle)
      subtitle.textContent =
        "This NFC tag does not contain a valid DraftVerify tag ID.";

    if (card) {
      card.innerHTML =
        '<p class="dv-label">What to do</p>' +
        '<p class="dv-value">Scan a valid DraftVerify NFC tag.</p>';
    }

    return;
  }

  // Load verification
  loadVerification(tagId);
});
