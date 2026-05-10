import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installCanvasZoom } from "./canvas-zoom";
import "./styles.css";
import "./ux-fixes.css";
import "./visual-polish.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found.");
}

installCanvasZoom();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
