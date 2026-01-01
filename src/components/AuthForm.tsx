import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus, Heart, Sparkles } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrio un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-white flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,192,203,0.35), rgba(255,255,255,0.7)), url("https://ibb.co/21HfMPtV")`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-pink-400 text-8xl">🎀</div>
        <div className="absolute top-32 right-20 text-pink-400 text-6xl">💕</div>
        <div className="absolute bottom-20 left-32 text-pink-400 text-7xl">🌸</div>
        <div className="absolute bottom-40 right-40 text-pink-400 text-6xl">✨</div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-6xl">🎀</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
              Mi Agenda Kawaii
            </h1>
            <div className="text-6xl">💖</div>
          </div>
          <p className="text-pink-400 text-lg">¡Organiza tus tareas con mucho amor y estilo Hello Kitty!</p>
          <p className="text-pink-300 text-sm">Crea tu cuenta o inicia sesión para recibir mensajes personalizados.</p>
          <div className="flex justify-center mt-4">
            <img
              src="https://ibb.co/FQxtypm"
              alt="Hello Kitty"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 p-8">
          <div className="flex gap-2 mb-6 bg-pink-50 p-2 rounded-2xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md'
                  : 'text-pink-400 hover:bg-pink-100'
              }`}
            >
              Iniciar Sesion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-md'
                  : 'text-pink-400 hover:bg-pink-100'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400" size={20} />
                <input
                  type="email"
                  placeholder="Correo electronico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-pink-300"
                />
              </div>
              <p className="text-pink-300 text-xs mt-1">Usa tu correo favorito; Hello Kitty lo guardará seguro.</p>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400" size={20} />
                <input
                  type="password"
                  placeholder="Contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-gray-700 placeholder-pink-300"
                />
              </div>
              <p className="text-pink-300 text-xs mt-1">Mínimo 6 caracteres. ¡Añade símbolos para más brillo!</p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span>Cargando...</span>
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLogin ? 'Iniciar Sesion' : 'Crear Cuenta'}
                </>
              )}
            </button>

            <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-3 flex items-center gap-2 text-pink-500 text-sm">
              <Sparkles size={16} />
              <span>Recibe alertas dulces y mensajes claros para tu día a día.</span>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-pink-400">
            <img
              src="https://ibb.co/Q38xDy8X"
              alt="Hello Kitty decorativa"
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-3 shadow-lg"
            />
            <div className="flex items-center justify-center gap-2">
              <Heart size={16} className="text-pink-400" />
              {isLogin ? '¿No tienes cuenta? Registrate arriba' : '¿Ya tienes cuenta? Inicia sesion arriba'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
