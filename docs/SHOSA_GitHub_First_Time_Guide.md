# SHOSA GitHub First-Time Guide

This guide matches the final cleaned project package you are about to upload.

## 1. Create your GitHub account and repository

1. Sign in to GitHub.
2. Click **New repository**.
3. Repository name: `shosa-alumni-sacco`.
4. Keep it **Private** for your first upload.
5. Do not add a README, `.gitignore`, or license from GitHub because this project already includes them.
6. Create the repository.

## 2. Confirm what you are uploading

In this cleaned package, the main folders are:

- `SHOSA_frontend`
- `SHOSA_backend/backend_full`
- `docs`
- `README.md`
- `.gitignore`

The package already excludes the main risky items such as local runtime databases, uploads, and real env secrets.

## 3. Put your real local `.env` outside Git tracking

Inside `SHOSA_backend/backend_full`, do this locally:

```bash
cp .env.example .env
```

Then edit `.env` with your real values. Do not upload `.env`.

## 4. Upload with Git from your computer

Open a terminal in the project root and run:

```bash
git init
git branch -M main
git add .
git commit -m "Initial SHOSA project upload"
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## 5. After the first push

Check on GitHub that these are **not** visible:

- `.env`
- database files such as `*.db`
- uploaded files
- personal data exports
- random backup zip files

## 6. Best way to use GitHub well as a beginner

Use this simple rhythm:

1. Pull latest work before changes: `git pull`
2. Make one small group of changes
3. Commit with a clear message
4. Push the changes

Good commit examples:

- `Add alumni profile update validation`
- `Clean admin dashboard spacing`
- `Fix SACCO payment success message`

## 7. Use branches when doing larger work

For safer edits:

```bash
git checkout -b feature/store-page
```

Work there, then push:

```bash
git push -u origin feature/store-page
```

Later you can open a Pull Request on GitHub to merge into `main`.

## 8. Use Issues so GitHub becomes your project notebook

Create issues like:

- Clean duplicate backend helpers
- Add store management page
- Improve SACCO payment audit trail
- Move API base URL into one shared frontend config

## 9. Use Releases for stable milestones