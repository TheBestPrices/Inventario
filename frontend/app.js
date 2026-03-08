// Registrar producto
async function registrarProducto(event) {
  event.preventDefault();
  const producto = {
    nombre: document.getElementById("nombre").value,
    categoria: document.getElementById("categoria").value,
    precio: parseFloat(document.getElementById("precio").value),
    stock: parseInt(document.getElementById("stock").value)
  };
  await fetch("/productos", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(producto)
  });
  alert("Producto registrado!");
  listarProductos();
}

// Registrar compra
async function registrarCompra(event) {
  event.preventDefault();
  const compra = {
    producto_id: parseInt(document.getElementById("compra_producto_id").value),
    cantidad: parseInt(document.getElementById("compra_cantidad").value),
    costo: parseFloat(document.getElementById("compra_costo").value)
  };
  await fetch("/compras", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(compra)
  });
  alert("Compra registrada!");
  listarProductos();
}

// Registrar venta
async function registrarVenta(event) {
  event.preventDefault();
  const venta = {
    producto_id: parseInt(document.getElementById("venta_producto_id").value),
    cantidad: parseInt(document.getElementById("venta_cantidad").value),
    precio: parseFloat(document.getElementById("venta_precio").value)
  };
  await fetch("/ventas", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(venta)
  });
  alert("Venta registrada!");
  listarProductos();
}
