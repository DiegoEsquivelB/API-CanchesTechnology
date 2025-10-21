// ==================== CONFIG & ESTADO GLOBAL ====================
const API_URL = "http://localhost:5275/api";

let productos = [];
let proveedores = [];
let ubicaciones = [];
let pedidos = [];

let detallesPedido = []; // módulo Ventas (pedidos de clientes)

// ---- Gestión de Compras ----
let solicitudes = [];
let detallesSolicitud = [];

let ordenes = []; // Órdenes de compra (derivadas de solicitudes)
let detallesOrden = []; // (ya no se usa para crear órdenes manuales, se deja por compatibilidad mínima)


// ==================== NAVEGACIÓN ====================
function mostrarVista(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function mostrarSubSeccion(id) {
  // Ocultar subsecciones visibles dentro de la vista activa
  const vistaActiva = document.querySelector(".seccion:not(.hidden)");
  if (vistaActiva) {
    vistaActiva.querySelectorAll(".subseccion").forEach(s => s.classList.add("hidden"));
  }

  // Mostrar subsección requerida
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  // Cargar datos según subsección
  switch (id) {
    // INVENTARIO
    case "productos":
      Promise.all([cargarProductos(), cargarProveedores(), cargarUbicaciones()]).then(cargarSelects);
      break;
    case "proveedores":
      cargarProveedores().then(cargarSelects);
      break;
    case "ubicaciones":
      cargarUbicaciones().then(cargarSelects);
      break;
    case "pedidos":
      Promise.all([cargarPedidos(), cargarProductos()]).then(cargarSelects);
      break;
    case "reportes":
      cargarReportes();
      
      break;

    // GESTIÓN DE COMPRAS
    case "solicitudes":
      Promise.all([cargarSolicitudes(), cargarProveedores(), cargarProductos()])
        .then(() => cargarSelectsSolicitud());
      break;
    case "ordenes":
      Promise.all([cargarOrdenes(), cargarProveedores(), cargarProductos()])
        .then(() => {/* no hay form en Órdenes; nada que poblar */});
      break;
  }
}


// ==================== PRODUCTOS ====================
async function cargarProductos() {
  const res = await fetch(`${API_URL}/productos`);
  productos = await res.json();

  const tbody = document.querySelector("#tabla-productos tbody");

  const soloBajoStock = document.getElementById("filtro-bajo-stock")?.checked;

  let lista = productos;
  if (soloBajoStock) {
    lista = productos.filter(p => p.cantidad < p.stockMinimo);
  }

  if (tbody) {
    tbody.innerHTML = "";
    lista.forEach(p => {   // 👈 aquí usamos lista, no productos
      const tr = document.createElement("tr");
      if (p.cantidad <= p.stockMinimo) tr.classList.add("stock-bajo");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>Q${p.precio}</td>
        <td>Q${p.costo}</td>
        <td>Q${p.gananciaUnidad}</td>
        <td>Q${p.gananciaTotal}</td>
        <td>${p.stockMinimo}</td>
        <td>${p.proveedor?.nombre || "-"}</td>
        <td>${p.ubicacion?.descripcion || "-"}</td>
        <td>
          <button onclick="editarProducto(${p.id})">Editar</button>
          <button onclick="eliminarProducto(${p.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  cargarSelects();
  mostrarAlertaReabastecimiento();
}





async function agregarProducto(e) {
  e.preventDefault();
  const cantidad = parseInt(document.getElementById("cantidad").value);
  if (isNaN(cantidad) || cantidad < 0) {
    alert("La cantidad no puede ser negativa.");
    return;
    }



  const producto = {
    nombre: document.getElementById("nombre").value,
    cantidad: cantidad,
    precio: parseFloat(document.getElementById("precio").value),
    costo: parseFloat(document.getElementById("costo").value),
    stockMinimo: parseInt(document.getElementById("stockMinimo").value),
    proveedorId: parseInt(document.getElementById("proveedorId").value),
    ubicacionId: parseInt(document.getElementById("ubicacionId").value),
  };

  await fetch(`${API_URL}/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });

  await cargarProductos();
  e.target.reset();
}

async function actualizarProducto() {
  const id = document.getElementById("productoId").value;
  if (!id) return;

  const cantidad = parseInt(document.getElementById("cantidad").value);
  if (isNaN(cantidad) || cantidad < 0) {
    alert("La cantidad no puede ser negativa.");
    return;
  }

  const producto = {
    id: parseInt(id),
    nombre: document.getElementById("nombre").value,
    cantidad: cantidad,
    precio: parseFloat(document.getElementById("precio").value),
    costo: parseFloat(document.getElementById("costo").value),
    stockMinimo: parseInt(document.getElementById("stockMinimo").value),
    proveedorId: parseInt(document.getElementById("proveedorId").value),
    ubicacionId: parseInt(document.getElementById("ubicacionId").value),
  };

  await fetch(`${API_URL}/productos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });

  await cargarProductos();
}

async function eliminarProducto(id) {
  await fetch(`${API_URL}/productos/${id}`, { method: "DELETE" });
  await cargarProductos();
}

function editarProducto(id) {
  const p = productos.find(x => x.id === id);
  const productoIdInput = document.getElementById("productoId");
  if (productoIdInput) productoIdInput.value = p.id;
  const nombreInput = document.getElementById("nombre");
  if (nombreInput) nombreInput.value = p.nombre;
  const cantidadInput = document.getElementById("cantidad");
  if (cantidadInput) cantidadInput.value = p.cantidad;
  const precioInput = document.getElementById("precio");
  if (precioInput) precioInput.value = p.precio;
  const costoInput = document.getElementById("costo");
  if (costoInput) costoInput.value = p.costo;
  const stockMinimoInput = document.getElementById("stockMinimo");
  if (stockMinimoInput) stockMinimoInput.value = p.stockMinimo;
  const proveedorIdInput = document.getElementById("proveedorId");
  if (proveedorIdInput) proveedorIdInput.value = p.proveedorId;
  const ubicacionIdInput = document.getElementById("ubicacionId");
  if (ubicacionIdInput) ubicacionIdInput.value = p.ubicacionId;
}



// ==================== PROVEEDORES ====================
async function cargarProveedores() {
  const res = await fetch(`${API_URL}/proveedores`);
  proveedores = await res.json();

  const tbody = document.querySelector("#tabla-proveedores tbody");
  if (tbody) {
    tbody.innerHTML = "";
    proveedores.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td><td>${p.nombre}</td><td>${p.contacto}</td><td>${p.email}</td>
        <td>
          <button onclick="editarProveedor(${p.id})">Editar</button>
          <button onclick="eliminarProveedor(${p.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  cargarSelects();
}

async function agregarProveedor(e) {
  e.preventDefault();
  const proveedor = {
    nombre: document.getElementById("prov-nombre").value,
    contacto: document.getElementById("prov-contacto").value,
    email: document.getElementById("prov-email").value,
  };

  await fetch(`${API_URL}/proveedores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proveedor),
  });

  await cargarProveedores();
  e.target.reset();
}

async function actualizarProveedor() {
  const id = document.getElementById("proveedorId").value;
  if (!id) return;

  const proveedor = {
    id: parseInt(id),
    nombre: document.getElementById("prov-nombre").value,
    contacto: document.getElementById("prov-contacto").value,
    email: document.getElementById("prov-email").value,
  };

  await fetch(`${API_URL}/proveedores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proveedor),
  });

  await cargarProveedores();
}

async function eliminarProveedor(id) {
  await fetch(`${API_URL}/proveedores/${id}`, { method: "DELETE" });
  await cargarProveedores();
}

function editarProveedor(id) {
  const p = proveedores.find(x => x.id === id);
  document.getElementById("proveedorId").value = p.id;
  document.getElementById("prov-nombre").value = p.nombre;
  document.getElementById("prov-contacto").value = p.contacto;
  document.getElementById("prov-email").value = p.email;
}


// ==================== UBICACIONES ====================
async function cargarUbicaciones() {
  const res = await fetch(`${API_URL}/ubicaciones`);
  ubicaciones = await res.json();

  const tbody = document.querySelector("#tabla-ubicaciones tbody");
  if (tbody) {
    tbody.innerHTML = "";
    ubicaciones.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td><td>${u.codigo}</td><td>${u.descripcion}</td>
        <td>
          <button onclick="editarUbicacion(${u.id})">Editar</button>
          <button onclick="eliminarUbicacion(${u.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  cargarSelects();
}

async function agregarUbicacion(e) {
  e.preventDefault();
  const ubicacion = {
    codigo: document.getElementById("ubicacion-codigo").value,
    descripcion: document.getElementById("ubicacion-descripcion").value,
  };

  await fetch(`${API_URL}/ubicaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ubicacion),
  });

  await cargarUbicaciones();
  e.target.reset();
}

async function actualizarUbicacion() {
  const id = document.getElementById("ubicacionId").value;
  if (!id) return;

  const ubicacion = {
    id: parseInt(id),
    codigo: document.getElementById("ubicacion-codigo").value,
    descripcion: document.getElementById("ubicacion-descripcion").value,
  };

  await fetch(`${API_URL}/ubicaciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ubicacion),
  });

  await cargarUbicaciones();
}

async function eliminarUbicacion(id) {
  await fetch(`${API_URL}/ubicaciones/${id}`, { method: "DELETE" });
  await cargarUbicaciones();
}

function editarUbicacion(id) {
  const u = ubicaciones.find(x => x.id === id);
  document.getElementById("ubicacionId").value = u.id;
  document.getElementById("ubicacion-codigo").value = u.codigo;
  document.getElementById("ubicacion-descripcion").value = u.descripcion;
}


// ==================== PEDIDOS (Clientes) ====================
async function cargarPedidos() {
  const res = await fetch(`${API_URL}/pedidos`);
  pedidos = await res.json();

  const tbody = document.querySelector("#tabla-pedidos tbody");
  if (tbody) {
    tbody.innerHTML = "";
    pedidos.forEach(p => {
      const detalles = p.detalles.map(d => `${d.producto.nombre} (${d.cantidad})`).join(", ");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td><td>${new Date(p.fecha).toLocaleString()}</td>
        <td>${p.cliente}</td><td>${detalles}</td>
        <td>
          <button onclick="editarPedido(${p.id})">Editar</button>
          <button onclick="eliminarPedido(${p.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  cargarSelects();
}

function renderDetalles() {
  const tbody = document.querySelector("#tabla-detalles tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  detallesPedido.forEach((d, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.productoNombre}</td>
      <td>${d.cantidad}</td>
      <td>Q${d.precioUnitario}</td>
      <td><button onclick="eliminarDetalle(${i})">❌</button></td>
    `;
    tbody.appendChild(tr);
  });

  cargarSelects();
}

function eliminarDetalle(index) {
  detallesPedido.splice(index, 1);
  renderDetalles();
}

function agregarDetalle() {
  const productoId = parseInt(document.getElementById("detalle-productoId").value);
  const cantidad = parseInt(document.getElementById("detalle-cantidad").value);
  if (!productoId || !cantidad) return;

  const producto = productos.find(p => p.id === productoId);

  if (cantidad > producto.cantidad) {
    alert("La cantidad no puede superar el stock disponible (" + producto.cantidad + ")");
    return;
  }

  if (detallesPedido.some(d => d.productoId === productoId)) {
    alert("Este producto ya está en el pedido");
    return;
  }

  detallesPedido.push({
    productoId,
    productoNombre: producto.nombre,
    cantidad,
    precioUnitario: producto.precio,
  });

  renderDetalles();
}

async function agregarPedido(e) {
  e.preventDefault();

  const pedido = {
    cliente: document.getElementById("pedido-cliente").value,
    detalles: detallesPedido.map(d => ({
      productoId: d.productoId,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
    })),
  };

  const res = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });

  if (!res.ok) {
    alert("Error al guardar pedido");
    return;
  }

  detallesPedido = [];
  e.target.reset();
  renderDetalles();
  await cargarPedidos();
  await cargarProductos();
}

async function actualizarPedido() {
  const id = document.getElementById("pedidoId").value;
  if (!id) return;

  const pedido = {
    id: parseInt(id),
    cliente: document.getElementById("pedido-cliente").value,
    detalles: detallesPedido.map(d => ({
      productoId: d.productoId,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
    })),
  };

  const res = await fetch(`${API_URL}/pedidos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });

  if (!res.ok) {
    alert("Error al actualizar pedido");
    return;
  }

  detallesPedido = [];
  document.getElementById("form-pedido").reset();
  renderDetalles();
  await cargarPedidos();
  await cargarProductos();
}

async function eliminarPedido(id) {
  await fetch(`${API_URL}/pedidos/${id}`, { method: "DELETE" });
  await cargarPedidos();
  await cargarProductos();
}

function editarPedido(id) {
  const p = pedidos.find(x => x.id === id);
  document.getElementById("pedidoId").value = p.id;
  document.getElementById("pedido-cliente").value = p.cliente;
  detallesPedido = p.detalles.map(d => ({
    productoId: d.productoId,
    productoNombre: d.producto.nombre,
    cantidad: d.cantidad,
    precioUnitario: d.precioUnitario,
  }));
  renderDetalles();
}


// ==================== SELECTS GENÉRICOS (Inventario/Pedidos) ====================
function cargarSelects() {
  // Proveedores (para productos)
  const selProv = document.getElementById("proveedorId");
  if (selProv) {
    selProv.innerHTML = `<option value="">-- Selecciona Proveedor --</option>`;
    proveedores.forEach(p => {
      selProv.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
  }

  // Ubicaciones
  const selUbi = document.getElementById("ubicacionId");
  if (selUbi) {
    selUbi.innerHTML = `<option value="">-- Selecciona Ubicación --</option>`;
    ubicaciones.forEach(u => {
      selUbi.innerHTML += `<option value="${u.id}">${u.descripcion}</option>`;
    });
  }

  // Productos (para pedidos)
  const selProd = document.getElementById("detalle-productoId");
  if (selProd) {
    selProd.innerHTML = `<option value="">-- Selecciona Producto --</option>`;
    productos.forEach(p => {
      const yaAgregado = detallesPedido.some(d => d.productoId === p.id);
      const disabled = yaAgregado || p.cantidad === 0 ? "disabled" : "";
      selProd.innerHTML += `<option value="${p.id}" ${disabled}>
        ${p.nombre} (Stock: ${p.cantidad})
      </option>`;
    });

    selProd.onchange = () => {
      const id = parseInt(selProd.value);
      const prod = productos.find(p => p.id === id);
      const precioInput = document.getElementById("detalle-precio");
      if (precioInput) precioInput.value = prod ? prod.precio : "";
    };
  }
}

function mostrarAlertaReabastecimiento() {
  const alertaDiv = document.getElementById("alerta-reabastecimiento");
  if (!alertaDiv) return;

  const productosBajos = productos.filter(p => p.cantidad <= p.stockMinimo);
  if (productosBajos.length > 0) {
    alertaDiv.style.display = "block";
    alertaDiv.innerHTML = "⚠️ Productos con stock bajo:<br>" +
      productosBajos.map(p => `${p.nombre} (Stock: ${p.cantidad}, Mínimo: ${p.stockMinimo})`).join("<br>");
  } else {
    alertaDiv.style.display = "none";
    alertaDiv.innerHTML = "";
  }
}


// ==================== LIMPIEZA FORMULARIOS ====================
function limpiarFormulario(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();

  const hidden = document.querySelector(`#${formId} input[type="hidden"]`);
  if (hidden) hidden.value = "";

  if (formId === "form-pedido") {
    detallesPedido = [];
    renderDetalles();
    cargarSelects();
  }

  if (formId === "form-solicitud") {
    detallesSolicitud = [];
    renderDetallesSolicitud();
    cargarSelectsSolicitud({ resetProveedor: true });
  }
}


// ==================== REPORTES ====================
async function cargarReportes() {
  try {
    
    const res = await fetch(`${API_URL}/productos`);
    const prods = await res.json();

    const totalProductos = prods.length;
    const valorInventario = prods.reduce((sum, p) => sum + (p.cantidad * p.costo), 0);
    const valorVentaPotencial = prods.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);
    const gananciaPotencial = valorVentaPotencial - valorInventario;

    const resumenDiv = document.getElementById("reporte-resumen");
    if (resumenDiv) {
      resumenDiv.innerHTML = `
        <p><strong>Total de productos:</strong> ${totalProductos}</p>
        <p><strong>Valor total en inventario:</strong> Q${valorInventario.toFixed(2)}</p>
        <p><strong>Valor de venta potencial:</strong> Q${valorVentaPotencial.toFixed(2)}</p>
        <p><strong>Ganancia potencial:</strong> Q${gananciaPotencial.toFixed(2)}</p>
      `;
    }

    const bajoStockUl = document.getElementById("reporte-bajo-stock");
    if (bajoStockUl) {
      bajoStockUl.innerHTML = "";
      prods
        .filter(p => p.cantidad <= p.stockMinimo)
        .forEach(p => {
          const li = document.createElement("li");
          li.textContent = `${p.nombre} (Stock: ${p.cantidad}, Mínimo: ${p.stockMinimo})`;
          bajoStockUl.appendChild(li);
        });
    }

    productos = prods; // para reutilizar en otros reportes
    mostrarProductosPorUbicacion();
    mostrarMargenesGanancia(prods);

    

    

  } catch (error) {
    console.error("Error cargando reportes:", error);
  }
}


function mostrarMargenesGanancia(prods) {
  const tablaMargenes = document.getElementById("reporte-margenes").querySelector("tbody");
  tablaMargenes.innerHTML = "";

  prods.forEach(p => {
    const margen = p.precio > 0 ? ((p.precio - p.costo) / p.precio) * 100 : 0;
    const gananciaTotal = (p.precio - p.costo) * p.cantidad;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.nombre}</td>
      <td>Q${p.costo.toFixed(2)}</td>
      <td>Q${p.precio.toFixed(2)}</td>
      <td>${margen.toFixed(2)}%</td>
      <td>Q${gananciaTotal.toFixed(2)}</td>
    `;
    tablaMargenes.appendChild(row);
  });
}



function mostrarProductosPorUbicacion() {
  const contenedor = document.getElementById("reporte-por-ubicacion");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const productosPorUbicacion = {};
  productos.forEach(p => {
    const ubicacion = p.ubicacion?.descripcion || "Sin Ubicación";
    if (!productosPorUbicacion[ubicacion]) productosPorUbicacion[ubicacion] = [];
    productosPorUbicacion[ubicacion].push(p);
  });

  Object.keys(productosPorUbicacion).forEach(ubi => {
    const tabla = document.createElement("table");
    tabla.border = "1";
    tabla.style.marginBottom = "20px";
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio</th>
          <th>Costo</th>
          <th>Stock Mínimo</th>
          <th>Proveedor</th>
        </tr>
      </thead>
      <tbody>
        ${productosPorUbicacion[ubi].map(p => `
          <tr ${p.cantidad <= p.stockMinimo ? 'style="background-color:#FFC7CE;"' : ''}>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>Q${p.precio}</td>
            <td>Q${p.costo}</td>
            <td>${p.stockMinimo}</td>
            <td>${p.proveedor?.nombre || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    const titulo = document.createElement("h4");
    titulo.textContent = `Ubicación: ${ubi}`;
    contenedor.appendChild(titulo);
    contenedor.appendChild(tabla);
  });
}

async function cargarReporteCompras() {
  try {
    const res = await fetch(`${API_URL}/OrdenesCompra/reporte`);
    const compras = await res.json();

    const contenedor = document.getElementById("reporte-compras");
    contenedor.innerHTML = "";

    compras.forEach(c => {
      const div = document.createElement("div");
      div.classList.add("orden-compra");

      div.innerHTML = `
        <h4>Orden #${c.id} - ${new Date(c.fecha).toLocaleDateString()}</h4>
        <p><strong>Proveedor:</strong> ${c.proveedor}</p>
        <p><strong>Estado:</strong> ${c.estado}</p>
        <p><strong>Total:</strong> Q${c.total.toFixed(2)}</p>
        <table border="1" style="margin-top:5px; border-collapse:collapse; width:100%;">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Costo Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${c.detalles.map(d => `
              <tr>
                <td>${d.producto}</td>
                <td>${d.cantidad}</td>
                <td>Q${d.costoUnitario.toFixed(2)}</td>
                <td>Q${d.subtotal.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      contenedor.appendChild(div);
    });

  } catch (error) {
    console.error("Error cargando reporte de compras:", error);
  }
}


async function exportarExcelStockBajo() {
    const productosBajos = productos.filter(p => p.cantidad <= p.stockMinimo);
    if (productosBajos.length === 0) {
        alert("No hay productos con stock bajo.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Stock Bajo');

    sheet.columns = [
        { header: 'ID', key: 'id', width: 5 },
        { header: 'Nombre', key: 'nombre', width: 25 },
        { header: 'Cantidad', key: 'cantidad', width: 10 },
        { header: 'Stock Mínimo', key: 'stockMinimo', width: 12 },
        { header: 'Proveedor', key: 'proveedor', width: 20 },
        { header: 'Ubicacion', key: 'ubicacion', width: 25 },
    ];

    productosBajos.forEach(p => {
        sheet.addRow({
            id: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad,
            stockMinimo: p.stockMinimo,
            proveedor: p.proveedor?.nombre || '-',
            ubicacion: p.ubicacion?.descripcion || '-'
        });
    });

    sheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { horizontal: 'center' };
    });

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Stock_Bajo_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
}






async function exportarExcelInventario() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventario');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 5 },
    { header: 'Nombre', key: 'nombre', width: 25 },
    { header: 'Cantidad', key: 'cantidad', width: 10 },
    { header: 'Precio', key: 'precio', width: 12 },
    { header: 'Costo', key: 'costo', width: 12 },
    { header: 'GananciaUnidad', key: 'gananciaUnidad', width: 15 },
    { header: 'GananciaTotal', key: 'gananciaTotal', width: 15 },
    { header: 'StockMinimo', key: 'stockMinimo', width: 12 },
    { header: 'Proveedor', key: 'proveedor', width: 20 },
    { header: 'Ubicacion', key: 'ubicacion', width: 25 },
  ];

  productos.forEach(p => {
    sheet.addRow({
      id: p.id, nombre: p.nombre, cantidad: p.cantidad,
      precio: p.precio, costo: p.costo,
      gananciaUnidad: p.gananciaUnidad, gananciaTotal: p.gananciaTotal,
      stockMinimo: p.stockMinimo,
      proveedor: p.proveedor?.nombre || '-', ubicacion: p.ubicacion?.descripcion || '-',
    });
  });

  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF4F81BD'} };
    cell.alignment = { horizontal: 'center' };
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cantidad = row.getCell('cantidad').value;
    const stockMin = row.getCell('stockMinimo').value;
    if (cantidad <= stockMin) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFFFC7CE'} };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_Inventario_${new Date().toISOString().slice(0,10)}.xlsx`;
  link.click();
}

async function exportarExcelPorUbicacion() {
  const workbook = new ExcelJS.Workbook();

  const ubicacionesMap = {};
  productos.forEach(p => {
    const ubicacion = p.ubicacion?.descripcion || "Sin Ubicación";
    if (!ubicacionesMap[ubicacion]) ubicacionesMap[ubicacion] = [];
    ubicacionesMap[ubicacion].push(p);
  });

  for (const ubicacion in ubicacionesMap) {
    const sheet = workbook.addWorksheet(ubicacion.slice(0,31));
    sheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Stock Mínimo', key: 'stockMinimo', width: 12 },
      { header: 'Precio', key: 'precio', width: 12 },
      { header: 'Costo', key: 'costo', width: 12 },
      { header: 'Ganancia Unidad', key: 'gananciaUnidad', width: 15 },
      { header: 'Ganancia Total', key: 'gananciaTotal', width: 15 },
      { header: 'Proveedor', key: 'proveedor', width: 20 },
    ];

    ubicacionesMap[ubicacion].forEach(p => {
      sheet.addRow({
        id: p.id, nombre: p.nombre, cantidad: p.cantidad, stockMinimo: p.stockMinimo,
        precio: p.precio, costo: p.costo, gananciaUnidad: p.gananciaUnidad,
        gananciaTotal: p.gananciaTotal, proveedor: p.proveedor?.nombre || '-',
      });
    });

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF4F81BD'} };
      cell.alignment = { horizontal: 'center' };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cantidad = row.getCell('cantidad').value;
      const stockMin = row.getCell('stockMinimo').value;
      if (cantidad <= stockMin) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFFFC7CE'} };
        });
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_Productos_por_Ubicacion_Detallado_${new Date().toISOString().slice(0,10)}.xlsx`;
  link.click();
}



async function exportarExcelMargenes() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Márgenes de Ganancia");

  // Encabezados con estilo
  sheet.addRow(["Producto", "Costo Unitario", "Precio Unitario", "Margen (%)", "Ganancia Total"]).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
    cell.alignment = { horizontal: "center" };
    cell.border = { top: {style:"thin"}, left: {style:"thin"}, bottom: {style:"thin"}, right: {style:"thin"} };
  });

  // Filas de datos
  productos.forEach(p => {
    const margenDecimal = p.precio > 0 ? (p.precio - p.costo) / p.precio : 0; // 👈 Decimal, no %
    const gananciaTotal = (p.precio - p.costo) * p.cantidad;

    sheet.addRow([
      p.nombre,
      p.costo,
      p.precio,
      margenDecimal,   // 👈 Se guarda como 0.33
      gananciaTotal
    ]);
  });

  // Formato columnas
  sheet.getColumn(2).numFmt = '"Q"#,##0.00'; // Costo
  sheet.getColumn(3).numFmt = '"Q"#,##0.00'; // Precio
  sheet.getColumn(4).numFmt = '0.00%';       //
  sheet.getColumn(5).numFmt = '"Q"#,##0.00'; // Ganancia total

  // Autoajustar ancho
  sheet.columns.forEach(col => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, cell => {
      maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 0);
    });
    col.width = maxLength < 15 ? 15 : maxLength;
  });

  // Descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte_margenes.xlsx";
  a.click();
  window.URL.revokeObjectURL(url);
}




async function exportarExcelCompras() {
  const res = await fetch(`${API_URL}/OrdenesCompra/reporte`);
  const data = await res.json();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Histórico Compras");

  // Encabezados
  worksheet.columns = [
    { header: "Orden ID", key: "id", width: 10 },
    { header: "Fecha", key: "fecha", width: 20 },
    { header: "Proveedor", key: "proveedor", width: 25 },
    { header: "Estado", key: "estado", width: 15 },
    { header: "Producto", key: "producto", width: 25 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "Costo Unitario", key: "costoUnitario", width: 15 },
    { header: "Subtotal", key: "subtotal", width: 15 },
    { header: "Total Orden", key: "total", width: 15 }
  ];

  // Estilo de encabezados
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF444444" } };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // Insertar datos
  data.forEach(orden => {
    orden.detalles.forEach(det => {
      worksheet.addRow({
        id: orden.id,
        fecha: new Date(orden.fecha).toLocaleDateString(),
        proveedor: orden.proveedor,
        estado: orden.estado,
        producto: det.producto,
        cantidad: det.cantidad,
        costoUnitario: det.costoUnitario,
        subtotal: det.subtotal,
        total: orden.total
      });
    });
  });

  // Estilo filas de datos
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // saltar encabezado
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      if ([6, 7, 8, 9].includes(colNumber)) {
        // columnas numéricas
        cell.alignment = { horizontal: "right" };
        if (colNumber >= 7) {
          // costo, subtotal, total → moneda
          cell.numFmt = '"Q"#,##0.00';
        }
      }
    });
  });

  // Descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Historico_Compras.xlsx";
  link.click();
}

// ================================================================
// ===============  GESTIÓN DE COMPRAS: SOLICITUDES  ==============
// ================================================================
async function cargarSolicitudes() {
  const res = await fetch(`${API_URL}/solicitudescompra`);
  solicitudes = await res.json();
  renderSolicitudes();
  cargarSelectsSolicitud({ preserveProveedor: true });
}

function renderSolicitudes() {
  const tbody = document.querySelector("#tabla-solicitudes tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  solicitudes.forEach(s => {
    const detalles = (s.detalles || []).map(d => `${d.producto?.nombre || d.productoNombre} x${d.cantidad}`).join(", ");
    const acciones = `
      ${s.estado === "Pendiente" ? `
        <button onclick="aprobarSolicitud(${s.id})">✅ Aprobar</button>
        <button onclick="rehazarSolicitud(${s.id})">⛔ Rechazar</button>
        <button onclick="eliminarSolicitudOrden(${s.id})">🗑️ Eliminar</button>
      ` : `
        <button onclick="verSolicitud(${s.id})">👀 Ver</button>
      `}
    `.trim();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${new Date(s.fecha).toLocaleDateString()}</td>
      <td>${s.estado}</td>
      <td>${detalles}</td>
      <td>${acciones}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- SELECTS (Solicitudes) ----
function cargarSelectsSolicitud({ preserveProveedor = true, resetProveedor = false } = {}) {
  const selProv = document.getElementById("solicitud-proveedorId");
  const selProd = document.getElementById("solicitud-productoId");

  if (selProv) {
    const prevVal = selProv.value;
    const prevDisabled = selProv.disabled;

    if (!preserveProveedor || selProv.options.length <= 1 || resetProveedor) {
      selProv.innerHTML = `<option value="">-- Selecciona Proveedor --</option>`;
      proveedores.forEach(p => selProv.innerHTML += `<option value="${p.id}">${p.nombre}</option>`);
      if (!resetProveedor && prevVal) selProv.value = prevVal;
      selProv.disabled = prevDisabled && !resetProveedor ? prevDisabled : false;
    }
  }

  if (selProd) {
    selProd.innerHTML = `<option value="">-- Selecciona Producto --</option>`;
    const provId = parseInt(document.getElementById("solicitud-proveedorId")?.value);
    const candidatos = provId ? productos.filter(p => p.proveedorId === provId) : productos;

    candidatos.forEach(p => {
      if (!detallesSolicitud.some(d => d.productoId === p.id)) {
        selProd.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
      }
    });

    selProd.onchange = () => {
      const id = parseInt(selProd.value);
      const prod = productos.find(p => p.id === id);
      const costo = document.getElementById("solicitud-costo");
      if (costo) costo.value = prod ? prod.costo : "";
    };
  }
}

function filtrarProductosPorProveedorSolicitud() {
  cargarSelectsSolicitud();
}

function agregarDetalleSolicitud() {
  const selProv = document.getElementById("solicitud-proveedorId");
  const provId = parseInt(selProv?.value);
  const prodId = parseInt(document.getElementById("solicitud-productoId")?.value);
  const cantidad = parseInt(document.getElementById("solicitud-cantidad")?.value);

  if (!provId) return alert("Primero selecciona un proveedor.");
  if (!prodId || !cantidad || cantidad <= 0) return alert("Selecciona un producto y una cantidad válida.");
  if (detallesSolicitud.some(d => d.productoId === prodId)) return alert("Este producto ya fue agregado.");

  const prod = productos.find(p => p.id === prodId);
  if (!prod) return;

  detallesSolicitud.push({
    productoId: prodId,
    producto: prod,
    cantidad,
    costoUnitario: prod.costo ?? 0
  });

  // Bloquear proveedor tras el primer detalle
  if (selProv && !selProv.disabled) selProv.disabled = true;

  renderDetallesSolicitud();
  if (document.getElementById("solicitud-productoId")) document.getElementById("solicitud-productoId").value = "";
  if (document.getElementById("solicitud-cantidad")) document.getElementById("solicitud-cantidad").value = "";
  if (document.getElementById("solicitud-costo")) document.getElementById("solicitud-costo").value = "";
}

function renderDetallesSolicitud() {
  const tbody = document.querySelector("#tabla-detalles-solicitud tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  detallesSolicitud.forEach((d, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${d.producto.nombre}</td>
        <td>${d.cantidad}</td>
        <td>${d.costoUnitario.toFixed(2)}</td>
        <td><button onclick="eliminarDetalleSolicitud(${i})">X</button></td>
      </tr>
    `;
  });

  cargarSelectsSolicitud({ preserveProveedor: true });
}

