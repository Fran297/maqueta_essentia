import source from "../data/catalog.json" with { type: "json" };
import { estimateLongevity } from "./longevity.js";

export const CATALOG_SOURCE = source;
export const CATALOG_STATS = source.stats;

// Casas que todavía no se trabajan: se ocultan del sitio hasta que se empiecen a cargar.
// Para volver a mostrarlas, sacar la casa de esta lista.
const HIDDEN_HOUSES = new Set(["rave", "khadlaj", "ahmed-al-maghribi", "swiss-arabian", "asdaaf"]);
// Referencias que todavía no se trabajan: se ocultan por id hasta que se empiecen a cargar.
const HIDDEN_PRODUCTS = new Set(["ae-153", "ae-154", "ae-155", "ae-252", "ae-253", "ae-254", "ae-173", "ae-174", "ae-175", "ae-178", "ae-257", "ae-258", "ae-227", "ae-228", "ae-229", "ae-230"]);
const VISIBLE_ROWS = source.products.filter((row) => !HIDDEN_HOUSES.has(row.brand) && !HIDDEN_PRODUCTS.has(row.id));
const countBy = (key) => VISIBLE_ROWS.reduce((acc, row) => { acc[row[key]] = (acc[row[key]] || 0) + 1; return acc; }, {});
const FAMILY_COUNTS = countBy("family");
const HOUSE_COUNTS = countBy("brand");
// Familia "Cuero / Animálico": igual que en la vista original, se calcula desde las notas
// (primeras 6 notas con cuero, animal, castóreo o piel) y se agrega al final del carrusel.
const LEATHER_RE = /cuero|animal|castor|piel/i;
const leatherIds = new Set(
  VISIBLE_ROWS
    .filter((row) => (row.notes || []).slice(0, 6).some((n) => LEATHER_RE.test(n)))
    .map((row) => row.id),
);
export const FAMILIES = [
  ...source.families
    .filter((f) => f.id !== "leather-animalic")
    .map((f) => ({ ...f, count: FAMILY_COUNTS[f.id] || 0 }))
    .filter((f) => f.count > 0),
  ...(leatherIds.size ? [{ id: "leather-animalic", label: "Cuero / Animálico", count: leatherIds.size }] : []),
];

export const HOUSES = Object.fromEntries(source.houses.filter((house) => !HIDDEN_HOUSES.has(house.id)).map((house) => [house.id, {
  id: house.id,
  name: house.name,
  origin: "",
  tagline: house.tagline,
  count: HOUSE_COUNTS[house.id] || 0,
  kind: "",
}]));

const productType = (row) => row.concentration === "DEO" ? "desodorante" : row.concentration === "SET" ? "set" : "perfume";

export const CATALOG = VISIBLE_ROWS.map((row) => ({
  ...row,
  brand: row.brand,
  family: row.family,
  gender: row.gender,
  productType: productType(row),
  price: row.priceARS,
  year: row.launchYear,
  desc: row.perfil?.descripcion
    ? row.perfil.descripcion
    : row.notesRaw
      ? `${productType(row) === "perfume" ? "Notas olfativas transcritas" : "Información complementaria"}: ${row.notesRaw}.`
      : productType(row) === "perfume"
        ? "La planilla no informa notas olfativas para esta fragancia."
        : "La planilla no incluye más información descriptiva para esta referencia.",
  inspiration: "",
  top: [],
  heart: [],
  base: [],
}));

const knownPrices = CATALOG.map((product) => product.price).filter(Number.isFinite);
export const MAX_PRICE = Math.ceil(Math.max(...knownPrices) / 10000) * 10000;

export const formatARS = (value) => {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return "Consultar";
  return "$ " + Math.round(Number(value)).toLocaleString("es-AR");
};

export const longevityFor = (product) => estimateLongevity(product);
