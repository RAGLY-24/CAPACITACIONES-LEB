import { Navigate, Route, Routes } from "react-router-dom";
import Registro from "../views/Registro";
import Login from "../views/Login";

export function PublicRoutes() {
    // RETORNO DE RUTA POR DEFECTO
    return (
        <Routes>
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
        </Routes>
    );
}