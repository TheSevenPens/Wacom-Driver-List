/**
 * Normalize a version string so that both "6.3.46-1" and "6.3.46.1"
 * produce the same comparable form: an array of numeric/string segments.
 */
export function parseVersion(v) {
  // Replace last separator (dash or dot before final segment) to normalize
  // "6.3.46-1" and "6.3.46.1" into the same parts
  return v.replace(/-/g, '.').split('.').map(s => {
    const n = parseInt(s, 10);
    return isNaN(n) ? s : n;
  });
}

/**
 * Compare two version strings. Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const sa = i < pa.length ? pa[i] : 0;
    const sb = i < pb.length ? pb[i] : 0;
    // If both numeric, compare numerically
    if (typeof sa === 'number' && typeof sb === 'number') {
      if (sa !== sb) return sa - sb;
    } else {
      // Fall back to string comparison
      const cmp = String(sa).localeCompare(String(sb), undefined, { numeric: true });
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

/**
 * Check if a version falls within a product's [drivermin, drivermax] range.
 */
export function isVersionInRange(version, drivermin, drivermax) {
  if (!drivermin) return false;
  if (compareVersions(version, drivermin) < 0) return false;
  if (drivermax && compareVersions(version, drivermax) > 0) return false;
  return true;
}
