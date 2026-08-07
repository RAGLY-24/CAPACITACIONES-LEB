
export const DropdownMenu = ({
    items = [],
    className = "",
}) => {
    return (
        <div
            className={`
        absolute right-0 mt-3 w-44 overflow-hidden
        rounded-2xl border border-gray-200
        bg-white p-1 shadow-xl z-50
        ${className}
        `}
        >
            {items.map((item, index) => {
                const Icon = item.icon;

                return (
                    <button
                        key={index}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={`
                flex w-full items-center gap-4
                rounded-xl px-4 py-2.5
                text-left text-sm
                font-medium
                transition-colors
                disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer
                ${item.variant === "danger"
                                ? "text-red-600 hover:bg-slate-50"
                                : "text-slate-900 hover:bg-slate-50"
                            }
            `}
                    >
                        {Icon && <Icon size={15} />}
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
};