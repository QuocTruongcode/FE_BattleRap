// components/MainLayout.jsx
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children, onSearch }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

    return (
        <div className="home-container">
            <Header
                onSearch={onSearch}
                onToggleSidebar={toggleSidebar}
                isSidebarCollapsed={isSidebarCollapsed}
            />
            <div className="home-content">
                <Sidebar isCollapsed={isSidebarCollapsed} />
                <main className="main-area">{children}</main>
            </div>
        </div>
    );
}