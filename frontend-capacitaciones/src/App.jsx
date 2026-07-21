import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./views/Login";
import Registro from "./views/Registro";
import AdminPanel from "./views/AdminPanel";
import Noticias from "./views/Noticias";
import Contenido from "./views/Contenido";
import Usuarios from "./views/Usuarios";
import Capacitaciones from "./views/Capacitaciones";

function AdminRedirect() {
  return <Navigate to="noticias" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz (localhost:5173/) muestra el Login */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Ruta /admin (localhost:5173/admin) muestra el Panel */}
        <Route path="/admin" element={<AdminPanel />}>
          <Route index element={<AdminRedirect />} />
          <Route path="noticias" element={<Noticias />} />
          <Route path="contenido" element={<Contenido />} />
          <Route path="capacitaciones" element={<Capacitaciones />} />
          <Route path="usuarios" element={<Usuarios />} />
          {/* Cualquier ruta dentro de /admin que no exista vuelve a noticias */}
          <Route path="*" element={<AdminRedirect />} />
        </Route>
        {/* Si el usuario intenta ir a una ruta no válida, lo mandamos al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;