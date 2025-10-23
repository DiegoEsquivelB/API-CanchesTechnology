using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using CanchesTechnology2.Models;

namespace CanchesTechnology2.Services
{
    public class ApiContactosService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "https://crm-contacts-api-production.up.railway.app";
        private readonly string _username = "vendedor1";
        private readonly string _password = "vendedor123";

        public ApiContactosService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        private async Task<string?> ObtenerTokenAsync()
        {
            var loginData = new { username = _username, password = _password };
            var content = new StringContent(JsonSerializer.Serialize(loginData), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseUrl}/api/Auth/login", content);
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("token", out var tokenProp))
                return tokenProp.GetString();
            return null;
        }

        public async Task<List<ProveedorExterno>?> ObtenerProveedoresExternosAsync()
        {
            var token = await ObtenerTokenAsync();
            if (string.IsNullOrEmpty(token)) return null;
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/Contactos");
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<ProveedorExterno>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
    }
}