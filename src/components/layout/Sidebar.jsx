import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../../contexts/AuthContext';
import {
    FaHome,
    FaFire,
    FaVideo,
    FaBook,
    FaYoutube, FaProjectDiagram,
    FaRobot,
} from "react-icons/fa";
import { FaMicrophoneLines } from "react-icons/fa6";
const ROUTED_ITEMS = [
    { icon: <FaHome />, label: 'Trang chủ', to: '/', end: true },
    { icon: <FaVideo />, label: 'Video', to: '/crud' },
    { icon: <FaProjectDiagram />, label: 'Tri thức Rap', to: '/knowledgeGraph' },
    { icon: <FaRobot />, label: 'Trợ lý ảo', to: '/chatbot' },
    { icon: <FaMicrophoneLines />, label: 'Battler', to: '/CRUDbattler' },

];

const STATIC_ITEMS = [
    { icon: <FaFire />, label: 'Thịnh hành' },
    { icon: <FaYoutube />, label: 'Đăng ký' },
    { icon: <FaBook />, label: 'Thư viện' },
];

export default function Sidebar({ isCollapsed, onToggle }) {
    const { user } = useAuth();
    const visibleRoutedItems = ROUTED_ITEMS.filter(
        (item) => user?.UserType !== 'U2' || !['/crud', '/knowledgeGraph'].includes(item.to)
    );
    // console.log('Sidebar isCollapsed, user:', isCollapsed);
    // console.log('Sidebar render, user:', user?.UserType);
    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>

            <nav className="sidebar-nav">
                {visibleRoutedItems.map((item) => (
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
