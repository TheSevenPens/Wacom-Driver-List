import productsData from '$lib/data/wacom-products.json';

export function entries() {
  return productsData.map(p => ({ name: encodeURIComponent(p.name) }));
}
