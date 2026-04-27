import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Spinner, Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TarjetaCategoria = ({
    categoria,
    abrirModalEdicion,
    abrirModalEliminacion,
}) => {
    const [cargando, setCargando] = useState(true);
    const [idTarjetaActiva, setIdTarjetaActiva] = useState(null);

    useEffect(() => {
        setCargando(!(categoria && categoria.length > 0));
    }, [categoria]);

    const manejarTeclaEscape = useCallback((event) => {
        if (event.key === "Escape") setIdTarjetaActiva(null);
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", manejarTeclaEscape);
        return () => window.removeEventListener("keydown", manejarTeclaEscape);
    }, [manejarTeclaEscape]);

    const alternarTarjetaActiva = (id) => {
        setIdTarjetaActiva((prevId) => (prevId === id ? null : id));
    };

    return (
        <>
            {cargando ? (
                <div className="text-center my-5">
                    <h5>Cargando categorías...</h5>
                    <Spinner animation="border" variant="success" />
                </div>
            ) : (
                categoria.map((cat) => {
                    const esActiva = idTarjetaActiva === cat.id_categoria;

                    return (
                        <Card
                            key={cat.id_categoria}
                            className="mb-3 border-0 rounded-0 shadow-sm w-100 tarjeta-categoria-contenedor"
                            onClick={() => alternarTarjetaActiva(cat.id_categoria)}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    alternarTarjetaActiva(cat.id_categoria);
                                }
                            }}
                            aria-label={`Categoría: ${cat.nombre_categoria}`}
                        >
                            <Card.Body
                                className={`p-2 ${
                                    esActiva
                                        ? "tarjeta-categoria-activa"
                                        : "tarjeta-categoria-inactiva"
                                }`}
                            >
                                <Row className="align-items-center gx-3">
                                    <Col xs={2} className="px-2">
                                        <div className="bg-light d-flex align-items-center justify-content-center rounded tarjeta-categoria-placeholder-imagen">
                                            <i className="bi bi-bookmark text-muted fs-3"></i>
                                        </div>
                                    </Col>

                                    <Col xs={5} className="text-start">
                                        <div className="fw-semibold text-truncate">
                                            {cat.nombre_categoria}
                                        </div>
                                        <div className="small text-muted text-truncate">
                                            {cat.descripcion_categoria}
                                        </div>
                                    </Col>

                                    <Col
                                        xs={5}
                                        className="d-flex flex-column align-items-end justify-content-center text-end"
                                    >
                                        <div className="fw-semibold small">
                                            Activa
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>

                            {esActiva && (
                                <div
                                    role="dialog"
                                    aria-modal="true"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIdTarjetaActiva(null);
                                    }}
                                    className="tarjeta-categoria-capa"
                                >
                                    <div
                                        className="d-flex gap-2 tarjeta-categoria-botones-capa"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => {
                                                abrirModalEdicion(cat);
                                                setIdTarjetaActiva(null);
                                            }}
                                            aria-label={`Editar ${cat.nombre_categoria}`}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </Button>

                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => {
                                                abrirModalEliminacion(cat);
                                                setIdTarjetaActiva(null);
                                            }}
                                            aria-label={`Eliminar ${cat.nombre_categoria}`}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })
            )}
        </>
    );
};

export default TarjetaCategoria;