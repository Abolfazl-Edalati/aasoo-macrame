# Deployment & Operations Guide — Gereh (گِرِه)

This document describes how to deploy, operate, and maintain Gereh on an Iranian VPS per **SPEC §9** and **ADR-0003**.

## 1. System Architecture

- **Host**: Iranian VPS running Linux (Ubuntu 22.04 / 24.04 LTS recommended).
- **Process**: Persistent Node.js process managed by **PM2** (`pnpm build && pnpm start`).
- **Reverse Proxy**: Nginx or Caddy terminating TLS on ports 80/443, proxying to `http://127.0.0.1:3000`.
- **Database**: Single SQLite database file in WAL mode (`gereh.db`).
- **Media**: Persistent local directory `uploads/` served via the `/uploads/[...path]` route handler.
- **Background Cron**: System crontab running `scripts/cron.ts` every 15 minutes.
- **Backups**: Nightly online backup (`sqlite3 .backup` + uploads tarball) with 7-day retention and off-box copy.

---

## 2. Environment Variables

Create `.env` in the project root based on `.env.example`:

```bash
# Public URL
NEXT_PUBLIC_BASE_URL=https://gereh.shop

# Database file location
DATABASE_PATH=gereh.db

# Initial staff user (seeded once)
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=strong-password-here
SEED_ADMIN_DISPLAY_NAME=مدیر کارگاه

# SMS Provider (Kavenegar primary, FarazSMS fallback)
# Production boot guard will refuse to start if SMS_SEND=false in production!
SMS_SEND=true
KAVENEGAR_API_KEY=your-kavenegar-key
FARAZSMS_API_KEY=your-farazsms-key

# ZarinPal Gateway
ZARINPAL_MERCHANT_ID=your-terminal-merchant-id
ZARINPAL_BASE_URL=https://payment.zarinpal.com

# Off-box backup sync
REMOTE_BACKUP_DEST=user@backup-host.ir:/backups/gereh/
```

---

## 3. Installation & Build

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Database migrations and initial seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 3. Production build
pnpm build
```

---

## 4. PM2 Process Manager

Start the application with PM2 using `ecosystem.config.cjs`:

```bash
# Start application
pm2 start ecosystem.config.cjs

# Enable automatic start on system boot
pm2 startup
# (Run the generated sudo env command printed by PM2)
pm2 save

# Check status and logs
pm2 status
pm2 logs gereh
```

---

## 5. Crontab Configuration

Install crontab entries for the 15-minute reconciliation cron and nightly backup:

```bash
crontab -e
```

Add the following (see `deploy/crontab.example`):

```cron
# 1. Reconciliation Cron — every 15 min
*/15 * * * * cd /opt/gereh && pnpm tsx scripts/cron.ts >> /var/log/gereh/cron.log 2>&1

# 2. Nightly Backup — daily at 03:00 AM
0 3 * * * /opt/gereh/scripts/backup.sh >> /var/log/gereh/backup.log 2>&1
```

---

## 6. Backup & Disaster Recovery

The script `scripts/backup.sh` performs atomic SQLite backup via `sqlite3 .backup` without stopping the application, archives `uploads/`, prunes backups older than 7 days, and syncs to a remote server.

To restore from a backup:

```bash
# 1. Stop application
pm2 stop gereh

# 2. Unpack backup archive
tar -xzf /path/to/backups/gereh_backup_TIMESTAMP.tar.gz -C /tmp/restore/

# 3. Restore database and uploads
cp /tmp/restore/gereh.db /opt/gereh/gereh.db
cp -r /tmp/restore/uploads/* /opt/gereh/uploads/

# 4. Restart application
pm2 start gereh
```

---

## 7. Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name gereh.shop www.gereh.shop;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gereh.shop www.gereh.shop;

    ssl_certificate /etc/letsencrypt/live/gereh.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gereh.shop/privkey.pem;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
