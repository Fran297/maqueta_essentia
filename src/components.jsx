import { useEffect, useMemo, useRef, useState } from "react";
import {
  Home, LayoutGrid, Sparkles, MessageCircle, BookOpen, Crown, Mail, Heart, ShoppingBag, Search,
  X, Plus, Minus, ArrowRight, Send, Truck, ShieldCheck, Command as CmdIcon, Trash2, FlaskConical, Share2, Gift, ChevronDown, Sun, Moon, MoreHorizontal, Layers,
} from "lucide-react";
import { CATALOG, HOUSES, formatARS, longevityFor } from "./data.js";
import { useApp, go, FAMILY_STYLE, FREE_SHIPPING, askNez, familyLabel } from "./lib.jsx";
import { LONGEVITY_LEVELS } from "./longevity.js";

/* ───────────── Frasco SVG (3 siluetas) ───────────── */
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function Bottle({ p, className = "" }) {
  const st = FAMILY_STYLE[p.family] || FAMILY_STYLE.amber;
  const v = hash(p.id) % 3;
  const id = "b" + p.id.replace(/\W/g, "");
  const family = familyLabel(p.family).toLocaleUpperCase("es-AR");
  return (
    <svg className={"bottle " + className} viewBox="0 0 120 220" aria-hidden="true">
      <defs>
        <linearGradient id={id + "l"} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={st.glow} stopOpacity=".95" />
          <stop offset=".55" stopColor={st.color} />
          <stop offset="1" stopColor="#0b0907" />
        </linearGradient>
        <linearGradient id={id + "g"} x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a2c" /><stop offset=".35" stopColor="#f6dd9c" />
          <stop offset=".6" stopColor="#c9a15a" /><stop offset="1" stopColor="#6e5120" />
        </linearGradient>
        <linearGradient id={id + "s"} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset=".25" stopColor="#fff" stopOpacity=".02" />
          <stop offset="1" stopColor="#fff" stopOpacity=".0" />
        </linearGradient>
      </defs>
      {v === 0 && (<>
        <rect x="46" y="8" width="28" height="30" rx="4" fill={`url(#${id}g)`} />
        <rect x="52" y="38" width="16" height="12" fill="#2a2418" />
        <rect x="16" y="50" width="88" height="152" rx="14" fill={`url(#${id}l)`} stroke="rgba(255,255,255,.28)" />
        <rect x="30" y="98" width="60" height="52" rx="3" fill="rgba(8,6,4,.62)" stroke="rgba(246,221,156,.6)" strokeWidth=".8" />
      </>)}
      {v === 1 && (<>
        <circle cx="60" cy="24" r="17" fill={`url(#${id}g)`} />
        <rect x="53" y="38" width="14" height="18" fill="#2a2418" />
        <path d="M30 56h60l8 14v122a14 14 0 0 1-14 14H36a14 14 0 0 1-14-14V70z" fill={`url(#${id}l)`} stroke="rgba(255,255,255,.28)" />
        <rect x="32" y="104" width="56" height="48" rx="3" fill="rgba(8,6,4,.62)" stroke="rgba(246,221,156,.6)" strokeWidth=".8" />
      </>)}
      {v === 2 && (<>
        <path d="M44 34l8-22h16l8 22z" fill={`url(#${id}g)`} />
        <rect x="48" y="34" width="24" height="14" fill="#2a2418" />
        <path d="M34 48h52l20 156H14z" fill={`url(#${id}l)`} stroke="rgba(255,255,255,.28)" />
        <rect x="34" y="112" width="52" height="46" rx="3" fill="rgba(8,6,4,.62)" stroke="rgba(246,221,156,.6)" strokeWidth=".8" />
      </>)}
      <path d="M22 60h22v140H22z" fill={`url(#${id}s)`} />
      <text x="60" y={v === 0 ? 122 : v === 1 ? 126 : 132} textAnchor="middle" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="9" letterSpacing="2" fill="#f6dd9c">ALTIVA</text>
      <text x="60" y={v === 0 ? 137 : v === 1 ? 141 : 147} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={family.length > 13 ? "3.8" : "5.5"} letterSpacing="1.1" fill="rgba(246,221,156,.7)">{family.slice(0, 18)}</text>
    </svg>
  );
}

