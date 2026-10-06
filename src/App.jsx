import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { asegurarAutenticacion } from "./lib/firebase";

import Layout from "./components/Layout";
import PinGate from "./components/PinGate";
import Inicio from "./pages/Inicio";

import Clientes from "./clientes/Clientes";
import Categorias from "./clientes/Categorias";
import OpcionesPedidos from "./clientes/OpcionesPedidos";
import Cuenta from "./clientes/Cuenta";

// Administración y cocina se descargan sólo cuando se entra a ellas:
// el celular del cliente carga mucho menos código.
const Administracion = lazy(() => import("./administracion/Administracion"));
const Pedidos = lazy(() => import("./administracion/Pedidos"));
const DetalleMesa = lazy(() => import("./administracion/mesas/DetalleMesa"));
const Precios = lazy(() => import("./administracion/Precios"));
const ModificarOpciones = lazy(() => import("./administracion/modificarOpciones"));
const Caja = lazy(() => import("./administracion/caja/Caja"));
const Cocina = lazy(() => import("./cocina/cocina"));

export default function App() {
  const [auth, setAuth] = useState({ estado: "cargando" });
  const [intento, setIntento] = useState(0);

  // Ninguna pantalla consulta Firestore hasta tener la sesión anónima lista
  useEffect(() => {
    let activo = true;
    asegurarAutenticacion()
      .then(() => activo && setAuth({ estado: "ok" }))
      .catch((error) => {
        console.error("No se pudo autenticar de forma anónima:", error);
        if (activo) setAuth({ estado: "error" });
      });
    return () => {
      activo = false;
    };
  }, [intento]);

  if (auth.estado === "cargando") {
    return <div className="pantalla-centro"><div className="spinner" aria-label="Cargando" /></div>;
  }

  if (auth.estado === "error") {
    return (
      <div className="pantalla-centro">
        <p>No se pudo conectar con el servidor.</p>
        <p className="texto-suave">Revisá tu conexión a internet.</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setAuth({ estado: "cargando" });
            setIntento((n) => n + 1);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="spinner" aria-label="Cargando" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />

          {/* Cliente: /clientes/5  (esta es la URL que va en el QR de la mesa 5) */}
          <Route path="clientes/:idMesa" element={<Clientes />}>
            <Route index element={<Categorias />} />
            <Route path="categoria/:idCategoria" element={<OpcionesPedidos />} />
            <Route path="cuenta" element={<Cuenta />} />
          </Route>

          {/* Administración */}
          <Route path="administracion" element={<Administracion />}>
            <Route index element={<Navigate to="mesas" replace />} />
            <Route path="mesas" element={<Pedidos />} />
            <Route path="mesas/:idMesa" element={<DetalleMesa />} />
            <Route path="precios" element={<Precios />} />
            <Route path="precios/:idCategoria" element={<ModificarOpciones />} />
            <Route path="caja" element={<Caja />} />
          </Route>

          {/* Cocina */}
          <Route path="cocina" element={<PinGate><Cocina /></PinGate>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
