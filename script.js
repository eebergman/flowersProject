const $ = (s) => document.querySelector(s);
const app = $("#app");
const sidebar = $("#sidebar");
let data = null,
  originalData = null;

// --- Fixed color display order (always used for rendering) ------------------
const colorDisplayOrder = [
  "Green",
  "White",
  "Sky",
  "Mint",
  "Cloud",
  "Seafoam",
  "Teal",
  "Violet",
  "Lilac",
  "Red",
  "Warm Pink",
  "Hot Pink",
  "Orange",
  "Blue",
  "Yellow",
  "Peach",
  "Pink",
  "Ice",
  "Lime",
  "Indigo",
  "Pistachio",
  "Coral",
  "Cream",
  "Periwinkle",
  "Blush",
  "Magenta",
  "Cool Pink",
];

// --- Per-color styles for TRUE boxes only -----------------------------------
const toggleColorStyles = {
  Red: { bg: "#c12a3d", text: "#ffffff" },
  Coral: { bg: "#ec5b65", text: "#000000" },
  Orange: { bg: "#f3a01c", text: "#000000" },
  Yellow: { bg: "#e8dc47", text: "#000000" },
  Lime: { bg: "#b7f832", text: "#000000" },
  Green: { bg: "#35b04f", text: "#000000" },
  Teal: { bg: "#47c6c0", text: "#000000" },
  Sky: { bg: "#1cb3fa", text: "#000000" },
  Blue: { bg: "#3279f7", text: "#ffffff" },
  Indigo: { bg: "#4049ef", text: "#ffffff" },
  Violet: { bg: "#6545c3", text: "#ffffff" },
  Magenta: { bg: "#c03bcc", text: "#ffffff" },
  "Hot Pink": { bg: "#d9569d", text: "#000000" },
  "Warm Pink": { bg: "#ffb7cb", text: "#000000" },
  Blush: { bg: "#f48f99", text: "#000000" },
  Peach: { bg: "#f8c088", text: "#000000" },
  Cream: { bg: "#ffeab2", text: "#000000" },
  Pistachio: { bg: "#dbfa96", text: "#000000" },
  Mint: { bg: "#91fb9d", text: "#000000" },
  Seafoam: { bg: "#85f4d6", text: "#000000" },
  Cloud: { bg: "#86ecfc", text: "#000000" },
  Ice: { bg: "#86b3ee", text: "#000000" },
  Periwinkle: { bg: "#a9a2fa", text: "#000000" },
  Lilac: { bg: "#be7cf9", text: "#000000" },
  "Cool Pink": { bg: "#e099da", text: "#000000" },
  Pink: { bg: "#ee94c7", text: "#000000" },
  White: { bg: "#eae4e7", text: "#000000" },
};

// --- Utility to style a single toggle box based on its value ----------------
function __applyToggleVisual(toggleEl, labelEl, colorName, isTrue) {
  if (isTrue && toggleColorStyles[colorName]) {
    const s = toggleColorStyles[colorName];
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

// Labels to emphasize (bold + underline)
const __emphasisColors = new Set([
  "White",
  "Red",
  "Yellow",
  "Sky",
  "Blue",
  "Hot Pink",
]);

function renderColorToggles(species, parentEl, onDirty) {
  const grid = document.createElement("div");
  grid.className = "toggles";

  colorDisplayOrder.forEach((colorName) => {
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

    if (__emphasisColors.has(colorName)) {
      label.classList.add("emph");
    }

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

// -------------------- Upload / paste / download / copy / revert ------------
$("#fileInput").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    loadJSON(j, f.name);
  } catch (e2) {
    alert("Invalid JSON: " + e2.message);
  }
});

$("#btnPaste").addEventListener("click", () => {
  const t = prompt("Paste JSON");
  if (!t) return;
  try {
    loadJSON(JSON.parse(t), "pasted.json");
  } catch (e) {
    alert("Invalid JSON");
  }
});

$("#btnDownload").addEventListener("click", () => {
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "flowers.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1200);
});

$("#btnCopy").addEventListener("click", () => {
  if (!data) return;
  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
});

$("#btnReset").addEventListener("click", () => {
  if (!originalData) return;
  data = structuredClone(originalData);
  render();
});

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
      document
        .getElementById("species-" + i)
        .scrollIntoView({ behavior: "smooth" });
    });
    sidebar.appendChild(btn);

    // Panel
    const panel = document.createElement("section");
    panel.className = "panel";
    panel.id = "species-" + i;
    panel.innerHTML = `<h2>${sp.name || "Species[" + i + "]"}</h2>`;

    // Colors (fixed order, true-only colorization)
    const colorsMount = document.createElement("div");
    panel.appendChild(colorsMount);
    renderColorToggles(sp, colorsMount, () => {});

    // Transferable colors numbers
    if (sp.transferable_colors) {
      const det = document.createElement("details");
      det.className = "transfer";
      det.innerHTML = "<summary>Transferable colors</summary>";
      const nums = document.createElement("div");
      nums.className = "nums";
      Object.entries(sp.transferable_colors).forEach(([k, v]) => {
        const row = document.createElement("div");
        row.className = "numrow";
        const label = document.createElement("label");
        label.textContent = k
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        const input = document.createElement("input");
        input.type = "number";
        input.value = v;
        input.min = 0;
        input.addEventListener("change", () => {
          sp.transferable_colors[k] = parseInt(input.value) || 0;
        });
        row.append(label, input);
        nums.appendChild(row);
      });
      det.appendChild(nums);
      panel.appendChild(det);
    }

    app.appendChild(panel);
  });
}
