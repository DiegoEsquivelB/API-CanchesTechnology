using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CanchesTechnology2.Data;
using CanchesTechnology2.Models;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProveedoresController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Proveedor>>> GetProveedores()
        {
            return await _context.Proveedores.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Proveedor>> GetProveedor(int id)
        {
            var proveedor = await _context.Proveedores.FindAsync(id);
            if (proveedor == null) return NotFound();
            return proveedor;
        }

        [HttpPost]
        public async Task<ActionResult<Proveedor>> CrearProveedor(Proveedor proveedor)
        {
            // Validar Nit único
            if (!string.IsNullOrWhiteSpace(proveedor.Nit))
            {
                var existe = await _context.Proveedores.AnyAsync(p => p.Nit == proveedor.Nit);
                if (existe) return BadRequest(new { mensaje = "Ya existe un proveedor con ese NIT." });
            }

            _context.Proveedores.Add(proveedor);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { mensaje = "Error guardando proveedor.", detalle = ex.Message });
            }

            return CreatedAtAction(nameof(GetProveedor), new { id = proveedor.Id }, proveedor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProveedor(int id, Proveedor proveedor)
        {
            if (id != proveedor.Id) return BadRequest();

            // Validar Nit único (excluir el propio registro)
            if (!string.IsNullOrWhiteSpace(proveedor.Nit))
            {
                var existe = await _context.Proveedores.AnyAsync(p => p.Nit == proveedor.Nit && p.Id != proveedor.Id);
                if (existe) return BadRequest(new { mensaje = "Ya existe otro proveedor con ese NIT." });
            }

            _context.Entry(proveedor).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Proveedores.AnyAsync(e => e.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProveedor(int id)
        {
            var proveedor = await _context.Proveedores.FindAsync(id);
            if (proveedor == null) return NotFound();

            // Verificar si existen productos asociados -> evitar excepción por FK
            var tieneProductos = await _context.Productos.AnyAsync(p => p.ProveedorId == id);
            if (tieneProductos)
            {
                return BadRequest(new { mensaje = "No se puede eliminar el proveedor porque tiene productos asociados. Primero reasigne o elimine esos productos." });
            }

            _context.Proveedores.Remove(proveedor);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log si se quisiera (aquí devolvemos detalle mínimo)
                return StatusCode(500, new { mensaje = "Error eliminando proveedor.", detalle = ex.Message });
            }

            return NoContent();
        }
    }
}
