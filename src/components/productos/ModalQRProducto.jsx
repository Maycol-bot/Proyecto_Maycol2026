import React from "react";
import { Modal, Button } from "react-bootstrap"; // Corregido: llave de cierre del import
import QRCode from "react-qr-code";

const ModalQRProducto = ({ mostrar, onHide, producto }) => {
  if (!producto) return null;

  return (
    <Modal show={mostrar} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5">
          QR: {producto.nombre_producto}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="text-center py-4">
        {producto.url_imagen ? (
          <> {/* Corregido: Agregado fragment de apertura */}
            <QRCode
              value={producto.url_imagen}
              size={230}
              className="mx-auto shadow-sm"
            />
            <p className="text-muted mt-3 small mb-1">
              Escanea para ver la imagen del producto
            </p>
            <p className="text-primary small m-0">
              {producto.nombre_producto}
            </p>
          </>
        ) : (
          <p className="text-danger m-0">No hay imagen disponible</p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalQRProducto;