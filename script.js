// Hey I use AI to help me write code because I currently have a debilitating pain disorder that makes typing almost impossible.
// I still want to code though. So I use AI as an accessibility aid to help me reduce the pain caused by my chronic costochondritis.

const appEl = document.getElementById("app");
const sidebarEl = document.getElementById("sidebar");
const fileInputEl = document.getElementById("fileInput");
const btnDownload = document.getElementById("btnDownload");
const btnCopy = document.getElementById("btnCopy");
const btnReset = document.getElementById("btnReset");
const statusEl = document.getElementById("status");
const controlsRow = document.querySelector("header .controls");

// Sidebar hide button
const sidebarBtn = document.createElement("button");
sidebarBtn.className = "sidebar-btn";
sidebarBtn.id = "btnToggleSidebar";
sidebarBtn.type = "button";
sidebarBtn.textContent = "Hide Sidebar";
controlsRow.prepend(sidebarBtn);

// Everything State
const STORAGE_KEY = "flowersData";
let data = null;
let originalData = null;
let lastSavedJSON = localStorage.getItem(STORAGE_KEY) ?? "";
let saveTimer = null;
// Everything State

const speciesNodeCache = new Map(); // name -> { details, summaryTextSpan }

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
const toggleColorStyles = {
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

function applyToggleStyle(wrapEl, textEl, colorName, isOn) {
  const style = toggleColorStyles[colorName];
  if (!style) {
    wrapEl.style.background = isOn ? "#0c1626" : "";
    wrapEl.style.borderColor = "var(--border)";
    textEl.style.color = "var(--text)";
    return;
  }
  if (isOn) {
    wrapEl.style.background = style.bg;
    wrapEl.style.borderColor = style.bg;
    textEl.style.color = style.text;
  } else {
    wrapEl.style.background = "#0c1626";
    wrapEl.style.borderColor = "var(--border)";
    textEl.style.color = "var(--text)";
  }
}

// initialize the app starting with localStorage
(async function init() {
  setStatus("Initializing…");
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      data = JSON.parse(saved);
      originalData = structuredClone(data);
      setStatus("Loaded from localStorage");
      hydrateApp();
      return;
    } catch (err) {
      console.error("localStorage parse error, falling back to JSON file", err);
    }
  }
  // Fallback to new flowers.json
  try {
    const res = await fetch("flowers.json");
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    data = await res.json();
    originalData = structuredClone(data);
    setStatus("Loaded default flowers.json");
    hydrateApp();
  } catch (err) {
    console.error("Failed to load flowers.json", err);
    setStatus("Error loading JSON");
  }
})();

// Make it save
function saveToLocalBatched() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const next = JSON.stringify(data);
      if (next !== lastSavedJSON) {
        localStorage.setItem(STORAGE_KEY, next);
        lastSavedJSON = next;
        setStatus("Saved");
      }
    } catch (err) {
      console.error("Failed to save to localStorage", err);
      setStatus("Save error");
    }
  }, 250);
}

// Little Ones
function hydrateApp() {
  buildSidebar();
  renderAllOnce();
  wireGlobalHandlers();
}

function setStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg;
}

// The Sidebar
function buildSidebar() {
  if (!sidebarEl) return;
  sidebarEl.innerHTML = "";

  const littleLine = document.createElement("hr");
  const h2 = document.createElement("h2");
  h2.textContent = "Species";
  sidebarEl.appendChild(h2);
  sidebarEl.appendChild(littleLine);

  const list = document.createElement("div");
  for (const s of data.species) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = s.name;
    btn.addEventListener("click", () => {
      const node = speciesNodeCache.get(s.name)?.details;
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
        node.open = true;
      }
    });
    list.appendChild(btn);
  }
  sidebarEl.appendChild(list);
}

// Sidebar collapse
sidebarBtn.addEventListener("click", () => {
  sidebarEl.classList.toggle("collapsed");
  sidebarBtn.textContent = sidebarEl.classList.contains("collapsed")
    ? "Show Sidebar"
    : "Hide Sidebar";
});

// Big Render
function renderAllOnce() {
  speciesNodeCache.clear();
  const frag = document.createDocumentFragment();
  for (const s of data.species) {
    frag.appendChild(renderSpeciesPanelStub(s));
  }
  appEl.textContent = "";
  appEl.appendChild(frag);
}

