import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadSeedData } from "@/data/seed";

loadSeedData();
createRoot(document.getElementById("root")!).render(<App />);
