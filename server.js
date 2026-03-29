console.log("GoDaddy Key:", process.env.GODADDY_KEY);
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import generateRoute from "./routes/generate.js";
import deployRoute   from "./routes/deploy.js";
import styleRoute    from "./routes/style.js";
import domainRoute   from "./routes/domain.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/generate", generateRoute);
app.use("/api/deploy",   deployRoute);
app.use("/api/style",    styleRoute);
app.use("/api/domain",   domainRoute);

app.listen(3000, () => {
  console.log("BGA running on http://localhost:3000");
});