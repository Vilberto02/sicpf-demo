/**
 * Convierte un importe numérico a su representación en letras según el estándar peruano.
 * Ejemplo: 18.00 -> "SON: DIECIOCHO CON 00/100 SOLES"
 */
export function numeroALetras(amount: number, moneda: string = "SOLES"): string {
  if (isNaN(amount) || amount < 0) {
    return `SON: CERO CON 00/100 ${moneda}`;
  }

  const rounded = Math.round(amount * 100) / 100;
  const entero = Math.floor(rounded);
  const centavos = Math.round((rounded - entero) * 100);
  const centavosStr = centavos.toString().padStart(2, "0");

  const letrasEntero = convertirEntero(entero);
  return `SON: ${letrasEntero} CON ${centavosStr}/100 ${moneda}`.toUpperCase();
}

function convertirEntero(n: number): string {
  if (n === 0) return "CERO";
  if (n === 1) return "UN";

  const UNIDADES = [
    "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
    "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
    "VEINTE", "VEINTIÚN", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"
  ];

  const DECENAS = [
    "", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
  ];

  const CENTENAS = [
    "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"
  ];

  function leerCentenas(num: number): string {
    if (num === 0) return "";
    if (num === 100) return "CIEN";
    const c = Math.floor(num / 100);
    const d = num % 100;
    let res = CENTENAS[c];
    if (d > 0) {
      if (res) res += " ";
      if (d < 30) {
        res += UNIDADES[d];
      } else {
        const dec = Math.floor(d / 10);
        const uni = d % 10;
        res += DECENAS[dec];
        if (uni > 0) res += " Y " + UNIDADES[uni];
      }
    }
    return res;
  }

  if (n < 1000) {
    return leerCentenas(n);
  }

  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const prefijo = miles === 1 ? "MIL" : `${leerCentenas(miles)} MIL`;
    return resto > 0 ? `${prefijo} ${leerCentenas(resto)}` : prefijo;
  }

  const millones = Math.floor(n / 1000000);
  const restoMillones = n % 1000000;
  const prefijoMillones = millones === 1 ? "UN MILLÓN" : `${leerCentenas(millones)} MILLONES`;
  if (restoMillones > 0) {
    return `${prefijoMillones} ${convertirEntero(restoMillones)}`;
  }
  return prefijoMillones;
}
