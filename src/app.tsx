import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import ServerTime from "~/components/ServerTime";
import Layout from "~/components/Layout";
import "./app.css";

/**
 * Main application component
 * @returns Application component
 */
export default function App() {
  return (
    <Router
      root={props => (
        <Layout>
          <Suspense>
            <div style={{ margin: "1rem" }}>
              <ServerTime />
            </div>
            {props.children}
          </Suspense>
        </Layout>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
