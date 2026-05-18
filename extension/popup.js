
// cross-browser API
const api = typeof browser !== "undefined" ? browser : chrome;

// shared helpers
function parseList(s) { return (s || "").split(/[\n,]+/).map(t => t.trim()).filter(Boolean); }
function sanitize(name) {
  const cleaned = (name || "").replace(/[^\p{L}\p{N}._-]+/gu, "_");
  return cleaned.replace(/_{2,}/g, "_").replace(/^[_-]+|[_-]+$/g, "");
}
function fillTemplate(str, dict) {
  const dictLower = Object.fromEntries(Object.entries(dict).map(([k, v]) => [String(k).toLowerCase(), v]));
  return (str || "").replace(/\{([^}]+)\}/g, (_, inner) => {
    const parts = String(inner).split("|");
    const rawKey = parts[0].trim();
    const def = parts.length > 1 ? parts.slice(1).join("|") : "";
    const keyLower = rawKey.toLowerCase();
    const val = Object.prototype.hasOwnProperty.call(dictLower, keyLower) ? dictLower[keyLower] : def;
    return val != null ? String(val) : "";
  });
}

// storage
const store = {
  async save(key, value) { if (api?.storage?.local?.set) await api.storage.local.set({ [key]: value }); },
  async load(key, fallback) { if (!api?.storage?.local?.get) return fallback; const obj = await api.storage.local.get(key); return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : fallback; }
};

function getRadio(name) { const el = document.querySelector(`input[name="${name}"][type="radio"]:checked`); return el ? el.value : ""; }

function createParamCard(key = "name", values = "", mode = "text") {
  const div = document.createElement("div");
  div.className = "param-card";
  div.innerHTML = `
    <div class="param-head">
      <div class="grow">
        <label>Parameter name</label>
        <input class="param-key" type="text">
      </div>
      <div>
        <label>Mode</label>
        <select class="param-mode">
          <option value="text">Text</option>
          <option value="number">Number</option>
        </select>
      </div>
      <button class="remove" type="button" title="Remove">Remove</button>
    </div>
    <label>Values</label>
    <textarea class="param-values" placeholder="comma or newline separated"></textarea>
  `;
  div.querySelector(".param-key").value = key;
  div.querySelector(".param-values").value = values;
  const modeSel = div.querySelector(".param-mode");
  modeSel.value = mode === "number" ? "number" : "text";
  div.querySelector(".remove").addEventListener("click", () => { div.remove(); persistAll(); refreshPreview(); });
  div.querySelector(".param-key").addEventListener("input", () => { persistAll(); refreshPreview(); });
  div.querySelector(".param-values").addEventListener("input", () => { persistAll(); refreshPreview(); });
  modeSel.addEventListener("change", () => { persistAll(); refreshPreview(); });
  return div;
}

function currentRows() {
  return Array.from(document.querySelectorAll(".param-card")).map(card => {
    const key = card.querySelector(".param-key").value.trim();
    const values = parseList(card.querySelector(".param-values").value);
    const mode = /** @type {HTMLSelectElement} */(card.querySelector(".param-mode")).value;
    return { key, values, mode };
  }).filter(r => r.key);
}

function buildAllRecords() {
  const rows = currentRows();
  const batchMode = getRadio("batchMode") || "pair";
  if (!rows.length) return [];

  if (batchMode === "product") {
    let acc = [{}];
    for (const r of rows) {
      if (!r.values.length) return [];
      const next = [];
      for (const rec of acc) for (const v of r.values) next.push({ ...rec, [r.key]: v });
      acc = next;
    }
    return acc;
  } else {
    const lens = rows.map(r => r.values.length);
    const count = Math.min(...lens);
    const out = [];
    for (let i = 0; i < count; i++) {
      const rec = {};
      for (const r of rows) rec[r.key] = r.values[i];
      out.push(rec);
    }
    return out;
  }
}

const MAX_PREVIEW_NAMES = 12;
const LARGE_EXPORT_THRESHOLD = 10;

function refreshPreview() {
  const tpl = document.getElementById("template").value || "name-{name}";
  const records = buildAllRecords();
  const previewEl = document.getElementById("preview");
  previewEl.textContent = "";

  if (!records.length) {
    previewEl.textContent = "Preview will show here once you add parameters and values.";
    return;
  }

  const names = records.map(rec => sanitize(fillTemplate(tpl, rec) || "export"));
  const label = document.createElement("em");
  label.textContent = `${names.length} file${names.length !== 1 ? "s" : ""}: `;
  previewEl.appendChild(label);

  const shown = names.slice(0, MAX_PREVIEW_NAMES);
  const rest = names.length - shown.length;
  previewEl.appendChild(document.createTextNode(
    shown.join(", ") + (rest > 0 ? `, …and ${rest} more` : "")
  ));
}

async function persistAll() {
  const scope = getRadio("scope") || "project";
  const format = document.getElementById("format").value;
  const template = document.getElementById("template").value;
  const batchMode = getRadio("batchMode") || "pair";
  const rows = currentRows();
  await store.save("cx_state", { scope, format, template, batchMode, rows });
}

