import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./views/Login";
import AdminPanel from "./views/AdminPanel";
import Noticias from "./views/Noticias";
import Contenido from "./views/Contenido";
import Usuarios from "./views/Usuarios";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz (localhost:5173/) muestra el Login */}
        <Route path="/" element={<Login />} />

        {/* Ruta /admin (localhost:5173/admin) muestra el Panel */}
        <Route path="/admin" element={<AdminPanel />}>
          {/* Rutas Hijas */}
          <Route path="noticias" element={<Noticias />} />
          <Route path="contenido" element={<Contenido />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;