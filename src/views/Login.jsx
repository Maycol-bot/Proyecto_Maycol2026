import React, { useState, useEffect } from 'react';
import FormularioLogin from '../components/login/FormularioLogin';
import { supabase } from '../database/supabaseconfig.js';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  // --- ESTADOS DEL COMPONENTE ---
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false); // Evita múltiples clics mientras conecta a Supabase
  const navegar = useNavigate();

  // --- ESTILOS VISUALES ---
  const estiloContenedor = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: "20px"
  };

  // --- PERSISTENCIA DE SESIÓN ---
  // Verifica si el usuario ya inició sesión previamente para redirigirlo automáticamente al Home
  useEffect(() => {
    const comprobarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navegar("/");
      }
    };
    comprobarSesion();
  }, [navegar]);

  // --- LÓGICA DE AUTENTICACIÓN ---
  // Maneja el envío del formulario y la conexión con la API de Supabase
  const iniciarSesion = async (e) => {
    if (e) e.preventDefault(); // Previene que la página se recargue al enviar el formulario
    setError(null);            // Limpia errores previos antes de un nuevo intento
    setCargando(true);         // Activa el estado de carga

    try {
      // Intenta autenticar al usuario usando el proveedor de Email de Supabase
      const { data, error: errorSupabase } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contrasena,
      });

      // Si Supabase devuelve un error (credenciales incorrectas, correo no verificado, etc.)
      if (errorSupabase) {
        setError("Usuario o contraseña incorrectos");
        return;
      }

      // Si la autenticación es exitosa, guarda el correo y redirige al usuario
      if (data.user) {
        localStorage.setItem("usuario-supabase", data.user.email);
        navegar("/");
      }
    } catch (err) {
      // Captura fallos críticos como problemas de conexión de red
      setError("Error al conectarse al servidor");
      console.error("Error en la solicitud:", err);
    } finally {
      setCargando(false); // Desactiva el estado de carga pase lo que pase
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div style={estiloContenedor}>
      <FormularioLogin 
        usuario={usuario}
        setUsuario={setUsuario}
        contrasena={contrasena}
        setContrasena={setContrasena}
        iniciarSesion={iniciarSesion}
        error={error}
        cargando={cargando}
      />
    </div>
  );
};

export default Login;