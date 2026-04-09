import { useState } from 'react'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Encabezado from "./components/navegacion/Encabezado";

import Inicio from "./views/Inicio";
import Categoria from "./views/Categorias";
import Catalogo from "./views/Catalogo";
import Producto from "./views/Productos";
import Login from "./views/Login";
import RutaProtegida from "./components/rutas/RutaProtegida";
import Pagina404 from "./views/Pagina404";

import './App.css';


const App = () => {
  return(
    <Router>
      <Encabezado />
      <main className="marge-superior-main">
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <RutaProtegida>
              <Inicio />
            </RutaProtegida>
          } />

          <Route path="/categoria" element={
            <RutaProtegida>
              <Categoria />
            </RutaProtegida>
          } />

          <Route path="/catalogo" element={
            <RutaProtegida>
              <Catalogo />
            </RutaProtegida>
          } />

          <Route path="/producto/:id" element={
            <RutaProtegida>
              <Producto />
            </RutaProtegida>
          } />

          <Route path="*" element={<Pagina404 />} />

        </Routes>
      </main>
    </Router>
  )
};

export default App;