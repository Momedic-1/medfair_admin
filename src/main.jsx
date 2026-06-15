import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { OrganizationsProvider } from "./context/OrganizationsContext";
import { AppRoutes } from "./routes/AppRoutes";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OrganizationsProvider>
          <AppRoutes />
        </OrganizationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
