(async function runENASR() {
  // 1. Ask for Airport ID
  const airportId = prompt("Enter Airport Identifier (e.g. BGM):");
  if (!airportId) return;

  const idUpper = airportId.trim().toUpperCase();

  // Helper function to delay actions (gives eNASR time to render DOM changes)
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    console.log(`Starting automated extraction for ${idUpper}...`);

    // 2. Select 'Next Cycle' & 'Airport' drop-downs
    // Note: Replace these selector IDs with the actual DOM element IDs from eNASR
    const cycleSelect = document.querySelector("select[name*='cycle']");
    if (cycleSelect && cycleSelect.options.length > 1) {
      cycleSelect.selectedIndex = 1; // Selects next cycle
      cycleSelect.dispatchEvent(new Event("change"));
    }

    const sourceSelect = document.querySelector("select[name*='source']");
    if (sourceSelect) {
      sourceSelect.value = "AIRPORT"; // Adjust value string based on site HTML
      sourceSelect.dispatchEvent(new Event("change"));
    }

    // 3. Input Airport ID into the search field
    const inputField = document.querySelector("input[name*='airport']");
    if (inputField) {
      inputField.value = idUpper;
      inputField.dispatchEvent(new Event("input"));
      
      // Click search button
      const searchBtn = document.querySelector("button[type='submit'], input[type='submit']");
      if (searchBtn) searchBtn.click();
    }

    alert(`Navigated to ${idUpper}. Please wait for results to load...`);
    await sleep(3000); // Wait 3 seconds for search results

    // 4. Extract all generated report URLs (Location, Linear Runway, etc.)
    // Scrapes all relevant print/report links dynamically
    const reportLinks = Array.from(document.querySelectorAll("a"))
      .filter((a) => {
        const text = a.innerText.toLowerCase();
        const href = a.href;
        return (
          href.includes("nasr") &&
          (text.includes("location") || text.includes("runway") || text.includes("report"))
        );
      })
      .map((a) => a.href);

    if (reportLinks.length === 0) {
      alert("No report links found for this ID. Ensure search results are loaded.");
      return;
    }

    // 5. Sequentially open each report and trigger the browser Print dialogue
    for (let i = 0; i < reportLinks.length; i++) {
      const reportUrl = reportLinks[i];
      const printWin = window.open(reportUrl, `_blank_report_${i}`);

      if (printWin) {
        printWin.addEventListener("load", () => {
          printWin.print(); // Triggers Print -> "Save as PDF"
        });
      }
      await sleep(1500); // Pause between popups to avoid browser popup blocking
    }

  } catch (err) {
    console.error("Error executing eNASR helper:", err);
    alert("An error occurred during automation. Check browser console.");
  }
})();
