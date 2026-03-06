import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../values/apis";
import AutoResizeTextarea from "../components/AutoResizeTextarea";
import Cookies from 'js-cookie';

export default function FormularioBuilder({ existingForm, onBack }) {
  const [formulario, setFormulario] = useState({
    titulo: "",
    secciones: [],
  });

  const csrftoken = Cookies.get('csrftoken');

  useEffect(() => {
    if (existingForm) {
      // Traer los datos completos del formulario (incluyendo secciones y preguntas)
      axios.get(`${API_URL}/formularios/${existingForm.id}/`)
        .then(res => setFormulario(res.data))
        .catch(err => console.error(err));
    }
  }, [existingForm]);

  // Agregar sección
  const agregarSeccion = () => {
    setFormulario({
      ...formulario,
      secciones: [
        ...formulario.secciones,
        { titulo: "", ponderacion: 1, subsecciones: [] },
      ],
    });
  };

  // Eliminar sección
  const eliminarSeccion = (sIndex) => {
    const nuevas = [...formulario.secciones];
    nuevas.splice(sIndex, 1);
    setFormulario({ ...formulario, secciones: nuevas });
  };

  // Agregar subsección
  const agregarSubseccion = (sIndex) => {
    const nuevas = [...formulario.secciones];
    nuevas[sIndex].subsecciones.push({
      titulo: "",
      ponderacion: 1,
      preguntas: [],
    });
    setFormulario({ ...formulario, secciones: nuevas });
  };

  // Eliminar subsección
  const eliminarSubseccion = (sIndex, subIndex) => {
    const nuevas = [...formulario.secciones];
    nuevas[sIndex].subsecciones.splice(subIndex, 1);
    setFormulario({ ...formulario, secciones: nuevas });
  };

  // Agregar pregunta
  const agregarPregunta = (sIndex, subIndex) => {
    const nuevas = [...formulario.secciones];
    nuevas[sIndex].subsecciones[subIndex].preguntas.push({
      texto: "",
      tipo: "SI_NO",
      ponderacion: 1,
    });
    setFormulario({ ...formulario, secciones: nuevas });
  };

  // Eliminar pregunta
  const eliminarPregunta = (sIndex, subIndex, pIndex) => {
    const nuevas = [...formulario.secciones];
    nuevas[sIndex].subsecciones[subIndex].preguntas.splice(pIndex, 1);
    setFormulario({ ...formulario, secciones: nuevas });
  };

  // Guardar formulario en el backend
  const guardarFormulario = async () => {

    if (existingForm) {
      axios.put(`${API_URL}/formularios/${existingForm.id}/`, formulario, {
        headers: {
          'X-CSRFToken': csrftoken,
        },
        withCredentials: true, // Important for sending cookies
      })
        .then(() => alert("Formulario actualizado con éxito ✅"))
        .catch((err) => {
          console.error(err);
          alert("Error al guardar el formulario ❌");
          console.error("Error al guardar:", err.response?.data || err.message);
        })
    } else {
      axios.post(`${API_URL}/formularios/`, formulario, {
        headers: {
          'X-CSRFToken': csrftoken,
        },
        withCredentials: true, // Important for sending cookies
      })
        .then(() => {
          alert("Formulario creado con éxito ✅");
          setFormulario({ titulo: "", descripcion: "", secciones: [] });
        })
        .catch((err) => {
          console.error(err);
          alert("Error al guardar el formulario ❌");
          console.error("Error al guardar:", err.response?.data || err.message);
        })
    }
    // try {
    //   await axios.post(`${API_URL}/formularios/`, formulario);
    //   alert("Formulario guardado con éxito ✅");
    //   setFormulario({ titulo: "", descripcion: "", secciones: [] });
    // } catch (err) {
    //   console.error(err);
    //   alert("Error al guardar el formulario ❌");
    //   console.error("Error al guardar:", err.response?.data || err.message);
    // }
  };

  return (
    <div className="w-full p-6 h-full overflow-y-auto">
      {existingForm &&
        <button onClick={onBack} className="mb-4 text-blue-600 underline">
          ← Volver
        </button>
      }

      <h1 className="text-2xl font-bold mb-4">{existingForm ? "Editar Formulario" : "Nuevo Formulario"}</h1>

      {/* Título */}
      <input
        type="text"
        placeholder="Título del formulario"
        value={formulario.titulo}
        onChange={(e) =>
          setFormulario({ ...formulario, titulo: e.target.value })
        }
        className="border p-2 w-full mb-2"
      />

      {/* Oficina
      <input
        type="text"
        placeholder="Oficina de Representación: "
        value={formulario.oficina}
        onChange={(e) =>
          setFormulario({ ...formulario, oficina: e.target.value })
        }
        className="border p-2 w-full mb-2"
      /> */}

      {/* Secciones */}
      {formulario.secciones.map((sec, sIndex) => (
        <details key={sIndex} className="border p-4 mb-4 rounded bg-gray-50">
          <summary className="flex items-center gap-2">
            <span className="toggle-icon-level1"></span>
            <input
              type="text"
              placeholder="Título de la sección"
              value={sec.titulo}
              onChange={(e) => {
                const nuevas = [...formulario.secciones];
                nuevas[sIndex].titulo = e.target.value.toUpperCase();
                setFormulario({ ...formulario, secciones: nuevas });
              }}
              className="border p-2 flex-1 uppercase font-bold"
            />
            <input
              type="number"
              min="1"
              value={sec.ponderacion}
              onChange={(e) => {
                const nuevas = [...formulario.secciones];
                nuevas[sIndex].ponderacion = parseFloat(e.target.value);
                setFormulario({ ...formulario, secciones: nuevas });
              }}
              className="border p-2 w-24"
            />
            <button
              onClick={() => eliminarSeccion(sIndex)}
              className="text-red-500 font-bold"
            >
              ❌
            </button>
          </summary>

          {/* Subsecciones */}
          {sec.subsecciones.map((sub, subIndex) => (
            <details key={subIndex} className="ml-6 mt-3 border-l-4 pl-4 border-gray-300">
              <summary className="flex items-center gap-2">
                <span className="toggle-icon-level2"></span>

                <AutoResizeTextarea
                  value={sub.titulo}
                  placeholder="Título de la subsección"
                  className="uppercase"
                  onChange={(e) => {
                    const nuevas = [...formulario.secciones];
                    nuevas[sIndex].subsecciones[subIndex].titulo = e.target.value.toUpperCase();
                    setFormulario({ ...formulario, secciones: nuevas });
                  }}
                />
                <input
                  type="number"
                  min="1"
                  value={sub.ponderacion}
                  onChange={(e) => {
                    const nuevas = [...formulario.secciones];
                    nuevas[sIndex].subsecciones[subIndex].ponderacion =
                      parseFloat(e.target.value);
                    setFormulario({ ...formulario, secciones: nuevas });
                  }}
                  className="border p-2 w-24"
                />
                <button
                  onClick={() => eliminarSubseccion(sIndex, subIndex)}
                  className="text-red-500 font-bold"
                >
                  ❌
                </button>
              </summary>

              {/* Preguntas */}
              {sub.preguntas.map((preg, pIndex) => (
                <div key={pIndex} className="ml-6 flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Texto de la pregunta"
                    value={preg.texto}
                    onChange={(e) => {
                      const nuevas = [...formulario.secciones];
                      nuevas[sIndex].subsecciones[subIndex].preguntas[
                        pIndex
                      ].texto = e.target.value;
                      setFormulario({ ...formulario, secciones: nuevas });
                    }}
                    className="border p-2 flex-1"
                  />

                  <select
                    value={preg.tipo}
                    onChange={(e) => {
                      const nuevas = [...formulario.secciones];
                      nuevas[sIndex].subsecciones[subIndex].preguntas[
                        pIndex
                      ].tipo = e.target.value;
                      setFormulario({ ...formulario, secciones: nuevas });
                    }}
                    className="border p-2"
                  >
                    <option value="SI_NO">Sí/No + Observación</option>
                    <option value="VALORACION">
                      Bueno / Regular / Malo + Observación
                    </option>
                    <option value="COMENTARIO">Datos + Observación</option>
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={preg.ponderacion}
                    onChange={(e) => {
                      const nuevas = [...formulario.secciones];
                      nuevas[sIndex].subsecciones[subIndex].preguntas[
                        pIndex].tipo = parseFloat(e.target.value);
                      setFormulario({ ...formulario, secciones: nuevas });
                    }}
                    className="border p-2 w-24"
                  />

                  <button
                    onClick={() => eliminarPregunta(sIndex, subIndex, pIndex)}
                    className="text-red-500 font-bold"
                  >
                    ❌
                  </button>
                </div>
              ))}

              <button
                onClick={() => agregarPregunta(sIndex, subIndex)}
                className="mt-2 text-sm text-blue-500"
              >
                + Agregar pregunta
              </button>
            </details>
          ))}

          <button
            onClick={() => agregarSubseccion(sIndex)}
            className="mt-2 text-sm text-green-500"
          >
            + Agregar subsección
          </button>
        </details>
      ))}

      <button
        onClick={agregarSeccion}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        + Agregar sección
      </button>

      <br />
      <button
        onClick={guardarFormulario}
        className="bg-green-600 text-white px-4 py-2 rounded mt-4"
      >
        {existingForm ? "Actualizar formulario" : "Guardar formulario"}
      </button>
    </div>
  );
}

