const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos SQLite
const db = new sqlite3.Database("./db.sqlite");

// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    categoria TEXT,
    precio REAL,
    stock INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER,
    cantidad INTEGER,
    costo REAL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(producto_id) REFERENCES Productos(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER,
    cantidad INTEGER,
    precio REAL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(producto_id) REFERENCES Productos(id)
  )`);
});

// ================== RUTAS ==================

// Registrar producto
app.post("/productos", (req, res) => {
  const { nombre, categoria, precio, stock } = req.body;
  const sql = "INSERT INTO Productos (nombre, categoria, precio, stock) VALUES (?, ?, ?, ?)";
  db.run(sql, [nombre, categoria, precio, stock], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Listar productos
app.get("/productos", (req, res) => {
  db.all("SELECT * FROM Productos", [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Registrar compra
app.post("/compras", (req, res) => {
  const { producto_id, cantidad, costo } = req.body;
  const sql = "INSERT INTO Compras (producto_id, cantidad, costo) VALUES (?, ?, ?)";
  db.run(sql, [producto_id, cantidad, costo], function(err) {
    if (err) return res.status(400).json({ error: err.message });

    // Actualizar stock
    db.run("UPDATE Productos SET stock = stock + ? WHERE id = ?", [cantidad, producto_id]);
    res.json({ id: this.lastID });
  });
});

// Registrar venta
app.post("/ventas", (req, res) => {
  const { producto_id, cantidad, precio } = req.body;
  const sql = "INSERT INTO Ventas (producto_id, cantidad, precio) VALUES (?, ?, ?)";
  db.run(sql, [producto_id, cantidad, precio], function(err) {
    if (err) return res.status(400).json({ error: err.message });

    // Actualizar stock
    db.run("UPDATE Productos SET stock = stock - ? WHERE id = ?", [cantidad, producto_id]);
    res.json({ id: this.lastID });
  });
});

// Historial de compras
app.get("/compras", (req, res) => {
  db.all("SELECT id, producto_id, cantidad, costo, fecha FROM Compras ORDER BY fecha DESC", [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Historial de ventas
app.get("/ventas", (req, res) => {
  db.all("SELECT id, producto_id, cantidad, precio, fecha FROM Ventas ORDER BY fecha DESC", [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Reporte general
app.get("/reporte", (req, res) => {
  const sqlVentas = "SELECT SUM(precio) AS totalVentas FROM Ventas";
  const sqlCompras = "SELECT SUM(costo) AS totalCompras FROM Compras";

  db.get(sqlVentas, [], (err, ventas) => {
    if (err) return res.status(400).json({ error: err.message });
    db.get(sqlCompras, [], (err2, compras) => {
      if (err2) return res.status(400).json({ error: err2.message });
      const totalVentas = ventas.totalVentas || 0;
      const totalCompras = compras.totalCompras || 0;
      const balance = totalVentas - totalCompras;
      res.json({ totalVentas, totalCompras, balance });
    });
  });
});

// Reporte por producto
app.get("/reporte-productos", (req, res) => {
  const sql = `
    SELECT p.id, p.nombre,
      IFNULL(v.totalVentas, 0) AS totalVentas,
      IFNULL(c.totalCompras, 0) AS totalCompras,
      IFNULL(v.totalVentas, 0) - IFNULL(c.totalCompras, 0) AS balance
    FROM Productos p
    LEFT JOIN (
      SELECT producto_id, SUM(precio) AS totalVentas
      FROM Ventas
      GROUP BY producto_id
    ) v ON p.id = v.producto_id
    LEFT JOIN (
      SELECT producto_id, SUM(costo) AS totalCompras
      FROM Compras
      GROUP BY producto_id
    ) c ON p.id = c.producto_id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// ================== INICIO SERVIDOR ==================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});