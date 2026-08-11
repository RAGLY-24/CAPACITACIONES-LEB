import { ESTADOS } from "../../utils/capacitaciones.constants";

export function Badge({ estado }) {
    const { label, cls } = ESTADOS[estado] || ESTADOS.pendiente;
    return <span className={`inline-block rounded-full px-3 py-1 text-[10px] uppercase font-bold tracking-wide ${cls}`}>{label}</span>;
}
