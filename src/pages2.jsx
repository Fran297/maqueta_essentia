import { useEffect, useState } from "react";
import { ArrowRight, Check, CreditCard, Landmark, Truck, MapPin, Clock, Mail, Phone, ShieldCheck, Sparkles, FlaskConical, RotateCcw, Heart, Download, MessageCircle, QrCode, AlertCircle, Gift } from "lucide-react";
import { CATALOG, HOUSES, formatARS } from "./data.js";
import { useApp, FREE_SHIPPING, SHIPPING_COST, TRANSFER_DISCOUNT, FAMILY_STYLE, byId, go, requestAI, nextAIRequestId } from "./lib.jsx";
import { Bottle, ProductCard, DarkSelect } from "./components.jsx";
import { QRCodeSVG } from "qrcode.react";
import { ARTICLE } from "./article.js";

const F = ({ name, label, type = "text", req = true, span }) => (
  <label className={"field" + (span ? " field--" + span : "")}><span>{label}</span><input name={name} type={type} required={req} /></label>
);
/* ═════════════ CHECKOUT ═════════════ */
export function CheckoutPage() {
  const { cart, subtotal, clearCart, notify, loyalty, redemption, setRedemption } = useApp();
  const [method, setMethod] = useState("card");
  const [step, setStep] = useState("form");
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const ship = subtotal >= FREE_SHIPPING || subtotal === 0 ? 0 : SHIPPING_COST;
  const discount = method === "transfer" ? Math.round(subtotal * TRANSFER_DISCOUNT) : 0;
  const pointsDiscount = redemption?.discountARS || 0;
  const total = subtotal + ship - discount - pointsDiscount;

  const submit = async (e) => {
    e.preventDefault();
    if (paying) return;
    const fd = new FormData(e.target);
    setPaying(true); setError("");
    try {
      const buyer = { email: fd.get("email"), firstName: fd.get("firstName"), lastName: fd.get("lastName"), phone: fd.get("phone"), address: fd.get("address"), city: fd.get("city"), province: fd.get("province"), zip: fd.get("zip") };
      let token = loyalty.token;
      if (!token) token = (await loyalty.refresh()).token;
      const r = await fetch("/api/checkout/confirm", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({items:cart.map((l)=>({id:l.id,qty:l.qty})),buyer,paymentMethod:method,redemptionId:redemption?.redemptionId||null}), signal:AbortSignal.timeout(30000) });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "No se pudo registrar el pedido.");
      setOrder(data); setStep("done"); clearCart(); setRedemption(null); loyalty.refresh().catch(()=>{});
    } catch (err) { setError(err.message || "No se pudo registrar el pedido. Reintentá."); }
    finally { setPaying(false); }
  };

  const downloadTicket = async () => {
    try {
      const r = await fetch(`/api/tickets/download/${encodeURIComponent(order.ticketId)}`, { headers:{Authorization:`Bearer ${loyalty.token}`} });
      if (!r.ok) throw new Error("No se pudo descargar el resumen.");
      const objectUrl=URL.createObjectURL(await r.blob()),a=document.createElement("a");a.href=objectUrl;a.download=`Ticket-${order.ticketId}.pdf`;a.click();URL.revokeObjectURL(objectUrl);
    } catch (e) { notify(e.message); }
  };

  if (step === "done") return (
    <div className="page page--narrow center">
      <div className="done"><Check size={30} /></div>
      <div className="eyebrow">Pedido registrado · #{order.ticketId}</div>
      <h1 className="big">Gracias.<br /><em>Recibimos tu pedido.</em></h1>
      <p className="lead">El pago está pendiente de confirmación; esta constancia no es una factura ni acredita una venta pagada. {order.emailSent ? "Enviamos el resumen al email indicado." : order.emailQueued ? "Estamos enviando el resumen al email indicado; si no llega en unos minutos, descargalo aquí." : "El correo no pudo enviarse; descargá el resumen aquí."}</p>
      <div className="row center"><button className="btn btn--gold" onClick={downloadTicket}><Download size={16}/> Descargar resumen PDF</button><a className="btn btn--ghost" href={`https://wa.me/5493516521368?text=${encodeURIComponent(`Hola Altiva Essentia, consulto por el pedido ${order.ticketId}.`)}`} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Consultar por WhatsApp</a></div>
      <div className="row center"><button className="btn btn--ghost" onClick={() => go("")}>Volver al inicio</button><button className="btn btn--ghost" onClick={() => go("catalog")}>Seguir explorando</button></div>
    </div>
  );
  if (!cart.length) return (
    <div className="page page--narrow center"><div className="empty"><h3>Tu carrito está vacío</h3><a className="btn btn--gold" href="#/catalog">Explorar el catálogo</a></div></div>
  );

  return (
    <div className="page">
      <header className="phead"><div className="eyebrow">Finalizar pedido · pago pendiente de confirmación</div><h1>Checkout</h1><p>Registramos el pedido y enviamos un resumen. El pago aún no se procesa ni se confirma en este sitio; precios y disponibilidad del catálogo deben verificarse con la tienda.</p></header>
      <form className="checkout" onSubmit={submit}>
        <div className="checkout__main">
          <section className="panel"><h3><span>1</span> Tus datos</h3>
            <div className="fields"><F name="firstName" label="Nombre" /><F name="lastName" label="Apellido" /><F name="email" label="Email" type="email" span="2" /><F name="phone" label="Teléfono" type="tel" span="2" /></div></section>
          <section className="panel"><h3><span>2</span> Envío</h3>
            <div className="fields"><F name="address" label="Dirección" span="2" /><F name="city" label="Ciudad" /><F name="province" label="Provincia" /><F name="zip" label="Código postal" /></div></section>
          <section className="panel"><h3><span>3</span> Pago</h3>
            <div className="paymeth">
              <button type="button" className={method === "card" ? "is-on" : ""} onClick={() => setMethod("card")}><CreditCard size={20} /><b>Tarjeta</b><small>Instrucciones de pago pendientes de confirmación</small></button>
              <button type="button" className={method === "transfer" ? "is-on" : ""} onClick={() => setMethod("transfer")}><Landmark size={20} /><b>Transferencia</b><small>5% estimativo · confirmar con la tienda</small></button>
            </div>
            <p className="muted small"><ShieldCheck size={13} /> No ingreses datos de tarjeta aquí. El sitio aún no tiene una pasarela de pago activa.</p></section>
        </div>
        <aside className="summary">
          <h3>Resumen</h3>
          <ul>{cart.map((l) => { const p = byId(l.id); return (
            <li key={l.key}><div className="line__img"><Bottle p={p} /></div><div><b>{p.name}</b><small>{HOUSES[p.brand].name} · {p.presentation || "Presentación no informada"} · x{l.qty}</small></div><span>{formatARS(l.price * l.qty)}</span></li>); })}</ul>
          <div className="sum"><span>Subtotal</span><span>{formatARS(subtotal)}</span></div>
          <div className="sum"><span>Envío (estimado)</span><span>{ship ? formatARS(ship) : "Gratis*"}</span></div>
          {discount > 0 && <div className="sum sum--ok"><span>Descuento transferencia (estimado)</span><span>− {formatARS(discount)}</span></div>}
          {pointsDiscount > 0 && <div className="sum sum--ok"><span>Pase Altiva ({redemption.points} pts)</span><span>− {formatARS(pointsDiscount)}</span></div>}
          <div className="sum sum--total"><span>Total</span><b>{formatARS(total)}</b></div>
          {error&&<p className="checkout-error" role="alert">{error}</p>}
          <button className="btn btn--gold btn--block btn--lg" disabled={paying}>{paying ? "Registrando…" : "Registrar pedido · pago pendiente"} <ArrowRight size={16} /></button>
        </aside>
      </form>
    </div>
  );
}

