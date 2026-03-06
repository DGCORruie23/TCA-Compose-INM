import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from 'js-cookie';
import { API_URL } from "../values/apis";

export default function Reportes() {
    const [informes, setInformes] = useState([]);
    const [loadingInformes, setLoadingInformes] = useState(true);
    const [uploadingId, setUploadingId] = useState(null);
    const fileInputRef = useRef(null);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const csrftoken = Cookies.get('csrftoken');

    const fetchInformes = async () => {
        try {
            const res = await axios.get(`${API_URL}/reporte_final/`);
            setInformes(res.data || []);
        } catch (err) {
            console.error("Error fetching informes:", err);
        } finally {
            setLoadingInformes(false);
        }
    };

    useEffect(() => {
        fetchInformes();
    }, []);

    const handleUploadClick = (reportId) => {
        setSelectedReportId(reportId);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedReportId) return;

        const formData = new FormData();
        formData.append("archivo_firmado", file);
        formData.append("firmado", "true");

        setUploadingId(selectedReportId);

        try {
            await axios.patch(`${API_URL}/reporte_final/${selectedReportId}/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "X-CSRFToken": csrftoken,
                },
                withCredentials: true,
            });
            await fetchInformes();
            alert("Documento firmado subido correctamente");
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Error al subir el documento firmado");
        } finally {
            setUploadingId(null);
            setSelectedReportId(null);
            e.target.value = ""; // Reset input
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-screen bg-[#F0EADD] pb-20 items-center overflow-y-auto font-sans">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
            />

            {/* Header */}
            <div className="pt-8 pb-8 relative w-11/12 max-w-6xl flex justify-center items-center">
                <h2 className="text-3xl font-bold text-[#1a4a3b]">Reportes</h2>
            </div>

            {/* Main Content Area */}
            <div className="w-11/12 max-w-6xl flex flex-col md:flex-row gap-8 px-4 pb-10">

                {/* Left Container: Cedulas de informacion */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-[#1a4a3b] mb-4 text-center">Cedulas de informacion</h3>
                    <div className="bg-[#C0C0C0] rounded-3xl shadow-lg p-6 min-h-[500px] border-t-4 border-[#2F5245] space-y-4">
                        <p className="text-gray-600 text-center italic mt-10">Sección en desarrollo...</p>
                    </div>
                </div>

                {/* Right Container: Informes finales */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-[#1a4a3b] mb-4 text-center">Informes finales</h3>
                    <div className="bg-[#C0C0C0] rounded-3xl shadow-lg p-6 min-h-[500px] border-t-4 border-[#2F5245] space-y-4">
                        {loadingInformes ? (
                            <p className="text-gray-600 text-center italic mt-10">Cargando informes finales...</p>
                        ) : informes.length === 0 ? (
                            <p className="text-gray-600 text-center italic mt-10">No hay informes generados.</p>
                        ) : (
                            informes.map((item) => (
                                <div key={item.idReporte} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-inm-marron-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-[#1a4a3b] text-lg">Reporte {item.clave}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(item.fecha_generacion)}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.firmado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.firmado ? 'Firmado' : 'Pendiente'}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                className="text-[#1a4a3b] hover:underline flex items-center space-x-1"
                                                onClick={() => item.archivo && window.open(item.archivo, '_blank')}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <span>Documento</span>
                                            </button>

                                            {item.archivo_firmado ? (
                                                <button
                                                    className="text-inm-marron-200 hover:underline flex items-center space-x-1"
                                                    onClick={() => window.open(item.archivo_firmado, '_blank')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    <span>Firmado</span>
                                                </button>
                                            ) : (
                                                <button
                                                    className="text-inm-marron-200 hover:underline flex items-center space-x-1 disabled:opacity-50"
                                                    onClick={() => handleUploadClick(item.idReporte)}
                                                    disabled={uploadingId === item.idReporte}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    <span>{uploadingId === item.idReporte ? "Subiendo..." : "Subir Firmado"}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
