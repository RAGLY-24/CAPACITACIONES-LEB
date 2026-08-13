import { Check, Circle, LockKeyhole, X } from "lucide-react";

export function IconoEstadoModulo({ estado, percent = 0, desbloqueado }) {
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
        <span
            className="relative flex h-5 w-5 items-center justify-center rounded-full"
            style={{
                background: `conic-gradient(#eab308 ${percent * 360}deg, #e5e7eb 0deg)`,
            }}
        >
            <span className="h-3.5 w-3.5 rounded-full bg-white" />
        </span>
    </span>);

    return (<span className="h-5 w-5 rounded-md flex items-center justify-center">
        <Circle size={10} strokeWidth={3} className="text-zinc-500 fill-zinc-500" />
    </span>);
}
