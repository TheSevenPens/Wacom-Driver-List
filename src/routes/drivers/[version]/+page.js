import driversData from '$lib/data/wacom-drivers.json';

export function entries() {
  const versions = [...new Set(driversData.map(d => d.DriverVersion))];
  return versions.map(version => ({ version: encodeURIComponent(version) }));
}
