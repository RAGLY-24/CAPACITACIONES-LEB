import { Check, Circle, LockKeyhole, X } from "lucide-react";

export function IconoEstadoModulo({ estado, desbloqueado }) {
    if (!desbloqueado) return (
        <span className="bg-sky-500 h-5 w-5 rounded-md flex items-center justify-center">
            <LockKeyhole size={10} strokeWidth={3} className="text-white" />
        </span>
    );
    if (estado === "completado") return (
        <span className="bg-green-500 h-5 w-5 rounded-md flex items-center justify-center">
            <Check size={10} strokeWidth={3} className="text-white" />
        </span>
    );
    if (estado === "reprobado") return (
        <span className="bg-red-500 h-5 w-5 rounded-md flex items-center justify-center">
            <X size={10} strokeWidth={3} className="text-white" />
        </span>
    );
    if (estado === "en_progreso") return (<span className="h-5 w-5 rounded-md flex items-center justify-center">
        <Circle size={10} strokeWidth={3} className="text-yellow-500 fill-yellow-500" />
    </span>);

    return (<span className="h-5 w-5 rounded-md flex items-center justify-center">
        <Circle size={10} strokeWidth={3} className="text-zinc-500 fill-zinc-500" />
    </span>);
}
