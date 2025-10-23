namespace CanchesTechnology2.Models
{
    public class Producto
    {
        public int Id { get; set; }
        public string CodigoProducto { get; set; } = string.Empty; // Código de producto
        public string Nombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal Precio { get; set; }
        public decimal Costo { get; set; }    // Costo de compra

        // ✅ Campo calculado (no se guarda en BD)
        public decimal GananciaUnidad => Precio - Costo;
        public decimal GananciaTotal => Cantidad * (Precio - Costo);

        public int? ProveedorId { get; set; }
        public Proveedor? Proveedor { get; set; }

        public int? UbicacionId { get; set; }
        public Ubicacion? Ubicacion { get; set; }

        public int StockMinimo { get; set; } = 5; // Para reabastecimiento automático

    }
}