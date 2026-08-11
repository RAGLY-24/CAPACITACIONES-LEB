import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMe } from "../hooks/auth/useMe";
import { VistaAdmin } from "./Capacitaciones/VistaAdmin";
import { VistaEmpleado } from "./Capacitaciones/VistaEmpleado";

// ─── Componente raíz ─────────────────────────────────────────────────────────
function Capacitaciones() {
  // --- Usuario autenticado  ---
  const { data } = useMe();

  const storedUser = typeof window !== 'undefined' ? data : null;
  const rol = storedUser?.puesto?.nombre || null;
  const permisos = storedUser?.permissions || {};
  const esAdmin = rol === "SistemasAdmin" || permisos.edit_trainings;

  // Deep-link desde una notificación: ?seccion=7&modulo=3 lleva directo a
  // esa sección o abre el visor de ese módulo, aunque el usuario sea admin.
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionInicialId = searchParams.get("seccion") ? Number(searchParams.get("seccion")) : null;
  const moduloInicialId = searchParams.get("modulo") ? Number(searchParams.get("modulo")) : null;
  const tieneDeepLink = !!(seccionInicialId || moduloInicialId);

  const [vista, setVista] = useState(esAdmin && !tieneDeepLink ? "admin" : "empleado");

  // Limpiamos los query params una vez consumidos para que no se re-disparen
  // en futuras navegaciones dentro de la misma sesión de la pestaña.
  useEffect(() => {
    if (tieneDeepLink) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {esAdmin && vista === "admin" ? "Progreso de Capacitaciones" : "Mis Capacitaciones"}
          </h2>
          <p className="text-sm text-gray-500">
            {esAdmin && vista === "admin"
              ? "Avance de todos los empleados por sección y módulo."
              : "Revisa el contenido de cada módulo y rinde tu examen."}
          </p>
        </div>
        {esAdmin && (
          <div className="flex rounded-2xl border border-gray-200 bg-white p-1 shrink-0">
            {[["admin", "Reporte General"], ["empleado", "Vista Empleado"]].map(([k, l]) => (
              <button key={k} onClick={() => setVista(k)}
                className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer  ${vista === k ? "bg-brand-primary/90 text-white" : "text-gray-600 hover:text-gray-800"}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {esAdmin && vista === "admin"
        ? <VistaAdmin />
        : <VistaEmpleado seccionInicialId={seccionInicialId} moduloInicialId={moduloInicialId} />}
    </div>
  );
}

export default Capacitaciones;
