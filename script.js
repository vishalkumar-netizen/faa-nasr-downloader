(async function runENASR() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- PHASE 1: IF REPORT LINKS ARE ALREADY VISIBLE ON PAGE, PRINT THEM ---
  const reportLinks = Array.from(document.querySelectorAll("a")).filter((a) => {
    const text = (a.innerText || "").toLowerCase();
    const href = (a.href || "").toLowerCase();
    return (
      (href.includes("nasr") || href.includes("report") || href.includes("javascript")) &&
      (text.includes("location") || text.includes("runway") || text.includes("linear") || text.includes("print"))
    );
  });

  if (reportLinks.length > 0) {
    alert(`Found ${reportLinks.length} report link(s). Opening print windows...`);
    for (let i = 0; i < reportLinks.length; i++) {
      const reportUrl = reportLinks[i].href;
      if (reportUrl.startsWith("javascript:")) {
        reportLinks[i].click();
      } else {
        const win = window.open(reportUrl, `_blank_rpt_${i}`);
        if (win) {
          win.addEventListener("load", () => win.print());
        }
      }
      await sleep(1500);
    }
    return;
  }

  // --- PHASE 2: AUTOMATE FORM ENTRY IF NO LINKS ARE VISIBLE YET ---
  const airportId = prompt("Enter Airport Identifier (e.g. BGM):");
  if (!airportId) return;

  const id = airportId.trim().toUpperCase();

  // 1. Cycle Dropdown -> Select Next Cycle (usually 2nd option)
  const selects = Array.from(document.querySelectorAll("select"));
  const cycleSelect = selects.find(s => s.name.toLowerCase().includes("cycle") || s.id.toLowerCase().includes("cycle")) || selects[0];
  if (cycleSelect && cycleSelect.options.length > 1) {
    cycleSelect.selectedIndex = 1; 
    cycleSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // 2. Data Source -> Select "Airport"
  const sourceSelect = selects.find(s => s.name.toLowerCase().includes("source") || s.id.toLowerCase().includes("source")) || selects[1];
  if (sourceSelect) {
    for (let opt of sourceSelect.options) {
      if (opt.text.toLowerCase().includes("airport") || opt.value.toLowerCase().includes("airport")) {
        sourceSelect.value = opt.value;
        sourceSelect.dispatchEvent(new Event("change", { bubbles: true }));
        break;
      }
    }
  }

  await sleep(400);

  // 3. Airport ID Box -> Input Identifier
  const inputs = Array.from(document.querySelectorAll("input[type='text'], input:not([type])"));
  const idInput = inputs.find(i => i.name.toLowerCase().includes("airport") || i.id.toLowerCase().includes("airport") || i.name.toLowerCase().includes("id")) || inputs[0];

  if (idInput) {
    idInput.value = id;
    idInput.dispatchEvent(new Event("input", { bubbles: true }));
    idInput.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    alert("Airport ID box not detected automatically. Please click inside the text box and try again.");
    return;
  }

  // 4. Click Search / Submit Button
  const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button'], a.btn"));
  const searchBtn = buttons.find(b => {
    const val = (b.value || b.innerText || "").toLowerCase();
    return val.includes("search") || val.includes("view") || val.includes("submit") || b.type === "submit";
  }) || buttons[0];

  if (searchBtn) {
    searchBtn.click();
    alert(`Form submitted for ${id}. Once results appear, click the bookmarklet again to open all print pages.`);
  } else {
    alert("Search button not found. Please click Search manually.");
  }
})();
