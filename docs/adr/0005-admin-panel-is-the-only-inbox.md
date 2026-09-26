# The admin panel is the only inbox

No new order or custom inquiry triggers an email or Telegram push to staff. Staff learn about incoming work only by opening the admin panel. Decided deliberately for v1 to avoid external notification dependencies (bot tokens, SMTP from an Iranian VPS) that could fail silently and cause missed orders nobody notices. If the panel proves too easy to ignore, notifications graduate into their own decision later.
