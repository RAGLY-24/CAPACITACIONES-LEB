import { User } from "lucide-react";

export const Avatar = ({
    src,
    alt = "Foto de perfil",
    size = "md",
    className = "",
}) => {
    const sizes = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-14 w-14",
        xl: "h-18 w-18",
        "2xl": "h-22 w-22",
    };

    const iconSizes = {
        sm: 16,
        md: 22,
        lg: 30,
        xl: 36,
        "2xl": 40,
    };

    return (
        <div
            className={`
        flex items-center justify-center
        overflow-hidden rounded-full
        border border-zinc-200
        bg-zinc-100
        ${sizes[size]}
        ${className}
        `}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            ) : (
                <User
                    className="text-brand-primary"
                    size={iconSizes[size]}
                    strokeWidth={1.5}
                />
            )}
        </div>
    );
};
