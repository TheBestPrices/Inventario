const express = require("express");
const { Pool } = require("pg");   // 👈 usamos pg en lugar de sqlite3
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 👉 Servir frontend (index.html, CSS, JS)
app.use(express.static(path.join(__dirname, "frontend")));

// Conexión a Supabase (usa la variable de entorno DATABASE_URL en Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Crear tablas si no existen
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      nombre TEXT,
      categoria TEXT,
      precio REAL,
      stock INTEGER
    )
  `);
})();

// ================== RUTAS ==================

// Registrar producto
app.post("/productos", async (req, res) => {
  const { nombre, categoria, descripcion, imagen_url, precio, stock, codigo} = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, categoria, descripcion, imagen_url, precio, stock) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [nombre, categoria, descripcion, imagen_url, precio, stock, codigo]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar productos
app.get("/productos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos");
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================== INICIO SERVIDOR ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
