import { ArrowRight, Check, LayoutGrid, Loader2, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { CATALOG, HOUSES, formatARS } from "./data.js";
import { nextAIRequestId, requestAI, useApp } from "./lib.jsx";
import { ProductCard, DarkSelect } from "./components.jsx";
import { LONGEVITY_LEVELS } from "./longevity.js";

const TABS = [
  { id: "search", label: "Buscar", icon: Search },
  { id: "compare", label: "Comparar", icon: LayoutGrid },
  { id: "layer", label: "Layering", icon: Sparkles },
];
const byId = (id) => CATALOG.find((p) => p.id === id);

function ProductResults({ result, returnTo = "ai", showProducts = true, showNoMatch = true }) {
  if (!result) return null;
  const items = (result.productIds || []).map(byId).filter(Boolean);
  return (
    <section className="ai-result" aria-live="polite">
      <div className="ai-result__head"><span className="ai-orb"><Sparkles size={17} /></span><div><small>RESPUESTA DE NEZ · IA</small><h3>Tu selección, con criterio</h3></div></div>
      <p>{result.text}</p>
      {result.profile && <div className="ai-profile"><b>Tu perfil olfativo</b><span>{result.profile}</span></div>}
      {showProducts && items.length > 0 ? <div className="grid ai-results-grid">{items.map((p) => <ProductCard key={p.id} p={p} returnTo={returnTo} />)}</div> : items.length === 0 && showNoMatch ? <div className="ai-no-match">No hay una coincidencia clara o faltan datos informados para recomendar con seguridad. Probá con otras notas, familia, temporada, ocasión o presupuesto.</div> : null}
    </section>
  );
}

function ProductPicker({ value, onChange, label = "Elegí una fragancia", disabled = false }) {
  return <DarkSelect value={value} onChange={onChange} label={label} className="ai-picker" disabled={disabled} options={[{value:"",label:"Seleccionar del catálogo…"},...CATALOG.filter((p)=>p.productType==="perfume").map((p)=>({value:p.id,label:`${p.name} · ${HOUSES[p.brand].name} · ${formatARS(p.price)}`}))]} />;
}

export function AILabPage() {
  const { aiWorkspace, patchAIWorkspace, resetAIWorkspace, setProductReturnTo } = useApp();
  const studio = aiWorkspace.studio;
  const { tab, query, longevity, searchResult, compareIds, comparePick, compareResult, anchorId, layerResult, busy, busyAction, error } = studio;
  const update = (patch) => patchAIWorkspace("studio", patch);

  async function run(action, input) {
    const requestId = nextAIRequestId();
    update({ busy: true, busyAction: action, error: "", requestId });
    try {
      const data = await requestAI({ action, ...input });
      const key = action === "search" ? "searchResult" : action === "compare" ? "compareResult" : "layerResult";
      patchAIWorkspace("studio", (current) => current.requestId === requestId ? { [key]: data, busy: false, busyAction: "", error: "" } : null);
    } catch (err) {
      patchAIWorkspace("studio", (current) => current.requestId === requestId ? { busy: false, busyAction: "", error: err.message || "Nez no pudo responder ahora. Reintentá en unos segundos." } : null);
    }
  }

  const addCompare = () => {
    if (comparePick && !compareIds.includes(comparePick) && compareIds.length < 3) {
      update({ compareIds: [...compareIds, comparePick], comparePick: "", compareResult: null, error: "" });
    }
  };
  const selected = compareIds.map(byId).filter(Boolean);
  const clearStudy = () => resetAIWorkspace("studio");

  return (
    <div className="page page--narrow ai-page">
      <header className="phead">
        <div className="eyebrow"><Sparkles size={14} /> Laboratorio olfativo con IA</div>
        <h1>Encontrá tu <em>próxima esencia.</em></h1>
        <p>Explorá el catálogo con Nez: comprende lo que describís y explica cada recomendación usando los datos disponibles de Altiva.</p>
      </header>
      <div className="ai-privacy"><span className="ai-orb"><LayoutGrid size={16} /></span><span><b>Catálogo Altiva vinculado al Laboratorio</b><small>La búsqueda, comparaciones y respuestas se conservan al recorrer fichas durante esta sesión. Las afinidades de estación y ocasión son editoriales; evitá compartir datos personales.</small></span><button className="ai-clear" type="button" onClick={clearStudy}><RotateCcw size={13} /> Limpiar estudio</button><i aria-hidden="true" /></div>
      <div className="ai-tabs" role="tablist" aria-label="Herramientas olfativas">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => update({ tab: id, error: "" })}><Icon size={16} />{label}</button>)}
        <a href="#/quiz" className="ai-tab-link"><Sparkles size={16} />Quiz olfativo<ArrowRight size={14} /></a>
      </div>
      {busy && <div className="ai-loading" role="status"><i />Nez está {busyAction === "search" ? "buscando coincidencias" : busyAction === "compare" ? "comparando las fragancias" : "explorando combinaciones"}. Podés seguir navegando; el resultado se conservará.</div>}

      {tab === "search" && <section className="ai-tool">
        <div className="ai-tool__title"><span className="ai-kicker">01 · BÚSQUEDA SEMÁNTICA</span><h2>Contanos qué estás buscando</h2><p>Mezclá ocasión, sensación, notas, familia, temporada y presupuesto en una sola consulta.</p></div>
        <form className="ai-query" onSubmit={(e) => { e.preventDefault(); run("search", { query, longevity }); }}>
          <Search size={19} /><input value={query} maxLength={700} disabled={busy} onChange={(e) => update({ query: e.target.value, searchResult: null, error: "" })} placeholder="Ej.: floral elegante para una cena de invierno, hasta $160.000" aria-label="Consulta semántica" />
          <button className="btn btn--gold" disabled={!query.trim() || busy}>{busy && busyAction === "search" ? <Loader2 className="ai-spin" size={16} /> : <Sparkles size={16} />}Encontrar</button>
        </form>
        <div className="ai-duration"><DarkSelect label="Duración deseada · estimación orientativa" value={longevity} disabled={busy} onChange={(value) => update({ longevity: value, searchResult: null, error: "" })} options={[{value:"",label:"Sin preferencia"},...LONGEVITY_LEVELS.map((x)=>({value:x.id,label:`${x.label} · ${x.hours}`}))]} /><small>Las bandas son editoriales, no mediciones ni garantías; pueden variar según piel y clima.</small></div>
        <div className="ai-prompts">{["Un cítrico fresco para la oficina", "Rosa y almizcle para regalar", "Un oud nocturno hasta $200.000", "Algo liviano para verano", "Maderas cálidas para invierno"].map((prompt) => <button key={prompt} type="button" disabled={busy} onClick={() => { update({ query: prompt, searchResult: null, error: "" }); run("search", { query: prompt, longevity }); }}>{prompt}</button>)}</div>
        {error && <div className="ai-error" role="alert">{error}<button onClick={() => run("search", { query, longevity })}>Reintentar</button></div>}
        <ProductResults result={searchResult} returnTo="ai" />
      </section>}

      {tab === "compare" && <section className="ai-tool">
        <div className="ai-tool__title"><span className="ai-kicker">02 · COMPARADOR</span><h2>Dos perfumes, dos historias</h2><p>Elegí dos o tres fragancias. Nez compara notas, carácter y estilo; las ocasiones de uso son afinidades editoriales derivadas de la familia y las notas, no datos certificados del fabricante.</p></div>
        <div className="ai-compare-pick"><ProductPicker value={comparePick} disabled={busy} onChange={(value) => update({ comparePick: value, error: "" })} label="Agregar perfume" /><button className="btn btn--ghost" onClick={addCompare} disabled={!comparePick || compareIds.length >= 3 || busy}><Plus size={16} /> Agregar</button></div>
        <div className="ai-selected">{selected.map((p) => <span key={p.id}><b>{p.name}</b><small>{HOUSES[p.brand].name}</small><button aria-label={`Quitar ${p.name}`} disabled={busy} onClick={() => update({ compareIds: compareIds.filter((id) => id !== p.id), compareResult: null, error: "" })}><X size={14} /></button></span>)}</div>
        <button className="btn btn--gold" disabled={selected.length < 2 || busy} onClick={() => run("compare", { productIds: compareIds })}>{busy && busyAction === "compare" ? <Loader2 className="ai-spin" size={16} /> : <LayoutGrid size={16} />}Comparar con IA</button>
        {error && <div className="ai-error" role="alert">{error}<button onClick={() => run("compare", { productIds: compareIds })}>Reintentar</button></div>}
        {compareResult && <><ProductResults result={compareResult} showProducts={false} showNoMatch={false} /><div className="ai-compare-grid">{selected.map((p) => <a key={p.id} href={`#/product/${p.id}`} onClick={() => setProductReturnTo("ai")}><b>{p.name}</b><small>{HOUSES[p.brand].name} · {formatARS(p.price)}</small><span>Ver ficha <ArrowRight size={13} /></span></a>)}</div></>}
      </section>}

      {tab === "layer" && <section className="ai-tool">
        <div className="ai-tool__title"><span className="ai-kicker">03 · LAYERING CREATIVO</span><h2>Una fragancia como punto de partida</h2><p>Elegí una esencia y Nez propondrá combinaciones reales del catálogo; el efecto esperado es una hipótesis creativa, no una promesa sobre cómo se comportarán en tu piel.</p></div>
        <div className="ai-layer-form"><ProductPicker value={anchorId} disabled={busy} onChange={(value) => update({ anchorId: value, layerResult: null, error: "" })} label="Tu fragancia ancla" /><button className="btn btn--gold" disabled={!anchorId || busy} onClick={() => run("layering", { productId: anchorId, longevity })}>{busy && busyAction === "layering" ? <Loader2 className="ai-spin" size={16} /> : <Sparkles size={16} />}Sugerir combinaciones</button></div>
        {error && <div className="ai-error" role="alert">{error}<button onClick={() => run("layering", { productId: anchorId, longevity })}>Reintentar</button></div>}
        {layerResult && <><ProductResults result={layerResult} returnTo="ai" />{anchorId && <a className="ai-anchor" href={`#/product/${anchorId}`} onClick={() => setProductReturnTo("ai")}><Check size={16} /><span>Tu punto de partida: <b>{byId(anchorId)?.name}</b></span><ArrowRight size={15} /></a>}</>}
      </section>}
      <p className="ai-disclaimer">Las recomendaciones se limitan a productos y datos informados del catálogo. Carácter, temporada, ocasión y layering son lecturas editoriales; la perfumería es subjetiva y no se garantiza el comportamiento en piel.</p>
    </div>
  );
}
