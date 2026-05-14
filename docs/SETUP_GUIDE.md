# Setup Guide

This project is intended to be installed step by step with PowerShell on Windows.

## Known local database settings

```env
DATABASE_URL="postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/DB_NAME"
```

## Main commands

```powershell
cd "C:\path\to\seeta-alumni-setup"
cd backend
npm install
Copy-Item .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev
```

In another terminal:

```powershell
cd "C:\path\to\seeta-alumni-setup\frontend"
npm install
Copy-Item .env.example .env
npm run dev
```
