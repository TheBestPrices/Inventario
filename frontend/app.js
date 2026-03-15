const API_URL = "https://inventario-reel.onrender.com"; // 👈 cambia por tu URL real

// ================== LOGIN ==================
async function login(e) {
  e.preventDefault();
  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, contrasena })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    alert(data.mensaje);
    document.getElementById("modalLogin").style.display = "none";
    document.querySelector("main").style.display = "grid";
    document.getElementById("encabezadoUsuario").textContent = `Bienvenido, ${data.usuario}`;
    document.getElementById("btnLogout").style.display = "inline-block";

    localStorage.setItem("usuario", data.usuario);
  } catch (err) {
    console.error(err);
    alert("Error al intentar iniciar sesión.");
  }
}

function logout() {
  localStorage.removeItem("usuario");
  document.querySelector("main").style.display = "none";
  document.getElementById("modalLogin").style.display = "block";
  document.getElementById("encabezadoUsuario").textContent = "";
  document.getElementById("btnLogout").style.display = "none";
}

window.onload = () => {
  const usuarioGuardado = localStorage.getItem("usuario");
  if (!usuarioGuardado) {
    document.getElementById("modalLogin").style.display = "block";
    document.querySelector("main").style.display = "none";
  } else {
    document.querySelector("main").style.display = "grid";
    document.getElementById("encabezadoUsuario").textContent = `Bienvenido, ${usuarioGuardado}`;
    document.getElementById("btnLogout").style.display = "inline-block";
  }
};

// ================== PRODUCTOS ==================
// Registrar producto con foto
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
  alert("Producto registrado: " + data.nombre);
}

// ================== COMPRAS ==================
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
  alert("Compra registrada: " + data.id);
}

// ================== VENTAS ==================
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
  alert("Venta registrada: " + data.id);
}

// ================== LISTAR PRODUCTOS ==================
async function listarProductos() {
  const res = await fetch(`${API_URL}/productos`);
  const productos = await res.json();

  const lista = document.getElementById("lista");
  lista.innerHTML = "";
  productos.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("producto-card");

    div.innerHTML = `
      <h3>${p.nombre} (${p.categoria})</h3>
      <p>${p.descripcion || "Sin descripción"}</p>
      <p>Precio: $${p.precio} - Stock: ${p.stock}</p>
      ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="max-width:150px; border-radius:8px;">` : ""}
    `;
    lista.appendChild(div);
  });
}

// ================== HISTORIAL ==================
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

// ================== BUSCAR PRODUCTO ==================
async function buscarProducto(e) {
  e.preventDefault();
  const query = document.getElementById("buscar_codigo").value.trim();

  if (!query) {
    alert("Escribe un código para buscar.");
    return;
  }

  let url;
  if (!isNaN(query)) {
    url = `${API_URL}/productos/id/${query}`;
  } else {
    url = `${API_URL}/productos/codigo/${query}`;
  }

  try {
    const res = await fetch(url);
    const productos = await res.json();

    if (productos.length === 0) {
      alert("No se encontró ningún producto.");
      return;
    }

    const p = productos[0];
    const detalle = document.getElementById("detalleProducto");
    detalle.innerHTML = `
      <h2>${p.nombre}</h2>
      <p><strong>Categoría:</strong> ${p.categoria}</p>
      <p><strong>Descripción:</strong> ${p.descripcion || "Sin descripción"}</p>
      <p><strong>Precio:</strong> $${p.precio}</p>
      <p><strong>Stock:</strong> ${p.stock}</p>
      <p><strong>ID:</strong> ${p.id}</p>
      <p><strong>Código:</strong> ${p.codigo}</p>
      ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="max-width:100%;">` : ""}
    `;

    document.getElementById("modalProducto").style.display = "block";
  } catch (error) {
    console.error(error);
    alert("Error al buscar el producto.");
  }
}

function cerrarModal() {
  document.getElementById("modalProducto").style.display = "none";
}
