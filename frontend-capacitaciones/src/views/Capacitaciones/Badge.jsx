import { ESTADOS } from "../../utils/capacitaciones.constants";

export function Badge({ estado }) {
    const { label, cls } = ESTADOS[estado] || ESTADOS.pendiente;
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wide ${cls}`}>{label}</span>;
}
