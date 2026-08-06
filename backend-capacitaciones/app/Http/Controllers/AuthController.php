<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\EnlaceRegistro;
use App\Models\Puesto;
use App\Models\User;

class AuthController extends Controller
{
    // Registro público desde la pantalla de Login. Solo es accesible mediante
    // un enlace temporal de un solo uso generado por un admin (ver
    // EnlaceRegistroController), que expira 30 minutos después de generado.
    // A diferencia de cuando un admin crea un usuario, aquí no se puede
    // elegir puesto ni permisos: la cuenta siempre nace como "Operador" con
    // acceso solo a noticias y a realizar capacitaciones (mismos permisos
    // por defecto que UsuarioController asigna a cualquier puesto que no sea
    // SistemasAdmin/Gerente). Para acceder a más secciones, un admin debe
    // editar sus permisos después, como a cualquier otro usuario.
    public function register(Request $request)
    {
        $esOperador = $request->boolean('es_operador');

        $request->validate([
            'name' => 'required|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'usuario' => 'required|string|max:255|unique:users',
            'socio_id' => 'nullable|exists:socios,id',
            'enlace_token' => 'required|string',
            'password' => [
                'required',
                'string',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/'
            ],
            'es_operador' => 'sometimes|boolean',
            'operador_nombre_completo' => $esOperador ? 'required|string|max:255' : 'nullable|string|max:255',
            'operador_numero_economico_tractor' => $esOperador ? 'required|string|max:255' : 'nullable|string|max:255',
            'operador_placas_remolque' => $esOperador ? 'required|string|max:255' : 'nullable|string|max:255',
            'operador_folio' => $esOperador ? 'required|string|max:255' : 'nullable|string|max:255',
            'operador_numero_licencia' => $esOperador ? 'required|string|max:255' : 'nullable|string|max:255',
        ], [
            'email.unique' => 'El correo ya está registrado.',
            'usuario.unique' => 'El nombre de usuario ya existe.',
            'password.regex' => 'La contraseña no cumple con las políticas de seguridad.',
            'operador_nombre_completo.required' => 'El nombre completo del operador es obligatorio.',
            'operador_numero_economico_tractor.required' => 'El número económico del tracto es obligatorio.',
            'operador_placas_remolque.required' => 'Las placas del remolque son obligatorias.',
            'operador_folio.required' => 'El folio es obligatorio.',
            'operador_numero_licencia.required' => 'El número de licencia es obligatorio.',
        ]);

        $enlace = EnlaceRegistro::where('token', $request->enlace_token)->first();
        if (!$enlace || !$enlace->estaVigente()) {
            return response()->json([
                'message' => 'El enlace de registro no es válido o ya expiró. Solicita uno nuevo a un administrador.'
            ], 410);
        }

        $puestoOperador = Puesto::firstOrCreate(['nombre' => 'Operador']);

        $user = User::create([
            'name' => $request->name,
            'lastname' => $request->lastname,
            'email' => $request->email,
            'usuario' => $request->usuario,
            'puesto_id' => $puestoOperador->id,
            'socio_id' => $request->socio_id,
            'estado' => 'Activo',
            'password' => $request->password,
            'es_operador' => $esOperador,
            'operador_nombre_completo' => $esOperador ? $request->operador_nombre_completo : null,
            'operador_numero_economico_tractor' => $esOperador ? $request->operador_numero_economico_tractor : null,
            'operador_placas_remolque' => $esOperador ? $request->operador_placas_remolque : null,
            'operador_folio' => $esOperador ? $request->operador_folio : null,
            'operador_numero_licencia' => $esOperador ? $request->operador_numero_licencia : null,
            'permissions' => [
                'manage_news' => false,
                'news_access' => true,
                'edit_capacitaciones_course' => false,
                'view_reports' => false,
                'manage_content' => false,
            ],
        ]);

        $enlace->update(['used_at' => now()]);

        $token = $user->createToken('token-auth')->plainTextToken;
        $user->load('puesto');

        return response()->json([
            'status' => 'success',
            'message' => 'Registro exitoso',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        // 1. Validar que React nos mande los datos
        $request->validate([
            'usuario' => 'required|string',
            'password' => 'required|string',
        ]);

        // 2. Buscar el usuario por su nombre de usuario
        $user = User::where('usuario', $request->usuario)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuario o contraseña incorrectos'
            ], 401);
        }

        // 3. Borramos tokens anteriores por seguridad
        //$user->tokens()->delete();

        // 4. Generamos el token para React
        $token = $user->createToken('token-auth')->plainTextToken;
        // Cargar relación puesto para que el frontend pueda leer el rol
        $user->load('puesto');

        return response()->json([
            'status' => 'success',
            'message' => 'Login correcto',
            'token' => $token,
            'user' => $user
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('puesto'), 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout correcto'
        ], 200);
    }
}