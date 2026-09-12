// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // context bạn đang có user, loading

function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    // console.log('ProtectedRoute render, user:', user);
    if (loading) {
        return <div>Đang tải...</div>; // tránh flash nội dung trước khi biết user là ai
    }

    if (!user) {
        // Chưa đăng nhập -> đá về login
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.UserType)) {
        // Đã đăng nhập nhưng sai quyền -> đá về trang 403 hoặc trang chủ
        return <Navigate to="/403" replace />;
    }

    return children;
}

export default ProtectedRoute;