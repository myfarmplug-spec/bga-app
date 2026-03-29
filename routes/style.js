import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const STYLE_PROMPT = `
You are a UI style configurator.
You ONLY return valid JSON. No chat. No explanation.

Convert a natural language description into a structured style config.

OUTPUT STRUCTURE (STRICT):
{
  "primary_color": "<hex color>",
  "accent_color": "<hex color>",
  "font_style": "normal" | "bold" | "light",
  "theme": "dark" | "light" | "minimal" | "luxury" | "vibrant",
  "layout": "default" | "centered",
  "tone": "modern" | "premium" | "playful" | "minimal" | "luxury"
}

RULES:
- primary_color: dominant UI color (buttons, borders, highlights)
- accent_color: secondary highlight (text gradients, prices)
- font_style: "bold" for impactful, "light" for minimal, "normal" for default
- theme: overall aesthetic mood
- layout: "centered" if the user wants centered text layout
- tone: affects spacing and padding density
- Colors MUST be valid 6-digit hex codes (e.g. #7c3aed)
- If user says "gold/luxury" → primary: #b8860b, accent: #d4af37
- If user says "black/dark" → primary: #111827, accent: #374151
- If user says "green" → primary: #059669, accent: #10b981
- If user says "blue" → primary: #1d4ed8, accent: #3b82f6
- If user says "red" → primary: #dc2626, accent: #ef4444
- Always preserve unmentioned fields from the "current" config if provided
`;

router.post("/", async (req, res) => {
  try {
    const { prompt, current = {} } = req.body;

    const userMsg = current && Object.keys(current).length > 0
      ? `Current config: ${JSON.stringify(current)}\n\nUser request: ${prompt}`
      : `User request: ${prompt}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: STYLE_PROMPT },
        { role: "user",   content: userMsg },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error("Style error:", error);
    res.status(500).json({ error: "Style generation failed." });
  }
});

export default router;
