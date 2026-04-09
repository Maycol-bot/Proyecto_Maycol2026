import React, { useState, useEffect } from 'react';
import FormularioLogin from '../components/login/FormularioLogin';
import { supabase } from '../database/supabaseconfig.js';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const navegar = useNavigate();

  // Estilo del contenedor (esto faltaba)
  const estiloContenedor = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: "20px"
  };

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario-supabase");
    if (usuarioGuardado) {
      navegar("/");
    }
  }, [navegar]);

  const iniciarSesion = async (e) => {
    if (e) e.preventDefault();   // ← Buena práctica

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contrasena,
      });

      if (error) {
        setError("Usuario o contraseña incorrectos");
        return;
      }

      if (data.user) {
        localStorage.setItem("usuario-supabase", usuario);
        navegar("/");
      }
    } catch (err) {
      setError("Error al conectarse al servidor");
      console.error("Error en la solicitud:", err);
    }
  };

  return (
    <div style={estiloContenedor}>
      <FormularioLogin 
        usuario={usuario}
        setUsuario={setUsuario}
        contrasena={contrasena}
        setContrasena={setContrasena}
        iniciarSesion={iniciarSesion}
        error={error}
      />
    </div>
  );
};

export default Login;