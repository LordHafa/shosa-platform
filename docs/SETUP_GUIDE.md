# Setup Guide

This project is intended to be installed step by step with PowerShell on Windows.

## Known local database settings

```env
DATABASE_URL="postgresql://postgres:SeetaPostgres123!@localhost:5433/seeta_db"
```

## Main commands

```powershell
cd "C:\Users\MY PC\OneDrive\Desktop\seeta-alumni-setup"
cd backend
npm install
Copy-Item .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev
```

In another terminal:

```powershell
cd "C:\Users\MY PC\OneDrive\Desktop\seeta-alumni-setup\frontend"
npm install
Copy-Item .env.example .env
npm run dev
```