function renderSpeciesPanelStub(species) {
  const details = document.createElement("details");
  details.className = "panel";
  details.id = `species-${cssSafe(species.name)}`;

  // summary header
  const summary = document.createElement("summary");
  const summaryDiv = document.createElement("div");
  summaryDiv.classList.add("summary-header");

  const title = document.createElement("span");
  title.style.fontWeight = "700";
  title.textContent = species.name;

  const meta = document.createElement("span");
  meta.className = "muted";
  meta.style.opacity = "0.85";
  meta.style.fontSize = "12px";
  meta.innerHTML = buildSpeciesMetaText(species);

  summaryDiv.appendChild(title);
  summaryDiv.appendChild(meta);

  const right = document.createElement("div");
  right.style.marginLeft = "auto";
  right.style.fontSize = "12px";
  right.style.opacity = "0.9";

  const countsSpan = document.createElement("span");
  countsSpan.textContent = countsLabel(species);
  right.appendChild(countsSpan);

  summary.appendChild(summaryDiv);
  summary.appendChild(right);

  details.appendChild(summary);

  const content = document.createElement("div");
  content.className = "panel__content";
  details.appendChild(content);

  // Lazy hydrate on first open
  let hydrated = false;
  details.addEventListener(
    "toggle",
    () => {
      if (details.open && !hydrated) {
        hydrated = true;
        content.appendChild(buildSpeciesContent(species));
      }
    },
    { passive: true }
  );

  // cache nodes for quick updates
  speciesNodeCache.set(species.name, {
    details,
    summaryTextSpan: countsSpan,
    metaSpan: meta,
  });

  return details;
}

function buildSpeciesMetaText(species) {
  const src = species.source ? `<b>Source:</b> <i>${species.source}</i>` : "";
  const biomes = Array.isArray(species.allowed_biomes)
    ? `<b>Biomes</b>: <i>${species.allowed_biomes.join(", ")}</i>`
    : "";
  return [src, biomes].filter(Boolean).join(" \u2022 ");
}

function countsLabel(species) {
  const onCount = Object.values(species.colors || {}).filter(Boolean).length;
  const txSum = Object.values(species.transferable_colors || {}).reduce(
    (a, b) => a + Number(b || 0),
    0
  );
  return `${onCount} colors collected \u2022 ${txSum} transfers`;
}

function applyToggleStyle(wrapEl, textEl, colorName, isOn) {
  const style = toggleColorStyles[colorName];
  if (!style) {
    // fallback
    wrapEl.style.background = isOn ? "#0c1626" : "";
    textEl.style.color = "";
    return;
  }
  if (isOn) {
    wrapEl.style.background = style.bg;
    wrapEl.style.borderColor = style.bg; // subtle accent
    textEl.style.color = style.text;
  } else {
    wrapEl.style.background = "#0c1626";
    wrapEl.style.borderColor = "var(--border)";
    textEl.style.color = "var(--text)";
  }
}

function buildSpeciesContent(species) {
  const frag = document.createDocumentFragment();

  // Colors (toggles)
  const colorsPanel = document.createElement("div");
  const colorsHeader = document.createElement("div");
  colorsHeader.textContent = "Colors";
  colorsHeader.style.fontWeight = "700";
  colorsHeader.style.marginBottom = "8px";
  colorsPanel.appendChild(colorsHeader);

  const togglesGrid = document.createElement("div");
  togglesGrid.className = "toggles";

  // Use data.valid_colors ordering when available
  const order =
    Array.isArray(data.valid_colors) && data.valid_colors.length
      ? data.valid_colors
      : Object.keys(species.colors || {}).sort();

  for (const colorName of order) {
    if (!(colorName in (species.colors || {}))) continue;

    const wrap = document.createElement("label");
    wrap.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!species.colors[colorName];
    input.dataset.species = species.name;
    input.dataset.color = colorName;

    const text = document.createElement("span");
    const emph = ["White", "Red", "Yellow", "Sky", "Blue", "Hot Pink"];
    if (emph.includes(colorName)) {
      text.style.fontWeight = "700";
      text.style.textDecoration = "underline";
    }
    text.textContent = colorName;

    // Paint based on JSON state
    applyToggleStyle(wrap, text, colorName, input.checked);

    wrap.appendChild(input);
    wrap.appendChild(text);
    togglesGrid.appendChild(wrap);
  }

  colorsPanel.appendChild(togglesGrid);
  frag.appendChild(colorsPanel);

  // Transferable colors (numbers)
  const tx = species.transferable_colors || {};
  if (Object.keys(tx).length) {
    const detailsTx = document.createElement("details");
    detailsTx.className = "transfer";
    const sum = document.createElement("summary");
    sum.textContent = "Patterned color transfer settings";
    detailsTx.appendChild(sum);

    const nums = document.createElement("div");
    nums.className = "nums";
    for (const key of Object.keys(tx)) {
      const row = document.createElement("div");
      row.className = "numrow";

      const label = document.createElement("label");
      label.textContent = labelizeTxKey(key);

      const input = document.createElement("input");
      input.type = "number";
      input.inputMode = "numeric";
      input.min = "0";
      input.step = "1";
      input.value = String(tx[key] ?? 0);
      input.dataset.species = species.name;
      input.dataset.txkey = key;

      row.appendChild(label);
      row.appendChild(input);
      nums.appendChild(row);
    }
    detailsTx.appendChild(nums);
    frag.appendChild(detailsTx);
  }

  return frag;
}

