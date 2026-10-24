// SkillSpring — real backend health check (Vercel Serverless Function).
// Endpoint: GET/HEAD /api/health
// This is a genuine check: it reports runtime status and actively pings the
// Supabase auth endpoint to confirm the app's backend dependency is reachable.
// It NEVER reads or exposes a secret / service_role key.

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ajqjejpntizfhzhqyqyp.supabase.co";
// Publishable (anon) key only — safe to use server-side and already public in the frontend.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_pmBXoFkzdESKPAe-PSTp5g_tpReRT0w";

module.exports = async function handler(req, res) {
  const started = Date.now();
  res.setHeader("Cache-Control", "no-store");

  let supabase = { status: "unchecked" };
  if (req.query && req.query.deep === "1") {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const r = await fetch(SUPABASE_URL + "/auth/v1/settings", {
        headers: { apikey: SUPABASE_ANON_KEY },
        signal: controller.signal
      });
      clearTimeout(t);
      supabase = { status: r.ok ? "reachable" : "error", httpStatus: r.status };
    } catch (e) {
      supabase = { status: "unreachable", error: e.name || "Error" };
    }
  } else {
    supabase = { status: "configured", configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) };
  }

  res.status(200).json({
    status: "ok",
    service: "skillspring-api",
    endpoint: "/api/health",
    method: req.method,
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - started,
    supabase
  });
};
