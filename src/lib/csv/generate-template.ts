export const TEMPLATE_HEADERS =
  "fullName,email,phone,joinDate,mainGoal,level,assignedCoachName,lastAttendanceAt,attendanceCount,nextClassAt,limitations,acquisitionSource,notes";

export const TEMPLATE_EXAMPLE_ROWS = [
  "Marta García,marta@email.com,600111222,2026-05-08,Perder peso,beginner,Nerea Vidal,2026-05-09,1,,Sin limitaciones,Instagram Ads,No volvió tras primera clase",
  "David López,david@email.com,600333444,2026-05-12,Ganar fuerza,intermediate,,2026-05-13,2,2026-05-17,Molestia leve hombro,Referido,Solicita trabajo de fuerza",
  "Ana Ruiz,ana@email.com,600555666,2026-04-25,Volver al deporte,beginner,Sergio Marín,2026-05-10,3,2026-05-18,Vuelve de lesión de rodilla,Fisioterapeuta,Necesita escalados",
];

/** Genera el CSV de la plantilla como string. */
export function generateTemplateCsv(): string {
  return [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS].join("\n");
}
