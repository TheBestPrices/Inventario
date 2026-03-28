const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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
      codigo TEXT UNIQUE
    );
    CREATE TABLE IF NOT EXISTS ventas (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER REFERENCES productos(id),
      codigo TEXT,
      nombre TEXT,
      cantidad INTEGER,
      precio REAL,
      fecha TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      usuario TEXT UNIQUE,
      contrasena TEXT
    );
    CREATE TABLE IF NOT EXISTS reportes (
      id SERIAL PRIMARY KEY,
      total_compras REAL,
      total_ventas REAL,
      ganancia REAL,
      estado TEXT,
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

// Registrar venta (con actualización de stock)
app.post("/ventas", async (req, res) => {
  const { producto_id, cantidad, precio } = req.body;
  try {
    const producto = await pool.query("SELECT codigo, nombre, stock FROM productos WHERE id=$1", [producto_id]);
    if (!producto.rows[0]) return res.status(404).json({ error: "Producto no encontrado" });

    if (producto.rows[0].stock < cantidad) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    const { codigo, nombre } = producto.rows[0];
    const result = await pool.query(
      `INSERT INTO ventas (producto_id, codigo, nombre, cantidad, precio) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [producto_id, codigo, nombre, cantidad, precio]
    );

    await pool.query("UPDATE productos SET stock = stock - $1 WHERE id=$2", [cantidad, producto_id]);

    res.json(result.rows[0]);
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

// Login seguro con bcrypt + JWT
app.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE usuario=$1", [usuario]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

    const valido = await bcrypt.compare(contrasena, result.rows[0].contrasena);
    if (!valido) return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign({ usuario: result.rows[0].usuario }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ mensaje: "Login exitoso", token });
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
