import { CATALOG, FAMILIES, HOUSES } from "../../src/data.js";
import { estimateLongevity } from "../../src/longevity.js";

const familyLabels = Object.fromEntries(FAMILIES.map((family) => [family.id, family.label]));

export const catalog = CATALOG.map((product) => ({
  id: product.id,
  name: product.name,
  productType: product.productType,
  house: HOUSES[product.brand]?.name || product.brand,
  houseDescription: HOUSES[product.brand]?.tagline || "",
  family: familyLabels[product.family] || product.family,
  familyId: product.family,
  gender: product.genderLabel,
  presentation: product.presentation,
  concentration: product.concentration,
  volumeMl: product.volumeMl,
  launchYear: product.launchYear,
  featured: product.featured,
  priceARS: product.price,
  priceLabel: product.priceLabel,
  notes: product.notesRaw,
  noteList: product.notes,
  durationSource: product.durationSource,
  longevityEstimate: estimateLongevity(product),
  description: product.desc,
}));

export const catalogById = new Map(catalog.map((product) => [product.id, product]));
