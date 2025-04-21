# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands
- Build: `pnpm run build`
- Development: `pnpm run dev`
- Start server: `pnpm run start`
- Format code: `npx prettier --write **/**/*.tsx`
- Type check: `pnpm tsc --noEmit --skipLibCheck`
- Lint: `pnpm eslint . --ext .ts,.tsx`
- Full check: `pnpm just check`

## Code Style Guidelines
- Use SolidJS reactivity model (signals, stores, computations)
- Typing: Use strict types, avoid `any` when possible
- Naming: Use meaningful, intent-revealing names
- Components: Small, modular functions doing one thing well
- JSX: Keep markup clean, no inline styles
- CSS: Use Tailwind and DaisyUI for styling
- Error handling: Always handle errors properly
- File organization: Keep code in small, modular files
- Classes: Use `classList` with dictionary for conditional classes
- Prefer interfaces for object types, type aliases for utility types
- Follow ESLint rules, particularly for SolidJS reactivity