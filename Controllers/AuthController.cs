using CanchesTechnology2.Data;
using CanchesTechnology2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace CanchesTechnology2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AppDbContext context, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.NombreUsuario == request.NombreUsuario);
                if (usuario == null)
                    return Unauthorized("Usuario o contraseña incorrectos");

                var hash = CalcularHash(request.Contraseña);
                if (usuario.ContraseñaHash != hash)
                    return Unauthorized("Usuario o contraseña incorrectos");

                // Generar token JWT
                var token = GenerarToken(usuario.NombreUsuario);

                return Ok(new { token });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en Login");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private string GenerarToken(string usuario)
        {
            var key = _configuration["Jwt:Key"];
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];
            var expireMinutes = int.Parse(_configuration["Jwt:ExpireMinutes"] ?? "120");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[] {
                new Claim(ClaimTypes.Name, usuario)
            };

            var token = new JwtSecurityToken(issuer, audience, claims,
              expires: DateTime.UtcNow.AddMinutes(expireMinutes),
              signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
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
