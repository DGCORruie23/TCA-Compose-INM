import React, { useRef } from "react";

function AuxBottomBar({ activeOption, setActiveOption }) {
    const timerRef = useRef(null);
    const isLongPress = useRef(false);
    // Set 3: Corporate/Formal (Document Style)
    const options = [
        { id: "llenar", label: "Llenar", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg> },
        { id: "revisar", label: "Revisar", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg> },
        { id: "configurar", label: "Configurar", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" /></svg> },
    ];

    return (
        <div className="fixed bottom-24 left-0 w-full flex justify-center items-center z-40 pointer-events-none">
            <div className="bg-white/0 backdrop-blur-sm border border-gray-200 shadow-md rounded-full px-2 py-2 flex gap-4 pointer-events-auto">
                {options.map((opt) => {
                    if (opt.id === "configurar") {
                        return (
                            <button
                                key={opt.id}
                                onMouseDown={() => {
                                    isLongPress.current = false;
                                    timerRef.current = setTimeout(() => {
                                        isLongPress.current = true;
                                        setActiveOption("configurar");
                                    }, 10000);
                                }}
                                onMouseUp={() => {
                                    if (timerRef.current) {
                                        clearTimeout(timerRef.current);
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (timerRef.current) {
                                        clearTimeout(timerRef.current);
                                    }
                                    isLongPress.current = false;
                                }}
                                onTouchStart={() => {
                                    isLongPress.current = false;
                                    timerRef.current = setTimeout(() => {
                                        isLongPress.current = true;
                                        setActiveOption("configurar");
                                    }, 10000);
                                }}
                                onTouchEnd={() => {
                                    if (timerRef.current) {
                                        clearTimeout(timerRef.current);
                                    }
                                }}
                                onClick={() => {
                                    if (isLongPress.current) {
                                        isLongPress.current = false;
                                        return;
                                    }
                                    setActiveOption("editar");
                                }}
                                className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full transition-colors ${activeOption === opt.id
                                    ? "bg-inm-verde-200 text-white"
                                    : "bg-white/90 text-gray-600 hover:text-white hover:bg-inm-rojo-200/50"
                                    }`}
                            >
                                {opt.icon}
                                <span>{opt.label}</span>
                            </button>
                        );
                    }
                    return (
                        <button
                            key={opt.id}
                            onClick={() => setActiveOption(opt.id)}
                            className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full transition-colors ${activeOption === opt.id
                                ? "bg-inm-verde-200 text-white"
                                : "bg-white/90 text-gray-600 hover:text-white hover:bg-inm-rojo-200/50"
                                }`}
                        >
                            {opt.icon}
                            <span>{opt.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default AuxBottomBar;
