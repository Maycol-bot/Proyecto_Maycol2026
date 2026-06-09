import { supabase } from "../database/supabaseconfig";
import * as XLSX from 'xlsx';

/**
 * Consulta las ventas crudas desde Supabase.
 */
export const fetchVentasPorRango = async (inicioRango, finRango) => {
  const fechaInicioPlana = inicioRango.split(" ")[0]; 
  const fechaFinPlana = finRango.split(" ")[0];

  // Margen de seguridad para evitar desfases de huso horario
  const dInicio = new Date(fechaInicioPlana);
  dInicio.setDate(dInicio.getDate() - 1);
  const inicioSeguro = `${dInicio.toISOString().split('T')[0]} 00:00:00`;

  const dFin = new Date(fechaFinPlana);
  dFin.setDate(dFin.getDate() + 1);
  const finSeguro = `${dFin.toISOString().split('T')[0]} 23:59:59`;

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id_venta, total, fecha_venta, metodo_pago")
    .gte("fecha_venta", inicioSeguro)
    .lte("fecha_venta", finSeguro);

  if (error) throw error;

  // Filtrado preciso en base a la zona horaria de Nicaragua
  return (ventas || []).filter(venta => {
    if (!venta.fecha_venta) return false;
    const fechaLocalVenta = new Date(venta.fecha_venta).toLocaleDateString("en-CA", {
      timeZone: "America/Managua"
    });
    return fechaLocalVenta >= fechaInicioPlana && fechaLocalVenta <= fechaFinPlana;
  });
};

/**
 * Consulta los detalles de las ventas junto con sus relaciones.
 * 🛠️ SOLUCIÓN AL ERROR 400: Prueba múltiples nombres relacionales en caso de error de sintaxis.
 */
export const fetchDetallesDeVentas = async (idsVentas) => {
  if (!idsVentas || idsVentas.length === 0) return [];

  try {
    // Intento 1: Formato estándar en plural (productos / categorias)
const { data } = await supabase
  .from("detalles_ventas")
  .select(`
    cantidad, 
    subtotal,
    producto (  // <-- Cambia aquí si es singular o plural
      nombre_producto,
      categoria (nombre_categoria) // <-- Cambia aquí si es singular o plural
    )
  `)
  .in("id_venta", idsVentas);

    // Si no hay error, retornamos los datos exitosos
    if (!error) return data || [];

    console.warn("Intento 1 falló (400), probando formato alternativo singular...");

    // Intento 2: Formato alternativo en singular (producto / categoria) por si acaso
    const { data: dataAlt, error: errorAlt } = await supabase
      .from("detalles_ventas")
      .select(`
        cantidad, 
        subtotal,
        producto (
          nombre_producto,
          categoria (nombre_categoria)
        )
      `)
      .in("id_venta", idsVentas);

    if (!errorAlt) {
      // Mapeamos para que mantenga la misma estructura esperada por el dashboard
      return (dataAlt || []).map(d => ({
        cantidad: d.cantidad,
        subtotal: d.subtotal,
        productos: d.producto
      }));
    }

    console.warn("Intento 2 falló, trayendo únicamente campos planos para no bloquear el Dashboard.");
    
    // Fallback de Rescate: Traer subtotales limpios sin tablas unidas.
    // Esto asegura que las métricas y el gráfico por hora funcionen aunque falte la categoría.
    const { data: dataPlana } = await supabase
      .from("detalles_ventas")
      .select("cantidad, subtotal")
      .in("id_venta", idsVentas);

    return dataPlana || [];

  } catch (err) {
    console.error("Error crítico en fetchDetallesDeVentas:", err);
    return [];
  }
};

/**
 * Procesa los datos crudos de ventas y detalles para generar las métricas del dashboard.
 */
