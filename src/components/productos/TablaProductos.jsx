import React from "react";
import { Table, Button, Image, ProgressBar } from "react-bootstrap";

const TablaProductos = ({ productos, abrirModalEliminacion, abrirModalEdicion }) => {
  return (
    <Table hover responsive className="align-middle">
      <thead className="table-light">
        <tr>
          <th>Imagen</th>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {productos.map((prod) => (
  // 1. El error de la "key" se quita poniendo la 's' final: id_productos
  <tr key={prod.id_productos}> 
    <td>
      <Image
        // 2. En SQL es url_imagen, no imagen_url
        src={prod.url_imagen} 
        // 3. Aquí tenías un error raro: ProgressBar.nombre_producto (ProgressBar no tiene nombre)
        alt={prod.nombre_productos} 
        rounded
        style={{ width: "50px", height: "50px", objectFit: "cover" }}
        onError={(e) => {e.target.src = "https://via.placeholder.com/50"; }}
      />
    </td>
    <td>
      {/* 4. Cambiar a nombre_productos (con s) */}
      <div className="fw-bold">{prod.nombre_productos}</div>
      <small className="text-muted">{prod.descripcion_producto}</small>
    </td>
    <td>{prod.categorias?.nombre_categoria}</td>
    <td>${parseFloat(prod.precio_venta).toFixed(2)}</td>
    <td className="text-end">

      <Button
        variant="outline-warning"
        size="sm"
        className="me-2"
        onClick={() => abrirModalEdicion(prod)}
      >
        <i className="bi bi-pencil"></i>
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => abrirModalEliminacion(prod)}
      >
        <i className="bi bi-trash"></i>
      </Button>
    </td>
  </tr>
))}
      </tbody>
    </Table>
  );
};

export default TablaProductos;