import React from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";

const FormularioLogin = ({ usuario,
    contrasena,
    error,
    setUsuario,
    setContrasena,
     iniciarSesion }) => {
    return (
        <Card>
            <Card.Body>
                <Card.Title>Iniciar Sesión</Card.Title>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={iniciarSesion}>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Correo Electrónico</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter email"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Contraseña</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Iniciar Sesión
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};
export default FormularioLogin;