import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import TarjetaCliente from "../components/clientes/TarjetaCliente.jsx";
import ModalRegistroCliente from "../components/clientes/ModalRegistroCliente.jsx";
import ModalEliminacionCliente from "../components/clientes/ModalEliminacionCliente.jsx";
import ModalEdicionCliente from "../components/clientes/ModalEdicionCliente.jsx";
import TablaClientes from "../components/clientes/TablaClientes.jsx";
import NotificacionOperacion from "../components/NotificacionesOperacion.jsx";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas.jsx";
import Paginacion from "../components/ordenamiento/Paginacion";

const Clientes = () => {
  // --- 1. ESTADOS DE DATOS PRINCIPALES ---
  const [clientes, setClientes] = useState([]);                 // Listado maestro original desde Supabase
  const [clientesFiltrados, setClientesFiltrados] = useState([]); // Listado alterado por la barra de búsqueda

  // --- 2. ESTADOS DE CONTROL DE INTERFAZ (UI) & PAGINACIÓN ---
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
  const [paginaActual, establecerPaginaActual] = useState(1);

  // --- 3. ESTADOS DE CONTROL DE MODALES ---
  const [mostrarModal, setMostrarModal] = useState(false);                     // Modal Añadir Cliente
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false); // Modal Confirmar Eliminación
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);         // Modal Editar Cliente

  // --- 4. ESTADOS PARA REGISTRO Y EDICIÓN TEMPORAL ---
  
  // Estructura temporal para registrar un nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_cliente: "",
    apellido_cliente: "",
    celular: "",
  });

  // Estructura temporal para modificar un cliente existente
  const [clienteEditar, setClienteEditar] = useState({
    id_cliente: "",
    nombre_cliente: "",
    apellido_cliente: "",
    celular: "",
  });

  const [clienteAEliminar, setClienteAEliminar] = useState(null);

  // --- 5. LÓGICA DE PAGINACIÓN ---
  // Segmenta el array filtrado de acuerdo a la página actual y la cantidad de filas permitidas
  const clientesPaginados = clientesFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  // --- 6. MANEJADORES DE ENTRADA (INPUT HANDLERS) ---
  const manejarBusqueda = (e) => setTextoBusqueda(e.target.value);

  // Captura los cambios de texto en el formulario de creación
  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoCliente((prev) => ({ ...prev, [name]: value }));
  };

  // Captura los cambios de texto en el formulario de edición
  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setClienteEditar((prev) => ({ ...prev, [name]: value }));
  };

  // --- 7. PETICIONES DE CONSULTA (READ) ---
  const cargarClientes = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("id_cliente", { ascending: true });

      if (error) {
        console.error("Error al cargar clientes:", error.message);
        setToast({ mostrar: true, mensaje: "Error al cargar clientes.", tipo: "error" });
        return;
      }
      setClientes(data || []);
    } catch (err) {
      console.error("Excepción al cargar clientes:", err.message);
      setToast({ mostrar: true, mensaje: "Error inesperado al cargar clientes.", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  // --- 8. EFECTOS (USEEFFECT) ---

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  // Filtro dinámico multi-parámetro (Nombre, Apellido o Celular)
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setClientesFiltrados(clientes);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtrados = clientes.filter(
        (cli) =>
          cli.nombre_cliente?.toLowerCase().includes(textoLower) ||
          cli.apellido_cliente?.toLowerCase().includes(textoLower) ||
          cli.celular?.toLowerCase().includes(textoLower)
      );
      setClientesFiltrados(filtrados);
    }
    // Reinicia a la primera página cuando el usuario realiza una nueva búsqueda
    establecerPaginaActual(1);
  }, [textoBusqueda, clientes]);

  // --- 9. OPERACIONES CRUD (INSERT, UPDATE, DELETE) ---

  // REGISTRO: Inserta el nuevo registro en la tabla 'clientes' de Supabase
  const agregarCliente = async () => {
    try {
      if (!nuevoCliente.nombre_cliente.trim() || !nuevoCliente.celular.trim()) {
        setToast({ mostrar: true, mensaje: "Debe llenar nombre y celular.", tipo: "advertencia" });
        return;
      }

      const { error } = await supabase.from("clientes").insert([
        {
          nombre_cliente: nuevoCliente.nombre_cliente,
          apellido_cliente: nuevoCliente.apellido_cliente,
          celular: nuevoCliente.celular,
        },
      ]);

      if (error) {
        console.error("Error al agregar cliente:", error.message);
        setToast({ mostrar: true, mensaje: "Error al registrar cliente.", tipo: "error" });
        return;
      }

      setToast({
        mostrar: true,
        mensaje: `Cliente "${nuevoCliente.nombre_cliente} ${nuevoCliente.apellido_cliente}" registrado exitosamente.`,
        tipo: "exito",
      });

      setNuevoCliente({ nombre_cliente: "", apellido_cliente: "", celular: "" });
      setMostrarModal(false);
      await cargarClientes();
    } catch (err) {
      console.error("Excepción al agregar cliente:", err.message);
      setToast({ mostrar: true, mensaje: "Error inesperado al registrar cliente.", tipo: "error" });
    }
  };

  // ELIMINACIÓN: Remueve la fila seleccionada usando el identificador único primario
  const eliminarCliente = async () => {
    if (!clienteAEliminar) return;
    try {
      setMostrarModalEliminacion(false);
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id_cliente", clienteAEliminar.id_cliente);

      if (error) {
        setToast({ mostrar: true, mensaje: `Error al eliminar el cliente.`, tipo: "error" });
        return;
      }

      await cargarClientes();
      setToast({ mostrar: true, mensaje: `Cliente eliminado exitosamente.`, tipo: "exito" });
    } catch (err) {
      setToast({ mostrar: true, mensaje: "Error inesperado al eliminar cliente.", tipo: "error" });
    }
  };

  // ACTUALIZACIÓN: Modifica los atributos del cliente mediante el payload estructurado
  const actualizarCliente = async () => {
    try {
      if (!clienteEditar.nombre_cliente.trim() || !clienteEditar.celular.trim()) {
        setToast({ mostrar: true, mensaje: "Debe llenar nombre y celular.", tipo: "advertencia" });
        return;
      }

      setMostrarModalEdicion(false);
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre_cliente: clienteEditar.nombre_cliente,
          apellido_cliente: clienteEditar.apellido_cliente,
          celular: clienteEditar.celular,
        })
        .eq("id_cliente", clienteEditar.id_cliente);

      if (error) {
        setToast({ mostrar: true, mensaje: "Error al actualizar cliente.", tipo: "error" });
        return;
      }

      await cargarClientes();
      setToast({ mostrar: true, mensaje: `Cliente actualizado exitosamente.`, tipo: "exito" });
    } catch (err) {
      setToast({ mostrar: true, mensaje: "Error inesperado al actualizar cliente.", tipo: "error" });
    }
  };

  // --- 10. MANEJADORES AUXILIARES DE MODALES ---
  const abrirModalEdicion = (cliente) => {
    setClienteEditar({
      id_cliente: cliente.id_cliente,
      nombre_cliente: cliente.nombre_cliente,
      apellido_cliente: cliente.apellido_cliente,
      celular: cliente.celular,
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (cliente) => {
    setClienteAEliminar(cliente);
    setMostrarModalEliminacion(true);
  };

  // --- 11. DESPLIEGUE DE INTERFAZ GRÁFICA (JSX) ---
  return (
    <Container className="mt-3">
      {/* SECCIÓN CABECERA: Título y Botón de creación */}
      <Row className="align-items-center mb-3">
        <Col xs={9} sm={7} md={7} lg={7} className="d-flex align-items-center">
          <h3 className="mb-0">
            <i className="bi-people-fill me-2"></i> Clientes
          </h3>
        </Col>
        <Col xs={3} sm={5} md={5} lg={5} className="text-end">
          <Button onClick={() => setMostrarModal(true)} size="md">
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nuevo Cliente</span>
          </Button>
        </Col>
      </Row>
      <hr />

      {/* SECCIÓN FILTROS: Cuadro de búsqueda */}
      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarBusqueda}
            placeholder="Buscar por nombre, apellido o celular..."
          />
        </Col>
      </Row>

      {/* COMPONENTE VISUAL: Mensaje Informativo si la búsqueda queda vacía */}
      {!cargando && textoBusqueda.trim() && clientesFiltrados.length === 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="info" className="text-center">
              <i className="bi bi-info-circle me-2"></i>
              No se encontraron clientes que coincidan con "{textoBusqueda}".
            </Alert>
          </Col>
        </Row>
      )}

      {/* COMPONENTE VISUAL: Spinner de carga inicial */}
      {cargando && (
        <Row className="text-center my-5">
          <Col>
            <Spinner animation="border" variant="success" size="lg" />
            <p className="mt-3 text-muted">Cargando clientes...</p>
          </Col>
        </Row>
      )}

      {/* SECCIÓN CONTENIDO PRINCIPAL: Renderizado condicional responsivo (Tarjetas vs Tabla) */}
      {!cargando && clientesFiltrados.length > 0 && (
        <Row>
          {/* Vista móvil/tablet: Formato tarjetas adaptables */}
          <Col xs={12} sm={12} md={12} className="d-lg-none">
            <TarjetaCliente
              clientes={clientesPaginados}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
            />
          </Col>
          {/* Vista desktop: Estructura tabular tradicional */}
          <Col lg={12} className="d-none d-lg-block">
            <TablaClientes
              clientes={clientesPaginados}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
            />
          </Col>
        </Row>
      )}

      {/* COMPONENTE VISUAL: Paginador Inferior */}
      {clientesFiltrados.length > 0 && (
        <Paginacion
          registrosPorPagina={registrosPorPagina}
          totalRegistros={clientesFiltrados.length}
          paginaActual={paginaActual}
          establecerPaginaActual={establecerPaginaActual}
          establecerRegistrosPorPagina={establecerRegistrosPorPagina}
        />
      )}

      {/* COMPONENTE MODAL: Registro de nuevos clientes */}
      <ModalRegistroCliente
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoCliente={nuevoCliente}
        manejoCambioInput={manejoCambioInput}
        agregarCliente={agregarCliente}
      />

      {/* COMPONENTE MODAL: Confirmación de Eliminación */}
      <ModalEliminacionCliente
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarCliente={eliminarCliente}
        cliente={clienteAEliminar}
      />

      {/* COMPONENTE MODAL: Edición y modificación de clientes */}
      <ModalEdicionCliente
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        clienteEditar={clienteEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        actualizarCliente={actualizarCliente}
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

export default Clientes;