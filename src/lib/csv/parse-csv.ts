import type { RawCsvRow } from "./member-import-types";

/**
 * Parsea un string CSV a filas de objetos.
 * Soporta campos con comillas y comas dentro de ellas.
 * Ignora filas completamente vacías.
 */
export function parseCsvString(csvText: string): { headers: string[]; rows: RawCsvRow[] } {
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  if (lines.length === 0) return { headers: [], rows: [] };

  // Primera línea no vacía = cabeceras
  const headerLine = lines.find((l) => l.trim().length > 0) ?? "";
  const headers = parseCsvLine(headerLine).map((h) => h.trim());

  if (headers.length === 0) return { headers: [], rows: [] };

  const rows: RawCsvRow[] = [];
  const dataLines = lines.slice(lines.indexOf(headerLine) + 1);

  for (const line of dataLines) {
    if (line.trim() === "") continue; // ignorar filas vacías

    const values = parseCsvLine(line);
    const row: RawCsvRow = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });

    // Ignorar fila si TODOS los valores están vacíos
    if (Object.values(row).every((v) => v === "")) continue;

    rows.push(row);
  }

  return { headers, rows };
}

/** Parsea una línea CSV respetando campos entre comillas. */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

/** Detecta si un string parece ser CSV válido (tiene al menos una coma). */
export function looksLikeCsv(text: string): boolean {
  const firstLine = text.split("\n")[0] ?? "";
  return firstLine.includes(",");
}
