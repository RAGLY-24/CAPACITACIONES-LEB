import { PIE_COLORS } from "../../utils/capacitaciones.constants";

export function GraficaPastel({ datos, size = 120 }) {
    const { completados = 0, en_progreso = 0, reprobados = 0, pendientes = 0, total = 0 } = datos;
    if (total === 0) {
        return (
            <div className="flex flex-col items-center gap-1">
                <div className="rounded-full bg-gray-100 flex items-center justify-center" style={{ width: size, height: size }}>
                    <span className="text-xs text-gray-400">Sin datos</span>
                </div>
            </div>
        );
    }

    const segmentos = [
        { key: "completados", val: completados, color: PIE_COLORS.completados },
        { key: "en_progreso", val: en_progreso, color: PIE_COLORS.en_progreso },
        { key: "reprobados", val: reprobados, color: PIE_COLORS.reprobados },
        { key: "pendientes", val: pendientes, color: PIE_COLORS.pendientes },
    ].filter(s => s.val > 0);

    const r = size / 2;
    const cx = r;
    const cy = r;
    const radio = r - 4;

    let acum = 0;
    const arcos = segmentos.map(s => {
        const inicio = acum;
        const fin = acum + (s.val / total) * 2 * Math.PI;
        acum = fin;
        const x1 = cx + radio * Math.cos(inicio - Math.PI / 2);
        const y1 = cy + radio * Math.sin(inicio - Math.PI / 2);
        const x2 = cx + radio * Math.cos(fin - Math.PI / 2);
        const y2 = cy + radio * Math.sin(fin - Math.PI / 2);
        const grande = fin - inicio > Math.PI ? 1 : 0;
        return { ...s, d: `M ${cx} ${cy} L ${x1} ${y1} A ${radio} ${radio} 0 ${grande} 1 ${x2} ${y2} Z` };
    });

    if (segmentos.length === 1) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={radio} fill={segmentos[0].color} />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {arcos.map((a, i) => (
                <path key={i} d={a.d} fill={a.color} stroke="white" strokeWidth={1.5} />
            ))}
        </svg>
    );
}
