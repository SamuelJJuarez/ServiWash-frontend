import { useState } from 'react';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { registrarUsuario } from '../api/usuarios.api.js';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';
import { mapRegisterError, validateUsuarioForm } from '../utils/usuarios.js';

const ROLE_OPTIONS = [
  {
    value: 'EMPLEADO',
    label: 'Empleado',
    description: 'Mostrador, cobro de tickets, clientes, estado rápido de máquinas y consulta.',
  },
  {
    value: 'ADMIN',
    label: 'Administrador',
    description: 'Acceso completo: alta de personal, máquinas, catálogo de servicios y borrado.',
  },
];

const horaFmt = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export default function UsuariosAdminPage() {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('EMPLEADO');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [serviceError, setServiceError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [creados, setCreados] = useState([]);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFormError('');
    setServiceError(null);

    const { fieldErrors: errs, payload } = validateUsuarioForm({
      nombre_usuario: nombreUsuario,
      password,
      confirmPassword,
      rol,
    });

    if (!payload) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      // POST /api/v1/usuarios/register responde 200 OK con { msg, id } (docs/api/Usuarios.md).
      const res = await registrarUsuario(payload);
      const registro = {
        id: res?.id ?? '—',
        nombre_usuario: payload.nombre_usuario,
        rol: payload.rol,
        creado_en: new Date(),
      };
      setCreados((prev) => [registro, ...prev]);
      toast.success(`Usuario "${payload.nombre_usuario}" registrado (#${registro.id}).`);

      setNombreUsuario('');
      setPassword('');
      setConfirmPassword('');
      setRol('EMPLEADO');
      setShowPassword(false);
      setShowConfirm(false);
    } catch (err) {
      const mapped = mapRegisterError(err);
      if (mapped.unavailable) {
        setServiceError(err);
      } else if (mapped.field) {
        setFieldErrors({ [mapped.field]: mapped.message });
      } else {
        setFormError(mapped.message);
      }
      toast.error(mapped.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    'min-h-11 w-full rounded-md border bg-white px-3 text-slate-900 placeholder:text-slate-400';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-600">
          Registro de cuentas del personal para el mostrador y la administración.
        </p>
      </div>

      {serviceError && <ServiceUnavailableBanner fallos={[{ servicio: 'Usuarios', error: serviceError }]} />}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <span className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <UserPlus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registrar cuenta</h2>
              <p className="text-sm text-slate-600">Solo administradores pueden dar de alta personal.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="usr-nombre" className="mb-1 block text-sm font-semibold text-slate-700">
                Nombre de usuario
              </label>
              <input
                id="usr-nombre"
                type="text"
                maxLength={100}
                autoComplete="off"
                value={nombreUsuario}
                onChange={(e) => {
                  setNombreUsuario(e.target.value);
                  clearFieldError('nombre_usuario');
                }}
                placeholder="Ej. cajero1"
                aria-invalid={Boolean(fieldErrors.nombre_usuario)}
                className={`${inputBase} ${
                  fieldErrors.nombre_usuario ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              {fieldErrors.nombre_usuario ? (
                <p role="alert" className="mt-1 text-sm text-rose-700">
                  {fieldErrors.nombre_usuario}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Mínimo 3 letras; puedes agregar números solo al final (ej. cajero1).
                </p>
              )}
            </div>

            <div>
              <label htmlFor="usr-password" className="mb-1 block text-sm font-semibold text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="usr-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                    clearFieldError('confirmPassword');
                  }}
                  placeholder="Mínimo 6 caracteres"
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={`${inputBase} pr-12 ${
                    fieldErrors.password ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p role="alert" className="mt-1 text-sm text-rose-700">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="usr-confirm" className="mb-1 block text-sm font-semibold text-slate-700">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="usr-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  placeholder="Repite la contraseña"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  className={`${inputBase} pr-12 ${
                    fieldErrors.confirmPassword ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-800"
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p role="alert" className="mt-1 text-sm text-rose-700">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-700">Rol de acceso</legend>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {ROLE_OPTIONS.map((opt) => {
                  const active = rol === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        active
                          ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-200'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rol"
                        value={opt.value}
                        checked={active}
                        onChange={() => {
                          setRol(opt.value);
                          clearFieldError('rol');
                        }}
                        className="mt-1 size-4 accent-sky-600"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-semibold text-slate-900">
                          {opt.label}
                          <Badge tone={opt.value === 'ADMIN' ? 'dark' : 'sky'}>{opt.value}</Badge>
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-600">{opt.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.rol && (
                <p role="alert" className="mt-1 text-sm text-rose-700">
                  {fieldErrors.rol}
                </p>
              )}
            </fieldset>

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-base font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              {submitting ? (
                <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <UserPlus className="size-5" aria-hidden="true" />
              )}
              {submitting ? 'Registrando…' : 'Registrar usuario'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cuentas creadas en esta sesión</h2>
              <p className="text-sm text-slate-600">
                Referencia inmediata de los usuarios registrados desde que abriste esta pantalla.
              </p>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700">
              {creados.length} {creados.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>

          <div className="mt-4">
            {creados.length === 0 ? (
              <EmptyState>
                Aún no has registrado usuarios en esta sesión. Usa el formulario para crear una cuenta.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th scope="col" className="px-4 py-3">ID</th>
                      <th scope="col" className="px-4 py-3">Usuario</th>
                      <th scope="col" className="px-4 py-3">Rol</th>
                      <th scope="col" className="px-4 py-3 text-right">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {creados.map((u, idx) => (
                      <tr key={`${u.id}-${u.nombre_usuario}-${idx}`} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-600">
                          #{u.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                                u.rol === 'ADMIN'
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-sky-50 text-sky-700'
                              }`}
                            >
                              {u.rol === 'ADMIN' ? (
                                <ShieldCheck className="size-4" aria-hidden="true" />
                              ) : (
                                <UserRound className="size-4" aria-hidden="true" />
                              )}
                            </span>
                            <span className="font-semibold text-slate-900">{u.nombre_usuario}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge tone={u.rol === 'ADMIN' ? 'dark' : 'sky'}>{u.rol}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                          {horaFmt.format(u.creado_en)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
