import React, { useState, useEffect } from "react";
// Importamos la instancia de la base de datos de tu archivo de configuración
import { db } from "../lib/firebise"; 
// Importamos los métodos nativos de Firestore
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
// Importamos las herramientas para manejar las imágenes en Firebase Storage
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import "./administracion.css";

function ModificarOpciones({ categoria, alVolver }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Guardamos los archivos seleccionados usando el id (temporal o real) como clave
  const [archivosFotos, setArchivosFotos] = useState({});

  // Inicializamos Firebase Storage pasándole la configuración de la app
  const storage = getStorage();

  // 1. CARGAR DATOS EXISTENTES DESDE FIRESTORE
  useEffect(() => {
    async function obtenerProductos() {
      try {
        setCargando(true);
        const q = query(
          collection(db, "datos"),
          where("categoria", "==", categoria.nombre.toUpperCase())
        );
        
        const querySnapshot = await getDocs(q);
        const listaProductos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProductos(listaProductos);
      } catch (error) {
        console.error("Error al cargar productos desde Firestore:", error);
      } finally {
        setCargando(false);
      }
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

  // 3. ELIMINAR UN DOCUMENTO
  const eliminarProducto = async (id) => {
    if (typeof id === "string" && id.startsWith("temp-")) {
      setProductos(productos.filter((prod) => prod.id !== id));
      const nuevosArchivos = { ...archivosFotos };
      delete nuevosArchivos[id];
      setArchivosFotos(nuevosArchivos);
      return;
    }

    try {
      // En Firestore eliminamos directamente apuntando a la referencia del ID del doc
      await deleteDoc(doc(db, "datos", id));
      setProductos(productos.filter((prod) => prod.id !== id));
    } catch (error) {
      console.error("Error al eliminar de Firestore:", error);
      alert("No se pudo eliminar de la base de datos");
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

    setArchivosFotos((prev) => ({ ...prev, [id]: archivo }));

    const urlPrevia = URL.createObjectURL(archivo);
    manejarCambio(id, "imagen_url", urlPrevia);
  };

  // Subir imagen a Firebase Storage
  const subirImagenStorage = async (idProducto, archivo) => {
    try {
      const extension = archivo.name.split(".").pop();
      // Creamos la referencia de ruta dentro de Firebase Storage
      const nombreArchivo = `productos-fotos/${Date.now()}_${idProducto}.${extension}`;
      const storageRef = ref(storage, nombreArchivo);

      // Subimos el archivo binario raw
      await uploadBytes(storageRef, archivo);
      
      // Obtenemos y retornamos la URL pública que expone Google Cloud
      const urlPublica = await getDownloadURL(storageRef);
      return urlPublica;
    } catch (error) {
      console.error("Error al subir archivo a Firebase Storage:", error);
      return null;
    }
  };

  // 4. GUARDAR CAMBIOS (CORREGIDO Y OPTIMIZADO PARA BATCH DE FIRESTORE)
  const guardarCambios = async () => {
    const filaInvalida = productos.find(p => !p.nombre.trim());
    if (filaInvalida) {
      alert("Por favor, asigna un nombre válido a todos los productos antes de guardar.");
      return;
    }

    setCargando(true);

    try {
      // Usamos un lote (batch) para agrupar todas las escrituras/actualizaciones en un solo viaje de red
      const batch = writeBatch(db);

      for (const prod of productos) {
        const copia = { ...prod };
        const esTemporal = typeof copia.id === "string" && copia.id.startsWith("temp-");

        // Si este producto específico tiene una foto en la cola local de subida
        if (archivosFotos[prod.id]) {
          const urlPublica = await subirImagenStorage(prod.id, archivosFotos[prod.id]);
          if (urlPublica) {
            copia.imagen_url = urlPublica;
          }
        } else if (esTemporal) {
          copia.imagen_url = "";
        }

        if (esTemporal) {
          // En Firestore, si queremos que genere un ID aleatorio único, creamos una referencia vacía
          const nuevaDocRef = doc(collection(db, "datos"));
          // Removemos el ID temporal interno para que no se guarde como campo redundante en el documento
          delete copia.id; 
          batch.set(nuevaDocRef, copia);
        } else {
          // Si ya existe, guardamos los cambios apuntando a su ID real existente
          const docExistenteRef = doc(db, "datos", copia.id);
          delete copia.id; // Evitamos duplicar el id de la clave dentro de los campos del mapeo
          batch.set(docExistenteRef, copia, { merge: true }); // El merge asegura que no borre otros campos ocultos
        }
      }

      // Confirmamos e impactamos todas las operaciones del lote de golpe
      await batch.commit();

      alert(`¡Cambios en ${categoria.nombre} guardados con éxito!`);
      
      // Revocamos accesos de memoria local de las vistas previas
      Object.values(archivosFotos).forEach(file => {
        if (file instanceof File) {
          URL.revokeObjectURL(file);
        }
      });
      alVolver();

    } catch (err) {
      console.error("Detalle del error al guardar en lote:", err);
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