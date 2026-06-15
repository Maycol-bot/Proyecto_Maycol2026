import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionesOperacion.jsx";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas.jsx";
import Paginacion from "../components/ordenamiento/Paginacion";
import TablaVentas from "../components/ventas/TablaVentas.jsx";
import TarjetaVenta from "../components/ventas/TarjetaVenta.jsx";
import FormularioVenta from "../components/ventas/FormularioVenta.jsx";

const Ventas = () => {
  // --- 1. ESTADOS DE CONTROL DE INTERFAZ (UI) ---
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" }); // Mensajes de feedback
  const [cargando, setCargando] = useState(true);                                // Spinner de carga general
  const [mostrarFormulario, setMostrarFormulario] = useState(false);            // Control de visibilidad del Modal
  const [ventaAEditar, setVentaAEditar] = useState(null);                        // Almacena la venta seleccionada para modificar

  // --- 2. ESTADOS DE DATOS DE LA BASE DE DATOS ---
  const [ventas, setVentas] = useState([]);       // Listado maestro de ventas desde Supabase
  const [clientes, setClientes] = useState([]);   // Catálogo para llenar el selector del formulario
  const [empleados, setEmpleados] = useState([]); // Catálogo para llenar el selector del formulario
  const [productos, setProductos] = useState([]); // Catálogo de productos disponibles

  // --- 3. ESTADOS TEMPORALES DEL FORMULARIO TRANSACCIONAL ---
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [detalles, setDetalles] = useState([]);         // Artículos agregados a la venta actual
  const [totalGeneral, setTotalGeneral] = useState(0);  // Suma total calculada de los detalles

  // --- 4. ESTADOS FILTRADO Y PAGINACIÓN ---
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(8);
  const [paginaActual, establecerPaginaActual] = useState(1);

  // --- 5. LÓGICA DE PAGINACIÓN ---
  // Segmenta la lista ya filtrada para mostrar únicamente el bloque correspondiente a la página actual
  const ventasPaginadas = ventasFiltradas.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  // --- 6. PETICIONES A LA API (SUPABASE) ---
  
  // Trae los catálogos de soporte de forma simultánea para agilizar la carga del formulario
  const cargarDatosAuxiliares = async () => {
    try {
      const [c, e, p] = await Promise.all([
        supabase.from("clientes").select("*"),
        supabase.from("empleados").select("*"),
        supabase.from("productos").select("*")
      ]);
      setClientes(c.data || []);
      setEmpleados(e.data || []);
      setProductos(p.data || []);
    } catch (err) {
      console.error("Error cargando auxiliares:", err);
    }
  };

  // Trae el historial de ventas realizando los JOINS relacionales necesarios para mostrar los nombres reales
  const cargarVentas = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("ventas")
        .select(`
          *,
          clientes (nombre_cliente, apellido_cliente),
          empleados (nombre_empleado, apellido_empleado),
          detalles_ventas (*, productos (nombre_productos)) 
        `)
        .order("fecha_venta", { ascending: false });

      if (error) {
        console.error("Error al cargar ventas:", error);
        setToast({ mostrar: true, mensaje: "Error al cargar ventas", tipo: "error" });
        return;
      }
      setVentas(data || []);
    } catch (err) {
      console.error(err);
      setToast({ mostrar: true, mensaje: "Error inesperado al cargar ventas", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  // --- 7. EFECTOS (USEEFFECT) ---

  // Inicialización: Carga todos los datos al montar el componente por primera vez
  useEffect(() => {
    cargarVentas();
    cargarDatosAuxiliares();
  }, []);

  // Modo Edición: Cuando se selecciona una venta para editar, rellena los estados del formulario
  useEffect(() => {
    if (ventaAEditar) {
      const cliente = clientes.find(c => c.id_cliente === ventaAEditar.id_cliente);
      const empleado = empleados.find(e => e.id_empleado === ventaAEditar.id_empleado);

      setClienteSeleccionado(cliente || null);
      setEmpleadoSeleccionado(empleado || null);
      setMetodoPago(ventaAEditar.metodo_pago || "efectivo");

      if (ventaAEditar.detalles_ventas?.length > 0) {
        const detallesFormateados = ventaAEditar.detalles_ventas.map(d => ({
          id_producto: d.id_producto,
          nombre_producto: d.productos?.nombre_producto || "Producto",
          precio: d.precio_unitario,
          cantidad: d.cantidad
        }));
        setDetalles(detallesFormateados);
      } else {
        setDetalles([]);
      }
    }
  }, [ventaAEditar, clientes, empleados]);

  // Cálculo Automático: Actualiza el valor total acumulado cada vez que cambia un artículo o cantidad
  useEffect(() => {
    const total = detalles.reduce((sum, det) => sum + (det.cantidad * det.precio), 0);
    setTotalGeneral(total);
  }, [detalles]);

  // Filtro en Tiempo Real: Ejecuta la búsqueda sobre la lista de ventas según el cliente o empleado digitado
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setVentasFiltradas(ventas);
    } else {
      const textoLower = textoBusqueda.toLowerCase();
      const filtradas = ventas.filter(v =>
        `${v.clientes?.nombre_cliente || ''} ${v.clientes?.apellido_cliente || ''}`.toLowerCase().includes(textoLower) ||
        v.empleados?.nombre_empleado?.toLowerCase().includes(textoLower)
      );
      setVentasFiltradas(filtradas);
    }
  }, [textoBusqueda, ventas]);

  // --- 8. CONTROLADORES DE EVENTOS Y FLUJO DEL FORMULARIO ---

  const abrirNuevaVenta = () => {
    resetFormulario();
    setMostrarFormulario(true);
  };

  const abrirEdicion = (venta) => {
    setVentaAEditar(venta);
    setMostrarFormulario(true);
  };

  const resetFormulario = () => {
    setClienteSeleccionado(null);
    setEmpleadoSeleccionado(null);
    setMetodoPago("efectivo");
    setDetalles([]);
    setVentaAEditar(null);
  };

  // --- 9. MANEJO DE LA "CANASTA" O DETALLES DE VENTA ---

  // Añade productos a la lista interna controlando si ya existen para incrementar su cantidad
  const agregarDetalle = (producto, cantidad) => {
    if (!producto || !cantidad) return;
    
    setDetalles(prev => {
      const existe = prev.find(d => d.id_producto === producto.id_productos);
      
      if (existe) {
        return prev.map(d =>
          d.id_producto === producto.id_productos ? { ...d, cantidad: d.cantidad + cantidad } : d
        );
      }
      
      return [...prev, {
        id_producto: producto.id_productos,        
        nombre_producto: producto.nombre_productos, 
        precio: producto.precio_venta,              
        cantidad
      }];
    });
  };

  const eliminarDetalle = (id_producto) => {
    setDetalles(prev => prev.filter(d => d.id_producto !== id_producto));
  };

  const actualizarCantidad = (id_producto, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setDetalles(prev => prev.map(d =>
      d.id_producto === id_producto ? { ...d, cantidad: nuevaCantidad } : d
    ));
  };

  // --- 10. ENVÍO DE DATOS A LA BASE DE DATOS (INSERT / UPDATE) ---
  const guardarVenta = async () => {
    if (!clienteSeleccionado || !empleadoSeleccionado || detalles.length === 0) {
      setToast({ mostrar: true, mensaje: "Faltan datos obligatorios", tipo: "advertencia" });
      return;
    }

    try {
      if (ventaAEditar) {
        // ACCIÓN: Actualizar cabecera de la venta
        await supabase.from("ventas").update({
          id_cliente: clienteSeleccionado.id_cliente,
          id_empleado: empleadoSeleccionado.id_empleado,
          metodo_pago: metodoPago,
          total: totalGeneral
        }).eq("id_venta", ventaAEditar.id_venta);

        // Re-estructuración de detalles: Borramos los anteriores e insertamos los nuevos actualizados
        await supabase.from("detalles_ventas").delete().eq("id_venta", ventaAEditar.id_venta);

        const detallesInsert = detalles.map(d => ({
          id_venta: ventaAEditar.id_venta,
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio,
          subtotal: d.cantidad * d.precio
        }));

        await supabase.from("detalles_ventas").insert(detallesInsert);
        setToast({ mostrar: true, mensaje: "Venta actualizada exitosamente", tipo: "exito" });

      } else {
        // ACCIÓN: Insertar nueva venta
        const nicaNow = () => new Date().toLocaleString("sv", { timeZone: "America/Managua" }).replace(" ", "T");

        const { data: ventaData } = await supabase
          .from("ventas")
          .insert([{
            id_cliente: clienteSeleccionado.id_cliente,
            id_empleado: empleadoSeleccionado.id_empleado,
            fecha_venta: nicaNow(),
            metodo_pago: metodoPago,
            total: totalGeneral
          }])
          .select()
          .single();

        // Enlazamos los detalles capturados en la UI con el ID generado de la nueva venta
        const detallesInsert = detalles.map(d => ({
          id_venta: ventaData.id_venta,
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio,
          subtotal: d.cantidad * d.precio
        }));

        await supabase.from("detalles_ventas").insert(detallesInsert);
        setToast({ mostrar: true, mensaje: "Venta registrada exitosamente", tipo: "exito" });
      }

      // Cierre de ciclo de la operación
      resetFormulario();
      setMostrarFormulario(false);
      await cargarVentas(); // Recarga la tabla con los cambios reflejados en tiempo real

    } catch (err) {
      console.error(err);
      setToast({ mostrar: true, mensaje: "Error al guardar la venta", tipo: "error" });
    }
  };

  const manejarBusqueda = (e) => setTextoBusqueda(e.target.value);

  // --- 11. ESTRUCTURA INTERFAZ GRÁFICA (JSX) ---
  return (
    <Container className="mt-3">
      {/* SECCIÓN CABECERA: Título y Botón de creación */}
      <Row className="align-items-center mb-3">
        <Col xs={8} lg={8}>
          <h3 className="mb-0">
            <i className="bi bi-receipt-cutoff me-2"></i> Ventas
          </h3>
        </Col>
        <Col xs={4} lg={4} className="text-end">
          <Button onClick={abrirNuevaVenta} size="md">
            <i className="bi bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nueva Venta</span>
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
            placeholder="Buscar por cliente o empleado..."
          />
        </Col>
      </Row>

      {/* SECCIÓN CONTENIDO PRINCIPAL: Validar si está cargando o renderiza la lista */}
      {cargando ? (
        <Row className="text-center my-5">
          <Spinner animation="border" variant="success" size="lg" />
          <p className="mt-3 text-muted">Cargando ventas...</p>
        </Row>
      ) : (
        <Row>
          {/* Vista móvil/tablet: Tarjetas adaptables */}
          <Col xs={12} className="d-lg-none">
            <TarjetaVenta ventas={ventasPaginadas} abrirEdicion={abrirEdicion} />
          </Col>
          {/* Vista desktop: Tabla tradicional */}
          <Col lg={12} className="d-none d-lg-block">
            <TablaVentas ventas={ventasPaginadas} abrirEdicion={abrirEdicion} />
          </Col>
        </Row>
      )}

      {/* SECCIÓN PAGINACIÓN: Solo aparece si existen elementos filtrados */}
      {ventasFiltradas.length > 0 && (
        <Paginacion
          registrosPorPagina={registrosPorPagina}
          totalRegistros={ventasFiltradas.length}
          paginaActual={paginaActual}
          establecerPaginaActual={establecerPaginaActual}
          establecerRegistrosPorPagina={establecerRegistrosPorPagina}
        />
      )}

      {/* MODAL TRANSACCIONAL: Crear o Modificar Ventas con sus detalles */}
      <FormularioVenta
        mostrar={mostrarFormulario}
        setMostrar={setMostrarFormulario}
        clientes={clientes}
        empleados={empleados}
        productos={productos}
        clienteSeleccionado={clienteSeleccionado}
        setClienteSeleccionado={setClienteSeleccionado}
        empleadoSeleccionado={empleadoSeleccionado}
        setEmpleadoSeleccionado={setEmpleadoSeleccionado}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        detalles={detalles}
        totalGeneral={totalGeneral}
        agregarDetalle={agregarDetalle}
        eliminarDetalle={eliminarDetalle}
        actualizarCantidad={actualizarCantidad}
        guardarVenta={guardarVenta}
        ventaAEditar={ventaAEditar}
      />

      {/* COMPONENTE ALERTAS: Toasts de estado */}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>
  );
};

export default Ventas;