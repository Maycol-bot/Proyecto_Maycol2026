import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Modal, Form, Alert, Pagination } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

import TablaCategorias from "../components/categorias/TablaCategorias";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import ModalEdicionCategoria from "../components/categorias/ModalEdicionCategoria";
import ModalEliminacionCategoria from "../components/categorias/ModalEliminacionCategoria";
import NotificacionesOperacion from "../components/NotificacionesOperacion";
import TarjetaCategoria from "../components/categorias/TarjetaCategoria";

const Categorias = () => {
    // --- ESTADOS ORIGINALES ---
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState({
        nombre_categoria: "",
        descripcion_categoria: "",
    });

    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);

    const [paginaActual, setPaginaActual] = useState(1);
    const [registroPorPagina, setRegistroPorPagina] = useState(5);

    const categoriasPaginadas = categoriasFiltradas.slice(
        (paginaActual - 1) * registroPorPagina,
        paginaActual * registroPorPagina
    );

    const manejarBusqueda = (e) => {
        setTextoBusqueda(e.target.value);
    };

    useEffect(() => {
    const texto = textoBusqueda.toLowerCase().trim();

    if (!texto) {
        setCategoriasFiltradas(categorias);
        return;
    }

    const filtradas = categorias.filter((cat) => 
        cat.nombre_categoria?.toLowerCase().includes(texto) ||
        (cat.descripcion_categoria && 
         cat.descripcion_categoria.toLowerCase().includes(texto))
    );

    setCategoriasFiltradas(filtradas);
}, [textoBusqueda, categorias]);

    const [toast, setToast] = useState({
        mostrar: false,
        mensaje: "",
        tipo: "",
    });

    // --- NUEVOS ESTADOS PARA EDICIÓN ---
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [categoriaEditar, setCategoriaEditar] = useState({
        id_categoria: null,
        nombre_categoria: "",
        descripcion_categoria: "",
    });

    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [categoriaEliminar, setCategoriaEliminar] = useState(null);

    const [deshabilitado, setDeshabilitado] = useState(false);

    // --- FUNCIONES DE CARGA ---
    const cargarCategorias = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from("categorias")
                .select("*")
                .order("id_categoria", { ascending: true });

            if (error) throw error;
            setCategorias(data || []);
        } catch (err) {
            console.error(err);
            setToast({
                mostrar: true,
                mensaje: "Error al cargar las categorías",
                tipo: "error"
            });
        } finally {
            setCargando(false);
        }
    };

    // --- LÓGICA DE REGISTRO ---
    const agregarCategoria = async () => {
        if (!nuevaCategoria.nombre_categoria.trim()) {
            setToast({ mostrar: true, mensaje: "El nombre es obligatorio", tipo: "advertencia" });
            return;
        }

        const { error } = await supabase.from("categorias").insert([nuevaCategoria]);

        if (error) {
            setToast({ mostrar: true, mensaje: "Error al registrar", tipo: "error" });
        } else {
            setToast({ mostrar: true, mensaje: "Categoría registrada", tipo: "exito" });
            setMostrarModal(false);
            setNuevaCategoria({ nombre_categoria: "", descripcion_categoria: "" });
            cargarCategorias();
        }
    };

    // --- LÓGICA DE EDICIÓN (Tu nuevo fragmento) ---
    const abrirModalEdicion = (categoria) => {
        setCategoriaEditar(categoria);
        setMostrarModalEdicion(true);
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;
        setCategoriaEditar(prev => ({ ...prev, [name]: value }));
    };

    const handleActualizar = async () => {
        try {
            setDeshabilitado(true);
            const { error } = await supabase
                .from("categorias")
                .update({
                    nombre_categoria: categoriaEditar.nombre_categoria,
                    descripcion_categoria: categoriaEditar.descripcion_categoria
                })
                .eq("id_categoria", categoriaEditar.id_categoria);

            if (error) throw error;

            setToast({ mostrar: true, mensaje: "Categoría actualizada correctamente", tipo: "exito" });
            setMostrarModalEdicion(false);
            cargarCategorias();
        } catch (err) {
            setToast({ mostrar: true, mensaje: "Error al actualizar", tipo: "error" });
        } finally {
            setDeshabilitado(false);
        }
    };

    const eliminarCategoria = async () => {
        if (!categoriaEliminar) return;

        try {
            setMostrarModalEliminacion(false);

            const { error } = await supabase
                .from("categorias")
                .delete()
                .eq("id_categoria", categoriaEliminar.id_categoria);

            if (error) {
                console.error("Error eliminando categoría:", error.message);
                setToast({
                    mostrar: true,
                    mensaje: `Error al eliminar la categoría ${categoriaEliminar.nombre_categoria}.`,
                    tipo: "error"
                });
                return;
            }

            await cargarCategorias();

            setToast({
                mostrar: true,
                mensaje: `Categoría ${categoriaEliminar.nombre_categoria} eliminada correctamente.`,
                tipo: "exito"
            });

        } catch (err) {
            console.error("Excepción al eliminar categoría:", err.message);
            setToast({
                mostrar: true,
                mensaje: "Error inesperado al eliminar categoría.",
                tipo: "error"
            });
        }
    };

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevaCategoria(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        cargarCategorias();
    }, []);

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col xs={9} md={8} lg={9}>
                    <h3><i className="bi bi-bookmark me-2"></i> Categorías</h3>
                </Col>
                <Col xs={3} md={4} lg={3} className="text-end">
                    <Button variant="success" onClick={() => setMostrarModal(true)}>
                        <i className="bi bi-plus"></i>
                        <span className="d-none d-md-inline ms-2">Nueva Categoría</span>
                    </Button>
                </Col>
            </Row>

            <hr />

            <Row  className="mb-4">
                <Col>
                    <CuadroBusquedas
                        textoBusqueda={textoBusqueda}
                        manejarCambioBusqueda={manejarBusqueda}
                        placeholder="Buscar por nombre o descripción..."
                    />
                </Col>
            </Row>

            {cargando && textoBusqueda.trim() && categoriasFiltradas.length === 0 && (
            <Row  className="mb-4">
                <Col>
                <Alert variant="info" className="text-center">
                    <i className="bi bi-info-circle me-2"></i>
                    No se encontraron categorías que coincidan con "{textoBusqueda}"
                </Alert>
                </Col>
            </Row>    
            )}

            {/* Spinner de carga */}
            {cargando && (
                <Row className="text-center my-5">
                    <Col>
                        <Spinner animation="border" variant="success" />
                        <p className="mt-3 text-muted">Cargando...</p>
                    </Col>
                </Row>
            )}

            {/* Vista en Tarjetas - Solo en móviles */}
            {!cargando && categorias.length > 0 && (
                <div className="d-lg-none">
                    <TarjetaCategoria
                        categoria={categoriasFiltradas}
                        abrirModalEdicion={abrirModalEdicion}
                        abrirModalEliminacion={(categoria) => {
                            setCategoriaEliminar(categoria);
                            setMostrarModalEliminacion(true);
                        }}
                    />
                </div>
            )}

            {/* Vista en Tabla - Solo en desktop y tablets grandes */}
            {!cargando && categorias.length > 0 && (
                <div className="d-none d-lg-block">
                    <TablaCategorias
                        categorias={categoriasFiltradas}
                        abrirModalEdicion={abrirModalEdicion}
                        abrirModalEliminacion={(categoria) => {
                            setCategoriaEliminar(categoria);
                            setMostrarModalEliminacion(true);
                        }}
                    />
                </div>
            )}

            {/* MODAL DE EDICIÓN (Integrado y corregido) */}
            <Modal
                show={mostrarModalEdicion}
                onHide={() => setMostrarModalEdicion(false)}
                backdrop="static"
                keyboard={false}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Editar Categoría</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type="text"
                                name="nombre_categoria"
                                value={categoriaEditar.nombre_categoria}
                                onChange={manejoCambioInputEdicion}
                                placeholder="Ingresa el nombre"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="descripcion_categoria"
                                value={categoriaEditar.descripcion_categoria}
                                onChange={manejoCambioInputEdicion}
                                placeholder="Ingresa la descripción"
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
                        disabled={!categoriaEditar.nombre_categoria.trim() || deshabilitado}
                    >
                        {deshabilitado ? "Guardando..." : "Actualizar"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Otros Modales */}
            <ModalRegistroCategoria
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevaCategoria={nuevaCategoria}
                manejoCambioInput={manejoCambioInput}
                agregarCategoria={agregarCategoria}
            />

            <ModalEliminacionCategoria
                mostrarModalEliminacion={mostrarModalEliminacion}
                setMostrarModalEliminacion={setMostrarModalEliminacion}
                eliminarCategoria={eliminarCategoria}
                categoria={categoriaEliminar}
            />

            <NotificacionesOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />

            {/* === PAGINACIÓN === */}
            {!cargando && categoriasFiltradas.length > 0 && (
                <Paginacion
                    registroPorPagina={registroPorPagina}
                    totalRegistros={categoriasFiltradas.length}
                    paginaActual={paginaActual}
                    establecerPaginaActual={setPaginaActual}
                    establecerRegistroPorPagina={setRegistroPorPagina}
                />
            )}

        </Container>
    );
};

export default Categorias;