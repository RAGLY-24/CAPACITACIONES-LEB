import { forwardRef } from "react";

const Input = forwardRef(
    (
        {
            label,
            className = "",
            id,
            isRequired = false,
            variant = "primary",
            ...props
        },
        ref
    ) => {
        const inputId = id || props.name;

        const variants = {
            primary:
                "border border-zinc-200 bg-zinc-100 text-black placeholder-gray-400 focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary",

            secondary:
                "border border-zinc-300 bg-transparent text-slate-700 placeholder-gray-400 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary",
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

                <input
                    ref={ref}
                    id={inputId}
                    className={`
                        w-full rounded-xl px-4 py-2 text-[15px]
                        outline-none transition-all
                        disabled:cursor-not-allowed disabled:opacity-60
                        ${variants[variant]}
                        ${className}
                    `}
                    {...props}
                />
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;