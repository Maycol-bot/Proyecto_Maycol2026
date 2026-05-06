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

  // 🔥 Evita múltiples clics
  const [cargando, setCargando] = useState(false);

  const handleActualizar = async () => {
    if (cargando) return;

    setCargando(true);
    await actualizarProducto();
    setCargando(false);
  };

  return (
    <Modal
      show={mostrarModal}
      onHide={() => setMostrarModal(false)}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Editar Producto</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>

          {/* NOMBRE */}
          <Form.Group className="mb-3">
            <Form.Label>Nombre del producto *</Form.Label>
            <Form.Control
              type="text"
              name="nombre_producto"
              value={productoAEditar.nombre_producto}
              onChange={manejoCambioInput}
              placeholder="Ej: Shampoo"
            />
          </Form.Group>

          {/* DESCRIPCIÓN */}
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion_producto"
              value={productoAEditar.descripcion_producto}
              onChange={manejoCambioInput}
            />
          </Form.Group>

          <Row>
            {/* CATEGORÍA */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría *</Form.Label>
                <Form.Select
                  name="categoria_producto"
                  value={productoAEditar.categoria_producto}
                  onChange={manejoCambioInput}
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

            {/* PRECIO */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio *</Form.Label>
                <Form.Control
                  type="number"
                  name="precio_venta"
                  value={productoAEditar.precio_venta}
                  onChange={manejoCambioInput}
                  placeholder="Ej: 150"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* IMAGEN */}
          <Form.Group className="mb-3">
            <Form.Label>Actualizar imagen</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={manejoCambioArchivo}
            />
          </Form.Group>

          {/* PREVISUALIZACIÓN */}
          {productoAEditar.url_imagen && (
            <div className="text-center mb-3">
              <img
                src={productoAEditar.url_imagen}
                alt="Producto"
                style={{
                  maxHeight: "200px",
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
          disabled={cargando}
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