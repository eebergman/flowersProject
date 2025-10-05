const $ = (s) => document.querySelector(s);
const app = $("#app");
const sidebar = $("#sidebar");
let data = null,
  originalData = null;

// --- Fixed color display order (always used for rendering) ------------------
const __colorDisplayOrder = [
  "Black",
  "Blue",
  "Blush",
  "Cloud",
  "Cool Pink",
  "Coral",
  "Cream",
  "Gray",
  "Green",
  "Hot Pink",
  "Ice",
  "Indigo",
  "Lilac",
  "Lime",
  "Magenta",
  "Mint",
  "Orange",
  "Peach",
  "Periwinkle",
  "Pink",
  "Pistachio",
  "Red",
  "Seafoam",
  "Sky",
  "Teal",
  "Violet",
  "Warm Pink",
  "White",
  "Yellow",
];

// --- Per-color styles for TRUE boxes only -----------------------------------
const __toggleColorStyles = {
  Black: { bg: "#000000", text: "#ffffff" },
  Blue: { bg: "#3279f7", text: "#ffffff" },
  Blush: { bg: "#f48f99", text: "#000000" },
  Cloud: { bg: "#86ecfc", text: "#000000" },
  "Cool Pink": { bg: "#e099da", text: "#000000" },
  Coral: { bg: "#ec5b65", text: "#000000" },
  Cream: { bg: "#ffeab2", text: "#000000" },
  Gray: { bg: "#535652", text: "#ffffff" },
  Green: { bg: "#35b04f", text: "#000000" },
  "Hot Pink": { bg: "#d9569d", text: "#000000" },
  Ice: { bg: "#86b3ee", text: "#000000" },
  Indigo: { bg: "#4049ef", text: "#ffffff" },
  Lilac: { bg: "#be7cf9", text: "#000000" },
  Lime: { bg: "#b7f832", text: "#000000" },
  Magenta: { bg: "#c03bcc", text: "#ffffff" },
  Mint: { bg: "#91fb9d", text: "#000000" },
  Orange: { bg: "#f3a01c", text: "#000000" },
  Peach: { bg: "#f8c088", text: "#000000" },
  Periwinkle: { bg: "#a9a2fa", text: "#000000" },
  Pink: { bg: "#ee94c7", text: "#000000" },
  Pistachio: { bg: "#dbfa96", text: "#000000" },
  Red: { bg: "#c12a3d", text: "#ffffff" },
  Seafoam: { bg: "#85f4d6", text: "#000000" },
  Sky: { bg: "#1cb3fa", text: "#000000" },
  Teal: { bg: "#47c6c0", text: "#000000" },
  Violet: { bg: "#6545c3", text: "#ffffff" },
  "Warm Pink": { bg: "#ffb7cb", text: "#000000" },
  White: { bg: "#eae4e7", text: "#000000" },
  Yellow: { bg: "#e8dc47", text: "#000000" },
};

// --- Utility to style a single toggle box based on its value ----------------
function __applyToggleVisual(toggleEl, labelEl, colorName, isTrue) {
  if (isTrue && __toggleColorStyles[colorName]) {
    const s = __toggleColorStyles[colorName];
    toggleEl.style.backgroundColor = s.bg;
    toggleEl.style.borderColor = "rgba(0,0,0,0)";
    if (labelEl) labelEl.style.color = s.text;
    else toggleEl.style.color = s.text;
  } else {
    // Dark theme defaults for FALSE
    toggleEl.style.backgroundColor = "#0c1626";
    toggleEl.style.borderColor = "var(--border)";
    if (labelEl) labelEl.style.color = "";
    else toggleEl.style.color = "";
  }
}

function installSidebarToggleButton() {
  const controls = document.querySelector(".controls");
  if (!controls) return;

  // Create button once
  let button = document.getElementById("btnToggleSidebar");
  if (!button) {
    button = document.createElement("button");
    button.id = "btnToggleSidebar";
    button.type = "button";
    button.className = "sidebar-btn";
    controls.prepend(button); // put it first in the toolbar
  }

  const sidebarElement = document.getElementById("sidebar");
  const KEY = "sidebarCollapsed";

  // initial state from storage
  const collapsed = localStorage.getItem(KEY) === "1";
  if (collapsed) sidebarElement.classList.add("collapsed");
  button.textContent = collapsed ? "Show Sidebar" : "Hide Sidebar";

  button.addEventListener("click", () => {
    const nowCollapsed = sidebarElement.classList.toggle("collapsed");
    button.textContent = nowCollapsed ? "Show Sidebar" : "Hide Sidebar";
    localStorage.setItem(KEY, nowCollapsed ? "1" : "0");
  });
}

// --- MAIN: render color toggles for one species, in fixed order -------------
/**
 * Renders the color toggles grid for a species.
 * - species: the species object (with .colors map)
 * - parentEl: container to append into
 * - onDirty: optional callback called after a value changes
 */
function renderColorToggles(species, parentEl, onDirty) {
  const grid = document.createElement("div");
  grid.className = "toggles";

  __colorDisplayOrder.forEach((colorName) => {
    if (!(colorName in species.colors)) return; // skip if species doesn't use this color

    const value = !!species.colors[colorName];

    const row = document.createElement("div");
    row.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = value;
    input.setAttribute("aria-label", colorName);

    const label = document.createElement("label");
    label.textContent = colorName;

    // Initial visual state
    __applyToggleVisual(row, label, colorName, input.checked);

    // Change handler: update data, restyle, notify
    input.addEventListener("change", () => {
      species.colors[colorName] = input.checked;
      __applyToggleVisual(row, label, colorName, input.checked);
      if (typeof onDirty === "function") onDirty();
    });

    row.appendChild(input);
    row.appendChild(label);
    grid.appendChild(row);
  });

  parentEl.appendChild(grid);
}

// JSON buttons stuff
function initControls() {
  const fileInputElement = document.getElementById("fileInput");
  const pasteButton = document.getElementById("btnPaste");
  const downloadButton = document.getElementById("btnDownload");
  const copyButton = document.getElementById("btnCopy");
  const resetButton = document.getElementById("btnReset");

  if (fileInputElement) {
    fileInputElement.addEventListener("change", async (event) => {
      const selectedFile = event.target.files[0];
      if (!selectedFile) return;

      try {
        const fileText = await selectedFile.text();
        const parsedJson = JSON.parse(fileText);
        loadJSON(parsedJson, selectedFile.name);
      } catch (error) {
        alert("Invalid JSON: " + error.message);
      }
    });
  }

  if (pasteButton) {
    pasteButton.addEventListener("click", () => {
      const pastedText = prompt("Paste JSON");
      if (!pastedText) return;

      try {
        const parsedJson = JSON.parse(pastedText);
        loadJSON(parsedJson, "pasted.json");
      } catch {
        alert("Invalid JSON");
      }
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const anchorElement = document.createElement("a");
      anchorElement.href = URL.createObjectURL(blob);
      anchorElement.download = "flowers.json";
      anchorElement.click();

      setTimeout(() => URL.revokeObjectURL(anchorElement.href), 1200);
    });
  }

  if (copyButton) {
    copyButton.addEventListener("click", () => {
      if (!data) return;
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (!originalData) return;
      data = structuredClone(originalData);
      render();
    });
  }
}

// Run after DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initControls);
  installSidebarToggleButton();
} else {
  initControls();
  installSidebarToggleButton();
}

function loadJSON(json, name) {
  originalData = structuredClone(json);
  data = structuredClone(json);
  $("#status").textContent = "Loaded: " + name;
  render();
}

// ------------------------------- RENDER -------------------------------------
function render() {
  app.innerHTML = "";
  sidebar.innerHTML = "<h2>Species</h2>";
  if (!data || !Array.isArray(data.species)) return;

  data.species.forEach((sp, i) => {
    // Sidebar link
    const btn = document.createElement("button");
    btn.textContent = `${sp.name || "Species[" + i + "]"}`;
    btn.addEventListener("click", () => {
      const target = document.getElementById("species-" + i);
      if (target && target.tagName.toLowerCase() === "details") {
        target.open = true; // ensure expanded
      }
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    sidebar.appendChild(btn);

    // Species Panel
    // Collapsible panel
    const details = document.createElement("details");
    details.className = "panel species";
    details.id = "species-" + i;
    details.open = true; // start expanded; set to false if you prefer collapsed by default

    // Summary header
    const summary = document.createElement("summary");
    summary.textContent = sp.name || "Species[" + i + "]";
    details.appendChild(summary);

    // Content wrapper
    const content = document.createElement("div");
    content.className = "panel__content";
    details.appendChild(content);

    // Colors (fixed order, true-only colorization)
    const colorsMount = document.createElement("div");
    content.appendChild(colorsMount);
    renderColorToggles(sp, colorsMount, () => {
      // mark dirty if needed
    });

    // Transferable colors numbers
    if (sp.transferable_colors) {
      const transferDetails = document.createElement("details");
      transferDetails.className = "transfer";
      transferDetails.innerHTML = "<summary>Transferable colors</summary>";

      const nums = document.createElement("div");
      nums.className = "nums";

      Object.entries(sp.transferable_colors).forEach(([key, value]) => {
        const row = document.createElement("div");
        row.className = "numrow";

        const label = document.createElement("label");
        label.textContent = key
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        const input = document.createElement("input");
        input.type = "number";
        input.value = value;
        input.min = 0;
        input.addEventListener("change", () => {
          sp.transferable_colors[key] = parseInt(input.value, 10) || 0;
        });

        row.append(label, input);
        nums.appendChild(row);
      });

      transferDetails.appendChild(nums);
      content.appendChild(transferDetails);
    }

    app.appendChild(details);
  });
}
