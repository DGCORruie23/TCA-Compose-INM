import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../values/apis";

export default function RevisarFormularios({ onEdit }) {
    const [respuestas, setRespuestas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios
            .get(`${API_URL}/respuestas/`)
            .then((res) => {
                setRespuestas(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Error al cargar los registros.");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6 text-center">Cargando registros...</div>;
    if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

    return (
        <div className="w-full h-full p-6 space-y-6 bg-gray-100 overflow-y-auto">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Registros Guardados</h2>

            {respuestas.length === 0 ? (
                <p className="text-gray-600 text-center">No hay registros guardados aún.</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formulario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oficina</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {respuestas.map((respuesta) => (
                                <tr key={respuesta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{respuesta.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {/* Asumiendo que el serializer devuelve el ID o un objeto. Si es ID, habría que buscar el título. 
                        Por ahora mostramos el ID del formulario si no viene el título. 
                        Idealmente el serializer debería devolver el título o un objeto anidado.
                        Basado en el modelo, es una FK. El serializer por defecto usa PK.
                        Ajustaremos esto si es necesario, por ahora mostramos el valor raw.
                    */}
                                        {respuesta.formulario}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{respuesta.oficina}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{respuesta.usuario || "Anónimo"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(respuesta.fecha).toLocaleDateString()} {new Date(respuesta.fecha).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => onEdit && onEdit(respuesta.id)}
                                            className="text-indigo-600 hover:text-indigo-900 font-bold"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
