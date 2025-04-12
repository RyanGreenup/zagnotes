import { createResource, Show, Suspense } from "solid-js";
import TreeView from "../components/TreeView";

// Server function that fetches the note tree
async function fetchNoteTree() {
  "use server"; // This directive ensures the function runs on the server
  
  try {
    // Get the database path from environment variables
    const dbPath = process.env.DB_PATH;
    
    if (!dbPath) {
      throw new Error("Database path not configured. Set DB_PATH environment variable.");
    }
    
    // Import the database service dynamically to ensure it only runs on the server
    const { default: BetterSqlite3 } = await import('better-sqlite3');
    
    // Check if database file exists
    const { existsSync } = await import('fs');
    if (!existsSync(dbPath)) {
      throw new Error(`Database file not found: ${dbPath}`);
    }
    
    // Connect to the database directly
    const db = new BetterSqlite3(dbPath, { readonly: true });
    
    // Build the note tree directly
    const folderService = new (await import('../database/services/FolderService')).FolderService(db);
    const noteTree = folderService.buildNoteTree();
    
    // Close the database connection
    db.close();
    
    return {
      success: true,
      tree: noteTree,
      message: "Note tree fetched successfully"
    };
  } catch (error) {
    console.error("Error fetching note tree:", error);
    return {
      success: false,
      tree: null,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export default function NoteTreeView() {
  // Use createResource to fetch the note tree from the server
  const [treeData, { refetch }] = createResource(fetchNoteTree);
  
  return (
    <div style={{
      padding: "1rem",
      border: "var(--border) solid var(--color-base-300)",
      "border-radius": "var(--radius-box)"
    }}>
      <h2 style={{
        "font-size": "1.5rem",
        "font-weight": "600",
        "margin-bottom": "1rem"
      }}>Note Tree</h2>
      
      {/* Wrap the tree view in Suspense to handle async state during hydration */}
      <Suspense fallback={<p>Loading note tree...</p>}>
        {/* Show error state if there is one */}
        <Show when={treeData.error}>
          <div style={{ color: "var(--color-error)", padding: "1rem" }}>
            <p>Error loading note tree: {treeData.error.message}</p>
          </div>
        </Show>
        
        {/* Show the data when it's available */}
        <Show when={treeData() && !treeData.loading}>
          <Show when={treeData()?.success} fallback={
            <div style={{ color: "var(--color-error)", padding: "1rem" }}>
              <p>Failed to load note tree: {treeData()?.message}</p>
            </div>
          }>
            <div style={{ 
              "max-height": "60vh", 
              "overflow-y": "auto",
              "border": "var(--border) solid var(--color-base-200)",
              "border-radius": "var(--radius-field)",
              "padding": "0.5rem"
            }}>
              <TreeView 
                data={treeData()?.tree?.children || []}
              />
            </div>
          </Show>
        </Show>
      </Suspense>
      
      {/* Button to manually refetch the data */}
      <button 
        style={{
          "margin-top": "1rem",
          padding: "0.5rem 1rem",
          "background-color": "var(--color-primary)",
          color: "var(--color-primary-content)",
          "border-radius": "var(--radius-field)",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.2s ease"
        }}
        onClick={() => refetch()}
      >
        Refresh Note Tree
      </button>
    </div>
  );
}
