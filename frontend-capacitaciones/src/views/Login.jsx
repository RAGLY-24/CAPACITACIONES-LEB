import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logoEmpresa from '../assets/leb_logotipo.png';
import fondoLogin from '../assets/paisaje-fondo-2.jpg';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // <-- Nuevo estado para mostrar errores de login
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos cualquier error previo al intentar de nuevo

    try {
      // 1. Hacemos la petición a tu backend de Laravel
      const response = await axios.post('http://localhost:8000/api/login', {
        usuario: email,
        password: password
      });

      // 2. Si Laravel nos dice que todo está bien
      if (response.data.status === 'success') {
        console.log("Acceso concedido. Datos del usuario:", response.data.user);

        // 3. Navegamos automáticamente a la pantalla de administrador
        navigate('/admin');
      }
    } catch (err) {
      // 4. Si Laravel rechaza el login (Error 401)
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
      </div>
    </div>
  );
}

export default Login;