import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, Sparkles, ShieldCheck, RotateCcw, Truck, ShoppingBag, SlidersHorizontal, ChevronLeft, ChevronRight, X, MessageCircle, Heart } from "lucide-react";
import { CATALOG, HOUSES, FAMILIES, MAX_PRICE, formatARS, longevityFor } from "./data.js";
import { useApp, FAMILY_STYLE, FAMILY_COPY, GENDER_LABEL, familyLabel, byId, go } from "./lib.jsx";
import { ProductCard, BottleStage, SectionHead, DarkSelect, ShareFragranceButton } from "./components.jsx";
import { LONGEVITY_LEVELS } from "./longevity.js";

/* ═════════════ HOME ═════════════ */
const PLACEHOLDERS = ["Un oud profundo para una noche de invierno…", "Algo floral y delicado para regalar…", "Una fragancia fresca para el día a día…", "Un gourmand cálido, dulce pero elegante…"];

export function HomePage({ focusCollections = false }) {
  const { openChat } = useApp();
  const [q, setQ] = useState("");
  const ph = useMemo(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)], []);
  const rail = useRef(null);
  const scroll = (d) => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (d > 0 && el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (d < 0 && el.scrollLeft <= 4) el.scrollTo({ left: max, behavior: "smooth" });
    else el.scrollBy({ left: d * 520, behavior: "smooth" });
  };
  const featured = CATALOG.filter((p) => p.featured && p.productType === "perfume").slice(0, 8);
  const houses = Object.values(HOUSES).filter((h) => !h.id.startsWith("otros-")).sort((a, b) => b.count - a.count);

  return (
    <div className="page page--home">
      {!focusCollections && <section className="hero">
        <div className="hero__bg" style={{ backgroundImage: "url(/img/hero.webp)" }} />
        <div className="hero__fade hero-bottom-fade" />
        <div className="hero__inner">
          <div className="eyebrow eyebrow--center">Casa de perfumería · Córdoba</div>
          <h1 className="hero__title">TU ESENCIA,<br /><span>TU RELATO</span></h1>
          <p className="hero__sub">{CATALOG.length} referencias importadas de {houses.length} casas perfumeras y una línea de complementos. Contale a Nez qué buscás y deja que el catálogo te encuentre.</p>

          <form className="prompt" onSubmit={(e) => { e.preventDefault(); openChat(q.trim() || null); }}>
            <Sparkles size={18} className="prompt__ico" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph} aria-label="Describí el perfume que imaginás" />
            <button className="btn btn--gold" type="submit">Preguntarle a Nez <ArrowRight size={15} /></button>
          </form>
        </div>
      </section>}

      <section id="olfactive-collections" className={"block block--collections" + (focusCollections ? " block--collections-focus" : "")}>
        <SectionHead title="Colecciones olfativas" eyebrow="Explorá por familia" link="Ver catálogo" to="#/catalog" />
        <div className="carousel-wrap">
          <button className="carousel__nav carousel__nav--l" onClick={() => scroll(-1)} aria-label="Anterior"><ChevronLeft size={18} /></button>
          <div className="carousel" ref={rail}>
            {FAMILIES.map((f) => {
              const style = FAMILY_STYLE[f.id];
              const image = style.img.startsWith("/") ? style.img : `/img/${style.img}.webp`;
              return <a key={f.id} href={`#/catalog?family=${f.id}`} className="fcard" style={{ "--glow": style.glow }}>
                <img src={image} alt="" loading="lazy" />
                <div className="fcard__shade" />
                <div className="fcard__txt"><b>{f.label}</b><small>{f.count} {f.count === 1 ? "referencia" : "referencias"}</small></div>
              </a>;
            })}
          </div>
          <button className="carousel__nav carousel__nav--r" onClick={() => scroll(1)} aria-label="Siguiente"><ChevronRight size={18} /></button>
        </div>
      </section>

      <section className="block">
        <SectionHead title="Lo que respiramos este mes" eyebrow="Selección de temporada" link="Ver todo" to="#/catalog" />
        <div className="grid">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="block">
        <SectionHead title="Casas del catálogo" eyebrow="Explorá por casa" />
        <div className="worlds">
          {houses.slice(0, 3).map((house, i) => {
            const items = CATALOG.filter((p) => p.brand === house.id);
            return <a key={house.id} href={`#/catalog?house=${house.id}`} className="world">
              <div className="world__imgs">
                {items.slice(0, 3).map((p) => <div key={p.id}><BottleStage p={p} /></div>)}
              </div>
              <div className="world__txt">
                <small>0{i + 1}</small>
                <h3>{house.name}</h3>
                <p>{house.tagline || `${items.length} referencias en el catálogo Altiva.`}</p>
                <span>{items.length} referencias <ArrowRight size={14} /></span>
              </div>
            </a>;
          })}
        </div>
      </section>

      <section className="block">
        <div className="cta">
          <div>
            <div className="eyebrow">Quiz olfativo</div>
            <h2>Cinco preguntas. <em>Tu perfume.</em></h2>
            <p>Respondé en menos de un minuto y recibí tres recomendaciones a tu medida.</p>
          </div>
          <a className="btn btn--gold btn--lg" href="#/quiz">Hacer el quiz <ArrowRight size={16} /></a>
        </div>
        <div className="trust">
          <div><Truck size={20} /><b>Envío estimado</b><small>cobertura y costo a confirmar</small></div>
          <div><ShieldCheck size={20} /><b>Pedido transparente</b><small>Pago sujeto a confirmación de la tienda</small></div>
          <div><RotateCcw size={20} /><b>Atención personal</b><small>consultas sobre cambios con la tienda</small></div>
          <div><ShieldCheck size={20} /><b>Datos del catálogo</b><small>precios y disponibilidad a confirmar con la tienda</small></div>
        </div>
      </section>
    </div>
  );
}

