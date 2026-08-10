import { useMemo } from "react";
import DataTable from "react-data-table-component";
import { useVistaAdmin } from "../../hooks/capacitaciones/useVistaAdmin";
import { GraficaPastel } from "./GraficaPastel";
import { LeyendaPastel } from "./LeyendaPastel";
import { VisorProgresoOperador } from "./VisorProgresoOperador";

// Configuración de estilos para el DataTable
const customStyles = {
    tableWrapper: { style: { borderTop: '1px solid #e5e7eb' } },
    headRow: { style: { backgroundColor: '#f9fafb', borderBottomWidth: '1px', borderBottomColor: '#e5e7eb' } },
    headCells: { style: { color: '#374151', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' } },
    rows: { style: { fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#ffffff' } },
};

export function VistaAdmin() {
    const {
        pieData, cargando, cargar,
        buscarUser, setBuscarUser,
        filtroSec, setFiltroSec,
        filtroEstado, setFiltroEstado,
        operadorSeleccionado, setOperadorSeleccionado,
        dataTableData, seccionesUnicas,
    } = useVistaAdmin();

    // Columnas principales de Operadores
    const columnas = useMemo(() => [
        {
            name: 'Operador',
            selector: row => row.usuario,
            sortable: true,
            cell: row => (
                <div className="py-2">
                    <p className="font-semibold text-gray-900">{row.usuario}</p>
                    <p className="text-xs text-gray-500">@{row.usuario_login}</p>
                </div>
            )
        },
        {
            name: 'Socio',
            selector: row => row.socio || '',
            sortable: true,
            cell: row => row.socio
                ? <span className="text-sm text-gray-700">{row.socio}</span>
                : <span className="text-xs text-gray-400">Sin socio</span>
        },
        {
            name: 'Cursos Asignados (Filtrados)',
            selector: row => row.cursos.length,
            sortable: true,
            center: true,
            cell: row => <span className="font-medium text-gray-700">{row.cursos.length} módulos</span>
        },
        {
            name: 'Completados',
            selector: row => row.cursos.filter(c => c.estado === 'completado').length,
            sortable: true,
            center: true,
            cell: row => {
                const completados = row.cursos.filter(c => c.estado === 'completado').length;
                const total = row.cursos.length;
                const pct = total > 0 ? Math.round((completados / total) * 100) : 0;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{pct}%</span>
                    </div>
                );
            }
        }
    ], []);

    // Componente del buscador que va adentro del DataTable
    const BuscadorDataTable = useMemo(() => (
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-semibold text-gray-600 hidden sm:block">Buscar Operador:</label>
            <input
                type="text"
                placeholder="Nombre o usuario..."
                value={buscarUser}
                onChange={e => setBuscarUser(e.target.value)}
                className="rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none w-full sm:w-64 shadow-sm"
            />
        </div>
    ), [buscarUser, setBuscarUser]);

    if (cargando) return <p className="text-center text-sm text-gray-400 py-12">Cargando reporte...</p>;

    return (
        <div className="space-y-6">
            {/* Gráficas de pastel por sección */}
            {pieData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4 border-b pb-2">Avance Global por Sección</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pieData.map(sec => (
                            <div key={sec.seccion_id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
                                <p className="text-xs font-bold text-gray-700 text-center wrap-break-word w-full line-clamp-2 min-h-8" title={sec.nombre}>
                                    {sec.nombre}
                                </p>
                                <div className="py-2">
                                    <GraficaPastel datos={sec} size={130} />
                                </div>
                                <LeyendaPastel datos={sec} />
                                <p className="text-[10px] text-gray-400 mt-2 border-t pt-2 w-full text-center">
                                    {sec.total} capacitación(es) registrada(s)
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtros para la tabla de operadores */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
                <span className="text-sm font-bold text-gray-700 mr-2">Filtros de cursos:</span>
                <select value={filtroSec} onChange={e => setFiltroSec(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#802907]">
                    <option value="">Todas las secciones</option>
                    {seccionesUnicas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#802907]">
                    <option value="">Todos los estados</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="completado">Completado</option>
                    <option value="reprobado">Reprobado</option>
                </select>
                <button onClick={cargar} className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                    Actualizar Datos
                </button>
                {(filtroSec || filtroEstado) && (
                    <button onClick={() => { setFiltroSec(""); setFiltroEstado(""); }}
                        className="text-xs font-semibold text-[#802907] hover:underline ml-2">
                        Limpiar filtros de cursos
                    </button>
                )}
            </div>

            {/* Tabla de Operadores: al hacer clic en una fila se abre su progreso en tarjetas */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <DataTable
                    columns={columnas}
                    data={dataTableData}
                    onRowClicked={row => setOperadorSeleccionado(row)}
                    pointerOnHover
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 25, 50]}
                    highlightOnHover
                    responsive
                    customStyles={customStyles}
                    subHeader
                    subHeaderComponent={BuscadorDataTable}
                    noDataComponent={<div className="p-8 text-gray-500 text-center">No se encontraron operadores con estos filtros.</div>}
                />
            </div>

            {operadorSeleccionado && (
                <VisorProgresoOperador
                    usuarioId={operadorSeleccionado.user_id}
                    usuarioNombre={operadorSeleccionado.usuario}
                    moduloInicialId={null}
                    onCerrar={() => setOperadorSeleccionado(null)}
                />
            )}
        </div>
    );
}