export const procesarEstadisticas = (ventas, detalles) => {
  let productosVendidos = 0;
  let montoProductos = 0;
  let ventasPorCategoria = [];

  // 1. Procesar detalles de productos y categorías de manera segura
  (detalles || []).forEach(d => {
    productosVendidos += d.cantidad || 0;
    montoProductos += d.subtotal || 0;

    // Controlamos de forma segura si la relación venía en singular o plural o si falló
    const categoriaObjeto = d.productos || d.producto;
    const categoriaInfo = categoriaObjeto?.categorias || categoriaObjeto?.categoria;
    const nombreCat = categoriaInfo?.nombre_categoria || "Sin categoría";

    const existente = ventasPorCategoria.find(c => c.name === nombreCat);
    
    if (existente) {
      existente.value += d.subtotal || 0;
    } else {
      ventasPorCategoria.push({ name: nombreCat, value: d.subtotal || 0 });
    }
  });

  ventasPorCategoria.sort((a, b) => b.value - a.value);

  // 2. Procesar totales generales y métodos de pago
  const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
  const ventasEfectivo = ventas.filter(v => v.metodo_pago && v.metodo_pago.toLowerCase() === "efectivo")
    .reduce((sum, v) => sum + (v.total || 0), 0) || 0;
  const ventasTarjeta = ventas.filter(v => v.metodo_pago && v.metodo_pago.toLowerCase() === "tarjeta")
    .reduce((sum, v) => sum + (v.total || 0), 0) || 0;

  // 3. Distribución horaria forzada en Zona Horaria de Managua
  const horaMap = Array(24).fill(0);

  ventas.forEach(venta => {
    if (!venta.fecha_venta) return;
    let hora = null;

    try {
      const horaString = new Date(venta.fecha_venta).toLocaleTimeString("en-US", {
        timeZone: "America/Managua",
        hour12: false,
        hour: "2-digit"
      });
      hora = parseInt(horaString, 10);
    } catch (e) {
      hora = new Date(venta.fecha_venta).getHours();
    }

    if (hora >= 0 && hora < 24) {
      horaMap[hora] += venta.total || 0;
    }
  }); 

  // 4. Construcción del acumulado para Recharts (Mapeo de 08:00 a 22:00)
  const ventasPorHora = [];
  let acumulado = 0;

  for (let h = 8; h <= 22; h++) {
    acumulado += horaMap[h];
    ventasPorHora.push({
      hora: `${h.toString().padStart(2, "0")}:00`,
      total: Math.round(acumulado)
    });
  }

  return {
    totalVentas,
    ventasEfectivo,
    ventasTarjeta,
    productosVendidos,
    montoProductos,
    cantidadVentas: ventas.length,
    ventasPorHora,
    ventasPorCategoria
  };
};

/**
 * Consulta las ventas y detalles de un rango de fechas y genera un archivo Excel (.xlsx)
 */
export const generarReporteExcel = async (fechaDesde, fechaHasta) => {
  const dInicio = new Date(fechaDesde);
  dInicio.setDate(dInicio.getDate() - 1);
  const inicioSeguro = `${dInicio.toISOString().split('T')[0]} 00:00:00`;

  const dFin = new Date(fechaHasta);
  dFin.setDate(dFin.getDate() + 1);
  const finSeguro = `${dFin.toISOString().split('T')[0]} 23:59:59`;

  const { data: todasLasVentas, error: errorVentas } = await supabase
    .from("ventas")
    .select(`id_venta, fecha_venta, total, metodo_pago, id_empleado, id_cliente`)
    .gte("fecha_venta", inicioSeguro)
    .lte("fecha_venta", finSeguro);

  if (errorVentas) throw errorVentas;

  const ventas = (todasLasVentas || []).filter(venta => {
    const fechaLocal = new Date(venta.fecha_venta).toLocaleDateString("en-CA", {
      timeZone: "America/Managua"
    });
    return fechaLocal >= fechaDesde && fechaLocal <= fechaHasta;
  });

  const idsVentas = ventas.map(v => v.id_venta);
  let detallesVenta = [];

  if (idsVentas.length > 0) {
    const { data: detalles } = await supabase
      .from("detalles_ventas")
      .select("id_detalle, id_venta, cantidad, precio_unitario, subtotal, id_producto")
      .in("id_venta", idsVentas);

    detallesVenta = detalles || [];
  }

  const wb = XLSX.utils.book_new();
  const wsVentas = ventas.length > 0 ? XLSX.utils.json_to_sheet(ventas) : XLSX.utils.json_to_sheet([{ Mensaje: "No hay ventas" }]);
  const wsDetalles = detallesVenta.length > 0 ? XLSX.utils.json_to_sheet(detallesVenta) : XLSX.utils.json_to_sheet([{ Mensaje: "No hay detalles" }]);
  
  XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");
  XLSX.utils.book_append_sheet(wb, wsDetalles, "Detalles_Ventas");
  XLSX.writeFile(wb, `Reporte_Ventas_${fechaDesde}_a_${fechaHasta}.xlsx`);
};