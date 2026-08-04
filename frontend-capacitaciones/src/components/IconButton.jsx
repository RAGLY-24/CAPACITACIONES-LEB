const variantClasses = {
    primary: {
        color: "text-zinc-500",
        hover: "hover:bg-zinc-500/90 hover:text-white",
    },
    secondary: {
        color: "text-zinc-700",
        hover: "hover:bg-zinc-700/90 hover:text-white",
    },
    danger: {
        color: "text-red-600",
        hover: "hover:bg-red-600/90 hover:text-white",
    },
    info: {
        color: "text-cyan-500",
        hover: "hover:bg-cyan-500/90 hover:text-white",
    },
    success: {
        color: "text-green-500",
        hover: "hover:bg-green-500/90 hover:text-white",
    },
    warning: {
        color: "text-yellow-500",
        hover: "hover:bg-yellow-500/90 hover:text-white",
    },
    ghost: {
        color: "text-zinc-600",
        hover: "hover:bg-zinc-100",
    },
};

export function IconButton({
    icon: Icon,
    onClick,
    variant = "primary",
    title,
    isDisabled = false,
    neutralText = false,
    dark = false,
    filled = true,
    className = "",
    ...props
}) {
    const handleClick = (e) => {
        e.stopPropagation();
        if (isDisabled) return;
        onClick?.(e);
    };

    const selectedVariant =
        variantClasses[variant] || variantClasses.primary;

    let textColor = selectedVariant.color;

    if (neutralText) {
        textColor = "text-black";
    }

    if (dark && !neutralText) {
        textColor = selectedVariant.color;
    }

    if (dark && neutralText) {
        textColor = "text-white";
    }

    const variantStyle = filled
        ? `${textColor} ${selectedVariant.hover}`
        : `${textColor} hover:opacity-50`;

    const backgroundClass = filled
        ? dark ? "bg-zinc-800/60" : "bg-zinc-200/60"
        : "bg-transparent";

    return (
        <button
            type="button"
            onClick={handleClick}
            title={title}
            aria-label={title}
            disabled={isDisabled}
            className={`rounded-xl backdrop-blur-sm flex items-center justify-center transition-all shrink-0 h-8 w-8 ${
                isDisabled
                    ? "opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400"
                    : `cursor-pointer ${backgroundClass} ${variantStyle}`
            } ${className}`}
            {...props}
        >
            {Icon && <Icon size={13} />}
        </button>
    );
}