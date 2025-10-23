using CanchesTechnology2.Data;
using CanchesTechnology2.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Registrar DbContext con MySQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    )
);

builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        // Aceptar nombres de propiedad insensible a mayúsculas para que tanto "CodigoProducto" como "codigoProducto" funcionen
        opt.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Registrar ApiContactosService como singleton para HttpClient
builder.Services.AddHttpClient<ApiContactosService>();

// Configurar autenticación JWT
var jwtSection = builder.Configuration.GetSection("Jwt");
var key = jwtSection["Key"];
var issuer = jwtSection["Issuer"];
var audience = jwtSection["Audience"];

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

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CanchesTechnology2 API", Version = "v1" });

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

app.UseCors("AllowAll");

// Configuración: permitir que un dominio específico muestre Swagger en producción.
// Establece la variable de entorno SwaggerHost (ej: swagger.example.com) en Railway para el dominio que quieres que muestre Swagger.
var swaggerHost = builder.Configuration["SwaggerHost"]; // lee env var SwaggerHost

if (app.Environment.IsDevelopment())
{
    // En desarrollo, usar el comportamiento por defecto (/swagger)
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Si se configuró SwaggerHost, montar Swagger UI solo cuando el host de la petición coincida.
if (!string.IsNullOrEmpty(swaggerHost))
{
    app.UseWhen(context => context.Request.Host.Host.Equals(swaggerHost, StringComparison.OrdinalIgnoreCase), appBuilder =>
    {
        // Servir UI de Swagger en la raíz (/) para ese host
        appBuilder.UseSwagger();
        appBuilder.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "CanchesTechnology2 API V1");
            c.RoutePrefix = string.Empty; // sirve Swagger UI en el root del host
        });
    });
}

// Controlar si se sirve el frontend estático mediante variable de entorno ServeFrontend (por defecto: false)
var serveFrontend = builder.Configuration["ServeFrontend"];
if (string.Equals(serveFrontend, "true", StringComparison.OrdinalIgnoreCase))
{
    // Habilitar archivos estáticos solo cuando se quiera servir el frontend
    app.UseDefaultFiles(); // Busca index.html por defecto
    app.UseStaticFiles();  // Sirve archivos de wwwroot
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
