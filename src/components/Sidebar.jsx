import { NavLink } from 'react-router-dom';

const ROUTED_ITEMS = [
    { icon: '🏠', label: 'Trang chủ', to: '/', end: true },
    { icon: '➕', label: 'Video', to: '/crud' },
];

const STATIC_ITEMS = [
    { icon: '🔥', label: 'Thịnh hành' },
    { icon: '📦', label: 'Đăng ký' },
    { icon: '📚', label: 'Thư viện' },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {ROUTED_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `sidebar-item${isActive ? ' active' : ''}`
                        }
                        title={item.label}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}

                {STATIC_ITEMS.map((item) => (
                    <button
                        key={item.label}
                        className="sidebar-item"
                        title={item.label}
                        type="button"
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <hr className="sidebar-divider" />

            <div className="sidebar-section">
                <p className="sidebar-title">KÊNH CÓ NGƯỜI ĐĂNG KÝ</p>
                <div className="channel-list">
                    {['WebbattelRap', 'Tech Channel', 'Music Beats', 'Gaming Zone'].map(
                        (channel, index) => (
                            <button key={index} className="channel-item">
                                <span className="channel-avatar">
                                    {channel.charAt(0)}
                                </span>
                                <span>{channel}</span>
                            </button>
                        )
                    )}
                </div>
            </div>
        </aside>
    );
}