/* Video del perfume: la foto queda debajo y el video aparece con fundido cuando tiene el primer cuadro */
function StageVideo({ p }) {
  const [ready, setReady] = useState(false);
  const videoRef = useRef(null);
  const poster = p.videoPath.replace(/\.mp4$/, "-poster.webp");
  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 2) setReady(true);
  }, []);
  return (
    <>
      <img className="stage__photo stage__poster" src={poster} alt="" draggable="false" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <video ref={videoRef} className={"stage__photo stage__video" + (ready ? " is-ready" : "")} onLoadedData={() => setReady(true)} autoPlay muted loop playsInline preload="auto" aria-label={p.name}>
        <source src={p.videoPath.replace(/\.mp4$/, ".webm")} type="video/webm" />
        <source src={p.videoPath} type="video/mp4" />
      </video>
    </>
  );
}

/* Escenario: foto de la familia + frasco con halo */
export function BottleStage({ p, tall = false, video = false }) {
  const st = FAMILY_STYLE[p.family] || FAMILY_STYLE.amber;
  const shift = (hash(p.id) % 5) * 12;
  return (
    <div className={"stage" + (tall ? " stage--tall" : "")} style={{ "--glow": st.glow }}>
      <div className="stage__bg" style={{ backgroundImage: `url(/img/${st.img}.webp)`, backgroundPosition: `${20 + shift}% 50%` }} />
      <div className="stage__halo" />
      {video && p.videoPath
        ? <StageVideo key={p.id} p={p} />
        : p.imagePath
          ? <>
              <img className="stage__photo" src={p.imagePath} alt="" loading="lazy" draggable="false" />
            </>
          : <Bottle p={p} />}
    </div>
  );
}

/* ───────────── Tarjeta de producto ───────────── */
async function shareFragrance(p, award, notify) {
  const url = `${location.href.split("#")[0]}#/product/${p.id}`;
  const message = `¡Mira esta fragancia en Altiva Essentia! ${url}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: `${p.name} | Altiva Essentia`, text: "¡Mira esta fragancia en Altiva Essentia!", url });
      const result=await award("share"); notify(result.awarded?"Fragancia compartida · +200 puntos en tu Cofre":"Fragancia compartida; el premio ya fue acreditado"); return;
    }
    const opened = window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    if (opened) { opened.opener=null; const result=await award("share"); notify(result.awarded?"WhatsApp abierto · +200 puntos en tu Cofre":"WhatsApp abierto; el premio de compartir ya fue acreditado"); return; }
    await navigator.clipboard.writeText(message); notify("Mensaje copiado para WhatsApp. Los puntos se acreditan cuando compartís.");
  } catch (error) {
    if (error?.name === "AbortError") return;
    try { await navigator.clipboard.writeText(message); notify("Enlace copiado"); } catch { notify("No se pudo compartir desde este navegador"); }
  }
}

export function ProductCard({ p, returnTo = "" }) {
  const { favs, toggleFav, addToCart, loyalty, notify, setProductReturnTo } = useApp();
  const openProduct = () => { if (returnTo) setProductReturnTo(returnTo); };
  const house = HOUSES[p.brand];
  const duration = longevityFor(p);
  const badgeLabel = p.productType === "perfume" ? familyLabel(p.family).split(" ")[0] : p.productType === "set" ? "Set" : "Desodorante";
  const fav = favs.includes(p.id);
  const inquiryUrl = `https://wa.me/5493516521368?text=${encodeURIComponent(`Hola Altiva Essentia, quisiera consultar precio y disponibilidad de ${p.name} (${house.name}).`)}`;
  return (
    <article className="pcard">
      <a className="pcard__link" href={`#/product/${p.id}`} aria-label={p.name} onClick={openProduct}>
        <BottleStage p={p} />
      </a>
      <button className={"pcard__fav" + (fav ? " is-on" : "")} onClick={() => toggleFav(p.id)} aria-label="Favorito" aria-pressed={fav}>
        <Heart size={16} fill={fav ? "currentColor" : "none"} />
      </button>
      <button className="pcard__share" onClick={() => shareFragrance(p, loyalty.award, notify)} aria-label={`Compartir ${p.name}`}><Share2 size={15} /></button>
      <span className="pcard__tag">{badgeLabel}</span>
      <div className="pcard__body">
        <div className="pcard__house">{house.name}</div>
        <h3 className="pcard__name"><a href={`#/product/${p.id}`} onClick={openProduct}>{p.name}</a></h3>
        <div className="pcard__duration"><span>{duration.label}</span><small>{duration.id === "unknown" ? "Dato a consultar" : duration.short}</small></div>
        <div className="pcard__row">
          <span className="pcard__price">{formatARS(p.price)}</span>
          {p.price != null ? <button className="pcard__add" onClick={() => addToCart(p)} aria-label={`Agregar ${p.name}`}><Plus size={16} /></button> : <a className="pcard__add" href={inquiryUrl} target="_blank" rel="noreferrer" aria-label={`Consultar precio de ${p.name}`}><MessageCircle size={16} /></a>}
        </div>
      </div>
    </article>
  );
}

