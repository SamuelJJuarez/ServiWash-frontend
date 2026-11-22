import { Eye, EyeOff, LoaderCircle, Monitor } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logoHorizontal from '../images/Logo_Servi_Wash_horizontal.png';
import logoHorizontalBlanco from '../images/Logo_Servi_Wash_horizontal_blanco.png';

function loginErrorMessage(err) {
  if (err.status === 401) return 'Credenciales inválidas o usuario inactivo';
  if (err.status === 503) return 'El servicio de usuarios no está disponible';
  if (err.status === 0) return 'No se pudo conectar con el servidor. Revisa que el sistema esté encendido.';
  return err.message || 'No se pudo iniciar sesión';
}

/** Ojo de buey de lavadora: el motivo visual del acceso. */
function Porthole() {
  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-sm" aria-hidden="true">
      <defs>
        <clipPath id="glass">
          <circle cx="200" cy="200" r="138" />
        </clipPath>
      </defs>
      <circle cx="200" cy="200" r="184" fill="none" stroke="white" strokeOpacity=".25" strokeWidth="16" />
      <circle cx="200" cy="200" r="146" fill="#0c4a6e" />
      <g clipPath="url(#glass)">
        <path
          d="M0 210 C 60 180, 110 240, 200 205 S 340 175, 400 210 V 400 H 0 Z"
          fill="#38bdf8"
          fillOpacity=".55"
        />
        <path
          d="M0 245 C 70 220, 120 270, 200 240 S 330 215, 400 245 V 400 H 0 Z"
          fill="#0ea5e9"
          fillOpacity=".6"
        />
        <circle cx="150" cy="170" r="10" fill="white" fillOpacity=".5" />
        <circle cx="240" cy="140" r="6" fill="white" fillOpacity=".5" />
        <circle cx="275" cy="190" r="14" fill="white" fillOpacity=".35" />
        <circle cx="205" cy="105" r="4" fill="white" fillOpacity=".5" />
      </g>
      <path d="M92 150 A 124 124 0 0 1 170 82" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || '/';
  if (!isLoading && isAuthenticated) return <Navigate to={from} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!nombre.trim() || !password) {
      setError('Escribe tu usuario y contraseña');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(nombre.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(loginErrorMessage(err));
      setSubmitting(false);
    }
  }

  const inputClass =
    'h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base placeholder:text-slate-400';

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sky-700 p-10 text-white md:flex">
        <img
          src={logoHorizontalBlanco}
          alt="ServiWash"
          className="-my-6 w-72 max-w-full self-start object-contain"
        />
        <div className="grid place-items-center">
          <Porthole />
        </div>
        <p className="max-w-xs text-lg text-sky-100">Tickets, máquinas y turnos del mostrador en un solo lugar.</p>
      </section>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <img
            src={logoHorizontal}
            alt="ServiWash"
            className="-my-3 mb-2 w-56 max-w-full object-contain md:hidden"
          />
          <h1 className="text-3xl font-bold">Iniciar sesión</h1>
          <p className="mt-1 text-slate-600">Entra con tu usuario del mostrador.</p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="usuario" className="mb-1 block font-medium">
                Usuario
              </label>
              <input
                id="usuario"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="username"
                autoFocus
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block font-medium">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 text-lg font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              {submitting && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <a
            href="/tablero"
            className="mt-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-700"
          >
            <Monitor className="size-4" aria-hidden="true" />
            Abrir el tablero de turnos
          </a>
        </div>
      </main>
    </div>
  );
}
