import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from 'axios';
import logoEmpresa from '../assets/leb_logotipo.png';

function AdminPanel() {
  // 1. CONDICIÓN INICIAL: Abierto en PC (>768px), Cerrado en móviles
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Referencia para detectar clics fuera del menú de usuario
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // 1. Obtenemos el usuario real que inició sesión desde el almacenamiento del navegador
  const datosUsuario = sessionStorage.getItem('user');
  const usuarioLogueado = datosUsuario ? JSON.parse(datosUsuario) : {};
  const esAdmin = usuarioLogueado.puesto?.nombre === 'SistemasAdmin';
  const permisos = usuarioLogueado.permissions || {};
  const muestraNoticias = permisos.news_access !== false;
  const muestraUsuarios = esAdmin || permisos.create_users || permisos.delete_users || permisos.assign_permissions;
  const muestraContenido = esAdmin || permisos.edit_trainings;
  const muestraCapacitaciones = true;

  //Para no dejarlo entrar en caso de que no este iniciado sesion
  const token = sessionStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // --- EFECTO 1: Cerrar menú de perfil al hacer clic afuera ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú está referenciado y el clic NO fue dentro de él, lo cerramos
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- EFECTO 2: Limpiar sesión si el usuario sale de la página ---
  useEffect(() => {
    const clearSession = () => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    };

    window.addEventListener('beforeunload', clearSession);
    window.addEventListener('pagehide', clearSession);

    return () => {
      window.removeEventListener('beforeunload', clearSession);
      window.removeEventListener('pagehide', clearSession);
    };
  }, []);

  // --- EFECTO 2: Cerrar menú de perfil automáticamente tras 15 segundos ---
  useEffect(() => {
    let temporizador;
    if (isUserMenuOpen) {
      temporizador = setTimeout(() => {
        setIsUserMenuOpen(false);
      }, 15000); // 15,000 milisegundos = 15 segundos
    }
    // Limpiamos el temporizador si el usuario lo cierra manualmente antes
    return () => clearTimeout(temporizador);
  }, [isUserMenuOpen]);

  // Función para cerrar sesión con estilo
  const handleLogout = async () => {
    Swal.fire({
      title: 'Cerrando Sesión...',
      text: 'Hasta pronto.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await axios.post('http://localhost:8000/api/logout');
    } catch (err) {
      // Ignoramos errores de logout remoto y procedemos a limpiar local
    }

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    Swal.close();
    navigate('/');
  };

  const irA = (ruta) => {
    navigate(ruta);
    // Solo cerramos la barra automáticamente si estamos en celular
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] overflow-x-hidden">

      {/* --- BARRA SUPERIOR (NAVBAR) Fija arriba --- */}
      <nav className="fixed top-0 left-0 w-full z-50 flex h-[72px] items-center justify-between bg-white px-8 shadow-sm">

        {/* Lado Izquierdo: Logo y Botón de Menú juntos */}
        <div className="flex items-center gap-6">
          <img
            src={logoEmpresa}
            alt="Logotipo LEB"
            className="h-10 w-auto cursor-pointer object-contain transition-transform hover:scale-105"
            onClick={() => irA('/admin')}
          />

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>

        {/* Lado Derecho: Avatar del Usuario */}
        <div className="flex items-center">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#802907] text-white transition-transform hover:scale-105 focus:outline-none shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </button>

            {/* Menú Desplegable (Cierra con clic afuera o a los 15s) */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-xl z-50">
                <button className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Editar Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- BARRA LATERAL (SIDEBAR) A la Izquierda --- */}
      <div
        className={`fixed left-0 top-[72px] z-40 h-[calc(100vh-72px)] w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col gap-2 p-4 mt-4">

          {/* --- VISIBLES PARA TODOS --- */}
          {muestraNoticias && (
            <button onClick={() => irA('/admin/noticias')} className="rounded-md px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-[#802907] hover:text-white">
              Noticias
            </button>
          )}

          {muestraCapacitaciones && (
            <button onClick={() => irA('/admin/capacitaciones')} className="rounded-md px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-[#802907] hover:text-white">
              Capacitaciones
            </button>
          )}

          {muestraContenido && (
            <button onClick={() => irA('/admin/contenido')} className="rounded-md px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-[#802907] hover:text-white">
              Editar Contenido
            </button>
          )}

          {muestraUsuarios && (
            <button onClick={() => irA('/admin/usuarios')} className="rounded-md px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-[#802907] hover:text-white">
              Usuarios
            </button>
          )}

        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL DINÁMICO --- */}
      {/* Añadimos margen superior (pt-24) para esquivar la barra fija y margen izquierdo si el menú está abierto */}
      <div className={`transition-all duration-300 ease-in-out pt-[90px] ${isSidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default AdminPanel;