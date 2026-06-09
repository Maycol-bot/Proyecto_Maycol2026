import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import NotificacionOperacion from "../components/NotificacionesOperacion";
import CuadroBusquedas from "../components/busquedas/cuadroBusquedas.jsx";
import TablaProductos from "../components/productos/TablaProductos";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import ModalQRProducto from "../components/productos/ModalQRProducto.jsx"; 

const Producto = () => {

  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  
  // Estados para el código QR
  const [mostrarModalQR, setMostrarModalQR] = useState(false);
  const [productoQR, setProductoQR] = useState(null);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_productos: "", // Sincronizado con el Modal
    descripcion_producto: "",
    id_productos: "",     // Sincronizado con el Modal
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

  const [productoAEliminar, setProductoAEliminar] = useState(null);
  
  const [toast, setToast] = useState({ mostrar: false, message: "", tipo: "" });

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setProductoAEditar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejoCambioArchivoEdicion = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setProductoAEditar((prev) => ({
        ...prev,
        archivo,
      }));
    } else {
      alert("Selecciona una imagen válida");
    }
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

  const manejoCambioInputCategoria = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      setNuevoProducto(prev => ({
        ...prev,
        id_productos: categoryCreada.id_categoria // Sincronizado al id del modal
      }));

      setNuevaCategoria({ nombre_categoria: "", descripcion_categoria: "" });
      setMostrarModalCategoria(false);

      setToast({ mostrar: true, message: "Categoría creada y seleccionada", tipo: "exito" });

    } catch (err) {
      console.error(err);
    }
  };

  // ################## CARGA DE PRODUCTOS EN TABLA ###########################
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

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  /* ****************************************************************************** */
  const agregarProducto = async () => {
    try {
      if (
        !nuevoProducto.nombre_productos || !nuevoProducto.nombre_productos.trim() ||
        !nuevoProducto.precio_venta ||
        !nuevoProducto.id_productos || 
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

      // ✅ CORREGIDO: Mapeamos la columna obligatoria 'categoria_producto' que pide Supabase
      const { error } = await supabase.from("productos").insert([
        {
          nombre_productos: nuevoProducto.nombre_productos, 
          descripcion_producto: nuevoProducto.descripcion_producto || null,
          categoria_producto: parseInt(nuevoProducto.id_productos), // 👈 CORREGIDO AQUÍ
          precio_venta: parseFloat(nuevoProducto.precio_venta),
          url_imagen: urlPublica,
        },
      ]);

      if (error) throw error;

      await cargarProductos();

      setNuevoProducto({
        nombre_productos: "", 
        descripcion_producto: "",
        id_productos: "",     
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

      if (productoAEliminar.url_imagen) {
        const urlPartes = productoAEliminar.url_imagen.split("/");
        const nombreArchivo = urlPartes[urlPartes.length - 1];

        await supabase.storage
          .from("imagenes_productos")
          .remove([nombreArchivo]);
      }

      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id_productos", productoAEliminar.id_productos);

      if (error) throw error;

      await cargarProductos();
      setToast({
        mostrar: true,
        message: `Producto "${productoAEliminar.nombre_productos}" eliminado.`,
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

  // ############################# ACTUALIZAR PRODUCTO #############################
  const actualizarProducto = async () => {
    try {
      if (
        !productoAEditar.nombre_producto ||
        !productoAEditar.categoria_producto ||
        !productoAEditar.precio_venta
      ) {
        setToast({
          mostrar: true,
          message: "Completa los campos obligatorios",
          tipo: "advertencia",
        });
        return;
      }

      let datosActualizados = {
        nombre_productos: productoAEditar.nombre_producto,
        descripcion_producto: productoAEditar.descripcion_producto,
        categoria_producto: productoAEditar.categoria_producto, // Si la edición también requiere esta columna
        precio_venta: parseFloat(productoAEditar.precio_venta),
      };

      if (productoAEditar.archivo) {
        const nombreArchivo = `${Date.now()}_${productoAEditar.archivo.name}`;

        const { error: uploadError } = await supabase.storage
          .from("imagenes_productos")
          .upload(nombreArchivo, productoAEditar.archivo);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("imagenes_productos")
          .getPublicUrl(nombreArchivo);

        datosActualizados.url_imagen = data.publicUrl;

        if (productoAEditar.url_imagen) {
          const nombreViejo = productoAEditar.url_imagen.split("/").pop();
          await supabase.storage
            .from("imagenes_productos")
            .remove([nombreViejo]);
        }
      }

      const { error } = await supabase
        .from("productos")
        .update(datosActualizados)
        .eq("id_productos", productoAEditar.id_producto);

      if (error) throw error;

      await cargarProductos();
      setMostrarModalEdicion(false);

      setToast({
        mostrar: true,
        message: "Producto actualizado correctamente",
        tipo: "exito",
      });

    } catch (err) {
      console.error(err);
      setToast({
        mostrar: true,
        message: "Error al actualizar",
        tipo: "error",
      });
    }
  };

  const generarQRImagen = (producto) => {
    if (!producto?.url_imagen) {
      setToast({
        mostrar: true,
        message: "Este producto no tiene imagen asociada",
        tipo: "advertencia", 
      });
      return;
    }

    setProductoQR(producto);
    setMostrarModalQR(true);
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
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={(prod) => {
                setProductoAEliminar(prod);
                setMostrarModalEliminacion(true);
              }}
              generarQRImagen={generarQRImagen}
            />
          </Col>
        </Row>
      ) : (
        <Alert variant="info" className="text-center">
          No se encontraron productos en la base de datos.
        </Alert>
      )}

      { /* Modales de Operación */}

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

      <ModalEdicionProducto
        mostrarModal={mostrarModalEdicion}
        setMostrarModal={setMostrarModalEdicion}
        productoAEditar={productoAEditar}
        manejoCambioInput={manejoCambioInputEdicion}
        manejoCambioArchivo={manejoCambioArchivoEdicion}
        actualizarProducto={actualizarProducto}
        categorias={categorias}
      />

      <ModalQRProducto
        mostrar={mostrarModalQR}
        onHide={() => setMostrarModalQR(false)}
        producto={productoQR}
      />

      {/* ✅ CORREGIDO: Enviamos tanto onClose como onCerrar para evitar fallos de interfaz */}
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