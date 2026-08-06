import { forwardRef } from "react";
import { Check } from "lucide-react";

const Checkbox = forwardRef(
    ({ label, className = "", id, checked = false, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <label
                htmlFor={inputId}
                className={`
          flex cursor-pointer items-center gap-3 rounded-xl
          border border-gray-200 bg-gray-50 px-3 py-2
          transition-all
          ${checked ? "border-brand-primary bg-brand-primary/5" : ""}
          ${className}
        `}
            >
                <input
                    ref={ref}
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    className="sr-only"
                    {...props}
                />

                <div
                    className={`
            flex h-5 w-5 shrink-0 items-center justify-center
            rounded-md border transition-all
            ${checked
                            ? "bg-brand-primary/90 text-white"
                            : "border-zinc-300 bg-white"
                        }
          `}
                >
                    <Check
                        size={14}
                        strokeWidth={3}
                        className={`transition-all ${checked ? "scale-100" : "scale-0"
                            }`}
                    />
                </div>

                <span className="select-none text-sm text-slate-700">
                    {label}
                </span>
            </label>
        );
    }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;