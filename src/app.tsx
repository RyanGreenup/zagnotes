import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Layout from "~/components/Layout";
import "./app.css";
import ServerTime from "./routes/server_function_example";
import EnvExample from "./routes/env-example";
import NoteTreeView from "./routes/note-tree-view";

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
          <NoteTreeView/>
          <EnvExample/>
          <ServerTime/>
        </Layout>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
