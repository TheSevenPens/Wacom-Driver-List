# Wacom Driver List - Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Data Sources                          │
│  wacom-drivers.json  |  DrawTabData submodule  |  XML   │
└───────────┬─────────────────────┬───────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│              Build-Time Processing (Vite)                │
│  JSON imports  |  Path aliases ($data)  |  Prerender    │
└───────────┬─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│             SvelteKit Static Site (dist/)                │
│  Prerendered HTML  |  Client-side filtering/sorting     │
└───────────┬─────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                GitHub Pages Hosting                      │
└─────────────────────────────────────────────────────────┘
```

This is a fully static site. There is no server, no API, and no database. All data is baked into the build at compile time and all interactivity (filtering, sorting) runs client-side.

## Directory Layout

```
Wacom-Driver-List/
├── src/
│   ├── app.html                  # HTML shell template
│   ├── app.css                   # Global styles
│   ├── lib/
│   │   ├── components/
│   │   │   ├── DriverList.svelte # Main driver table + filters
│   │   │   └── JsonMerger.svelte # Dev utility for merging JSON
│   │   ├── data/
│   │   │   ├── drivers.js        # Loads & exports driver JSON
│   │   │   ├── wacom-products.json
│   │   │   └── relnotes-tablets.json
│   │   └── versionUtils.js       # Version string comparison
│   └── routes/
│       ├── +layout.svelte        # Sidebar + content shell
│       ├── +layout.js            # Prerender = true
│       ├── +page.js              # Redirect / → /drivers
│       ├── drivers/              # Driver list & detail pages
│       ├── tablets/              # Tablet list & detail pages
│       └── notes/                # Static info page
├── data-repo/                    # Git submodule (DrawTabData)
├── scripts/                      # One-off data extraction scripts
├── docs/                         # Project documentation
├── dist/                         # Build output
├── wacom-drivers.json            # Master driver database
├── svelte.config.js              # SvelteKit config (static adapter)
├── vite.config.js                # Vite config (aliases, plugins)
└── package.json
```

## Data Layer

### Master Driver Data (`wacom-drivers.json`)

The root-level JSON file contains ~2,400 driver entries. Each entry has this shape:

```json
{
  "DriverVersion": "6.3.46-2",
  "DriverName": "Driver 6.3.46-2 for WINDOWS",
  "OSFamily": "WINDOWS",
  "ReleaseDate": "2024-01-15",
  "DriverUID": "6.3.46-2_WINDOWS",
  "DriverURLWacom": "https://cdn.wacom.com/...",
  "DriverURLArchiveDotOrg": "https://archive.org/...",
  "ReleaseNotesURL": "https://..."
}
```

`DriverUID` (version + OS) is the unique key used for merging and deduplication.

### DrawTabData Submodule (`data-repo/`)

A shared data repository (`TheSevenPens/DrawTabData`) containing JSON datasets for tablets, pens, pen families, brands, and driver compatibility. Mapped as the `$data` alias in both Svelte and Vite configs so components can import from it directly.

**Note:** [DrawTabDataExplorer](https://github.com/TheSevenPens/DrawTabDataExplorer/) also consumes this same submodule. If you encounter data-related issues, cross-check against DrawTabDataExplorer to determine whether the problem is in the shared data or in this project's consumption of it.

### Data Processing Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `extract-products.js` | Parses Wacom's `update.xml` into `wacom-products.json` |
| `extract-relnotes-tablets.js` | Extracts tablet model names from release notes HTML |
| `merge_drivers.js` (root) | CLI tool to merge two driver JSON arrays by `DriverUID` |

These are run manually as maintenance tasks, not during the build.

## Frontend Architecture

### SvelteKit with Static Adapter

The app uses `@sveltejs/adapter-static` to prerender every route at build time. All pages export `prerender = true` via the root layout. The output is plain HTML/CSS/JS in `dist/`.

### Routing

SvelteKit file-based routing with two dynamic segments:

- `/drivers/[version]` - resolved from the driver data at prerender time via `entries()` in `+page.js`
- `/tablets/[name]` - resolved from the product data at prerender time

The root `/` redirects to `/drivers` via a client-side redirect in `+page.js`.

### Layout

`+layout.svelte` provides a persistent sidebar (210px) with navigation links and a main content area. The sidebar highlights the active route.

### Key Component: DriverList

`DriverList.svelte` is the primary UI. It uses Svelte 5 runes for reactive state:

- **Filters** (`$state`): OS family, version text, download source, has-date toggle
- **Derived data** (`$derived`): Filtered + sorted driver list computed from filter state
- **Sorting**: By release date or version, using `versionUtils.js` for semantic version comparison

### Version Comparison (`versionUtils.js`)

Handles Wacom's inconsistent versioning (e.g., `6.3.46-2` vs `6.3.46.1`) by splitting on both `-` and `.` delimiters and comparing segments numerically.

## Build & Deployment

### Build Pipeline

```
npm run build
  → Vite builds SvelteKit app
  → Static adapter prerenders all routes
  → Output written to dist/
```

### Path Handling

The base path changes by environment:
- **Development**: `/` (default)
- **Production**: `/Wacom-Driver-List` (set via `NODE_ENV=production` in `svelte.config.js`)

### CI/CD (`deploy-pages.yml`)

Triggered on push to `main` or manual dispatch:

1. Checkout with `submodules: recursive`
2. Setup Node 20 with npm cache
3. `npm ci` + `npm run build`
4. Upload `dist/` as Pages artifact
5. Deploy to GitHub Pages

### Vite Configuration

- `$data` alias points to `data-repo/` for submodule imports
- `$lib` alias points to `src/lib/` (SvelteKit default)
- Dev server binds to `0.0.0.0` for network access

## Utility Scripts

| File | Purpose |
|------|---------|
| `ArchiveDownloads.ps1` | PowerShell script for bulk-downloading drivers to local NAS storage |
| `merge_drivers.js` | Merges driver JSON files, deduplicating by `DriverUID` |

## External Dependencies

| Dependency | Role |
|-----------|------|
| `@sveltejs/kit` | Application framework |
| `svelte` | Component library (v5 with runes) |
| `vite` | Build tooling |
| `@sveltejs/adapter-static` | Static site generation |
| `xlsx` | Spreadsheet handling (utility/export support) |
