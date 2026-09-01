(async function runENASR() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const currentUrl = window.location.href;

  // --- STAGE 3: ON AIRPORT DETAIL PAGE (e.g., /Next/Airport/4422) ---
  if (currentUrl.match(/\/Next\/Airport\/\d+/i) || (currentUrl.includes("/Airport/") && !currentUrl.includes("?"))) {
    // Collect all report links (Location, Linear RWY, Runway, Print items)
    const reportLinks = Array.from(document.querySelectorAll("a")).filter((a) => {
      const text = (a.innerText || a.textContent || "").trim().toLowerCase();
      const href = (a.href || "").toLowerCase();

      if (!href || href.startsWith("javascript:void") || href === "#" || href.endsWith("#")) {
        return false;
      }

      return (
        href.includes("location") ||
        href.includes("runway") ||
        href.includes("rwy") ||
        href.includes("linear") ||
        href.includes("report") ||
        href.includes("print") ||
        text.includes("location") ||
        text.includes("runway") ||
        text.includes("linear") ||
        text.includes("print") ||
        text.includes("view") ||
        text.includes("detail")
      );
    });

    // Fallback: If specific keywords aren't matched, capture all data table links
    const finalLinks = reportLinks.length > 0 
      ? reportLinks 
      : Array.from(document.querySelectorAll("table a")).filter(a => a.href && !a.href.includes("javascript:void"));

    if (finalLinks.length > 0) {
      alert(`Found ${finalLinks.length} report section(s) (Location, Linear RWY, etc.). Opening print tabs...`);

      for (let i = 0; i < finalLinks.length; i++) {
        const url = finalLinks[i].href;
        const win = window.open(url, `_blank_rpt_${i}`);

        if (win) {
          win.addEventListener("load", () => {
            win.print();
          });
        } else {
          alert("Pop-ups blocked! Please click 'Always allow pop-ups' in your browser address bar.");
          break;
        }
        await sleep(1500);
      }
    } else {
      alert("No report links (Location / Runway) found on this detail page.");
    }
    return;
  }

  // --- STAGE 2: ON SEARCH RESULTS LIST PAGE (e.g., /Next/Airport/?†Airport_ID=ord) ---
  if (currentUrl.includes("Airport_ID=") || currentUrl.includes("/Next/Airport/?")) {
    // Find the Airport ID detail link (e.g., link pointing to /Next/Airport/4422)
    const detailLink = Array.from(document.querySelectorAll("a")).find((a) => {
      const href = a.href || "";
      return href.match(/\/Next\/Airport\/\d+/i) || href.match(/\/Airport\/\d+/i);
    }) || Array.from(document.querySelectorAll("table td a")).find(a => a.href && a.href.includes("/Airport/"));

    if (detailLink) {
      // Automatically navigate to the detail page
      window.location.href = detailLink.href;
    } else {
      alert("Could not automatically locate the Airport ID link. Please click the Airport ID (e.g. ORD) manually.");
    }
    return;
  }

  // --- STAGE 1: INITIAL RUN (PROMPT FOR ID) ---
  const airportId = prompt("Enter Airport Identifier (e.g. ORD or BGM):");
  if (!airportId) return;

  const id = airportId.trim().toLowerCase();
  const searchUrl = `https://enasr.faa.gov/eNASR/nasr/Next/Airport/?%E2%80%A0Airport_ID=${encodeURIComponent(id)}&Site_No=&%E2%80%A0City=&%E2%80%A0State_Code=&%E2%80%A0Airport_Name=`;

  window.location.href = searchUrl;
})();
