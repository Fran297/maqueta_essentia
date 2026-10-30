import { useEffect } from "react";
import { AppProvider, useRoute, byId } from "./lib.jsx";
import { Rail, TopActions, CartDrawer, Chat, Palette, Toast, Footer } from "./components.jsx";
import { HomePage, CatalogPage, ProductPage } from "./pages1.jsx";
import { CheckoutPage, QuizPage, BlogPage, ArticlePage, AboutPage, ContactPage, AccountPage } from "./pages2.jsx";
import { AILabPage } from "./pages3.jsx";

const PAGE_TITLES = { catalog: "Catálogo", quiz: "Quiz olfativo", ai: "Laboratorio", blog: "Diario olfativo", about: "Casa", contact: "Ayuda", account: "Mis favoritos", checkout: "Checkout", collections: "Colecciones" };
function Shell() {
  const { route, param } = useRoute();
  // Título propio por ruta: la app usa rutas con #, así que sin esto todas comparten el título de inicio.
  useEffect(() => {
    const base = "Altiva Essentia";
    const name = route === "product" ? byId(param)?.name : PAGE_TITLES[route];
    document.title = name ? `${name} · ${base}` : base;
  }, [route, param]);
  let page;
  switch (route) {
    case "collections": page = <HomePage focusCollections />; break;
    case "catalog": page = <CatalogPage />; break;
    case "product": page = <ProductPage id={param} />; break;
    case "checkout": page = <CheckoutPage />; break;
    case "quiz": page = <QuizPage />; break;
    case "ai": page = <AILabPage />; break;
    case "blog": page = param ? <ArticlePage slug={param} /> : <BlogPage />; break;
    case "about": page = <AboutPage />; break;
    case "contact": page = <ContactPage />; break;
    case "account": page = <AccountPage />; break;
    default: page = <HomePage />;
  }
  return (
    <>
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      <Rail route={route} />
      <TopActions />
      <main className="main" key={route + (param || "")}>{page}<Footer /></main>
      <CartDrawer />
      <Chat />
      <Palette />
      <Toast />
    </>
  );
}
export default function App() { return <AppProvider><Shell /></AppProvider>; }
