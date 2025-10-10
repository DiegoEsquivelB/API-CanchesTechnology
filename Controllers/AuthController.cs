using CanchesTechnology2.Data;
using CanchesTechnology2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.NombreUsuario == request.NombreUsuario);
            if (usuario == null)
                return Unauthorized("Usuario o contraseña incorrectos");

            var hash = CalcularHash(request.Contraseña);
            if (usuario.ContraseñaHash != hash)
                return Unauthorized("Usuario o contraseña incorrectos");

            return Ok(new { mensaje = "Login exitoso" });
        }

        private static string CalcularHash(string input)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(bytes);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NombreUsuario) || string.IsNullOrWhiteSpace(request.Contraseña))
                return BadRequest("Usuario y contraseña requeridos");

            var existe = await _context.Usuarios.AnyAsync(u => u.NombreUsuario == request.NombreUsuario);
            if (existe)
                return BadRequest("El usuario ya existe");

            var hash = CalcularHash(request.Contraseña);
            var usuario = new Usuario
            {
                NombreUsuario = request.NombreUsuario,
                ContraseñaHash = hash
            };
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Usuario registrado correctamente" });
        }

        public class RegisterRequest
        {
            public string NombreUsuario { get; set; } = string.Empty;
            public string Contraseña { get; set; } = string.Empty;
        }
    }

    public class LoginRequest
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Contraseña { get; set; } = string.Empty;
    }
}
