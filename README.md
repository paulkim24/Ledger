# Ledger

Ledger is a simple payment and double-entry ledger demo. It tracks accounts, records payments between them, and keeps balances in sync using basic double-entry accounting rules.

## Features

- Create and list accounts (e.g., user and merchant).
- Record payments from one account to another.
- Automatically update account balances using double-entry entries.
- View a payments table and current balances in a small web UI.

## Tech Stack

- Backend: Node.js, TypeScript, Express, Knex
- Database: PostgreSQL
- Frontend: React, TypeScript, Vite
- Dev tools: Docker (Postgres container), ts-node-dev

## Project Structure

```text
.
├── backend
│   ├── src
│   │   ├── index.ts        # Express server
│   │   ├── db.ts           # Knex/Postgres connection
│   │   └── routes.ts       # API routes for accounts/payments
│   ├── schema.sql          # Database schema (accounts, payments, ledger_entries)
│   ├── package.json
│   └── tsconfig.json
└── frontend
    ├── src
    │   ├── App.tsx         # Main React component
    │   └── main.tsx        # Entry point
    ├── index.html
    └── package.json
```

## Prerequisites

- Node.js (LTS)
- Docker + Docker Compose (or local PostgreSQL)
- npm or yarn

## Setup

### Clone and install backend

```bash
cd backend
npm install
```

### Start Postgres in Docker

Example using a container named ledger-postgres:

```bash
docker run --name ledger-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### Create database

```bash
docker exec -it ledger-postgres psql -U postgres -c "CREATE DATABASE ledger;"
```

### Apply schema

From the backend folder (where schema.sql lives):

```bash
cd backend
type schema.sql | docker exec -i ledger-postgres psql -U postgres -d ledger
```

### Configure environment

Create a `.env` file in backend:

```text
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ledger
```

### Install frontend dependencies

```bash
cd frontend
npm install
```

## Running the App

### Backend API

```bash
cd backend
npm run dev
```

This starts the TypeScript Express server (usually on http://localhost:4000).

### Frontend

```bash
cd frontend
npm run dev
```

This starts the Vite development server (usually on http://localhost:5173).

The UI should show:

- A list of demo accounts (e.g., Alice and Bob).
- Current balance for the selected account.
- A button to create a demo payment between the first two accounts.
- A payments table listing recent transactions.

## API Overview

Example routes (adjust to match your code):

- `GET /accounts` – list accounts
- `POST /accounts` – create account
- `GET /payments` – list payments
- `POST /payments` – create payment between two accounts

Each payment creates corresponding ledger entries to keep accounts balanced.

## Development Notes

- Uses double-entry concepts (debit/credit) but kept intentionally simple for a portfolio/demo project.
- Good base for expanding into a more full-featured fintech or budgeting app:
  - Authentication and users
  - Categories and reports
  - Import/export of transactions
  - Real-time updates via WebSockets


