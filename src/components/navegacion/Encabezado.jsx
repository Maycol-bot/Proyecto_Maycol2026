import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Nav, Navbar, Offcanvas, Button } from "react-bootstrap";
import logo from "../../assets/logo.png";
import { supabase } from "../../database/supabaseconfig.js";
import ChatIA from "../ia/ChatIA.jsx";

const Encabezado = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarChatIA, setMostrarChatIA] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const manejarToggle = () => setMostrarMenu(!mostrarMenu);
  const cerrarMenu = () => setMostrarMenu(false);

  const manejarNavegacion = (ruta) => {
    navigate(ruta);
    cerrarMenu();
  };

  const cerrarSesion = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem("usuario-supabase");
      cerrarMenu();
      navigate("/login");
    } catch (err) {
      console.error("Error cerrando sesión:", err.message);
    }
  };

  // Estados de validación de ruteo y sesión activa
  const esLogin = location.pathname === "/login";
  const sesionGuardada = localStorage.getItem("usuario-supabase");
  const esCatalogoPublico = location.pathname === "/catalogo" && !sesionGuardada;
  const usuarioEmail = sesionGuardada?.toLowerCase();

  const linkStyle = { cursor: "pointer", transition: "all 0.3s ease" };

  return (
    <Navbar expand="md" sticky="top" className="bg-dark navbar-dark shadow-sm py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <Container fluid="lg">
        
        {/* LOGO Y BRANDING PRINCIPAL */}
        <Navbar.Brand
          onClick={() => manejarNavegacion(esCatalogoPublico ? "/catalogo" : "/")}
          className="text-white d-flex align-items-center gap-2"
          style={{ cursor: "pointer" }}
        >
          <img src={logo} width="40" height="40" className="d-inline-block align-top rounded" alt="logo" />
          <span className="fw-bold fs-4 tracking-tight">Discosa</span>
        </Navbar.Brand>

        {/* BOTÓN HAMBURGUESA (SÓLO MÓVIL) */}
        {!esLogin && (
          <Navbar.Toggle aria-controls="menu-offcanvas" onClick={manejarToggle} className="border-0 focus-none" />
        )}

        {/* MENÚ DESPLEGABLE / OFFCANVAS (RESPONSIVO) */}
        <Navbar.Offcanvas
          id="menu-offcanvas"
          placement="end"
          show={mostrarMenu}
          onHide={cerrarMenu}
          className="bg-dark text-white"
        >
          <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary">
            <Offcanvas.Title className="fw-bold">Menú Discosa</Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body className="d-flex flex-column justify-content-between">
            {/* LISTADO DE ENLACES DE NAVEGACIÓN */}
            <Nav className="ms-auto align-items-md-center gap-2 w-100 justify-content-end">
              {esLogin ? (
                <Nav.Link onClick={() => manejarNavegacion("/login")} className="text-white d-flex align-items-center gap-2 px-3 py-2 rounded" style={linkStyle}>
                  <i className="bi bi-person-fill-lock fs-5"></i>
                  <span>Iniciar sesión</span>
                </Nav.Link>
              ) : esCatalogoPublico ? (
                <Nav.Link onClick={() => manejarNavegacion("/catalogo")} className="text-white d-flex align-items-center gap-2 px-3 py-2 rounded" style={linkStyle}>
                  <i className="bi bi-images fs-5"></i>
                  <strong>Catálogo público</strong>
                </Nav.Link>
              ) : (
                <>
                  {/* Navegación completa para el personal autorizado */}
                  <Nav.Link onClick={() => manejarNavegacion("/")} className={`text-white px-3 py-2 rounded ${location.pathname === "/" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Inicio
                  </Nav.Link>
                  <Nav.Link onClick={() => manejarNavegacion("/categorias")} className={`text-white px-3 py-2 rounded ${location.pathname === "/categorias" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Categorías
                  </Nav.Link>
                  <Nav.Link onClick={() => manejarNavegacion("/productos")} className={`text-white px-3 py-2 rounded ${location.pathname === "/productos" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Productos
                  </Nav.Link>
                  <Nav.Link onClick={() => manejarNavegacion("/empleados")} className={`text-white px-3 py-2 rounded ${location.pathname === "/empleados" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Empleados
                  </Nav.Link>
                  <Nav.Link onClick={() => manejarNavegacion("/clientes")} className={`text-white px-3 py-2 rounded ${location.pathname === "/clientes" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Clientes
                  </Nav.Link>
                  <Nav.Link onClick={() => manejarNavegacion("/ventas")} className={`text-white px-3 py-2 rounded ${location.pathname === "/ventas" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Ventas
                  </Nav.Link>
                  <Nav.Link onClick={() => manejarNavegacion("/catalogo")} className={`text-white px-3 py-2 rounded ${location.pathname === "/catalogo" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Catálogo
                  </Nav.Link>
                  <Nav.Link onClick={() => manejarNavegacion("/dashboard")} className={`text-white px-3 py-2 rounded ${location.pathname === "/dashboard" ? "bg-secondary bg-opacity-25" : ""}`} style={linkStyle}>
                    Dashboard
                  </Nav.Link>

                  {/* Acceso rápido a ChatIA (Visible en Desktop) */}
                  <Nav.Link onClick={() => setMostrarChatIA(true)} className="text-info d-none d-md-block ms-2 px-2" title="Chat Asistente IA" style={linkStyle}>
                    <i className="bi bi-robot fs-4"></i>
                  </Nav.Link>

                  {/* Icono de salida segura (Visible en Desktop) */}
                  <Nav.Link onClick={cerrarSesion} className="text-danger d-none d-md-block ms-2 px-2" title="Cerrar Sesión" style={linkStyle}>
                    <i className="bi bi-box-arrow-right fs-4"></i>
                  </Nav.Link>
                </>
              )}
            </Nav>

            {/* SECCIÓN INFERIOR COMPLEMENTARIA (Sólo visible en smartphones/tablets en Offcanvas) */}
            {!esLogin && !esCatalogoPublico && usuarioEmail && (
              <div className="d-md-none mt-auto pt-4 border-top border-secondary">
                
                {/* Botón rápido para disparar la Inteligencia Artificial desde celular */}
                <Button variant="outline-info" className="w-100 d-flex align-items-center justify-content-center gap-2 py-2 mb-3" onClick={() => { cerrarMenu(); setMostrarChatIA(true); }}>
                  <i className="bi bi-robot"></i>
                  Consultar con IA
                </Button>

                {/* Tarjeta informativa de la cuenta en sesión */}
                <div className="d-flex align-items-center gap-3 p-3 rounded bg-secondary bg-opacity-10 mb-3">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", minWidth: "40px" }}>
                    <i className="bi bi-person-fill text-white fs-5"></i>
                  </div>
                  <div className="text-truncate">
                    <small className="text-muted d-block">Sesión iniciada como:</small>
                    <span className="text-white-50 fw-semibold text-truncate d-block">{usuarioEmail}</span>
                  </div>
                </div>

                {/* Acción de desconexión definitiva para pantallas móviles */}
                <Button variant="danger" className="w-100 d-flex align-items-center justify-content-center gap-2 py-2" onClick={cerrarSesion}>
                  <i className="bi bi-box-arrow-right"></i>
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>

      {/* MODAL INYECTADO DEL CHAT IA */}
      <ChatIA mostrar={mostrarChatIA} onCerrar={() => setMostrarChatIA(false)} />
    </Navbar>
  );
};

export default Encabezado;