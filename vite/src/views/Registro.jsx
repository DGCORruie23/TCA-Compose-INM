import { useState } from "react";
import FormularioResponder from "./FormularioResponder";
import NuevoFormulario from "./NuevoFormulario";
import Preguntas from "./Preguntas";
import RevisarFormularios from "./RevisarFormularios";
import VistaLlenar from "./VistaLlenar";

export default function Registro({ subTab }) {
    const [editingForm, setEditingForm] = useState(null);
    const [editingRespuestaId, setEditingRespuestaId] = useState(null);

    const handleEditRespuesta = (id) => {
        setEditingRespuestaId(id);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-250 pb-20 pt-10">
            {subTab === "llenar" ? (
                <div className="w-full h-full overflow-y-auto pb-24">
                    <VistaLlenar formularioId={1} usuario="Usuario Demo" />
                </div>
            ) : subTab === "configurar" ? (
                <div className="w-full h-full overflow-y-auto pb-24">
                    <NuevoFormulario />
                </div>
            ) : subTab === "editar" ? (
                <div className="w-full h-full overflow-y-auto pb-24">
                    {editingForm ? (
                        <NuevoFormulario
                            existingForm={editingForm}
                            onBack={() => setEditingForm(null)}
                        />
                    ) : (
                        <Preguntas onEdit={setEditingForm} />
                    )}
                </div>
            ) : (
                // Vista Revisar
                <div className="w-full h-full overflow-y-auto pb-24">
                    {editingRespuestaId ? (
                        <FormularioResponder
                            formularioId={1}
                            usuario="Usuario Demo"
                            respuestaId={editingRespuestaId}
                            onBack={() => setEditingRespuestaId(null)}
                        />
                    ) : (
                        <RevisarFormularios onEdit={handleEditRespuesta} />
                    )}
                </div>
            )}
        </div>
    );
}
