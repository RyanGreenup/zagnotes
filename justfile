aider:
    aider --model sonnet --no-attribute-author --watch-files --cache-prompts --cache-keepalive-pings 2 --read CONVENTIONS.md

run:
    pnpm run dev --host

build:
    pnpm run build && \
        PORT=3002 node .output/server/index.mjs

fmt:
    npx prettier --write **/**/*.tsx
