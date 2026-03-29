import express from "express";
const router = express.Router();

router.post("/upgrade-request", async (req, res) => {
  const { user } = req.body;
  console.log("Upgrade request from:", user.email);
  res.json({ success: true });
});

export default router;
