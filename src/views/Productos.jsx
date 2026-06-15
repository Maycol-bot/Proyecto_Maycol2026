import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner, Pagination } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto.jsx";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto.jsx";
import NotificacionOperacion from "../components/NotificacionesOperacion.jsx";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas.jsx";
import TablaProductos from "../components/productos/TablaProductos.jsx";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria.jsx";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto.jsx";
import ModalQRProducto from "../components/productos/ModalQRProducto.jsx"; 

const Producto = () => {

  // --- 1. ESTADOS DE DATOS PRINCIPALES ---
  const [productos, setProductos] = useState([]);                 // Listado maestro original desde Supabase
  const [productosFiltrados, setProductosFiltrados] = useState([]); // Listado alterado por la barra de búsqueda
  const [categorias, setCategorias] = useState([]);               // Listado de categorías para los selectores

  // --- 2. ESTADOS DE CONTROL DE INTERFAZ (UI) & PAGINACIÓN ---
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mostrar: false, message: "", tipo: "" });
  
  // CONTROL DE PAGINACIÓN LOCAL
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5; // Cambiar a 10 o al tamaño que prefieras homologar

  // --- 3. ESTADOS DE CONTROL DE MODALES ---
  const [mostrarModal, setMostrarModal] = useState(false);                     // Modal Añadir Producto
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false); // Modal Confirmar Eliminación
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);         // Modal Editar Producto
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);     // Modal Añadir Categoría Rápida
  const [mostrarModalQR, setMostrarModalQR] = useState(false);                 // Modal Visor Código QR

  // --- 4. ESTADOS PARA REGISTRO Y EDICIÓN TEMPORAL ---
  const [productoQR, setProductoQR] = useState(null); // Producto seleccionado para renderizar su QR
  
  // Estructura temporal para almacenar un nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_productos: "", 
    descripcion_producto: "",
    id_productos: "",     // ID de categoría seleccionado
    precio_venta: "",
    archivo: null,        // Archivo binario de la imagen
  });

  // Estructura temporal para modificar un producto existente
  const [productoAEditar, setProductoAEditar] = useState({
    id_producto: "",
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_venta: "",
    archivo: null,        // Nueva imagen (opcional)
  });

  const [productoAEliminar, setProductoAEliminar] = useState(null);

  // --- 5. MANEJADORES DE ENTRADA (INPUT HANDLERS) ---

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setProductoAEditar((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setNuevoProducto((prev) => ({ ...prev, archivo }));
    } else {
      alert("Selecciona una imagen válida (JPG, PNG etc.)");
    }
  };

  const manejoCambioArchivoEdicion = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setProductoAEditar((prev) => ({ ...prev, archivo }));
    } else {
      alert("Selecciona una imagen válida");
    }
  };

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
    setPaginaActual(1); // Reestablece a la primera página con cada letra presionada
  };

  // --- 6. PETICIONES DE CONSULTA (READ) ---

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("id_categoria", { ascending: true });
      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select(`
          *,
          categorias ( nombre_categoria )
        `)
        .order("id_productos", { ascending: false });

      if (error) throw error;
      setProductos(data || []);
      setProductosFiltrados(data || []);
    } catch (err) {
      console.error("Error al cargar productos: ", err);
    } finally {
      setCargando(false);
    }
  };

  // --- 7. EFECTOS (USEEFFECT) ---

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  // Filtro dinámico multi-parámetro en el lado del cliente
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setProductosFiltrados(productos);
    } else {
      const textoLower = textoBusqueda.toLowerCase();
      const filtrados = productos.filter((prod) => {
        const nombre = prod.nombre_productos?.toLowerCase() || "";
        const descripcion = prod.descripcion_producto?.toLowerCase() || "";
        const precio = prod.precio_venta?.toString() || "";
        const categoria = prod.categorias?.nombre_categoria?.toLowerCase() || "";

        return (
          nombre.includes(textoLower) ||
          descripcion.includes(textoLower) ||
          precio.includes(textoLower) ||
          categoria.includes(textoLower)
        );
      });
      setProductosFiltrados(filtrados);
    }
  }, [textoBusqueda, productos]);

  // --- 8. LÓGICA DE CÁLCULO DE PAGINACIÓN ---
  const totalPaginas = Math.ceil(productosFiltrados.length / elementosPorPagina);
  const indiceUltimoElemento = paginaActual * elementosPorPagina;
  const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
  
  // Array recortado que verdaderamente se le manda al componente TablaProductos
  const productosPaginaActual = productosFiltrados.slice(indicePrimerElemento, indiceUltimoElemento);

  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // --- 9. LÓGICA DE REGISTRO RÁPIDO DE CATEGORÍAS ---
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre_categoria: "", descripcion_categoria: "" });

  const manejoCambioInputCategoria = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({ ...prev, [name]: value }));
  };

  const agregarCategoriaDesdeProductos = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .insert([{
          nombre_categoria: nuevaCategoria.nombre_categoria,
          descripcion_categoria: nuevaCategoria.descripcion_categoria,
        }])
        .select();

      if (error) throw error;

      const categoryCreada = data[0];
      await cargarCategorias();

      setNuevoProducto(prev => ({ ...prev, id_productos: categoryCreada.id_categoria }));
      setNuevaCategoria({ nombre_categoria: "", descripcion_categoria: "" });
      setMostrarModalCategoria(false);
      setToast({ mostrar: true, message: "Categoría creada y seleccionada", tipo: "exito" });
    } catch (err) {
      console.error(err);
    }
  };

  // --- 10. OPERACIONES CRUD DE PRODUCTOS (INSERT, UPDATE, DELETE) ---

  const agregarProducto = async () => {
    try {
      if (!nuevoProducto.nombre_productos?.trim() || !nuevoProducto.precio_venta || !nuevoProducto.id_productos || !nuevoProducto.archivo) {
        setToast({ mostrar: true, message: "Por favor completa todos los campos son obligatorios.", tipo: "advertencia" });
        return;
      }

      setMostrarModal(false);
      const nombreArchivo = `${Date.now()}_${nuevoProducto.archivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenes_productos")
        .upload(nombreArchivo, nuevoProducto.archivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("imagenes_productos").getPublicUrl(nombreArchivo);
      const urlPublica = urlData.publicUrl;

      const { error } = await supabase.from("productos").insert([
        {
          nombre_productos: nuevoProducto.nombre_productos, 
          descripcion_producto: nuevoProducto.descripcion_producto || null,
          categoria_producto: parseInt(nuevoProducto.id_productos),
          precio_venta: parseFloat(nuevoProducto.precio_venta),
          url_imagen: urlPublica,
        },
      ]);

      if (error) throw error;

      await cargarProductos();
      setNuevoProducto({ nombre_productos: "", descripcion_producto: "", id_productos: "", precio_venta: "", archivo: null });
      setToast({ mostrar: true, message: "Producto agregado exitosamente.", tipo: "exito" });
    } catch (err) {
      console.error("Error al agregar producto:", err);
      setToast({ mostrar: true, message: "Error al agregar el producto. Intenta nuevamente.", tipo: "error" });
    }
  };

  const eliminarProducto = async () => {
    if (!productoAEliminar) return;

    try {
      setMostrarModalEliminacion(false);

      if (productoAEliminar.url_imagen) {
        const urlPartes = productoAEliminar.url_imagen.split("/");
        const nombreArchivo = urlPartes[urlPartes.length - 1];
        await supabase.storage.from("imagenes_productos").remove([nombreArchivo]);
      }

      const { error } = await supabase.from("productos").delete().eq("id_productos", productoAEliminar.id_productos);
      if (error) throw error;

      await cargarProductos();
      setToast({ mostrar: true, message: `Producto "${productoAEliminar.nombre_productos}" eliminado.`, tipo: "exito" });
    } catch (err) {
      console.error("Error al eliminar:", err.message);
      setToast({ mostrar: true, message: "Error al eliminar el producto.", tipo: "error" });
    }
  };

  const actualizarProducto = async () => {
    try {
      if (!productoAEditar.nombre_producto || !productoAEditar.categoria_producto || !productoAEditar.precio_venta) {
        setToast({ mostrar: true, message: "Completa los campos obligatorios", tipo: "advertencia" });
        return;
      }

      let datosActualizados = {
        nombre_productos: productoAEditar.nombre_producto,
        descripcion_producto: productoAEditar.descripcion_producto,
        categoria_producto: productoAEditar.categoria_producto, 
        precio_venta: parseFloat(productoAEditar.precio_venta),
      };

      if (productoAEditar.archivo) {
        const nombreArchivo = `${Date.now()}_${productoAEditar.archivo.name}`;

        const { error: uploadError } = await supabase.storage.from("imagenes_productos").upload(nombreArchivo, productoAEditar.archivo);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("imagenes_productos").getPublicUrl(nombreArchivo);
        datosActualizados.url_imagen = data.publicUrl;

        if (productoAEditar.url_imagen) {
          const nombreViejo = productoAEditar.url_imagen.split("/").pop();
          await supabase.storage.from("imagenes_productos").remove([nombreViejo]);
        }
      }

      const { error } = await supabase.from("productos").update(datosActualizados).eq("id_productos", productoAEditar.id_producto);
      if (error) throw error;

      await cargarProductos();
      setMostrarModalEdicion(false);
      setToast({ mostrar: true, message: "Producto actualizado correctamente", tipo: "exito" });
    } catch (err) {
      console.error(err);
      setToast({ mostrar: true, message: "Error al actualizar", tipo: "error" });
    }
  };

  const abrirModalEdicion = (producto) => {
    setProductoAEditar({
      id_producto: producto.id_productos,
      nombre_producto: producto.nombre_productos,
      descripcion_producto: producto.descripcion_producto,
      categoria_producto: producto.categoria_producto,
      precio_venta: producto.precio_venta,
      url_imagen: producto.url_imagen,
      archivo: null,
    });
    setMostrarModalEdicion(true);
  };

  const generarQRImagen = (producto) => {
    if (!producto?.url_imagen) {
      setToast({ mostrar: true, message: "Este producto no tiene imagen asociada", tipo: "advertencia" });
      return;
    }
    setProductoQR(producto);
    setMostrarModalQR(true);
  };

  // --- 11. DESPLIEGUE DE INTERFAZ GRÁFICA (JSX) ---
  return (
    <Container className="mt-3">

      {/* ENCABEZADO PRINCIPAL */}
      <Row className="align-items-center mb-3">
        <Col className="d-flex align-center mb-3">
          <h3 className="mb-0">
            <i className="bi-bag-heart me-2"></i> Productos
          </h3>
        </Col>
        <Col xs={3} sm={5} md={5} lg={5} className="text-end">
          <Button onClick={() => setMostrarModal(true)} size="md">
            <span className="d-none d-sm-inline ms-2">Nuevo Producto</span>
          </Button>
        </Col>
      </Row>
      <hr />

      {/* SECCIÓN DE FILTRADO */}
      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarBusqueda}
            placeholder="Buscar por nombre, descripción o precio..."
          />
        </Col>
      </Row>

      {/* ÁREA DE CONTENIDO: TABLA O INDICADORES DE CARGA */}
      {cargando ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Cargando productos...</p>
        </div>
      ) : productosFiltrados.length > 0 ? (
        <>
          <Row>
            <Col>
              {/* 🧩 Pasamos únicamente 'productosPaginaActual' en lugar de la lista completa */}
              <TablaProductos
                productos={productosPaginaActual}
                abrirModalEdicion={abrirModalEdicion}
                abrirModalEliminacion={(prod) => {
                  setProductoAEliminar(prod);
                  setMostrarModalEliminacion(true);
                }}
                generarQRImagen={generarQRImagen}
              />
            </Col>
          </Row>

          {/* CONTROLES DE PAGINACIÓN DE BOOTSTRAP */}
          {totalPaginas > 1 && (
            <Row className="mt-3">
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
      ) : (
        <Alert variant="info" className="text-center">
          No se encontraron productos en la base de datos o que coincidan con la búsqueda.
        </Alert>
      )}

      {/* MODAL: Registro de Productos */}
      <ModalRegistroProducto
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoProducto={nuevoProducto}
        manejoCambioInput={manejoCambioInput}
        manejoCambioArchivo={manejoCambioArchivo}
        agregarProducto={agregarProducto}
        categorias={categorias}
        setMostrarModalCategoria={setMostrarModalCategoria}
      />

      {/* MODAL: Registro Express de Categorías */}
      <ModalRegistroCategoria
        mostrarModal={mostrarModalCategoria}
        setMostrarModal={setMostrarModalCategoria}
        nuevaCategoria={nuevaCategoria}
        manejoCambioInput={manejoCambioInputCategoria}
        agregarCategoria={agregarCategoriaDesdeProductos}
      />

      {/* MODAL: Confirmación de Eliminación */}
      <ModalEliminacionProducto
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarProducto={eliminarProducto}
        producto={productoAEliminar}
      />

      {/* MODAL: Edición de Productos */}
      <ModalEdicionProducto
        mostrarModal={mostrarModalEdicion}
        setMostrarModal={setMostrarModalEdicion}
        productoAEditar={productoAEditar}
        manejoCambioInput={manejoCambioInputEdicion}
        manejoCambioArchivo={manejoCambioArchivoEdicion}
        actualizarProducto={actualizarProducto}
        categorias={categorias}
      />

      {/* MODAL: Visor QR */}
      <ModalQRProducto
        mostrar={mostrarModalQR}
        onHide={() => setMostrarModalQR(false)}
        producto={productoQR}
      />

      {/* NOTIFICACIONES TOAST */}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.message}
        tipo={toast.tipo}
        onClose={() => setToast({ ...toast, mostrar: false })}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />

    </Container>
  );
};

export default Producto;