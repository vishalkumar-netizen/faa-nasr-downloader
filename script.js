(async function runENASR() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- 1. AUTO-DISMISS POPUPS / DISCLAIMERS ---
  const popupBtns = document.querySelectorAll(
    "button[data-dismiss='modal'], .modal button, #disclaimer button, input[value*='Accept'], input[value*='Close'], input[value*='OK'], .close"
  );
  popupBtns.forEach((btn) => {
    try { btn.click(); } catch (e) {}
  });
  await sleep(300);

  // --- 2. ASK FOR AIRPORT ID ---
  const airportId = prompt("Enter Airport Identifier (e.g. BGM):");
  if (!airportId) return;
  const id = airportId.trim().toUpperCase();

  // --- 3. AUTO-SELECT CYCLE AND SOURCE ---
  const selects = Array.from(document.querySelectorAll("select"));

  // Select Next Cycle
  const cycleSelect = selects.find((s) =>
    (s.name || "").toLowerCase().includes("cycle") ||
    (s.id || "").toLowerCase().includes("cycle")
  ) || selects[0];

  if (cycleSelect && cycleSelect.options.length > 1) {
    cycleSelect.selectedIndex = 1;
    cycleSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Select Airport Source
  const sourceSelect = selects.find((s) =>
    (s.name || "").toLowerCase().includes("source") ||
    (s.id || "").toLowerCase().includes("source")
  ) || selects[1];

  if (sourceSelect) {
    for (let opt of sourceSelect.options) {
      if (opt.text.toLowerCase().includes("airport") || opt.value.toLowerCase().includes("airport")) {
        sourceSelect.value = opt.value;
        sourceSelect.dispatchEvent(new Event("change", { bubbles: true }));
        break;
      }
    }
  }

  await sleep(300);

  // --- 4. AUTO-FILL ID & SUBMIT ---
  const inputs = Array.from(document.querySelectorAll("input[type='text'], input:not([type])"));
  const idInput = inputs.find((i) =>
    (i.name || "").toLowerCase().includes("airport") ||
    (i.id || "").toLowerCase().includes("airport") ||
    (i.name || "").toLowerCase().includes("id")
  ) || inputs[0];

  if (idInput) {
    idInput.value = id;
    idInput.dispatchEvent(new Event("input", { bubbles: true }));
    idInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button'], a.btn"));
  const searchBtn = buttons.find((b) => {
    const val = (b.value || b.innerText || "").toLowerCase();
    return val.includes("search") || val.includes("view") || val.includes("submit") || b.type === "submit";
  }) || buttons[0];

  if (searchBtn) {
    searchBtn.click();
  } else {
    alert("Could not click search button automatically.");
    return;
  }

  // --- 5. VISUAL STATUS INDICATOR & AUTO-POLL FOR RESULTS ---
  let badge = document.createElement("div");
  badge.style.cssText =
    "position:fixed;top:15px;right:15px;z-index:999999;background:#059669;color:#fff;padding:12px 18px;border-radius:8px;font-family:sans-serif;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.4);";
  badge.innerHTML = `✈️ Auto-searching <b>${id}</b>... Waiting for reports to load...`;
  document.body.appendChild(badge);

  let reportLinks = [];
  let attempts = 0;

  // Poll for up to 15 seconds waiting for eNASR search results to render
  while (attempts < 30) {
    await sleep(500);
    attempts++;

    const links = Array.from(document.querySelectorAll("a")).filter((a) => {
      const text = (a.innerText || a.textContent || "").toLowerCase();
      const href = (a.href || "").toLowerCase();
      return (
        (href.includes("nasr") || href.includes("report") || href.includes("view") || href.includes("javascript")) &&
        (text.includes("location") || text.includes("runway") || text.includes("linear") || text.includes("print") || text.includes("detail"))
      );
    });

    if (links.length > 0) {
      reportLinks = links;
      break;
    }
  }

  if (reportLinks.length === 0) {
    badge.style.background = "#dc2626";
    badge.innerHTML = "❌ No report links found. Check search results manually.";
    setTimeout(() => badge.remove(), 4000);
    return;
  }

  badge.innerHTML = `🚀 Found ${reportLinks.length} report(s)! Opening & printing tabs...`;

  // --- 6. AUTO-OPEN & AUTO-PRINT ALL LINKS ---
  for (let i = 0; i < reportLinks.length; i++) {
    const link = reportLinks[i];
    const url = link.href;

    if (url.startsWith("javascript:")) {
      link.click();
    } else {
      const win = window.open(url, `_blank_rpt_${i}`);
      if (win) {
        win.addEventListener("load", () => win.print());
      }
    }
    await sleep(1500);
  }

  setTimeout(() => badge.remove(), 2000);
})();