const Chip = ({ on, onClick, children }) => <button className={"chip" + (on ? " is-on" : "")} onClick={onClick}>{children}</button>;
const Tier = ({ t, n, items }) => {
  const [open,setOpen]=useState(true);
  return <div className={"tier"+(open?" is-open":"")}><button className="tier__toggle" aria-expanded={open} onClick={()=>setOpen((v)=>!v)}><small>{t}</small><b>{open?"−":"+"}</b><i>{n}</i></button>{open&&<div className="tier__notes">{items.map((x)=><span key={x} className="note">{x}</span>)}</div>}</div>;
};
/* ═════════════ CATÁLOGO ═════════════ */
function useQuery() {
  const raw = location.hash.split("?")[1] || "";
  return Object.fromEntries(new URLSearchParams(raw));
}
const setQuery = (obj) => {
  const base = "#/catalog";
  const qs = new URLSearchParams(Object.entries(obj).filter(([, v]) => v && v !== "all")).toString();
  history.replaceState(null, "", base + (qs ? "?" + qs : ""));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
};
const inquiryUrl = (p) => `https://wa.me/5493516521368?text=${encodeURIComponent(`Hola Altiva Essentia, quisiera consultar precio y disponibilidad de ${p.name} (${HOUSES[p.brand].name}).` )}`;

