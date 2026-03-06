import { useState } from "react";
import Preguntas from "./Preguntas";
import FormularioResponder from "./FormularioResponder";
import BottomBar from "../components/BottomBar";
import NuevoFormulario from "./NuevoFormulario";
import Respuestas from "./Respuestas";

export default function RegistroS({ volver }) {

  const [activeTab, setActiveTab] = useState(3); // 1 = Preguntas
  const [editingForm, setEditingForm] = useState(null);

  const renderView = () => {
    switch (activeTab) {
      case 1:
        // return <Preguntas />;
        return (
          <div className="min-h-screen bg-gray-100">
            {editingForm ? (
              <NuevoFormulario
                existingForm={editingForm}
                onBack={() => setEditingForm(null)}
              />
            ) : (
              <Preguntas onEdit={setEditingForm} />
            )}
          </div>
        );
      case 2:
        return <FormularioResponder formularioId={1} />;
      case 3:
        return <NuevoFormulario />;
      case 4:
          return <Respuestas />;
      default:
        return <Preguntas />;
    }
  };

  return (
    <>
        <button onClick={volver} className="mb-4 text-blue-600 underline">
            ← Volver
        </button>
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
                {renderView()}
            </div>
            <BottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    </>
  );
}

// export default RegistroS;