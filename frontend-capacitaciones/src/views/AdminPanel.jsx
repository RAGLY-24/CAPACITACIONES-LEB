import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";

function AdminPanel() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigate = useNavigate();

  // 1. --- SIMULACIÓN DEL USUARIO LOGUEADO ---
  // (En el futuro, esto vendrá de tu Contexto de Autenticación / Backend)
  const usuarioLogueado = { 
    id: 1, 
    nombre: "Administrador", 
    rol: "SistemasAdmin" // Prueba a cambiar esto por "Recursos Humanos" para ver la magia
  };

  const handleLogout = () => {
    navigate('/');
  };

  const irA = (ruta) => {
    navigate(ruta);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1]">
      <nav className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <h1
          className="cursor-pointer text-xl font-bold text-gray-800"
          onClick={() => irA('/admin')}
        >
          Panel de Administración
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#802907] text-white transition-transform hover:scale-105 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg z-40">
                <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                  Editar Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className={`fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Menú</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <button
            onClick={() => irA('/admin/noticias')}
            className="rounded-md px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-[#802907] hover:text-white"
          >
            Noticias
          </button>
          <button
            onClick={() => irA('/admin/contenido')}
            className="rounded-md px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-[#802907] hover:text-white"
          >
            Editar Contenido
          </button>

          {/* 2. --- PROTECCIÓN DEL BOTÓN USUARIOS --- */}
          {/* Solo se dibuja si el rol es SistemasAdmin */}
          {usuarioLogueado.rol === 'SistemasAdmin' && (
            <button
              onClick={() => irA('/admin/usuarios')}
              className="rounded-md px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-[#802907] hover:text-white"
            >
              Usuarios
            </button>
          )}

        </div>
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminPanel;