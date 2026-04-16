# Wacom Driver List - Project Overview

## What It Is

A static web application that catalogs Wacom tablet drivers across Windows and macOS. It provides searchable, filterable access to over 2,400 driver entries with version history, download links, and tablet compatibility information.

**Live site**: Hosted on GitHub Pages at `/Wacom-Driver-List`.

## Who It's For

- Wacom tablet users looking for specific driver versions
- Support specialists troubleshooting driver issues
- Driver archivists preserving historical Wacom software

## Key Features

- **Driver catalog** - 2,400+ entries with version, OS, release date, and download URLs
- **Filtering & search** - Filter by OS family, version substring, download source, and date availability
- **Sorting** - By release date or driver version (ascending/descending)
- **Dual download sources** - Links to both Wacom CDN and Archive.org mirrors
- **Tablet compatibility** - Maps Wacom products to compatible driver version ranges
- **Version detail pages** - Per-version view showing all OS variants and downloads
- **JSON export** - Download filtered results as JSON
- **JSON merge tool** - Hidden developer utility for comparing driver JSON files

## Pages

| Route | Purpose |
|-------|---------|
| `/drivers` | Main searchable/filterable driver list (default landing page) |
| `/drivers/[version]` | Detail page for a specific driver version |
| `/tablets` | List of Wacom products extracted from update manifest |
| `/tablets/[name]` | Tablet detail with compatible driver range |
| `/notes` | Static information and external links |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 with Svelte 5 (runes) |
| Build tool | Vite 6 |
| Hosting | GitHub Pages (static adapter) |
| CI/CD | GitHub Actions |
| Data | JSON files, Git submodule (DrawTabData) |

## Data Sources

- **DrawTabData submodule** (`data-repo/`) - Single source of truth for driver data, tablets, pens, and compatibility. Shared with [DrawTabDataExplorer](https://github.com/TheSevenPens/DrawTabDataExplorer/).
- **Wacom update manifest** - Cached XML from `link.wacom.com/wdc/update.xml`
- **Archive.org** - Mirror of Wacom driver downloads

Driver update scripts and docs live in the data-repo. See `data-repo/docs/UPDATING-DRIVERS.md`.

## Running Locally

```bash
npm install
npm run dev      # Dev server with HMR
npm run build    # Production build to dist/
npm run serve    # Serve on 0.0.0.0:8080
```

Requires Node.js 20+. The `data-repo` submodule must be initialized (`git submodule update --init --recursive`).
