import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import Drawer from "~/components/Drawer";
import "./app.css";

/**
 * Main application component
 * @returns Application component
 */
export default function App() {
  return (
    <Router
      root={props => (
        <Drawer>
          <>
            <Nav />
            <main class="container mx-auto p-4">
              <Suspense>{props.children}</Suspense>
            </main>
          </>
        </Drawer>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
