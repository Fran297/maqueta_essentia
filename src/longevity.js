const LEVELS = {
  moderate: { id: "moderate", label: "Moderada", hours: "aprox. 3 a 8 horas, según la fuente", short: "3–8 h · variable", context: "Agrupa duraciones moderadas de la planilla; consulta el valor literal de cada ficha." },
  long: { id: "long", label: "Notoria / Larga Duración", hours: "aprox. 5 a 9 horas, según la fuente", short: "5–9 h · variable", context: "Agrupa duraciones altas informadas; la ficha conserva el valor literal." },
  intense: { id: "intense", label: "Intensa / Modo Bestia", hours: "8 a 12+ horas, según la fuente", short: "8–12+ h · variable", context: "Agrupa referencias de duración intensa; no implica que la concentración sea Extrait." },
};

const UNKNOWN = {
  id: "unknown",
  label: "Duración a consultar",
  hours: "No informada",
  short: "Sin dato en la planilla",
  context: "La fuente no informa una duración estimada para esta referencia.",
};

const strongBase = /oud|agar|amber|ámbar|resin|resina|labdan|incens|inciens|cuero|leather|patchouli|pachul|vanill|vainill|tonka|musk|almizcle|benzoin|benju|castor|castóreo|tobacco|tabaco|vetiver/i;
const midBase = /sandal|sándal|cedar|cedro|iris|moss|musgo|cashmeran|ambrox|cacao|coffee|café/i;
const editorialDisclaimer = "Estimación editorial orientativa, no medición ni garantía. Puede variar según piel, clima y aplicación.";

function sourceLevel(value) {
  const folded = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[–—−]/g, "-");
  if (/muy alta|intensa|modo bestia|8\s*(?:a|-|\+)?\s*12|8\s*-\s*10|10\s*-\s*12|8\s*h\s*(?:o|mas)/.test(folded)) return LEVELS.intense;
  if (/alta|notoria|larga|buena|6\s*-\s*8|5\s*-\s*7|6\s*-\s*9|7\s*-\s*9/.test(folded)) return LEVELS.long;
  if (/moderada|media|3\s*-\s*6|4\s*-\s*6/.test(folded)) return LEVELS.moderate;
  return null;
}

export function estimateLongevity(perfume) {
  const sourceKnown = Object.prototype.hasOwnProperty.call(perfume || {}, "durationSource");
  const source = String(perfume?.durationSource || "").trim();

  if (sourceKnown) {
    if (!source || /^consultar$/i.test(source)) {
      return { ...UNKNOWN, disclaimer: "La planilla no informa una duración para esta referencia; se muestra como dato a consultar." };
    }
    const level = sourceLevel(source);
    if (!level) return { ...UNKNOWN, label: "Duración informada", short: source, disclaimer: "Valor transcripto de la planilla; su interpretación es orientativa y no es una garantía." };
    const sourceLabel = source.split("(")[0].trim() || level.label;
    return {
      ...level,
      label: sourceLabel,
      short: source,
      sourceText: source,
      disclaimer: `${editorialDisclaimer} Dato transcripto del catálogo Altiva.`,
    };
  }

  const base = Array.isArray(perfume?.base) ? perfume.base : [];
  const strongCount = base.filter((note) => strongBase.test(note)).length;
  const midCount = base.filter((note) => midBase.test(note)).length;
  let score = ["oud", "amber", "leather", "spicy", "gourmand"].includes(perfume?.family) ? 2 : ["chypre", "floral"].includes(perfume?.family) ? 1 : 0;
  score += strongCount * 1.5 + midCount * 0.5;
  const level = score >= 4 ? LEVELS.intense : score >= 1.5 ? LEVELS.long : LEVELS.moderate;
  return { ...level, disclaimer: editorialDisclaimer };
}

export const LONGEVITY_LEVELS = Object.values(LEVELS);
