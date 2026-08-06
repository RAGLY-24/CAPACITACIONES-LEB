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
    ...props
}) => {

    const variants = {
        primary:
            "bg-brand-primary text-white hover:bg-brand-primary/90",
        success:
            "bg-green-600 text-white hover:bg-green-700",
        danger:
            "bg-red-600 text-white hover:bg-red-700",
        warning:
            "bg-yellow-500 text-white hover:bg-yellow-600",
        secondary:
            "bg-zinc-200 text-zinc-800 hover:bg-zinc-300",
        ghost:
            "bg-transparent text-slate-700 hover:bg-zinc-100",
        outline:
            "bg-transparent border border-zinc-300 text-slate-700 hover:bg-zinc-200",
    };

    const sizes = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2 text-md",
        lg: "px-5 py-2 text-lg",
    };

    return (
        <button
            type={type}
            disabled={disabled || isPending}
            className={`
                flex items-center justify-center gap-2
                rounded-xl 
                text-[15px]
                transition-all
                outline-none
                h-min
                focus:ring-2 focus:ring-[#0067b8] focus:ring-offset-1
                disabled:cursor-not-allowed cursor-pointer disabled:opacity-60
                ${iconOnly ? "aspect-square w-auto" : "w-auto"}
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            {...props}
        >
            {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                Icon && <Icon strokeWidth={2} size={15}  />
            )}

            {!iconOnly && (isPending ? "Cargando..." : children)}
        </button>
    );
};

export default Button;