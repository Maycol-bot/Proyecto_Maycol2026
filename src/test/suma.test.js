const sum = require('./suma');

test("la funcion suma debe devolver la suma correcta", () => {
    expect(sum(1, 2)).toBe(3);
});