function eliminarDetalleSolicitud(i) {
  detallesSolicitud.splice(i, 1);
  if (detallesSolicitud.length === 0) {
    const selProv = document.getElementById("solicitud-proveedorId");
    if (selProv) selProv.disabled = false; // desbloquear proveedor si ya no hay detalles
  }
  renderDetallesSolicitud();
}

async function agregarSolicitud(e) {
  e.preventDefault();

  const proveedorId = parseInt(document.getElementById("solicitud-proveedorId").value);
  if (!proveedorId || detallesSolicitud.length === 0) {
    alert("Debe seleccionar un proveedor y al menos un producto.");
    return;
  }

  const solicitud = {
    proveedorId,
    detalles: detallesSolicitud.map(d => ({
      productoId: d.productoId,
      cantidad: d.cantidad,
      costoUnitario: d.costoUnitario
    }))
  };

  // 👉 Ahora sí puedes loguearlo
  console.log("Solicitud a enviar:", JSON.stringify(solicitud, null, 2));

  const res = await fetch(`${API_URL}/solicitudescompra`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(solicitud)
  });

  if (!res.ok) return alert("Error al guardar la solicitud.");

  detallesSolicitud = [];
  renderDetallesSolicitud();
  const form = document.getElementById("form-solicitud");
  if (form) form.reset();
  const selProv = document.getElementById("solicitud-proveedorId");
  if (selProv) selProv.disabled = false;

  await cargarSolicitudes();
}


