import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup, Spinner } from "react-bootstrap";

const ModalRegistroProducto = ({ 
  mostrarModal, 
  setMostrarModal, 
  nuevoProducto,
  manejoCambioInput,
  manejoCambioArchivo,
  agregarProducto,
  categorias, 
  setMostrarModalCategoria
}) => {

  const [deshabilitado, setDeshabilitado] = useState(false);

  const handleAgregar = async () => {
    if (deshabilitado) return; // Evitar múltiples clics concurrently
    
    // Validación rápida en frontend antes de enviar a la base de datos
    if (!nuevoProducto.nombre_productos?.trim() || !nuevoProducto.id_productos || !nuevoProducto.precio_venta) {
      return;
    }

    try {
      setDeshabilitado(true); // Deshabilitar controles e iniciar estado visual de carga
      await agregarProducto();
    } catch (error) {
      console.error("Error al registrar el producto:", error);
    } finally {
      setDeshabilitado(false); // Rehabilitar el botón después de finalizar la petición
    }
  };

  return (
    <Modal
      show={mostrarModal}
      onHide={() => !deshabilitado && setMostrarModal(false)} // Impide cerrar si está procesando la subida
      backdrop="static"
      keyboard={!deshabilitado}
      centered
      size="lg"
    >
      <Modal.Header closeButton={!deshabilitado}>
        <Modal.Title>Registrar Nuevo Producto</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row>
            {/* SELECCIÓN DE CATEGORÍA */}
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría *</Form.Label>
                <InputGroup>
                  <Form.Select
                    name="id_productos"
                    value={nuevoProducto.id_productos || ""}
                    onChange={manejoCambioInput}
                    disabled={deshabilitado}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre_categoria}
                      </option>
                    ))}
                  </Form.Select>

                  <Button
                    variant="outline-primary"
                    onClick={() => setMostrarModalCategoria(true)}
                    disabled={deshabilitado}
                    title="Añadir nueva categoría rápidamente"
                  >
                    <i className="bi bi-plus-lg"></i>
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* NOMBRE DEL PRODUCTO */}
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre_productos"
                  value={nuevoProducto.nombre_productos || ""}
                  onChange={manejoCambioInput}
                  placeholder="Nombre del producto"
                  disabled={deshabilitado}
                  required
                />
              </Form.Group>
            </Col>

            {/* PRECIO DE VENTA */}
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio de venta *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio_venta"
                  value={nuevoProducto.precio_venta || ""}
                  onChange={manejoCambioInput}
                  placeholder="0.00"
                  disabled={deshabilitado}
                  required
                />
              </Form.Group>
            </Col>

            {/* CARGA DE IMAGEN */}
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Imagen del producto *</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={manejoCambioArchivo}
                  disabled={deshabilitado}
                  required
                />
              </Form.Group>
            </Col>

            {/* DESCRIPCIÓN */}
            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="descripcion_producto"
                  value={nuevoProducto.descripcion_producto || ""}
                  onChange={manejoCambioInput}
                  placeholder="Descripción del producto (opcional)"
                  disabled={deshabilitado}
                />
              </Form.Group>
            </Col>
            
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={() => setMostrarModal(false)}
          disabled={deshabilitado}
        >
          Cancelar
        </Button>

        <Button 
          variant="primary" 
          onClick={handleAgregar} 
          disabled={deshabilitado || !nuevoProducto.nombre_productos?.trim() || !nuevoProducto.id_productos || !nuevoProducto.precio_venta}
        >
          {deshabilitado ? (
            <>
              <Spinner size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            "Agregar Producto"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalRegistroProducto;