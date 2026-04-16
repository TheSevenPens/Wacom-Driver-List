# Updating Driver Data

Driver data is managed in the [DrawTabData](https://github.com/TheSevenPens/DrawTabData) repository (mounted at `data-repo/`). Scripts and full documentation for adding new drivers live there:

- **Guide**: `data-repo/docs/UPDATING-DRIVERS.md`
- **Check for updates**: `data-repo/scripts/Check-WacomDriverUpdates.ps1`
- **Add a new driver**: `data-repo/scripts/Add-WacomDriver.ps1`

## After Updating Data

Once new driver entries have been committed and pushed in the data-repo, bump the submodule in this project:

```powershell
cd data-repo
git pull
cd ..
git add data-repo
git commit -m "Bump data submodule"
git push
```

GitHub Actions will automatically build and deploy the updated site.

## Verifying Locally

```bash
npm run dev
```

Confirm the new driver appears in the driver list and that its detail page loads.
