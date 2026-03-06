import React, { useEffect, useState } from "react";
import { API_URL } from "../values/apis"

export default function Respuestas({ formularioId }) {
  const [formulario, setFormulario] = useState(null);
  const [respuestas, setRespuestas] = useState({});

  useEffect(() => {
    const fetchFormulario = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/formularios/${formularioId}/`
        );
        const data = await res.json();
        setFormulario(data);
      } catch (error) {
        console.error("Error al cargar formulario:", error);
      }
    };
    fetchFormulario();
  }, [formularioId]);

  const handleChange = (preguntaId, value, comentario = null) => {
    setRespuestas({
      ...respuestas,
      [preguntaId]: { respuesta: value, comentario },
    });
  };

  const handleComentario = (preguntaId, comentario) => {
    setRespuestas({
      ...respuestas,
      [preguntaId]: {
        ...(respuestas[preguntaId] || {}),
        comentario,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Respuestas enviadas:", respuestas);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/formularios/${formularioId}/responder/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ respuestas }),
        }
      );
      if (res.ok) {
        alert("Formulario contestado con éxito ✅");
        setRespuestas({});
      } else {
        alert("Error al enviar respuestas ❌");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  if (!formulario) return <p className="p-4">Cargando formulario...</p>;

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">{formulario.titulo}</h2>

      {formulario.secciones.map((seccion) => (
        <div key={seccion.id} className="border p-4 rounded bg-gray-50">
          <h3 className="text-xl font-semibold">{seccion.titulo}</h3>

          {seccion.subsecciones.map((sub) => (
            <div key={sub.id} className="ml-6 mt-3 border-l-2 pl-4">
              <h4 className="text-lg font-bold uppercase">{sub.titulo}</h4>

              {sub.preguntas.map((pregunta) => (
                <div
                  key={pregunta.id}
                  className="ml-6 mt-2 p-2 border-b border-gray-300"
                >
                  <label className="block font-medium">
                    {pregunta.texto}
                  </label>

                  {/* TIPOS DE PREGUNTA */}
                  {pregunta.tipo === "SI_NO" && (
                    <select
                      className="border p-2 mt-1"
                      value={respuestas[pregunta.id]?.respuesta || ""}
                      onChange={(e) =>
                        handleChange(pregunta.id, e.target.value)
                      }
                    >
                      <option value="">Selecciona...</option>
                      <option value="SI">Sí</option>
                      <option value="NO">No</option>
                    </select>
                  )}

                  {pregunta.tipo === "ESCALA" && (
                    <select
                      className="border p-2 mt-1"
                      value={respuestas[pregunta.id]?.respuesta || ""}
                      onChange={(e) =>
                        handleChange(pregunta.id, e.target.value)
                      }
                    >
                      <option value="">Selecciona...</option>
                      <option value="BUENO">Bueno</option>
                      <option value="REGULAR">Regular</option>
                      <option value="MALO">Malo</option>
                    </select>
                  )}

                  {pregunta.tipo === "TEXTO" && (
                    <textarea
                      className="border p-2 w-full mt-1"
                      rows="2"
                      value={respuestas[pregunta.id]?.respuesta || ""}
                      onChange={(e) =>
                        handleChange(pregunta.id, e.target.value)
                      }
                    />
                  )}

                  {/* Comentario opcional */}
                  <textarea
                    className="border p-2 w-full mt-2 text-sm"
                    rows="2"
                    placeholder="Comentario (opcional)"
                    value={respuestas[pregunta.id]?.comentario || ""}
                    onChange={(e) =>
                      handleComentario(pregunta.id, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded mt-4"
      >
        Enviar respuestas
      </button>
    </form>
  );
}