/* ───────────── Dropdown accesible Dark Luxury ───────────── */
export function DarkSelect({ value, onChange, options, label, className = "", disabled = false }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];
  useEffect(() => {
    if (disabled) setOpen(false);
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const keys = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", keys);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", keys); };
  }, [disabled]);
  return <div className={`dark-select ${className}`} ref={root}>
    {label && <span className="dark-select__label">{label}</span>}
    <button type="button" className="dark-select__trigger" role="combobox" aria-label={label || selected?.label} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => { if (!disabled) setOpen((v) => !v); }}>
      <span>{selected?.label || "Elegir"}</span><ChevronDown size={15} />
    </button>
    {open && !disabled && <div className="dark-select__menu" role="listbox" aria-label={label || "Seleccionar una opción"}>
      {options.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} className={option.value === value ? "is-selected" : ""} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.value === value && <span aria-hidden="true">✓</span>}</button>)}
    </div>}
  </div>;
}

export function ShareFragranceButton({ p, className = "btn btn--ghost" }) {
  const { loyalty, notify } = useApp();
  return <button type="button" className={className} onClick={() => shareFragrance(p, loyalty.award, notify)}><Share2 size={16} />Compartir fragancia</button>;
}

/* ───────────── Navegación lateral única ───────────── */
const NAV = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "catalog", label: "Catálogo", icon: LayoutGrid },
  { id: "quiz", label: "Quiz", icon: FlaskConical },
  { id: "ai", label: "Laboratorio", icon: Sparkles },
  { id: "blog", label: "Diario", icon: BookOpen },
  { id: "about", label: "Casa", icon: Crown },
  { id: "contact", label: "Ayuda", icon: Mail },
];
const MOBILE_NAV = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "catalog", label: "Catálogo", icon: LayoutGrid },
  { id: "collections", label: "Colecciones", icon: Layers },
  { id: "quiz", label: "Quiz", icon: FlaskConical },
];

