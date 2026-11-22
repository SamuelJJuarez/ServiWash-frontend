export const ROLES_USUARIO = ['EMPLEADO', 'ADMIN'];

const MAX_USERNAME_LEN = 100;
const MIN_PASSWORD_LEN = 6;
const USERNAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}\d*$/;

/**
 * Valida el formulario de alta de usuario antes de llamar a POST /api/v1/usuarios/register.
 * Devuelve `{ fieldErrors, payload }` donde `payload` es null si hay errores.
 */
export function validateUsuarioForm({ nombre_usuario, password, confirmPassword, rol }) {
  const fieldErrors = {};
  const username = String(nombre_usuario ?? '').trim();
  const pass = String(password ?? '');
  const confirm = String(confirmPassword ?? '');

  if (!username) {
    fieldErrors.nombre_usuario = 'Ingresa un nombre de usuario.';
  } else if (username.length > MAX_USERNAME_LEN) {
    fieldErrors.nombre_usuario = `Máximo ${MAX_USERNAME_LEN} caracteres.`;
  } else if (!USERNAME_RE.test(username)) {
    fieldErrors.nombre_usuario = /^\d|\d.*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(username)
      ? 'No puedes poner números antes de las letras. Usa mínimo 3 letras y números solo al final.'
      : 'Usa mínimo 3 letras (sin espacios) y, opcionalmente, números al final.';
  }

  if (!pass) {
    fieldErrors.password = 'Ingresa una contraseña.';
  } else if (pass.length < MIN_PASSWORD_LEN) {
    fieldErrors.password = `Usa al menos ${MIN_PASSWORD_LEN} caracteres.`;
  }

  if (!confirm) {
    fieldErrors.confirmPassword = 'Confirma la contraseña.';
  } else if (pass !== confirm) {
    fieldErrors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  if (!ROLES_USUARIO.includes(rol)) {
    fieldErrors.rol = 'Selecciona un rol válido (EMPLEADO o ADMIN).';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, payload: null };
  }

  return {
    fieldErrors: {},
    payload: { nombre_usuario: username, password: pass, rol },
  };
}

/** Traduce códigos de error de POST /api/v1/usuarios/register (docs/api/Usuarios.md). */
export function mapRegisterError(err) {
  const status = err?.status;
  if (status === 409) {
    return {
      field: 'nombre_usuario',
      message: 'Este nombre de usuario ya está registrado.',
      unavailable: false,
    };
  }
  if (status === 403) {
    return {
      field: null,
      message: 'Solo un administrador puede registrar usuarios (403).',
      unavailable: false,
    };
  }
  if (status === 400) {
    return {
      field: null,
      message: 'Datos inválidos. Verifica el usuario, la contraseña y el rol.',
      unavailable: false,
    };
  }
  if (status === 401) {
    return {
      field: null,
      message: 'Tu sesión expiró. Vuelve a iniciar sesión.',
      unavailable: false,
    };
  }
  if (status === 503 || status === 0) {
    return {
      field: null,
      message:
        status === 503
          ? 'El servicio de usuarios no está disponible (503).'
          : 'No se pudo conectar con el servidor.',
      unavailable: true,
    };
  }
  if (status === 500) {
    return {
      field: null,
      message: 'El servidor no pudo crear el usuario (500). Intenta nuevamente.',
      unavailable: false,
    };
  }
  return {
    field: null,
    message: err?.message || 'No se pudo registrar el usuario.',
    unavailable: false,
  };
}
