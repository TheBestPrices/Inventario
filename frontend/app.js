const API_URL = "https://inventario-reel.onrender.com"; // 👈 cambia por tu URL real

// Registrar producto
async function registrarProducto(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append("nombre", document.getElementById("nombre").value);
  formData.append("categoria", document.getElementById("categoria").value);
  formData.append("precio", parseFloat(document.getElementById("precio").value));
  formData.append("stock", parseInt(document.getElementById("stock").value));
  formData.append("descripcion", document.getElementById("descripcion").value);

  const imagenFile = document.getElementById("imagen").files[0];
  if (imagenFile) {
    formData.append("imagen", imagenFile);
  }

  const res = await fetch(`${API_URL}/productos`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  alert("Producto registrado con ID: " + data.id);
}
  const res = await fetch(`${API_URL}/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto)
  });

  const data = await res.json();
  alert("Producto registrado con ID: " + data.id);
}

// Registrar compra
async function registrarCompra(e) {
  e.preventDefault();
  const compra = {
    producto_id: parseInt(document.getElementById("compra_producto_id").value),
    cantidad: parseInt(document.getElementById("compra_cantidad").value),
    costo: parseFloat(document.getElementById("compra_costo").value)
  };

  const res = await fetch(`${API_URL}/compras`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(compra)
  });

  const data = await res.json();
  alert("Compra registrada con ID: " + data.id);
}

// Registrar venta
async function registrarVenta(e) {
  e.preventDefault();
  const venta = {
    producto_id: parseInt(document.getElementById("venta_producto_id").value),
    cantidad: parseInt(document.getElementById("venta_cantidad").value),
    precio: parseFloat(document.getElementById("venta_precio").value)
  };

  const res = await fetch(`${API_URL}/ventas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(venta)
  });

  const data = await res.json();
  alert("Venta registrada con ID: " + data.id);
}

// Listar productos
async function listarProductos() {
  const res = await fetch(`${API_URL}/productos`);
  const productos = await res.json();

  const lista = document.getElementById("lista");
  lista.innerHTML = "";
  productos.forEach(p => {
    const div = document.createElement("div");
    div.textContent = `${p.id} - ${p.nombre} (${p.categoria}) - $${p.precio} - Stock: ${p.stock}`;
    lista.appendChild(div);
  });
}

// Historial de compras
async function verCompras() {
  const res = await fetch(`${API_URL}/compras`);
  const compras = await res.json();

  const historial = document.getElementById("historial");
  historial.innerHTML = "<h3>Compras</h3>";
  compras.forEach(c => {
    const div = document.createElement("div");
    div.textContent = `Compra #${c.id} → Producto ${c.producto_id}, Cantidad: ${c.cantidad}, Costo: $${c.costo}`;
    historial.appendChild(div);
  });
}

// Historial de ventas
async function verVentas() {
  const res = await fetch(`${API_URL}/ventas`);
  const ventas = await res.json();

  const historial = document.getElementById("historial");
  historial.innerHTML += "<h3>Ventas</h3>";
  ventas.forEach(v => {
    const div = document.createElement("div");
    div.textContent = `Venta #${v.id} → Producto ${v.producto_id}, Cantidad: ${v.cantidad}, Precio: $${v.precio}`;
    historial.appendChild(div);
  });
}
