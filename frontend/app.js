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

  // 👇 Aquí estaba el problema: ahora sí se envía el código
  formData.append("codigo", document.getElementById("codigo").value);

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
  carrito.push({ producto_id: producto.id, nombre: producto.nombre, cantidad, precio: producto.precio });
  mostrarCarrito();
}

function mostrarCarrito() {
  const div = document.getElementById("carritoItems");
  div.innerHTML = "";
  carrito.forEach(item => {
    div.innerHTML += `
      <div class="carrito-item">
        <span>${item.cantidad} x ${item.nombre}</span>
        <span>→ $${item.precio}</span>
      </div>
    `;
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
      ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}">` : `<img src="placeholder.jpg" alt="Sin imagen">`}
      <h3>${p.nombre}</h3>
      <p class="categoria">${p.categoria || "Sin categoría"}</p>
      <p class="descripcion">${p.descripcion || "Sin descripción"}</p>
      <p><strong>Precio:</strong> $${p.precio}</p>
      <p><strong>Stock:</strong> ${p.stock}</p>
      <button class="btn-agregar" onclick="agregarAlCarrito({ id:${p.id}, nombre:'${p.nombre}', precio:${p.precio} })">
        ➕ Agregar al carrito
      </button>
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

  const historialItems = document.getElementById("historialItems");
  historialItems.innerHTML = `
    <table class="tabla-ventas">
      <thead>
        <tr>
          <th>ID</th>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${ventas.map(v => `
          <tr>
            <td>${v.id}</td>
            <td>${v.nombre}</td>
            <td>${v.cantidad}</td>
            <td>$${v.precio}</td>
            <td>${new Date(v.fecha).toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}
