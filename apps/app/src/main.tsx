import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCapacitor } from "./lib/capacitor";

// Initialize Capacitor native plugins (safe no-op on web)
initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