async function generarSolicitudAutomatica() {
  const res = await fetch(`${API_URL}/solicitudescompra/generar-automatica`, { method: "POST" });
  if (res.ok) {
    alert("Solicitud de compra automática generada.");
    await cargarSolicitudes();
  } else {
    const msg = await res.text();
    alert(msg || "No se pudo generar automáticamente.");
  }
}

// ---- Aprobación/Rechazo Solicitud (crea Orden automáticamente al aprobar) ----
async function aprobarSolicitud(id) {
  if (!confirm("¿Aprobar esta solicitud y generar la Orden de Compra?")) return;
  try {
    const res = await fetch(`${API_URL}/solicitudescompra/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("Aprobada")
    });

    if (!res.ok) throw new Error("No se pudo aprobar la solicitud.");

    alert("✅ Solicitud aprobada y Orden generada automáticamente.");
    await Promise.all([cargarSolicitudes(), cargarOrdenes()]);
  } catch (err) {
    console.error(err);
    alert("❌ No se pudo completar la aprobación automática.");
  }
}


async function rechazarSolicitud(id) {
  if (!confirm("¿Rechazar esta solicitud?")) return;
  const res = await fetch(`${API_URL}/solicitudescompra/${id}/estado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify("Rechazada")
  });
  if (res.ok) {
    await cargarSolicitudes();
  } else {
    alert("No se pudo rechazar la solicitud.");
  }
}

