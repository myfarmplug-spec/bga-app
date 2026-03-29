import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// --- FLYER GENERATE ROUTE ---
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
  const prompt = `Generate ${stylesToGenerate.length} flyer options for this business.\n\nBusiness: ${business.name}\nProduct: ${business.product}\n\nFor each, use one of these styles: ${stylesToGenerate.join(", ")}.\n\nFor each, return JSON with: headline, subtext, call_to_action, color_theme, style.\n- headline: max 2 lines, bold\n- subtext: max 2 lines, clear\n- call_to_action: short, strong\n- color_theme: hex or gradient\n- style: one of: modern clean, bold sales, premium, local trust, tech\n\nKeep all designs minimal, high-contrast, mobile-friendly, and never cluttered. Limit fonts and colors. Return a JSON array.`;
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
    let flyers;
    try {
      flyers = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      flyers = match ? JSON.parse(match[0]) : [];
    }
    res.json(flyers);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate flyer" });
  }
});

export default router;
