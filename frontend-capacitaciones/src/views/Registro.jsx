import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import logoEmpresa from '../assets/leb_logotipo.png';
import { URL } from "../api/http.client";
import Button from "../components/Buttons/Button";


import bg from "../assets/bg.jpeg";
import PasswordInput from "../components/Fields/PasswordInput";
import Input from "../components/Fields/Input";
import Select from "../components/Fields/Select";
import { useAuth } from "../context/AuthContext";

const API_URL = URL


const estadoInicialForm = {
  name: "", lastname: "", email: "", usuario: "", socio_id: "",
  password: "", confirmPassword: "",
  es_operador: false,
  operador_nombre_completo: "",
  operador_numero_economico_tractor: "",
  operador_placas_remolque: "",
  operador_folio: "",
  operador_numero_licencia: "",
};

function Registro() {
  const [formData, setFormData] = useState(estadoInicialForm);
  const [erroresForm, setErroresForm] = useState({});
  const [socios, setSocios] = useState([]);
  const [searchParams] = useSearchParams();
  const enlaceToken = searchParams.get("enlace");
  const [estadoEnlace, setEstadoEnlace] = useState("cargando"); // cargando | valido | invalido

  const { setToken } = useAuth();


  useEffect(() => {
    axios.get(`${API_URL}/api/socios-publico`)
      .then(res => setSocios(res.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!enlaceToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstadoEnlace("invalido");
      return;
    }
    axios.get(`${API_URL}/api/enlaces-registro/${enlaceToken}/estado`)
      .then(res => setEstadoEnlace(res.data.valido ? "valido" : "invalido"))
      .catch(() => setEstadoEnlace("invalido"));
  }, [enlaceToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (erroresForm[name]) setErroresForm({ ...erroresForm, [name]: null });
  };

  /*
  const handleEsOperadorChange = (e) => {
    const esOperador = e.target.value === "si";
    setFormData({
      ...formData,
      es_operador: esOperador,
      ...(esOperador ? {} : {
        operador_nombre_completo: "",
        operador_numero_economico_tractor: "",
        operador_placas_remolque: "",
        operador_folio: "",
        operador_numero_licencia: "",
      }),
    });
    setErroresForm({
      ...erroresForm,
      operador_nombre_completo: null,
      operador_numero_economico_tractor: null,
      operador_placas_remolque: null,
      operador_folio: null,
      operador_numero_licencia: null,
    });
  };

   */
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

    if (formData.es_operador) {
      if (!formData.operador_nombre_completo) nuevosErrores.operador_nombre_completo = "El nombre completo del operador es obligatorio.";
      if (!formData.operador_numero_economico_tractor) nuevosErrores.operador_numero_economico_tractor = "El número económico del tracto es obligatorio.";
      if (!formData.operador_placas_remolque) nuevosErrores.operador_placas_remolque = "Las placas del remolque son obligatorias.";
      if (!formData.operador_folio) nuevosErrores.operador_folio = "El folio es obligatorio.";
      if (!formData.operador_numero_licencia) nuevosErrores.operador_numero_licencia = "El número de licencia es obligatorio.";
    }

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
        enlace_token: enlaceToken,
        es_operador: formData.es_operador,
        ...(formData.es_operador ? {
          operador_nombre_completo: formData.operador_nombre_completo,
          operador_numero_economico_tractor: formData.operador_numero_economico_tractor,
          operador_placas_remolque: formData.operador_placas_remolque,
          operador_folio: formData.operador_folio,
          operador_numero_licencia: formData.operador_numero_licencia,
        } : {}),
      });

      //sessionStorage.setItem("token", response.data.token);
      //sessionStorage.setItem("user", JSON.stringify(response.data.user));
      //sessionStorage.removeItem("aviso_colapsado");

      Swal.close();
      //navigate('/noticias', { replace: true });
      setToken(response.data.token)
    } catch (err) {
      Swal.close();
      console.log(err.response.status)
      if (err.response?.status === 422) {
        const erroresBackend = err.response.data.errors || {};
        const mapeoErrores = {};
        Object.keys(erroresBackend).forEach(key => { mapeoErrores[key] = erroresBackend[key][0]; });
        setErroresForm(mapeoErrores);
      } else if (err.response?.status === 410) {
        setEstadoEnlace("invalido");
        Swal.fire({ icon: 'error', title: 'Enlace expirado', text: err.response.data.message || 'El enlace de registro ya no es válido.', confirmButtonColor: '#802907' });
      } else {
        Swal.fire({ icon: 'error', title: 'Error al registrarte', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#802907' });
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">

      {/* Fondo */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-200/80" />

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:48px_48px]" />


      {/* Card */}
      <div className="
      relative z-10 
      w-full max-w-3xl
      rounded-3xl 
      border border-white/50
      bg-white 
      p-8
      shadow-[0_25px_80px_rgba(0,0,0,.35)]
    ">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <img
            src={logoEmpresa}
            alt="Logo empresa"
            className="h-16 w-auto"
          />

          <h1 className="
          text-center 
          text-[28px]
          font-semibold
          tracking-tight
          text-[#1b1b1b]
        ">
            Crear cuenta
          </h1>

          <span className="text-center text-md text-slate-500">
            Capacitaciones
          </span>
        </div>


        {estadoEnlace === "cargando" && (
          <p className="mb-6 text-center text-sm text-gray-500">
            Verificando enlace de registro...
          </p>
        )}


        {estadoEnlace === "invalido" && (
          <div className="
          mb-5
          rounded-xl
          border border-red-200
          bg-red-50
          p-4
          text-sm
          text-red-600
        ">
            Este enlace de registro no es válido, ya fue utilizado o ha expirado.
          </div>
        )}




        {estadoEnlace === "valido" && (

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-2 gap-4 "
          >


            <Input
              label="Nombre"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Juan"
              required
            />


            <Input
              label="Apellido"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              placeholder="Ej: Pérez"
            />


            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={erroresForm.email}

            />


            <Input
              label="Usuario de acceso"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              required
              error={erroresForm.usuario}
            />

            <Select
              label="Socio / Empresa"
              name="socio_id"
              value={formData.socio_id}
              onChange={handleChange}
              containerClassName="col-span-2"
              options={[
                {
                  value: "",
                  label: "Sin asociación"
                },
                ...socios.map((socio) => ({
                  value: socio.id,
                  label: socio.nombre
                }))
              ]}
            />



            <PasswordInput
              label="Contraseña"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />


            <PasswordInput
              label="Repetir Contraseña"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />



            <div className="flex col-span-2 mt-3 w-full  items-center justify-center">

              <Button type="submit" className="w-full">
                Crear cuenta
              </Button>

            </div>


          </form>

        )}



        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/"
            className="
            font-semibold 
            text-[#802907]
            hover:underline
          "
          >
            Inicia sesión
          </Link>
        </p>


      </div>

    </div>
  );
}

export default Registro;
