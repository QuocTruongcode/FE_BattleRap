import { GoogleLogin } from '@react-oauth/google'
import { HiOutlineUserCircle } from 'react-icons/hi2'
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { loginService } from '../../services/api';

import './ContentLogin.css'

const API = import.meta.env.VITE_API_BASE_URL;

function ContentLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { refreshAuth } = useAuth();

    // ---- Luồng đăng nhập cho app ----
    const [searchParams] = useSearchParams();

    // Đang chạy trong app Electron? (preload.js bơm cờ này)
    const isApp = !!window.electronAPI?.isApp;

    // Trang được app mở bằng trình duyệt hệ thống, kèm challenge hợp lệ
    const rawChallenge = searchParams.get('challenge') || '';
    const appChallenge =
        searchParams.get('client') === 'app' && /^[A-Za-z0-9_-]{43}$/.test(rawChallenge)
            ? rawChallenge
            : null;

    const [appLink, setAppLink] = useState(null);     // link battlerap://... để mở lại app
    const [checking, setChecking] = useState(false);
    const triedRef = useRef(false);

    // Xin code bằng JWT rồi chuyển hướng về app
    const sendCodeToApp = async (jwt) => {
        const r = await axios.post(
            `${API}/api/auth/app/code`,
            { challenge: appChallenge },
            { headers: { Authorization: `Bearer ${jwt}` } }
        );
        const link = `battlerap://auth?code=${encodeURIComponent(r.data.code)}`;
        setAppLink(link);
        window.location.href = link;
    };

    // Nếu trình duyệt đã đăng nhập sẵn (có token thật) thì dùng luôn, khỏi bấm Google
    useEffect(() => {
        if (!appChallenge || isApp || triedRef.current) return;
        const jwt = localStorage.getItem('token');
        if (!jwt) return;

        triedRef.current = true;                      // chống chạy 2 lần (StrictMode)
        setChecking(true);
        sendCodeToApp(jwt)
            .catch(() => { /* token hết hạn hoặc là guest: để người dùng bấm Google */ })
            .finally(() => setChecking(false));
    }, []);

    const handleGoogleSuccess = async (credentialResponse) => {
        const idToken = credentialResponse.credential;
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(`${API}/api/auth/google`, { idToken });
            const { token } = res.data;

            if (appChallenge) {
                // Đăng nhập cho app: không lưu token ở trình duyệt, trả code về app
                await sendCodeToApp(token);
                return;
            }

            localStorage.setItem('token', token);
            refreshAuth();
            navigate('/')
        } catch (err) {
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
            setError('Đăng nhập thất bại, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Phần chọn cách đăng nhập theo ngữ cảnh
    const renderLogin = () => {
        if (appLink) {
            return (
                <div className="content-login__app-done">
                    <p>Đăng nhập thành công. Hãy quay lại ứng dụng.</p>
                    <button type="button" onClick={() => (window.location.href = appLink)}>
                        Mở lại ứng dụng
                    </button>
                    <p>Bạn có thể đóng tab này sau khi app đã mở.</p>
                </div>
            );
        }
        if (checking) {
            return <p className="content-login__status">Đang kết nối với ứng dụng...</p>;
        }
        if (isApp) {
            // Trong Electron: GoogleLogin bị Google chặn, mở trình duyệt hệ thống thay thế
            return (
                <div className="google-login-wrapper">
                    <button
                        type="button"
                        className="google-login-button"
                        style={{ backgroundColor: '#000300', color: '#fff' }}
                        onClick={() => window.electronAPI.startLogin()}
                    >
                        <span>Đăng nhập Google bằng trình duyệt</span>
                    </button>
                    <p className="content-login__status">
                        Trình duyệt sẽ mở ra, đăng nhập xong hãy quay lại ứng dụng.
                    </p>
                </div>
            );
        }
        return (
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
        );
    };

    return (
        <div className="content-login">
            <h1 className="content-login__title">
                <span className="content-login__word content-login__word--1">DISRESPECT</span><br />
                <span className="content-login__word content-login__word--2">TO</span><br />
                <span className="content-login__word content-login__word--3">GET</span><br />
                <span className="content-login__word content-login__word--4">RESPECT</span>
            </h1>

            {renderLogin()}

            {loading && <p className="content-login__status">Đang đăng nhập...</p>}
            {error && <p className="content-login__error">{error}</p>}

            {/* <button
                className="google-login-button"
                type="button"
                style={{ backgroundColor: '#000300', color: '#fff' }}
                onClick={handleLoginGuest}
                disabled={loading}
            >
                <HiOutlineUserCircle className="google-login-button__icon" size={27} aria-hidden="true" />
                <span>Sử dụng không cần tài khoản</span>
            </button> */}
        </div>
    )
}

export default ContentLogin