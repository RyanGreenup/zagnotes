# Dynamic Routes in SolidStart

## 202504141: File-Based Routing in SolidStart

SolidStart uses a file-based routing system where files in the `src/routes` directory automatically become routes:

- **Static Routes**: `about.tsx` → `/about`
- **Dynamic Routes**: `[id].tsx` → matches `/any-value` with the value available as a parameter
- **Nested Routes**: `notes/[id].tsx` → matches `/notes/any-value`
- **Catch-all Routes**: `[...404].tsx` → matches any unmatched route

Dynamic routes like `[id].tsx` create pages that respond to any URL path, with the path segment becoming available as a parameter:

```tsx
// src/routes/[id].tsx
export default function DynamicIdPage() {
  const params = useParams();
  // params.id contains whatever was in the URL
  
  return <div>Note ID: {params.id}</div>;
}
```

You don't need to explicitly "use" these components anywhere - the routing system automatically renders them when a matching URL is visited.

## 202504142: Layout Inheritance in SolidStart

Dynamic routes inherit layouts defined in `app.tsx` through SolidStart's routing system:

```tsx
// src/app.tsx
export default function App() {
  return (
    <Router
      root={(props) => (
        <Layout>
          <Suspense>
            {/* Common UI elements */}
            <ServerTime />
            {/* Route components inserted here */}
            {props.children}
          </Suspense>
        </Layout>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

The component hierarchy when visiting a dynamic route:
```
App
└── Router
    └── Layout (from app.tsx)
        └── Suspense
            ├── Common UI elements
            └── Dynamic Route Component (e.g., from [id].tsx)
```

This approach ensures:
1. **Consistent Layout** - Every page gets the same layout components
2. **Shared Elements** - Common UI elements appear on all pages
3. **Consistent Suspense Boundary** - All routes share the same loading state handling

## 202504143: Server Functions with Dynamic Routes

Dynamic routes can use server functions to fetch data based on the route parameter:

```tsx
// Server function that runs on the server
async function getNoteData(id: string) {
  "use server";
  // Query database or other data source using the ID
  return { title: `Note ${id}`, content: "..." };
}

// Component that uses the server function
export default function NotePage() {
  const params = useParams();
  const [note] = createResource(() => params.id, getNoteData);
  
  return <div>{note()?.content}</div>;
}
```

This creates a powerful pattern for building data-driven applications where:
1. The URL structure reflects your data organization
2. Each route fetches only the data it needs
3. Server-side data fetching happens automatically

## References
- [SolidStart Documentation](https://start.solidjs.com/core-concepts/routing)
- [File-based Routing](https://start.solidjs.com/core-concepts/file-based-routing)
