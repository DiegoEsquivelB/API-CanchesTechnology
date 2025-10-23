using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [AllowAnonymous]
    public class FaviconController : ControllerBase
    {
        // Responde a /favicon.ico con 204 No Content para evitar 401 cuando no haya archivo
        [HttpGet("/favicon.ico")]
        public IActionResult Get() => NoContent();
    }
}
