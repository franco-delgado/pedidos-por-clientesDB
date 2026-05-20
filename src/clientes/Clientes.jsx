import { useState } from "react";
// import { useParams } from "react-router-dom"; // <-- DESCOMENTAR EN PRODUCCIÓN
import OpcionesPedidos from "./OpcionesPedidos";
import Cuenta from "./Cuenta";
import Footer from "../Footer";
import "./Clientes.css";

function Clientes({ alVolver }) {
  // --- CONFIGURACIÓN DE MESA (TEMPORAL / PRODUCCIÓN) ---
  const mesa = 8; // Temporal: Cambia este número para probar otras mesas en desarrollo
  
  /* 
     PARA PRODUCCIÓN: Descomenta las líneas de abajo y borra la línea de arriba
     const { idMesa } = useParams(); 
     const mesa = idMesa;
  */
  // -----------------------------------------------------

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

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

  if (categoriaSeleccionada === "cuenta") {
    return (
      <Cuenta 
        mesa={mesa} 
        alVolver={() => setCategoriaSeleccionada(null)} 
      />
    );
  } else if (categoriaSeleccionada) {
    return (
      <OpcionesPedidos
        categoria={categoriaSeleccionada}
        alVolver={() => setCategoriaSeleccionada(null)}
      />
    );
  }

  return (
    <>
      <div className="contenedor-logo">
        <p className="detalle-cuenta">
          Esta cuenta está habilitada para realizar los pedidos
        </p>
      </div>

      <div className="menuPrincipal">
        <div className="cuerpo">
          {listaCategorias.map((cat) => (
            <p
              key={cat.id}
              className={`opciones ${cat.id}`}
              onClick={() => setCategoriaSeleccionada(cat)}
            >
              {cat.nombre}
            </p>
          ))}
        </div>
        <p className="opciones" id="cuenta" onClick={() => setCategoriaSeleccionada("cuenta")}>
          CUENTA
        </p>
      </div>
      <div className="footer">
        <Footer />
      </div>
    </>
  );
}

export default Clientes;