/* ═════════════ QUIZ ═════════════ */
const QUIZ = [
  { q: "¿Qué momento del día te define?", opts: [
    { l: "Amanecer · liviano y fresco", fams: ["citrus", "floral", "aquatic", "fruity"] }, { l: "Mediodía · luminoso y vivo", fams: ["citrus", "aromatic-fougere", "floral"] },
    { l: "Atardecer · cálido y especiado", fams: ["amber", "oriental-spicy", "gourmand"] }, { l: "Noche · profunda y misteriosa", fams: ["oud", "oriental-wood", "amber"] } ] },
  { q: "Elegí una textura que te atraiga.", opts: [
    { l: "Seda al sol", fams: ["floral", "citrus", "floral-musk"] }, { l: "Cuero envejecido", fams: ["oriental-wood", "oud"] },
    { l: "Terciopelo nocturno", fams: ["amber", "gourmand", "oriental-vanilla"] }, { l: "Piedra mojada", fams: ["aromatic-fougere", "aquatic", "aromatic-aquatic"] } ] },
  { q: "¿Cuán intenso querés que sea tu rastro?", opts: [
    { l: "Sutil · solo lo perciben quienes se acercan", fams: ["aquatic", "floral", "citrus", "fruity"] }, { l: "Equilibrado · presente sin invadir", fams: ["aromatic-fougere", "gourmand", "floral-musk"] },
    { l: "Fuerte · llena el ambiente", fams: ["amber", "oriental-spicy", "oriental"] }, { l: "Memorable · te recuerdan al día siguiente", fams: ["oud", "oriental-wood", "amber"] } ] },
  { q: "Cuarta: ¿de qué te enamora un olor?", opts: [
    { l: "Su historia, su origen", fams: ["oud", "amber", "oriental"] }, { l: "Que me recuerde a alguien", fams: ["floral", "gourmand", "fruity"] },
    { l: "Su composición como obra", fams: ["aromatic-fougere", "oriental-wood", "floral-musk"] }, { l: "Que sea raro, único", fams: ["oud", "oriental-spicy", "oriental"] } ] },
  { q: "¿Qué duración esperás en piel para tu fragancia ideal?", opts: [
    { l: "Moderada · aprox. 3–8 h según la ficha · uso diario/oficina", fams: ["citrus", "aquatic", "floral"] },
    { l: "Notoria / Larga Duración · aprox. 5–9 h según la ficha", fams: ["aromatic-fougere", "floral", "oriental-spicy"] },
    { l: "Intensa / Modo Bestia · 8–12+ h según la ficha", fams: ["oud", "amber", "oriental-wood", "gourmand"] },
  ] },
];

