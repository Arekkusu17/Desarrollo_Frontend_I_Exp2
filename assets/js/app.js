const estado = {
  productos: [],
  categoriaActiva: "Todos"
};

const productosDinamicos = document.querySelector("#productosDinamicos");
const filtrosProductos = document.querySelector("#filtrosProductos");
const resumenProductos = document.querySelector("#resumenProductos");
const estadoCatalogo = document.querySelector("#estadoCatalogo");
const mensajeCatalogo = document.querySelector("#mensajeCatalogo");
const detalleProducto = document.querySelector("#detalleProducto");
const productoInteres = document.querySelector("#productoInteres");
const formularioContacto = document.querySelector("#formularioContacto");
const mensajeFormulario = document.querySelector("#mensajeFormulario");

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

function iniciarAplicacion() {
  configurarEventos();
  cargarProductos();
}

async function cargarProductos() {
  try {
    const respuesta = await fetch("assets/data/productos.json");

    if (!respuesta.ok) {
      throw new Error("No fue posible cargar el catalogo");
    }

    estado.productos = await respuesta.json();
    renderizarProductos(estado.productos);
    cargarOpcionesFormulario(estado.productos);
    actualizarResumen(estado.productos.length);
    estadoCatalogo.classList.add("d-none");
  } catch (error) {
    estadoCatalogo.className = "alert alert-danger";
    estadoCatalogo.textContent = "No se pudieron cargar los productos. Intenta abrir el sitio desde un servidor local.";
    resumenProductos.textContent = "Catalogo no disponible";
  }
}

function configurarEventos() {
  filtrosProductos.addEventListener("click", filtrarProductos);
  formularioContacto.addEventListener("submit", validarFormulario);
}

function filtrarProductos(event) {
  const boton = event.target.closest("[data-categoria]");

  if (!boton) {
    return;
  }

  estado.categoriaActiva = boton.dataset.categoria;
  filtrosProductos.querySelectorAll(".btn").forEach((item) => item.classList.remove("active"));
  boton.classList.add("active");

  const productosFiltrados = obtenerProductosFiltrados();
  renderizarProductos(productosFiltrados);
  actualizarResumen(productosFiltrados.length);
  mostrarMensaje(
    `Filtro aplicado: ${estado.categoriaActiva}. Se muestran ${productosFiltrados.length} producto(s).`,
    "info",
    mensajeCatalogo
  );
}

function obtenerProductosFiltrados() {
  if (estado.categoriaActiva === "Todos") {
    return estado.productos;
  }

  return estado.productos.filter((producto) => producto.categoria === estado.categoriaActiva);
}

function renderizarProductos(productos) {
  productosDinamicos.innerHTML = "";

  if (productos.length === 0) {
    productosDinamicos.innerHTML = '<div class="col-12"><div class="alert alert-warning">No hay productos para esta categoria.</div></div>';
    return;
  }

  productos.forEach((producto) => {
    const columna = document.createElement("div");
    columna.className = "col-sm-6 col-lg-4";

    const recomendado = producto.recomendado ? '<span class="recommended-label">Recomendado</span>' : "";

    columna.innerHTML = `
      <article class="card product-card dynamic-product h-100" tabindex="0" data-producto="${producto.nombre}">
        <picture>
          <source media="(max-width: 767.98px)" srcset="${producto.imagenMobile}" type="image/webp">
          <img src="${producto.imagen}" class="card-img-top" alt="${producto.alt}">
        </picture>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
            <span class="badge badge-tech">${producto.categoria}</span>
            ${recomendado}
          </div>
          <h3 class="card-title h5">${producto.nombre}</h3>
          <p class="card-text">${producto.descripcion}</p>
          <p class="stock-text mb-3">Stock disponible: ${producto.stock}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center gap-3">
            <strong>${producto.precio}</strong>
            <button class="btn btn-sm btn-brand" type="button" data-consultar="${producto.nombre}">Consultar</button>
          </div>
        </div>
      </article>
    `;

    const card = columna.querySelector(".dynamic-product");
    card.addEventListener("mouseover", () => mostrarDetalleProducto(producto));
    card.addEventListener("focus", () => mostrarDetalleProducto(producto));

    const botonConsultar = columna.querySelector("[data-consultar]");
    botonConsultar.addEventListener("click", () => seleccionarProducto(producto));

    productosDinamicos.appendChild(columna);
  });
}

function mostrarDetalleProducto(producto) {
  detalleProducto.textContent = `${producto.nombre}: ${producto.categoria}, ${producto.precio}, ${producto.stock} unidades disponibles.`;
}

function seleccionarProducto(producto) {
  productoInteres.value = producto.nombre;
  mostrarMensaje(`Producto seleccionado: ${producto.nombre}. Completa tus datos para enviar la consulta.`, "success", mensajeCatalogo);
  document.querySelector("#contacto").scrollIntoView({ behavior: "smooth" });
}

function cargarOpcionesFormulario(productos) {
  productos.forEach((producto) => {
    const opcion = document.createElement("option");
    opcion.value = producto.nombre;
    opcion.textContent = producto.nombre;
    productoInteres.appendChild(opcion);
  });
}

function actualizarResumen(cantidad) {
  const categoria = estado.categoriaActiva === "Todos" ? "todas las categorias" : estado.categoriaActiva;
  resumenProductos.textContent = `${cantidad} producto(s) visibles en ${categoria}.`;
}

function validarFormulario(event) {
  event.preventDefault();

  const datos = new FormData(formularioContacto);
  const nombre = datos.get("nombre").trim();
  const correo = datos.get("correo").trim();
  const producto = datos.get("productoInteres");
  const mensaje = datos.get("mensaje").trim();

  if (!nombre || !correo || !producto || !mensaje) {
    mostrarMensaje("Completa todos los campos antes de enviar la consulta.", "danger", mensajeFormulario);
    return;
  }

  if (!correo.includes("@") || !correo.includes(".")) {
    mostrarMensaje("Ingresa un correo valido para poder responder tu solicitud.", "danger", mensajeFormulario);
    return;
  }

  mostrarMensaje(`Gracias, ${nombre}. Tu consulta por ${producto} fue registrada correctamente.`, "success", mensajeFormulario);
  formularioContacto.reset();
}

function mostrarMensaje(texto, tipo, contenedor) {
  contenedor.innerHTML = `<div class="alert alert-${tipo} mb-0" role="alert">${texto}</div>`;
}
