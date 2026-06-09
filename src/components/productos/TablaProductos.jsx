import React from "react";
import { Table, Button, Image } from "react-bootstrap";

const TablaProductos = ({
   productos,
   abrirModalEliminacion, 
   abrirModalEdicion, 
   generarQRImagen,
   setIdTarjetaActiva
}) => {
  return (
    <Table hover responsive className="align-middle">
      <thead className="table-light">
        <tr>
          <th>Imagen</th>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th className="text-end">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {productos.map((prod) => (
          <tr key={prod.id_productos}> 
            <td>
              <Image
                src={prod.url_imagen} 
                alt={prod.nombre_productos} 
                rounded
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                onError={(e) => { e.target.src = "https://via.placeholder.com/50"; }}
              />
            </td>
            <td>
              <div className="fw-bold">{prod.nombre_productos}</div>
              <small className="text-muted">{prod.descripcion_producto}</small>
            </td>
            <td>{prod.categorias?.nombre_categoria}</td>
            <td>${parseFloat(prod.precio_venta).toFixed(2)}</td>
            <td className="text-end">
              {/* Botón de Edición */}
              <Button
                variant="outline-warning"
                size="sm"
                className="me-2"
                onClick={() => abrirModalEdicion(prod)}
              >
                <i className="bi bi-pencil"></i>
              </Button>

              {/* Botón de Eliminación */}
              <Button
                variant="outline-danger"
                size="sm"
                className="me-2"
                onClick={() => abrirModalEliminacion(prod)}
              >
                <i className="bi bi-trash"></i>
              </Button>

              {/* Botón de Código QR - Corregido y seguro */}
              <Button
                variant="outline-primary"
                size="sm"
                className="m-1"
                onClick={(e) => {
                  e.stopPropagation();
                  generarQRImagen(prod); // Usando 'prod' de forma correcta
                  if (typeof setIdTarjetaActiva === 'function') {
                    setIdTarjetaActiva(null);
                  }
                }}
                title="Generar código QR de la imagen"
              >
                <i className="bi bi-qr-code"></i>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TablaProductos;