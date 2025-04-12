import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Layout from "~/components/Layout";
import "./app.css";
import EnvExample from "./routes/env-example";

/**
 * Main application component
 * @returns Application component
 */
export default function App() {
  return (
    <Router
      root={props => (
        <Layout>
          <Suspense>{props.children}</Suspense>
          <EnvExample/>
        </Layout>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
