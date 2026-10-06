import { Link, Outlet } from "react-router-dom";
import { NOMBRE_LOCAL } from "../config";
import Footer from "./Footer";

export default function Layout() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-punto" aria-hidden="true" />
          {NOMBRE_LOCAL}
        </Link>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
