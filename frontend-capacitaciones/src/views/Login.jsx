import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import logoEmpresa from "../assets/leb_logotipo.png";
import bg from "../assets/bg.jpeg";
import { useLogin } from "../hooks/auth/useLogin";
import PasswordInput from "../components/Fields/PasswordInput";
import Input from "../components/Fields/Input";
import Button from "../components/Buttons/Button";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    Swal.fire({
      title: "Iniciando Sesión...",
      text: "Por favor, espera un momento.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await login.mutateAsync({
        username: email,
        password,
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
    } finally {
      Swal.close();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">

      {/* Fondo */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
        style={{ backgroundImage: `url(${bg})` }}
      />

      {/* Oscurecer */}
      <div className="absolute inset-0 bg-slate-200/80" />

      {/* Cuadrícula */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Tarjeta */}
      <div className="relative z-10 w-full max-w-107.5 rounded-3xl border border-white/50 bg-white p-8 shadow-[0_25px_80px_rgba(0,0,0,.35)]">

        <div className="mb-8 flex flex-col items-center gap-2">
          <img src={logoEmpresa} alt="Logo empresa" className="h-16 w-auto" />

          <h1 className="text-center text-[28px] font-semibold tracking-tight text-[#1b1b1b]">
            Iniciar sesión
          </h1>

          <span className="text-center text-md text-slate-500">
            Capacitaciones
          </span>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <Input
              label="Usuario"
              type="text"
              name="user"
              placeholder="Ej: user"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <PasswordInput
              label="Contraseña"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit">
            Iniciar Sesión
          </Button>
        </form>

      </div>
    </div>
  );
}

export default Login;