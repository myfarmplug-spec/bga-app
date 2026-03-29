import express from "express";
const router = express.Router();

// Mock domain check logic
router.post("/check", async (req, res) => {
  const { domain } = req.body;
  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ available: false, price: null, error: "Invalid domain" });
  }
  // Mock: domains ending with 'xyz' are taken, others are available
  const taken = domain.endsWith(".xyz");
  const available = !taken;
  const price = available ? 12.99 : null;
  // Mock suggestions
  const suggestions = taken ? [
    domain.replace(/\.xyz$/, ".com"),
    domain.replace(/\.xyz$/, ".net"),
    domain.replace(/\.xyz$/, ".co")
  ] : [];
  res.json({ available, price, suggestions });
});

export default router;
