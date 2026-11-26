export function prepararCsv(encabezados, filas) {
  function celda(valor) {
    let texto = String(valor ?? '');
    if (typeof valor === 'string' && /^[\s\uFEFF]*[=+@-]/.test(texto)) texto = "'" + texto;
    return '"' + texto.replaceAll('"', '""') + '"';
  }
  return '\uFEFF' + [encabezados, ...filas].map((fila) => fila.map(celda).join(';')).join('\r\n');
}
