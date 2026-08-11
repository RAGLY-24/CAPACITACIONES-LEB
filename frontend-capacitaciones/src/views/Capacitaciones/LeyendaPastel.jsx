import { PIE_COLORS } from "../../utils/capacitaciones.constants";

export function LeyendaPastel({ datos }) {
    const items = [
        { key: "completados", label: "Completados", val: datos.completados, color: PIE_COLORS.completados },
        { key: "en_progreso", label: "En progreso", val: datos.en_progreso, color: PIE_COLORS.en_progreso },
        { key: "reprobados", label: "Reprobados", val: datos.reprobados, color: PIE_COLORS.reprobados },
        { key: "pendientes", label: "Pendientes", val: datos.pendientes, color: PIE_COLORS.pendientes },
    ];
    return (
        <div className="space-y-1 text-xs w-full max-w-[150px] mx-auto mt-2">
            {items.map(it => (
                <div key={it.key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: it.color }} />
                        <span className="text-gray-600">{it.label}</span>
                    </div>
                    <strong>{it.val}</strong>
                </div>
            ))}
        </div>
    );
}
