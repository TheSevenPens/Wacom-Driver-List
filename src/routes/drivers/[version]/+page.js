import driversData from '$lib/data/drivers.js';

export function entries() {
  const versions = [...new Set(driversData.map(d => d.DriverVersion))];
  return versions.map(version => ({ version: encodeURIComponent(version) }));
}