// import React, { useState } from "react";

// export default function FormularioBuilder() {
//   const [formulario, setFormulario] = useState({
//     titulo: "",
//     secciones: [],
//   });

//   const handleChange = (e) => {
//     setFormulario({ ...formulario, [e.target.name]: e.target.value });
//   };

//   const addSeccion = () => {
//     setFormulario({
//       ...formulario,
//       secciones: [
//         ...formulario.secciones,
//         { titulo: "", ponderador: 1, subsecciones: [] },
//       ],
//     });
//   };

//   const removeSeccion = (index) => {
//     const nuevas = [...formulario.secciones];
//     nuevas.splice(index, 1);
//     setFormulario({ ...formulario, secciones: nuevas });
//   };

//   const addSubseccion = (sIndex) => {
//     const nuevas = [...formulario.secciones];
//     nuevas[sIndex].subsecciones.push({
//       titulo: "",
//       ponderador: 1,
//       preguntas: [],
//     });
//     setFormulario({ ...formulario, secciones: nuevas });
//   };

//   const removeSubseccion = (sIndex, subIndex) => {
//     const nuevas = [...formulario.secciones];
//     nuevas[sIndex].subsecciones.splice(subIndex, 1);
//     setFormulario({ ...formulario, secciones: nuevas });
//   };

