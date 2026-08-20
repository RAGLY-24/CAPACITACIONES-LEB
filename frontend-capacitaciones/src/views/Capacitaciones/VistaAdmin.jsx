import { useMemo } from "react";
import DataTable from "react-data-table-component";
import { useVistaAdmin } from "../../hooks/capacitaciones/useVistaAdmin";
import { GraficaPastel } from "./GraficaPastel";
import { LeyendaPastel } from "./LeyendaPastel";
import { VisorProgresoOperador } from "./VisorProgresoOperador";
import Button from "../../components/Buttons/Button";
import Select from "../../components/Fields/Select";
import Input from "../../components/Fields/Input";

const customStyles = {
    tableWrapper: {
        style: {
            borderTop: "1px solid #e5e7eb",
        },
    },
    headRow: {
        style: {
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
        },
    },
    headCells: {
        style: {
            color: "#374151",
            fontSize: "0.75rem",
            fontWeight: "600",
            textTransform: "uppercase",
            paddingLeft: "16px",
            paddingRight: "16px",
        },
    },
    cells: {
        style: {
            paddingLeft: "16px",
            paddingRight: "16px",
            backgroundColor: "transparent",
        },
    },
    rows: {
        highlightOnHoverStyle: {
            backgroundColor: "#f9f9f9",
            color: "#1f2937",
            cursor: "pointer",
        },
    },
    pagination: {
        style: {
            borderTop: "1px solid #e5e7eb",
        },
    },
};

