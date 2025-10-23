using CanchesTechnology2.Models;
using Microsoft.EntityFrameworkCore;

namespace CanchesTechnology2.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // 🔹 Tablas existentes
        public DbSet<Producto> Productos { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<DetallePedido> DetallesPedidos { get; set; }
        public DbSet<Proveedor> Proveedores { get; set; }
        public DbSet<Ubicacion> Ubicaciones { get; set; }
        public DbSet<OrdenCompra> OrdenesCompra { get; set; }
        public DbSet<DetalleOrdenCompra> DetallesOrdenCompra { get; set; }

        // 🔹 Nuevas tablas
        public DbSet<SolicitudCompra> SolicitudesCompra { get; set; }
        public DbSet<DetalleSolicitudCompra> DetallesSolicitudesCompra { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Restricción única en código de ubicación
            modelBuilder.Entity<Ubicacion>()
                .HasIndex(u => u.Codigo)
                .IsUnique();

            // Restricción única en Nit de proveedor
            modelBuilder.Entity<Proveedor>()
                .HasIndex(p => p.Nit)
                .IsUnique();

            // 🔹 Pedido -> Detalles (cascada)
            modelBuilder.Entity<DetallePedido>()
                .HasOne(d => d.Pedido)
                .WithMany(p => p.Detalles)
                .HasForeignKey(d => d.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DetallePedido>()
                .HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId);

            // 🔹 OrdenCompra -> Detalles (cascada)
            modelBuilder.Entity<DetalleOrdenCompra>()
                .HasOne(d => d.OrdenCompra)
                .WithMany(o => o.Detalles)
                .HasForeignKey(d => d.OrdenCompraId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DetalleOrdenCompra>()
                .HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId);

            // 🔹 SolicitudCompra -> Detalles (cascada)
            modelBuilder.Entity<DetalleSolicitudCompra>()
                .HasOne(d => d.SolicitudCompra)
                .WithMany(s => s.Detalles)
                .HasForeignKey(d => d.SolicitudCompraId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DetalleSolicitudCompra>()
                .HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId);
        }
    }
}
