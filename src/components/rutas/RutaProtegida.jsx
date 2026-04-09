import React from 'react';
import { Navigate } from 'react-router-dom';

const RutaProtegida = ({ children }) => {
  const usuario = localStorage.getItem("usuario-supabase");

  // Si NO hay usuario en localStorage → redirigir al login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si sí hay usuario → mostrar la página protegida
  return children;
};

export default RutaProtegida;