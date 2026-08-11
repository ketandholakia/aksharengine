# AksharEngine (અક્ષરEngine)

> A configurable, zero-dependency engine and visual calibration studio for converting legacy non-Unicode fonts into standardized Unicode text.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![NPM](https://img.shields.io/badge/npm-akshar--engine-red)

---

## Overview

**AksharEngine** solves the problem of non-standardized legacy Indic fonts (Gujarati, Devanagari/Hindi, Marathi, Nepali, etc.). Legacy fonts use custom ASCII/ANSI glyph mappings that render garbled text when viewed without the proprietary font installed.

Rather than hardcoding static conversion tables, **AksharEngine** treats conversion logic as a rule-based execution engine and font mappings as pluggable JSON profiles. It functions as a web app, a CLI, and a lightweight npm library.

### Key Features

- **Extensible Conversion Pipeline:** Longest-match character replacement algorithm paired with script-specific positional reordering (Left-Matra, Reph, Half-letters).
- **Batch Converter:** Convert multiple `.txt` files in bulk entirely in the browser using the integrated Batch Converter. 
- **Visual Mapping Builder:** Calibrate new legacy fonts on the fly using a side-by-side glyph mapping grid or auto-aligning sample text pairs.
- **Client-Side & Offline First:** 100% in-browser processing using IndexedDB storage—your text never leaves your device. Can be installed as a Progressive Web App (PWA).
- **CLI & NPM Library:** Exported as a pure ESModule/CommonJS zero-dependency package for server-side usage or automated bash scripts.

---

## Supported Scripts

- **Gujarati:** TeraFont, Saral, Sulekh, Bhasha Bharti, LMG, Gujlys, etc.
- **Devanagari (Hindi / Marathi):** Krutidev, DevLys, Walkman Chanakya, APS, Shivaji, Shusha, etc.
- **Nepali:** Preeti, Himali, Everest, etc.

---

## CLI Usage

The core engine can be installed globally and used as a terminal application to automate document conversion.

### Global Installation

```bash
npm install -g akshar-engine
```

### Usage

```bash
akshar -i legacy_document.txt -p profile.json -o converted.txt
```

**Options:**
- `-i, --input` : Path to the legacy text file (Required)
- `-p, --profile` : Path to the font mapping JSON profile (Required)
- `-o, --output` : Path to save the converted Unicode file (Optional, defaults to stdout)
- `-h, --help` : Display the help menu

**Example with Bash Piping:**
```bash
akshar -i legacy_file.txt -p terafont.json | grep "અરજી"
```

---

## NPM Library Usage

You can embed the zero-dependency AksharEngine in your Node.js, React, or Vue applications.

### Installation

```bash
npm install akshar-engine
```

### Basic Example

```ts
import { ConverterEngine } from 'akshar-engine';

// 1. Load or import your profile JSON
const profile = {
  id: 'krutidev-010',
  name: 'Krutidev',
  script: 'devanagari',
  mappings: [ /* ... */ ],
  reorderingRules: {
    leftMatraSymbols: ["િ"],
    rephSymbols: ["ર્"]
  }
};

// 2. Instantiate Engine
const engine = new ConverterEngine({ 
  profile,
  enableMatraReordering: true,
  enableRephReordering: true
});

// 3. Convert Text
const result = engine.convert("v{kj");
console.log(result.text); // 'अक्षर'
console.log(`Took ${result.stats.executionTimeMs}ms`);
```

---

## Web App Development

If you'd like to run the Visual Studio & Calibrator locally or deploy it yourself:

### Prerequisites

- Node.js `18.x` or higher
- `npm` or `pnpm`

### Setup

```bash
git clone https://github.com/your-username/akshar-engine.git
cd akshar-engine
npm install
```

### Available Commands

- `npm run dev` - Starts the Vite development server.
- `npm run build:app` - Compiles the web application into the `dist/` folder.
- `npm run build:lib` - Compiles the core engine into the `dist-lib/` folder (ESM and CJS).
- `npm run test` - Runs the Vitest suite to verify engine algorithms.

### Progressive Web App (PWA)
The web application is fully configured as a PWA using `vite-plugin-pwa`. Once hosted, users can "Install" the application to their home screen and use it 100% offline.

### GitHub Pages Deployment
A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. Pushing to the `main` branch will automatically compile the web app and deploy it to GitHub Pages.

---

## Profile Format (JSON)

Font profiles follow a schema-first design allowing complete customization over font behavior:

```json
{
  "id": "terafont-kinnari-gujarati",
  "name": "TeraFont Kinnari (Gujarati)",
  "script": "gujarati",
  "language": "gu",
  "version": "1.0.0",
  "fontFamilies": ["TeraFont Kinnari"],
  "isBuiltIn": true,
  "reorderingRules": {
    "leftMatraSymbols": ["િ"],
    "rephSymbols": ["ઁ"],
    "customTransforms": []
  },
  "mappings": [
    { "legacy": "s", "unicode": "ક", "category": "consonant" },
    { "legacy": "à", "unicode": "ા", "category": "matra" },
    { "legacy": "ks", "unicode": "ક્ષ", "category": "conjunct" }
  ]
}
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
