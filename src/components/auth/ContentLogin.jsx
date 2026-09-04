import { GoogleLogin } from '@react-oauth/google'
import { HiOutlineUserCircle } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { loginService } from '../../services/api';

import './ContentLogin.css'

function ContentLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { refreshAuth } = useAuth();

    const handleGoogleSuccess = async (credentialResponse) => {
        const idToken = credentialResponse.credential;
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`,
                { idToken }
            );
            const { token } = res.data;
            localStorage.setItem('token', token);
            refreshAuth();
            navigate('/')
        } catch (err) {
            console.error('Đăng nhập thất bại:', err);
            setError('Đăng nhập thất bại, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginGuest = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await loginService.loginAsGuest();
            const { token } = res;
            localStorage.setItem('token', token);
            refreshAuth();
            navigate('/');
        } catch (err) {
            navigate('/Login');

            console.error('Đăng nhập guest thất bại:', err);
            setError('Đăng nhập thất bại, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="content-login">
            <h1 className="content-login__title">DISRESPECT <br /> TO <br /> GET <br /> RESPECT</h1>

            <div className="google-login-wrapper">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Đăng nhập Google thất bại')}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="320"
                />
            </div>

            {loading && <p className="content-login__status">Đang đăng nhập...</p>}
            {error && <p className="content-login__error">{error}</p>}

            <button
                className="google-login-button"
                type="button"
                style={{ backgroundColor: '#000300', color: '#fff' }}
                onClick={handleLoginGuest}
                disabled={loading}
            >
                <HiOutlineUserCircle className="google-login-button__icon" size={27} aria-hidden="true" />
                <span>Sử dụng không cần tài khoản</span>
            </button>
        </div>
    )
}

export default ContentLogin