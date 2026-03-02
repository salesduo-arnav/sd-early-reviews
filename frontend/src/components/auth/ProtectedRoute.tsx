import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User is authenticated but doesn't have the right role
        // Redirect them to their respective dashboard
        if (user.role === 'BUYER') return <Navigate to="/buyer" replace />;
        if (user.role === 'SELLER') return <Navigate to="/seller" replace />;
        return <Navigate to="/" replace />;
    }

    // Render child routes
    return <Outlet />;
};
