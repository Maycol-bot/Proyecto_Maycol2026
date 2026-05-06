import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";

const ModalRegistroProducto = ({ 
  mostrarModal, 
  setMostrarModal, 
  nuevoProducto,
  manejoCambioinput,
  manejoCambioArcvhivo,
  agregarProducto,
  categorias, 
  setMostrarModalCategoria
}) => {

  const [ deshabilitado, setDeshabilitado ] = useState(false);

  const handleAgregar = async () => {
    if (deshabilitado) return; // Evitar múltiples clics
    setDeshabilitado(true); // Deshabilitar el botón
    await agregarProducto();
    setDeshabilitado(false); // Rehabilitar el botón después de agregar
  }

  return (

    <Modal
      show={mostrarModal}
      onHide={() => setMostrarModal(false)}
      backdrop="static"
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Registrar Nuevo Producto</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoria *</Form.Label>
                <InputGroup>
                  <Form.Select
                    name="categoria_producto"
                    value={nuevoProducto.categoria_producto || ""}
                    onChange={manejoCambioinput}
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
                  >
                    <i className="bi bi-plus-lg"></i>
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre_producto"
                  value={nuevoProducto.nombre_producto || ""}
                  onChange={manejoCambioinput}
                  placeholder="Nombre del producto"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>Precio de venta *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="precio_venta"
                  value={nuevoProducto.precio_venta || ""}
                  onChange={manejoCambioinput}
                  placeholder="Precio de venta"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>Imagen del producto *</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={manejoCambioArcvhivo}
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="descripcion_producto"
                  value={nuevoProducto.descripcion_producto || ""}
                  onChange={manejoCambioinput}
                  placeholder="Descripción del producto (opcional)"
                />
              </Form.Group>
            </Col>
            
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>

        <Button variant="secondary" onClick={() => setMostrarModal(false)}>
          Cancelar
        </Button>

        <Button variant="primary" onClick={handleAgregar} disabled={deshabilitado}>
          Agregar Producto
        </Button>

      </Modal.Footer>
    </Modal>
  );
};

export default ModalRegistroProducto;