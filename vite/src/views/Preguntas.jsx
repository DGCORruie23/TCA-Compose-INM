import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../values/apis"

export default function FormulariosList({ onEdit }) {
  const [formularios, setFormularios] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/formularios/`) // ajusta tu endpoint
      .then(res => setFormularios(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6 w-full h-full overflow-y-auto">
      <h1 className="text-xl font-bold mb-4">📋 Formularios disponibles</h1>

      {formularios.length === 0 ? (
        <p>No hay formularios aún.</p>
      ) : (
        <ul className="space-y-3">
          {formularios.map(f => (
            <li
              key={f.id}
              className="border p-3 rounded-lg flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <h2 className="font-semibold">{f.titulo}</h2>
                <p className="text-sm text-gray-600">
                  {f.descripcion || "Sin descripción"}
                </p>
              </div>
              <button
                onClick={() => onEdit(f)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
