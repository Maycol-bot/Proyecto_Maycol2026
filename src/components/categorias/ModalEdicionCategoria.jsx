import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const ModalEdicionCategoria = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    categoriaEditar,
    manejoCambioInputEdicion,
    actualizarCategoria
}) => {

    // 1. Estado
    const [deshabilitado, setDeshabilitado] = useState(false);

    // 2. Función
    const handleActualizar = async () => {
        if (deshabilitado) return;

        setDeshabilitado(true);
        await actualizarCategoria();
        setDeshabilitado(false);
    };

    // 3. Render
    return (
        <Modal show={mostrarModalEdicion} onHide={() => setMostrarModalEdicion(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Editar Categoría</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre"
                            value={categoriaEditar.nombre}
                            onChange={manejoCambioInputEdicion}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModalEdicion(false)}>
                    Cancelar
                </Button>

                <Button 
                    variant="primary" 
                    onClick={handleActualizar}
                    disabled={deshabilitado}
                >
                    Guardar cambios
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionCategoria;