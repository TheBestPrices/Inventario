const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 👉 Servir frontend (index.html, CSS, JS)
app.use(express.static(path.join(__dirname, "frontend")));

// Configuración de multer (memoria en vez de disco)
const upload = multer({ storage: multer.memoryStorage() });

// Conexión a Postgres (Supabase DB)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Conexión a Supabase Storage
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Crear tablas si no existen
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      nombre TEXT,
      categoria TEXT,
      precio REAL,
      stock INTEGER,
      descripcion TEXT,
      imagen_url TEXT,
      codigo TEXT
    );
    CREATE TABLE IF NOT EXISTS compras (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER,
      cantidad INTEGER,
      costo REAL,
      fecha TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ventas (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER,
      cantidad INTEGER,
      precio REAL,
      fecha TIMESTAMP DEFAULT NOW()
    );
  `);
})();

// ================== RUTAS ==================

// Registrar producto con foto
app.post("/productos", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, categoria, descripcion, precio, stock, codigo } = req.body;
    let imagen_url = null;

    if (req.file) {
      const { data, error } = await supabase.storage
        .from("imagenes")
        .upload(`productos/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("imagenes")
        .getPublicUrl(data.path);

      imagen_url = publicUrl.publicUrl;
    }

    const result = await pool.query(
      `INSERT INTO productos (nombre, categoria, descripcion, imagen_url, precio, stock, codigo) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nombre, categoria, descripcion, imagen_url, parseFloat(precio), parseInt(stock), codigo]
    );

    res.json(result.rows[0]);
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

// Buscar producto por código
app.get("/productos/codigo/:codigo", async (req, res) => {
  const { codigo } = req.params;
  try {
    const result = await pool.query("SELECT * FROM productos WHERE codigo=$1", [codigo]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

// Buscar producto por ID
app.get("/productos/id/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM productos WHERE id=$1", [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error en la búsqueda por ID" });
  }
});

// Registrar compra
app.post("/compras", async (req, res) => {
  const { producto_id, cantidad, costo } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO compras (producto_id, cantidad, costo) VALUES ($1,$2,$3) RETURNING *`,
      [producto_id, cantidad, costo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Registrar venta
app.post("/ventas", async (req, res) => {
  const { producto_id, cantidad, precio } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO ventas (producto_id, cantidad, precio) VALUES ($1,$2,$3) RETURNING *`,
      [producto_id, cantidad, precio]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar compras
app.get("/compras", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM compras ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar ventas
app.get("/ventas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ventas ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Ruta de login
app.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE usuario=$1 AND contrasena=$2",
      [usuario, contrasena]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    res.json({ mensaje: "Login exitoso", usuario: result.rows[0].usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ================== INICIO SERVIDOR ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
