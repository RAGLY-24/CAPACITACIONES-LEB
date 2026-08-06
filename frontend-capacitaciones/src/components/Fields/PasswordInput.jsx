import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = forwardRef(
    (
        {
            label,
            className = "",
            isRequired = false,
            type = "password",
            id,
            variant = "primary",
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);

        const inputId = id || props.name;

        const variants = {
            primary:
                "border border-zinc-200 bg-zinc-100 text-black placeholder-gray-400 focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary",

            secondary:
                "border border-zinc-300 bg-transparent text-slate-700 placeholder-gray-400 hover:bg-zinc-200 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary",
        };

        return (
            <div className="flex flex-col gap-2">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-[14px] font-medium text-slate-700"
                    >
                        {label}
                        {isRequired && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>
                )}

                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        type={showPassword ? "text" : type}
                        className={`
              w-full rounded-xl px-4 py-2 pr-10 text-[15px]
              outline-none transition-all
              disabled:cursor-not-allowed disabled:opacity-60
              ${variants[variant]}
              ${className}
            `}
                        {...props}
                    />

                    {type === "password" && (
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-4 flex items-center text-gray-500 transition hover:text-gray-700"
                            aria-label={
                                showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;