function verSolicitud(id) {
  const s = solicitudes.find(x => x.id === id);
  if (!s) return;
  let msg = `Solicitud #${s.id}\nProveedor: ${s.proveedor?.nombre || "-"}\nEstado: ${s.estado}\n\nDetalles:\n`;
  (s.detalles || []).forEach(d => {
    const nombre = d.producto?.nombre || d.productoNombre;
    const costo = (d.costoUnitario ?? d.costo) || d.producto?.costo;

    msg += `- ${nombre} x${d.cantidad} (Q${costo})\n`;
  });
  alert(msg);
}

async function eliminarSolicitudOrden(id) {
  if (!confirm("¿Eliminar esta solicitud?")) return;
  const res = await fetch(`${API_URL}/solicitudescompra/${id}`, { method: "DELETE" });
  if (res.ok) {
    await cargarSolicitudes();
  } else {
    alert("No se pudo eliminar la solicitud (quizá ya está aprobada).");
  }
}

// ================================================================
// ===============  GESTIÓN DE COMPRAS: ÓRDENES (OC)  ==============
// ================================================================
async function cargarOrdenes() {
  const res = await fetch(`${API_URL}/ordenescompra`);
  ordenes = await res.json();
  renderOrdenes();
}

function renderOrdenes() {
  const tbody = document.querySelector("#tabla-ordenes tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  ordenes.forEach(o => {
    const detalles = (o.detalles || []).map(d => `${d.producto?.nombre} x${d.cantidad}`).join(", ");
    let acciones = "";

    if (o.estado === "Pendiente") {
      acciones = `
        <button onclick="aprobarOrden(${o.id})">✅ Aprobar</button>
        <button onclick="rechazarOrden(${o.id})">⛔ Rechazar</button>
        <button onclick="eliminarOrden(${o.id})">🗑️ Eliminar</button>
      `;
    } else if (o.estado === "Aprobada") {
      acciones = `<button onclick="recibirOrden(${o.id})">📦 Recibir</button>
      <button onclick="exportarExcelOrden(${o.id})">📦 Exportar a Excel</button>`;
      
    } else if (o.estado === "Recibida") {
      acciones = `
        <button onclick="verOrden(${o.id})">👀 Ver Detalles</button>
        <button onclick="eliminarOrden(${o.id})">🗑️ Eliminar</button>
        <button onclick="exportarExcelOrden(${o.id})">📦 Exportar a Excel</button>

      `;
    } else if (o.estado === "Rechazada") {
      acciones = `
        <button onclick="verOrden(${o.id})">👀 Ver Detalles</button>
        <button onclick="eliminarOrden(${o.id})">🗑️ Eliminar</button>
      `;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${new Date(o.fecha).toLocaleDateString()}</td>
      <td>${o.proveedor?.nombre || ""}</td>
      <td>${o.estado}</td>
      <td>${detalles}</td>
      <td>${acciones}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- Acciones de OC ----
async function aprobarOrden(id) {
  if (!confirm("¿Deseas aprobar esta orden de compra?")) return;

  try {
    const res = await fetch(`${API_URL}/ordenescompra/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("Aprobada")
    });

    if (!res.ok) throw new Error("Error al aprobar la orden");
    alert("✅ Orden aprobada correctamente.");
    await cargarOrdenes();
  } catch (err) {
    console.error("Error al aprobar orden:", err);
    alert("❌ No se pudo aprobar la orden.");
  }
}

async function rechazarOrden(id) {
  if (!confirm("¿Rechazar esta orden?")) return;
  try {
    const res = await fetch(`${API_URL}/ordenescompra/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("Rechazada")
    });
    if (!res.ok) throw new Error("No se pudo rechazar");
    alert("⛔ Orden rechazada.");
    await cargarOrdenes();
  } catch (e) {
    console.error(e);
    alert("❌ Error al rechazar la orden.");
  }
}

async function recibirOrden(id) {
  if (!confirm("¿Confirmas la recepción de esta orden? Se actualizará el stock.")) return;

  try {
    const res = await fetch(`${API_URL}/ordenescompra/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("Recibida")
    });

    if (!res.ok) throw new Error("Error al recibir la orden");

    alert("📦 Orden recibida y stock actualizado.");
    await Promise.all([cargarOrdenes(), cargarProductos()]);
  } catch (err) {
    console.error("Error al recibir orden:", err);
    alert("❌ No se pudo recibir la orden.");
  }
}

function verOrden(id) {
  const orden = ordenes.find(o => o.id === id);
  if (!orden) return;

  let msg = `Orden #${orden.id}\nProveedor: ${orden.proveedor?.nombre}\nEstado: ${orden.estado}\n\nDetalles:\n`;
  (orden.detalles || []).forEach(d => {
    msg += `- ${d.producto?.nombre} x${d.cantidad} (Q${d.costoUnitario})\n`;
  });

  alert(msg);
}

async function eliminarOrden(id) {
  if (!confirm("¿Seguro que deseas eliminar esta orden?")) return;

  const res = await fetch(`${API_URL}/ordenescompra/${id}`, {
    method: "DELETE"
  });

  if (res.ok) {
    await cargarOrdenes();
  } else {
    alert("No se pudo eliminar (solo órdenes pendientes/rechazadas).");
  }
}

// ================================================================
// ===============  INICIALIZACIÓN ================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([
      cargarProductos(),
      cargarProveedores(),
      cargarUbicaciones(),
      cargarPedidos(),
      cargarSolicitudes(),
      cargarOrdenes()
    ]);

    // Vista inicial (ajústalo a tu preferencia)
    mostrarVista("inventario");
    mostrarSubSeccion("productos");

    console.log("Datos cargados correctamente al inicio.");
  } catch (error) {
    console.error("Error cargando datos al inicio:", error);
  }

  // --- LOGIN/REGISTER/LOGOUT ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const usuario = document.getElementById('login-usuario').value;
      const contraseña = document.getElementById('login-contraseña').value;
      const errorDiv = document.getElementById('login-error');
      errorDiv.textContent = '';
      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombreUsuario: usuario, contraseña })
        });
        if (resp.ok) {
          document.getElementById('login-container').style.display = 'none';
          document.getElementById('main-content').style.display = '';
        } else {
          const data = await resp.json();
          errorDiv.textContent = data || 'Usuario o contraseña incorrectos';
        }
      } catch {
        errorDiv.textContent = 'Error de conexión con el servidor.';
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const usuario = document.getElementById('register-usuario').value;
      const contraseña = document.getElementById('register-contraseña').value;
      const errorDiv = document.getElementById('register-error');
      const successDiv = document.getElementById('register-success');
      errorDiv.textContent = '';
      successDiv.textContent = '';
      try {
        const resp = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombreUsuario: usuario, contraseña })
        });
        if (resp.ok) {
          const data = await resp.json();
          successDiv.textContent = data.mensaje || 'Usuario registrado correctamente';
        } else {
          const data = await resp.json();
          errorDiv.textContent = data || 'Error al registrar usuario';
        }
      } catch {
        errorDiv.textContent = 'Error de conexión con el servidor.';
      }
    });
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', function () {
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('login-container').style.display = '';
      // Limpiar campos y mensajes
      document.getElementById('login-usuario').value = '';
      document.getElementById('login-contraseña').value = '';
      document.getElementById('login-error').textContent = '';
      document.getElementById('register-usuario').value = '';
      document.getElementById('register-contraseña').value = '';
      document.getElementById('register-error').textContent = '';
      document.getElementById('register-success').textContent = '';
    });
  }
});

