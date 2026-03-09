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
    )
  `);
})();

// ================== RUTAS ==================

// Registrar producto con foto (ahora en Supabase Storage)
app.post("/productos", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, categoria,descripcion, precio, stock, codigo } = req.body;
    let imagen_url = null;

    if (req.file) {
      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from("imagenes") // 👈 bucket creado en Supabase
        .upload(`productos/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: publicUrl } = supabase.storage
        .from("imagenes")
        .getPublicUrl(data.path);

      imagen_url = publicUrl.publicUrl;
    }

    const result = await pool.query(
      `INSERT INTO productos (nombre, categoria, descripcion, imagen_url, precio, stock, codigo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [nombre, categoria, descripcion, imagen_url, parseFloat(precio), parseInt(stock), codigo]
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

// Buscar producto por Codigo
app.get("/productos/codigo/:codigo", async (req, res) => {
  const { codigo } = req.params;
  try {
    const result = await pool.query("SELECT * FROM productos WHERE codigo = $1", [codigo]);
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
