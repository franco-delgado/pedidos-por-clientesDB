import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// Importación de componentes de Clientes y Administración
import Clientes from "./clientes/Clientes";
import Administracion from "./administracion/administracion";
import Precios from "./administracion/Precios";
import Pedidos from "./administracion/Pedidos";
import Caja from "./administracion/caja/Caja";
import ModificarOpciones from "./administracion/modificarOpciones";
import DetalleMesa from "./administracion/mesas/DetalleMesa"; // Verifica que la ruta y el nombre sean exactos

// Componente para el botón de volver (reutilizable en todas las rutas)
const BotonVolver = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      style={{ margin: "10px", padding: "5px 15px", cursor: "pointer" }}
    >
      ← Atrás
    </button>
  );
};

// Pantalla inicial de bienvenida
function MenuPrincipal() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <a
        href="https://franco-delgado.github.io/delgadowebs/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          textDecoration: "none",
          color: "black",
          backgroundColor: "#efefef",
          marginBottom: "20px",
          padding: "5px 15px",
          border: "1px solid #767676",
          borderRadius: "2px",
        }}
      >
        REGRESAR A LA PAGINA PRINCIPAL
      </a>
      <h2>BIENVENIDO</h2>
      <p>Seleccione su perfil para continuar:</p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <button onClick={() => navigate("/administracion")}>
          Ser Administrador
        </button>
        <button onClick={() => navigate("/clientes")}>Ser Cliente</button>
      </div>
    </div>
  );
}

function SeleccionePerfil() {
  // Este estado es CRUCIAL: guardará el número de mesa (ej. 5)
  // cuando hagas clic en Pedidos.jsx para pasárselo a DetalleMesa.jsx
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Ruta Principal */}
        <Route path="/" element={<MenuPrincipal />} />

        {/* 2. Ruta para el Cliente */}
        <Route
          path="/clientes"
          element={
            <>
              <BotonVolver />
              <Clientes />
            </>
          }
        />

        {/* 3. Ruta Panel de Administración (Donde ves todas las opciones) */}
        <Route
          path="/administracion"
          element={
            <>
              <BotonVolver />
              <Administracion />
            </>
          }
        />

        {/* 4. Ruta de Pedidos (Donde están los cuadraditos de las mesas) */}
        <Route
          path="/pedidos"
          element={
            <>
              <BotonVolver />
              <Pedidos setMesaSeleccionada={setMesaSeleccionada} />
            </>
          }
        />

        {/* 5. RUTA CLAVE: Detalle de la Mesa seleccionada */}
        <Route
          path="/DetalleMesas"
          element={
            <>
              <BotonVolver />
              <DetalleMesa idMesa={mesaSeleccionada} />
            </>
          }
        />

        {/* Otras rutas administrativas */}
        <Route
          path="/precios"
          element={
            <>
              <BotonVolver />
              <Precios />
            </>
          }
        />
        <Route
          path="/caja"
          element={
            <>
              <BotonVolver />
              <Caja />
            </>
          }
        />
        <Route
          path="/modificar-opciones"
          element={
            <>
              <BotonVolver />
              <ModificarOpciones />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default SeleccionePerfil;
