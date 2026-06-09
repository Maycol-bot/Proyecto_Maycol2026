import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Button, Card, Spinner, Form } from "react-bootstrap";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// Importamos el servicio modular que acabamos de crear
import {
  fetchVentasPorRango,
  fetchDetallesDeVentas,
  procesarEstadisticas,
  generarReporteExcel
} from "../services/analyticsService.js";

/**
 * @constant {string[]} COLORES
 * Paleta de colores en formato Hexadecimal para las secciones de las gráficas (PieChart y LineChart).
 */
const COLORES = ["#5e26b2", "#39ff95", "#ff6bc6", "#8b46ff", "#00d4ff", "#ffd93d"];

/**
 * Componente Principal de la Pantalla de Inicio (Dashboard).
 * Muestra el resumen del negocio mediante métricas clave, gráficos interactivos
 * y permite la exportación de reportes a formatos de hoja de cálculo.
 * @component
 * @returns {JSX.Element} El componente de la pantalla de inicio estructurado.
 */
const Inicio = () => {

  // --- Estados de Control y Filtros ---
  const [cargando, setCargando] = useState(true);
  const [fechaDesde, setFechaDesde] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" }));
  const [fechaHasta, setFechaHasta] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" }));

  // --- Referencias para Generación de PDFs (html2canvas) ---
  const graficoHoraRef = useRef(null); // Requerido en paso 4 
  const graficoCategoriaRef = useRef(null); // Requerido para punto 9 [cite: 527]
  const estadisticaGeneralRef = useRef(null); // Requerido para punto 10 [cite: 528]

  // --- Estado Centralizado de Métricas y Analítica ---
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    productosVendidos: 0,
    montoProductos: 0,
    cantidadVentas: 0,
    ventasPorHora: [],
    ventasPorCategoria: []
  });

  /**
   * Controlador para coordinar la carga asíncrona de datos de Supabase y
   * disparar el procesamiento analítico de las métricas del dashboard.
   */
  const cargarDatos = async (desde, hasta) => {
    try {
      setCargando(true);

      const inicioRango = `${desde} 00:00:00`;
      const finRango = `${hasta} 23:59:59`;

      // 1. Obtener ventas del rango
      const ventas = await fetchVentasPorRango(inicioRango, finRango);
      const idsVentas = ventas.map(v => v.id_venta);

      // 2. Obtener detalles si existen ventas
      const detalles = idsVentas.length > 0 ? await fetchDetallesDeVentas(idsVentas) : [];

      // 3. Procesar las estadísticas a través del servicio analítico
      const resultadoMetricas = procesarEstadisticas(ventas, detalles);

      // 4. Guardar resultados en el estado local
      setEstadisticas(resultadoMetricas);

    } catch (err) {
      console.error("Error al coordinar la carga de estadísticas:", err);
    } finally {
      setCargando(false);
    }
  };

  // --- Efecto Reactivo para Escuchar Cambios en los Filtros de Fecha ---
  useEffect(() => {
    cargarDatos(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta]);

  /**
   * Manejador de eventos para disparar la descarga del reporte en Excel
   */
  const descargarExcel = async () => {
    try {
      setCargando(true);
      await generarReporteExcel(fechaDesde, fechaHasta);
    } catch (err) {
      console.error("Error generando Excel:", err);
      alert("Error al generar el Excel. Revisa la consola.");
    } finally {
      setCargando(false);
    }
  };

  // --- PASO 7: Función para Generar PDF de Ventas por Hora [cite: 479] ---
  const generarPdfVentasHora = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4"); // [cite: 484]

      // Título y fecha [cite: 485]
      pdf.setFontSize(18); // [cite: 486]
      pdf.setTextColor("#336775"); // [cite: 487]
      pdf.setFont("helvetica", "bold"); // [cite: 488]
      pdf.text("Reporte de Ventas por Hora", 14, 15); // [cite: 489]
      
      pdf.setFont("helvetica", "normal"); // [cite: 490]
      pdf.setTextColor("#008000"); // [cite: 491]
      pdf.setFontSize(10); // [cite: 492]
      pdf.text(`Periodo: ${fechaDesde} - ${fechaHasta}`, 14, 22); // [cite: 493]

      // Captura del Gráfico [cite: 494]
      const canvas = await html2canvas(graficoHoraRef.current); // [cite: 497]
      const imagen = canvas.toDataURL("image/png"); // [cite: 498]
      pdf.addImage(imagen, "PNG", 10, 30, 100, 0); // [cite: 499]

      // Resumen General [cite: 500]
      pdf.setFontSize(14);
      pdf.setTextColor("#336775"); // [cite: 501]
      pdf.setFont("helvetica", "bold"); // [cite: 502]
      pdf.text("Resumen General", 14, 115); // [cite: 503]

      pdf.setFont("helvetica", "normal"); // [cite: 504]
      pdf.setTextColor("#000000"); // [cite: 505]
      pdf.setFontSize(10); // [cite: 506]

      pdf.text(`Total Ventas: C$ ${estadisticas.totalVentas.toFixed(2)}`, 14, 125); // [cite: 507]
      pdf.text(`Ventas Efectivo: C$ ${estadisticas.ventasEfectivo.toFixed(2)}`, 14, 132); // [cite: 508]
      pdf.text(`Ventas Tarjeta: C$ ${estadisticas.ventasTarjeta.toFixed(2)}`, 14, 139); // [cite: 508]
      pdf.text(`Productos Vendidos: ${estadisticas.productosVendidos}`, 14, 146); // [cite: 509]
      pdf.text(`Cantidad Ventas: ${estadisticas.cantidadVentas}`, 14, 153); // [cite: 510]

      // Tabla de ventas por hora [cite: 511]
      const filas = estadisticas.ventasPorHora.map(item => [ // [cite: 512]
        item.hora, // [cite: 514]
        `C$ ${item.total}` // [cite: 516]
      ]);

      autoTable(pdf, { // [cite: 517]
        startY: 160, // [cite: 518]
        head: [["Hora", "Monto Acumulado"]], // [cite: 519]
        body: filas
      });

      // Descargar PDF [cite: 521]
      const fechaActual = new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" }); // [cite: 522]
      pdf.save(`VentasHora_${fechaDesde}_${fechaHasta}_Generado_${fechaActual}.pdf`); // [cite: 522]

    } catch (error) {
      console.error(error); // [cite: 524]
      alert("Error generando PDF"); // [cite: 525]
    }
  };

  // --- PUNTO 9: Función para Generar PDF de Ventas por Categoría [cite: 527] ---
  const generarPdfVentasCategoria = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setFontSize(18);
      pdf.setTextColor("#336775");
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte de Ventas por Categoría", 14, 15);
      
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#008000");
      pdf.setFontSize(10);
      pdf.text(`Periodo: ${fechaDesde} - ${fechaHasta}`, 14, 22);

      const canvas = await html2canvas(graficoCategoriaRef.current);
      const imagen = canvas.toDataURL("image/png");
      pdf.addImage(imagen, "PNG", 10, 30, 110, 0);

      pdf.setFontSize(14);
      pdf.setTextColor("#336775");
      pdf.setFont("helvetica", "bold");
      pdf.text("Resumen por Categoría", 14, 130);

      const filas = estadisticas.ventasPorCategoria.map(item => [
        item.name,
        `C$ ${item.value.toFixed(2)}`
      ]);

      autoTable(pdf, {
        startY: 135,
        head: [["Categoría", "Monto Total"]],
        body: filas.length > 0 ? filas : [["Sin datos", "C$ 0.00"]]
      });

      const fechaActual = new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" });
      pdf.save(`VentasCategoria_${fechaDesde}_${fechaHasta}_Generado_${fechaActual}.pdf`);

    } catch (error) {
      console.error(error);
      alert("Error generando PDF de categorías");
    }
  };

  // --- PUNTO 10: Función para Generar PDF de toda la Estadística General [cite: 528] ---
  const generarPdfEstadisticaGeneral = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setFontSize(20);
      pdf.setTextColor("#336775");
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte General de Estadísticas del Dashboard", 14, 15);
      
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#008000");
      pdf.setFontSize(10);
      pdf.text(`Periodo Analizado: ${fechaDesde} - ${fechaHasta}`, 14, 23);

      // Capturamos toda la sección que envuelve los KPI y gráficos
      const canvas = await html2canvas(estadisticaGeneralRef.current);
      const imagen = canvas.toDataURL("image/png");
      
      // Ajustamos la imagen completa al ancho de la hoja A4 (aprox 190mm de contenido útil)
      pdf.addImage(imagen, "PNG", 10, 30, 190, 0);

      const fechaActual = new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" });
      pdf.save(`DashboardGeneral_${fechaDesde}_${fechaHasta}_${fechaActual}.pdf`);

    } catch (error) {
      console.error(error);
      alert("Error generando PDF global");
    }
  };


  if (cargando) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3">Cargando estadísticas...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-3">
      <div className="mt-2">
        <div className="mb-4">
          <h2>Dashboard</h2>
          <h6>Estadísticas del Negocio</h6>
        </div>

        {/* Controles de Filtros y Acciones */}
        <Row className="mb-4">
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>Desde</Form.Label>
              <Form.Control type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </Form.Group>
          </Col>
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>Hasta</Form.Label>
              <Form.Control type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-end gap-2 flex-wrap">
            <Button variant="success" onClick={descargarExcel} className="mt-3 mt-md-0">
              <i className="bi bi-file-earmark-excel me-2"></i>
              Descargar Excel
            </Button>
            
            {/* PUNTO 10: Botón al lado del reporte Excel para descargar estadística general [cite: 528] */}
            <Button variant="danger" onClick={generarPdfEstadisticaGeneral} className="mt-3 mt-md-0">
              <i className="bi bi-file-earmark-pdf me-2"></i>
              Descargar PDF General
            </Button>
          </Col>
        </Row>

        {/* Contenedor referenciado para capturar la vista global del dashboard (Punto 10) */}
        <div ref={estadisticaGeneralRef}>
          
          {/* Tarjetas Informativas de Métricas */}
          <Row className="g-4 mb-5">
            <Col md={6} lg={3}>
              <Card className="h-100 text-white shadow border-0" style={{ background: "linear-gradient(135deg, #28a745, #34ce57)" }}>
                <Card.Body>
                  <h5>Ventas Totales</h5>
                  <h2>C$ {estadisticas.totalVentas.toFixed(2)}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 text-white shadow border-0" style={{ background: "linear-gradient(135deg, #0166d3, #3399ff)" }}>
                <Card.Body>
                  <h5>Efectivo</h5>
                  <h2>C$ {estadisticas.ventasEfectivo.toFixed(2)}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 text-white shadow border-0" style={{ background: "linear-gradient(135deg, #5ea5f1, #94c0ec)" }}>
                <Card.Body>
                  <h5>Tarjeta</h5>
                  <h2>C$ {estadisticas.ventasTarjeta.toFixed(2)}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 text-white shadow border-0" style={{ background: "linear-gradient(135deg, #e27d01, #ffa500)" }}>
                <Card.Body>
                  <h5>Productos Vendidos</h5>
                  <h2>{estadisticas.productosVendidos}</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Bloque Gráfico de Recharts */}
          <Row className="g-4">
            
            {/* Gráfica Lineal de Tendencia */}
            <Col lg={8}>
              <Card className="shadow border-0">
                {/* PASO 5: Asignar la referencia al Card.Body [cite: 464, 465] */}
                <Card.Body ref={graficoHoraRef}>
                  <h5 className="mb-3">Ventas por Hora</h5>
                  <ResponsiveContainer width="100%" height={360}>
                    <LineChart data={estadisticas.ventasPorHora}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis tickFormatter={(v) => `C$ ${v}`} />
                      <Tooltip formatter={(v) => [`C$ ${v}`, "Monto"]} />
                      <Line type="monotone" dataKey="total" stroke="#5e26b2" strokeWidth={4} dot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
                
                {/* PASO 6: Botón para descargar el PDF de Ventas por Hora debajo del Card.Body [cite: 467] */}
                <div className="p-3 text-center border-top">
                  <Button variant="outline-danger" onClick={generarPdfVentasHora}>
                    <i className="bi bi-file-earmark-pdf me-2"></i>
                    Descargar PDF Ventas por Hora
                  </Button>
                </div>
              </Card>
            </Col>

            {/* Gráfica de Pastel Categorizada */}
            <Col lg={4}>
              <Card className="shadow border-0">
                {/* PUNTO 9: Asignar referencia al Card.Body de Categorías [cite: 527] */}
                <Card.Body ref={graficoCategoriaRef}>
                  <h5 className="mb-3">Ventas por Categoría</h5>
                  <ResponsiveContainer width="100%" height={360}>
                    <PieChart>
                      <Pie
                        data={estadisticas.ventasPorCategoria.length > 0 ? estadisticas.ventasPorCategoria : [{ name: "Sin datos", value: 1 }]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={110}
                        label
                      >
                        {estadisticas.ventasPorCategoria.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORES[i % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`C$ ${v}`, "Monto"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>

                {/* PUNTO 9: Botón para el reporte PDF de Ventas por Categoría [cite: 527] */}
                <div className="p-3 text-center border-top">
                  <Button variant="outline-danger" onClick={generarPdfVentasCategoria}>
                    <i className="bi bi-file-earmark-pdf me-2"></i>
                    Descargar PDF Categorías
                  </Button>
                </div>
              </Card>
            </Col>

          </Row>
        </div> {/* Cierre del contenedor global */}
      </div>
    </Container>
  );
};

export default Inicio;