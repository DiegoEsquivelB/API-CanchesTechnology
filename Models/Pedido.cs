namespace CanchesTechnology2.Models
{
    public class Pedido
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string Cliente { get; set; } = string.Empty;

        public List<DetallePedido> Detalles { get; set; } = new();
    }
}
