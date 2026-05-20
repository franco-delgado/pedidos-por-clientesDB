import { useState, useEffect, useRef } from "react";

const TOTAL_MESAS = 13;

function Menu() {
  // Estado para guardar el color/alerta de cada mesa
  // "normal", "blue" (nueva orden), "red" (finalizado)
  const [estadosMesas, setEstadosMesas] = useState({});
  const [conteos, setConteos] = useState({});

  // Referencias para los audios
  const audioDing = useRef(null);
  const audioBocina = useRef(null);

  // Función para resetear color al hacer click (Cierre de mesa)
  const manejarClickMesa = (num) => {
    setEstadosMesas((prev) => ({ ...prev, [num]: "normal" }));
    // Aquí iría tu fetch('/cierre.php')
    console.log(`Cerrando mesa ${num}`);
  };

  useEffect(() => {
    const chequearAlertas = async () => {
      let nuevoEstado = { ...estadosMesas };
      let nuevosConteos = { ...conteos };

      for (let i = 1; i <= TOTAL_MESAS; i++) {
        try {
          const res = await fetch(`salidadbmesas/salidadbmesa${i}.php`);
          const data = await res.json();

          // Lógica de alerta AZUL (Nueva orden)
          if (
            nuevosConteos[i] !== undefined &&
            nuevosConteos[i] !== data.orden.length
          ) {
            nuevoEstado[i] = "blue";
            audioBocina.current?.play();
          }
          nuevosConteos[i] = data.orden.length;

          // Lógica de alerta ROJA (Finalizado)
          if (data.final && data.final.some((f) => f !== "")) {
            if (nuevoEstado[i] !== "red") {
              nuevoEstado[i] = "red";
              audioDing.current?.play();
            }
          }
        } catch (e) {
          // console.error("Error en mesa " + i);
        }
      }
      setEstadosMesas(nuevoEstado);
      setConteos(nuevosConteos);
    };

    const intervalo = setInterval(chequearAlertas, 2000);
    return () => clearInterval(intervalo);
  }, [estadosMesas, conteos]);

  return (
    <div className="barra">
      <audio ref={audioDing} src="ding-ding.mp3" />
      <audio ref={audioBocina} src="bocina.mp3" />

      {Array.from({ length: TOTAL_MESAS }, (_, i) => {
        const num = i + 1;
        const color =
          estadosMesas[num] === "blue"
            ? "blue"
            : estadosMesas[num] === "red"
              ? "red"
              : "transparent";

        return (
          <p
            key={num}
            className={`mesa mesa${num}`}
            style={{ backgroundColor: color }}
            onClick={() => manejarClickMesa(num)}
          >
            <a href={`#mesa${num}`}>Mesa {num}</a>
          </p>
        );
      })}
    </div>
  );
}

export default Menu;
