import { useState } from "react";
import BottomBar from "./components/BottomBar";
import AuxBottomBar from "./components/AuxBottomBar";
import Registro from "./views/Registro";
import Instrucciones from "./views/Instrucciones";
import Reportes from "./views/Reportes";

export default function App() {
  const [activeTab, setActiveTab] = useState("registro");
  const [auxActiveTab, setAuxActiveTab] = useState("llenar");

  const renderView = () => {
    switch (activeTab) {
      case "registro":
        return <Registro subTab={auxActiveTab} />;
      case "instrucciones":
        return <Instrucciones />;
      case "reportes":
        return <Reportes />;
      default:
        return <Registro subTab={auxActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full h-full">
        {renderView()}
      </div>
      {activeTab === "registro" && (
        <AuxBottomBar activeOption={auxActiveTab} setActiveOption={setAuxActiveTab} />
      )}
      <BottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}