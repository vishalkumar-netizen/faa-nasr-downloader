(async function runENASR() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- HELPER: SHOW STATUS OVERLAY ON PAGE ---
  function showStatus(msg) {
    let box = document.getElementById("enasr-status-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "enasr-status-box";
      box.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:#111827;color:#fff;padding:16px 20px;border-radius:8px;font-family:sans-serif;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.5);max-width:380px;border:1px solid #374151;";
      document.body.appendChild(box);
    }
    box.innerHTML = `<strong style="color:#60a5fa;display:block;margin-bottom:6px;">✈️ eNASR Tool</strong>${msg}`;
  }

  // --- PHASE 1: CHECK IF WE ARE ON RESULTS PAGE & COMBINE ALL REPORTS ---
  const allLinks = Array.from(document.querySelectorAll("a"));
  const reportLinks = allLinks.filter((a) => {
    const text = (a.innerText || a.textContent || "").toLowerCase();
    const href = (a.href || "").toLowerCase();
    return (
      href.includes("nasr") ||
      href.includes("report") ||
      href.includes("view") ||
      text.includes("location") ||
      text.includes("runway") ||
      text.includes("linear") ||
      text.includes("print") ||
      text.includes("detail")
    );
  });

  if (reportLinks.length > 0) {
    showStatus(`Found <b>${reportLinks.length}</b> report section(s). Fetching data...`);

    let combinedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>eNASR Combined Airport Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
          .report-section { page-break-after: always; margin-bottom: 40px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
          .report-section:last-child { page-break-after: auto; border-bottom: none; }
          @media print {
            .no-print { display: none !important; }
            .report-section { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background:#e0f2fe;padding:12px;margin-bottom:20px;border-radius:6px;font-family:sans-serif;color:#0369a1;">
          <strong>eNASR Combined View</strong> — All ${reportLinks.length} report sections loaded.
          <button onclick="window.print()" style="margin-left:15px;padding:6px 14px;background:#0284c7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Print / Save All as PDF</button>
        </div>
    `;

    let loadedCount = 0;
    for (let i = 0; i < reportLinks.length; i++) {
      const link = reportLinks[i];
      const url = link.href;
      const title = link.innerText.trim() || `Report Section ${i + 1}`;

      showStatus(`Downloading section ${i + 1} of ${reportLinks.length}: <br><b>${title}</b>`);

      try {
        if (url && !url.startsWith("javascript:")) {
          const resp = await fetch(url);
          const htmlText = await resp.text();
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, "text/html");
          const mainContent = doc.body ? doc.body.innerHTML : htmlText;

          combinedHtml += `<div class="report-section"><h2>${title}</h2>${mainContent}</div>`;
          loadedCount++;
        }
      } catch (err) {
        console.error("Error fetching report link:", err);
      }
      await sleep(200);
    }

    combinedHtml += `</body></html>`;

    if (loadedCount > 0) {
      showStatus(`Opening combined print view...`);
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.open();
        printWin.document.write(combinedHtml);
        printWin.document.close();
        setTimeout(() => printWin.print(), 800);
      } else {
        alert("Pop-up blocked! Look at your browser address bar and click 'Always allow pop-ups' for enasr.faa.gov.");
      }
    } else {
      showStatus("Could not extract report contents automatically.");
    }
    return;
  }

  // --- PHASE 2: AUTOMATE FORM ENTRY IF ON SEARCH PAGE ---
  const airportId = prompt("Enter Airport Identifier (e.g. BGM):");
  if (!airportId) return;

  const id = airportId.trim().toUpperCase();
  showStatus(`Filling search form for <b>${id}</b>...`);

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

  // 3. Fill Airport ID Box
  const inputs = Array.from(document.querySelectorAll("input[type='text'], input:not([type])"));
  const idInput = inputs.find(i => i.name.toLowerCase().includes("airport") || i.id.toLowerCase().includes("airport") || i.name.toLowerCase().includes("id")) || inputs[0];

  if (idInput) {
    idInput.value = id;
    idInput.dispatchEvent(new Event("input", { bubbles: true }));
    idInput.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    showStatus("⚠️ Airport ID box not found automatically. Type ID manually and click Search.");
    return;
  }

  // 4. Click Search Button
  const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button'], a.btn"));
  const searchBtn = buttons.find(b => {
    const val = (b.value || b.innerText || "").toLowerCase();
    return val.includes("search") || val.includes("view") || val.includes("find") || b.type === "submit";
  }) || buttons[0];

  if (searchBtn) {
    searchBtn.click();
    showStatus(`Searching for <b>${id}</b>.<br><br>👉 <i>Once search results display on screen, click your bookmarklet ONE MORE TIME to gather and print all reports!</i>`);
  } else {
    showStatus("⚠️ Search button not found. Click Search manually.");
  }
})();
