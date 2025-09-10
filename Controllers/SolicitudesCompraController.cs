using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CanchesTechnology2.Data;
using CanchesTechnology2.Models;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SolicitudesCompraController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SolicitudesCompraController(AppDbContext context)
        {
            _context = context;
        }

        // 🔹 Obtener todas las solicitudes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SolicitudCompra>>> GetSolicitudes()
        {
            return await _context.SolicitudesCompra
                .Include(s => s.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(s => s.Proveedor)
                .ToListAsync();
        }

        // 🔹 Obtener una solicitud específica
        [HttpGet("{id}")]
        public async Task<ActionResult<SolicitudCompra>> GetSolicitud(int id)
        {
            var solicitud = await _context.SolicitudesCompra
                .Include(s => s.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(s => s.Proveedor)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null) return NotFound();
            return solicitud;
        }

        // 🔹 Crear solicitud manual
        [HttpPost]
        public async Task<ActionResult<SolicitudCompra>> CrearSolicitud(SolicitudCompra solicitud)
        {
            solicitud.Fecha = DateTime.Now;
            solicitud.Estado = "Pendiente";

            _context.SolicitudesCompra.Add(solicitud);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSolicitud), new { id = solicitud.Id }, solicitud);
        }

        // 🔹 Generar solicitud automática (por productos en bajo stock)
        [HttpPost("generar-automatica")]
        public async Task<ActionResult<SolicitudCompra>> GenerarAutomatica()
        {
            var productosBajos = await _context.Productos
                .Include(p => p.Proveedor)
                .Where(p => p.Cantidad <= p.StockMinimo && p.ProveedorId != null)
                .ToListAsync();

            if (!productosBajos.Any())
                return BadRequest("No hay productos con bajo stock.");

            var proveedorId = productosBajos.First().ProveedorId ?? 0;

            var solicitud = new SolicitudCompra
            {
                ProveedorId = proveedorId,
                Estado = "Pendiente",
                Fecha = DateTime.Now,
                Detalles = productosBajos.Select(p => new DetalleSolicitudCompra
                {
                    ProductoId = p.Id,
                    Cantidad = (p.StockMinimo * 2) - p.Cantidad, // reabastecer al doble del mínimo
                    CostoUnitario = p.Costo
                }).ToList()
            };

            _context.SolicitudesCompra.Add(solicitud);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSolicitud), new { id = solicitud.Id }, solicitud);
        }

        // 🔹 Cambiar estado (Pendiente → Aprobada → Rechazada)
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> ActualizarEstado(int id, [FromBody] string nuevoEstado)
        {
            var solicitud = await _context.SolicitudesCompra
                .Include(s => s.Detalles)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null) return NotFound();

            // 👉 Si se aprueba, crear la OrdenCompra automáticamente
            if (nuevoEstado == "Aprobada")
            {
                var orden = new OrdenCompra
                {
                    Fecha = DateTime.Now,
                    ProveedorId = solicitud.ProveedorId, 
                    Estado = "Pendiente",
                    Detalles = solicitud.Detalles.Select(d => new DetalleOrdenCompra
                    {
                        ProductoId = d.ProductoId,
                        Cantidad = d.Cantidad,
                        CostoUnitario = d.CostoUnitario
                    }).ToList()
                };

                _context.OrdenesCompra.Add(orden);
            }

            solicitud.Estado = nuevoEstado;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 🔹 Eliminar solicitud (solo si está Rechazada, Aprobada o Cancelada)
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarSolicitud(int id)
        {
            var solicitud = await _context.SolicitudesCompra
                .Include(s => s.Detalles)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (solicitud == null)
                return NotFound();

            // 🔹 Eliminar solicitud y sus detalles
            _context.DetallesSolicitudesCompra.RemoveRange(solicitud.Detalles);
            _context.SolicitudesCompra.Remove(solicitud);

            await _context.SaveChangesAsync();
            return NoContent();
        }

    }
}
