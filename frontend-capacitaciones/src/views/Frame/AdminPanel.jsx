
import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from 'axios';
import logoEmpresa from '../../assets/leb_logotipo.png';
import { LogOut, Menu, Pencil } from "lucide-react";
import { useLogout } from "../../hooks/auth/useLogout";
import { URL } from "../../api/http.client";
import ProfileFormModal from "./ProfileFormModal";
import { Avatar } from "../../components/Avatar/Avatar";
import { DropdownMenu } from "../../components/Dropdown/DropdownMenu";

const API_URL = URL

function AdminPanel({ user, routes }) {
  const logout = useLogout();



  const [isModalProfileOpen, setModalProfileOpen] = useState(false);


  // 1. CONDICIÓN INICIAL: Abierto en PC (>768px), Cerrado en móviles
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Forzamos un refresco de vista cuando actualizamos el usuario en sessionStorage
  const [perfilVersion, setPerfilVersion] = useState(0);

  // Referencia para detectar clics fuera del menú de usuario
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // 1. Obtenemos el usuario real que inició sesión desde el almacenamiento del navegador
  // (perfilVersion se usa solo para forzar la relectura de sessionStorage tras editar el perfil)
  void perfilVersion;

  const usuarioLogueado = user;

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
    await logout.mutateAsync()
    Swal.close();
  };

  // --- Abrir el modal de edición de perfil precargado con los datos actuales ---
  const abrirModalPerfil = () => {
    setIsUserMenuOpen(false)
    setModalProfileOpen(true)
  };

  const menuItems = [
    {
      label: "Editar Perfil",
      icon: Pencil,
      onClick: abrirModalPerfil,
    },
    {
      label: "Cerrar Sesión",
      icon: LogOut,
      variant: "danger",
      onClick: handleLogout,
    },
  ];

  const guardarPerfil = async (e) => {
    const { payload } = e
    const formData = payload
    try {
      const response = await axios.post(`${API_URL}/api/perfil`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Actualizamos el usuario guardado localmente para reflejar los cambios al instante
      const usuarioActualizado = { ...usuarioLogueado, ...response.data.user };
      sessionStorage.setItem('user', JSON.stringify(usuarioActualizado));
      setPerfilVersion((v) => v + 1);
      setModalProfileOpen(false)
      Swal.fire({
        icon: 'success',
        title: '¡Perfil actualizado!',
        text: 'Tus cambios se guardaron correctamente.',
        confirmButtonColor: '#802907',
      });
    } catch (err) {
      const mensaje = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || 'No se pudo actualizar el perfil.';
      Swal.fire({ icon: 'error', title: 'Error', text: mensaje, confirmButtonColor: '#802907' });
    }
  };

  const HandleNavigation = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const currentPath = location.pathname;

  const isCurrentPath = (item) => {
    console.log(item)
    console.log(currentPath)
    return currentPath.startsWith(item.path);
  };


  useEffect(() => {
    const HandleNavigation = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", HandleNavigation);

    const timeout = setTimeout(() => {
      HandleNavigation();
    }, 0);

    return () => {
      window.removeEventListener("resize", HandleNavigation);
      clearTimeout(timeout);
    };
  }, []);


  return (
    <div className="min-h-screen bg-[#f3f2f1] overflow-x-hidden">

      {/* --- BARRA SUPERIOR (NAVBAR) Fija arriba --- */}
      <nav className="fixed top-0 left-0 w-full z-50 flex h-14 items-center justify-between bg-white border-b border-zinc-200 px-6 ">

        {/* Lado Izquierdo: Logo y Botón de Menú juntos */}
        <div className="flex items-center gap-6">
          <Link
            to={"/"}>
            <img
              src={logoEmpresa}
              alt="Logotipo LEB"
              className="h-8 w-auto cursor-pointer object-contain transition-transform hover:scale-105"
            />
          </Link>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-gray-100 focus:outline-none"
          >
            <Menu />
          </button>
        </div>

        {/* Lado Derecho: Avatar del Usuario */}
        <div className="flex items-center">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="hover:opacity-70 cursor-pointer"
            >
              <Avatar src={usuarioLogueado.foto_url} />
            </button>

            {/* Menú Desplegable (Cierra con clic afuera o a los 15s) */}
            {isUserMenuOpen && (
              <DropdownMenu items={menuItems} />
            )}
          </div>
        </div>
      </nav>

      {/* --- BARRA LATERAL (SIDEBAR) A la Izquierda --- */}
      <div
        className={`fixed left-0 top-13 z-40 h-[calc(100vh-54px)] w-72 bg-white border-r border-zinc-200 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col gap-2 p-4 mt-4">
          {routes
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={HandleNavigation}
                  className={`rounded-xl flex flex-row items-center gap-2 px-4 py-3 text-left text-sm text-zinc-800 transition-colors hover:bg-brand-primary/10 ${isActive ? "bg-brand-primary/10" : ""}`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL DINÁMICO --- */}
      {/* Cambié pt-[90px] a pt-[72px] para que pegue exacto con tu barra de arriba que mide 72px */}
      <div className={`transition-all duration-300 ease-in-out pt-14 ${isSidebarOpen ? 'md:ml-72' : 'ml-0'}`}>

        {/* Dejamos el main completamente libre para que las pantallas decidan su propio tamaño */}
        <main className="w-full">
          <Outlet />
        </main>

      </div>

      <ProfileFormModal open={isModalProfileOpen} onClose={() => { setModalProfileOpen(false) }} user={user} onSubmit={guardarPerfil} />
    </div>
  );
}

export default AdminPanel;