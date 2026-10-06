import { CONTACTO, CREDITO } from "../config";

export default function Footer() {
  return (
    <footer className="footer">
      {CONTACTO.instagram && <p>Instagram: {CONTACTO.instagram}</p>}
      {CONTACTO.telefono && <p>Cel: {CONTACTO.telefono}</p>}
      <p className="footer-credito">
        Sistema por{" "}
        <a href={CREDITO.url} target="_blank" rel="noopener noreferrer">
          {CREDITO.texto}
        </a>
      </p>
    </footer>
  );
}
