# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About Docmost

Docmost is an open-source collaborative wiki and documentation software with real-time collaboration capabilities built on Node.js/NestJS backend and React/TypeScript frontend.

## Project Structure

This is a monorepo using pnpm workspaces and Nx for task orchestration:

```text
apps/
├── client/          - React/TypeScript frontend (Vite + Mantine UI)
├── server/          - NestJS backend with Fastify
packages/
├── editor-ext/      - TipTap editor extensions
├── ee/              - Enterprise Edition features (separate license)
```

## Development Commands

### Setup and Development

- `pnpm install` - Install dependencies
- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm client:dev` - Start frontend only (<http://localhost:5173>)
- `pnpm server:dev` - Start backend only (<http://localhost:3000>)
- `pnpm collab:dev` - Start collaboration server in development

### Build and Production

- `pnpm build` - Build all apps
- `pnpm client:build` - Build frontend only
- `pnpm server:build` - Build backend only
- `pnpm start` - Start production server
- `pnpm collab` - Start collaboration server in production

### Testing

- `pnpm --filter ./apps/server run test` - Run backend unit tests
- `pnpm --filter ./apps/server run test:e2e` - Run backend e2e tests
- `pnpm --filter ./apps/server run test:watch` - Run tests in watch mode
- `pnpm --filter ./apps/server run test:cov` - Run tests with coverage

### Linting and Formatting

- `pnpm --filter ./apps/server run lint` - Lint backend code
- `pnpm --filter ./apps/client run lint` - Lint frontend code
- `pnpm --filter ./apps/server run format` - Format backend code
- `pnpm --filter ./apps/client run format` - Format frontend code

### Database Operations

- `pnpm --filter ./apps/server run migration:create <name>` - Create new migration
- `pnpm --filter ./apps/server run migration:up` - Run pending migrations
- `pnpm --filter ./apps/server run migration:down` - Rollback last migration
- `pnpm --filter ./apps/server run migration:latest` - Run all pending migrations
- `pnpm --filter ./apps/server run migration:codegen` - Generate TypeScript types from database

## Architecture Overview

### Backend (NestJS)

- **Framework**: NestJS with Fastify adapter for high performance
- **Database**: PostgreSQL with Kysely query builder (type-safe SQL)
- **Authentication**: JWT with passport strategies (local, Google, SAML, Discord)
- **Real-time**: Socket.IO with Redis adapter for collaboration
- **Storage**: File storage with S3-compatible backends
- **Queue**: BullMQ with Redis for background jobs
- **Search**: PostgreSQL full-text search with tsvector

**Key Modules**:

- `core/` - Business logic (auth, page, space, user, search, comments)
- `collaboration/` - Real-time collaboration using Hocuspocus/Y.js
- `integrations/` - External services (storage, mail, health, telemetry)
- `database/` - Kysely migrations and database utilities
- `ee/` - Enterprise Edition features (billing, SSO, MFA)

### Frontend (React)

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite for fast development and builds
- **UI Library**: Mantine v8 with custom theming
- **State Management**: Jotai for atomic state management
- **Data Fetching**: TanStack Query (React Query) with caching
- **Routing**: React Router v7
- **Editor**: TipTap (ProseMirror) with real-time collaboration
- **Internationalization**: i18next with 10+ language support

**Key Features**:

- Real-time collaborative editing using Hocuspocus provider
- Spaces and permissions management with CASL
- File attachments with drag-and-drop
- Search with spotlight interface
- Comments and page history
- Diagrams (Draw.io, Excalidraw, Mermaid)
- Export/import functionality

### Editor Extensions

The `@docmost/editor-ext` package contains custom TipTap extensions for:

- File attachments (images, videos, audio)
- Diagrams and embeds
- Mathematical expressions (KaTeX)
- Callouts and details blocks
- Media handling utilities
- Search and replace functionality

## Database Schema

Uses PostgreSQL with UUID v7 for primary keys. Key entities:

- `workspaces` - Multi-tenant workspaces
- `users` - User accounts with workspace membership
- `spaces` - Collaborative spaces within workspaces
- `pages` - Wiki pages with hierarchical structure
- `page_history` - Version control for pages
- `comments` - Page comments and discussions
- `attachments` - File attachments linked to pages

## Development Guidelines

### Code Organization

- Follow NestJS module structure for backend features
- Use feature-based folders for React components
- Shared utilities go in `lib/` directories
- Types are co-located with features

### Real-time Collaboration

- Backend uses Hocuspocus server for Y.js document synchronization
- Frontend connects via Hocuspocus provider for collaborative editing
- Redis adapter enables horizontal scaling of WebSocket connections

### Enterprise Features

Files in `/ee` directories are under enterprise license and handle:

- Advanced authentication (SSO, MFA)
- Billing and subscription management
- Advanced security features

### Environment Configuration

Requires `.env` file in project root with database and service configurations. See development documentation for setup details.

## Testing Strategy

- Unit tests using Jest for business logic
- E2E tests for critical user flows
- Test files use `.spec.ts` naming convention
- Mock external services in test environment
