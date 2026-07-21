import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import logoEmpresa from '../assets/leb_logotipo.png';
import fondoLogin from '../assets/paisaje-fondo-2.jpg';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getDefaultAdminPath = () => '/admin/noticias';

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
      const response = await axios.post('http://localhost:8000/api/login', {
        usuario: email,
        password: password
      });

      if (response.data.status === 'success') {
        const usuarioLogueado = response.data.user;

        // Guardamos el token en sessionStorage para forzar login al cerrar pestaña
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("user", JSON.stringify(usuarioLogueado));
        // El aviso de emergencia siempre debe iniciar expandido en cada login.
        sessionStorage.removeItem("aviso_colapsado");

        Swal.close();

        // REDIRECCIÓN INTELIGENTE: la pantalla de noticias es la predeterminada para todos
        navigate(getDefaultAdminPath(), { replace: true });
      }
    } catch (err) {
      // 3. Cerramos la alerta de carga si ocurre un error
      Swal.close();

      if (err.response && err.response.status === 401) {
        setError("Usuario o contraseña incorrectos");
      } else {
        setError("Error al conectar con el servidor. Revisa que Laravel esté encendido.");
      }
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${fondoLogin})`
      }}
    >
      <div className="w-full max-w-[440px] bg-white p-11 shadow-[0_2px_6px_rgba(0,0,0,0.2)] rounded-2xl">

        {/* --- ENCABEZADO CENTRADO --- */}
        <div className="mb-8 flex flex-col items-center justify-center">
          <img
            src={logoEmpresa}
            alt="Logotipo de la empresa"
            className="mb-2 h-20 w-auto"
          />
          <span className="mb-6 text-center font-['Segoe_UI',Arial,sans-serif] text-[18px] font-semibold text-[#737373]">
            Capacitaciones
          </span>
        </div>

        <h1 className="mb-4 text-[24px] font-semibold text-[#1b1b1b]">Iniciar sesión</h1>

        {/* --- Aquí se muestra el error si la contraseña está mal --- */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-black pb-2 pt-1 text-[15px] text-black placeholder-gray-600 outline-none transition-colors focus:border-b-2 focus:border-[#0067b8]"
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-black pb-2 pt-1 text-[15px] text-black placeholder-gray-600 outline-none transition-colors focus:border-b-2 focus:border-[#0067b8]"
              required
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="rounded-md bg-[#802907] px-8 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-[#4e1802]"
            >
              Iniciar Sesion
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No tienes cuenta? <Link to="/registro" className="font-semibold text-[#802907] hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;