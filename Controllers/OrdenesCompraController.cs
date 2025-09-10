using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CanchesTechnology2.Data;
using CanchesTechnology2.Models;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdenesCompraController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdenesCompraController(AppDbContext context)
        {
            _context = context;
        }

        // 🔹 Obtener todas las órdenes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrdenCompra>>> GetOrdenes()
        {
            return await _context.OrdenesCompra
                .Include(o => o.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(o => o.Proveedor)
                .ToListAsync();
        }

        // 🔹 Obtener una orden específica
        [HttpGet("{id}")]
        public async Task<ActionResult<OrdenCompra>> GetOrden(int id)
        {
            var orden = await _context.OrdenesCompra
                .Include(o => o.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(o => o.Proveedor)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (orden == null) return NotFound();
            return orden;
        }

        // 🔹 Actualizar estado (Aprobada / Rechazada / Recibida)
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> ActualizarEstado(int id, [FromBody] string nuevoEstado)
        {
            var orden = await _context.OrdenesCompra
                .Include(o => o.Detalles)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (orden == null) return NotFound();

            if (nuevoEstado == "Recibida")
            {
                foreach (var detalle in orden.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    if (producto != null)
                    {
                        producto.Cantidad += detalle.Cantidad;
                    }
                }
            }

            orden.Estado = nuevoEstado;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 🔹 Eliminar orden (solo si está Pendiente o Rechazada)
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarOrden(int id)
        {
            var orden = await _context.OrdenesCompra
                .Include(o => o.Detalles)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (orden == null)
                return NotFound();

            if (orden.Estado != "Pendiente" && orden.Estado != "Rechazada")
                return BadRequest("Solo se pueden eliminar órdenes pendientes o rechazadas.");

            _context.DetallesOrdenCompra.RemoveRange(orden.Detalles);
            _context.OrdenesCompra.Remove(orden);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // 🔹 Reporte histórico detallado de compras
        [HttpGet("reporte")]
        public async Task<ActionResult<IEnumerable<object>>> GetReporteCompras()
        {
            var ordenes = await _context.OrdenesCompra
                .Include(o => o.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(o => o.Proveedor)
                .ToListAsync();

            var reporte = ordenes.Select(o => new
            {
                o.Id,
                o.Fecha,
                Proveedor = o.Proveedor != null ? o.Proveedor.Nombre : "N/A",
                o.Estado,
                Total = o.Detalles.Sum(d => d.Cantidad * d.CostoUnitario),
                Detalles = o.Detalles.Select(d => new
                {
                    Producto = d.Producto != null ? d.Producto.Nombre : "N/A",
                    d.Cantidad,
                    d.CostoUnitario,
                    Subtotal = d.Cantidad * d.CostoUnitario
                })
            });

            return Ok(reporte);
        }


    }
}