export function VistaAdmin() {
    const {
        pieData,
        cargando,
        cargar,
        buscarUser,
        setBuscarUser,
        filtroSec,
        setFiltroSec,
        filtroEstado,
        setFiltroEstado,
        operadorSeleccionado,
        setOperadorSeleccionado,
        dataTableData,
        seccionesUnicas,
    } = useVistaAdmin();

    const columnas = useMemo(() => [
        {
            name: "Operador",
            selector: row => row.usuario || "",
            sortable: true,
            cell: row => (
                <div
                    data-tag="allowRowEvents"
                    className="w-full h-full py-2 flex flex-col justify-center"
                >
                    <p
                        data-tag="allowRowEvents"
                        className="font-semibold text-gray-900"
                    >
                        {row.usuario}
                    </p>
                    <p
                        data-tag="allowRowEvents"
                        className="text-xs text-gray-500"
                    >
                        @{row.usuario_login}
                    </p>
                </div>
            ),
        },
        {
            name: "Socio",
            selector: row => row.socio || "",
            sortable: true,
            cell: row => (
                <div
                    data-tag="allowRowEvents"
                    className="w-full h-full flex items-center"
                >
                    {row.socio ? (
                        <span
                            data-tag="allowRowEvents"
                            className="text-sm text-gray-700"
                        >
                            {row.socio}
                        </span>
                    ) : (
                        <span
                            data-tag="allowRowEvents"
                            className="text-xs text-gray-400"
                        >
                            Sin socio
                        </span>
                    )}
                </div>
            ),
        },
        {
            name: "Cursos Asignados (Filtrados)",
            selector: row => row.cursos?.length || 0,
            sortable: true,
            center: true,
            cell: row => (
                <div
                    data-tag="allowRowEvents"
                    className="w-full h-full flex items-center justify-center"
                >
                    <span
                        data-tag="allowRowEvents"
                        className="font-medium text-gray-700"
                    >
                        {row.cursos?.length || 0} módulos
                    </span>
                </div>
            ),
        },
        {
            name: "Completados",
            selector: row =>
                row.cursos?.filter(
                    c => c.estado === "completado"
                ).length || 0,
            sortable: true,
            center: true,
            cell: row => {
                const cursos = row.cursos || [];
                const completados = cursos.filter(
                    c => c.estado === "completado"
                ).length;
                const total = cursos.length;
                const pct =
                    total > 0
                        ? Math.round((completados / total) * 100)
                        : 0;

                return (
                    <div
                        data-tag="allowRowEvents"
                        className="w-full h-full flex items-center justify-center"
                    >
                        <div
                            data-tag="allowRowEvents"
                            className="flex items-center gap-2"
                        >
                            <div
                                data-tag="allowRowEvents"
                                className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                            >
                                <div
                                    data-tag="allowRowEvents"
                                    className="h-full bg-green-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>

                            <span
                                data-tag="allowRowEvents"
                                className="text-xs font-bold text-gray-600 min-w-[32px]"
                            >
                                {pct}%
                            </span>
                        </div>
                    </div>
                );
            },
        },
    ], []);

    const limpiarFiltros = () => {
        setFiltroSec("");
        setFiltroEstado("");
        setBuscarUser("");
    };

    if (cargando) {
        return (
            <p className="text-center text-sm text-gray-400 py-12">
                Cargando reporte...
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {pieData.length > 0 && (
                <div className="bg-white rounded-3xl border border-zinc-200 p-6">
                    <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-zinc-200 pb-2">
                        Avance Global por Sección
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pieData.map(sec => (
                            <div
                                key={sec.seccion_id}
                                className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 flex flex-col items-center gap-2 transition-shadow hover:shadow-md"
                            >
                                <p
                                    className="text-xs font-bold text-gray-700 text-center wrap-break-word w-full line-clamp-2 min-h-8"
                                    title={sec.nombre}
                                >
                                    {sec.nombre}
                                </p>

                                <div className="py-2">
                                    <GraficaPastel
                                        datos={sec}
                                        size={130}
                                    />
                                </div>

                                <LeyendaPastel datos={sec} />

                                <p className="text-[10px] text-gray-400 mt-2 border-t border-zinc-200 pt-2 w-full text-center">
                                    {sec.total} capacitación(es) registrada(s)
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-3xl bg-white border border-zinc-200 overflow-hidden">
                <div className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    Filtros de cursos
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    Filtra los operadores por sección y estado de curso.
                                </p>
                            </div>

                            {(filtroSec || filtroEstado || buscarUser) && (
                                <Button
                                    type="button"
                                    variant="link"
                                    size="xs"
                                    onClick={limpiarFiltros}
                                >
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <Select
                                name="seccion"
                                label="Sección"
                                value={filtroSec}
                                onChange={e => setFiltroSec(e.target.value)}
                                placeholder="Todas las secciones"
                                options={seccionesUnicas.map(s => ({
                                    value: s.id,
                                    label: s.nombre,
                                }))}
                                variant="primary"
                                containerClassName="flex-1 min-w-[200px]"
                            />

                            <Select
                                name="estado"
                                label="Estado del curso"
                                value={filtroEstado}
                                onChange={e => setFiltroEstado(e.target.value)}
                                placeholder="Todos los estados"
                                options={[
                                    {
                                        value: "en_progreso",
                                        label: "En Progreso",
                                    },
                                    {
                                        value: "completado",
                                        label: "Completado",
                                    },
                                    {
                                        value: "reprobado",
                                        label: "Reprobado",
                                    },
                                ]}
                                variant="primary"
                                containerClassName="flex-1 min-w-[200px]"
                            />

                            <Button
                                type="button"
                                variant="primary"
                                size="md"
                                onClick={cargar}
                                className="shrink-0"
                            >
                                Actualizar datos
                            </Button>
                        </div>

                        <Input
                            type="text"
                            autoComplete="off"
                            label="Buscar"
                            placeholder="Nombre o usuario..."
                            value={buscarUser}
                            onChange={e => setBuscarUser(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full px-6 pb-6">
                    <DataTable
                        columns={columnas}
                        data={dataTableData}
                        onRowClicked={row => setOperadorSeleccionado(row)}
                        pointerOnHover
                        highlightOnHover
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 25, 50]}
                        responsive
                        customStyles={customStyles}
                        noDataComponent={
                            <div className="w-full p-8 text-center text-gray-500">
                                No se encontraron operadores con estos filtros.
                            </div>
                        }
                    />
                </div>
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