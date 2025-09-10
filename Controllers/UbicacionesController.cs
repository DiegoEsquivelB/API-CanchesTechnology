using CanchesTechnology2.Data;
using CanchesTechnology2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UbicacionesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UbicacionesController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/ubicaciones
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ubicacion>>> GetUbicaciones()
        {
            return await _context.Ubicaciones.ToListAsync();
        }

        // ✅ GET: api/ubicaciones/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Ubicacion>> GetUbicacion(int id)
        {
            var ubicacion = await _context.Ubicaciones.FindAsync(id);
            if (ubicacion == null)
                return NotFound();

            return ubicacion;
        }

        // ✅ POST: api/ubicaciones
        [HttpPost]
        public async Task<ActionResult<Ubicacion>> PostUbicacion(Ubicacion ubicacion)
        {
            // 🔒 Validar código único
            if (await _context.Ubicaciones.AnyAsync(u => u.Codigo == ubicacion.Codigo))
            {
                return BadRequest(new { mensaje = "⚠️ El código de ubicación ya existe." });
            }

            _context.Ubicaciones.Add(ubicacion);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUbicacion), new { id = ubicacion.Id }, ubicacion);
        }

        // ✅ PUT: api/ubicaciones/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUbicacion(int id, Ubicacion ubicacion)
        {
            if (id != ubicacion.Id)
                return BadRequest();

            // 🔒 Validar código único (excepto la misma ubicación)
            if (await _context.Ubicaciones.AnyAsync(u => u.Codigo == ubicacion.Codigo && u.Id != id))
            {
                return BadRequest(new { mensaje = "⚠️ El código de ubicación ya existe." });
            }

            _context.Entry(ubicacion).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Ubicaciones.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // ✅ DELETE: api/ubicaciones/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUbicacion(int id)
        {
            var ubicacion = await _context.Ubicaciones.FindAsync(id);
            if (ubicacion == null)
                return NotFound();

            _context.Ubicaciones.Remove(ubicacion);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
