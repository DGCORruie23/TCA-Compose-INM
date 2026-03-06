function BottomBar({ activeTab, setActiveTab }) {
  const icons = [
    { id: "registro", label: "Registro", svg: "📝" },
    { id: "instrucciones", label: "Instrucciones", svg: "📋" },
    { id: "reportes", label: "Reportes", svg: "📈" },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 w-full bg-transparent flex justify-around items-center py-2 z-50"
    >
      {icons.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center justify-center w-full py-2 mx-1 rounded-2xl transition-colors duration-200 ${activeTab === item.id ? "bg-inm-verde-100 text-white" : "bg-inm-marron-100 text-black hover:bg-inm-verde-200 hover:text-white"
            }`}
        >
          <div className="text-2xl mb-1">{item.svg}</div>
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export default BottomBar;