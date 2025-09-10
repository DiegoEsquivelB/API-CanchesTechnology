using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CanchesTechnology2.Migrations
{
    /// <inheritdoc />
    public partial class RemoveHumedadFromSensorData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Solicitante",
                table: "SolicitudesCompra");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Solicitante",
                table: "SolicitudesCompra",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}
