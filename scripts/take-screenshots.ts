import fs from "node:fs";
import path from "node:path";
import cp from "node:child_process";
import crypto from "node:crypto";
import Database from "better-sqlite3";

interface StaffRow {
  id: number;
}

interface CdpTarget {
  type: string;
  webSocketDebuggerUrl: string;
}

interface CdpMessage {
  id?: number;
  result?: {
    data?: string;
  };
  error?: unknown;
}

async function main() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const outDir = path.resolve("docs/screenshots");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Create a staff session token in gereh.db
  const db = new Database("gereh.db");
  const staff = db.prepare("SELECT id FROM staff_users WHERE username = 'admin'").get() as StaffRow | undefined;
  if (!staff) {
    console.error("Staff admin user not found");
    process.exit(1);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenSha256 = crypto.createHash("sha256").update(rawToken).digest("hex");
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 30 * 24 * 3600;

  db.prepare(`
    INSERT INTO sessions (token_sha256, subject_type, subject_id, expires_at, created_at)
    VALUES (?, 'staff', ?, ?, ?)
  `).run(tokenSha256, staff.id, expiresAt, now);

  console.log("Created staff session token");

  // 2. Launch Edge with remote debugging port
  const tmpProfile = path.resolve(".scratch/edge-profile");
  if (!fs.existsSync(tmpProfile)) fs.mkdirSync(tmpProfile, { recursive: true });

  const edgeProc = cp.spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    `--user-data-dir=${tmpProfile}`,
    "about:blank",
  ]);

  // Wait for Edge CDP port to be open
  let wsUrl: string | null = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      const data = (await res.json()) as { webSocketDebuggerUrl?: string };
      wsUrl = data.webSocketDebuggerUrl ?? null;
      if (wsUrl) break;
    } catch {
      // retry
    }
  }

  if (!wsUrl) {
    console.error("Failed to connect to Edge CDP");
    edgeProc.kill();
    process.exit(1);
  }

  console.log("Connected to Edge CDP at", wsUrl);

  const targetsRes = await fetch("http://127.0.0.1:9222/json/list");
  const targets = (await targetsRes.json()) as CdpTarget[];
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map<number, (res: CdpMessage) => void>();

  ws.onmessage = (event) => {
    const msg = JSON.parse(String(event.data)) as CdpMessage;
    if (msg.id && pending.has(msg.id)) {
      const cb = pending.get(msg.id);
      pending.delete(msg.id);
      cb?.(msg);
    }
  };

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  function send(method: string, params: Record<string, unknown> = {}): Promise<CdpMessage["result"]> {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, (res) => {
        if (res.error) reject(new Error(JSON.stringify(res.error)));
        else resolve(res.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Set cookie for authenticated admin pages
  await send("Network.setCookie", {
    name: "gereh_session",
    value: rawToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });

  const screenshots = [
    { name: "storefront-home.png", url: "http://localhost:3001/" },
    { name: "storefront-shop.png", url: "http://localhost:3001/shop" },
    { name: "storefront-product.png", url: "http://localhost:3001/product/%D8%AF%DB%8C%D8%AF%D9%87-%DB%B8%DB%B0" },
    { name: "storefront-cart.png", url: "http://localhost:3001/cart" },
    { name: "admin-dashboard.png", url: "http://localhost:3001/admin" },
    { name: "admin-orders.png", url: "http://localhost:3001/admin/orders" },
    { name: "admin-products.png", url: "http://localhost:3001/admin/products" },
    { name: "admin-custom-orders.png", url: "http://localhost:3001/admin/custom-orders" },
  ];

  for (const item of screenshots) {
    console.log(`Navigating to ${item.url}...`);
    await send("Page.navigate", { url: item.url });
    await new Promise((r) => setTimeout(r, 2000));
    const result = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(result?.data ?? "", "base64");
    const dest = path.join(outDir, item.name);
    fs.writeFileSync(dest, buffer);
    console.log(`Saved ${item.name} (${buffer.length} bytes)`);
  }

  ws.close();
  edgeProc.kill();
  if (fs.existsSync(tmpProfile)) {
    fs.rmSync(tmpProfile, { recursive: true, force: true });
  }
  console.log("All screenshots completed successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
