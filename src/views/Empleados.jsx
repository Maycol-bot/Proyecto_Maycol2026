import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner, Pagination } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

import ModalRegistroEmpleado from "../components/empleados/ModalRegistroEmpleado.jsx";
import ModalEdicionEmpleado from "../components/empleados/ModalEldicionEmpleado.jsx";
import TablaEmpleados from "../components/empleados/TablaEmpleados.jsx";
import TarjetaEmpleado from "../components/empleados/TarjetaEmpleado.jsx";
import NotificacionOperacion from "../components/NotificacionesOperacion.jsx";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas.jsx";

const Empleados = () => {
  // --- 1. ESTADOS DE DATOS PRINCIPALES ---
  const [empleados, setEmpleados] = useState([]);                 // Listado maestro original desde Supabase
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]); // Listado alterado por la barra de búsqueda

  // --- 2. ESTADOS DE CONTROL DE INTERFAZ (UI) & PAGINACIÓN ---
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  // CONTROL DE PAGINACIÓN LOCAL
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5; // Homologado con el resto de tus módulos administrativos

  // --- 3. ESTADOS DE CONTROL DE MODALES ---
  const [mostrarModal, setMostrarModal] = useState(false);               // Modal Añadir Empleado
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false); // Modal Editar Empleado

  // --- 4. ESTADOS PARA REGISTRO Y EDICIÓN TEMPORAL ---
  
  // Estructura temporal para registrar un nuevo empleado
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre_empleado: "",
    apellido_empleado: "",
    celular: "",
    pin: "",
    email: "",
    password: "",
    tipo_empleado: "",
  });

  // Estructura temporal para modificar un empleado existente
  const [empleadoEditar, setEmpleadoEditar] = useState({
    id_empleado: "",
    nombre_empleado: "",
    apellido_empleado: "",
    celular: "",
    pin: "",
    email: "",
    tipo_empleado: "",
  });

  // --- 5. PETICIONES DE CONSULTA (READ) ---
  
  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("empleados")
        .select("*")
        .order("id_empleado", { ascending: true });

      if (error) {
        setToast({ mostrar: true, mensaje: "Error al cargar empleados", tipo: "error" });
        return;
      }
      setEmpleados(data || []);
      setEmpleadosFiltrados(data || []);
    } catch (err) {
      setToast({ mostrar: true, mensaje: "Error inesperado al cargar empleados", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  // --- 6. EFECTOS (USEEFFECT) ---

  useEffect(() => {
    cargarEmpleados();
  }, []);

  // Filtro dinámico multi-parámetro en el lado del cliente
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setEmpleadosFiltrados(empleados);
    } else {
      const texto = textoBusqueda.toLowerCase().trim();
      const filtrados = empleados.filter(emp =>
        `${emp.nombre_empleado} ${emp.apellido_empleado} ${emp.email || ""} ${emp.tipo_empleado || ""}`
          .toLowerCase().includes(texto)
      );
      setEmpleadosFiltrados(filtrados);
    }
  }, [textoBusqueda, empleados]);

  // --- 7. LÓGICA DE CÁLCULO DE PAGINACIÓN ---
  const totalPaginas = Math.ceil(empleadosFiltrados.length / elementosPorPagina);
  const indiceUltimoElemento = paginaActual * elementosPorPagina;
  const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
  
  // Segmento exacto de empleados correspondiente a la página activa
  const empleadosPaginaActual = empleadosFiltrados.slice(indicePrimerElemento, indiceUltimoElemento);

  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  const manejarCambioBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
    setPaginaActual(1); // Importante: Regresa a la página 1 con cada filtro aplicado
  };

  // --- 8. OPERACIONES CRUD DE EMPLEADOS (INSERT / UPDATE) ---

  const agregarEmpleado = async () => {
    if (!nuevoEmpleado.nombre_empleado || !nuevoEmpleado.apellido_empleado ||
        !nuevoEmpleado.email || !nuevoEmpleado.tipo_empleado) {
      setToast({ 
        mostrar: true, 
        mensaje: "Los campos Nombre, Apellido, Email y Rol son obligatorios", 
        tipo: "advertencia" 
      });
      return;
    }

    try {
      setMostrarModal(false);

      const { error: dbError } = await supabase
        .from("empleados")
        .insert([
          {
            nombre_empleado: nuevoEmpleado.nombre_empleado,
            apellido_empleado: nuevoEmpleado.apellido_empleado,
            celular: nuevoEmpleado.celular || null, 
            pin: nuevoEmpleado.pin || null,         
            email: nuevoEmpleado.email,
            tipo_empleado: nuevoEmpleado.tipo_empleado,
          }
        ]);

      if (dbError) throw dbError;

      await cargarEmpleados();
      
      setNuevoEmpleado({ 
        nombre_empleado: "", 
        apellido_empleado: "", 
        celular: "", 
        pin: "", 
        email: "", 
        password: "", 
        tipo_empleado: "" 
      });

      setToast({
        mostrar: true,
        mensaje: `Empleado ${nuevoEmpleado.nombre_empleado} registrado correctamente`,
        tipo: "exito"
      });

    } catch (err) {
      console.error(err);
      setToast({ 
        mostrar: true, 
        mensaje: err.message || "Error al registrar empleado", 
        tipo: "error" 
      });
    }
  };

  const actualizarEmpleado = async () => {
    if (!empleadoEditar.nombre_empleado || !empleadoEditar.apellido_empleado ||
        !empleadoEditar.tipo_empleado) {
      setToast({ mostrar: true, mensaje: "Nombre, Apellido y Rol son obligatorios", tipo: "advertencia" });
      return;
    }

    try {
      setMostrarModalEdicion(false);
      
      const { error } = await supabase
        .from("empleados")
        .update({
          nombre_empleado: empleadoEditar.nombre_empleado,
          apellido_empleado: empleadoEditar.apellido_empleado,
          celular: empleadoEditar.celular,
          pin: empleadoEditar.pin,
          tipo_empleado: empleadoEditar.tipo_empleado,
        })
        .eq("id_empleado", empleadoEditar.id_empleado);

      if (error) throw error;

      await cargarEmpleados();
      setToast({
        mostrar: true,
        mensaje: `Empleado ${empleadoEditar.nombre_empleado} actualizado`,
        tipo: "exito"
      });
    } catch (err) {
      setToast({ mostrar: true, mensaje: "Error al actualizar empleado", tipo: "error" });
    }
  };

  const abrirModalEdicion = (empleado) => {
    setEmpleadoEditar({
      id_empleado: empleado.id_empleado,
      nombre_empleado: empleado.nombre_empleado,
      apellido_empleado: empleado.apellido_empleado,
      celular: empleado.celular || "",
      pin: empleado.pin || "",
      email: empleado.email || "",
      tipo_empleado: empleado.tipo_empleado,
    });
    setMostrarModalEdicion(true);
  };

  // --- 9. DESPLIEGUE DE INTERFAZ GRÁFICA (JSX) ---
  return (
    <Container className="mt-3">
      {/* SECCIÓN CABECERA */}
      <Row className="align-items-center mb-3">
        <Col>
          <h3><i className="bi-person-badge-fill me-2"></i>Empleados</h3>
        </Col>
        <Col className="text-end">
          <Button onClick={() => setMostrarModal(true)}>
            <i className="bi-plus-lg me-1"></i>Nuevo Empleado
          </Button>
        </Col>
      </Row>

      {/* SECCIÓN FILTROS */}
      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarCambioBusqueda}
          />
        </Col>
      </Row>

      {/* RECUADRO DE CARGA */}
      {cargando && (
        <Row className="text-center my-5">
          <Col>
            <Spinner animation="border" variant="success" size="lg" />
            <p className="mt-3 text-muted">Cargando empleados...</p>
          </Col>
        </Row>
      )}

      {/* MENSAJE DE RESULTADOS VACÍOS */}
      {!cargando && textoBusqueda.trim() && empleadosFiltrados.length === 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="info" className="text-center">
              <i className="bi bi-info-circle me-2"></i>
              No se encontraron empleados que coincidan con "{textoBusqueda}".
            </Alert>
          </Col>
        </Row>
      )}

      {/* SECCIÓN CONTENIDO PRINCIPAL CON RENDERIZADO REVOLVENTE */}
      {!cargando && empleadosFiltrados.length > 0 && (
        <>
          <Row>
            {/* Vista móvil/tablet: Pasamos el segmento 'empleadosPaginaActual' */}
            <Col xs={12} className="d-lg-none">
              <TarjetaEmpleado
                empleados={empleadosPaginaActual}
                abrirModalEdicion={abrirModalEdicion}
              />
            </Col>
            {/* Vista desktop: Pasamos el segmento 'empleadosPaginaActual' */}
            <Col lg={12} className="d-none d-lg-block">
              <TablaEmpleados
                empleados={empleadosPaginaActual}
                abrirModalEdicion={abrirModalEdicion}
              />
            </Col>
          </Row>

          {/* COMPONENTE DE PAGINACIÓN DE BOOTSTRAP */}
          {totalPaginas > 1 && (
            <Row className="mt-4">
              <Col className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.First onClick={() => cambiarPagina(1)} disabled={paginaActual === 1} />
                  <Pagination.Prev onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1} />
                  
                  {[...Array(totalPaginas)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === paginaActual}
                      onClick={() => cambiarPagina(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}

                  <Pagination.Next onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} />
                  <Pagination.Last onClick={() => cambiarPagina(totalPaginas)} disabled={paginaActual === totalPaginas} />
                </Pagination>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* COMPONENTE MODAL: Registro */}
      <ModalRegistroEmpleado
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoEmpleado={nuevoEmpleado}
        setNuevoEmpleado={setNuevoEmpleado}
        agregarEmpleado={agregarEmpleado}
      />

      {/* COMPONENTE MODAL: Edición */}
      <ModalEdicionEmpleado
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        empleadoEditar={empleadoEditar}
        setEmpleadoEditar={setEmpleadoEditar}
        actualizarEmpleado={actualizarEmpleado}
      />

      {/* NOTIFICACIONES TOAST */}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>
  );
};

export default Empleados;