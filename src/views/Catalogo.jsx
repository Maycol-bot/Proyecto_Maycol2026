import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Spinner, Alert, Form } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import TarjetaCatalogo from "../components/catalogo/TarjetaCatalogo";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas.jsx";
import Paginacion from "../components/ordenamiento/Paginacion.jsx";

const Catalogo = () => {
  // --- 1. ESTADOS DE DATOS PRINCIPALES ---
  const [productos, setProductos] = useState([]);   // Listado maestro original de productos
  const [categorias, setCategorias] = useState([]); // Listado para mapear nombres en los selectores e ítems

  // --- 2. ESTADOS DE CONTROL DE INTERFAZ (UI), FILTROS & PAGINACIÓN ---
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // CONTROL DE PAGINACIÓN LOCAL
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(8); // Al ser Grid de tarjetas, 8 o 12 queda genial visualmente

  // --- 3. PETICIONES CONCURRENTES DE CONSULTA (READ) ---
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Ejecución en paralelo para optimizar los tiempos de respuesta iniciales
      const [resProductos, resCategorias] = await Promise.all([
        supabase.from("productos").select("*").order("nombre_productos"),
        supabase.from("categorias").select("id_categoria, nombre_categoria").order("nombre_categoria")
      ]);

      if (resProductos.error) throw resProductos.error;
      if (resCategorias.error) throw resCategorias.error;

      setProductos(resProductos.data || []);
      setCategorias(resCategorias.data || []);
    } catch (err) {
      console.error("Error al cargar catálogo:", err);
      setError("No se pudieron cargar los productos. Intenta más tarde.");
    } finally {
      setCargando(false);
    }
  };

  // --- 4. EFECTOS (USEEFFECT) ---
  useEffect(() => {
    cargarDatos();
  }, []);

  // --- 5. LÓGICA OPTIMIZADA DE FILTRADO COMBINADO (MEMOIZATION) ---
  const productosFiltrados = useMemo(() => {
    let filtrados = productos;

    // Primer Criterio: Clasificación por Categorías de la base de datos
    if (categoriaSeleccionada !== "todas") {
      filtrados = filtrados.filter(prod => 
        prod.categoria_producto === parseInt(categoriaSeleccionada)
      );
    }

    // Segundo Criterio: Coincidencia textual multi-campo (Nombre, Descripción o Precio)
    if (textoBusqueda.trim()) {
      const textoLower = textoBusqueda.toLowerCase().trim();
      filtrados = filtrados.filter(prod => {
        const nombre = prod.nombre_productos?.toLowerCase() || "";
        const descripcion = prod.descripcion_producto?.toLowerCase() || "";
        const precioTexto = prod.precio_venta?.toString() || "";
        
        return nombre.includes(textoLower) || 
               descripcion.includes(textoLower) || 
               precioTexto.includes(textoLower);
      });
    }
    return filtrados;
  }, [productos, categoriaSeleccionada, textoBusqueda]);

  // --- 6. LÓGICA DE SEGMENTACIÓN POR PÁGINA ---
  const productosPaginados = useMemo(() => {
    const indicePrimerElemento = (paginaActual - 1) * registrosPorPagina;
    const indiceUltimoElemento = paginaActual * registrosPorPagina;
    return productosFiltrados.slice(indicePrimerElemento, indiceUltimoElemento);
  }, [productosFiltrados, paginaActual, registrosPorPagina]);

  // --- 7. MANEJADORES DE EVENTOS (EVENT HANDLERS) ---
  const manejarCambioCategoria = (e) => {
    setCategoriaSeleccionada(e.target.value);
    setPaginaActual(1); // Resetea a la primera página tras cambiar de categoría
  };

  const manejarCambioBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
    setPaginaActual(1); // Resetea a la primera página tras escribir un filtro
  };
  
  // Resuelve la relación de llaves foráneas en memoria local del cliente
  const obtenerNombreCategoria = (idCategoria) => {
    const cat = categorias.find(c => c.id_categoria === idCategoria);
    return cat ? cat.nombre_categoria : "Sin categoría";
  };

  // --- 8. DESPLIEGUE DE INTERFAZ GRÁFICA (JSX) ---
  return (
    <div className="mt-3 px-1">
      {/* SECCIÓN CABECERA */}
      <Row className="text-center mb-4">
        <Col>
          <p className="lead text-muted">Nuestros productos</p>
        </Col>
      </Row>

      {/* SECCIÓN FILTROS: Controladores superiores en línea */}
      <Row className="mb-4 align-items-end">
        {/* Selector de Clasificación (Categorías) */}
        <Col md={4} className="mb-2">
          <Form.Group controlId="filtroCategoria">
            <Form.Select 
              value={categoriaSeleccionada} 
              onChange={manejarCambioCategoria}
              className="shadow-sm"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre_categoria}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        {/* Barra Dinámica de Búsqueda */}
        <Col md={6} className="mb-2">
          <Form.Group controlId="busquedaProducto">
            <CuadroBusquedas 
              textoBusqueda={textoBusqueda} 
              manejarCambioBusqueda={manejarCambioBusqueda} 
              placeholder="Buscar por nombre, descripción o precio..."
            />
          </Form.Group>
        </Col>
      </Row>

      {/* SECCIÓN ALERTAS DE EXCEPCIÓN / FALLOS DE CONEXIÓN */}
      {error && (
        <Alert variant="danger" className="text-center mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i> {error}
        </Alert>
      )}

      {/* CONTENIDO PRINCIPAL: Estados de Carga y Mapeo adaptivo en Grid */}
      {cargando ? (
        <Row className="text-center my-5">
          <Col>
            <Spinner animation="border" variant="success" />
            <p className="mt-3 text-muted">Cargando productos...</p>
          </Col>
        </Row>
      ) : productosFiltrados.length === 0 ? (
        <Alert variant="info" className="text-center">
          <i className="bi bi-info-circle me-2"></i>
          No se encontraron productos que coincidan con tu búsqueda.
        </Alert>
      ) : (
        <>
          {/* Renderizado responsivo de tarjetas de catálogo segmentadas */}
          <Row className="g-3">
            {productosPaginados.map(producto => (
              <Col xs={12} sm={6} md={4} lg={3} key={producto.id_producto}>
                <TarjetaCatalogo 
                  producto={producto} 
                  categoriaNombre={obtenerNombreCategoria(producto.categoria_producto)}
                />
              </Col>
            ))}
          </Row>

          {/* COMPONENTE VISUAL: Paginador Inferior Reutilizable */}
          <div className="mt-4">
            <Paginacion
              registroPorPagina={registrosPorPagina}
              totalRegistros={productosFiltrados.length}
              paginaActual={paginaActual}
              establecerPaginaActual={setPaginaActual}
              establecerRegistroPorPagina={setRegistrosPorPagina}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Catalogo;