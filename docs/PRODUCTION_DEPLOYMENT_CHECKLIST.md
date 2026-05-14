# SHOSA Production Deployment Checklist

Complete this before full public launch.

1. Production secrets
- DATABASE_URL must use the production database user and password.
- JWT_SECRET must be freshly generated for production.
- JWT_EXPIRES_IN should be set, for example 7d.
- ALLOWED_ORIGINS must list only production frontend domains.
- Do not commit backend/.env.
- Do not put secrets in VITE_ frontend variables.

2. Credential rotation
- Do not use Admin123! anywhere.
- Do not use SeetaPostgres123! anywhere.
- Rotate the PostgreSQL password before production.
- Use a one-time strong SEED_ADMIN_PASSWORD.
- Run seed once, then remove SEED_ADMIN_PASSWORD from persistent production env if not needed.

3. Database
- Use npx prisma migrate deploy in production.
- Do not use prisma db push in production.
- PostgreSQL should listen on 127.0.0.1 unless using a managed database.
- Use a limited-privilege app database user.

4. Backups
- Use scripts/backup.sh as the template.
- Back up the database daily.
- Back up uploads daily.
- Back up private_admin_documents daily.
- Keep at least 30 days of backups.
- Test restore before public launch.

5. Nginx and SSL
- Use HTTPS only.
- Use Let's Encrypt or another trusted certificate.
- Proxy API traffic to 127.0.0.1:5000.
- Set X-Real-IP, X-Forwarded-For, and X-Forwarded-Proto.
- Never expose private_admin_documents directly through Nginx.

6. File storage
- uploads may serve public gallery/profile images.
- private_admin_documents must only be accessed through authenticated admin routes.
- Both folders must be included in backups.

7. SMTP
- Use a transactional email provider.
- Test receipt email after admin payment approval.
- Confirm email failure does not block payment approval.

8. Final pre-launch tests
- Frontend build passes.
- Backend app load passes.
- JWT missing test fails safely.
- Seed password missing test fails safely.
- Login limiter works.
- Registration limiter works.
- Contact limiter works.
- Superadmin login works.
- Alumni login works.
- SACCO registration works.
- Document verification works.
- Payment approval generates receipt.
- Receipt print works.
- Private document upload/download/delete works.
- Audit logs record key actions.

Controlled soft launch is acceptable after staging verification. Full public launch requires production SSL, backups, SMTP, monitoring, and final secret grep cleanup.
