import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// --- SOCIAL MESSAGE GENERATE ROUTE ---
router.post("/generate", async (req, res) => {
  const { business } = req.body;
  if (!business || !business.name || !business.product) {
    return res.status(400).json({ error: "Missing business info" });
  }
  const prompt = `Generate WhatsApp and Instagram messages for this business:\n\nBusiness name: ${business.name}\nProduct: ${business.product}\n\nReturn JSON with keys: whatsapp_direct, whatsapp_broadcast, instagram_caption, status_post.\nKeep it simple, persuasive, and local-market friendly.`;
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
    let messages;
    try {
      messages = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      messages = match ? JSON.parse(match[0]) : {};
    }
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate messages" });
  }
});

export default router;
