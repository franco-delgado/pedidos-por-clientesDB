import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { db } from "../lib/firebase";
import { buscarCategoria, claveCategoria } from "../config";
import { useToast } from "../hooks/toastContext";

const MAX_LADO_FOTO = 900; // px: las fotos de celular (4-8 MB) se reducen antes de subirlas

// Reduce y comprime la imagen en el navegador para que el menú cargue rápido
async function comprimirImagen(archivo) {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, MAX_LADO_FOTO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // evita fondo negro en PNG con transparencia
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob || archivo;
  } catch {
    return archivo;
  }
}

const esTemporal = (id) => typeof id === "string" && id.startsWith("temp-");

export default function ModificarOpciones() {
  const { idCategoria } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const categoria = buscarCategoria(idCategoria);
  const clave = categoria ? claveCategoria(categoria) : null;

  const [productos, setProductos] = useState([]);
  const [cargado, setCargado] = useState(null); // categoría cuyos datos ya se cargaron
  const [archivosFotos, setArchivosFotos] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!clave) return;
    let activo = true;

    getDocs(query(collection(db, "datos"), where("categoria", "==", clave)))
      .then((snapshot) => {
        if (!activo) return;
        setProductos(
          snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es")),
        );
        setArchivosFotos({});
        setCargado(clave);
      })
      .catch((error) => {
        console.error("Error al cargar productos:", error);
        if (!activo) return;
        toast.mostrar("No se pudieron cargar los productos.", "error");
        setCargado(clave);
      });

    return () => {
      activo = false;
    };
  }, [clave, toast]);

  const volver = <Link to="/administracion/precios" className="volver">← Categorías</Link>;

  if (!categoria) {
    return (
      <>
        {volver}
        <div className="card estado-vacio">Esa categoría no existe.</div>
      </>
    );
  }

  const cargando = cargado !== clave;

  const agregarProducto = () => {
    setProductos((prev) => [
      { id: `temp-${Date.now()}`, nombre: "", precio: "", stock: "", imagen_url: "", categoria: clave },
      ...prev,
    ]);
  };

  const cambiar = (id, campo, valor) =>
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));

  const cambiarFoto = (id, e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setArchivosFotos((prev) => ({ ...prev, [id]: archivo }));
    cambiar(id, "imagen_url", URL.createObjectURL(archivo)); // vista previa local
  };

  const eliminar = async (prod) => {
    if (esTemporal(prod.id)) {
      setProductos((prev) => prev.filter((p) => p.id !== prod.id));
      return;
    }
    if (!window.confirm(`¿Eliminar "${prod.nombre || "este producto"}" definitivamente?`)) return;
    try {
      await deleteDoc(doc(db, "datos", prod.id));
      setProductos((prev) => prev.filter((p) => p.id !== prod.id));
      toast.mostrar("Producto eliminado.", "ok");
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.mostrar("No se pudo eliminar el producto.", "error");
    }
  };

  const subirFoto = async (id, archivo) => {
    const blob = await comprimirImagen(archivo);
    const extension = blob === archivo ? archivo.name.split(".").pop() : "jpg";
    const referencia = ref(getStorage(), `productos-fotos/${Date.now()}_${id}.${extension}`);
    await uploadBytes(referencia, blob, { contentType: blob.type || undefined });
    return getDownloadURL(referencia);
  };

  const guardar = async () => {
    if (productos.some((p) => !String(p.nombre).trim())) {
      toast.mostrar("Todos los productos necesitan un nombre.", "error");
      return;
    }
    if (productos.some((p) => Number(p.precio) < 0 || Number(p.stock) < 0)) {
      toast.mostrar("Precio y stock no pueden ser negativos.", "error");
      return;
    }

    setGuardando(true);
    try {
      // 1) Subir en paralelo sólo las fotos nuevas
      const urls = {};
      await Promise.all(
        Object.entries(archivosFotos)
          .filter(([id]) => productos.some((p) => p.id === id))
          .map(async ([id, archivo]) => {
            urls[id] = await subirFoto(id, archivo);
          }),
      );

      // 2) Guardar todos los productos en un solo lote
      const lote = writeBatch(db);
      productos.forEach((prod) => {
        const { id, ...resto } = prod;
        const datos = {
          ...resto,
          nombre: String(prod.nombre).trim(),
          precio: Number(prod.precio) || 0,
          stock: Math.max(0, Math.floor(Number(prod.stock) || 0)),
          imagen_url: urls[id] ?? (esTemporal(id) ? "" : prod.imagen_url || ""),
          categoria: clave,
        };
        const referencia = esTemporal(id) ? doc(collection(db, "datos")) : doc(db, "datos", id);
        lote.set(referencia, datos, { merge: true });
      });
      await lote.commit();

      toast.mostrar(`Cambios en ${categoria.nombre} guardados.`, "ok");
      navigate("/administracion/precios");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.mostrar(`No se pudo guardar: ${error.message || "error interno"}`, "error");
      setGuardando(false);
    }
  };

  return (
    <>
      {volver}
      <header className="admin-titulo">
        <h1>{categoria.emoji} {categoria.nombre}</h1>
        <button className="btn btn-outline" onClick={agregarProducto} disabled={cargando || guardando}>
          + Producto
        </button>
      </header>

      {cargando ? (
        <div className="spinner" aria-label="Cargando" />
      ) : productos.length === 0 ? (
        <div className="card estado-vacio">No hay productos en esta categoría. Agregá el primero con «+ Producto».</div>
      ) : (
        <div className="ed-lista">
          {productos.map((prod) => (
            <article key={prod.id} className="card ed-fila">
              <div className="ed-foto">
                {prod.imagen_url ? (
                  <img src={prod.imagen_url} alt="" />
                ) : (
                  <span aria-hidden="true">📸</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  id={`file-${prod.id}`}
                  className="ed-file"
                  onChange={(e) => cambiarFoto(prod.id, e)}
                />
                <label htmlFor={`file-${prod.id}`} className="ed-foto-btn">Foto</label>
              </div>

              <div className="ed-campos">
                <label className="campo">
                  Producto
                  <input
                    className="input"
                    type="text"
                    placeholder="Ej: Cappuccino"
                    value={prod.nombre}
                    onChange={(e) => cambiar(prod.id, "nombre", e.target.value)}
                  />
                </label>
                <div className="ed-numeros">
                  <label className="campo">
                    Precio ($)
                    <input
                      className="input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={prod.precio}
                      onChange={(e) => cambiar(prod.id, "precio", e.target.value)}
                    />
                  </label>
                  <label className="campo">
                    Stock
                    <input
                      className="input"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={prod.stock}
                      onChange={(e) => cambiar(prod.id, "stock", e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <button className="icono-btn" aria-label="Eliminar producto" onClick={() => eliminar(prod)}>
                🗑️
              </button>
            </article>
          ))}
        </div>
      )}

      {!cargando && (
        <div className="barra-guardar">
          <button className="btn btn-primary btn-grande" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : `Guardar cambios en ${categoria.nombre}`}
          </button>
        </div>
      )}
    </>
  );
}
