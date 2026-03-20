import express from "express";
import cors from "cors";

import licencaRoutes from "./src/routers/licencaRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`🖥️ Server API licenças! 🌐`);
});

app.use("/api/licenca", licencaRoutes);

app.listen(3123, () => {
  console.log("Servidor de licenças rodando");
});