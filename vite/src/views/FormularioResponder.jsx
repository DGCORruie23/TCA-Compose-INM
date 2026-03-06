import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from 'js-cookie';
import { API_URL } from "../values/apis"

// const API_URL = "http://192.168.0.12:8000/api"; // ajustar si se utiliza en 0.0.0.0
// const API_URL = "http://localhost:8000/api"; // ajustar si se utiliza en 0.0.0.0

export default function FormularioResponder({ formularioId, usuario, respuestaId, onBack }) {
  const [formulario, setFormulario] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [oficina, setOficina] = useState("");
  const [comentario, setComentario] = useState("");
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [missingSections, setMissingSections] = useState([]);

  const [oficinas, setOficinas] = useState([
    'AGUASCALIENTES', 'BAJA CALIFORNIA', "BAJA CALIFORNIA SUR", "CAMPECHE",
    "COAHUILA", "COLIMA", "CHIAPAS", "CHIHUAHUA", "CIUDAD DE MEXICO", "DURANGO", "GUERRERO",
    "HIDALGO", "JALISCO", "ESTADO DE MEXICO", "MICHOACAN", "MORELOS", "NAYARIT", "NUEVO LEON",
    "OAXACA", "PUEBLA", "QUERETARO", "QUINTANA ROO", "SAN LUIS POTOSI", "SINALOA", "SONORA",
    "TABASCO", "TAMAULIPAS", "TLAXCALA", "VERACRUZ", "YUCATAN", "ZACATECAS"]);

  const csrftoken = Cookies.get('csrftoken');

  // Cargar formulario y datos guardados
  useEffect(() => {
    // 1. Cargar estructura del formulario
    axios
      .get(`${API_URL}/formularios/ultimo/`)
      .then((res) => {
        setFormulario(res.data);
        const initialExpanded = {};
        res.data.secciones.forEach(sec => {
          initialExpanded[sec.id] = true;
        });
        setExpandedSections(initialExpanded);

        // 2. Si hay respuestaId (Modo Edición), cargar datos de la API
        if (respuestaId) {
          axios.get(`${API_URL}/respuestas/${respuestaId}/`)
            .then(resRespuesta => {
              const data = resRespuesta.data;
              setOficina(data.oficina);
              setComentario(data.descripcion);

              // Transformar array de respuestas a objeto
              const respuestasObj = {};
              data.respuestas.forEach(r => {
                respuestasObj[r.pregunta] = {
                  valor: r.valor,
                  comentario: r.comentario,
                  habilitada: r.habilitada
                };
              });
              setRespuestas(respuestasObj);
            })
            .catch(err => console.error("Error cargando respuesta:", err));
        }
        // 3. Si NO hay respuestaId (Modo Nuevo), cargar de localStorage
        else {
          const savedData = localStorage.getItem(`formulario_progress_${formularioId}`);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.respuestas) setRespuestas(parsedData.respuestas);
            if (parsedData.oficina) setOficina(parsedData.oficina);
            if (parsedData.comentario) setComentario(parsedData.comentario);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [formularioId, respuestaId]);

  // Guardar progreso en localStorage (SOLO si no estamos editando)
  useEffect(() => {
    if (formularioId && !respuestaId) {
      const dataToSave = {
        respuestas,
        oficina,
        comentario
      };
      localStorage.setItem(`formulario_progress_${formularioId}`, JSON.stringify(dataToSave));
    }
  }, [respuestas, oficina, comentario, formularioId]);

  // Cambiar respuesta
  const handleRespuesta = (id, campo, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: valor,
      },
    }));
  };

  // Toggle habilitada
  const toggleHabilitada = (id) => {
    setRespuestas((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        habilitada: !(prev[id]?.habilitada ?? true),
      },
    }));
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const missing = [];
    formulario.secciones.forEach((seccion) => {
      // Si la sección está deshabilitada, no cuenta
      if (respuestas[`seccion-${seccion.id}`]?.habilitada === false) return;

      const subseccionesHabilitadas = seccion.subsecciones.filter(
        (sub) => respuestas[`sub-${sub.id}`]?.habilitada !== false
      );

      const subseccionesCompletas = subseccionesHabilitadas.filter((sub) => {
        const totalPreguntas = sub.preguntas.filter(
          (p) => respuestas[p.id]?.habilitada !== false
        ).length;
        const contestadas = sub.preguntas.filter(
          (p) =>
            respuestas[p.id]?.valor && respuestas[p.id]?.habilitada !== false
        ).length;
        return totalPreguntas > 0 && contestadas >= totalPreguntas;
      }).length;

      if (subseccionesCompletas < subseccionesHabilitadas.length) {
        missing.push(seccion.titulo);
      }
    });

    setMissingSections(missing);
    return missing.length === 0;
  };

  // Enviar respuestas
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setShowValidationModal(true);
      return;
    }

    const payload = {
      formulario: formularioId,
      usuario: usuario || "Anonimo",
      oficina: oficina,
      descripcion: comentario || "Sin comentarios generales",
      respuestas: Object.entries(respuestas)
        .filter(([key]) => /^\d+$/.test(key))
        .map(([preguntaId, datos]) => ({
          pregunta: parseInt(preguntaId),
          valor: datos.valor || null,
          comentario: datos.comentario || "",
          habilitada: datos.habilitada !== false,
        })),
    };

    try {
      if (respuestaId) {
        // Modo Edición: PUT
        await axios.put(`${API_URL}/respuestas/${respuestaId}/`, payload, {
          headers: { 'X-CSRFToken': csrftoken },
          withCredentials: true,
        });
        alert("Formulario actualizado ✅");
        if (onBack) onBack();
      } else {
        // Modo Nuevo: POST
        await axios.post(`${API_URL}/respuestas/`, payload, {
          headers: { 'X-CSRFToken': csrftoken },
          withCredentials: true,
        });
        alert("Formulario enviado ✅");
        setRespuestas({});
        setOficina("");
        setComentario("");
        localStorage.removeItem(`formulario_progress_${formularioId}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar ❌");
    }
  };

  // Borrar progreso
  const handleClearProgress = () => {
    setShowClearModal(true);
  };

  // Confirmar borrado
  const confirmClearProgress = () => {
    // 1. Borrar del localStorage
    localStorage.removeItem(`formulario_progress_${formularioId}`);

    // 2. Cerrar modal
    setShowClearModal(false);

    // 3. Recargar la página para reiniciar la aplicación y que VistaLlenar detecte que no hay datos
    // Importante: No reseteamos el estado aquí (setRespuestas, etc.) para evitar que el useEffect
    // de auto-guardado se dispare y vuelva a guardar un objeto vacío antes de la recarga.
    window.location.reload();
  };

  if (!formulario) return <p>Cargando...</p>;
  if (formulario.length === 0) return <p>No hay formularios aún.</p>;

  // VISTA DE PREGUNTAS (SUBSECCIÓN ACTIVA)
  if (activeSubsection) {
    return (
      <div className="p-6 space-y-6 bg-gray-100 min-h-full">
        <button
          onClick={() => setActiveSubsection(null)}
          className="text-blue-600 underline mb-4"
        >
          ← Volver a las secciones
        </button>

        <h3 className="text-xl font-semibold text-center mt-[10px]">
          {activeSubsection.titulo}
        </h3>

        <div className="space-y-6">
          {activeSubsection.preguntas.map((preg) => {
            const pregDisabled = respuestas[preg.id]?.habilitada === false;

            return (
              <div key={preg.id} className="p-4 bg-white rounded shadow">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">{preg.texto}</p>
                  <label className="flex items-center gap-2 text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={pregDisabled}
                      onChange={() => toggleHabilitada(preg.id)}
                    />
                    No aplica
                  </label>
                </div>

                {!pregDisabled && (
                  <div className="mt-2 space-y-3">
                    {preg.tipo === "SI_NO" && (
                      <select
                        value={respuestas[preg.id]?.valor || ""}
                        onChange={(e) =>
                          handleRespuesta(preg.id, "valor", e.target.value)
                        }
                        className="border p-2 rounded w-full"
                      >
                        <option value="">Selecciona...</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    )}

                    {preg.tipo === "VALORACION" && (
                      <select
                        value={respuestas[preg.id]?.valor || ""}
                        onChange={(e) =>
                          handleRespuesta(preg.id, "valor", e.target.value)
                        }
                        className="border p-2 rounded w-full"
                      >
                        <option value="">Selecciona...</option>
                        <option value="bueno">Bueno</option>
                        <option value="regular">Regular</option>
                        <option value="malo">Malo</option>
                      </select>
                    )}

                    {preg.tipo === "COMENTARIO" && (
                      <textarea
                        value={respuestas[preg.id]?.comentario || ""}
                        onChange={(e) =>
                          handleRespuesta(preg.id, "comentario", e.target.value)
                        }
                        placeholder="Escribe tu comentario..."
                        className="border p-2 rounded w-full"
                      />
                    )}

                    {preg.tipo !== "COMENTARIO" && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600">
                          Observaciones
                        </summary>
                        <textarea
                          value={respuestas[preg.id]?.comentario || ""}
                          onChange={(e) =>
                            handleRespuesta(preg.id, "comentario", e.target.value)
                          }
                          placeholder="Comentario adicional"
                          className="border p-2 rounded w-full mt-1"
                        />
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => setActiveSubsection(null)}
            className="w-full bg-inm-marron-200 hover:bg-inm-marron-100 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 font-bold"
          >
            GUARDAR / REGRESAR
          </button>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL (LISTADO DE SECCIONES)
  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-full relative">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-center mt-[10px]">{formulario.titulo} {respuestaId ? `(Editando)` : ""}</h2>

        {/* DATOS GENERALES */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <select
              value={oficina}
              onChange={(e) => setOficina(e.target.value)}
              className="border p-2 rounded w-full text-center bg-inm-rojo-200 text-white font-semibold"
            >
              <option value="">Oficina de Representación</option>
              {oficinas.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentarios"
            className="border p-2 rounded w-full"
          />
        </div>

        {/* LISTADO DE SECCIONES Y SUBSECCIONES */}
        <div className="space-y-6">
          {formulario.secciones.map((seccion) => {
            const secDisabled = respuestas[`seccion-${seccion.id}`]?.habilitada === false;
            const isExpanded = expandedSections[seccion.id];

            // Calcular progreso de la sección
            const subseccionesHabilitadas = seccion.subsecciones.filter(
              (sub) => respuestas[`sub-${sub.id}`]?.habilitada !== false
            );

            const subseccionesCompletas = subseccionesHabilitadas.filter((sub) => {
              const totalPreguntas = sub.preguntas.filter(
                (p) => respuestas[p.id]?.habilitada !== false
              ).length;
              const contestadas = sub.preguntas.filter(
                (p) =>
                  respuestas[p.id]?.valor && respuestas[p.id]?.habilitada !== false
              ).length;
              return totalPreguntas > 0 && contestadas >= totalPreguntas;
            }).length;

            return (
              <div key={seccion.id} className="bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div
                  className="bg-gray-300 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-400 transition-colors"
                  onClick={() => toggleSection(seccion.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    <h3 className="font-bold text-gray-800">{seccion.titulo}</h3>
                  </div>
                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <span className={`py-4 font-bold text-xl  ${subseccionesCompletas < subseccionesHabilitadas.length
                      ? "text-inm-rojo-100/90 font-bold text-lg"
                      : "text-inm-verde-200 font-bold text-md"
                      }`}
                    >
                      {subseccionesCompletas}/{subseccionesHabilitadas.length}
                    </span>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={secDisabled}
                        onChange={() => toggleHabilitada(`seccion-${seccion.id}`)}
                      />
                      No aplica
                    </label>
                  </div>
                </div>

                {isExpanded && !secDisabled && (
                  <div className="p-3 space-y-3">
                    {seccion.subsecciones.map((sub) => {
                      const subDisabled = respuestas[`sub-${sub.id}`]?.habilitada === false;

                      // Calcular progreso de la subsección
                      const totalPreguntas = sub.preguntas.filter(
                        (p) => respuestas[p.id]?.habilitada !== false
                      ).length;
                      const contestadas = sub.preguntas.filter(
                        (p) =>
                          respuestas[p.id]?.valor && respuestas[p.id]?.habilitada !== false
                      ).length;

                      const isComplete = totalPreguntas > 0 && contestadas >= totalPreguntas;

                      return (
                        <div key={sub.id} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-700">{sub.titulo}</h4>
                            {!subDisabled && (
                              <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-orange-500'}`}>
                                {isComplete ? 'Completada' : 'Pendiente'} ({contestadas}/{totalPreguntas})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 text-xs text-gray-500">
                              <input
                                type="checkbox"
                                checked={subDisabled}
                                onChange={() => toggleHabilitada(`sub-${sub.id}`)}
                              />
                              N/A
                            </label>
                            {!subDisabled && (
                              <button
                                type="button"
                                onClick={() => setActiveSubsection(sub)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                Llenar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-6 pb-20 flex flex-col gap-4">
          <div className="flex gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg shadow hover:bg-gray-600 font-bold text-lg"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="w-full bg-inm-rojo-200 text-white px-6 py-3 rounded-lg shadow hover:bg-red-900 font-bold text-lg"
            >
              {respuestaId ? "Actualizar Respuestas" : "Enviar Respuestas"}
            </button>
          </div>

          {!respuestaId && (
            <button
              type="button"
              onClick={handleClearProgress}
              className="w-full bg-red-100 text-red-700 px-6 py-2 rounded-lg shadow hover:bg-red-200 font-semibold text-sm border border-red-300"
            >
              Borrar Progreso Guardado
            </button>
          )}
        </div>
      </form>

      {/* Modal de Validación */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full m-4">
            <h3 className="text-xl font-bold text-inm-rojo-200 mb-4 flex items-center justify-center gap-2">
              <span className="text-2xl">⚠️</span> Atención <span className="text-2xl">⚠️</span>
            </h3>
            <p className="mb-4 text-gray-700">
              No se puede guardar el formulario porque faltan completar las siguientes secciones:
            </p>
            <ul className="list-disc list-inside mb-6 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded border">
              {missingSections.map((sec, idx) => (
                <li key={idx} className="text-gray-800 font-medium py-1">{sec}</li>
              ))}
            </ul>
            <button
              onClick={() => setShowValidationModal(false)}
              className="w-full bg-inm-marron-200 text-white py-2 rounded hover:bg-inm-marron-100 font-bold transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full m-4">
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <span className="text-2xl">🗑️</span> Borrar Progreso
            </h3>
            <p className="mb-6 text-gray-700">
              ¿Estás seguro de que deseas borrar todo el progreso guardado? <br />
              <span className="font-bold text-red-500">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowClearModal(false)}
                className="w-full bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearProgress}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold transition-colors"
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
