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

import supabase from "../supabase.js";
// Memory structure helper
function getDefaultMemory() {
  return {
    improvements: [],
    performance: { clicks: 0, visits: 0, conversion: 0 },
    preferences: { style: "premium", tone: "friendly" },
    history: []
  };
}

router.post("/", async (req, res) => {
  try {
    const { idea, profile, businessId, memory: clientMemory, user_id } = req.body;
    console.log(`[generate] idea="${idea?.slice(0, 60)}" user_id=${user_id || "guest"} businessId=${businessId || "new"}`);
    // Fetch memory from DB if businessId provided
    let memory = getDefaultMemory();
    if (businessId) {
      const { data, error } = await supabase.from("businesses").select("memory").eq("id", businessId).single();
      if (!error && data && data.memory) memory = { ...memory, ...data.memory };
    } else if (clientMemory) {
      memory = { ...memory, ...clientMemory };
    }

    // Build enhanced prompt using memory, profile, and idea
    const enhancedPrompt = `
User Profile:
- Location: ${profile?.city || "Unknown"}, ${profile?.country || "Unknown"}
- Age: ${profile?.age || "Not specified"}
- Gender: ${profile?.gender || "Not specified"}

User Preferences:
- Style: ${memory.preferences?.style || "premium"}
- Tone: ${memory.preferences?.tone || "friendly"}

Business Memory:
- Last improvements: ${memory.improvements?.map(i => i.change).join(", ") || "None"}
- Last performance: ${memory.performance?.conversion ? `Conversion rate: ${memory.performance.conversion}` : "No data"}

User Idea:
${idea}

Instructions:
- Generate business tailored to the user's location and preferences
- Use local currency and realistic pricing
- Suggest products/services relevant to the region
- Match tone to user's age group
- Improve clarity and conversion if previous performance was low
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

    let resolvedBusinessId = businessId || null;

    if (businessId) {
      // Existing business: update memory history (single fetch — no duplicate)
      const { data: bizData, error: bizErr } = await supabase
        .from("businesses").select("memory").eq("id", businessId).single();
      const mem = getDefaultMemory();
      if (!bizErr && bizData?.memory) Object.assign(mem, bizData.memory);
      mem.history = [{ action: "generate", idea, timestamp: Date.now() }, ...(mem.history || [])];
      await supabase.from("businesses").update({ memory: mem }).eq("id", businessId);
    } else if (user_id) {
      // New business: save to Supabase so it appears in Dashboard
      const { data: saved, error: saveErr } = await supabase
        .from("businesses")
        .insert([{
          user_id,
          name:    result.selected_name || "Untitled",
          tagline: result.tagline       || "",
          data:    result,
        }])
        .select("id")
        .single();
      if (!saveErr && saved) resolvedBusinessId = saved.id;
    }

    console.log(`[generate] Done — name="${result.selected_name}" businessId=${resolvedBusinessId}`);
    res.json({ ...result, businessId: resolvedBusinessId });

  } catch (error) {
    console.error("[generate] Error:", error.message);
    res.status(500).json({ error: "Generation failed. Please try again." });
  }
});

export default router;