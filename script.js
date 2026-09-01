(async function runENASR() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- 1. FUNCTION TO FIND ALL REPORT LINKS ON SCREEN ---
  function getReportLinks() {
    const navKeywords = ["home", "help", "faq", "disclaimer", "contact", "logout", "search", "eNASR"];
    
    return Array.from(document.querySelectorAll("a")).filter((a) => {
      const text = (a.innerText || a.textContent || "").trim().toLowerCase();
      const href = (a.href || "").toLowerCase();

      if (!href || href.startsWith("javascript:void") || href === "#" || href.endsWith("#")) {
        return false;
      }

      // Ignore top/bottom website navigation links
      for (let kw of navKeywords) {
        if (text === kw) return false;
      }

      // Include links that are part of report tables or contain parameters
      return (
        href.includes("nasr") ||
        href.includes("report") ||
        href.includes("view") ||
        href.includes("detail") ||
        href.includes("?") ||
        text.length > 0
      );
    });
  }

  const existingLinks = getReportLinks();

  // --- 2. IF WE ARE ON RESULTS PAGE, OPEN & PRINT ALL LINKS ---
  if (existingLinks.length > 0 && window.location.href.includes("Airport")) {
    alert(`Found ${existingLinks.length} report item(s). Opening print tabs now...`);

    for (let i = 0; i < existingLinks.length; i++) {
      const url = existingLinks[i].href;
      const win = window.open(url, `_blank_rpt_${i}`);
      
      if (win) {
        win.addEventListener("load", () => {
          win.print();
        });
      } else {
        alert("Pop-ups blocked! Please allow pop-ups for enasr.faa.gov in your browser address bar.");
        break;
      }
      await sleep(1500);
    }
    return;
  }

  // --- 3. IF NOT ON RESULTS PAGE, DIRECTLY NAVIGATE TO AIRPORT URL ---
  const airportId = prompt("Enter Airport Identifier (e.g. ORD or BGM):");
  if (!airportId) return;

  const id = airportId.trim().toLowerCase();

  // Construct direct search URL using exact eNASR parameters
  const targetUrl = `https://enasr.faa.gov/eNASR/nasr/Next/Airport/?%E2%80%A0Airport_ID=${encodeURIComponent(id)}&Site_No=&%E2%80%A0City=&%E2%80%A0State_Code=&%E2%80%A0Airport_Name=`;

  // Navigate directly to the results page
  window.location.href = targetUrl;
})();
