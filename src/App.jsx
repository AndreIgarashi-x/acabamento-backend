import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Timer from './pages/Timer';

// Componente para proteger rotas (requer autenticação)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/" element={<Login />} />
        
        {/* Rotas protegidas */}
        <Route 
          path="/timer" 
          element={
            <ProtectedRoute>
              <Timer />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota padrão (redireciona para login) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;