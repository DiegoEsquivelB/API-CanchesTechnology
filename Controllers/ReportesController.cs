using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CanchesTechnology2.Data;
using CanchesTechnology2.Models;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportesController(AppDbContext context)
        {
            _context = context;
        }

        // 🔹 1. Productos con bajo stock
        [HttpGet("stock-bajo")]
        public async Task<ActionResult<IEnumerable<Producto>>> GetStockBajo()
        {
            return await _context.Productos
                .Where(p => p.Cantidad <= p.StockMinimo)
                .ToListAsync();
        }

        // 🔹 2. Rotación de inventario (productos más vendidos)
        [HttpGet("rotacion")]
        public async Task<ActionResult<IEnumerable<object>>> GetRotacion()
        {
            var rotacion = await _context.DetallesPedidos
                .GroupBy(d => d.ProductoId)
                .Select(g => new
                {
                    ProductoId = g.Key,
                    NombreProducto = g.First().Producto != null ? g.First().Producto.Nombre : "N/A",
                    CantidadVendida = g.Sum(d => d.Cantidad)
                })
                .OrderByDescending(r => r.CantidadVendida)
                .ToListAsync();

            return rotacion;
        }

        // 🔹 3. Valor total del inventario
        [HttpGet("valor-inventario")]
        public async Task<ActionResult<decimal>> GetValorInventario()
        {
            var valor = await _context.Productos
                .SumAsync(p => p.Cantidad * p.Precio);

            return valor;
        }

        // 🔹 4. Pedidos pendientes (aún no entregados)
        [HttpGet("pedidos-pendientes")]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidosPendientes()
        {
            // Puedes agregar un campo Estado en Pedido (Ej: "Pendiente", "Completado")
            return await _context.Pedidos
                .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
                .Where(p => p.Detalles.Any())
                .ToListAsync();
        }
    }
}