//   const addPregunta = (sIndex, subIndex) => {
//     const nuevas = [...formulario.secciones];
//     nuevas[sIndex].subsecciones[subIndex].preguntas.push({
//       texto: "",
//       tipo: "SI_NO",
//       ponderador: 1,
//     });
//     setFormulario({ ...formulario, secciones: nuevas });
//   };

//   const removePregunta = (sIndex, subIndex, pIndex) => {
//     const nuevas = [...formulario.secciones];
//     nuevas[sIndex].subsecciones[subIndex].preguntas.splice(pIndex, 1);
//     setFormulario({ ...formulario, secciones: nuevas });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("Formulario listo para enviar:", formulario);

//     try {
//       const res = await fetch("http://127.0.0.1:8000/api/formularios/", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formulario),
//       });
//       if (res.ok) {
//         alert("Formulario creado correctamente 🚀");
//         setFormulario({ titulo: "", secciones: [] });
//       }
//     } catch (error) {
//       console.error("Error al enviar formulario", error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="p-4 space-y-4">
//       <h2 className="text-xl font-bold">Crear Formulario</h2>

//       <input
//         type="text"
//         name="titulo"
//         value={formulario.titulo}
//         onChange={handleChange}
//         placeholder="Título del formulario"
//         className="border p-2 w-full"
//       />

//       <button
//         type="button"
//         onClick={addSeccion}
//         className="bg-blue-500 text-white px-4 py-2 rounded"
//       >
//         + Agregar Sección
//       </button>

//       <div className="space-y-4">
//         {formulario.secciones.map((seccion, sIndex) => (
//           <div key={sIndex} className="border p-3 rounded bg-gray-50">
//             <div className="flex justify-between items-center">
//               <input
//                 type="text"
//                 placeholder="Título de la sección"
//                 value={seccion.titulo}
//                 onChange={(e) => {
//                   const nuevas = [...formulario.secciones];
//                   nuevas[sIndex].titulo = e.target.value.toUpperCase();
//                   setFormulario({ ...formulario, secciones: nuevas });
//                 }}
//                 className="border p-2 flex-1 uppercase font-bold"
//               />
//               <input
//                 type="number"
//                 value={seccion.ponderador}
//                 onChange={(e) => {
//                   const nuevas = [...formulario.secciones];
//                   nuevas[sIndex].ponderador = Number(e.target.value);
//                   setFormulario({ ...formulario, secciones: nuevas });
//                 }}
//                 className="border p-2 w-24 ml-2"
//                 min="1"
//               />
//               <button
//                 type="button"
//                 onClick={() => removeSeccion(sIndex)}
//                 className="text-red-500 font-bold ml-2"
//               >
//                 ❌
//               </button>
//             </div>

