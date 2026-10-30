import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);

// Bloquea el menú contextual (click derecho) y el arrastre sobre imágenes y videos.
const blockMedia = (event) => { if (event.target && event.target.closest && event.target.closest("img, video")) event.preventDefault(); };
document.addEventListener("contextmenu", blockMedia, true);
document.addEventListener("dragstart", blockMedia, true);
