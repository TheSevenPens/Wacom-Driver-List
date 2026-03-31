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
- Document the utility scripts (`merge_drivers.js`, `Download.ps1`).

## TypeScript

- Consider migrating the Svelte components to TypeScript for better type safety.

## Error handling

- Improve error messages in JsonMerger — currently shows a generic "Error parsing JSON" with details only in the console.
- Add user-facing feedback when file uploads fail or contain unexpected data.

## Mobile and responsive design

- Test and improve the layout on smaller screens — the table-heavy UI may not work well on phones.
- Consider a card-based layout as an alternative view for narrow viewports.

## Features to consider

- Link-checking: periodically verify that driver download URLs are still live.
- Bookmark or highlight specific driver versions for quick access.
- Dark mode toggle (the merge tool already uses a dark theme, but the main list does not).
- URL query parameters so filtered views can be shared as links.
