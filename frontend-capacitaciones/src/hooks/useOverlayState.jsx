import { useCallback, useState } from "react";

// Hook simulado idéntico al de tu referencia
export function UseOverlayState(initialOptions = {}) {
    const [isOpen, setIsOpen] = useState(initialOptions.defaultOpen || false);

    const open = useCallback(() => {
        setIsOpen(true);
        initialOptions.onOpenChange?.(true);
    }, [initialOptions]);

    const close = useCallback(() => {
        setIsOpen(false);
        initialOptions.onOpenChange?.(false);
    }, [initialOptions]);

    const toggle = useCallback(() => {
        setIsOpen((prev) => {
            const next = !prev;
            initialOptions.onOpenChange?.(next);
            return next;
        });
    }, [initialOptions]);

    const setOpen = useCallback((value) => {
        setIsOpen(value);
        initialOptions.onOpenChange?.(value);
    }, [initialOptions]);

    return { isOpen, open, close, toggle, setOpen };
}