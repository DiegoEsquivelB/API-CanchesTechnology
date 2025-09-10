namespace CanchesTechnology2.Models
{
    public class Ubicacion
    {
        public int Id { get; set; }
        public string Codigo { get; set; } = string.Empty; // Bodega 1 
        public string Descripcion { get; set; } = string.Empty; // Direccion

        public List<Producto> Productos { get; set; } = new();
    }
}
