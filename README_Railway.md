Deploy backend-only to Railway

Instrucciones para desplegar este backend en Railway usando Docker (opción recomendada).

Variables de entorno requeridas (Settings → Environment):
- ConnectionStrings__DefaultConnection = <cadena MySQL>
- Jwt__Key = <clave secreta>
- Jwt__Issuer = <issuer>
- Jwt__Audience = <audience>
- ENABLE_SWAGGER = true (opcional)
- ASPNETCORE_ENVIRONMENT = Production (opcional)

Pasos rápidos:
1. Subir el repo a GitHub (rama master o una rama nueva).
2. En Railway: New Project → Deploy from GitHub → conecta el repo y selecciona la rama.
   Railway detectará Dockerfile y construirá la imagen.
3. Añade el plugin de base de datos (MySQL) en Railway y copia la connection string al env var ConnectionStrings__DefaultConnection.
4. Despliega y revisa logs.

Comandos locales para probar la imagen Docker:
- dotnet publish -c Release -o out
- docker build -t canches-backend .
- docker run -e ConnectionStrings__DefaultConnection="<cadena>" -e Jwt__Key="<key>" -e Jwt__Issuer="<issuer>" -e Jwt__Audience="<audience>" -p 5275:80 canches-backend

Accede a la API en http://localhost:5275
Swagger: http://localhost:5275/swagger (si ENABLE_SWAGGER=true)
