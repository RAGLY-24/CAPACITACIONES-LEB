export function TarjetaSeccionEmpleado({ seccion, modulos, desbloqueada, seccionRequerida, onClick }) {
    const completados = modulos.filter(m => m.estado === "completado").length;
    const pct = modulos.length ? Math.round((completados / modulos.length) * 100) : 0;

    return (
        <div
            onClick={onClick}
            className={`rounded-3xl border border-zinc-200 bg-white p-6 cursor-pointer transition-all group relative ${desbloqueada ? "hover:border-zinc-200 hover:bg-zinc-50" : "opacity-70"}`}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${pct === 100 ? "bg-green-500" : "bg-gray-300"}`} />
                <h3 className="font-bold text-gray-800 truncate  transition-colors">
                    {seccion.nombre}
                </h3>
                {!desbloqueada && <span className="text-base shrink-0">🔒</span>}
            </div>
            {seccion.descripcion && (
                <p className="text-xs text-gray-400 line-clamp-2 mt-1">{seccion.descripcion}</p>
            )}

            {desbloqueada ? (
                <>
                    <p className="text-xs text-gray-500 mt-3 font-medium">{modulos.length} módulo(s)</p>
                    {/* Barra de progreso */}
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 rounded-full bg-gray-200 h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full bg-brand-primary/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{completados}/{modulos.length} completados</span>
                    </div>
                </>
            ) : (
                <p className="text-xs text-amber-600 mt-3 font-medium">🔒 Necesitas completar "{seccionRequerida}" primero.</p>
            )}
        </div>
    );
}
