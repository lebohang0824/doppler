# Agent Guidelines for Doppler

This document provides guidelines for agentic coding agents working on the Doppler project.

## Project Overview

Doppler is an AI-powered issue manager built with:
- **Framework**: Astro (SSR with Node.js adapter)
- **UI**: Alpine.js for interactivity
- **Database**: Astro DB (SQLite)
- **Git Integration**: simple-git
- **AI**: Gemini CLI / Opencode CLI

## Build & Development Commands

### Core Commands
```bash
npm run dev       # Start development server (http://localhost:4321)
npm run build    # Build for production
npm run preview  # Preview production build
npm run astro    # Run Astro CLI commands
```

Note: This project has **no test suite** and **no linting configured**. Before committing, manually verify:
- No syntax errors in modified files
- Astro builds successfully (`npm run build`)
- All imports resolve correctly

## Code Style Guidelines

### File Conventions

**Astro Components (`.astro`)**:
- Frontmatter: Use `---` fences, define props with `const { propName } = Astro.props`
- Template: Single quotes for attributes (`class='name'`, `href='/path'`)
- Script: Inline scripts use `is:inline` with Alpine.js via `document.addEventListener('alpine:init', () => {...})`
- Styles: Scoped `<style>` blocks, CSS custom properties for theming

**JavaScript Modules (`.js`)**:
- Use ES modules (`import`/`export`)
- Prefer named exports for services (e.g., `export class IssueService`)
- Use `async`/`await` for async operations
- Use `crypto.randomUUID()` for generating UUIDs

**Database (Astro DB)**:
- Define schemas in `db/config.js` using `defineTable` and `column`
- Use service classes in `src/lib/services/` for database operations
- Import pattern: `import { db, TableName, eq, and, desc, count } from 'astro:db'`

### Naming Conventions
- **Components**: PascalCase (`Sidebar.astro`, `DashboardLayout.astro`)
- **Services/Utils**: PascalCase (`ApiService`, `IssueService`)
- **Files**: kebab-case (`api-service.js`, `gemini-service.js`)
- **CSS Classes**: kebab-case (`.sidebar`, `.nav-section`)
- **Database Tables**: PascalCase (`Project`, `Issue`, `Log`)
- **Table Columns**: snake_case (`project_id`, `created_at`)

### Import Order
1. Node built-ins (`import { ... } from 'node:...'`)
2. Astro built-ins (`import { ... } from 'astro:...'`)
3. Third-party packages (`import ... from '@astrojs/...'`)
4. Local modules (`import ... from '../lib/...'`)

### Error Handling
- Wrap async operations in try/catch
- Return meaningful error messages
- Use `console.error()` for server-side logging
- Throw descriptive errors in API services

```javascript
async function fetchIssues() {
  try {
    const res = await fetch('/api/issues');
    if (!res.ok) throw new Error('Failed to fetch issues');
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch issues:', e);
    throw e;
  }
}
```

### API Endpoints
- Use Astro's SSR endpoint pattern (`export const GET`, `export const POST`, etc.)
- Return `Response` objects with appropriate status codes
- Set headers (`'Content-Type': 'application/json'`)
- Handle query params via `Astro.url.searchParams`

```javascript
export const GET = async ({ url }) => {
  const projectId = url.searchParams.get('project_id');
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Alpine.js Patterns
- Initialize: `document.addEventListener('alpine:init', () => { Alpine.data(...) })`
- Use `x-data` for component scope
- Use `x-show`, `x-if`, `x-for` for conditionals and loops
- Use `x-text`, `x-bind:class` for dynamic content

### Database Patterns

**Service Class**:
```javascript
export class IssueService {
  static async getAll(projectId = null) { ... }
  static async getById(id) { ... }
  static async create(data) { ... }
  static async update(id, data) { ... }
  static async delete(id) { ... }
}
```

**Table Definition**:
```javascript
const TableName = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(),
    optionalField: column.text({ optional: true }),
    created_at: column.date({ default: NOW }),
  },
});
```

## Directory Structure

```
src/
├── components/      # Astro components (issues/, modals/, settings/, Sidebar.astro)
├── layouts/         # Page layouts (DashboardLayout.astro)
├── lib/             # Business logic
│   ├── api-service.js
│   ├── gemini-service.js
│   ├── opencode-service.js
│   ├── git-service.js
│   └── services/   # Database services (issue-service.js, project-service.js, etc.)
├── pages/           # Astro pages + API routes
│   ├── api/        # Server endpoints
│   ├── projects/
│   ├── issues/
│   └── index.astro
db/
├── config.js        # Database schema
└── seed.js          # Seed data
```

## Common Tasks

**Adding a New API Endpoint**:
1. Create file in `src/pages/api/[resource]/[action].js`
2. Export method (`GET`, `POST`, `PATCH`, `DELETE`)
3. Add method to `ApiService` in `src/lib/api-service.js`

**Adding a New Database Table**:
1. Define table in `db/config.js`
2. Run `npx astro db sync` to update database
3. Create service class in `src/lib/services/`

**Adding a New Frontend Component**:
1. Create Astro component in `src/components/`
2. Use existing layout or import `DashboardLayout`
3. Add Alpine.js data in inline script if needed
4. Add styles in scoped `<style>` block

## Dependencies

- `astro` - Web framework
- `@astrojs/alpinejs` - Alpine.js integration
- `@astrojs/db` - Database (Astro DB)
- `@astrojs/node` - Node.js adapter
- `alpinejs` - UI interactivity
- `simple-git` - Git operations