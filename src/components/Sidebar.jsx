import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import {
    FaHome,
    FaFire,
    FaVideo,
    FaBook,
    FaYoutube
} from "react-icons/fa";
const ROUTED_ITEMS = [
    { icon: <FaHome />, label: 'Trang chủ', to: '/', end: true },
    { icon: <FaVideo />, label: 'Video', to: '/crud' },
];

const STATIC_ITEMS = [
    { icon: <FaFire />, label: 'Thịnh hành' },
    { icon: <FaYoutube />, label: 'Đăng ký' },
    { icon: <FaBook />, label: 'Thư viện' },
];

export default function Sidebar({ isCollapsed, onToggle }) {
    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>

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
                        {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
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
                        {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
                    </button>
                ))}
            </nav>

        </aside>
    );
}