export function CatalogPage() {
  const q = useQuery();
  const { searchText, setSearchText } = useApp();
  const [sort, setSort] = useState("feat");
  const [max, setMax] = useState(MAX_PRICE);
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  useEffect(() => { setSearchText(q.q || ""); }, [q.q, setSearchText]);
  const family = q.family || "all", house = q.house || "all", gender = q.gender || "all", duration = q.duration || "all";
  const set = (k, v) => setQuery({ ...q, [k]: v });
  useEffect(() => { setVisibleCount(24); }, [family, house, gender, duration, max, searchText, sort]);

  const list = useMemo(() => {
    const n = searchText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let l = CATALOG.filter((p) =>
      (family === "all" || p.family === family) &&
      (house === "all" || p.brand === house) &&
      (gender === "all" || p.gender === gender) &&
      (duration === "all" || longevityFor(p).id === duration) &&
      (max >= MAX_PRICE || (Number.isFinite(p.price) && p.price <= max)) &&
      (!n || [p.name, HOUSES[p.brand].name, familyLabel(p.family), p.presentation, ...p.notes].join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n)));
    if (sort === "feat") l = [...l].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sourceNumber - b.sourceNumber);
    if (sort === "asc") l = [...l].sort((a, b) => a.price == null ? 1 : b.price == null ? -1 : a.price - b.price);
    if (sort === "desc") l = [...l].sort((a, b) => a.price == null ? 1 : b.price == null ? -1 : b.price - a.price);
    if (sort === "name") l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }, [family, house, gender, duration, max, searchText, sort]);

  const reset = () => { setSearchText(""); setMax(MAX_PRICE); setSort("feat"); setQuery({}); };
  const active = [family, house, gender, duration].filter((x) => x !== "all").length + (max < MAX_PRICE ? 1 : 0) + (searchText ? 1 : 0) + (sort !== "feat" ? 1 : 0);


  return (
    <div className="page">
      <header className="phead">
        <div className="eyebrow">Biblioteca olfativa</div>
        <h1>Catálogo</h1>
        <p>{CATALOG.length} referencias de {Object.keys(HOUSES).length} casas y líneas, importadas de la planilla Altiva. Filtrá por familia, casa, género, presupuesto y duración informada; confirmá disponibilidad y precios con la tienda.</p>
      </header>

      <div className="toolbar">
        <button className="btn btn--ghost toolbar__filters" aria-label="Abrir filtros" title="Filtros" aria-expanded={open} aria-controls="catalog-filters" onClick={() => setOpen(!open)}><SlidersHorizontal size={15} /><span>Filtros{active ? ` (${active})` : ""}</span></button>
        <a className="btn btn--ghost toolbar__ai" href="#/ai" aria-label="Buscar con IA" title="Buscar con IA"><Sparkles size={15} /><span>Buscar con IA</span></a>
      </div>

      <div id="catalog-filters" className={"filters" + (open ? " is-open" : "")}>
        <div className="filters__controls">
          <DarkSelect label="Ordenar" value={sort} onChange={setSort} options={[{value:"feat",label:"Destacados"},{value:"asc",label:"Precio: menor a mayor"},{value:"desc",label:"Precio: mayor a menor"},{value:"name",label:"Nombre A–Z"}]} />
          <DarkSelect label="Casa" value={house} onChange={(value)=>set("house",value)} options={[{value:"all",label:"Todas las casas"},...Object.values(HOUSES).map((h)=>({value:h.id,label:`${h.name} · ${h.count}`}))]} />
          <DarkSelect label="Duración informada" value={duration} onChange={(value)=>set("duration",value)} options={[{value:"all",label:"Cualquier duración"},...LONGEVITY_LEVELS.map((x)=>({value:x.id,label:`${x.label} · ${x.short}`}))]} />
          <label className="range">Presupuesto · hasta <b>{formatARS(max)}</b><input type="range" min="0" max={MAX_PRICE} step="5000" value={max} onChange={(e) => setMax(+e.target.value)} /></label>
        </div>
        <div className="chips" role="group" aria-label="Familia">
          <Chip on={family === "all"} onClick={() => set("family", "all")}>Todas las familias</Chip>
          {FAMILIES.map((f) => <Chip key={f.id} on={family === f.id} onClick={() => set("family", f.id)}><i style={{ background: FAMILY_STYLE[f.id].glow }} />{f.label}</Chip>)}
        </div>
        <div className="filters__row">
          <div className="chips" role="group" aria-label="Género">
            {[["all", "Todos"], ...Object.entries(GENDER_LABEL)].map(([k, l]) => <Chip key={k} on={gender === k} onClick={() => set("gender", k)}>{l}</Chip>)}
          </div>
        </div>
      </div>

      <div className="results">
        <span>{list.length} resultado{list.length !== 1 && "s"}</span>
        {active > 0 && <button onClick={reset}><X size={13} /> Limpiar filtros</button>}
      </div>

      {list.length ? (
        <>
          <div className="grid">{list.slice(0, visibleCount).map((p) => <ProductCard key={p.id} p={p} />)}</div>
          {list.length > visibleCount && <div className="catalog-more"><button className="btn btn--ghost" onClick={() => setVisibleCount((count) => Math.min(count + 24, list.length))}>Mostrar 24 más <span>({list.length - visibleCount} restantes)</span></button></div>}
        </>
      ) : (
        <div className="empty"><Search size={34} strokeWidth={1.2} /><h3>No encontramos referencias con esos filtros</h3><p>Probá ampliar el presupuesto o limpiar los filtros.</p><button className="btn btn--gold" onClick={reset}>Limpiar filtros</button></div>
      )}
    </div>
  );
}

