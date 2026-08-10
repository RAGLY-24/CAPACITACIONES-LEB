import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(
    (
        {
            label,
            className = "",
            containerClassName = "",
            id,
            isRequired = false,
            error = null,
            variant = "primary",
            options = [],
            placeholder = "Selecciona una opción",
            ...props
        },
        ref
    ) => {
        const selectId = id || props.name;

        const variants = {
            primary:
                "border border-slate-200 bg-slate-50 text-black placeholder-gray-400 focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary",

            secondary:
                "border border-slate-300 bg-transparent text-slate-700 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary",
        };

        return (
            <div className={`flex flex-col gap-2 ${containerClassName}`}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-[14px] font-medium text-slate-700"
                    >
                        {label}
                        {isRequired && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>
                )}

                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={`
                            w-full h-10.5 rounded-xl px-4 pr-10 text-[15px]
                            appearance-none
                            outline-none transition-all
                            disabled:cursor-not-allowed disabled:opacity-60
                            ${variants[variant]}
                            ${className}
                        `}
                        {...props}
                    >
                        {placeholder && (
                            <option value="">
                                {placeholder}
                            </option>
                        )}

                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <ChevronDown
                        size={18}
                        strokeWidth={1.8}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";

export default Select;