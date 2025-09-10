using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CanchesTechnology2.Models
{
    public class SolicitudCompra
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime Fecha { get; set; } = DateTime.Now;

        [Required]
        [StringLength(50)]
        public string Estado { get; set; } = "Pendiente";
        // Valores: Pendiente, Aprobada, Rechazada, Cancelada

        // 🔹 Relación con proveedor (OBLIGATORIO ahora)
        [Required]
        public int ProveedorId { get; set; }

        [ForeignKey("ProveedorId")]
        public Proveedor? Proveedor { get; set; }

        // 🔹 Relación con detalles
        public List<DetalleSolicitudCompra> Detalles { get; set; } = new();
    }
}