/* ═════════════ PRODUCTO ═════════════ */
export function ProductPage({ id }) {
  const p = byId(id);
  const { addToCart, toggleFav, favs, openChat, productReturnTo } = useApp();
  if (!p) return <div className="page"><div className="empty"><h3>No encontramos esa fragancia</h3><a className="btn btn--gold" href="#/catalog">Volver al catálogo</a></div></div>;
  const returnLabel = productReturnTo === "quiz" ? "Volver a tu perfil olfativo" : productReturnTo === "ai" ? "Volver al Laboratorio" : "Volver al catálogo";
  const returnRoute = productReturnTo || "catalog";
  const house = HOUSES[p.brand];
  const isPerfume = p.productType === "perfume";
  const typeLabel = p.productType === "desodorante" ? "Desodorante" : p.productType === "set" ? "Set de miniaturas" : "Perfume";
  const duration=longevityFor(p);
  const fav = favs.includes(p.id);
  const related = [...CATALOG.filter((x) => x.family === p.family && x.id !== p.id), ...CATALOG.filter((x) => x.brand === house.id && x.id !== p.id)]
    .filter((x, index, all) => all.findIndex((item) => item.id === x.id) === index).slice(0, 4);
  return (
    <div className="page">
      <nav className="crumbs"><a href="#/catalog">Catálogo</a><span>/</span><a href={`#/catalog?family=${p.family}`}>{familyLabel(p.family)}</a><span>/</span><b>{p.name}</b></nav>
      <a className="pd__ai-return" href={`#/${returnRoute}`}>{returnLabel} <ArrowRight size={14} /></a>
      <div className="pd">
        <div className="pd__media"><BottleStage p={p} tall video /></div>
        <div className="pd__info">
          <div className="eyebrow">{house.name} · {typeLabel} · {p.launchYear ? `Lanzamiento ${p.launchYear}` : "Año no informado"}</div>
          <h1>{p.name}</h1>
          <p className="pd__desc">{p.desc}</p>

          <p className="pd__family-copy">{FAMILY_COPY[p.family]}</p>
          <div className="pd__tags"><span>{familyLabel(p.family)}</span><span>{GENDER_LABEL[p.gender]}</span><span>{p.presentation || "Presentación no informada"}</span><span>{duration.label}</span></div>
          <p className="longevity-disclaimer">{duration.disclaimer}</p>

          <div className="pd__buy">
            <div className="sizes" aria-label="Presentación indicada en la planilla">
              <div className="size-card is-on"><b>{p.presentation || "Presentación a consultar"}</b><small>{p.volumeMl ? `${p.volumeMl} ml` : "Volumen no informado"}</small></div>
            </div>
            <div className="pd__price">{formatARS(p.price)}<small>{p.price != null ? `Precio informado para ${p.presentation || "esta presentación"}; confirmar stock con la tienda` : "Precio no informado en la planilla; solicitar cotización"}</small></div>
            <div className="pd__cta">
              {p.price != null ? <button className="btn btn--gold btn--lg" onClick={() => addToCart(p)}><ShoppingBag size={17} /> Agregar al carrito</button> : <a className="btn btn--gold btn--lg" href={inquiryUrl(p)} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Consultar disponibilidad</a>}
              <button className={"btn btn--ghost btn--square" + (fav ? " is-fav" : "")} onClick={() => toggleFav(p.id)} aria-label="Favorito" aria-pressed={fav}><Heart size={18} fill={fav ? "currentColor" : "none"} /></button>
              <ShareFragranceButton p={p} className="btn btn--ghost pd__share" />
            </div>
          </div>

          {p.perfil && (
            <div className="perfil">
              <h3>Perfil olfativo</h3>
              <dl className="perfil__grid">
                {[["Familia (planilla)", p.familiaPerfil], ["Estilo", p.perfil.estilo], ["Personalidad", p.perfil.personalidad], ["Ocasión", p.perfil.ocasion], ["Momento del día", p.perfil.momentoDelDia], ["Clima", p.perfil.clima], ["Intensidad", p.perfil.intensidad], ["Proyección", p.perfil.proyeccion], ["Estela", p.perfil.estela], ["Perfumista / colaboración", p.perfil.perfumista]]
                  .filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </div>
          )}
          <div className="pyramid">
            <h3>{isPerfume ? "Notas olfativas" : "Información del producto"}</h3>
            {p.notasPiramide ? (
              <>
                <p className="muted small">Notas separadas por etapa, tal como figuran en la planilla.</p>
                <Tier t="Notas de salida" n={p.notasPiramide.salida.length} items={p.notasPiramide.salida.length ? p.notasPiramide.salida : ["Sin dato"]} />
                <Tier t="Notas de corazón" n={p.notasPiramide.corazon.length} items={p.notasPiramide.corazon.length ? p.notasPiramide.corazon : ["Sin dato"]} />
                <Tier t="Notas de fondo" n={p.notasPiramide.fondo.length} items={p.notasPiramide.fondo.length ? p.notasPiramide.fondo : ["Sin dato"]} />
              </>
            ) : (
              <>
                <p className="muted small">{isPerfume ? "La planilla presenta estas notas como lista general; no las separa en salida, corazón y fondo." : "Se muestra la descripción del producto tal como figura en la planilla, sin tratarlo como una fragancia."}</p>
                <Tier t="Notas de la ficha" n={p.notes.length} items={p.notes.length ? p.notes : ["La planilla no informa notas para esta referencia."]} />
              </>
            )}
          </div>

          <blockquote className="quote"><small>Datos del catálogo Altiva</small>{p.launchYear ? `Lanzamiento ${p.launchYear}` : "Año de lanzamiento no informado"} · {p.concentration || "Concentración no informada"}{p.nombreOficial && p.nombreOficial !== p.name ? <> · Nombre oficial: {p.nombreOficial}</> : null}</blockquote>

          <div className="pd__perks">
            <span><ShieldCheck size={15} /> Pedido no pagado hasta confirmación</span><span><RotateCcw size={15} /> Consultas de cambios con la tienda</span><span><Truck size={15} /> Envío según condiciones del pedido</span>
          </div>
          <button className="ask" onClick={() => openChat(`Contame más sobre ${p.name}`)}>
            <span className="ask__av">S</span><span><b>{isPerfume ? "¿Dudas sobre este perfume?" : "¿Dudas sobre este producto?"}</b><small>Consultá a Nez con los datos de esta ficha.</small></span><ArrowRight size={16} />
          </button>
        </div>
      </div>

      <section className="block">
        <SectionHead title="Te puede gustar" />
        <div className="grid">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
      </section>
    </div>
  );
}

export { go };
