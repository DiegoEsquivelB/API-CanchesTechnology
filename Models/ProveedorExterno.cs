namespace CanchesTechnology2.Models
{
    public class ProveedorExterno
    {
        public int Id { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Dpi { get; set; }
        public string? Nit { get; set; }
        public string? Direccion { get; set; }
        public string? Zona { get; set; }
        public string? Municipio { get; set; }
        public string? Departamento { get; set; }
        public int DiasCredito { get; set; }
        public decimal LimiteCredito { get; set; }
        public string? Categoria { get; set; }
        public string? Subcategoria { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
        public int? UsuarioCreacion { get; set; }
        public int? UsuarioActualizacion { get; set; }
        public bool Activo { get; set; }
    }
}