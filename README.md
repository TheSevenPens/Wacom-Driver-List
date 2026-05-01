# Wacom-Driver-List

> ## ⚠ Deprecated — use [DrawTabDataExplorer](https://github.com/TheSevenPens/DrawTabDataExplorer) instead
>
> The driver catalog has moved to **[DrawTabDataExplorer](https://thesevenpens.github.io/DrawTabDataExplorer/drivers)**, which carries the same data with richer filter / sort / column / saved-view controls and links into the broader DrawTabData ecosystem (tablets, pens, families, compatibility).
>
> One feature is **not yet** in the Explorer: the per-tablet **driver-version range** (`drivermin` / `drivermax`) extracted from Wacom's `update.xml` manifest. That data is being ported next; this repo will continue to host the manifest-derived `/tablets` view in the meantime.
>
> Tracking the migration: [DrawTabDataExplorer/docs/WORKSTREAMS.md](https://github.com/TheSevenPens/DrawTabDataExplorer/blob/main/docs/WORKSTREAMS.md#merge-consumer-project-wacom-driver-list).

---

## What this project was

A static SvelteKit site cataloging Wacom tablet drivers across Windows and macOS — 2,400+ entries with version, OS, release date, download URLs (Wacom CDN + Archive.org mirrors), plus a tablets view derived from Wacom's `update.xml` manifest.

See [`docs/OVERVIEW.md`](docs/OVERVIEW.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full description.