//             <button
//               type="button"
//               onClick={() => addSubseccion(sIndex)}
//               className="bg-green-500 text-white px-2 py-1 mt-2 rounded"
//             >
//               + Agregar Subsección
//             </button>

//             <div className="ml-6 mt-2 space-y-2">
//               {seccion.subsecciones.map((sub, subIndex) => (
//                 <div key={subIndex} className="border p-2 rounded bg-gray-100">
//                   <div className="flex justify-between items-center">
//                     <input
//                       type="text"
//                       placeholder="Título de la subsección"
//                       value={sub.titulo}
//                       onChange={(e) => {
//                         const nuevas = [...formulario.secciones];
//                         nuevas[sIndex].subsecciones[subIndex].titulo =
//                           e.target.value.toUpperCase();
//                         setFormulario({ ...formulario, secciones: nuevas });
//                       }}
//                       className="border p-2 flex-1 uppercase"
//                     />
//                     <input
//                       type="number"
//                       value={sub.ponderador}
//                       onChange={(e) => {
//                         const nuevas = [...formulario.secciones];
//                         nuevas[sIndex].subsecciones[subIndex].ponderador =
//                           Number(e.target.value);
//                         setFormulario({ ...formulario, secciones: nuevas });
//                       }}
//                       className="border p-2 w-24 ml-2"
//                       min="1"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeSubseccion(sIndex, subIndex)}
//                       className="text-red-500 font-bold ml-2"
//                     >
//                       ❌
//                     </button>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() => addPregunta(sIndex, subIndex)}
//                     className="bg-purple-500 text-white px-2 py-1 mt-2 rounded"
//                   >
//                     + Agregar Pregunta
//                   </button>

//                   <div className="ml-6 mt-2 space-y-2">
//                     {sub.preguntas.map((preg, pIndex) => (
//                       <div
//                         key={pIndex}
//                         className="border p-2 rounded bg-white flex items-center"
//                       >
//                         <input
//                           type="text"
//                           placeholder="Texto de la pregunta"
//                           value={preg.texto}
//                           onChange={(e) => {
//                             const nuevas = [...formulario.secciones];
//                             nuevas[sIndex].subsecciones[subIndex].preguntas[
//                               pIndex
//                             ].texto = e.target.value;
//                             setFormulario({
//                               ...formulario,
//                               secciones: nuevas,
//                             });
//                           }}
//                           className="border p-2 flex-1"
//                         />
//                         <select
//                           value={preg.tipo}
//                           onChange={(e) => {
//                             const nuevas = [...formulario.secciones];
//                             nuevas[sIndex].subsecciones[subIndex].preguntas[
//                               pIndex
//                             ].tipo = e.target.value;
//                             setFormulario({
//                               ...formulario,
//                               secciones: nuevas,
//                             });
//                           }}
//                           className="border p-2 ml-2"
//                         >
//                           <option value="SI_NO">Sí / No</option>
//                           <option value="ESCALA">Bueno / Regular / Malo</option>
//                           <option value="TEXTO">Texto</option>
//                         </select>
//                         <input
//                           type="number"
//                           value={preg.ponderador}
//                           onChange={(e) => {
//                             const nuevas = [...formulario.secciones];
//                             nuevas[sIndex].subsecciones[subIndex].preguntas[
//                               pIndex
//                             ].ponderador = Number(e.target.value);
//                             setFormulario({
//                               ...formulario,
//                               secciones: nuevas,
//                             });
//                           }}
//                           className="border p-2 w-20 ml-2"
//                           min="1"
//                         />
//                         <button
//                           type="button"
//                           onClick={() =>
//                             removePregunta(sIndex, subIndex, pIndex)
//                           }
//                           className="text-red-500 font-bold ml-2"
//                         >
//                           ❌
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>

//       <button
//         type="submit"
//         className="bg-blue-600 text-white px-6 py-2 rounded mt-4"
//       >
//         Guardar Formulario
//       </button>
//     </form>
//   );
// }
