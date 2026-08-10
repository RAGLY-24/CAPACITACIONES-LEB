import { forwardRef } from "react";

const TextArea = forwardRef(
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
        const textareaId = id || props.name;

        const variants = {
            primary:
                "border border-slate-200 bg-slate-50 text-black placeholder-gray-400 focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary",

            secondary:
                "border border-slate-300 bg-transparent text-slate-700 placeholder-gray-400 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary",
        };

        return (
            <div className="flex flex-col gap-2">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="text-[14px] font-medium text-slate-700"
                    >
                        {label}
                        {isRequired && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>
                )}

                <textarea
                    ref={ref}
                    id={textareaId}
                    className={`
                w-full resize-none rounded-xl px-4 py-3 text-[15px]
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

TextArea.displayName = "TextArea";

export default TextArea;