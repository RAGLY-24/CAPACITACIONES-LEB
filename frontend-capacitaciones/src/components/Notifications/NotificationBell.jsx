import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotificaciones } from "../../hooks/notificaciones/useNotificaciones";
import { PrettyDate } from "../../views/utils/date";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    const { Get, GetUnreadCount, MarkRead, MarkAllRead } = useNotificaciones();
    const { data: notificaciones = [], isLoading } = Get({ enabled: isOpen });
    const { data: unreadData } = GetUnreadCount();
    const unreadCount = unreadData?.count || 0;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleItemClick = (notificacion) => {
        if (!notificacion.read_at) {
            MarkRead.mutate(notificacion.id);
        }
        setIsOpen(false);

        const params = new URLSearchParams();
        if (notificacion.seccion_id) params.set("seccion", notificacion.seccion_id);
        if (notificacion.modulo_id) params.set("modulo", notificacion.modulo_id);

        navigate(params.size > 0 ? `/capacitaciones?${params.toString()}` : "/capacitaciones");
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="relative hover:opacity-70 cursor-pointer p-2"
                aria-label="Notificaciones"
            >
                <Bell size={20} strokeWidth={2} className="text-slate-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl z-50">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-900">Notificaciones</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => MarkAllRead.mutate()}
                                className="text-xs font-medium text-brand-primary hover:underline cursor-pointer"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <p className="px-4 py-6 text-center text-sm text-gray-400">Cargando...</p>
                        ) : notificaciones.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-gray-400">No tienes notificaciones.</p>
                        ) : (
                            notificaciones.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    className={`flex w-full flex-col gap-0.5 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 cursor-pointer ${!n.read_at ? "bg-brand-primary/5" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {!n.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />}
                                        <span className={`text-sm ${!n.read_at ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                                            {n.titulo}
                                        </span>
                                    </div>
                                    {n.mensaje && (
                                        <p className="line-clamp-2 text-xs text-gray-500">{n.mensaje}</p>
                                    )}
                                    <span className="text-[11px] text-gray-400">{PrettyDate(n.created_at)}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
