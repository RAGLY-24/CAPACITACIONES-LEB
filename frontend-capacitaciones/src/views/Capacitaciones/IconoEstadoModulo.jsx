export function IconoEstadoModulo({ estado, desbloqueado }) {
    if (!desbloqueado) return <span className="text-gray-300">🔒</span>;
    if (estado === "completado") return <span className="text-green-600">✓</span>;
    if (estado === "reprobado") return <span className="text-red-500">✗</span>;
    if (estado === "en_progreso") return <span className="text-yellow-600">●</span>;
    return <span className="text-gray-300">○</span>;
}
