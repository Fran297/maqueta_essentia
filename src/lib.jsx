import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CATALOG, FAMILIES } from "./data.js";
import { requestAI } from "./aiClient.js";
import { useAltivaPoints } from "./useAltivaPoints.js";
export { requestAI };
let aiRequestSequence = 0;
export const nextAIRequestId = () => ++aiRequestSequence;

/* ───────────── Constantes de marca ───────────── */
export const FREE_SHIPPING = 150000;
export const SHIPPING_COST = 7500;
export const TRANSFER_DISCOUNT = 0.05;

export const FAMILY_STYLE = {
  "leather-animalic": { color: "#6b4a2e", glow: "#b07a4a", img: "leather" },
  "oud": { color: "#8a5a3a", glow: "#c07a45", img: "oud" },
  "amber": { color: "#e39a2d", glow: "#ffb23e", img: "amber" },
  "floral": { color: "#d6457a", glow: "#ff6fa5", img: "floral" },
  "oriental-wood": { color: "#8a5a3a", glow: "#d18a52", img: "familia-oriental-amaderado" },
  "citrus": { color: "#c9d63a", glow: "#e8f45a", img: "citrus" },
  "aquatic": { color: "#2bb5c4", glow: "#58e0ee", img: "aquatic" },
  "fruity": { color: "#bc4f58", glow: "#ee7984", img: "familia-frutal" },
  "oriental-spicy": { color: "#d2491f", glow: "#ff7a3d", img: "spicy" },
  "aromatic-fougere": { color: "#4f9b6a", glow: "#7fd69b", img: "chypre" },
  "oriental": { color: "#a66c32", glow: "#e39a2d", img: "familia-oriental" },
  "aromatic-aquatic": { color: "#278fa2", glow: "#58e0ee", img: "familia-aromatico-acuatico" },
  "oriental-vanilla": { color: "#a8652e", glow: "#e0954f", img: "familia-oriental-vainilla" },
  "floral-musk": { color: "#b94b7a", glow: "#ff8bb8", img: "familia-floral-almizclado" },
  "gourmand": { color: "#a8652e", glow: "#e0954f", img: "gourmand" },
};
export const FAMILY_COPY = {
  gourmand: "Vainilla, tonka y canela sobre un fondo de cacao y lavanda. Una dulzura cálida que se siente cercana sobre la piel.",
  oud: "Bergamota, pachulí y maderas sobre un fondo de almizcle y ámbar. Una presencia profunda que permanece en la ropa, para quien busca carácter.",
  floral: "Vainilla, jazmín, nardo y peonía. Flores luminosas con una calidez cremosa que acompaña el día.",
  amber: "Ámbar, canela y azafrán sobre maderas y almizcle. Una calidez envolvente, pensada para las noches largas.",
  "oriental-wood": "Maderas cálidas, ámbar y notas resinosas que construyen un fondo sereno y prolongado. Para quien prefiere la profundidad a la estridencia.",
  citrus: "Menta, cedro, mandarina y limón sobre un fondo de bergamota y ámbar. Una frescura viva para la mañana y el calor.",
  aquatic: "Agua de coco, brisa marina y melón sobre sándalo y almizcle. Una estela limpia que evoca la costa.",
  fruity: "Maracuyá, naranja y frutas tutti-frutti sobre un fondo de vainilla y ámbar. Una energía alegre para los días de color.",
  "oriental-spicy": "Praliné, benjuí y ámbar con canela y nuez moscada. Una presencia intensa para ocasiones que piden carácter.",
  "aromatic-fougere": "Lavanda, salvia y geranio sobre cedro y bergamota. Limpia, clásica y siempre bien recibida.",
  oriental: "Pimienta negra, tabaco y pachulí con café, iris y vainilla. Una estela envolvente para la noche.",
  "aromatic-aquatic": "Sal, notas marinas y limón sobre iris y sándalo. Fresca y moderna para el día a día.",
  "oriental-vanilla": "Canela, cardamomo y praliné con vainilla y frutas confitadas. Una dulzura reconfortante para la calidez cotidiana.",
  "floral-musk": "Naranja de Sicilia, grosella negra y jazmín sambac sobre almizcle y heliotropo. Romántica y serena.",
};
export const familyLabel = (id) => FAMILIES.find((f) => f.id === id)?.label || id;
export const KIND_LABEL = { arabic: "Casas árabes", niche: "Nicho europeo", author: "De autor" };
export const GENDER_LABEL = { unisex: "Unisex", fem: "Femenino", masc: "Masculino" };

export const byId = (id) => CATALOG.find((p) => p.id === id);

