import React, { use, useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import NotificacionOperacion from "../components/NotificacionesOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import TablaProductos from "../components/productos/TablaProductos";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";

const Producto = () => {

  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_venta: "",
    archivo: null,
  });

  const [productoAEditar, setProductoAEditar] = useState({
    id_producto: "",
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_venta: "",
    archivo: null,
  });

  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, message: "", tipo: "" });


  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({
      ...prev,
      [name]: value
    }));
  };


  const manejoCambioArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setNuevoProducto((prev) => ({
        ...prev, archivo
      }));
    } else {
      alert("Selecciona una imagen válida (JPG, PNG etc.)");
    }
  };

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

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

  // ####################### REGISTRO DE CATEGORÍAS ###########################
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre_categoria: "",
    descripcion_categoria: "",
  });

  // En Producto.jsx, debajo de manejoCambioInput del producto
  const manejoCambioInputCategoria = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarCategoriaDesdeProductos = async () => {
    try {
      // Validaciones...
      const { data, error } = await supabase
        .from("categorias")
        .insert([{
          nombre_categoria: nuevaCategoria.nombre_categoria,
          descripcion_categoria: nuevaCategoria.descripcion_categoria,
        }])
        .select(); // Obtenemos el registro creado

      if (error) throw error;

      const categoriaCreada = data[0];

      // 1. Refrescamos la lista de categorías del selector
      await cargarCategorias();

      // 2. 🪄 MAGIA: Marcamos la nueva categoría en el estado del producto
      setNuevoProducto(prev => ({
        ...prev,
        categoria_producto: categoriaCreada.id_categoria
      }));

      // 3. Limpiamos y cerramos
      setNuevaCategoria({ nombre_categoria: "", descripcion_categoria: "" });
      setMostrarModalCategoria(false);

      setToast({ mostrar: true, mensaje: "Categoría creada y seleccionada", tipo: "exito" });

    } catch (err) {
      console.error(err);
    }
  };

    // ##################CARGA DE PRODUCTOS EN TABLA###########################
 const cargarProductos = async () => {
  setCargando(true);
  try {
    const { data, error } = await supabase
      .from("productos")
      .select(`
        *,
        categorias (
          nombre_categoria
        )
      `)
      .order("id_productos", { ascending: false }); // <--- AGREGAR LA 'S' AQUÍ

    if (error) throw error;
    setProductos(data || []);
    setProductosFiltrados(data || []);
  } catch (err) {
    console.error("Error al cargar productos: ", err);
  } finally {
    setCargando(false);
  }
  
};
  // ###############################################

  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setProductosFiltrados(productos);
    } else {
      const textoLower = textoBusqueda.toLowerCase();
      const filtrados = productos.filter((prod) => {
        const nombre = prod.nombre_producto?.toLowerCase() || "";
        const descripcion = prod.descripcion_producto?.toLowerCase() || "";
        const precio = prod.precio_venta?.toString() || "";

        return (
          nombre.includes(textoLower) ||
          descripcion.includes(textoLower) ||
          precio.includes(textoLower)
        );
      });
      setProductosFiltrados(filtrados);
    }
  }, [textoBusqueda, productos]);

  useEffect(() => {
    cargarProductos();
  }, []);


  /* ****************************************************************************** */
  const agregarProducto = async () => {
    try {
      if (
        !nuevoProducto.nombre_producto.trim() ||
        !nuevoProducto.precio_venta ||
        !nuevoProducto.categoria_producto ||
        !nuevoProducto.archivo
      ) {
        setToast({
          mostrar: true,
          message: "Por favor completa todos los campos son obligatorios.",
          tipo: "advertencia",
        });
        return;
      }

      setMostrarModal(false);

      const nombreArchivo = `${Date.now()}_${nuevoProducto.archivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenes_productos")
        .upload(nombreArchivo, nuevoProducto.archivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("imagenes_productos")
        .getPublicUrl(nombreArchivo);
      const urlPublica = urlData.publicUrl;

     const { error } = await supabase.from("productos").insert([
  {
    nombre_productos: nuevoProducto.nombre_producto, // Cambiado a productos (con s)
    descripcion_producto: nuevoProducto.descripcion_producto || null,
    categoria_producto: nuevoProducto.categoria_producto,
    precio_venta: parseFloat(nuevoProducto.precio_venta),
    url_imagen: urlPublica, // Cambiado de imagen_url a url_imagen
  },
]);

      if (error) throw error;

      await cargarProductos();
      setMostrarModal(false);

      setNuevoProducto({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_venta: "",
        archivo: null,
      });

      setToast({
        mostrar: true,
        message: "Producto agregado exitosamente.",
        tipo: "exito",
      });

    } catch (err) {
      console.error("Error al agregar producto:", err);
      setToast({
        mostrar: true,
        message: "Error al agregar el producto. Intenta nuevamente.",
        tipo: "error",
      });
    }
  };

  // ############################# ELIMINAR PRODUCTO #############################
  const eliminarProducto = async () => {
    if (!productoAEliminar) return;

    try {
      setMostrarModalEliminacion(false);

      // 1. Opcional pero recomendado: Borrar la imagen del Storage
      if (productoAEliminar.url_imagen) {
        // Extraemos el nombre del archivo de la URL pública
        const urlPartes = productoAEliminar.url_imagen.split("/");
        const nombreArchivo = urlPartes[urlPartes.length - 1];

        await supabase.storage
          .from("imagenes_productos")
          .remove([nombreArchivo]);
      }

      // 2. Borrar el registro de la base de datos
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id_productos", productoAEliminar.id_productos);

      if (error) throw error;

      // 3. Notificar y recargar
      await cargarProductos();
      setToast({
        mostrar: true,
        message: `Producto "${productoAEliminar.nombre_producto}" eliminado.`,
        tipo: "exito",
      });

    } catch (err) {
      console.error("Error al eliminar:", err.message);
      setToast({
        mostrar: true,
        message: "Error al eliminar el producto.",
        tipo: "error",
      });
    }
  };

  return (
    <Container className="mt-3">

      <Row className="align-items-center mb-3">
        <Col className="d-flex align-center mb-3">
          <h3 className="mb-0">
            <i className="bi-bag-heart me-2"></i>
            Productos
          </h3>
        </Col>

        <Col xs={3} sm={5} md={5} lg={5} className="text-end">
          <Button onClick={() => setMostrarModal(true)} size="md">
            <span className="d-none d-sm-inline ms-2">Nuevo Producto</span>
          </Button>
        </Col>
      </Row>

      <hr />

      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarBusqueda}
            placeholder="Buscar por nombre, descripción o precio..."
          />
        </Col>
      </Row>

      {/* VISUALIZACIÓN DE TABLA */}
      {cargando ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Cargando productos...</p>
        </div>
      ) : productosFiltrados.length > 0 ? (
        <Row>
          <Col>
            <TablaProductos
              productos={productosFiltrados}
              abrirModalEliminacion={(prod) => {
                setProductoAEliminar(prod);
                setMostrarModalEliminacion(true);
              }}
            />
          </Col>
        </Row>
      ) : (
        <Alert variant="info" className="text-center">
          No se encontraron productos en la base de datos.
        </Alert>
      )}

      { /* Modales */}

      <ModalRegistroProducto
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoProducto={nuevoProducto}
        manejoCambioinput={manejoCambioInput}
        manejoCambioArcvhivo={manejoCambioArchivo}
        agregarProducto={agregarProducto}
        categorias={categorias}
        setMostrarModalCategoria={setMostrarModalCategoria}
      />

      <ModalRegistroCategoria
        mostrarModal={mostrarModalCategoria}
        setMostrarModal={setMostrarModalCategoria}
        nuevaCategoria={nuevaCategoria}
        manejoCambioInput={manejoCambioInputCategoria}
        agregarCategoria={agregarCategoriaDesdeProductos}
      />

      <ModalEliminacionProducto
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarProducto={eliminarProducto}
        producto={productoAEliminar}
      />

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.message}
        tipo={toast.tipo}
        onClose={() => setToast({ ...toast, mostrar: false })}
      />

    </Container>
  );
};

export default Producto;