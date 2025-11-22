// DraftVerify front-end (GitHub hosted)

// app.js
const API_URL = "https://script.google.com/macros/s/AKfycbzoND-aB_hEYpmWrOnRmGoQoLicquaJ53k6-KW19cr_OK2zX8fIGDCcyJWXMrLQpzlHug/exec";


document.addEventListener("DOMContentLoaded", function () {
  var params = new URLSearchParams(window.location.search);
  var tagId = params.get("tag");

  if (!tagId) {
    renderNoTag();
    return;
  }

  loadVerification(tagId);
});

function setLoading(isLoading) {
  var app = document.getElementById("dv-app");
  if (!app) return;
  if (isLoading) {
    app.classList.add("dv-loading");
  } else {
    app.classList.remove("dv-loading");
  }
}

function setStatus(status) {
  var pill = document.getElementById("dv-status-pill");
  var text = document.getElementById("dv-status-text");
  if (!pill || !text) return;

  pill.classList.remove("dv-pill-ok", "dv-pill-warn", "dv-pill-info");

  if (status === "ok") {
    pill.classList.add("dv-pill-ok");
    text.textContent = "Verified";
  } else if (status === "warn") {
    pill.classList.add("dv-pill-warn");
    text.textContent = "Check required";
  } else {
    pill.classList.add("dv-pill-info");
    text.textContent = "DraftVerify";
  }
}

function renderNoTag() {
  setLoading(false);
  setStatus("info");

  var title = document.getElementById("dv-title");
  var subtitle = document.getElementById("dv-subtitle");
  var card = document.getElementById("dv-card");
  var error = document.getElementById("dv-error");

  if (title) {
    title.textContent = "No tag detected";
  }
  if (subtitle) {
    subtitle.textContent =
      "This link is missing a tag ID. Make sure your NFC tag URL includes ?tag=YOUR_TAG_ID.";
  }
  if (card) {
    card.innerHTML =
      '<p class="dv-label">Example URL</p>' +
      '<p class="dv-value">https://app.draftverify.com/?tag=NRS-0001</p>' +
      '<p class="dv-footer-note">Program this URL into your NFC tag using an NFC writer app.</p>';
  }
  if (error) {
    error.hidden = true;
  }
}

async function loadVerification(tagId) {
  setLoading(true);
  setStatus("info");

  var title = document.getElementById("dv-title");
  var subtitle = document.getElementById("dv-subtitle");
  var card = document.getElementById("dv-card");
  var error = document.getElementById("dv-error");

  if (title) {
    title.textContent = "Checking tag…";
  }
  if (subtitle) {
    subtitle.textContent = "Verifying this tag with DraftVerify.";
  }
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }

  try {
    var url = API_URL + "?tag=" + encodeURIComponent(tagId);
    console.log("Calling DraftVerify API:", url);

    var res = await fetch(url);

    if (!res.ok) {
      throw new Error("Network response was not ok (status " + res.status + ")");
    }

    var data = await res.json();
    console.log("DraftVerify API response:", data);

    setLoading(false);

    if (!data || data.ok === false) {
      // Basic fallback if API sends ok:false
      setStatus("warn");
      if (title) {
        title.textContent = "Unable to verify";
      }
      if (subtitle) {
        subtitle.textContent =
          "The DraftVerify service returned an error. Try again or contact support.";
      }
      if (card) {
        card.innerHTML =
          '<p class="dv-label">Tag ID</p>' +
          '<p class="dv-value">' +
          tagId +
          "</p>" +
          '<p class="dv-footer-note">If this keeps happening, your DraftVerify admin can check the Google Sheet configuration.</p>';
      }
      if (error) {
        error.hidden = false;
        error.textContent = "Service error from DraftVerify backend.";
      }
      return;
    }

    // Use status from API (info / warn / ok)
    setStatus(data.status);

    if (title) {
      title.textContent = data.title || "DraftVerify";
    }
    if (subtitle) {
      subtitle.textContent =
        data.subtitle || "Verification details are shown below.";
    }
    if (card) {
      if (data.detailsHtml) {
        // data.detailsHtml is HTML built by Apps Script (uses dv-label, dv-value, etc.)
        card.innerHTML = data.detailsHtml;
      } else {
        card.innerHTML =
          '<p class="dv-label">Tag ID</p>' +
          '<p class="dv-value">' +
          tagId +
          "</p>" +
          '<p class="dv-footer-note">No extra details were returned by the backend.</p>';
      }
    }

    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  } catch (err) {
    console.error("Error calling DraftVerify API:", err);
    setLoading(false);
    setStatus("warn");

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
        '<p class="dv-value">' +
        tagId +
        "</p>" +
        '<p class="dv-footer-note">Check your connection and try again. If this persists, your DraftVerify admin can check the Apps Script deployment.</p>';
    }
    var error = document.getElementById("dv-error");
    if (error) {
      error.hidden = false;
      error.textContent = err.message || "Unknown error.";
    }
  }
}
