import { useEffect, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const NotificacionesOperacion = ({ mostrar, mensaje, tipo, onCerrar }) => {
    const [visible, setVisible] = useState(mostrar);

    useEffect(() => {
        setVisible(mostrar);
    }, [mostrar]);

    // Normalizar el tipo para que sea más flexible
    const getTipoInfo = () => {
        const t = (tipo || "").toLowerCase();
        if (t === "exito" || t === "éxito" || t === "success") {
            return { bg: "success", icon: "✅", titulo: "Éxito" };
        }
        if (t === "advertencia" || t === "warning") {
            return { bg: "warning", icon: "⚠️", titulo: "Advertencia" };
        }
        return { bg: "danger", icon: "❌", titulo: "Error" };
    };

    const { bg, icon, titulo } = getTipoInfo();

    return (
        <ToastContainer position="top-end" className="p-3">
            <Toast
                onClose={() => {
                    setVisible(false);
                    onCerrar();
                }}
                show={visible}
                delay={3000}
                autohide
                bg={bg}
            >
                <Toast.Header>
                    <strong className="me-auto">{icon} {titulo}</strong>
                    <small>Hoy</small>
                </Toast.Header>
                <Toast.Body className={bg === "success" || bg === "danger" ? "text-white" : ""}>
                    {mensaje}
                </Toast.Body>
            </Toast>
        </ToastContainer>
    );
};

export default NotificacionesOperacion;