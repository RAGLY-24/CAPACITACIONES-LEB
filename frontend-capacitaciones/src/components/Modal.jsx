import { useEffect } from "react";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import { X } from "lucide-react";

// Mapeo de tamaños para el ancho máximo
const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md", // Por defecto
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
};

// Mapeo de proporciones de aspecto con alturas controladas
const aspectClasses = {
    default: "max-h-[85vh]",                 // Altura máxima predeterminada para evitar desbordes
    square: "aspect-square max-w-lg max-h-[85vh]", // Forzar formato cuadrado controlado
    vert: "h-[80vh] max-h-[700px]",          // Altura fija/máxima vertical alargada
    horiz: "max-w-3xl max-h-[80vh]",         // Más ancho pero controlado en altura
};

export function Modal({
    open,
    title,
    footer,
    children,
    size = "md",
    aspect = "default",
    onClose
}) {

    // Efecto para cerrar el modal al presionar la tecla Escape
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && open) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose, open]);

    useLockBodyScroll(open);

    if (!open) return null;

    // Obtenemos las clases dinámicas según las props
    const selectedSize = sizeClasses[size] || sizeClasses.md;
    const selectedAspect = aspectClasses[aspect] || aspectClasses.default;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={onClose}>
            <div
                className={`bg-white rounded-2xl overflow-hidden shadow-xl w-full relative flex flex-col ${selectedSize} ${selectedAspect}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Prop) */}
                {title && (
                    <div className="flex justify-between items-center border-b border-slate-200 px-4 py-4 bg-slate-50 shrink-0">
                        <h3 className="text-lg text-black ">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Contenido principal (Children) - flex-1 y overflow-y-auto manejan el scroll interno */}
                <div className="text-gray-600 p-4 overflow-y-auto flex-1">
                    {children}
                </div>

                {/* Footer (Prop) */}
                {footer && (
                    <div className="flex justify-end gap-2 items-center border-t border-slate-200 px-4 py-4 bg-slate-50 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}