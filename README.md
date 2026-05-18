# Cuttle Export Helper

Cuttle exports one file at a time. If you need 20 table signs, 50 place cards, or a full size run of boxes, that means clicking through the export dialog 20, 50, or however many times — changing a parameter each time.

**Cuttle Export Helper** solves that. List your values, set a filename template, click Export once, and get a separate file for every variation.

---

## Example

You're making LED edge-lit signs for wedding reception tables. Your Cuttle design has a `text` parameter that drives the sign content.

Without this extension: open the editor, set `text` to `TABLE 1`, export, set it to `TABLE 2`, export, repeat 18 more times.

With this extension:

| Field | Value |
|-------|-------|
| Parameter | `text` |
| Values | `TABLE 1, TABLE 2, TABLE 3 … TABLE 20` |
| Filename template | `LED {text} SIGN` |

One click. Twenty files: `LED_TABLE_1_SIGN.svg`, `LED_TABLE_2_SIGN.svg`, and so on — ready for the laser cutter.

---

## Features

- **Batch export** any number of parameter values in one click
- **Per-parameter mode** — Text or Number set independently per parameter
- **Two batch modes** — pair parameters row by row, or generate every combination
- **Filename templates** — name each file using parameter values as placeholders
- **Persistent settings** — your parameters and template are saved between sessions
- Exports to **SVG, PNG, PDF, or DXF**
- Works at **Project or Component** scope

---

## Installation

> **Note:** Only works in the Cuttle editor. Won't work on template Readme pages — use **··· → Open In Cuttle Editor** first.

> **Tip:** The popup opens anchored to the extension icon, which by default sits in the top-right corner — directly above Cuttle's parameter panel. If it covers your parameters, move the extension icon to the left side of your browser toolbar to shift the popup out of the way.

### Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension` folder from this repo

### Microsoft Edge

1. Go to `edge://extensions`
2. Enable **Developer mode** (bottom left)
3. Click **Load unpacked**
4. Select the `extension` folder from this repo

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Open the `extension` folder and select `manifest.json`

> Temporarily loaded Firefox add-ons are removed when Firefox closes. A persistent install requires Mozilla signing.

---

## How to use

1. Open your design in the [Cuttle editor](https://cuttle.xyz)
2. Click the extension icon in your toolbar
3. Set **Scope** (Project or Component) and **Format** (SVG, PNG, PDF, DXF)
4. Add a parameter — use the exact parameter name from your Cuttle design
5. Enter values, comma or newline separated
6. Set a filename template using `{paramName}` placeholders
7. Check the preview to confirm your filenames
8. Click **Export**

> If you're exporting more than 10 files, the extension will ask you to confirm before starting.

---

## Parameters

Each parameter card has a name, a list of values, and a mode.

### Text vs Number mode

The mode controls how each value is sent to Cuttle when a parameter is set.

| Mode | Use when | How the value is sent | Example |
|------|----------|-----------------------|---------|
| **Text** | The parameter is a word, name, or label | Wrapped in single quotes | `Alice` → `'Alice'` |
| **Number** | The parameter is a dimension, count, or numeric value | Sent as-is | `50` → `50` |

**Text mode example — making name signs:**
Your design has a `name` parameter. In the Cuttle editor you'd type `'Alice'` with quotes. With Text mode, just type `Alice` — the quotes are added automatically.
```
Values:        Alice, Bob, Carol
Sent to Cuttle: 'Alice', 'Bob', 'Carol'
```

**Number mode example — making boxes in different sizes:**
Your design has a `width` parameter that expects a number. With Number mode, values are sent without quotes so Cuttle treats them as numeric.
```
Values:        50, 75, 100
Sent to Cuttle: 50, 75, 100
```

Text is the default — most Cuttle parameters that accept words or labels expect quoted strings.

### Batch modes

| Mode | What it does |
|------|-------------|
| **Pair rows** | Zips parameters together. Row 1 of each parameter becomes one export, row 2 becomes the next. Exports `min(lengths)` files. |
| **All combinations** | Cartesian product. Every value of every parameter is combined with every other. Exports `n₁ × n₂ × …` files. |

**Pair rows example:**
```
name:  Alice, Bob, Carol
table: 1,     2,   3
→ Alice-table-1, Bob-table-2, Carol-table-3  (3 files)
```

**All combinations example:**
```
shape:    Leaf, Teardrop
patterns: Waves, Spokes, Zigzag
→ Earrings_Leaf_Waves, Earrings_Leaf_Spokes, Earrings_Leaf_Zigzag,
  Earrings_Teardrop_Waves, Earrings_Teardrop_Spokes, Earrings_Teardrop_Zigzag  (6 files)
```

---

## Filename templates

Use `{paramName}` placeholders — they are replaced with the parameter value for each export. Placeholders are case-insensitive. Special characters are replaced with underscores.

Add a fallback with `{paramName|fallback}` for when a value is empty.

| Template | Parameters | Result |
|----------|------------|--------|
| `{name}-sign` | name=Alice | `Alice-sign` |
| `LED {text} SIGN` | text=TABLE 1 | `LED_TABLE_1_SIGN` |
| `{color}-{size}` | color=red, size=M | `red-M` |
| `{label\|untitled}` | label=(empty) | `untitled` |

---

## Export formats

| Format | Notes |
|--------|-------|
| **SVG** | Vector — works with Cricut, laser cutters, and most design tools |
| **PNG** | Raster image — good for previews and digital use |
| **PDF** | Print-ready vector |
| **DXF** | CAD format — preferred by many laser cutters and CNC machines |

