using System.ComponentModel.DataAnnotations;

namespace CanchesTechnology2.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required]
        public string ContraseñaHash { get; set; } = string.Empty;
    }
}
