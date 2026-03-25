const express = require("express");
const cors = require("cors");
const path = require("node:path");

const { PUBLIC_DIR } = require("./config/env");
const routes = require("./routes/index.routes");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(routes);
  app.use(express.static(PUBLIC_DIR));

  app.get("/", (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });

  app.get("/index.html", (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });

  app.use((req, res) => {
    res.status(404).json({ error: `Ruta no encontrada: ${req.path}` });
  });

  app.use((error, _req, res, _next) => {
    res.status(500).json({ error: error.message || "Error interno" });
  });

  return app;
}

module.exports = { createApp };
