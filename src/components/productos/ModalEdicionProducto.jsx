import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";

const ModalEdicionProducto = ({
  mostrarModal,
  setMostrarModal,
  productoAEditar,
  manejoCambioInput,
  manejoCambioArchivo,
  actualizarProducto,
  categorias,
}) => {
  // Estado local para prevenir mutaciones simultáneas por múltiples clics rápidos
  const [cargando, setCargando] = useState(false);

  const handleActualizar = async () => {
    if (cargando) return;

    // Validación mínima en el frontend antes de disparar la petición a Supabase
    if (!productoAEditar.nombre_productos?.trim() || !productoAEditar.categoria_producto || !productoAEditar.precio_venta) {
      return;
    }

    try {
      setCargando(true);
      await actualizarProducto();
    } catch (error) {
      console.error("Error en la llamada de actualización:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      show={mostrarModal}
      onHide={() => !cargando && setMostrarModal(false)} // Previene cerrar el modal accidentalmente a mitad de una subida
      backdrop={cargando ? "static" : true}
      keyboard={!cargando}
      centered
      size="lg"
    >
      <Modal.Header closeButton={!cargando}>
        <Modal.Title>Editar Producto</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* NOMBRE DEL PRODUCTO */}
          <Form.Group className="mb-3">
            <Form.Label>Nombre del producto *</Form.Label>
            <Form.Control
              type="text"
              name="nombre_productos" // Ajustado al esquema de tu tabla
              value={productoAEditar.nombre_productos || ""}
              onChange={manejoCambioInput}
              placeholder="Ej: Amortiguador Delantero"
              disabled={cargando}
            />
          </Form.Group>

          {/* DESCRIPCIÓN */}
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion_producto"
              value={productoAEditar.descripcion_producto || ""}
              onChange={manejoCambioInput}
              disabled={cargando}
            />
          </Form.Group>

          <Row>
            {/* SELECCIÓN DE CATEGORÍA */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría *</Form.Label>
                <Form.Select
                  name="categoria_producto"
                  value={productoAEditar.categoria_producto || ""}
                  onChange={manejoCambioInput}
                  disabled={cargando}
                >
                  <option value="">Seleccione</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* PRECIO DE VENTA */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio *</Form.Label>
                <Form.Control
                  type="number"
                  name="precio_venta"
                  value={productoAEditar.precio_venta || ""}
                  onChange={manejoCambioInput}
                  placeholder="Ej: 150"
                  disabled={cargando}
                  min="0"
                  step="0.01"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* CARGA DE ARCHIVO (REEMPLAZO DE IMAGEN) */}
          <Form.Group className="mb-3">
            <Form.Label>Actualizar imagen</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={manejoCambioArchivo}
              disabled={cargando}
            />
          </Form.Group>

          {/* PREVISUALIZACIÓN DE IMAGEN ACTUAL / NUEVA */}
          {productoAEditar.url_imagen && (
            <div className="text-center mb-3">
              <span className="d-block text-muted small mb-2">Imagen actual / seleccionada:</span>
              <img
                src={productoAEditar.url_imagen}
                alt="Producto"
                className="img-thumbnail"
                style={{
                  maxHeight: "180px",
                  objectFit: "contain",
                }}
              />
            </div>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setMostrarModal(false)}
          disabled={cargando}
        >
          Cancelar
        </Button>

        <Button
          variant="primary"
          onClick={handleActualizar}
          disabled={
            cargando || 
            !productoAEditar.nombre_productos?.trim() || 
            !productoAEditar.categoria_producto || 
            !productoAEditar.precio_venta
          }
        >
          {cargando ? (
            <>
              <Spinner size="sm" className="me-2" />
              Actualizando...
            </>
          ) : (
            "Actualizar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEdicionProducto;