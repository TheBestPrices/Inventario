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
    producto_id: parseInt(document.getElementById("compra_producto_id
