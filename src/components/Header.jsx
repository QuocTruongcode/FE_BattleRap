import { useState } from 'react';

export default function Header({ onSearch }) {
    const [searchValue, setSearchValue] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            onSearch(searchValue);
        }
    };

    const handleInputChange = (e) => {
        setSearchValue(e.target.value);
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo */}
                <div className="logo">
                    <svg
                        viewBox="0 0 90 20"
                        className="logo-icon"
                    >
                        <text x="0" y="16" fontSize="20" fontWeight="bold" fill="#FF0000">
                            WebbattelRap
                        </text>
                    </svg>
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
                    <button className="icon-button" title="Upload">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 14c1.49-1.46 3-3.5 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2 1.51 4.04 3 5.5"></path>
                        </svg>
                    </button>
                    <button className="icon-button" title="Notifications">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>
                    <button className="user-avatar" title="Profile">
                        <img src="https://via.placeholder.com/32" alt="User" />
                    </button>
                </div>
            </div>
        </header>
    );
}
