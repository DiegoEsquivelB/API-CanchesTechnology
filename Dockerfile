# Multi-stage Dockerfile for .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as a separate layer
COPY ["CanchesTechnology2.csproj", "./"]
RUN dotnet restore "CanchesTechnology2.csproj"

# Copy everything else and publish
COPY . .
RUN dotnet publish "CanchesTechnology2.csproj" -c Release -o /app/publish --no-restore

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Expose default HTTP port (Railway will map the assigned PORT env variable)
EXPOSE 80

# Copy published output
COPY --from=build /app/publish .

# Entrypoint: set ASPNETCORE_URLS from PORT env var provided by Railway (fallback to 80)
ENTRYPOINT ["sh", "-c", "export ASPNETCORE_URLS=\"http://0.0.0.0:${PORT:-80}\" && exec dotnet CanchesTechnology2.dll"]
