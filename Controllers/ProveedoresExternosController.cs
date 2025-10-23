using Microsoft.AspNetCore.Mvc;
using CanchesTechnology2.Services;
using CanchesTechnology2.Models;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresExternosController : ControllerBase
    {
        private readonly ApiContactosService _apiContactosService;

        public ProveedoresExternosController(ApiContactosService apiContactosService)
        {
            _apiContactosService = apiContactosService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProveedorExterno>>> GetProveedoresExternos()
        {
            var proveedores = await _apiContactosService.ObtenerProveedoresExternosAsync();
            if (proveedores == null)
                return StatusCode(502, "No se pudo obtener la lista de proveedores externos.");
            return Ok(proveedores);
        }
    }
}