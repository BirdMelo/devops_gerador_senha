import express from "express";
import path from "node:path";
import authRoutes from "./routes/auth.js";
import vaultRoutes from "./routes/vault.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/senhas", vaultRoutes);
app.use(express.static(path.join(process.cwd(), "src"))); // serve o front

export default app;