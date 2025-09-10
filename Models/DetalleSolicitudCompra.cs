using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanchesTechnology2.Models
{
    public class DetalleSolicitudCompra
    {
        [Key]
        public int Id { get; set; }

        // 🔹 Relación con solicitud (nullable, EF lo asigna al guardar)
        public int? SolicitudCompraId { get; set; }

        [ForeignKey("SolicitudCompraId")]
        public SolicitudCompra? SolicitudCompra { get; set; }

        // 🔹 Relación con producto
        [Required]
        public int ProductoId { get; set; }

        [ForeignKey("ProductoId")]
        public Producto? Producto { get; set; }

        // 🔹 Campos propios
        [Required]
        public int Cantidad { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostoUnitario { get; set; }

    }
}
