import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Giriş yapılmamışsa login'e yönlendirir.
export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
