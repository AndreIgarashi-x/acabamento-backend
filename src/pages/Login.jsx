import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!matricula) {
      setError('Digite sua matrícula');
      return;
    }

    if (pin.length !== 6) {
      setError('PIN deve ter 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(matricula, pin);
      
      if (response.data.success) {
        // Salvar token e dados do usuário
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // Redirecionar para o timer
        navigate('/timer');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.response?.data?.message || 'Matrícula ou PIN inválidos');
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (value) => {
    // Apenas números, máximo 6 dígitos
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(numericValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <LogIn className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Cronometragem
          </h1>
          <p className="text-gray-600">
            Acabamento - DCJ Uniformes
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Matrícula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matrícula
            </label>
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="ANDRE001"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN (6 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => handlePinInput(e.target.value)}
              placeholder="• • • • • •"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-2xl tracking-widest text-center"
              maxLength="6"
              disabled={loading}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              {pin.length}/6 dígitos
            </p>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !matricula || pin.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Informação adicional */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Digite sua matrícula e PIN para acessar</p>
        </div>
      </div>
    </div>
  );
}