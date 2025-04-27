set dotenv-load
aider:
    aider --model sonnet --no-attribute-author --watch-files --cache-prompts --cache-keepalive-pings 2 --read CONVENTIONS.md

run:
    DB_PATH=$HOME/.config/joplin-desktop/database.sqlite \
        pnpm run dev --host

build:
    pnpm run build && \
        DB_PATH=$HOME/.config/joplin-desktop/database.sqlite \
            PORT=3002 node .output/server/index.mjs

fmt:
    npx prettier --write **/**/*.tsx

check:
    # Run TypeScript type checking
    pnpm tsc --noEmit --skipLibCheck
    # Run ESLint to catch code quality issues
    pnpm eslint . --ext .ts,.tsx
    # Check for SSR compatibility issues by doing a test build
    pnpm run build --mode=development
