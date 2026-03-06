import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from 'js-cookie';
import { API_URL } from "../values/apis";

export default function Instrucciones() {
    const [instrucciones, setInstrucciones] = useState([]);
    const [loading, setLoading] = useState(true);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Save Confirmation Modal state
    const [saveModal1Open, setSaveModal1Open] = useState(false);
    const [saveModal2Open, setSaveModal2Open] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState(null);
    const [editingAccionId, setEditingAccionId] = useState(null); // Need Accion ID for update

    // Header Checkbox State
    const [showSelect, setShowSelect] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState("");

    const csrftoken = Cookies.get('csrftoken');

    // view: "list", "setup", "form"
    const [view, setView] = useState("list");

    // Setup state
    const [setupData, setSetupData] = useState({
        oficina: "",
        fecha_inicio: ""
    });

    // Form state
    const [formData, setFormData] = useState({
        antecedente: "",
        instrucciones: "",
        area: [],
        rubro: "",
        fecha_termino: ""
    });

    // Catalogs State - Now storing objects {id, label}
    const [listOrs, setListOrs] = useState([]);
    const [listAreas, setListAreas] = useState([]);
    const [listRubros, setListRubros] = useState([]);

    // Fetch data from API
    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                // Fetch Areas/ORs
                const resAreas = await axios.get(`${API_URL}/areas/`);
                if (resAreas.data && resAreas.data.length > 0) {
                    // Assuming the backend returns objects with 'nickname' or 'name'. 
                    console.log("Raw Response Areas [0]:", resAreas.data[0]); // Check raw data
                    // Map objects { id, label }
                    const areaObjects = resAreas.data.map(item => ({
                        id: item.idArea || item.id || item.pk, // Fallback strategy
                        label: item.nickname || item.name || item.toString()
                    }));
                    console.log("Mapped Areas:", areaObjects); // Log mapped areas
                    setListAreas(areaObjects); // All areas
                    setListOrs(areaObjects.slice(0, 32)); // First 32 only
                }

                // Fetch Rubros
                const resRubros = await axios.get(`${API_URL}/rubros/`);
                if (resRubros.data && resRubros.data.length > 0) {
                    console.log("Raw Response Rubros [0]:", resRubros.data[0]); // Check raw data
                    const rubroObjects = resRubros.data.map(item => ({
                        id: item.idRubro || item.id || item.pk, // Fallback strategy
                        label: item.tipo || item.toString()
                    }));
                    setListRubros(rubroObjects);
                }

            } catch (error) {
                console.error("Error fetching catalogs, using defaults", error);
            }
        };

        fetchCatalogs();
    }, []);

    // Fetch Instructions
    useEffect(() => {
        const fetchInstrucciones = async () => {
            try {
                const response = await fetch(`${API_URL}/registro_temporal/`);
                if (response.ok) {
                    const data = await response.json();
                    // Sort by index (first 3 digits)
                    const sorted = data.sort((a, b) => {
                        const idxA = parseInt(a.claveAcuerdo?.substring(0, 3)) || 0;
                        const idxB = parseInt(b.claveAcuerdo?.substring(0, 3)) || 0;
                        return idxA - idxB;
                    });
                    setInstrucciones(sorted);
                } else {
                    console.error("Error fetching instrucciones");
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (view === "list") {
            fetchInstrucciones();
        }
    }, [view]);

    const handleAggregateClick = () => {
        // Reset Edit State
        setEditingId(null);
        setEditingAccionId(null);

        const cachedOficina = localStorage.getItem("oficina_instrucciones");
        const cachedFecha = localStorage.getItem("fecha_inicio_instrucciones");

        // Check if cachedOficina looks like an ID (number)
        const isId = !isNaN(cachedOficina) && !isNaN(parseFloat(cachedOficina));

        // Default clean form data
        const cleanFormData = {
            antecedente: "",
            instrucciones: "",
            area: [],
            rubro: "",
            fecha_termino: ""
        };

        if (cachedOficina && cachedFecha && isId) {
            setSetupData({ oficina: cachedOficina, fecha_inicio: cachedFecha });
            setFormData({
                ...cleanFormData,
                area: [cachedOficina],
                fecha_termino: cachedFecha
            });
            setView("form");
        } else {
            // Clear invalid cache
            if (cachedOficina && !isId) {
                localStorage.removeItem("oficina_instrucciones");
            }
            setFormData(cleanFormData); // Reset form data
            setView("setup");
        }
    };

    const handleSetupContinue = () => {
        if (setupData.oficina && setupData.fecha_inicio) {
            localStorage.setItem("oficina_instrucciones", setupData.oficina);
            localStorage.setItem("fecha_inicio_instrucciones", setupData.fecha_inicio);
            setFormData(prev => ({ ...prev, area: [setupData.oficina], fecha_termino: setupData.fecha_inicio }));
            setView("form");
        } else {
            alert("Por favor selecciona OR y Fecha de Inicio");
        }
    };

    const handleSaveInstruction = async () => {
        try {
            setLoading(true);

            console.log("Current formData attempt:", formData);

            // Validate Data before Payload Construction
            const sanitizedArea = formData.area
                .map(id => parseInt(id, 10))
                .filter(id => !isNaN(id)); // Removed id > 0 to see raw values

            console.log("Sanitized Area:", sanitizedArea);

            const sanitizedRubro = formData.rubro ? parseInt(formData.rubro, 10) : null;

            if (sanitizedArea.length === 0) {
                alert("Por favor selecciona al menos una Área Responsable.");
                setLoading(false);
                return;
            }

            if (!sanitizedRubro || isNaN(sanitizedRubro)) {
                alert("Por favor selecciona un Rubro.");
                setLoading(false);
                return;
            }

            // 1. Create RegistroTemporal
            const registroPayload = {
                fecha_inicio: setupData.fecha_inicio,
                fecha_termino: formData.fecha_termino,
                area: sanitizedArea,
                rubro: [sanitizedRubro],
            };

            console.log("Sending Payload:", registroPayload);

            // Generate Clave Acuerdo
            // Format: /OR/MM/YYYY/
            const selectedOr = listOrs.find(or => or.id == setupData.oficina); // loosely equal for string/int match
            let claveGenerada = "Clave de Acuerdo";

            if (selectedOr && setupData.fecha_inicio) {
                const nombreOr = selectedOr.label.replace(/^OR\s+/i, '').trim(); // Remove "OR " case insensitive
                const [year, month] = setupData.fecha_inicio.split('-'); // YYYY-MM-DD

                // Find existing item if editing
                const match = editingId ? instrucciones.find(i => i.idRegistro === editingId) : null;

                // Calculate Index: Prefix + Sequence
                let prefix = "0";
                if (showSelect && selectedNumber) {
                    prefix = selectedNumber;
                } else if (match && match.claveAcuerdo && /^\d{3}/.test(match.claveAcuerdo)) {
                    prefix = match.claveAcuerdo.substring(0, 1);
                }

                let sequenceStr = "01";
                if (editingId) {
                    if (match && match.claveAcuerdo && /^\d{3}/.test(match.claveAcuerdo)) {
                        sequenceStr = match.claveAcuerdo.substring(1, 3);
                    } else {
                        // Fallback to position
                        const index = instrucciones.findIndex(i => i.idRegistro === editingId);
                        sequenceStr = String(index !== -1 ? index + 1 : 1).padStart(2, '0');
                    }
                } else {
                    // New record: find max sequence in current list to avoid collisions
                    let maxSeq = 0;
                    instrucciones.forEach(i => {
                        if (i.claveAcuerdo && /^\d{3}/.test(i.claveAcuerdo)) {
                            const s = parseInt(i.claveAcuerdo.substring(1, 3));
                            if (!isNaN(s) && s > maxSeq) maxSeq = s;
                        }
                    });
                    sequenceStr = String(maxSeq + 1).padStart(2, '0');
                }

                claveGenerada = `${prefix}${sequenceStr}/${nombreOr}/${month}/${year}`;
            }

            registroPayload.claveAcuerdo = claveGenerada;
            console.log("Generated Clave:", claveGenerada);

            let resRegistro;

            if (editingId) {
                // PUT Update
                resRegistro = await axios.put(`${API_URL}/registro_temporal/${editingId}/`, registroPayload, {
                    headers: { 'X-CSRFToken': csrftoken },
                    withCredentials: true,
                });
            } else {
                // POST Create
                resRegistro = await axios.post(`${API_URL}/registro_temporal/`, registroPayload, {
                    headers: { 'X-CSRFToken': csrftoken },
                    withCredentials: true,
                });
            }

            if (resRegistro.status === 201 || resRegistro.status === 200) {
                // Should we use existing ID or new ID? If update, it's editingId.
                const targetRegistroId = editingId || resRegistro.data.idRegistro;

                // 2. Create/Update AccionesTemporal linked to Registro if needed
                if (formData.instrucciones || formData.antecedente) {
                    const accionesPayload = {
                        idRegistro: [targetRegistroId],
                        area2: formData.area, // Re-using areas as it's required context usually
                        descripcion: formData.instrucciones || "Sin instrucciones",
                        antecedente: formData.antecedente || ""
                    };

                    if (editingId && editingAccionId) {
                        // PUT Update
                        await axios.put(`${API_URL}/acciones_temporal/${editingAccionId}/`, accionesPayload, {
                            headers: { 'X-CSRFToken': csrftoken },
                            withCredentials: true,
                        });
                    } else {
                        // POST Create
                        await axios.post(`${API_URL}/acciones_temporal/`, accionesPayload, {
                            headers: { 'X-CSRFToken': csrftoken },
                            withCredentials: true,
                        });
                    }
                }

                alert(editingId ? "Instrucción actualizada correctamente" : "Instrucción guardada correctamente");

                // Re-fetch or manually sort after save to ensure order
                // The useEffect [view] will handle fetch if we are going back to "list" view
                setView("list");

                // Reset Form
                setFormData({
                    antecedente: "",
                    instrucciones: "",
                    area: [],
                    rubro: "",
                    fecha_termino: ""
                });
                setEditingId(null);
                setEditingAccionId(null);
            }
        } catch (error) {
            console.error("Error saving instruction:", error);
            if (error.response) {
                console.error("Backend Error Data:", error.response.data);
                alert(`Error al guardar: ${JSON.stringify(error.response.data)}`);
            } else {
                alert("Error al guardar la instrucción");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (item) => {
        // 1. Populate Setup Data (Date, Office) from existing record 
        // Need to find Office ID from Name? Or rely on what's in Item?
        // Item has claveAcuerdo: /CDMX/02/2026/
        // And item.area is a list of objects.

        // But we have fecha_inicio in Item? Yes, RegistroTemporal has fecha_inicio.
        // Do we have Oficina? Oficina is implicit in Clave or we can infer from one of the Areas if it was stored?
        // Actually, SetupData is mainly for generating the Clave. If editing, we might not change the Clave unless date changes.
        // Let's populate setupData with item.fecha_inicio.
        // For Oficina, we might not be able to easily extract it back to an ID unless we parse the Clave or assume it's one of the Areas?
        // The requirement says "edit the data".

        setEditingId(item.idRegistro);
        if (item.accion_detalle) {
            setEditingAccionId(item.accion_detalle.id);
        }

        // Recover Office ID from areas
        let foundOficinaId = "";
        if (item.area && item.area.length > 0) {
            for (const a of item.area) {
                // Check against listOrs to see if this area matches an OR
                const id = a.idArea || a.id || a.pk;
                const match = listOrs.find(or => or.id == id); // loosely equal
                if (match) {
                    foundOficinaId = match.id;
                    break;
                }
            }
        }

        setSetupData({
            fecha_inicio: item.fecha_inicio,
            oficina: foundOficinaId // Populated with the ID if found
        });

        // Populate Form Data
        setFormData({
            antecedente: item.accion_detalle ? item.accion_detalle.antecedente : "",
            instrucciones: item.accion_detalle ? item.accion_detalle.descripcion : "",
            area: item.area ? item.area.map(a => a.idArea || a.id || a.pk) : [],
            rubro: item.rubro && item.rubro.length > 0 ? (item.rubro[0].idRubro || item.rubro[0].id) : "",
            fecha_termino: item.fecha_termino
        });

        setView("form");
    };

    const handleMoveDown = async (item, index) => {
        // Only swap if there is a next item
        if (index >= instrucciones.length - 1) return;

        const nextItem = instrucciones[index + 1];

        try {
            setLoading(true);

            // 1. Prepare new claves
            // We swap ONLY the index portion (first 3 digits)
            // Current item gets next item's index
            // Next item gets current item's index
            const currentIndexPart = item.claveAcuerdo.substring(0, 3);
            const nextIndexPart = nextItem.claveAcuerdo.substring(0, 3);

            const newClaveItem = nextIndexPart + item.claveAcuerdo.substring(3);
            const newClaveNext = currentIndexPart + nextItem.claveAcuerdo.substring(3);

            // 2. Persist to DB
            const putItem = axios.put(`${API_URL}/registro_temporal/${item.idRegistro}/`,
                { ...item, claveAcuerdo: newClaveItem, area: item.area.map(a => a.idArea || a.id || a.pk), rubro: item.rubro.map(r => r.idRubro || r.id) },
                { headers: { 'X-CSRFToken': csrftoken }, withCredentials: true }
            );

            const putNext = axios.put(`${API_URL}/registro_temporal/${nextItem.idRegistro}/`,
                { ...nextItem, claveAcuerdo: newClaveNext, area: nextItem.area.map(a => a.idArea || a.id || a.pk), rubro: nextItem.rubro.map(r => r.idRubro || r.id) },
                { headers: { 'X-CSRFToken': csrftoken }, withCredentials: true }
            );

            await Promise.all([putItem, putNext]);

            // 3. Update local state
            const newInstrucciones = [...instrucciones];
            newInstrucciones[index] = { ...item, claveAcuerdo: newClaveItem };
            newInstrucciones[index + 1] = { ...nextItem, claveAcuerdo: newClaveNext };

            // Physically swap positions in the array and sort to be safe
            const sortedInstrucciones = newInstrucciones.sort((a, b) => {
                const idxA = parseInt(a.claveAcuerdo?.substring(0, 3)) || 0;
                const idxB = parseInt(b.claveAcuerdo?.substring(0, 3)) || 0;
                return idxA - idxB;
            });

            setInstrucciones(sortedInstrucciones);
        } catch (error) {
            console.error("Error swapping indices:", error);
            alert("Error al mover la instrucción");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER HELPERS ---

    if (view === "setup") {
        return ( // Pantalla 1
            <div className="flex flex-col h-screen bg-[#F0EADD] pb-20 items-center justify-center">
                <div className="bg-[#C0C0C0] p-8 rounded-3xl shadow-lg w-11/12 max-w-md space-y-6">
                    <h2 className="text-2xl font-bold text-[#1a4a3b] text-center">Configuración Inicial</h2>

                    <div className="space-y-2">
                        <label className="block text-gray-700 font-semibold">Selecciona OR</label>
                        <select
                            className="w-full p-2 rounded-md border border-gray-400"
                            value={setupData.oficina}
                            onChange={(e) => setSetupData({ ...setupData, oficina: e.target.value })}
                        >
                            <option value="">-- Selecciona --</option>
                            {listOrs.map(or => <option key={or.id} value={or.id}>{or.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-gray-700 font-semibold">Selecciona fecha de inicio</label>
                        <input
                            type="date"
                            className="w-full p-2 rounded-md border border-gray-400"
                            value={setupData.fecha_inicio}
                            onChange={(e) => setSetupData({ ...setupData, fecha_inicio: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-center pt-4">
                        <button
                            className="bg-[#2F5245] text-white font-bold py-2 px-8 rounded-full shadow-md hover:bg-[#1a3a30] transition-colors"
                            onClick={handleSetupContinue}
                        >
                            Continuar
                        </button>
                        <button
                            className="ml-4 text-gray-600 underline"
                            onClick={() => setView("list")}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === "form") {
        // Calculate Live Clave for Title
        const selectedOr = listOrs.find(or => or.id == setupData.oficina);
        let liveClave = "Nueva Instrucción";

        if (selectedOr && setupData.fecha_inicio) {
            const nombreOr = selectedOr.label.replace(/^OR\s+/i, '').trim();
            const [year, month] = setupData.fecha_inicio.split('-');
            const match = editingId ? instrucciones.find(i => i.idRegistro === editingId) : null;

            let prefix = (showSelect && selectedNumber) ? selectedNumber : "0";
            if (!showSelect && match && match.claveAcuerdo && /^\d{3}/.test(match.claveAcuerdo)) {
                prefix = match.claveAcuerdo.substring(0, 1);
            }

            let sequenceStr = "01";
            if (editingId) {
                if (match && match.claveAcuerdo && /^\d{3}/.test(match.claveAcuerdo)) {
                    sequenceStr = match.claveAcuerdo.substring(1, 3);
                } else {
                    const idx = instrucciones.findIndex(i => i.idRegistro === editingId);
                    sequenceStr = String(idx !== -1 ? idx + 1 : 1).padStart(2, '0');
                }
            } else {
                let maxSeq = 0;
                instrucciones.forEach(i => {
                    if (i.claveAcuerdo && /^\d{3}/.test(i.claveAcuerdo)) {
                        const s = parseInt(i.claveAcuerdo.substring(1, 3));
                        if (!isNaN(s) && s > maxSeq) maxSeq = s;
                    }
                });
                sequenceStr = String(maxSeq + 1).padStart(2, '0');
            }
            liveClave = `${prefix}${sequenceStr}/${nombreOr}/${month}/${year}`;
        }

        return ( // Pantalla 2
            <div className="flex flex-col h-screen bg-[#F0EADD] pb-20 items-center pt-8 overflow-y-auto">
                <div className="w-11/12 max-w-4xl space-y-6 mb-10">
                    <div className="flex items-center justify-center space-x-4">
                        {/* Back Arrow */}
                        <button
                            onClick={() => setView("list")}
                            className="text-[#1a4a3b] hover:scale-110 transition-transform p-1 bg-white/50 rounded-full shadow-sm flex-shrink-0"
                            title="Regresar"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>

                        <h2 className="text-3xl font-bold text-[#1a4a3b] text-center">{liveClave}</h2>
                    </div>

                    {/* Section 1: Antecedente */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold text-[#1a4a3b] mb-4">Antecedente</h3>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50"
                            rows="5"
                            placeholder="Escribe los antecedentes..."
                            value={formData.antecedente}
                            onChange={(e) => setFormData({ ...formData, antecedente: e.target.value })}
                        ></textarea>
                    </div>

                    {/* Section 2: Instrucciones */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold text-[#1a4a3b] mb-4">Instrucciones</h3>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50"
                            rows="5"
                            placeholder="Escribe las instrucciones..."
                            value={formData.instrucciones}
                            onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                        ></textarea>
                    </div>

                    {/* Section 3: Selects */}
                    <div className="bg-white p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Áreas responsables</label>
                            <select
                                multiple
                                className="w-full p-2 rounded-md border border-gray-300 h-32"
                                value={formData.area}
                                onChange={(e) => {
                                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                    console.log("Selection changed:", selectedOptions);
                                    setFormData(prev => ({ ...prev, area: selectedOptions }));
                                }}
                            >
                                {listAreas.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Mantén presionado Ctrl/Cmd para seleccionar múltiples</p>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Selecciona rubro</label>
                            <select
                                className="w-full p-2 rounded-md border border-gray-300"
                                value={formData.rubro}
                                onChange={(e) => setFormData({ ...formData, rubro: e.target.value })}
                            >
                                <option value="">-- Selecciona --</option>
                                {listRubros.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Fecha termino</label>
                            <input
                                type="date"
                                className="w-full p-2 rounded-md border border-gray-300"
                                value={formData.fecha_termino}
                                onChange={(e) => setFormData({ ...formData, fecha_termino: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-center space-x-4 pt-4">
                        <button
                            className="bg-[#2F5245] text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-[#1a3a30] transition-transform transform hover:scale-105"
                            onClick={handleSaveInstruction}
                        >
                            Guardar
                        </button>
                        <button
                            className="text-gray-600 underline"
                            onClick={() => setView("list")}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // List View (Default)
    return (
        <div className="flex flex-col h-screen bg-[#F0EADD] pb-20 items-center">
            {/* Header */}
            <div className="pt-8 pb-4 relative w-11/12 max-w-4xl flex justify-center items-center">
                <h2 className="text-3xl font-bold text-[#1a4a3b]">Cedula de Instrucciones</h2>

                {/* Right-side controls */}
                <div className="absolute right-0 flex items-center space-x-2">
                    <input
                        type="checkbox"
                        className="w-5 h-5 text-[#1a4a3b] rounded focus:ring-[#1a4a3b] cursor-pointer"
                        checked={showSelect}
                        onChange={(e) => {
                            setShowSelect(e.target.checked);
                            if (!e.target.checked) setSelectedNumber("");
                        }}
                    />
                    {showSelect && (
                        <select
                            className="p-1 rounded border border-gray-300 text-gray-700 focus:ring-[#1a4a3b]"
                            value={selectedNumber}
                            onChange={(e) => setSelectedNumber(e.target.value)}
                        >
                            <option value="">#</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Main Container */}
            <div className="bg-[#C0C0C0] w-11/12 max-w-4xl h-3/5 rounded-3xl shadow-lg p-6 overflow-y-auto space-y-3">
                {loading && <p className="text-center text-gray-600">Cargando...</p>}
                {!loading && instrucciones.length === 0 && (
                    <p className="text-center text-gray-600">No hay instrucciones</p>
                )}
                {instrucciones.map((item, index) => (
                    <div key={item.idRegistro} className="relative pt-4 pb-1">
                        {/* Pleca (Banner/Tab) - Clave */}
                        <div className="absolute top-1 left-8 bg-[#2F5245] text-white text-xs font-bold px-4 py-0.5 rounded-t-lg shadow-sm z-10">
                            {(() => {
                                if (item.claveAcuerdo && /^\d{3}/.test(item.claveAcuerdo)) {
                                    if (showSelect && selectedNumber) {
                                        return selectedNumber + item.claveAcuerdo.substring(1);
                                    }
                                    return item.claveAcuerdo;
                                }
                                const prefix = (showSelect && selectedNumber) ? selectedNumber : "0";
                                const sequence = String(index + 1).padStart(2, '0');
                                return `${prefix}${sequence}${item.claveAcuerdo || ""}`;
                            })()}
                        </div>

                        {/* Pleca (Banner/Tab) - Rubro */}
                        {item.rubro && item.rubro.length > 0 && (
                            <div
                                className="absolute top-1 left-44 bg-inm-marron-200 text-white text-xs font-bold px-4 py-0.5 rounded-t-lg shadow-sm z-10"
                                title={"Rubro: " + (item.rubro[0].tipo || item.rubro[0].label)}
                            >
                                {(() => {
                                    const label = item.rubro[0].tipo || item.rubro[0].label || "";
                                    return label.length > 12 ? label.substring(0, 12) + "..." : label;
                                })()}
                            </div>
                        )}
                        {/* Pleca (Banner/Tab) - Fecha Termino */}
                        <div
                            className={`absolute top-1 left-[300px] text-white text-xs font-bold px-4 py-0.5 rounded-t-lg shadow-sm z-10 ${item.fecha_termino === item.fecha_inicio ? "bg-inm-rojo-200" : "bg-gray-500"
                                }`}
                            title="Fecha de Término"
                        >
                            {item.fecha_termino}
                        </div>
                        {/* Main Card Body */}
                        <div className="bg-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-md border-t-2 border-[#2F5245]">
                            {/* Left part: Icon and Description */}
                            <div className="flex items-center space-x-4 flex-1 mr-4 overflow-hidden">
                                <div
                                    className="relative flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => handleMoveDown(item, index)}
                                    title="Mover hacia abajo"
                                >
                                    <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-lg">V</span>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-gray-800 font-medium line-clamp-2 text-sm leading-relaxed">
                                        {item.accion_detalle?.descripcion || "Sin descripción"}
                                    </p>
                                </div>
                            </div>

                            {/* Right Icons */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button
                                    className="text-[#1a4a3b] hover:scale-110 transition-transform"
                                    onClick={() => handleEditClick(item)}
                                >
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                                <button
                                    className="text-[#8B0000] hover:scale-110 transition-transform"
                                    onClick={() => {
                                        setItemToDelete(item);
                                        setDeleteModalOpen(true);
                                    }}
                                >
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M8 8l8 8M16 8l-8 8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Delete Confirmation Modal */}
                {deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl relative">
                            <h3 className="text-2xl font-bold text-[#8B0000] mb-4 text-center">Confirmar Eliminación</h3>

                            <div className="space-y-3 text-gray-700 mb-6">
                                <p><strong>Clave:</strong> {itemToDelete.claveAcuerdo}</p>
                                <p><strong>Instrucción:</strong> {itemToDelete.accion_descripcion || "N/A"}</p>
                                <p><strong>Áreas Responsables:</strong> {itemToDelete.area ? itemToDelete.area.map(a => a.nickname || a.name || a.label).join(", ") : "N/A"}</p>
                                <p><strong>Rubro:</strong> {itemToDelete.rubro && itemToDelete.rubro.length > 0 ? (itemToDelete.rubro[0].tipo || itemToDelete.rubro[0].label) : "N/A"}</p>
                                <p><strong>Fecha de Término:</strong> {itemToDelete.fecha_termino}</p>
                            </div>

                            <p className="text-center text-gray-500 mb-6 font-medium">¿Estás seguro de eliminar este registro y su acción asociada?</p>

                            <div className="flex justify-center space-x-4">
                                <button
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full transition-colors"
                                    onClick={() => setDeleteModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="bg-[#8B0000] hover:bg-red-800 text-white font-bold py-2 px-6 rounded-full transition-colors"
                                    onClick={async () => {
                                        try {

                                            const indexToDelete = instrucciones.findIndex(i => i.idRegistro === itemToDelete.idRegistro);

                                            // 1. Delete from backend
                                            await axios.delete(`${API_URL}/registro_temporal/${itemToDelete.idRegistro}/`, {
                                                headers: { 'X-CSRFToken': csrftoken },
                                                withCredentials: true,
                                            });

                                            // 2. Clear cache if necessary
                                            if (instrucciones.length === 1 || indexToDelete === 0) {
                                                localStorage.removeItem("oficina_instrucciones");
                                                localStorage.removeItem("fecha_inicio_instrucciones");
                                                setSetupData(prev => ({ ...prev, oficina: "", fecha_inicio: "" }));
                                            }

                                            // 3. Shift indices of subsequent items
                                            const remainingItems = instrucciones.filter(i => i.idRegistro !== itemToDelete.idRegistro);
                                            const itemsToUpdate = remainingItems.slice(indexToDelete);

                                            if (itemsToUpdate.length > 0) {
                                                const updatePromises = itemsToUpdate.map((item, idx) => {
                                                    const newSequence = String(indexToDelete + idx + 1).padStart(2, '0');
                                                    const newClave = item.claveAcuerdo.substring(0, 1) + newSequence + item.claveAcuerdo.substring(3);

                                                    // Update item in place for state update later
                                                    item.claveAcuerdo = newClave;

                                                    return axios.put(`${API_URL}/registro_temporal/${item.idRegistro}/`,
                                                        {
                                                            ...item,
                                                            claveAcuerdo: newClave,
                                                            area: item.area.map(a => a.idArea || a.id || a.pk),
                                                            rubro: item.rubro.map(r => r.idRubro || r.id)
                                                        },
                                                        { headers: { 'X-CSRFToken': csrftoken }, withCredentials: true }
                                                    );
                                                });
                                                await Promise.all(updatePromises);
                                            }

                                            // 4. Update UI
                                            setInstrucciones([...remainingItems]);
                                            setDeleteModalOpen(false);
                                            setItemToDelete(null);
                                            alert("Registro eliminado y secuencia actualizada correctamente");
                                        } catch (error) {
                                            console.error("Error deleting:", error);
                                            alert("Error al eliminar el registro");
                                        }
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Agregar Instrucción Button */}
            <div className="mt-4">
                <button
                    className="bg-[#B0B0B0] hover:bg-gray-400 text-gray-800 font-medium py-2 px-8 rounded-md shadow-sm transition-colors"
                    onClick={handleAggregateClick}
                >
                    Agregar instrucción
                </button>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex space-x-12">
                <button
                    className="bg-[#2F5245] flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-bold text-xl shadow-md hover:bg-[#1a3a30] transition-colors"
                    onClick={() => setSaveModal1Open(true)}
                >
                    <div className="bg-white rounded-full p-0.5">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8M8 12h8" />
                        </svg>
                    </div>
                    <span>Guardar</span>
                </button>

                <button
                    className="bg-[#2F5245] flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-bold text-xl shadow-md hover:bg-[#1a3a30] transition-colors"
                    onClick={() => {
                        window.location.href = API_URL.replace('/api', '/descargar-reporte/');
                    }}
                >
                    <div className="bg-white rounded-full p-0.5">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8M8 12h8" />
                        </svg>
                    </div>
                    <span>Word</span>
                </button>
            </div>

            {/* Save Confirmation Modal 1 */}
            {saveModal1Open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            onClick={() => setSaveModal1Open(false)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-2xl font-bold text-[#1a4a3b] mb-4 text-center">Finalizar Cedula de Instrucciones</h3>
                        <p className="text-gray-600 text-center mb-8">
                            Ha terminado de generar la Cedula de Instrucciones. ¿Desea proceder con el guardado definitivo de la información?
                        </p>

                        <div className="flex justify-center">
                            <button
                                className="bg-[#2F5245] hover:bg-[#1a3a30] text-white font-bold py-3 px-12 rounded-full transition-colors shadow-lg"
                                onClick={() => {
                                    setSaveModal1Open(false);
                                    setSaveModal2Open(true);
                                }}
                            >
                                Proceder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Confirmation Modal 2 (Formal Warning) */}
            {saveModal2Open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl border-t-4 border-[#8B0000]">
                        <h3 className="text-2xl font-bold text-[#8B0000] mb-4 text-center uppercase tracking-wider">Aviso de Permanencia</h3>
                        <p className="text-gray-700 text-center mb-8 leading-relaxed font-medium">
                            Una vez confirmada esta acción, los registros serán procesados formalmente en el sistema y no será posible deshacer los cambios efectuados. ¿Está seguro de que desea continuar con el guardado definitivo?
                        </p>

                        <div className="flex justify-center space-x-4">
                            <button
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-8 rounded-full transition-colors"
                                onClick={() => {
                                    setSaveModal2Open(false);
                                    setSaveModal1Open(false);
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="bg-[#8B0000] hover:bg-red-800 text-white font-bold py-2 px-8 rounded-full transition-colors shadow-md"
                                onClick={() => {
                                    // Final action: Redirect to home
                                    // window.location.href = "/";
                                    window.location.href = API_URL.replace('/api', '/guardar-reporte/');
                                }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
