import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Modal, Form, Alert, Pagination } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

import TablaCategorias from "../components/categorias/TablaCategorias.jsx";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas.jsx";
import Paginacion from "../components/ordenamiento/Paginacion.jsx";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria.jsx";
import ModalEdicionCategoria from "../components/categorias/ModalEdicionCategoria.jsx";
import ModalEliminacionCategoria from "../components/categorias/ModalEliminacionCategoria";
import ModalEnvioCorreoCategorias from "../components/categorias/ModalEnviarCorreoCategorias.jsx";
import NotificacionesOperacion from "../components/NotificacionesOperacion.jsx";
import TarjetaCategoria from "../components/categorias/TarjetaCategoria.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import emailjs from '@emailjs/browser';


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

    
const [mostrarModalCorreo, setMostrarModalCorreo] = useState(false);
const [emailDestino, setEmailDestino] = useState("");
const [enviandoCorreo, setEnviandoCorreo] = useState(false);


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

    const generarPDFCategoria = (categoria) => {

  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text("Reporte de Categoría", 14, 20);

  // Línea decorativa
  doc.line(14, 25, 195, 25);

  // Información de la categoría
  doc.setFontSize(12);

  autoTable(doc, {
    startY: 35,
    head: [["Campo", "Valor"]],
    body: [
      ["ID", categoria.id_categoria],
      ["Nombre", categoria.nombre_categoria],
      ["Descripción", categoria.descripcion_categoria],
    ],
  });

  // Descargar PDF
  doc.save(`categoria_${categoria.id_categoria}.pdf`);
};

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevaCategoria(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        cargarCategorias();
    }, []);

      // Inicializar EmailJS
  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  const abrirModalCorreo = () => {
    setEmailDestino("");
    setMostrarModalCorreo(true);
  };

  const formatearCategoriasParaCorreo = () => {
    if (categorias.length === 0) return "No hay categorías registradas.";

    let texto = `LISTADO DE CATEGORÍAS\n\n`;
    texto += `Fecha: ${new Date().toLocaleDateString("es-NI")}\n`;
    texto += `Total de categorías: ${categorias.length}\n\n`;

    categorias.forEach((cat, index) => {
      texto += `${index + 1}. ${cat.nombre_categoria}\n`;
      if (cat.descripcion_categoria) {
        texto += `   Descripción: ${cat.descripcion_categoria}\n`;
      }
      texto += `\n`;
    });

    return texto;
  };

  const enviarCorreoCategorias = () => {
    if (!emailDestino.trim()) {
      setToast({
        mostrar: true,
        mensaje: "Por favor ingresa un correo destino.",
        tipo: "advertencia",
      });
      return;
    }

    setEnviandoCorreo(true);

    const mensaje = formatearCategoriasParaCorreo();

    const templateParams = {
      to_name: "Administrador",
      user_email: emailDestino,
      message: mensaje,
      fecha_envio: new Date().toLocaleDateString("es-NI")
    };

     emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams
    )
      .then(() => {
        setToast({
          mostrar: true,
          mensaje: "Correo enviado correctamente.",
          tipo: "exito",
        });
        setMostrarModalCorreo(false);
        setEmailDestino("");
      })
      .catch((error) => {
        console.error("Error EmailJS:", error);
        setToast({
          mostrar: true,
          mensaje: "Error al enviar el correo.",
          tipo: "error",
        });
      })
      .finally(() => {
        setEnviandoCorreo(false);
      });
  };


const copiarCategoria = async (categoria) => {
  // CORREGIDO: Bloquea solo si NO hay categoría
  if (!categoria) return; 

  const texto = `ID: ${categoria.id_categoria}
Categoría: ${categoria.nombre_categoria}
Descripción: ${categoria.descripcion_categoria || 'Sin descripción'}`;

  try {
    await navigator.clipboard.writeText(texto);

    setToast({
      mostrar: true,
      mensaje: `Categoría "${categoria.nombre_categoria}" copiada al portapapeles`,
      tipo: "exito",
    });

  } catch (err) {
    console.error("Error al copiar:", err);
    setToast({
      mostrar: true,
      mensaje: "No se pudo copiar al portapapeles",
      tipo: "error",
    });
  }
};



    return (
        <Container className="mt-4">
           <Row className="align-items-center mb-3">
                <Col xs={8} sm={8} md={8} lg={8} className="d-flex align-items-center">
                    <h3 className="mb-0">
                        <i className="bi-bookmark-plus-fill me-2"></i> Categorías
                    </h3>
                </Col>
                <Col xs={2} sm={2} md={2} lg={2} className="text-end">
                    <Button variant="primary" onClick={abrirModalCorreo} size="md">
                        <i className="bi bi-envelope"></i>
                        <span className="d-none d-lg-inline ms-2">Enviar por Correo</span>
                    </Button>
                </Col>
                <Col xs={2} sm={2} md={2} lg={2} className="text-end">
                    <Button
                        onClick={() => setMostrarModal(true)}
                        size="md"
                    >
                        <i className="bi-plus-lg"></i>
                        <span className="d-none d-lg-inline ms-2">Nueva Categoría</span>
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
                        copiarCategoria={copiarCategoria}
                        generarPDFCategoria={generarPDFCategoria}
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
                        generarPDFCategoria={generarPDFCategoria}
                        copiarCategoria={copiarCategoria}
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

            <ModalEnvioCorreoCategorias
  mostrarModalCorreo={mostrarModalCorreo}
  setMostrarModalCorreo={setMostrarModalCorreo}
  emailDestino={emailDestino}
  setEmailDestino={setEmailDestino}
  enviandoCorreo={enviandoCorreo}
  enviarCorreoCategorias={enviarCorreoCategorias}
  totalCategorias={categorias.length}
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