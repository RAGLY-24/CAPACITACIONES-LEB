import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import logoEmpresa from '../assets/leb_logotipo.png';
import { useLogin } from "../hooks/auth/useLogin";


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = useLogin();


  const navigate = useNavigate();

  const getDefaultAdminPath = () => '/noticias';

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      // Si ya tiene token, leemos quién es y lo regresamos a su panel
      const datosUsuario = sessionStorage.getItem('user');
      const usuarioLogueado = datosUsuario ? JSON.parse(datosUsuario) : null;

      if (usuarioLogueado) {
        navigate(getDefaultAdminPath(), { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Mostrar pantalla de carga interactiva
    Swal.fire({
      title: 'Iniciando Sesión...',
      text: 'Por favor, espera un momento.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    try {
      await login.mutateAsync({
        username: email,
        password: password
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError("Usuario o contraseña incorrectos");
        } else if (!error.response) {
          setError("Servidor no disponible");
        } else {
          setError("Ocurrió un error al iniciar sesión");
        }
      }
    }
    finally {
      Swal.close();
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-100 bg-cover bg-center bg-no-repeat p-4"
      style={{
        //backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.0), rgba(0, 0, 0, 0.6)), url(${fondoLogin})`
      }}
    >
      {/* Se ajustó el max-w, padding (p-8 sm:p-10), se redondeó un poco más (rounded-[24px]) y se agregó una sombra muy suave (shadow-sm) para dar el efecto flotante de la imagen */}
      <div className="w-full max-w-110 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm ">

        {/* --- ENCABEZADO CENTRADO --- */}
        {/* Se ajustó el espaciado (gap) para que la jerarquía visual sea como en "Welcome back" */}
        <div className="mb-4 flex flex-col items-center justify-center gap-1">
          <img
            src={logoEmpresa}
            alt="Logotipo de la empresa"
            className="h-14 w-auto"
          />
          <h1 className="text-center text-[28px] font-semibold tracking-tight text-[#1b1b1b]">
            Iniciar sesión
          </h1>
          <span className="text-center text-[15px] font-normal text-slate-500">
            Capacitaciones
          </span>
        </div>

        {/* --- Aquí se muestra el error si la contraseña está mal --- */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            {/* Campo de Usuario */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-slate-700">
                Usuario
              </label>
              <input
                type="text"
                placeholder="Usuario"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-100  px-4 py-3 text-[15px] text-black placeholder-gray-400 outline-none transition-all focus:border-[#0067b8] focus:bg-white focus:ring-1 focus:ring-[#0067b8]"
                required
              />
            </div>

            {/* Campo de Contraseña */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-slate-700">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-[15px] text-black placeholder-gray-400 outline-none transition-all focus:border-[#0067b8] focus:bg-white focus:ring-1 focus:ring-[#0067b8]"
                required
              />
            </div>
          </div>

          <div className="mt-2 w-full">
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-primary px-4 py-2 text-md  text-white transition-colors hover:bg-[#4e1802]"
            >
              Iniciar Sesion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;