async function exportarExcelStockBajo() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Stock Bajo");

  // Encabezados
  sheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Nombre", key: "nombre", width: 25 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "Stock Mínimo", key: "stockMinimo", width: 15 },
    { header: "Proveedor", key: "proveedor", width: 25 },
    { header: "Ubicación", key: "ubicacion", width: 20 }
  ];

  // Estilo encabezados
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB22222" } };
    cell.alignment = { horizontal: "center" };
    cell.border = { top: {style:"thin"}, left:{style:"thin"}, bottom:{style:"thin"}, right:{style:"thin"} };
  });

  // Filtrar productos con stock bajo
  const productosStockBajo = productos.filter(p => p.cantidad <= p.stockMinimo);

  productosStockBajo.forEach(p => {
    const row = sheet.addRow({
      id: p.id,
      nombre: p.nombre,
      cantidad: p.cantidad,
      stockMinimo: p.stockMinimo,
      proveedor: p.proveedor?.nombre || "-",
      ubicacion: p.ubicacion?.descripcion || "-"
    });

    // Pintar en rojo filas críticas
    row.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } };
    });
  });

  if (productosStockBajo.length === 0) {
    sheet.addRow(["No hay productos en stock bajo."]);
  }

  // Descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_Stock_Bajo_${new Date().toISOString().slice(0,10)}.xlsx`;
  link.click();
}


