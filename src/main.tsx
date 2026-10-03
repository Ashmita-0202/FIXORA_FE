import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { App } from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root was not found in index.html.");
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        {/* Position matches the prototype's toast placement (top center). */}
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);