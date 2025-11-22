// === CONFIG ===
// TODO: replace this with your live Apps Script web app URL.
const API_BASE =
  "https://script.google.com/macros/s/AKfycbzskZPDUt_1O_ZyZIftnEG_cHLd3Ai1H5g5uFGKFwEuPzATTjesX4mqeC2oTnb4dbNgPw/exec";

// === Helpers: URL & DOM ===
function getTagFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tag = params.get("tag");
  return tag && tag.trim() !== "" ? tag.trim() : null;
}

function $(id) {
  return document.getElementById(id);
}

// === UI State ===
function setStatus(text, variant = "idle") {
  const pill = $("status-pill");
  if (!pill) return;

  pill.textContent = text;

  pill.classList.remove("pill-ok", "pill-bad", "pill-muted");
  if (variant === "ok") pill.classList.add("pill-ok");
  else if (variant === "bad") pill.classList.add("pill-bad");
  else pill.classList.add("pill-muted");
}

function setLoading(isLoading) {
  const loading = $("loading");
  const btn = $("verify-btn");
  if (!loading || !btn) return;

  if (isLoading) {
    loading.classList.remove("hidden");
    btn.disabled = true;
  } else {
    loading.classList.add("hidden");
    btn.disabled = false;
  }
}

function showError(message) {
  const box = $("error-box");
  if (!box) return;
  box.textContent = message;
  box.classList.remove("hidden");
}

function clearError() {
  const box = $("error-box");
  if (!box) return;
  box.textContent = "";
  box.classList.add("hidden");
}

function renderEmptyState() {
  const container = $("result-content");
  if (!container) return;
  container.className = "result-content result-empty";
  container.innerHTML =
    '<p class="muted">Waiting for a tag. Tap an NFC tag or enter a Tag ID to begin.</p>';
}

// Render based on parsed data & raw fallback
function renderResult(parsed, rawText) {
  const container = $("result-content");
  if (!container) return;

  clearError();

  // If we have structured data that looks like our registry row, use that
  if (
    parsed &&
    (parsed.tagId || parsed.tag || parsed.brewery || parsed.product)
  ) {
    const tagId = parsed.tagId || parsed.tag || "Unknown";
    const type = parsed.type || parsed.deviceType || "Tag";
    const brewery = parsed.brewery || parsed.brand || "Unknown";
    const product = parsed.product || parsed.beer || "Unknown";
    const line = parsed.line || parsed.lineNumber || "—";
    const location = parsed.location || parsed.site || "—";
    const status = parsed.status || parsed.state || "verified";

    // Status mapping
    if (String(status).toLowerCase().includes("fail")) {
      setStatus("Flagged", "bad");
    } else if (String(status).toLowerCase().includes("not")) {
      setStatus("Not found", "bad");
    } else {
      setStatus("Verified", "ok");
    }

    container.className = "result-content";
    container.innerHTML = `
      <p class="mono small muted" style="margin-bottom:6px;">
        Response: ${status}
      </p>
      <div class="result-grid">
        <div class="result-label">Tag ID</div>
        <div class="result-value mono">${tagId}</div>

        <div class="result-label">Type</div>
        <div class="result-value">${type}</div>

        <div class="result-label">Brewery</div>
        <div class="result-value">${brewery}</div>

        <div class="result-label">Product</div>
        <div class="result-value">${product}</div>

        <div class="result-label">Line</div>
        <div class="result-value">${line}</div>

        <div class="result-label">Location</div>
        <div class="result-value">${location}</div>
      </div>
    `;
  } else {
    // Fallback: show raw text
    setStatus("Result", "idle");
    container.className = "result-content";
    container.innerHTML = `
      <p class="result-label">Server response</p>
      <pre class="result-value mono" style="white-space:pre-wrap;word-wrap:break-word;">${rawText}</pre>
    `;
  }
}

// === Network ===
async function verifyTag(tagId) {
  if (!tagId || tagId.trim() === "") {
    showError("Please enter a Tag ID.");
    return;
  }

  clearError();
  setStatus("Checking…", "idle");
  setLoading(true);

  try {
    const url = `${API_BASE}?tag=${encodeURIComponent(tagId.trim())}`;
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const rawText = await res.text();
    let parsed = null;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Not JSON; that's okay, we'll just show raw text
    }

    renderResult(parsed, rawText);
  } catch (err) {
    console.error(err);
    setStatus("Error", "bad");
    showError("Unable to verify this tag right now. Please try again.");
  } finally {
    setLoading(false);
  }
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  const input = $("tag-input");
  const btn = $("verify-btn");
  const urlDisplay = $("url-tag-display");

  // Wire button
  if (btn && input) {
    btn.addEventListener("click", () => {
      const value = input.value;
      verifyTag(value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        verifyTag(input.value);
      }
    });
  }

  // Initial state
  renderEmptyState();
  setStatus("Idle", "idle");
  clearError();
  setLoading(false);

  // Check URL tag parameter (for NFC)
  const tagFromUrl = getTagFromUrl();
  if (tagFromUrl) {
    if (urlDisplay) {
      urlDisplay.textContent = tagFromUrl;
      urlDisplay.classList.remove("empty");
    }

    if (input) {
      input.value = tagFromUrl;
    }

    // Auto-verify when arrived via NFC / link
    verifyTag(tagFromUrl);
  } else {
    if (urlDisplay) {
      urlDisplay.textContent = "No tag detected";
      urlDisplay.classList.add("empty");
    }
  }
});
