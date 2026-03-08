const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 👉 Servir frontend (index.html, CSS, JS)
app.use(express.static(path.join(__dirname, "frontend")));

// Base de datos SQLite
const db = new sqlite3.Database("./db.sqlite");

// ... aquí siguen todas tus rutas de productos, compras, ventas, etc.

// ================== INICIO SERVIDOR ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
