const registrarProducto = require('../registrarProducto');
describe("validacion de producto", () => {
    const Producto = {
        nombre_Producto: "",
        id_categoria: 1,
        precio_venta: "",
        stock: ""
    };
    const resultado = registrarProducto(Producto);
    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toContain("Todos los campos son obligatorios");
});

console.log("Prueba2: el precion del producto debe ser un numero positivo");
it ("debe rechazar un precio de venta negativo", () => {
    const Producto = {
        nombre_Producto: "martillo",
        id_categoria: 1,
        precio_venta: -10,
        stock: 5
    };
    
    const resultado = registrarProducto(Producto);
    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toContain("El precio de venta debe ser un número positivo");
});