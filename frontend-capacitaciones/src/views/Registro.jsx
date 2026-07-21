import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import logoEmpresa from '../assets/leb_logotipo.png';
import fondoLogin from '../assets/paisaje-fondo-2.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const estadoInicialForm = {
  name: "", lastname: "", email: "", usuario: "", socio_id: "",
  password: "", confirmPassword: "",
};

function Registro() {
  const [formData, setFormData] = useState(estadoInicialForm);
  const [erroresForm, setErroresForm] = useState({});
  const [socios, setSocios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/api/socios-publico`)
      .then(res => setSocios(res.data))
      .catch(() => { });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (erroresForm[name]) setErroresForm({ ...erroresForm, [name]: null });
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!formData.name) nuevosErrores.name = "El nombre es obligatorio.";
    if (!formData.email) nuevosErrores.email = "El correo es obligatorio.";
    else if (!regexEmail.test(formData.email)) nuevosErrores.email = "Formato de correo inválido.";
    if (!formData.usuario) nuevosErrores.usuario = "El usuario es obligatorio.";
    if (!formData.password) nuevosErrores.password = "La contraseña es obligatoria (mín. 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial).";
    else if (!regexPassword.test(formData.password)) nuevosErrores.password = "Debe tener mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.";
    if (formData.password !== formData.confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden.";

    setErroresForm(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    Swal.fire({
      title: 'Creando tu cuenta...', text: 'Por favor, espera un momento.',
      allowOutsideClick: false, didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await axios.post(`${API_URL}/api/register`, {
        name: formData.name,
        lastname: formData.lastname,
        email: formData.email,
        usuario: formData.usuario,
        socio_id: formData.socio_id || null,
        password: formData.password,
      });

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
      sessionStorage.removeItem("aviso_colapsado");

      Swal.close();
      navigate('/admin/noticias', { replace: true });
    } catch (err) {
      Swal.close();
      if (err.response?.status === 422) {
        const erroresBackend = err.response.data.errors || {};
        const mapeoErrores = {};
        Object.keys(erroresBackend).forEach(key => { mapeoErrores[key] = erroresBackend[key][0]; });
        setErroresForm(mapeoErrores);
      } else {
        Swal.fire({ icon: 'error', title: 'Error al registrarte', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#802907' });
      }
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-10"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${fondoLogin})`
      }}
    >
      <div className="w-full max-w-[520px] bg-white p-11 shadow-[0_2px_6px_rgba(0,0,0,0.2)] rounded-2xl">

        <div className="mb-8 flex flex-col items-center justify-center">
          <img src={logoEmpresa} alt="Logotipo de la empresa" className="mb-2 h-20 w-auto" />
          <span className="mb-6 text-center font-['Segoe_UI',Arial,sans-serif] text-[18px] font-semibold text-[#737373]">
            Capacitaciones
          </span>
        </div>

        <h1 className="mb-1 text-[24px] font-semibold text-[#1b1b1b]">Crear cuenta</h1>
        <p className="mb-6 text-sm text-gray-500">Tu cuenta tendrá acceso a Noticias y a tus Capacitaciones.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none" />
            {erroresForm.name && <p className="mt-1 text-xs text-red-500">{erroresForm.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Apellido</label>
            <input type="text" name="lastname" value={formData.lastname} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Correo Electrónico <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none" />
            {erroresForm.email && <p className="mt-1 text-xs text-red-500">{erroresForm.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Usuario de acceso <span className="text-red-500">*</span></label>
            <input type="text" name="usuario" value={formData.usuario} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none" />
            {erroresForm.usuario && <p className="mt-1 text-xs text-red-500">{erroresForm.usuario}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">Socio / Empresa</label>
            <select name="socio_id" value={formData.socio_id} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none">
              <option value="">Sin asociación</option>
              {socios.map((socio) => (
                <option key={socio.id} value={socio.id}>{socio.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Contraseña <span className="text-red-500">*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none" />
            {erroresForm.password && <p className="mt-1 text-xs text-red-500">{erroresForm.password}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Repetir Contraseña <span className="text-red-500">*</span></label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-[#802907] focus:outline-none" />
            {erroresForm.confirmPassword && <p className="mt-1 text-xs text-red-500">{erroresForm.confirmPassword}</p>}
          </div>

          <div className="sm:col-span-2 mt-2 flex items-center justify-center">
            <button type="submit"
              className="rounded-md bg-[#802907] px-8 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-[#4e1802]">
              Crear cuenta
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link to="/" className="font-semibold text-[#802907] hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;
