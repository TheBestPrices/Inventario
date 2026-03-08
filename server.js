const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 👉 Servir frontend (index.html, CSS, JS)
app.use(express.static(path.join(__dirname, "frontend")));

// 👉 Servir imágenes subidas
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Conexión a Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Crear tablas si no existen (ajustado a tu estructura real)
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      nombre TEXT,
      categoria TEXT,
      descripcion TEXT,
      imagen_url TEXT,
      codigo TEXT,
      precio REAL,
      stock INTEGER
    )
  `);
})();

// ================== RUTAS ==================

// Registrar producto con foto
app.post("/productos", upload.single("imagen"), async (req, res) => {
  const { nombre, categoria, descripcion, precio, stock, codigo } = req.body;
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, categoria, descripcion, imagen_url, precio, stock, codigo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [nombre, categoria, descripcion, imagen_url, precio, stock, codigo]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
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

// Buscar producto por ID
app.get("/productos/id/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

// ================== INICIO SERVIDOR ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
