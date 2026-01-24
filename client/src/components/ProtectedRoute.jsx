import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-4">Caricamento...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return <Outlet />;
};

export default ProtectedRoute;
