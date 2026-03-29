import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// --- EMAIL GENERATE ROUTE ---
router.post("/generate", async (req, res) => {
  const { business } = req.body;
  if (!business || !business.name || !business.product) {
    return res.status(400).json({ error: "Missing business info" });
  }
  const prompt = `Generate 4 business emails:\n1. Welcome email\n2. Promotional email\n3. Order confirmation\n4. Re-engagement email\nBusiness name: ${business.name}\nProduct: ${business.product}\nTone: modern, simple, African market friendly\nReturn JSON format.`;
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
    // Try to parse JSON from response
    let emails;
    try {
      emails = JSON.parse(content);
    } catch {
      // fallback: try to extract JSON
      const match = content.match(/\{[\s\S]*\}/);
      emails = match ? JSON.parse(match[0]) : {};
    }
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate emails" });
  }
});

// --- EMAIL SEND ROUTE ---
router.post("/send", async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "BGA <onboarding@yourdomain.com>",
        to,
        subject,
        html
      })
    });
    if (!resendRes.ok) throw new Error("Resend failed");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