export function QuizPage() {
  const { loyalty, notify, aiWorkspace, patchAIWorkspace, resetAIWorkspace } = useApp();
  const quiz = aiWorkspace.quiz;
  const { step, picks, recommendation, busy: aiBusy, error: aiError, retry, consent } = quiz;
  const done = step >= QUIZ.length;
  useEffect(() => {
    if (!done || !consent || recommendation || aiBusy || aiError) return undefined;
    const requestId = nextAIRequestId();
    patchAIWorkspace("quiz", { busy: true, error: "", requestId });
    requestAI({ action: "quiz", answers: picks.map((p) => p.l) })
      .then((result) => patchAIWorkspace("quiz", (current) => current.requestId === requestId ? { recommendation: result, busy: false, error: "" } : null))
      .catch((error) => patchAIWorkspace("quiz", (current) => current.requestId === requestId ? { busy: false, error: error.message || "No se pudo generar el perfil. Reintentá." } : null));
    return undefined;
  }, [done, consent, picks, retry, recommendation, aiBusy, aiError, patchAIWorkspace]);
  useEffect(() => {
    if (!done || !consent) return;
    loyalty.award("quiz").then((result)=>{if(result.awarded)notify("Quiz completado · +150 puntos en tu Pase Altiva");}).catch(()=>{});
  }, [done]);
  // Rehacer el quiz conserva el consentimiento ya otorgado en esta sesión (la casilla no vuelve a marcarse sola).
  const reset = () => { resetAIWorkspace("quiz"); patchAIWorkspace("quiz", { consent }); };
  const recommended = (recommendation?.productIds || []).map(byId).filter(Boolean);
  return (
    <div className="page page--narrow">
      <header className="phead center"><div className="eyebrow"><FlaskConical size={13} /> Quiz olfativo</div><h1 className="big">Cinco preguntas. <em>Tu perfume.</em></h1></header>
      {!done ? (
        <div className="quiz glass-cristal-luxury" key={step}>
          <div className="quiz__top"><span>Pregunta {step + 1} de {QUIZ.length}</span>{step > 0 && <button onClick={() => patchAIWorkspace("quiz", { step: step - 1, picks: picks.slice(0, -1), recommendation: null, error: "" })}>← Anterior</button>}</div>
          <div className="quiz__bar"><span style={{ width: (step / QUIZ.length) * 100 + "%" }} /></div>
          {(step === 0 || !consent) && <div className="consent-box">
            <label className="consent" htmlFor="quiz-consent"><input id="quiz-consent" type="checkbox" checked={consent} aria-required="true" aria-describedby="quiz-consent-hint" onChange={(e) => patchAIWorkspace("quiz", { consent: e.target.checked })} /><span>Acepto las Políticas de Privacidad y el envío de novedades por WhatsApp/Email.</span></label>
            {!consent && <small className="consent__hint" id="quiz-consent-hint">Marcá la casilla para comenzar el quiz.</small>}
          </div>}
          <h2>{QUIZ[step].q}</h2>
          <div className="quiz__opts">{QUIZ[step].opts.map((o, i) => (
            <button key={o.l} disabled={!consent} onClick={() => patchAIWorkspace("quiz", { picks: [...picks, o], step: step + 1, recommendation: null, busy: false, error: "" })}><i>{String.fromCharCode(65 + i)}</i><span>{o.l}</span><ArrowRight size={16} /></button>))}</div>
        </div>
      ) : (
        <div className="quiz-res">
          <p className="lead center">{aiBusy ? "Nez está leyendo tus respuestas y el catálogo…" : recommendation?.profile || aiError || "Tu perfil olfativo está listo."}</p>
          {aiBusy && <div className="ai-loading" aria-live="polite"><i /> Cruzando tus respuestas con las notas del catálogo…</div>}
          {aiError && <div className="ai-error" role="alert">{aiError}<button onClick={() => patchAIWorkspace("quiz", { error: "", retry: retry + 1 })}>Reintentar</button></div>}
          {recommendation?.text && <p className="ai-quiz-copy">{recommendation.text}</p>}
          {!aiBusy && recommended.length > 0 && <div className="grid grid--3">{recommended.map((p) => <ProductCard key={p.id} p={p} returnTo="quiz" />)}</div>}
          {!aiBusy && recommendation && !recommended.length && <div className="ai-no-match">No encontramos una coincidencia clara con esas respuestas. Podés explorar todo el catálogo o repetir el quiz.</div>}
          <div className="row center"><button className="btn btn--ghost" onClick={reset}><RotateCcw size={15} /> Rehacer el quiz</button><a className="btn btn--gold" href="#/catalog">Ver todo el catálogo</a></div>
        </div>
      )}
    </div>
  );
}

