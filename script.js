(async function runENASR() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // 1. Ask for Airport ID
  const airportId = prompt("Enter Airport Identifier (e.g. ORD or BGM):");
  if (!airportId) return;

  const id = airportId.trim().toLowerCase();

  // 2. Status badge overlay
  let badge = document.createElement("div");
  badge.style.cssText =
    "position:fixed;top:15px;right:15px;z-index:999999;background:#1e40af;color:#fff;padding:14px 20px;border-radius:8px;font-family:sans-serif;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.5);font-size:14px;";
  badge.innerHTML = `✈️ Querying eNASR for <b>${id.toUpperCase()}</b>...`;
  document.body.appendChild(badge);

  try {
    // Direct eNASR query URL for Next Cycle + Airport
    const targetUrl = `https://enasr.faa.gov/eNASR/nasr/Next/Airport/?%E2%80%A0Airport_ID=${id}&Site_No=&%E2%80%A0City=&%E2%80%A0State_Code=&%E2%80%A0Airport_Name=`;

    // Fetch search results directly in the background
    const response = await fetch(targetUrl);
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // Extract all valid report links from the returned page
    const rawLinks = Array.from(doc.querySelectorAll("a"));
    const reportLinks = [];

    for (let a of rawLinks) {
      const text = (a.innerText || a.textContent || "").toLowerCase();
      const href = a.getAttribute("href") || "";

      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("javascript:void") &&
        (href.includes("nasr") || href.includes("report") || href.includes("view") || href.includes("Detail") || text.includes("location") || text.includes("runway") || text.includes("linear") || text.includes("detail"))
      ) {
        // Resolve relative links to absolute URLs
        const fullUrl = new URL(href, "https://enasr.faa.gov/eNASR/nasr/Next/Airport/").href;
        if (!reportLinks.includes(fullUrl)) {
          reportLinks.push(fullUrl);
        }
      }
    }

    if (reportLinks.length === 0) {
      badge.style.background = "#dc2626";
      badge.innerHTML = `❌ No report links found for <b>${id.toUpperCase()}</b>.`;
      setTimeout(() => badge.remove(), 4000);
      return;
    }

    badge.style.background = "#059669";
    badge.innerHTML = `🚀 Found ${reportLinks.length} report section(s) for <b>${id.toUpperCase()}</b>! Opening print tabs...`;

    // Open each report tab and trigger print
    for (let i = 0; i < reportLinks.length; i++) {
      const url = reportLinks[i];
      const win = window.open(url, `_blank_rpt_${i}`);
      if (win) {
        win.addEventListener("load", () => {
          win.print();
        });
      } else {
        alert("Pop-up blocked! Please allow pop-ups for enasr.faa.gov in your browser address bar.");
        break;
      }
      await sleep(1500);
    }

    setTimeout(() => badge.remove(), 2000);

  } catch (err) {
    console.error("eNASR Error:", err);
    badge.style.background = "#dc2626";
    badge.innerHTML = `❌ Error retrieving data for ${id.toUpperCase()}.`;
    setTimeout(() => badge.remove(), 4000);
  }
})();
