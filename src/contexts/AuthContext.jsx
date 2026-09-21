// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshFlag, setRefreshFlag] = useState(0); // 👈 chỉ dùng để trigger lại effect

    useEffect(() => {
        async function verifyToken() {
            const token = localStorage.getItem('token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            setLoading(true); // 👈 nên set lại true khi verify lại (tùy bạn có muốn hiện loading hay không)
            try {
                const profile = await authService.getMe();
                setUser(profile);
            } catch {
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        verifyToken();
    }, [refreshFlag]); // 👈 thêm refreshFlag vào dependency

    // Hàm này export ra để gọi sau khi login xong
    const refreshAuth = useCallback(() => {
        setRefreshFlag(prev => prev + 1);
    }, []);


    return (
        <AuthContext.Provider value={{ user, loading, setUser, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth phải được dùng bên trong AuthProvider');
    }
    return ctx;
}