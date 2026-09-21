const estado = {
  productos: [],
  carrito: [],
  categoriaActiva: "Todos",
  terminoBusqueda: ""
};

const formatoCLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

const productosDinamicos = document.querySelector("#productosDinamicos");
const filtrosProductos = document.querySelector("#filtrosProductos");
const resumenProductos = document.querySelector("#resumenProductos");
const estadoCatalogo = document.querySelector("#estadoCatalogo");
const mensajeCatalogo = document.querySelector("#mensajeCatalogo");
const detalleProducto = document.querySelector("#detalleProducto");
const formBusqueda = document.querySelector("#formBusqueda");
const busquedaProducto = document.querySelector("#busquedaProducto");
const limpiarBusqueda = document.querySelector("#limpiarBusqueda");
const listaCarrito = document.querySelector("#listaCarrito");
const contadorCarrito = document.querySelector("#contadorCarrito");
const totalCarrito = document.querySelector("#totalCarrito");
const vaciarCarrito = document.querySelector("#vaciarCarrito");
const productoInteres = document.querySelector("#productoInteres");
const formularioContacto = document.querySelector("#formularioContacto");
const mensajeFormulario = document.querySelector("#mensajeFormulario");

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

function iniciarAplicacion() {
  configurarEventos();
  cargarProductos();
  renderizarCarrito();
}

function configurarEventos() {
  filtrosProductos.addEventListener("click", filtrarPorCategoria);
  formBusqueda.addEventListener("submit", buscarProductos);
  busquedaProducto.addEventListener("input", buscarProductosInstantaneamente);
  limpiarBusqueda.addEventListener("click", limpiarFiltroBusqueda);
  vaciarCarrito.addEventListener("click", vaciarProductosDelCarrito);
  formularioContacto.addEventListener("submit", validarFormulario);
}

async function cargarProductos() {
  try {
    // Fetch carga el catalogo desde un JSON local para separar datos y presentacion.
    const respuesta = await fetch("assets/data/productos.json");

    if (!respuesta.ok) {
      throw new Error("No fue posible cargar el catalogo");
    }

    estado.productos = await respuesta.json();
    renderizarProductos(obtenerProductosVisibles());
    cargarOpcionesFormulario(estado.productos);
    actualizarResumen();
    estadoCatalogo.classList.add("d-none");
  } catch (error) {
    estadoCatalogo.className = "alert alert-danger";
    estadoCatalogo.textContent = "No pudimos cargar los productos. Intenta nuevamente mas tarde o abre el sitio desde un servidor local.";
    resumenProductos.textContent = "Catalogo no disponible";
  }
}

function filtrarPorCategoria(event) {
  const boton = event.target.closest("[data-categoria]");

  if (!boton) {
    return;
  }

  estado.categoriaActiva = boton.dataset.categoria;
  filtrosProductos.querySelectorAll(".btn").forEach((item) => item.classList.remove("active"));
  boton.classList.add("active");
  actualizarCatalogo(`Filtro aplicado: ${estado.categoriaActiva}.`);
}

function buscarProductos(event) {
  event.preventDefault();
  estado.terminoBusqueda = normalizarTexto(busquedaProducto.value);
  actualizarCatalogo();
}

function buscarProductosInstantaneamente() {
  estado.terminoBusqueda = normalizarTexto(busquedaProducto.value);
  const productosVisibles = obtenerProductosVisibles();
  renderizarProductos(productosVisibles);
  actualizarResumen();

  if (!estado.terminoBusqueda) {
    mensajeCatalogo.innerHTML = "";
    return;
  }
}

function limpiarFiltroBusqueda() {
  busquedaProducto.value = "";
  estado.terminoBusqueda = "";
  actualizarCatalogo();
  mensajeCatalogo.innerHTML = "";
  busquedaProducto.focus();
}

function actualizarCatalogo(mensaje = "") {
  const productosVisibles = obtenerProductosVisibles();
  renderizarProductos(productosVisibles);
  actualizarResumen();

  if (mensaje) {
    mostrarMensaje(mensaje, "info", mensajeCatalogo);
  }
}

function obtenerProductosVisibles() {
  // La vista combina categoria y busqueda para mantener ambos filtros activos.
  return estado.productos.filter((producto) => {
    const coincideCategoria = estado.categoriaActiva === "Todos" || producto.categoria === estado.categoriaActiva;
    const textoProducto = normalizarTexto(`${producto.nombre} ${producto.categoria} ${producto.descripcion}`);
    const coincideBusqueda = !estado.terminoBusqueda || textoProducto.includes(estado.terminoBusqueda);

    return coincideCategoria && coincideBusqueda;
  });
}

