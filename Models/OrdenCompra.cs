namespace CanchesTechnology2.Models
{
    public class OrdenCompra
    {
        public int Id { get; set; }

        public DateTime Fecha { get; set; } = DateTime.Now;

        // 🔹 Relación con proveedor (obligatorio)
        public int ProveedorId { get; set; }
        public Proveedor Proveedor { get; set; } = null!;

        // 🔹 Relación con detalles
        public List<DetalleOrdenCompra> Detalles { get; set; } = new();

        // 🔹 Estado de la orden
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Aprobada, Recibida
    }

    public class DetalleOrdenCompra
    {
        public int Id { get; set; }

        // 🔹 Relación con OrdenCompra
        public int OrdenCompraId { get; set; }
        public OrdenCompra OrdenCompra { get; set; } = null!;

        // 🔹 Relación con Producto
        public int ProductoId { get; set; }
        public Producto Producto { get; set; } = null!;

        // 🔹 Campos propios
        public int Cantidad { get; set; }
        public decimal CostoUnitario { get; set; }
    }
}
