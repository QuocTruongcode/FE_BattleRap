import { useState } from 'react';
import './Header.css';
import Logo from '../../assets/Logo.jpg'; // Import the logo image
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onSearch, onToggleSidebar, isSidebarCollapsed }) {
    const [searchValue, setSearchValue] = useState('');
    const navigate = useNavigate();

    const { user } = useAuth();

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            onSearch(searchValue);
        }
    };

    const handleInputChange = (e) => {
        setSearchValue(e.target.value);
    };

    const handleSwitchPage = () => {
        navigate('/Login')
    }

    console.log('Header render, user:', user);

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left-group">
                    <button
                        type="button"
                        className="header-sidebar-toggle"
                        onClick={onToggleSidebar}
                        title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                        aria-label={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                    >
                        <span className="header-toggle-icon" aria-hidden="true">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>

                    <div className="logo">
                        <img src={Logo} alt="Logo" className="logo-icon" />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Tìm kiếm..."
                        value={searchValue}
                        onChange={handleInputChange}
                        onKeyPress={handleSearch}
                    />
                    <button
                        className="search-button"
                        onClick={handleSearch}
                        title="Tìm kiếm"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
                {/* Right Section */}
                <div className="header-right">

                    <h2 className='user-name'>{user?.UserName || 'User'}</h2>

                    <button className="icon-button" onClick={() => handleSwitchPage()}>
                        Đăng xuất
                    </button>

                </div>
            </div>
        </header>
    );
}
