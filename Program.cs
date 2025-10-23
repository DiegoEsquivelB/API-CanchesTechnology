using CanchesTechnology2.Data;
using CanchesTechnology2.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Mvc.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Si Railway asigna un PORT, obligamos al host a escuchar en él
var railPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(railPort))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{railPort}");
}

// Registrar DbContext con MySQL (fallback a variable de entorno si no está en appsettings)
var connFromConfig = builder.Configuration.GetConnectionString("DefaultConnection");
var connFromEnv = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
var connectionString = !string.IsNullOrEmpty(connFromEnv) ? connFromEnv : connFromConfig;

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("No se encontró ConnectionStrings:DefaultConnection. Define la cadena de conexión en appsettings.json o en la variable de entorno ConnectionStrings__DefaultConnection.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);

// Require authentication by default for all controllers; controllers/actions can opt-out with [AllowAnonymous]
var defaultAuthPolicy = new AuthorizationPolicyBuilder()
    .RequireAuthenticatedUser()
    .Build();

builder.Services.AddControllers(options =>
{
    options.Filters.Add(new AuthorizeFilter(defaultAuthPolicy));
})
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://frontendcanchestechnology-proyectoanalisis.up.railway.app") // dominio de tu frontend
              .AllowAnyHeader()  // permite todos los headers
              .AllowAnyMethod()  // permite GET, POST, PUT, DELETE, etc.
              .AllowCredentials(); // si vas a enviar cookies o autenticación
    });
});

// Registrar ApiContactosService como singleton para HttpClient
builder.Services.AddHttpClient<ApiContactosService>();

// Configurar autenticación JWT
var jwtSection = builder.Configuration.GetSection("Jwt");
var key = jwtSection["Key"] ?? Environment.GetEnvironmentVariable("Jwt__Key");
var issuer = jwtSection["Issuer"] ?? Environment.GetEnvironmentVariable("Jwt__Issuer");
var audience = jwtSection["Audience"] ?? Environment.GetEnvironmentVariable("Jwt__Audience");

if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(audience))
{
    throw new InvalidOperationException("Faltan settings de Jwt. Define Jwt:Key, Jwt:Issuer y Jwt:Audience en appsettings.json o como variables de entorno Jwt__Key, Jwt__Issuer, Jwt__Audience.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = signingKey,
        ClockSkew = TimeSpan.Zero
    };
});

// Register authorization services (policies can be added later)
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Usa 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// Habilitar archivos estáticos (si decides seguir sirviendo frontend desde el mismo proyecto)
app.UseDefaultFiles();
app.UseStaticFiles();

// Habilitar Swagger siempre
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

// Rutas públicas de salud/raíz para evitar 401 en la URL base
// Cambiado: redirigir la raíz al Swagger UI para que al entrar en la URL de Railway se muestre Swagger.
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/health", () => Results.Ok(new { status = "OK" }));

app.MapControllers();
app.Run();