/* ───────────── Router por hash ───────────── */
export function parseHash() {
  const raw = (location.hash || "#/").replace(/^#\/?/, "").split("?")[0];
  const [route, ...rest] = raw.split("/");
  return { route: route || "home", param: rest.join("/") || null, qs: (location.hash.split("?")[1] || "") };
}
export function useRoute() {
  const [r, setR] = useState(parseHash);
  useEffect(() => {
    const on = () => {
      const n = parseHash();
      setR((prev) => { if (prev.route !== n.route || prev.param !== n.param) window.scrollTo({ top: 0 }); return prev.route === n.route && prev.param === n.param && prev.qs === n.qs ? prev : n; });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}
export const go = (path) => { location.hash = "#/" + path.replace(/^\//, ""); };

/* ───────────── Estado global (carrito + favoritos) ───────────── */
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const loadTheme = () => { try { return localStorage.getItem("theme") === "light" ? "light" : "dark"; } catch { return "dark"; } };
const loadCart = () => {
  const old = load("altiva.cart", []);
  if (!Array.isArray(old)) return [];
  const quantities = new Map();
  for (const line of old) {
    const product = byId(line?.id);
    const qty = Number(line?.qty);
    if (!product || !Number.isFinite(product.price) || !Number.isInteger(qty) || qty < 1) continue;
    quantities.set(product.id, Math.min(10, (quantities.get(product.id) || 0) + qty));
  }
  return [...quantities].map(([id, qty]) => {
    const product = byId(id);
    return { key: id, id, qty, price: product.price };
  });
};
const loadFavs = () => {
  const old = load("altiva.favs", []);
  return Array.isArray(old) ? [...new Set(old.filter((id) => Boolean(byId(id))))] : [];
};

const createAIWorkspace = () => ({
  studio: { tab: "search", query: "", longevity: "", searchResult: null, compareIds: [], comparePick: "", compareResult: null, anchorId: "", layerResult: null, busy: false, busyAction: "", error: "", requestId: 0 },
  quiz: { step: 0, picks: [], recommendation: null, busy: false, error: "", retry: 0, requestId: 0, consent: false },
});

export function AppProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [favs, setFavs] = useState(loadFavs);
  const [theme, setTheme] = useState(loadTheme);
  const [searchText, setSearchText] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [redemption, setRedemption] = useState(null);
  const [aiWorkspace, setAIWorkspace] = useState(createAIWorkspace);
  const [productReturnTo, setProductReturnTo] = useState("");

  useEffect(() => {
    const clearOriginOutsideProduct = () => {
      if (!location.hash.startsWith("#/product/")) setProductReturnTo("");
    };
    window.addEventListener("hashchange", clearOriginOutsideProduct);
    return () => window.removeEventListener("hashchange", clearOriginOutsideProduct);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  useEffect(() => localStorage.setItem("altiva.cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("altiva.favs", JSON.stringify(favs)), [favs]);

  const notify = useCallback((msg) => {
    setToast({ msg, t: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const loyalty = useAltivaPoints();

  const addToCart = useCallback((p, qty = 1) => {
    if (!p || !Number.isFinite(p.price) || p.price <= 0) {
      notify(`${p?.name || "Este producto"}: consultá el precio y la disponibilidad con la tienda.`);
      return;
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return;
    setCart((c) => {
      const key = p.id;
      const i = c.findIndex((l) => l.key === key);
      if (i >= 0) return c.map((l, j) => (j === i ? { ...l, qty: Math.min(10, l.qty + qty) } : l));
      return [...c, { key, id: p.id, qty, price: p.price }];
    });
    notify(`${p.name} agregado al carrito`);
    setCartOpen(true);
  }, [notify]);
  const setQty = (key, qty) => {
    const next = Number(qty);
    if (!Number.isInteger(next) || next > 10) return;
    setCart((c) => (next <= 0 ? c.filter((l) => l.key !== key) : c.map((l) => (l.key === key ? { ...l, qty: next } : l))));
  };
  const clearCart = () => setCart([]);
  const toggleFav = (id) => {
    setFavs((f) => {
      const on = f.includes(id);
      notify(on ? "Quitado de favoritos" : "Guardado en favoritos");
      return on ? f.filter((x) => x !== id) : [...f, id];
    });
  };
  const openChat = (seed = null) => { setChatSeed(seed ? { text: seed, t: Date.now() } : null); setChatOpen(true); };
  const toggleTheme = useCallback(() => setTheme((current) => current === "dark" ? "light" : "dark"), []);
  const patchAIWorkspace = useCallback((section, patch) => {
    setAIWorkspace((current) => {
      const update = typeof patch === "function" ? patch(current[section]) : patch;
      return update ? { ...current, [section]: { ...current[section], ...update } } : current;
    });
  }, []);
  const resetAIWorkspace = useCallback((section) => {
    setAIWorkspace((current) => ({ ...current, [section]: createAIWorkspace()[section] }));
  }, []);

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);

  const value = useMemo(() => ({
    cart, favs, cartOpen, setCartOpen, chatOpen, setChatOpen, chatSeed, openChat, loyalty, redemption, setRedemption,
    theme, toggleTheme, searchText, setSearchText,
    paletteOpen, setPaletteOpen, toast, notify, addToCart, setQty, clearCart, toggleFav,
    cartCount, subtotal, aiWorkspace, patchAIWorkspace, resetAIWorkspace, productReturnTo, setProductReturnTo,
  }), [cart, favs, cartOpen, chatOpen, chatSeed, paletteOpen, toast, cartCount, subtotal, loyalty, redemption, theme, toggleTheme, searchText, aiWorkspace, patchAIWorkspace, resetAIWorkspace, productReturnTo]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ───────────── Nez: LLM del servidor, catálogo y duración editorial ───────────── */
export async function askNez(history, longevity = "") {
  const result = await requestAI({ action: "chat", messages: history, longevity });
  return { text: result.text, picks: (result.productIds || []).map(byId).filter(Boolean) };
}
