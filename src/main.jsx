import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ReactGA from "react-ga4";
import App from "./App";

if (typeof window !== "undefined") {
  ReactGA.initialize("G-HWLK0PZVBM");
}

const root = createRoot(document.getElementById("root"));

startTransition(() => {
  root.render(
    <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
    </StrictMode>
  );
});
