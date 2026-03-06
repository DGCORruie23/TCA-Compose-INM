import { useState } from "react";
import { API_URL } from "../values/apis"

function CrearPregunta() {
  const [texto, setTexto] = useState("");
  // const API_BASE = "http://127.0.0.1:8000/api";
  const API_BASE = API_URL;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!texto.trim()) return;

    const res = await fetch(`${API_BASE}/preguntas/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    const nueva = await res.json();

    // crear validación default
    await fetch(`${API_BASE}/validaciones/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: nueva.id, es_cierta: false }),
    });

    alert("Pregunta creada ✅");
    setTexto("");
  }

  return (
    <div>
      <h2>➕ Crear nueva pregunta</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Escribe tu pregunta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}

export default CrearPregunta;
