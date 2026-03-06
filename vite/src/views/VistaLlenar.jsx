import React, { useState, useEffect } from "react";
import FormularioResponder from "./FormularioResponder";

export default function VistaLlenar({ formularioId, usuario }) {
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    useEffect(() => {
        // Verificar si hay progreso guardado
        const savedData = localStorage.getItem(`formulario_progress_${formularioId}`);
        if (savedData) {
            setMostrarFormulario(true);
        }
    }, [formularioId]);

    if (mostrarFormulario) {
        return <FormularioResponder formularioId={formularioId} usuario={usuario} />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
                <h2 className="text-2xl font-bold text-black-800 mb-4">Registro Automatizado de Supervisión</h2>
                <p className="text-gray-600 mb-8">
                    Comienza a llenar un nuevo formulario de supervisión.
                </p>
                <button
                    onClick={() => setMostrarFormulario(true)}
                    className="w-full bg-inm-marron-200 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg shadow-md"
                >
                    Llenar Formulario
                </button>
            </div>
        </div>
    );
}