async function restoreAll() {
  const saved = await store.load("cx_state", null);
  const paramsEl = document.getElementById("params");
  if (!saved) {
    paramsEl.appendChild(createParamCard("name", "", "text"));
    refreshPreview();
    return;
  }
  for (const n of ["scope", "batchMode"]) {
    const v = saved[n];
    if (v) { const el = document.querySelector(`input[name="${n}"][value="${v}"]`); if (el) el.checked = true; }
  }
  if (saved.format) document.getElementById("format").value = saved.format;
  if (saved.template) document.getElementById("template").value = saved.template;

  paramsEl.innerHTML = "";
  const rows = Array.isArray(saved.rows) && saved.rows.length ? saved.rows : [{ key: "name", values: [], mode: "text" }];
  for (const r of rows) paramsEl.appendChild(createParamCard(r.key || "", (r.values || []).join(", "), r.mode || "text"));
  refreshPreview();
}

document.addEventListener("DOMContentLoaded", async () => {
  const paramsEl = document.getElementById("params");
  const addBtn = document.getElementById("addParam");
  const status = document.getElementById("status");

  await restoreAll();

  addBtn.addEventListener("click", () => {
    const card = createParamCard("", "", "text");
    paramsEl.appendChild(card);
    card.style.outline = "2px solid #99c";
    setTimeout(() => { card.style.outline = ""; }, 600);
    card.scrollIntoView({ block: "nearest" });
    status.textContent = "Added a parameter row";
    persistAll();
  });

  for (const n of ["scope", "batchMode"]) {
    document.querySelectorAll(`input[name="${n}"]`).forEach(r => r.addEventListener("change", () => { persistAll(); refreshPreview(); }));
  }
  document.getElementById("format").addEventListener("change", persistAll);
  document.getElementById("template").addEventListener("input", () => { persistAll(); refreshPreview(); });

  document.getElementById("run").addEventListener("click", async () => {
    status.textContent = "Preparing...";

    const scope = getRadio("scope") || "project";
    const format = document.getElementById("format").value;
    const template = document.getElementById("template").value || "name-{name}";

    const rows = currentRows();
    if (!rows.length) { status.textContent = "Add at least one parameter and values."; return; }
    const empty = rows.find(r => r.values.length === 0);
    if (empty) { status.textContent = `No values for parameter "${empty.key}". Add at least one value.`; return; }

    const modes = Object.fromEntries(rows.map(r => [r.key, r.mode || "text"]));
    const records = buildAllRecords();
    if (!records.length) { status.textContent = "No records to export."; return; }

    if (records.length > LARGE_EXPORT_THRESHOLD) {
      const ok = window.confirm(`You're about to export ${records.length} files. Continue?`);
      if (!ok) { status.textContent = ""; return; }
    }

    const enriched = records.map(rec => {
      const fname = sanitize(fillTemplate(template, rec) || "export");
      return { ...rec, __fname: fname };
    });

    try {
      const tabsApi = api?.tabs ?? chrome.tabs;
      const scriptingApi = api?.scripting ?? chrome.scripting;
      const [tab] = await tabsApi.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url) { status.textContent = "Open your Cuttle editor tab first."; return; }

      let exported = 0;
      let failed = 0;

      for (let i = 0; i < enriched.length; i++) {
        const rec = enriched[i];
        status.textContent = `Exporting ${i + 1} of ${enriched.length}: ${rec.__fname}…`;

        const results = await scriptingApi.executeScript({
          target: { tabId: tab.id, allFrames: true },
          world: "MAIN",
          args: [scope, format, rec, modes],
          func: async (scope, format, rec, modes) => {
            try {
              if (!window.Cuttle) return { ok: false, reason: "No Cuttle in this frame" };

              const toProject = scope === "project";
              const fmt = (format || "svg").toLowerCase();
              const exporter = {
                svg: (n) => window.Cuttle.exportSVG(n),
                png: (n) => window.Cuttle.exportPNG(n),
                pdf: (n) => window.Cuttle.exportPDF(n),
                dxf: (n) => window.Cuttle.exportDXF(n)
              }[fmt] || ((n) => window.Cuttle.exportSVG(n));

              // Text mode wraps value in single quotes (a string expression Cuttle understands).
              // Number mode sends the value as-is (for numeric or expression parameters).
              const wrapSingleQuoted = (s) => "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
              const setParams = (payload) => toProject ? window.Cuttle.setProjectParameters(payload) : window.Cuttle.setComponentParameters(payload);
              const buildPayload = (rec, modes) => {
                const p = {};
                for (const [k, v] of Object.entries(rec)) {
                  if (k === "__fname") continue;
                  p[k] = ((modes && modes[k]) || "text") === "text" ? wrapSingleQuoted(v) : v;
                }
                return p;
              };

              const fname = rec.__fname || "export";
              let ok = true;
              try { await setParams(buildPayload(rec, modes)); } catch { ok = false; }

              if (!ok) {
                // Second chance: flip all modes
                const flipped = {};
                for (const [k, v] of Object.entries(rec)) {
                  if (k === "__fname") continue;
                  const want = (modes && modes[k]) || "text";
                  flipped[k] = want === "text" ? v : wrapSingleQuoted(v);
                }
                try { await setParams(flipped); ok = true; } catch {}
              }

              await exporter(fname);
              return { ok: true };
            } catch (e) {
              return { ok: false, error: e?.message ?? String(e) };
            }
          }
        });

        if (results.some(r => r?.result?.ok)) {
          exported++;
        } else {
          failed++;
          const detail = results[0]?.result;
          console.warn("[Cuttle Export Helper] failed:", rec.__fname, detail?.error || detail?.reason);
        }
      }

      if (exported > 0) {
        status.textContent = `Done. Exported ${exported} file${exported !== 1 ? "s" : ""}${failed ? `, ${failed} failed — see console for details` : ""}.`;
      } else {
        status.textContent = "No frame exposed window.Cuttle. Open an editor page and try again.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Error. See console for details.";
    }
  });
});
