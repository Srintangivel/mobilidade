// Static (GitHub Pages) entry: renders the same routes as a client-only app with
// hash URLs (/#/perfil), so any refresh or deep link works without a server.
// Not used by the Lovable build/preview; built via `bun run build:gh-pages`.
import "../styles.css";
import { QueryClient } from "@tanstack/react-query";
import { HeadContent, RouterProvider, createHashHistory, createRouter } from "@tanstack/react-router";
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { routeTree } from "../routeTree.gen";

// The root route's shell renders <html>/<body> for SSR; in a client-only mount the
// document already exists, so swap it for a shell that only renders head tags
// (React 19 hoists <title>/<meta> into <head>).
function SpaShell({ children }: { children: ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
    </>
  );
}
routeTree.update({ shellComponent: SpaShell } as never);

const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
