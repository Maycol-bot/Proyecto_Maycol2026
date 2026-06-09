function registrarProducto(Producto) {
    const{id_categoria, nombre_Producto, descripcion, precio_venta, stock} = Producto;

    if (!nombre_Producto || !descripcion || !precio_venta === "" || !stock === "") {
        return {valido: false, mensaje: "Todos los campos son obligatorios"};
    }

    const regexNombre = /^[a-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!regexNombre.test(nombre_Producto)) {
        return {valido: false, mensaje: "El nombre del producto solo puede contener letras y espacios"};
    }

    if (isNaN(precio_venta) || Number(precio_venta) < 0) {
        return {valido: false, mensaje: "El precio de venta debe ser un número positivo"};
    }

    if (isNaN(stock) || Number(stock) < 0) {
        return {valido: false, mensaje: "El stock debe ser un número positivo"};
    }

    return {valido: true, mensaje: "Producto registrado correctamente"};

    if (descripcion && descripcion.length > 255) {
        return {valido: false, mensaje: "La descripción no puede exceder los 255 caracteres"};
    }
}