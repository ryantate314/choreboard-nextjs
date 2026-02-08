# TaterBase

A Next.js home management dashboard for tracking chores, inventory, and more.

## Development

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your database connection:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/taterbase"
   ```

3. Run database migrations and seed:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at http://localhost:3001

## Deployment

The application is published to a Docker image. The following environment variables are required:

|Name|Value|
|---|---|
|DATABASE_URL|A Postgres URL|