import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import ServerTime from "~/components/ServerTime";
import Layout from "~/components/Layout";
import "./app.css";
import "katex/dist/katex.min.css";

/**
 * Main application component
 * @returns Application component
 */
export default function App() {
  return (
    <Router
      root={(props) => (
        <Layout>
          <Suspense>
            {props.children}
            {/*
            <div style={{ margin: "1rem" }}><ServerTime /> </div>
            */}
          </Suspense>
        </Layout>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
