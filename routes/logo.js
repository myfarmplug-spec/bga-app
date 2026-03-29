import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// --- LOGO GENERATE ROUTE ---
router.post("/generate", async (req, res) => {
  const { business, style } = req.body;
  if (!business || !business.name || !business.product) {
    return res.status(400).json({ error: "Missing business info" });
  }
  // 5 fixed styles
  const STYLES = [
    "modern clean",
    "bold sales",
    "premium",
    "local trust",
    "tech"
  ];
  // If style is provided, only generate that style (for one-tap upgrade)
  const stylesToGenerate = style ? [style] : [STYLES[0], STYLES[1], STYLES[2]];
  const prompt = `Generate ${stylesToGenerate.length} logo options for this business.\n\nBusiness: ${business.name}\nIndustry: ${business.product}\n\nFor each, use one of these styles: ${stylesToGenerate.join(", ")}.\n\nFor each, return JSON with: font_style, color, icon_idea, style.\n- font_style: font family or description\n- color: hex or color name\n- icon_idea: emoji or short description\n- style: one of: modern clean, bold sales, premium, local trust, tech\n\nAll logos must be minimal, bold, readable, and mobile-first. Limit fonts and colors. Return a JSON array.`;
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });
    const data = await openaiRes.json();
    let content = data.choices?.[0]?.message?.content || "";
    let logos;
    try {
      logos = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      logos = match ? JSON.parse(match[0]) : [];
    }
    res.json(logos);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate logos" });
  }
});

export default router;
