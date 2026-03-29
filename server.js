
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";
import supabase from "./supabase.js";

import generateRoute from "./routes/generate.js";
import deployRoute   from "./routes/deploy.js";
import styleRoute    from "./routes/style.js";
import emailsRoute   from "./routes/emails.js";
import upgradeRoute  from "./routes/upgrade.js";

const app = express();

// ── Middleware (MUST be before all routes) ───────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ── Rate limiting — protect AI endpoints from abuse ──────────────────────────
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a moment and try again." },
});
app.use("/api/generate", generateLimiter);
app.use("/api/emails",   generateLimiter);

// --- DOMAIN MARK LIVE (PAID) ---
app.post("/api/domain/mark-live", async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });
  try {
    const { error } = await supabase.from("businesses").update({
      domain_status: "connected",
      domain_paid: true
    }).eq("custom_domain", domain);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update domain status" });
  }
});
// --- DOMAIN PURCHASE STUB ROUTE ---
app.post("/api/domain/purchase", async (req, res) => {
  const { domain } = req.body;
  // TEMP: simulate purchase
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({
    success: true,
    message: "Domain reserved"
  });
});
// --- DOMAIN STATUS CHECK ROUTE (Vercel) ---
app.get("/api/domain/status", async (req, res) => {
  const { domain } = req.query;

  try {
    const response = await fetch(
      `https://api.vercel.com/v6/domains/${domain}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`
        }
      }
    );

    const data = await response.json();

    res.json({
      verified: data.verified,
      configured: data.configured
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Status check failed" });
  }
});

// --- DOMAIN CONNECT ROUTE (Vercel) ---
app.post("/api/domain/connect", async (req, res) => {
  const { domain } = req.body;

  try {
    // Update DB: mark as connecting
    await supabase.from("businesses").update({
      custom_domain: domain,
      domain_status: "connecting"
    }).eq("custom_domain", domain);

    const response = await fetch(
      `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: domain
        })
      }
    );

    const data = await response.json();

    // If Vercel returns domain, mark as connected
    if (data && data.name) {
      await supabase.from("businesses").update({
        domain_status: "connected"
      }).eq("custom_domain", domain);
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Vercel error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to connect domain"
    });
  }
});


app.use("/api", upgradeRoute);

// GoDaddy domain check route
app.post("/api/domain/check", async (req, res) => {
  const { domain } = req.body;
  try {
    const response = await fetch(
      `https://api.ote-godaddy.com/v1/domains/available?domain=${domain}`,
      {
        method: "GET",
        headers: {
          Authorization: `sso-key ${process.env.GODADDY_KEY}:${process.env.GODADDY_SECRET}`
        }
      }
    );
    const data = await response.json();
    res.json({
      available: data.available,
      price: data.price ? data.price / 1000000 : 8500 // convert micros → normal
    });
  } catch (error) {
    console.error("GoDaddy error:", error);
    res.status(500).json({ error: "Domain check failed" });
  }
});


import messagesRoute from "./routes/messages.js";
app.use("/api/messages", messagesRoute);

import flyerRoute from "./routes/flyer.js";
import logoRoute from "./routes/logo.js";
app.use("/api/flyer", flyerRoute);
app.use("/api/logo", logoRoute);
app.use("/api/generate", generateRoute);

app.use("/api/deploy",   deployRoute);
app.use("/api/style",    styleRoute);

// Email Kit routes
app.use("/api/emails", emailsRoute);

app.listen(3000, () => {
  console.log("BGA running on http://localhost:3000");
});