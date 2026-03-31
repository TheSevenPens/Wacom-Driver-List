# Futures

Things we should improve or consider doing.

## Testing

- Add unit tests (e.g. with Vitest) for filtering, sorting, and version-comparison logic in DriverList.
- Add tests for the JSON diff/merge logic in JsonMerger.
- Consider end-to-end tests (e.g. Playwright) for critical user flows like searching and exporting.

## Accessibility

- Add ARIA labels to the driver table, filter controls, and tab navigation.
- Ensure all interactive elements are keyboard-navigable.
- Verify color contrast meets WCAG AA, especially for links and status indicators.

## Performance

- Add pagination or virtual scrolling for the driver table — rendering 1000+ rows at once is expensive.
- Measure and track production bundle size.

## Data management

- Automate driver data updates instead of relying on manual JSON edits.
- Validate `wacom-drivers.json` against a schema (e.g. JSON Schema) to catch data issues early.
- Consider a lightweight CI check that validates the JSON on every push.

## Documentation

- Add a README with setup instructions, an overview of the project, and how to contribute.
- Document the data format and what each field in `wacom-drivers.json` means.
- Document the utility scripts (`merge_drivers.js`, `ArchiveDownloads.ps1`).

## TypeScript

- Consider migrating the Svelte components to TypeScript for better type safety.

## Error handling

- Improve error messages in JsonMerger — currently shows a generic "Error parsing JSON" with details only in the console.
- Add user-facing feedback when file uploads fail or contain unexpected data.

## Mobile and responsive design

- Test and improve the layout on smaller screens — the table-heavy UI may not work well on phones.
- Consider a card-based layout as an alternative view for narrow viewports.

## Integration with Wacom's update.xml

Wacom publishes a machine-readable update manifest at `https://link.wacom.com/wdc/update.xml`. A cached copy lives in `data/wacom-update.xml`. This file contains data we don't currently track and could be used to enrich the project in several ways:

### Enrich existing driver data

- **Download URLs from cdn.wacom.com**: The XML has direct CDN download URLs (base URL + filename) for every driver version it lists (~69 Windows, ~73 macOS). We could cross-reference these against `wacom-drivers.json` to fill in missing `DriverURLWacom` values.
- **Supported OS versions per driver**: The XML lists exactly which OS versions each driver supports (e.g. "Windows 10", "Windows 11", "macOS 14.0"). We could add a `SupportedOS` field to our data.
- **CRC checksums**: Each driver entry includes a CRC32 checksum. We could store these and use them to verify downloaded files in `ArchiveDownloads.ps1`.

### New data we could surface

- **Product/device compatibility**: The XML contains a `<products>` section mapping tablet models (Intuos, Cintiq, One, etc.) to their compatible driver version ranges (`drivermin`/`drivermax`). This would let us add a "compatible tablets" view — search by tablet model, see which drivers work with it.
- **Firmware versions**: The XML includes firmware entries (pen, Bluetooth, touch, sub-CPU) for devices that support firmware updates. This is data not available anywhere else in a structured form.
- **Sensor IDs and model codes**: Each product entry has a `sensorid` and `model` code, useful for identifying hardware programmatically.

### Automation ideas

- **Periodic sync script**: Fetch `update.xml` on a schedule (CI cron job or GitHub Action), parse it, and auto-generate a PR if new driver versions appear that aren't in `wacom-drivers.json`.
- **Diff tool**: Compare the cached `data/wacom-update.xml` against a fresh fetch to detect when Wacom adds, removes, or changes driver listings.
- **Validate our data**: Use the XML as a source of truth to flag entries in `wacom-drivers.json` that have incorrect URLs, version numbers, or missing OS info.

### Data quality concerns

- **Model numbers may be inaccurate**: The XML appears to use internal codes rather than actual customer-facing model numbers. For example, `PT470BT` is listed for the Wacom Intuos Pro S BT, but this is not a real product model number. Model numbers from the XML should be validated against known Wacom product catalogs before being treated as authoritative.

### UI features this enables

- A "tablet compatibility" filter or lookup: select a tablet model, see only the drivers that support it.
- Show supported OS badges on each driver row (e.g. "Win 10", "Win 11" pills).
- A firmware info section for users who need to update tablet firmware.

## Features to consider

- Link-checking: periodically verify that driver download URLs are still live.
- Bookmark or highlight specific driver versions for quick access.
- Dark mode toggle (the merge tool already uses a dark theme, but the main list does not).
- URL query parameters so filtered views can be shared as links.