async function exportarExcelOrden(id) {
  const orden = ordenes.find(o => o.id === id);
  if (!orden) return alert("Orden no encontrada.");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Orden_${id}`);

  // Columnas
  sheet.columns = [
    { header: "Orden ID", key: "id", width: 10 },
    { header: "Fecha", key: "fecha", width: 15 },
    { header: "Proveedor", key: "proveedor", width: 25 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Producto", key: "producto", width: 25 },
    { header: "Cantidad", key: "cantidad", width: 10 },
    { header: "Costo Unitario", key: "costoUnitario", width: 15 },
    { header: "Subtotal", key: "subtotal", width: 15 },
  ];

  // Estilo encabezados
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
    cell.alignment = { horizontal: "center" };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  // Filas de detalle
  let totalOrden = 0;
  orden.detalles.forEach(d => {
    const subtotal = (d.costoUnitario ?? 0) * (d.cantidad ?? 0);
    totalOrden += subtotal;

    sheet.addRow({
      id: orden.id,
      fecha: new Date(orden.fecha).toLocaleDateString(),
      proveedor: orden.proveedor?.nombre || "-",
      estado: orden.estado,
      producto: d.producto?.nombre || "-",
      cantidad: d.cantidad,
      costoUnitario: d.costoUnitario,
      subtotal
    });
  });

  // Agregar fila de total
  const lastRow = sheet.addRow({
    producto: "TOTAL",
    subtotal: totalOrden
  });

  lastRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    if (colNumber === 8) cell.numFmt = '"Q"#,##0.00';
  });

  // Formato columnas numéricas
  sheet.getColumn(7).numFmt = '"Q"#,##0.00'; // Costo unitario
  sheet.getColumn(8).numFmt = '"Q"#,##0.00'; // Subtotal

  // Descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Orden_${id}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}