function labelizeTxKey(k) {
  // e.g., "red_patterned" -> "Red (patterned)"
  if (!k) return "";
  const [base, rest] = String(k).split("_");
  const cap = base.charAt(0).toUpperCase() + base.slice(1);
  return rest ? `${cap} (${rest.replace(/_/g, " ")})` : cap;
}

function cssSafe(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

// ====== Global input handling (delegated) ======
appEl.addEventListener("change", (e) => {
  const t = e.target;

  // Checkbox toggles for colors
  if (t.matches('input[type="checkbox"][data-color][data-species]')) {
    const speciesName = t.dataset.species;
    const color = t.dataset.color;
    const s = data.species.find((x) => x.name === speciesName);
    if (s && s.colors && color in s.colors) {
      s.colors[color] = !!t.checked;
      saveToLocalBatched();
      scheduleSummaryUpdate(speciesName);

      const wrap = t.closest("label.toggle");
      const textEl = wrap?.querySelector("span");
      if (wrap && textEl) applyToggleStyle(wrap, textEl, color, t.checked);
    }
    return;
  }

  // Number inputs for transferable colors
  if (t.matches('input[type="number"][data-txkey][data-species]')) {
    const speciesName = t.dataset.species;
    const key = t.dataset.txkey;
    const s = data.species.find((x) => x.name === speciesName);
    if (s && s.transferable_colors && key in s.transferable_colors) {
      const num = Number(t.value);
      s.transferable_colors[key] =
        Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
      saveToLocalBatched();
      scheduleSummaryUpdate(speciesName);
    }
    return;
  }
});

// Minimal UI refresh (summary counts only)
let uiRefreshQueued = false;
const pendingSummaryUpdates = new Set();

function scheduleSummaryUpdate(speciesName) {
  pendingSummaryUpdates.add(speciesName);
  if (uiRefreshQueued) return;
  uiRefreshQueued = true;
  requestAnimationFrame(() => {
    uiRefreshQueued = false;
    for (const name of pendingSummaryUpdates) {
      const s = data.species.find((x) => x.name === name);
      const nodes = speciesNodeCache.get(name);
      if (s && nodes?.summaryTextSpan) {
        nodes.summaryTextSpan.textContent = countsLabel(s);
      }
    }
    pendingSummaryUpdates.clear();
  });
}

// ====== Buttons & File I/O ======
// File input (JSON)
fileInputEl.addEventListener("change", async () => {
  const file = fileInputEl.files && fileInputEl.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!isFlowersShape(parsed)) throw new Error("Invalid JSON schema");
    data = parsed;
    originalData = structuredClone(parsed);
    hardRerender();
    lastSavedJSON = "";
    saveToLocalBatched(); // persist newly loaded file
    setStatus(`Loaded: ${file.name}`);
  } catch (err) {
    console.error("File load error", err);
    setStatus("Invalid JSON file");
  } finally {
    fileInputEl.value = "";
  }
});

// Download current JSON
btnDownload.addEventListener("click", () => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flowers.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus("Downloaded");
  } catch (err) {
    console.error("Download error", err);
    setStatus("Download error");
  }
});

// Copy to clipboard
btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setStatus("Copied to clipboard");
  } catch (err) {
    console.error("Clipboard error", err);
    setStatus("Copy error");
  }
});

// Revert to last loaded dataset
btnReset.addEventListener("click", () => {
  if (!originalData) return;
  data = structuredClone(originalData);
  hardRerender();
  lastSavedJSON = "";
  saveToLocalBatched();
  setStatus("Reverted to last loaded");
});

// Full rerender for major loads/resets only
function hardRerender() {
  buildSidebar();
  renderAllOnce();
}

// ====== Schema Guard (very light) ======
function isFlowersShape(obj) {
  return obj && typeof obj === "object" && Array.isArray(obj.species);
}
