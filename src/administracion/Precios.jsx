import React, { useState } from "react";
import ModificarOpciones from "./modificarOpciones";
import "./administracion.css";

function Precios({ alVolver }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // 1. Pasamos la lista al estado para que sea editable
  const [listaCategorias] = useState([
    { id: "bebidas", nombre: "Bebidas" },
    { id: "cafe", nombre: "Café" },
    { id: "desayuno", nombre: "Desayuno" },
    { id: "frappe", nombre: "Frappe" },
    { id: "licuados", nombre: "Licuados" },
    { id: "panificacion", nombre: "Panificación" },
    { id: "picadas", nombre: "Picadas" },
    { id: "pizza", nombre: "Pizzas" },
    { id: "postres", nombre: "Postres" },
    { id: "waffles", nombre: "Waffles" },
  ]);

  if (categoriaSeleccionada) {
    return (
      <ModificarOpciones
        categoria={categoriaSeleccionada}
        alVolver={() => setCategoriaSeleccionada(null)}
      />
    );
  }

  return (
    <div className="precios-container">
      <header className="superior">
        <h2>PRECIOS</h2>
      </header>

      <div className="cuerpo">
        {listaCategorias.map((cat) => (
          <p
            key={cat.id}
            className={`opciones ${cat.id}`}
            //Al hacer click: Guardamos la categoria en el estado
            onClick={() => setCategoriaSeleccionada(cat)}
          >
            {cat.nombre}
          </p>
        ))}
      </div>
    </div>
  );
}

export default Precios;