function renderizarProductos(productos) {
  productosDinamicos.innerHTML = "";

  if (productos.length === 0) {
    productosDinamicos.innerHTML = '<div class="col-12"><div class="alert alert-warning">No hay productos que coincidan con la busqueda o categoria seleccionada.</div></div>';
    return;
  }

  productos.forEach((producto) => {
    const columna = document.createElement("div");
    columna.className = "col-sm-6 col-xl-6";

    const recomendado = producto.recomendado ? '<span class="recommended-label">Recomendado</span>' : "";

    columna.innerHTML = `
      <article class="card product-card dynamic-product h-100" tabindex="0" data-producto="${producto.id}">
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
            <button class="btn btn-sm btn-brand" type="button" data-agregar="${producto.id}">Agregar</button>
          </div>
        </div>
      </article>
    `;

    const card = columna.querySelector(".dynamic-product");
    card.addEventListener("mouseover", () => mostrarDetalleProducto(producto));
    card.addEventListener("focus", () => mostrarDetalleProducto(producto));
    card.addEventListener("mouseleave", limpiarDetalleProducto);
    card.addEventListener("blur", limpiarDetalleProducto);

    const botonAgregar = columna.querySelector("[data-agregar]");
    botonAgregar.addEventListener("click", () => agregarAlCarrito(producto.id));

    productosDinamicos.appendChild(columna);
  });
}

function mostrarDetalleProducto(producto) {
  detalleProducto.textContent = `${producto.nombre}: ${producto.categoria}, ${producto.precio}, ${producto.stock} unidades disponibles.`;
}

function limpiarDetalleProducto() {
  detalleProducto.textContent = "Agrega productos al carrito o busca por nombre, categoria o descripcion.";
}

function agregarAlCarrito(idProducto) {
  const producto = estado.productos.find((item) => item.id === idProducto);

  if (!producto) {
    return;
  }

  const itemCarrito = estado.carrito.find((item) => item.id === idProducto);

  if (itemCarrito) {
    if (itemCarrito.cantidad >= producto.stock) {
      mostrarMensaje(`No puedes agregar mas unidades de ${producto.nombre}; el stock disponible es ${producto.stock}.`, "warning", mensajeCatalogo);
      return;
    }

    itemCarrito.cantidad += 1;
  } else {
    estado.carrito.push({ ...producto, cantidad: 1 });
  }

  productoInteres.value = producto.nombre;
  renderizarCarrito();
  mostrarMensaje(`${producto.nombre} fue agregado al carrito.`, "success", mensajeCatalogo);
}

function renderizarCarrito() {
  const cantidadProductos = estado.carrito.reduce((total, producto) => total + producto.cantidad, 0);
  const total = estado.carrito.reduce((suma, producto) => suma + producto.precioNumero * producto.cantidad, 0);

  contadorCarrito.textContent = cantidadProductos;
  totalCarrito.textContent = formatoCLP.format(total);

  if (estado.carrito.length === 0) {
    listaCarrito.innerHTML = '<p class="text-muted-custom mb-0">El carrito esta vacio.</p>';
    vaciarCarrito.disabled = true;
    return;
  }

  vaciarCarrito.disabled = false;
  listaCarrito.innerHTML = estado.carrito.map((producto) => `
    <div class="cart-item">
      <div>
        <p class="fw-semibold mb-1">${producto.nombre}</p>
        <p class="small text-muted-custom mb-0">${producto.cantidad} x ${producto.precio} · Stock ${producto.stock}</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-brand cart-action" type="button" data-restar="${producto.id}" aria-label="Quitar una unidad de ${producto.nombre}">-</button>
        <button class="btn btn-sm btn-outline-brand cart-action" type="button" data-sumar="${producto.id}" aria-label="Agregar una unidad de ${producto.nombre}" ${producto.cantidad >= producto.stock ? "disabled" : ""}>+</button>
      </div>
    </div>
  `).join("");

  listaCarrito.querySelectorAll("[data-restar]").forEach((boton) => {
    boton.addEventListener("click", () => cambiarCantidad(Number(boton.dataset.restar), -1));
  });

  listaCarrito.querySelectorAll("[data-sumar]").forEach((boton) => {
    boton.addEventListener("click", () => cambiarCantidad(Number(boton.dataset.sumar), 1));
  });
}

function cambiarCantidad(idProducto, cambio) {
  const itemCarrito = estado.carrito.find((item) => item.id === idProducto);

  if (!itemCarrito) {
    return;
  }

  if (cambio > 0 && itemCarrito.cantidad >= itemCarrito.stock) {
    mostrarMensaje(`No puedes agregar mas unidades de ${itemCarrito.nombre}; el stock disponible es ${itemCarrito.stock}.`, "warning", mensajeCatalogo);
    return;
  }

  itemCarrito.cantidad += cambio;

  if (itemCarrito.cantidad <= 0) {
    estado.carrito = estado.carrito.filter((item) => item.id !== idProducto);
  }

  renderizarCarrito();
}

function vaciarProductosDelCarrito() {
  estado.carrito = [];
  renderizarCarrito();
  mostrarMensaje("El carrito fue vaciado correctamente.", "info", mensajeCatalogo);
}

function cargarOpcionesFormulario(productos) {
  productos.forEach((producto) => {
    const opcion = document.createElement("option");
    opcion.value = producto.nombre;
    opcion.textContent = producto.nombre;
    productoInteres.appendChild(opcion);
  });
}

function actualizarResumen() {
  const productosVisibles = obtenerProductosVisibles().length;
  const categoria = estado.categoriaActiva === "Todos" ? "todas las categorias" : estado.categoriaActiva;
  const busqueda = estado.terminoBusqueda ? " con busqueda activa" : "";
  resumenProductos.textContent = `${productosVisibles} producto(s) visibles en ${categoria}${busqueda}.`;
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

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
