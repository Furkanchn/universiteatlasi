# Repository Guidelines

## Project Structure & Module Organization

This is a full-stack university atlas project. `backend/` contains the Spring Boot API: Java code is in `backend/src/main/java`, tests in `backend/src/test/java`, configuration in `backend/src/main/resources`, and Flyway migrations in `backend/src/main/resources/db/migration`. `frontend/` contains the React + TypeScript + Vite app, with pages, UI components, stores, helpers, and API clients under `frontend/src`. Static images live in `frontend/src/assets`. `database/` holds import scripts, snapshots, Prisma reference files, and data-quality utilities. `docs/` contains setup, roadmap, and data pipeline notes.

## Build, Test, and Development Commands

```powershell
docker compose up -d
```
Starts PostgreSQL and Redis for local development.

```powershell
cd backend
mvn spring-boot:run
mvn test
```
Runs the API on `http://localhost:8080` and executes backend tests.

```powershell
cd frontend
npm install
npm run dev
npm run build
```
Installs frontend dependencies, starts Vite on `http://localhost:5173`, and runs TypeScript plus production build checks.

## Coding Style & Naming Conventions

Use Java 17 conventions in the backend with 4-space indentation. Keep responsibilities separated: controllers handle HTTP, services hold business logic, repositories handle persistence, DTOs define API contracts, and entities map database tables. React components use PascalCase file names, hooks/helpers use camelCase, and shared API types belong in `frontend/src/services/api.ts`. Use 2-space indentation in TypeScript/JSX. Flyway migrations must be append-only and named like `V33__short_description.sql`.

## Testing Guidelines

Backend tests use JUnit and Spring Boot Test. Name test classes `*Test.java` and place them in the matching package under `backend/src/test/java`. Run `mvn test` after backend, API, service, repository, or migration changes. Run `npm run build` after frontend changes. Add focused tests for ranking logic, filters, preference lists, and public API behavior.

## Commit & Pull Request Guidelines

This repository currently has no commit history, so no strict convention is established. Use concise imperative commit messages, for example `Add wizard city filter` or `Fix preference list ordering`. Pull requests should include a short summary, verification commands, migration notes if applicable, linked issues, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit real secrets, tokens, API keys, or private data dumps. Keep local-only configuration in ignored environment files or shell variables. Treat scripts in `database/` as data-mutating tools; preview inputs and keep rollback notes before running them against important data.