export function Rail({ route }) {
  const { openChat, chatOpen, loyalty, theme, toggleTheme } = useApp();
  const active = route === "product" ? "catalog" : route === "checkout" ? "catalog" : route;
  const moreActive = ["ai", "blog", "about", "contact"].includes(active);
  const themeLabel = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const moreRef = useRef(null);
  const closeMore = () => { if (moreRef.current) moreRef.current.open = false; };
  useEffect(() => {
    const outside = (event) => {
      if (moreRef.current?.open && !moreRef.current.contains(event.target)) moreRef.current.open = false;
    };
    const escape = (event) => {
      if (event.key !== "Escape" || !moreRef.current?.open) return;
      moreRef.current.open = false;
      moreRef.current.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  return (
    <nav className="rail glass-cristal-luxury" aria-label="Navegación principal">
      <div className="rail__top"><a className="rail__logo" href="#/" aria-label="Altiva Essentia"><img src="/img/logo.webp" alt="Altiva Essentia" /></a></div>
      <div className="rail__items rail__desktop-items">
        {NAV.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#/${id === "home" ? "" : id}`} className={"rail__item" + (active === id ? " is-active" : "")} aria-current={active === id ? "page" : undefined} aria-label={label}>
            <Icon size={20} strokeWidth={1.7} /><span className="rail__tooltip">{label}</span>
          </a>
        ))}
        <button className={`rail__item${chatOpen ? " is-active" : ""}`} onClick={() => openChat()} aria-label="Abrir Nez" aria-pressed={chatOpen}>
          <MessageCircle size={20} strokeWidth={1.7} /><span className="rail__tooltip">Nez</span>
        </button>
      </div>
      <div className="rail__bottom rail__desktop-bottom">
        <button className="rail__item points-widget" onClick={() => go("contact")} aria-label={`Pase Altiva: ${loyalty.balance} puntos`}>
          <Gift size={19} /><span className="rail__tooltip"><b>Pase Altiva</b><small>{loyalty.ready ? `${loyalty.balance} pts` : "Cargando saldo…"}</small></span>
        </button>
        <button className="rail__item theme-toggle" onClick={toggleTheme} aria-label={themeLabel}>
          <ThemeIcon size={19} strokeWidth={1.7} /><span className="rail__tooltip">{themeLabel}</span>
        </button>
      </div>
      <div className="rail__items rail__mobile-items">
        {MOBILE_NAV.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#/${id === "home" ? "" : id}`} className={"rail__item" + (active === id ? " is-active" : "")} aria-current={active === id ? "page" : undefined} aria-label={label}>
            <Icon size={20} strokeWidth={1.8} /><span className="rail__mobile-label">{label}</span>
          </a>
        ))}
        <button className={`rail__item${chatOpen ? " is-active" : ""}`} onClick={() => openChat()} aria-label="Abrir Nez" aria-pressed={chatOpen}>
          <MessageCircle size={20} strokeWidth={1.8} /><span className="rail__mobile-label">Nez</span>
        </button>
        <button className="rail__item points-widget" onClick={() => go("contact")} aria-label={`Pase Altiva: ${loyalty.balance} puntos`}>
          <Gift size={19} /><span className="rail__mobile-label">Pase</span>
        </button>
        <details className="rail__more" ref={moreRef}>
          <summary className={"rail__item rail__more-trigger" + (moreActive ? " is-active" : "")} aria-label={moreActive ? "Más opciones, sección secundaria activa" : "Más opciones"}>
            <MoreHorizontal size={21} strokeWidth={1.8} /><span className="rail__mobile-label">Más</span>
          </summary>
          <nav className="rail__more-menu" aria-label="Más opciones">
            <a className="rail__more-link" href="#/ai" aria-current={active === "ai" ? "page" : undefined} onClick={closeMore}><Sparkles size={17} />Laboratorio</a>
            <a className="rail__more-link" href="#/blog" aria-current={active === "blog" ? "page" : undefined} onClick={closeMore}><BookOpen size={17} />Diario</a>
            <a className="rail__more-link" href="#/about" aria-current={active === "about" ? "page" : undefined} onClick={closeMore}><Crown size={17} />Casa</a>
            <a className="rail__more-link" href="#/contact" aria-current={active === "contact" ? "page" : undefined} onClick={closeMore}><Mail size={17} />Ayuda</a>
            <button className="rail__more-action" onClick={() => { toggleTheme(); closeMore(); }} aria-label={themeLabel}><ThemeIcon size={17} />{themeLabel}</button>
          </nav>
        </details>
      </div>
    </nav>
  );
}

