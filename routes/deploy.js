import express from "express";
import supabase from "../supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { businessId } = req.body;

  if (!businessId) {
    console.error("[deploy] Missing businessId");
    return res.status(400).json({ error: "Missing businessId" });
  }

  // FRONTEND_URL = where the React app lives (Vercel / perfectsand.com)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const url = `${frontendUrl}/site/${businessId}`;

  console.log(`[deploy] Marking business ${businessId} as deployed → ${url}`);

  const { error } = await supabase
    .from("businesses")
    .update({ deployed_url: url })
    .eq("id", businessId);

  if (error) {
    console.error("[deploy] Supabase update failed:", error.message);
    return res.status(500).json({ error: "Failed to mark business as deployed" });
  }

  console.log(`[deploy] Success: ${url}`);
  res.json({ success: true, url });
});

export default router;
