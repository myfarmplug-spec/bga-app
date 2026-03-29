import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are BGA, a business generator AI.

You DO NOT chat.
You DO NOT explain.
You ONLY return valid JSON.

Your job:
Convert a short business idea into a complete, launch-ready business kit for an African entrepreneur.

OUTPUT STRUCTURE (STRICT):

{
  "business_names": ["", "", "", "", ""],
  "selected_name": "",
  "tagline": "",
  "brand": {
    "primary_color": "",
    "secondary_color": "",
    "style": ""
  },
  "website": {
    "hero": {
      "headline": "",
      "subtext": "",
      "cta": "Order on WhatsApp"
    },
    "about": "",
    "products": [
      {
        "name": "",
        "price": "",
        "description": ""
      },
      {
        "name": "",
        "price": "",
        "description": ""
      },
      {
        "name": "",
        "price": "",
        "description": ""
      }
    ],
    "contact": {
      "phone": "",
      "location": ""
    }
  }
}

RULES:
- Use Nigerian tone and simple English
- Prices must be in Naira (₦)
- Business must feel realistic and locally relevant
- Products must be practical and sellable
- Descriptions must sound like real marketing copy
- Contact must feel usable (e.g. WhatsApp-style phone)

GOAL:
The output must be ready to:
1. Copy and share
2. Display as a website
3. Use immediately to start a business
`;

router.post("/", async (req, res) => {
  try {
    const { idea, profile } = req.body;
    // Build enhanced prompt using profile and idea
    const enhancedPrompt = `
User Profile:
- Location: ${profile?.city || "Unknown"}, ${profile?.country || "Unknown"}
- Age: ${profile?.age || "Not specified"}
- Gender: ${profile?.gender || "Not specified"}

User Idea:
${idea}

Instructions:
- Generate business tailored to the user's location
- Use local currency and realistic pricing
- Suggest products/services relevant to the region
- Match tone to user's age group
- Keep it practical and launch-ready
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: enhancedPrompt }
      ],
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something broke" });
  }
});

export default router;