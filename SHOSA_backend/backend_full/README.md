# SHOSA active backend

This is the active backend folder for the SHOSA project.

## Start

```bash
cp .env.example .env
npm install
npm start
```

## Main files

- `server.js` — active API server
- `init_schema.sql` — schema reference file
- `verifySchema.js` — helper check script
- `uploads/.gitkeep` — placeholder so uploads folder exists without publishing files

## Before production

- set a strong `JWT_SECRET`
- replace demo admin placeholders
- confirm frontend origin values for CORS
- confirm upload and event image paths
- choose the final database strategy and remove unused helpers