export function TopActions() {
  const { cartCount, setCartOpen, setPaletteOpen, favs, searchText, setSearchText } = useApp();
  const search = (event) => {
    event.preventDefault();
    const term = searchText.trim();
    go(term ? `catalog?q=${encodeURIComponent(term)}` : "catalog");
  };
  return (
    <header className="topbar">
      <a className="topbar__brand" href="#/" aria-label="Altiva Essentia, inicio"><img src="/img/logo.webp" alt="" /><span>ALTIVA ESSENTIA</span></a>
      <form className="topbar__search" role="search" onSubmit={search}>
        <Search size={16} aria-hidden="true" />
        <input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Buscar perfumes, casas o notas…" aria-label="Buscar perfumes, casas o notas" />
        <button type="submit" aria-label="Buscar en el catálogo"><ArrowRight size={16} /></button>
      </form>
      <button className="iconbtn topbar__mobile-search" onClick={() => setPaletteOpen(true)} aria-label="Abrir búsqueda"><Search size={18} /></button>
      <div className="topbar__actions">
        <a className="iconbtn" href="#/account" aria-label="Favoritos">
          <Heart size={18} />{favs.length > 0 && <i className="badge badge--soft">{favs.length}</i>}
        </a>
        <button className="iconbtn iconbtn--gold" onClick={() => setCartOpen(true)} aria-label="Carrito">
          <ShoppingBag size={18} />{cartCount > 0 && <i className="badge">{cartCount}</i>}
        </button>
      </div>
    </header>
  );
}

