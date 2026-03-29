import express from "express";
import supabase from "../supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { businessId } = req.body;

  if (!businessId) {
    return res.status(400).json({ error: "Missing businessId" });
  }

  const baseUrl = process.env.APP_URL || "http://localhost:5173";
  const url = `${baseUrl}/${businessId}`;

  const { error } = await supabase
    .from("businesses")
    .update({ deployed_url: url })
    .eq("id", businessId);

  if (error) {
    return res.status(500).json({ error: "Failed to mark business as deployed" });
  }

  res.json({ success: true, url });
});

export default router;
