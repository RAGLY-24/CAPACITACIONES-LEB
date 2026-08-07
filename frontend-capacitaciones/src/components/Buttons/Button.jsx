import { Loader2 } from "lucide-react";

const Button = ({
    children,
    variant = "primary",
    size = "md",
    isPending = false,
    disabled = false,
    className = "",
    type = "button",
    Icon = null,
    iconOnly = false,
    isSoft = false,
    ...props
}) => {
    const variants = {
        primary: {
            solid: "bg-brand-primary text-white hover:bg-brand-primary/90",
            soft: "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20",
        },
        success: {
            solid: "bg-green-600 text-white hover:bg-green-700",
            soft: "bg-green-600/10 text-green-600 hover:bg-green-600/20",
        },
        danger: {
            solid: "bg-red-600 text-white hover:bg-red-700",
            soft: "bg-red-600/10 text-red-600 hover:bg-red-600/20 border border-red-100",
        },
        warning: {
            solid: "bg-yellow-500 text-white hover:bg-yellow-600",
            soft: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
        },
        secondary: {
            solid: "bg-zinc-200 text-zinc-800 hover:bg-zinc-300",
            soft: "bg-zinc-200 text-zinc-700 hover:bg-zinc-300",
        },
        ghost: {
            solid: "bg-transparent text-slate-700 hover:bg-zinc-100",
            soft: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        },
        outline: {
            solid: "bg-transparent border border-zinc-300 text-slate-700 hover:bg-zinc-200",
            soft: "bg-zinc-100 border border-zinc-200 text-slate-700 hover:bg-zinc-200",
        },
        link: {
            solid: "bg-transparent text-blue-500 hover:bg-transparent hover:underline px-0 py-0",
            soft: "bg-transparent text-blue-500 hover:underline px-0 py-0 ",
        },
    };

    const sizes = {
        sm: {
            className: "h-9 px-3 text-xs",
            iconOnly: "h-9 w-9 aspect-square",
            icon: 14,
        },
        md: {
            className: "h-10 px-4 text-sm",
            iconOnly: "h-10 w-10",
            icon: 16,
        },
        lg: {
            className: "h-11 px-5 text-base",
            iconOnly: "h-11 w-11",
            icon: 18,
        },
    };

    const currentSize = sizes[size] || sizes.md;
    const currentVariant = variants[variant] || variants.primary;

    return (
        <button
            type={type}
            disabled={disabled || isPending}
            className={`
    flex items-center justify-center gap-2
    rounded-xl
    transition-all
    outline-none
    focus:ring-2 focus:ring-[#0067b8] focus:ring-offset-1
    disabled:cursor-not-allowed disabled:opacity-60
    cursor-pointer
    ${iconOnly ? currentSize.iconOnly : currentSize.className}
    ${isSoft ? currentVariant.soft : currentVariant.solid}
    ${className}
`}
            {...props}
        >
            {isPending ? (
                <Loader2
                    size={currentSize.icon}
                    className="animate-spin"
                />
            ) : (
                Icon && (
                    <Icon
                        size={currentSize.icon}
                        strokeWidth={2}
                    />
                )
            )}

            {!iconOnly && (isPending ? "Cargando..." : children)}
        </button>
    );
};

export default Button;