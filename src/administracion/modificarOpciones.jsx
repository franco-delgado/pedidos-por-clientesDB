import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./administracion.css";

function ModificarOpciones({ categoria, alVolver }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Guardamos temporalmente los archivos seleccionados usando el id temporal/real como clave
  const [archivosFotos, setArchivosFotos] = useState({});

  // 1. CARGAR DATOS EXISTENTES
  useEffect(() => {
    async function obtenerProductos() {
      setCargando(true);
      const { data, error } = await supabase
        .from("datos")
        .select("*")
        .eq("categoria", categoria.nombre.toUpperCase());

      if (error) {
        console.error("Error al cargar productos:", error);
      } else {
        setProductos(data || []);
      }
      setCargando(false);
    }
    obtenerProductos();
  }, [categoria.nombre]);

  // 2. AGREGAR LOCALMENTE
  const agregarProducto = () => {
    const nuevo = {
      id: `temp-${Date.now()}`,
      nombre: "",
      precio: 0,
      stock: 0,
      imagen_url: "", 
      categoria: categoria.nombre.toUpperCase(),
    };
    setProductos([...productos, nuevo]);
  };

  // 3. ELIMINAR
  const eliminarProducto = async (id) => {
    if (typeof id === "string" && id.startsWith("temp-")) {
      setProductos(productos.filter((prod) => prod.id !== id));
      const nuevosArchivos = { ...archivosFotos };
      delete nuevosArchivos[id];
      setArchivosFotos(nuevosArchivos);
      return;
    }

    const { error } = await supabase.from("datos").delete().eq("id", id);

    if (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar de la base de datos");
    } else {
      setProductos(productos.filter((prod) => prod.id !== id));
    }
  };

  const manejarCambio = (id, campo, valor) => {
    const nuevosProductos = productos.map((p) =>
      p.id === id ? { ...p, [campo]: valor } : p
    );
    setProductos(nuevosProductos);
  };

  // Manejar la selección local del archivo de imagen
  const manejarCambioFoto = (id, e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Guardamos el archivo binario intacto indexado por el ID del producto
    setArchivosFotos((prev) => ({ ...prev, [id]: archivo }));

    // Creamos la URL local temporal EXCLUSIVAMENTE para la vista previa visual en la interfaz
    const urlPrevia = URL.createObjectURL(archivo);
    manejarCambio(id, "imagen_url", urlPrevia);
  };

  // Subir imagen a Supabase Storage
  const subirImagenStorage = async (idProducto, archivo) => {
    // Sanitizamos el nombre del archivo para evitar caracteres extraños usando la marca de tiempo
    const extension = archivo.name.split(".").pop();
    const nombreArchivo = `${Date.now()}_${idProducto}.${extension}`;

    const { error } = await supabase.storage
      .from("productos-fotos")
      .upload(nombreArchivo, archivo, { cacheControl: "3600", upsert: true });

    if (error) {
      console.error("Error al subir archivo a Storage:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("productos-fotos")
      .getPublicUrl(nombreArchivo);

    return publicUrlData.publicUrl;
  };

  // 4. GUARDAR CAMBIOS (CORREGIDO)
  const guardarCambios = async () => {
    // Validación rápida antes de procesar llamadas a la base de datos
    const filaInvalida = productos.find(p => !p.nombre.trim());
    if (filaInvalida) {
      alert("Por favor, asigna un nombre válido a todos los productos antes de guardar.");
      return;
    }

    setCargando(true);

    try {
      const paraInsertar = [];
      const paraActualizar = [];

      // Procesamos fila por fila para asegurar la correcta subida de archivos binarios
      for (const prod of productos) {
        const copia = { ...prod };
        const esTemporal = typeof copia.id === "string" && copia.id.startsWith("temp-");

        // Si este producto específico tiene una foto nueva en cola de subida
        if (archivosFotos[prod.id]) {
          const urlPublica = await subirImagenStorage(prod.id, archivosFotos[prod.id]);
          if (urlPublica) {
            copia.imagen_url = urlPublica;
          }
        } else if (esTemporal) {
          copia.imagen_url = "";
        }

        // Limpieza de propiedades auxiliares
        if (copia.tempId) delete copia.tempId;

        if (esTemporal) {
          // Si es nuevo, quitamos la propiedad ID por completo para que funcione el Autoincrement
          delete copia.id;
          paraInsertar.push(copia);
        } else {
          // Si ya existe en la base de datos, va a la lista de actualización
          paraActualizar.push(copia);
        }
      }

      // 1. Ejecutar inserción de productos nuevos (si los hay) utilizando .insert()
      if (paraInsertar.length > 0) {
        const { error: errorInsert } = await supabase
          .from("datos")
          .insert(paraInsertar);

        if (errorInsert) throw errorInsert;
      }

      // 2. Ejecutar actualización de productos existentes utilizando .upsert()
      if (paraActualizar.length > 0) {
        const { error: errorUpsert } = await supabase
          .from("datos")
          .upsert(paraActualizar);

        if (errorUpsert) throw errorUpsert;
      }

      alert(`¡Cambios en ${categoria.nombre} guardados con éxito!`);
      // Limpiamos las referencias de blobs revocando accesos de memoria
      Object.values(archivosFotos).forEach(file => {
        if (file instanceof File) {
          URL.revokeObjectURL(file);
        }
      });
      alVolver();

    } catch (err) {
      console.error("Detalle del error al guardar:", err);
      alert("Hubo un error al guardar los datos: " + (err.message || "Error interno"));
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <p>Procesando productos de {categoria.nombre}...</p>;

  return (
    <div className="editor-container">
      <header className="superior">
        <button onClick={alVolver} className="btn-atras">
          ← Atrás
        </button>
        <h1>EDITANDO: {categoria?.nombre?.toUpperCase()}</h1>
        <button onClick={agregarProducto} className="btn-agregar">
          + Añadir Producto
        </button>
      </header>

      <div className="formulario-edicion">
        {productos.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px" }}>
            No hay productos cargados en esta categoría.
          </p>
        ) : (
          productos.map((prod) => (
            <div key={prod.id} className="item-editar">
              
              {/* Grupo: Vista previa y Foto */}
              <div className="input-group-foto">
                <label>Foto</label>
                <div className="contenedor-foto-preview">
                  {prod.imagen_url ? (
                    <img src={prod.imagen_url} alt="Preview" className="foto-preview" />
                  ) : (
                    <div className="sin-foto">📸</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id={`file-${prod.id}`}
                    className="input-file-oculto"
                    onChange={(e) => manejarCambioFoto(prod.id, e)}
                  />
                  <label htmlFor={`file-${prod.id}`} className="btn-subir-foto">
                    Seleccionar
                  </label>
                </div>
              </div>

              {/* Grupo: Nombre */}
              <div className="input-group">
                <label>Producto</label>
                <input
                  type="text"
                  placeholder="Ej: Camisa"
                  value={prod.nombre}
                  onChange={(e) =>
                    manejarCambio(prod.id, "nombre", e.target.value)
                  }
                />
              </div>

              {/* Grupo: Stock */}
              <div className="input-group-corto">
                <label>Stock</label>
                <input
                  type="number"
                  placeholder="0"
                  value={prod.stock}
                  onChange={(e) =>
                    manejarCambio(prod.id, "stock", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              {/* Grupo: Precio */}
              <div className="input-group-corto">
                <label>Precio ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={prod.precio}
                  onChange={(e) =>
                    manejarCambio(
                      prod.id,
                      "precio",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </div>

              <button
                className="btn-eliminar"
                onClick={() => eliminarProducto(prod.id)}
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <footer className="footer-controles">
        <button className="btn-guardar-todo" onClick={guardarCambios}>
          Guardar todo en {categoria.nombre}
        </button>
      </footer>
    </div>
  );
}

export default ModificarOpciones;