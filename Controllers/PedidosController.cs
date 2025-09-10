using CanchesTechnology2.Data;
using CanchesTechnology2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CanchesTechnology2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PedidosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PedidosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/pedidos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
        {
            return await _context.Pedidos
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.Producto)
                .ToListAsync();
        }

        // GET: api/pedidos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Pedido>> GetPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound();
            }

            return pedido;
        }

        // POST: api/pedidos
        [HttpPost]
        public async Task<ActionResult<Pedido>> CrearPedido(Pedido pedido)
        {
            List<string> alertas = new();

            foreach (var detalle in pedido.Detalles)
            {
                var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                if (producto == null) return BadRequest($"Producto {detalle.ProductoId} no encontrado");

                if (detalle.Cantidad > producto.Cantidad)
                    return BadRequest($"Stock insuficiente para el producto {producto.Nombre}");

                // Descontar stock
                producto.Cantidad -= detalle.Cantidad;

                // Revisar si queda por debajo del stock mínimo
                if (producto.Cantidad < producto.StockMinimo)
                {
                    alertas.Add($"⚠️ El producto {producto.Nombre} está por debajo del stock mínimo (Stock: {producto.Cantidad}, Min: {producto.StockMinimo})");
                }
            }

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            return Ok(new { Pedido = pedido, Alertas = alertas });
        }



        // PUT: api/pedidos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarPedido(int id, Pedido pedidoActualizado)
        {
            var pedidoExistente = await _context.Pedidos
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedidoExistente == null) return NotFound();

            // 1️⃣ Reponer stock de los productos antiguos
            foreach (var detalle in pedidoExistente.Detalles)
            {
                var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                if (producto != null)
                {
                    producto.Cantidad += detalle.Cantidad;
                }
            }

            // 2️⃣ Limpiar detalles antiguos
            _context.DetallesPedidos.RemoveRange(pedidoExistente.Detalles);

            // 3️⃣ Aplicar nuevos detalles y descontar stock
            pedidoExistente.Cliente = pedidoActualizado.Cliente;
            pedidoExistente.Fecha = DateTime.Now;
            pedidoExistente.Detalles = pedidoActualizado.Detalles;

            foreach (var detalle in pedidoExistente.Detalles)
            {
                var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                if (producto == null) return BadRequest($"Producto {detalle.ProductoId} no encontrado");

                if (detalle.Cantidad > producto.Cantidad)
                    return BadRequest($"Stock insuficiente para el producto {producto.Nombre}");

                producto.Cantidad -= detalle.Cantidad;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }



        // DELETE: api/pedidos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Detalles)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound();
            }

            // primero eliminamos los detalles
            _context.DetallesPedidos.RemoveRange(pedido.Detalles);
            _context.Pedidos.Remove(pedido);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
