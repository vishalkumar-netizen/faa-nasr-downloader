(async function runENASR() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- PHASE 1: IF REPORT LINKS ARE VISIBLE -> OPEN EACH IN A NEW TAB TO PRINT ---
  const allLinks = Array.from(document.querySelectorAll("a"));
  const reportLinks = allLinks.filter((a) => {
    const text = (a.innerText || a.textContent || "").toLowerCase();
    const href = (a.href || "").toLowerCase();
    return (
      (href.includes("nasr") || href.includes("report") || href.includes("javascript")) &&
      (text.includes("location") || text.includes("runway") || text.includes("linear") || text.includes("print") || text.includes("detail"))
    );
  });

  if (reportLinks.length > 0) {
    alert(`Found ${reportLinks.length} report link(s). Opening each in a new tab...`);

    for (let i = 0; i < reportLinks.length; i++) {
      const link = reportLinks[i];

      if (link.href && link.href.startsWith("javascript:")) {
        link.click();
      } else {
        const win = window.open(link.href, `_blank_rpt_${i}`);
        if (win) {
          win.addEventListener("load", () => {
            setTimeout(() => win.print(), 500);
          });
        }
      }
      await sleep(1500); // 1.5 second pause between popups to let tabs load smoothly
    }
    return;
  }

  // --- PHASE 2: AUTOMATE FORM ENTRY IF ON SEARCH PAGE ---
  const airportId = prompt("Enter Airport Identifier (e.g. BGM):");
  if (!airportId) return;

  const id = airportId.trim().toUpperCase();

  // 1. Select Next Cycle
  const selects = Array.from(document.querySelectorAll("select"));
  const cycleSelect = selects.find(s => s.name.toLowerCase().includes("cycle") || s.id.toLowerCase().includes("cycle")) || selects[0];
  if (cycleSelect && cycleSelect.options.length > 1) {
    cycleSelect.selectedIndex = 1; 
    cycleSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // 2. Select Airport Data Source
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

  await sleep(300);

  // 3. Enter Airport ID
  const inputs = Array.from(document.querySelectorAll("input[type='text'], input:not([type])"));
  const idInput = inputs.find(i => i.name.toLowerCase().includes("airport") || i.id.toLowerCase().includes("airport") || i.name.toLowerCase().includes("id")) || inputs[0];

  if (idInput) {
    idInput.value = id;
    idInput.dispatchEvent(new Event("input", { bubbles: true }));
    idInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // 4. Click Search
  const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button'], a.btn"));
  const searchBtn = buttons.find(b => {
    const val = (b.value || b.innerText || "").toLowerCase();
    return val.includes("search") || val.includes("view") || val.includes("submit") || b.type === "submit";
  }) || buttons[0];

  if (searchBtn) {
    searchBtn.click();
    alert(`Submitted search for ${id}. Once results load, click the bookmarklet again to open all report pages.`);
  }
})();
