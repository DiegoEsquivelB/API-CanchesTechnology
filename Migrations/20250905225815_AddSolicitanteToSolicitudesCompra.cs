using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CanchesTechnology2.Migrations
{
    /// <inheritdoc />
    public partial class AddSolicitanteToSolicitudesCompra : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesCompra_Proveedores_ProveedorId",
                table: "SolicitudesCompra");

            migrationBuilder.AlterColumn<int>(
                name: "ProveedorId",
                table: "SolicitudesCompra",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Solicitante",
                table: "SolicitudesCompra",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "SolicitudCompraId",
                table: "DetallesSolicitudesCompra",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<decimal>(
                name: "CostoUnitario",
                table: "DetallesSolicitudesCompra",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesCompra_Proveedores_ProveedorId",
                table: "SolicitudesCompra",
                column: "ProveedorId",
                principalTable: "Proveedores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SolicitudesCompra_Proveedores_ProveedorId",
                table: "SolicitudesCompra");

            migrationBuilder.DropColumn(
                name: "Solicitante",
                table: "SolicitudesCompra");

            migrationBuilder.AlterColumn<int>(
                name: "ProveedorId",
                table: "SolicitudesCompra",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "SolicitudCompraId",
                table: "DetallesSolicitudesCompra",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CostoUnitario",
                table: "DetallesSolicitudesCompra",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddForeignKey(
                name: "FK_SolicitudesCompra_Proveedores_ProveedorId",
                table: "SolicitudesCompra",
                column: "ProveedorId",
                principalTable: "Proveedores",
                principalColumn: "Id");
        }
    }
}
