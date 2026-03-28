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
    document.getElementById("encabezadoUsuario").textContent = `Bienvenido, ${usuario}`;
    document.getElementById("btnLogout").style.display = "inline-block";

    // Guardar token JWT
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", usuario);

    listarProductos();
    verVentas();
  } catch (err) {
    console.error(err);
    alert("Error al intentar iniciar sesión.");
  }
}

function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
  document.querySelector("main").style.display = "none";
  document.getElementById("encabezadoUsuario").textContent = "";
  document.getElementById("btnLogout").style.display = "none";
  document.getElementById("modalLogin").style.display = "block";
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
    listarProductos();
    verVentas();
  }
};

// ================== PRODUCTOS ==================
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
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    body: formData
  });

  const data = await res.json();
  alert("Producto registrado: " + data.nombre);
  listarProductos();
}

// ================== CARRITO DE VENTA ==================
let carrito = [];

function agregarAlCarrito(producto, cantidad = 1) {
  carrito.push({ producto_id: producto.id, cantidad, precio: producto.precio });
  mostrarCarrito();
}

function mostrarCarrito() {
  const div = document.getElementById("carrito");
  div.innerHTML = "";
  carrito.forEach((item, i) => {
    div.innerHTML += `<p>${item.cantidad} x Producto #${item.producto_id} → $${item.precio}</p>`;
  });
}

async function confirmarVenta() {
  try {
    for (const item of carrito) {
      await fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(item)
      });
    }
    alert("Venta confirmada");
    carrito = [];
    mostrarCarrito();
    verVentas();
  } catch (err) {
    console.error(err);
    alert("Error al confirmar la venta.");
  }
}

// ================== LISTAR PRODUCTOS ==================
async function listarProductos() {
  const res = await fetch(`${API_URL}/productos`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  });
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
      <button onclick='agregarAlCarrito(${JSON.stringify(p)})'>Agregar al carrito</button>
    `;
    lista.appendChild(div);
  });
}

// ================== HISTORIAL ==================
async function verVentas() {
  const res = await fetch(`${API_URL}/ventas`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  });
  const ventas = await res.json();

  const historial = document.getElementById("historial");
  historial.innerHTML = "<h3>Ventas</h3>";
  ventas.forEach(v => {
    const div = document.createElement("div");
    div.textContent = `Venta #${v.id} → ${v.nombre}, Cantidad: ${v.cantidad}, Precio: $${v.precio}`;
    historial.appendChild(div);
  });
}
