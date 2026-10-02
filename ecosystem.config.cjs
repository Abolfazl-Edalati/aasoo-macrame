/**
 * PM2 Process Manager Configuration — Gereh Storefront (SPEC §9).
 *
 * Requirements:
 * - Persistent Node process on Iranian VPS behind nginx/Caddy.
 * - Build: pnpm build
 * - Start: pm2 start ecosystem.config.cjs
 * - Boot survival:
 *     pm2 startup
 *     (run the command printed in terminal)
 *     pm2 save
 */

module.exports = {
  apps: [
    {
      name: "gereh",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "https://gereh.shop",
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