/* ───────────── Carrito ───────────── */
export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, subtotal, loyalty, redemption, setRedemption } = useApp();
  const left = Math.max(0, FREE_SHIPPING - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING) * 100);
  return (
    <>
      <div className={"scrim" + (cartOpen ? " is-open" : "")} onClick={() => setCartOpen(false)} />
      <aside className={"drawer" + (cartOpen ? " is-open" : "")} aria-hidden={!cartOpen} aria-label="Carrito">
        <header className="drawer__head">
          <h2>Tu carrito</h2>
          <button className="iconbtn" onClick={() => setCartOpen(false)} aria-label="Cerrar"><X size={18} /></button>
        </header>
        {cart.length === 0 ? (
          <div className="drawer__empty">
            <ShoppingBag size={36} strokeWidth={1.2} />
            <p>Todavía no agregaste fragancias.</p>
            <a className="btn btn--gold" href="#/catalog" onClick={() => setCartOpen(false)}>Explorar el catálogo</a>
          </div>
        ) : (
          <>
            <div className="ship">
              <div className="ship__txt"><Truck size={15} />{left === 0 ? "Envío sin cargo estimado · confirmar cobertura" : <>Faltan <b>{formatARS(left)}</b> para el umbral de envío estimado</>}</div>
              <div className="ship__bar"><span style={{ width: pct + "%" }} /></div>
            </div>
            <ul className="drawer__list">
              {cart.map((l) => {
                const p = CATALOG.find((x) => x.id === l.id);
                return (
                  <li key={l.key} className="line">
                    <div className="line__img"><Bottle p={p} /></div>
                    <div className="line__info">
                      <div className="line__house">{HOUSES[p.brand].name} · {p.presentation || "Presentación no informada"}</div>
                      <a href={`#/product/${p.id}`} onClick={() => setCartOpen(false)} className="line__name">{p.name}</a>
                      <div className="qty">
                        <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Menos"><Minus size={13} /></button>
                        <span>{l.qty}</span>
                        <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="Más"><Plus size={13} /></button>
                      </div>
                    </div>
                    <div className="line__price">{formatARS(l.price * l.qty)}
                      <button onClick={() => setQty(l.key, 0)} aria-label="Quitar"><Trash2 size={14} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <footer className="drawer__foot">
              <div className="sum"><span>Subtotal</span><b>{formatARS(subtotal)}</b></div>
              <LoyaltyRedeemer loyalty={loyalty} redemption={redemption} setRedemption={setRedemption} />
              <button className="btn btn--gold btn--block" onClick={() => { setCartOpen(false); go("checkout"); }}>Finalizar compra <ArrowRight size={16} /></button>
              <p className="muted small"><ShieldCheck size={13} /> El pedido y la confirmación del pago se informan por separado. Precios y disponibilidad provienen de la planilla y deben confirmarse con la tienda; el envío es estimado.</p>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

function LoyaltyRedeemer({ loyalty, redemption, setRedemption }) {
  const [points,setPoints]=useState(500),[email,setEmail]=useState(""),[challenge,setChallenge]=useState(""),[code,setCode]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const maxPoints=Math.floor(loyalty.balance/500)*500;
  const remove=async()=>{setBusy(true);setError("");try{await loyalty.cancelRedemption(redemption.redemptionId);setRedemption(null);}catch(e){setError(e.message||"No se pudo retirar el canje.");}finally{setBusy(false);}};
  if(redemption)return <div className="redeem-applied"><Gift size={15}/><span>Canje validado: <b>{redemption.points} pts · −{formatARS(redemption.discountARS)}</b><small>Se aplicará al pedido pendiente.</small>{error&&<small className="redeem-error">{error}</small>}</span><button disabled={busy} onClick={remove} aria-label="Retirar canje del carrito">{busy?"…":<X size={15}/>}</button></div>;
  const send=async()=>{setBusy(true);setError("");try{const result=await loyalty.requestRedeemOtp(Number(points),email);setChallenge(result.challengeId);}catch(e){setError(e.message);}finally{setBusy(false);}};
  const verify=async()=>{setBusy(true);setError("");try{setRedemption(await loyalty.verifyRedeemOtp(challenge,code));}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <div className="redeem-box"><div><b>Canjear puntos</b><small>{loyalty.balance} puntos · 500 pts = $ 5.000</small></div>
    {!challenge?<><label className="redeem-field">Puntos a canjear<input type="number" min="500" step="500" max={maxPoints} value={Math.min(Number(points)||500,Math.max(500,maxPoints))} onChange={(e)=>setPoints(e.target.value)} disabled={!maxPoints||busy}/></label><label className="redeem-field">Email para el OTP<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="tu@email.com" disabled={!maxPoints||busy}/></label><button className="btn btn--ghost btn--block" disabled={busy||maxPoints<500||!email.includes("@")} onClick={send}>{busy?"Enviando código…":"Validar por email"}</button></>
    :<><label className="redeem-field">Código de 4 dígitos<input inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,"").slice(0,4))}/></label><button className="btn btn--gold btn--block" disabled={busy||code.length!==4} onClick={verify}>{busy?"Verificando…":"Confirmar canje"}</button><button className="redeem-cancel" onClick={()=>{setChallenge("");setCode("");}}>Cancelar</button></>}
    {error&&<p className="redeem-error" role="alert">{error}</p>}{maxPoints<500&&!error&&<small className="redeem-hint">Acumulá 500 puntos para desbloquear el primer canje.</small>}
  </div>;
}

/* ───────────── Nez (asesora olfativa) ───────────── */
const QUICK = ["Recomiéndame un perfume árabe", "Busco una cena con 6–8 horas orientativas", "¿Qué es el oud?", "Quiero un gourmand suave", "Envíos a Argentina"];
const GREETING = "Bienvenido a Altiva Essentia. Soy Nez, tu asesora olfativa. Contame qué querés sentir —una ocasión, una sensación, un recuerdo o una duración orientativa— y te guío hacia tu esencia.";

export function Chat() {
  const { chatOpen, setChatOpen, chatSeed } = useApp();
  const [msgs, setMsgs] = useState([{ role: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(null);
  const [longevity, setLongevity] = useState("");
  const body = useRef(null);
  const inp = useRef(null);

  useEffect(() => { body.current && (body.current.scrollTop = body.current.scrollHeight); }, [msgs, busy]);
  useEffect(() => { if (chatOpen) setTimeout(() => inp.current?.focus(), 250); }, [chatOpen]);
  useEffect(() => { fetch("/api/health").then((r) => r.json()).then((d) => setAiConfigured(Boolean(d.aiConfigured))).catch(() => setAiConfigured(false)); }, []);

  const execute = async (history, text, retryId = null, duration = longevity) => {
    setBusy(true);
    try {
      const r = await askNez(history, duration);
      const answer = { id: retryId || Date.now(), role: "bot", text: r.text, picks: r.picks };
      setMsgs((current) => retryId ? current.map((m) => m.id === retryId ? answer : m) : [...current, answer]);
    } catch (error) {
      const id = retryId || Date.now();
      const answer = { id, role: "bot", text: error.message || "Nez no pudo conectarse. Probá de nuevo.", retryText: text, retryHistory: history, retryLongevity: duration };
      setMsgs((current) => retryId ? current.map((m) => m.id === retryId ? answer : m) : [...current, answer]);
    } finally { setBusy(false); }
  };
  const send = async (t) => {
    const text = (t ?? input).trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", text }];
    setMsgs(next); setInput("");
    const hist = next.slice(1).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    await execute(hist, text, null, longevity);
  };
  useEffect(() => { if (chatSeed?.text) send(chatSeed.text); /* eslint-disable-next-line */ }, [chatSeed]);

  return (
    <section className={"chat" + (chatOpen ? " is-open" : "")} role="dialog" aria-label="Nez, asesora olfativa" aria-hidden={!chatOpen}>
      <header className="chat__head">
        <div className="chat__avatar">S</div>
        <div><b>Nez</b><small><i /> {aiConfigured === false ? "IA no disponible · reintentá" : aiConfigured ? "Asesora olfativa · catálogo Altiva" : "Verificando IA…"}</small></div>
        <button className="iconbtn" onClick={() => setChatOpen(false)} aria-label="Cerrar"><X size={18} /></button>
      </header>
      <div className="chat__body" ref={body}>
        {msgs.map((m, i) => (
          <div key={m.id || i} className={"msg msg--" + m.role}>
            <p>{m.text}</p>
            {m.retryText && <button className="chat__retry" onClick={() => execute(m.retryHistory, m.retryText, m.id, m.retryLongevity)} disabled={busy}>Reintentar</button>}
            {m.picks?.length > 0 && (
              <div className="msg__picks">
                {m.picks.map((p) => (
                  <a key={p.id} href={`#/product/${p.id}`} onClick={() => setChatOpen(false)} className="mini">
                    <div className="mini__img"><Bottle p={p} /></div>
                    <div><b>{p.name}</b><small>{HOUSES[p.brand].name} · {formatARS(p.price)}</small></div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg msg--bot typing"><i /><i /><i /></div>}
      </div>
      {msgs.length <= 1 && (
        <div className="chat__quick">{QUICK.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>
      )}
      <div className="chat__prefs"><span>Duración deseada · estimación orientativa</span><DarkSelect value={longevity} onChange={setLongevity} options={[{value:"",label:"Sin preferencia"},...LONGEVITY_LEVELS.map((x)=>({value:x.id,label:`${x.label} · ${x.hours}`}))]} /></div>
      <form className="chat__input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input ref={inp} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Contame qué buscás…" disabled={busy} />
        <button className="btn btn--gold btn--icon" disabled={!input.trim() || busy} aria-label="Enviar"><Send size={16} /></button>
      </form>
    </section>
  );
}

/* ───────────── Paleta de comandos (Ctrl/⌘ + K) ───────────── */
const PAGES = [
  ["Inicio", ""], ["Catálogo", "catalog"], ["Quiz olfativo", "quiz"], ["Laboratorio", "ai"], ["Diario olfativo", "blog"],
  ["Manifiesto", "about"], ["Contacto", "contact"], ["Mis favoritos", "account"], ["Checkout", "checkout"],
];

export function Palette() {
  const { paletteOpen, setPaletteOpen, openChat } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const on = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [setPaletteOpen]);
  useEffect(() => { if (paletteOpen) { setQ(""); setSel(0); setTimeout(() => ref.current?.focus(), 50); } }, [paletteOpen]);

  const results = useMemo(() => {
    const n = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const flat = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pages = PAGES.filter(([l]) => !n || flat(l).includes(n)).map(([l, r]) => ({ type: "Ir a", label: l, run: () => go(r) }));
    const prods = n ? CATALOG.filter((p) => flat([p.name, HOUSES[p.brand].name, familyLabel(p.family), p.presentation, ...p.notes].join(" ")).includes(n))
      .slice(0, 7).map((p) => ({ type: p.productType === "perfume" ? "Perfume" : p.productType === "set" ? "Set" : "Desodorante", label: p.name, sub: `${HOUSES[p.brand].name} · ${formatARS(p.price)}`, run: () => go(`product/${p.id}`) })) : [];
    const ask = n ? [{ type: "Nez", label: `Preguntarle a Nez: “${q}”`, run: () => openChat(q) }] : [];
    return [...prods, ...pages.slice(0, n ? 3 : 8), ...ask];
  }, [q, openChat]);

  const run = (r) => { r?.run(); setPaletteOpen(false); };
  if (!paletteOpen) return null;
  return (
    <div className="palette" onMouseDown={(e) => e.target === e.currentTarget && setPaletteOpen(false)}>
      <div className="palette__box" role="dialog" aria-label="Buscar">
        <div className="palette__in">
          <Search size={18} />
          <input ref={ref} value={q} placeholder="Buscá un perfume, una casa o una nota (oud, rosa, vainilla…)"
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === "Enter") run(results[sel]);
            }} />
          <kbd>esc</kbd>
        </div>
        <ul>
          {results.map((r, i) => (
            <li key={i}><button className={i === sel ? "is-sel" : ""} onMouseEnter={() => setSel(i)} onClick={() => run(r)}>
              <em>{r.type}</em><span>{r.label}</span>{r.sub && <small>{r.sub}</small>}<ArrowRight size={14} />
            </button></li>
          ))}
          {results.length === 0 && <li className="palette__empty">Sin resultados</li>}
        </ul>
      </div>
    </div>
  );
}

export function Toast() {
  const { toast } = useApp();
  return <div className={"toast" + (toast ? " is-on" : "")} role="status" aria-live="polite">{toast?.msg}</div>;
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div>
          <div className="footer__brand"><img src="/img/logo.webp" alt="" /><div><b>Altiva Essentia</b><small>ELIXIR IMPERIALIS · CÓRDOBA</small></div></div>
          <p>Selección Reservada de perfumería de nicho, casas árabes y fragancias de autor. Sitio demostrativo: consultá catálogo y condiciones vigentes antes de comprar.</p>
        </div>
        <div><h4>Explorar</h4><a href="#/catalog">Todo el catálogo</a><a href="#/quiz">Quiz olfativo</a><a href="#/blog">Diario</a><a href="#/about">Manifiesto</a></div>
        <div><h4>Ayuda</h4><a href="#/contact">Contacto</a><a href="#/contact">Envíos y devoluciones</a><a href="#/contact">Santuario Olfativo · próximamente</a></div>
        <div><h4>Casa</h4><span>Córdoba, Argentina</span><span>Atención y tienda online · 24 hs</span><a href="https://wa.me/5493516521368" target="_blank" rel="noreferrer">WhatsApp +54 9 351 652-1368</a></div>
      </div>
      <div className="footer__legal">© Altiva Essentia. Catálogo y precios demostrativos; confirmar disponibilidad, políticas y condiciones con la tienda.</div>
    </footer>
  );
}

export function SectionHead({ title, link, to, eyebrow }) {
  return (
    <div className="shead">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2></div>
      {link && <a href={to} className="shead__link">{link} <ArrowRight size={14} /></a>}
    </div>
  );
}
