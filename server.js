require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const BASE = "https://ffglory.pro";
const API_KEY = process.env.FFGLORY_API_KEY;
const MASTER_KEY = process.env.FFGLORY_MASTER_KEY;
const PORT = process.env.PORT || 3000;

function ready() {
  if (!API_KEY || !MASTER_KEY) {
    const e = new Error("Server API keys are not configured. Add them to the private .env file.");
    e.status = 503;
    throw e;
  }
}
async function upstream(pathname, query = {}) {
  ready();
  const url = new URL(BASE + pathname);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && String(v).trim()) url.searchParams.set(k, String(v));
  }
  const response = await fetch(url, {
    method: "GET",
    headers: { "x-api-key": MASTER_KEY, "accept": "application/json" }
  });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { message: body.slice(0, 500) }; }
  if (!response.ok) {
    const e = new Error(data.error || data.message || `FFGlory API returned ${response.status}`);
    e.status = response.status;
    throw e;
  }
  return data;
}
app.get("/api/status", (_req, res) => res.json({
  configured: Boolean(API_KEY && MASTER_KEY),
  mode: "read-only",
  app: "FF GUILD GLORY SIYAM"
}));
app.get("/api/account", async (_req, res, next) => {
  try { res.json(await upstream("/api/auth/me")); } catch (e) { next(e); }
});
app.get("/api/pricing", async (_req, res, next) => {
  try {
    const r = await fetch(BASE + "/api/pricing", { headers: { "accept": "application/json" } });
    const d = await r.json();
    if (!r.ok) throw Object.assign(new Error(d.error || "Pricing request failed"), {status:r.status});
    res.json(d);
  } catch (e) { next(e); }
});
const readRoutes = {
  "/api/groups": "/api/client/my-groups",
  "/api/transactions": "/api/client/transactions",
  "/api/group-history": "/api/client/group-history",
  "/api/activity-log": "/api/client/activity-log",
  "/api/coupons": "/api/client/my-coupons",
  "/api/redeemed-coupons": "/api/client/redeemed-coupons"
};
for (const [route, upstreamPath] of Object.entries(readRoutes)) {
  app.get(route, async (_req, res, next) => {
    try { res.json(await upstream(upstreamPath)); } catch (e) { next(e); }
  });
}
app.get("/api/glory-progression", async (req, res, next) => {
  try {
    const groupId = String(req.query.group_id || "").trim();
    if (!groupId || groupId.length > 128) return res.status(400).json({error:"Valid group_id is required"});
    res.json(await upstream("/api/client/glory-progression", {group_id: groupId}));
  } catch (e) { next(e); }
});
// Deliberately no routes for launching bot groups, farming glory, or changing game data.
app.use((err, _req, res, _next) => {
  console.error("API proxy error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});
app.listen(PORT, () => console.log(`FF Guild Glory Siam running on port ${PORT}`));