/* ═════════════ DIARIO ═════════════ */
const BLOG = [
  { date: "Mayo 2025", title: "Oud: el oro líquido del Sudeste asiático", excerpt: "Una guía honesta para entender por qué un perfume con oud auténtico puede costar lo que cuesta — y cómo distinguirlo del sintético.", fam: "oud" },
  { date: "Abril 2025", title: "Cinco perfumes para empezar en el nicho", excerpt: "Si recién entrás al mundo de la perfumería de autor, estos son los frascos por donde conviene comenzar.", fam: "amber" },
  { slug: "piramide-olfativa", date: "Abril 2025", title: "El método de la pirámide olfativa", excerpt: "Salida, corazón y fondo: cómo leer la arquitectura de un perfume como quien lee un poema.", fam: "aromatic-fougere" },
  { date: "Marzo 2025", title: "Rosa de Taif vs rosa búlgara", excerpt: "Dos rosas, dos geografías, dos personalidades. Una clase corta para entrenar la nariz.", fam: "floral" },
  { date: "Marzo 2025", title: "Cómo se conserva un perfume de nicho", excerpt: "Temperatura, luz, posición del frasco: pequeños cuidados para que tus perfumes vivan diez años o más.", fam: "aquatic" },
  { date: "Febrero 2025", title: "Diccionario olfativo: 20 palabras esenciales", excerpt: "Sillage, longevidad, accord, dry-down. Un glosario en español para hablar de perfumes con propiedad.", fam: "aromatic-aquatic" },
];
export function BlogPage() {
  return (
    <div className="page">
      <header className="phead"><div className="eyebrow">Diario olfativo</div><h1 className="big">Notas <em>al margen</em>.</h1></header>
      <div className="blog">
        {BLOG.map((b, i) => {
          const img = b.slug ? ARTICLE.cover : `/img/${FAMILY_STYLE[b.fam].img}.webp`;
          const body = (
            <>
              <div className="post__img"><img src={img} alt="" loading="lazy" /></div>
              <div className="post__body"><small>{b.date} · Lectura 5 min</small><h3>{b.title}</h3><p>{b.excerpt}</p></div>
            </>
          );
          return (
            <article key={b.title} className={"post" + (i === 0 ? " post--feat" : "")}>
              {b.slug ? <a href={`#/blog/${b.slug}`} className="post__link">{body}</a> : body}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* Figuras del artículo (versiones simplificadas de las gráficas originales) */
function PyramidFigure() {
  const layers = [
    { t: "Notas de fondo", s: "2–3 h en adelante · la más lenta", w: 92 },
    { t: "Notas de corazón", s: "20 min a 4 h · el cuerpo", w: 72 },
    { t: "Notas de salida", s: "5 a 30 min · la primera impresión", w: 52 },
  ];
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center", padding: "12px 0" }}>
      {layers.map((l) => (
        <div key={l.t} style={{ width: `${l.w}%`, padding: "12px 16px", borderRadius: 14, background: "rgba(212,175,55,.12)", border: "1px solid rgba(212,175,55,.35)", textAlign: "center" }}>
          <strong>{l.t}</strong><div style={{ fontSize: 13, opacity: 0.75 }}>{l.s}</div>
        </div>
      ))}
    </div>
  );
}
function TestFigure() {
  const steps = ["Minuto 15: anotá la salida", "Hora 1: el corazón", "Hora 3: el fondo", "Día siguiente: la estela"];
  return (
    <ol style={{ display: "grid", gap: 6, paddingLeft: 18 }}>
      {steps.map((s) => <li key={s}>{s}</li>)}
    </ol>
  );
}
const FIGURES = { pyramid: PyramidFigure, test: TestFigure };

/* ═════════════ ARTÍCULO DEL DIARIO ═════════════ */
export function ArticlePage({ slug }) {
  if (slug !== ARTICLE.slug) {
    return (
      <div className="page page--narrow center">
        <div className="empty"><h3>No encontramos esa publicación</h3><button className="btn btn--gold" onClick={() => go("blog")}>Volver al Diario</button></div>
      </div>
    );
  }
  const minutes = Math.max(1, Math.ceil(ARTICLE.blocks.reduce((n, b) => n + (b.p ? b.p.split(/\s+/).length : b.h2 ? 3 : 0) + (b.ul ? b.ul.join(" ").split(/\s+/).length : 0), 0) / 200));
  return (
    <article className="page page--narrow blog-post">
      <button className="bp-back" onClick={() => go("blog")}>← Diario olfativo</button>
      <div className="eyebrow">Técnica de perfumería</div>
      <h1 className="bp-title">{ARTICLE.title}</h1>
      <p className="bp-meta">Actualizado {new Date(ARTICLE.updated + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })} · Lectura {minutes} min</p>
      <div className="bp-hero"><img src={ARTICLE.cover} alt="Pirámide de cristal con notas de salida, corazón y fondo" /></div>
      <p className="bp-excerpt">{ARTICLE.excerpt}</p>
      {ARTICLE.blocks.map((r, l) => {
        if (r.h2) return <h2 className="bp-h2" key={l}>{r.h2}</h2>;
        if (r.p) return <p className="bp-p" key={l}>{r.p}</p>;
        if (r.ul) return <ul className="bp-ul" key={l}>{r.ul.map((i) => <li key={i}>{i}</li>)}</ul>;
        if (r.table) return (
          <div className="bp-table-wrap" key={l}>
            <table className="bp-table">
              <thead><tr>{r.table.head.map((h) => <th scope="col" key={h}>{h}</th>)}</tr></thead>
              <tbody>{r.table.rows.map((row) => <tr key={row[0]}>{row.map((c, d) => d === 0 ? <th scope="row" key={d}>{c}</th> : <td key={d}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
        if (r.fig) {
          const Fig = FIGURES[r.fig];
          return Fig ? (
            <figure className="bp-fig" key={l}><Fig />{r.caption && <figcaption>{r.caption}</figcaption>}</figure>
          ) : (r.caption ? <p className="bp-legend" key={l}>{r.caption}</p> : null);
        }
        return null;
      })}
      <div className="bp-sources">
        <h4>Fuentes</h4>
        <ul>{ARTICLE.sources.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{t}</a></li>)}</ul>
      </div>
      <div className="row bp-cta">
        <button className="btn btn--gold" onClick={() => go("quiz")}>Hacer el quiz olfativo</button>
        <button className="btn btn--ghost" onClick={() => go("catalog")}>Ver el catálogo</button>
      </div>
    </article>
  );
}

/* ═════════════ MANIFIESTO ═════════════ */
export function AboutPage() {
  const vals = [
    ["Colección de Autor", "No vendemos lo que se vende: acercamos lo extraordinario. Cada fragancia se presenta con sus notas y procedencia disponibles."],
    ["Origen de la información", "Cada ficha identifica la casa y los datos disponibles en la planilla. La autenticidad, origen comercial y disponibilidad deben confirmarse con la tienda."],
    ["Asesoramiento honesto", "Si lo que querés es algo más simple y barato, te lo decimos. La confianza vale más que la venta."],
    ["Confidencialidad", "Tus datos, tus gustos y tus compras no son producto. Nunca compartimos información con terceros."],
  ];
  return (
    <div className="page">
      <section className="about">
        <div>
          <div className="eyebrow">Manifiesto · Elixir Imperialis</div>
          <h1 className="big">Una casa de perfumería <em>contemporánea</em>.</h1>
          <p className="lead">Altiva Essentia nace de una búsqueda: traducir historias, notas y preferencias en una exploración personal de la perfumería de nicho. Este catálogo incorpora las referencias de la planilla de la tienda; precios, autenticidad y disponibilidad deben confirmarse con el equipo antes de la compra.</p>
        </div>
        <img className="about__seal" src="/img/logo.webp" alt="Altiva Essentia" />
      </section>
      <div className="values">{vals.map(([t, d], i) => <div key={t}><small>0{i + 1}</small><h3>{t}</h3><p>{d}</p></div>)}</div>
    </div>
  );
}

/* ═════════════ AYUDA, INCIDENCIAS Y SANTUARIO OLFATIVO ═════════════ */
export function ContactPage() {
  const { loyalty, notify, cart, setCartOpen } = useApp();
  const [surveySent,setSurveySent]=useState(false),[incidentTicket,setIncidentTicket]=useState(""),[incidentSummary,setIncidentSummary]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const untilNext=500-(loyalty.balance%500),progress=loyalty.balance?((loyalty.balance%500||500)/500)*100:0;
  const wa="https://wa.me/5493516521368?text="+encodeURIComponent("Hola Altiva Essentia, quisiera recibir asesoramiento personalizado.");
  const sendSurvey=async(e)=>{
    e.preventDefault();setBusy(true);setError("");const fd=new FormData(e.currentTarget);
    try{const result=await loyalty.submitSurvey({aesthetics:fd.get("aesthetics"),experiences:fd.get("experiences"),suggestions:fd.get("suggestions"),consent:fd.get("consent")==="on"});setSurveySent(true);notify(result.awarded?"Encuesta enviada · +200 puntos olfativos":"Encuesta ya registrada en tu Pase Altiva");}
    catch(err){setError(err.message||"No se pudo enviar la encuesta.");}finally{setBusy(false);}
  };
  const sendIncident=async(e)=>{
    e.preventDefault();setBusy(true);setError("");const fd=new FormData(e.currentTarget);
    try{const summary={name:fd.get("name"),email:fd.get("email"),phone:fd.get("phone"),topic:fd.get("topic"),details:fd.get("details")};const result=await loyalty.createIncident(summary);setIncidentSummary(`${summary.topic}: ${summary.details}`);setIncidentTicket(result.ticketId);}
    catch(err){setError(err.message||"No se pudo crear la incidencia.");}finally{setBusy(false);}
  };
  const openWhatsApp=()=>{const message=`Hola Altiva Essentia, necesito ayuda con esta incidencia. Ticket: #${incidentTicket}. ${incidentSummary}`;window.open(`https://wa.me/5493516521368?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer");};
  return <div className="page help-page">
    <header className="phead"><div className="eyebrow">Atención Altiva · Córdoba, Argentina</div><h1 className="big">Una casa para <em>acompañarte.</em></h1><p>Consultas, cuidado de tus fragancias y seguimiento de incidencias. Atención y tienda online: <b>24 hs</b>.</p></header>
    <section className="cofre-block" aria-labelledby="cofre-title">
      <div className="cofre-top"><div><div className="eyebrow"><Gift size={14}/> Programa de puntos · sin contraseña</div><h2 id="cofre-title">Tu Pase Altiva</h2><p>Tu saldo vive en este navegador, asociado a un identificador anónimo. Si borrás los datos locales, no se puede recuperar ni transferir.</p></div><div className="cofre-balance"><small>SALDO DISPONIBLE</small><b>{loyalty.ready?loyalty.balance:"…"}<i> pts</i></b><span>{loyalty.balance>=500?"Canje disponible":`Te faltan ${untilNext} pts para el próximo canje de $ 5.000`}</span></div></div>
      <div className="cofre-progress"><div><span>Progreso hacia el próximo canje</span><b>{progress}%</b></div><i><span style={{width:`${progress}%`}}/></i></div>
      <div className="cofre-rules"><div><b>+150</b><span>Quiz olfativo</span><small>1 por día</small></div><div><b>+200</b><span>Compartir fragancia</span><small>primer compartir por Pase</small></div><div><b>+200</b><span>Encuesta Santuario</span><small>1 por Pase</small></div><div><b>+100</b><span>Reseña postcompra</span><small>solo ticket marcado como pagado</small></div></div>
      <div className="cofre-bottom"><p><b>Canje monetario:</b> 500 puntos = ARS 5.000, con OTP de 4 dígitos por email y sujeto al total del pedido. Decants de Edición Reservada y Discovery Kits (3 muestras de 2 ml) son recompensas VIP sujetas a disponibilidad; la tienda aún debe definir su costo en puntos.</p>{cart.length?<button className="btn btn--gold" onClick={()=>setCartOpen(true)}>Canjear en el carrito <ArrowRight size={15}/></button>:<a className="btn btn--gold" href="#/catalog">Explorar fragancias <ArrowRight size={15}/></a>}</div>
      <p className="cofre-policy"><b>Vigencia de los puntos:</b> los puntos del programa Pase Altiva vencen tras 12 meses de inactividad.</p>
      <div className="cofre-vip"><span>Recompensas VIP · sujetas a puntos y stock</span><a href={`https://wa.me/5493516521368?text=${encodeURIComponent("Hola Altiva Essentia, quisiera consultar por Decants de Edición Reservada y su valor en puntos.")}`} target="_blank" rel="noreferrer">Consultar Decants <ArrowRight size={13}/></a><a href={`https://wa.me/5493516521368?text=${encodeURIComponent("Hola Altiva Essentia, quisiera consultar por Discovery Kits de 3 muestras de 2 ml y su valor en puntos.")}`} target="_blank" rel="noreferrer">Consultar Discovery Kit <ArrowRight size={13}/></a></div>
    </section>
    <section className="help-grid">
      <article className="panel help-card"><span className="help-icon"><Truck size={18}/></span><h2>Envíos y devoluciones</h2><p>El estado, plazo y condiciones aplicables se comunicarán para cada pedido antes de confirmar cualquier gestión. Para consultar una devolución, escribinos con tu número de ticket.</p><a href={wa} target="_blank" rel="noreferrer">Consultar por WhatsApp <ArrowRight size={14}/></a></article>
      <article className="panel help-card"><span className="help-icon"><ShieldCheck size={18}/></span><h2>Conservación y garantía</h2><p><b>Consejo de cuidado, no contractual:</b> guardá el frasco bien cerrado, en un lugar fresco y seco, lejos de luz solar directa y fuentes de calor. Esta recomendación general no es una leyenda oficial ni una garantía olfativa.</p><p>La política oficial de conservación y garantía debe ser confirmada por la tienda. Las variaciones de aroma o duración pueden depender de la piel y el entorno.</p><a href={wa} target="_blank" rel="noreferrer">Pedir información oficial <ArrowRight size={14}/></a></article>
      <article className="panel help-card qr-card"><div><span className="help-icon"><QrCode size={18}/></span><h2>Asesoramiento directo</h2><p>Escaneá el QR para abrir WhatsApp con un mensaje listo para enviar. También podés escribirnos al <b>+54 9 351 652-1368</b>.</p><a className="btn btn--ghost" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={15}/> Abrir WhatsApp</a></div><div className="qr-frame"><QRCodeSVG value={wa} size={150} level="H" includeMargin bgColor="#ffffff" fgColor="#101014" imageSettings={{src:"/img/logo.webp",height:30,width:30,excavate:true}}/></div></article>
      <article className="panel help-card sanctuary"><span className="help-icon"><Sparkles size={18}/></span><div className="eyebrow">Próximamente en Córdoba, Argentina</div><h2>Santuario Olfativo</h2><p>Un espacio de calma, puertas adentro, donde cada nota encuentra su tiempo. Estamos preparando un encuentro cercano para explorar nuestras casas y descubrir fragancias sin apuro.</p><div className="sanctuary__hours"><Clock size={15}/> Atención y tienda online · 24 hs</div></article>
    </section>

    <section className="block support-grid">
      <div className="support-intro"><div className="eyebrow"><AlertCircle size={14}/> Soporte</div><h2>¿Algo no salió como esperabas?</h2><p>Completá la planilla. Guardaremos un ticket en tu Pase Altiva y podrás compartir el resumen con nuestro WhatsApp. Usaremos los datos ingresados para responder esta consulta.</p>
        {incidentTicket&&<div className="incident-ticket" role="status"><Check size={16}/><span>Ticket creado <b>#{incidentTicket}</b></span><button className="btn btn--gold" onClick={openWhatsApp}><MessageCircle size={15}/> Abrir WhatsApp con el resumen</button></div>}
      </div>
      <form className="panel support-form" onSubmit={sendIncident}><h3>Planilla de solicitud de incidencias</h3><div className="fields">
        <label className="field"><span>Nombre</span><input name="name" required maxLength={120}/></label><label className="field"><span>Email</span><input name="email" type="email" required maxLength={254}/></label>
        <label className="field"><span>WhatsApp / teléfono</span><input name="phone" type="tel" required maxLength={40}/></label>
        <label className="field"><span>Motivo</span><input name="topic" required maxLength={80} placeholder="Pedido, envío, producto…"/></label>
        <label className="field field--2"><span>Detalle</span><textarea name="details" rows="4" required maxLength={1800}/></label>
      </div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn--gold btn--block" disabled={busy}>{busy?"Guardando…":"Crear ticket de incidencia"}<ArrowRight size={15}/></button></form>
    </section>

    <section className="block survey-block"><div><div className="eyebrow"><Gift size={14}/> Pase Altiva · +200 puntos</div><h2>Co-creemos el Santuario</h2><p>Tu mirada ayuda a diseñar el espacio. Una encuesta por Pase Altiva; el premio se acredita desde el servidor.</p></div>
      {surveySent?<div className="panel survey-success"><Check size={20}/><b>Gracias por co-crear con Altiva.</b><span>Se registró tu respuesta y se actualizó el Pase Altiva.</span></div>:<form className="panel survey-form" onSubmit={sendSurvey}>
        {["aesthetics","experiences","suggestions"].map((key,i)=><label className="field" key={key}><span>{["Estética","Experiencias","Sugerencias"][i]}</span><textarea name={key} rows={2} maxLength={key==="suggestions"?1600:1200} required placeholder={["¿Qué atmósfera y materiales imaginás?","¿Qué te gustaría vivir en el Santuario?","¿Qué otra idea querés compartir?"][i]}/></label>)}
        <div className="consent-box"><label className="consent" htmlFor="survey-consent"><input id="survey-consent" name="consent" type="checkbox" required/><span>Acepto las Políticas de Privacidad y el envío de novedades por WhatsApp/Email.</span></label></div>
        {error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn--gold btn--block" disabled={busy}>{busy?"Enviando…":"Enviar encuesta · +200 puntos"}<ArrowRight size={15}/></button>
      </form>}
    </section>
  </div>;
}

/* ═════════════ FAVORITOS ═════════════ */
export function AccountPage() {
  const { favs, loyalty, notify } = useApp();
  const [ticket,setTicket]=useState(""),[rating,setRating]=useState("5"),[reviewText,setReviewText]=useState(""),[reviewError,setReviewError]=useState(""),[reviewSent,setReviewSent]=useState(false),[reviewBusy,setReviewBusy]=useState(false);
  const items = favs.map(byId).filter(Boolean);
  const submitReview=async(e)=>{e.preventDefault();setReviewBusy(true);setReviewError("");try{const result=await loyalty.submitReview(ticket.trim(),Number(rating),reviewText.trim());setReviewSent(true);notify(result.awarded?"Reseña verificada · +100 puntos":"Reseña enviada");}catch(err){setReviewError(err.message||"No se pudo verificar esta compra.");}finally{setReviewBusy(false);}};
  return (
    <div className="page">
      <header className="phead"><div className="eyebrow">Mi espacio · cuenta anónima</div><h1>Mis favoritos</h1><p>Tu Pase Altiva no requiere contraseña y permanece asociado a este navegador.</p></header>
      <section className="review-panel panel"><div><div className="eyebrow"><Heart size={13}/> Reseña postcompra · +100 puntos</div><h2>Compartí tu experiencia</h2><p>Solo se acredita por un pedido que el servidor haya verificado como pagado. Un ticket pendiente no califica.</p></div>
        {reviewSent?<div className="survey-success"><Check size={18}/><b>Reseña recibida y validada.</b></div>:<form className="review-form" onSubmit={submitReview}><label className="field"><span>Número de ticket</span><input value={ticket} onChange={(e)=>setTicket(e.target.value)} placeholder="ALT-…" required maxLength={24}/></label><DarkSelect label="Valoración" value={rating} onChange={setRating} options={[{value:"5",label:"5 · Excelente"},{value:"4",label:"4 · Muy buena"},{value:"3",label:"3 · Buena"},{value:"2",label:"2 · Regular"},{value:"1",label:"1 · Insatisfactoria"}]}/><label className="field field--2"><span>Reseña</span><textarea value={reviewText} onChange={(e)=>setReviewText(e.target.value)} rows={3} maxLength={1200} required/></label>{reviewError&&<p className="form-error" role="alert">{reviewError}</p>}<button className="btn btn--gold" disabled={reviewBusy}>{reviewBusy?"Validando…":"Enviar reseña"}<ArrowRight size={15}/></button></form>}
      </section>
      {items.length ? <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        : <div className="empty"><Heart size={34} strokeWidth={1.2} /><h3>Aún no guardaste fragancias</h3><p>Tocá el corazón en cualquier perfume para guardarlo acá.</p><a className="btn btn--gold" href="#/catalog">Explorar el catálogo</a></div>}
    </div>
  );
}
