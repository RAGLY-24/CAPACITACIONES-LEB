import { useState } from "react";
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

  const [vista, setVista] = useState(esAdmin ? "admin" : "empleado");

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
          <div className="flex rounded-lg border border-gray-200 bg-white p-1 shrink-0 shadow-sm">
            {[["admin", "Reporte General"], ["empleado", "Vista Empleado"]].map(([k, l]) => (
              <button key={k} onClick={() => setVista(k)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${vista === k ? "bg-brand-primary text-white" : "text-gray-600 hover:text-gray-800"}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {esAdmin && vista === "admin" ? <VistaAdmin /> : <VistaEmpleado />}
    </div>
  );
}

export default Capacitaciones;
