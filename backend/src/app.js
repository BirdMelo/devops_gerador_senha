import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import vaultRoutes from "./routes/vault.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/senhas", vaultRoutes);
app.use(express.static(path.join(__dirname, "../../src"))); // serve o front

export default app;