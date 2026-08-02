import React, { useEffect, useRef, useState, useCallback } from 'react';
import './VideoSearch.css';
import VideoCard from './VideoCard';
import { searchService } from '../services/api';

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 1; // đổi thành 2 nếu bạn muốn gõ tối thiểu 2 ký tự mới search

export default function VideoSearch({ handleSelectVideo }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lưu query hiện tại để đối chiếu khi response trả về (chống race condition)
    const queryRef = useRef('');
    // Lưu controller để hủy request cũ khi có request mới
    const abortControllerRef = useRef(null);
    const debounceRef = useRef(null);

    const runSearch = useCallback((q) => {
        // Hủy request trước đó nếu vẫn đang chạy
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const trimmed = q.trim();

        if (trimmed.length < MIN_LENGTH) {
            setResults([]);
            setLoading(false);
            setError(null);
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);

        const res = searchService
            .search(trimmed, { signal: controller.signal })
            .then((data) => {  // 👈 data ở đây ĐÃ LÀ response.data, không cần res.data
                if (queryRef.current !== q) return;
                console.log("Check data từ BE: ", data.data); // 👈 đặt ở đây mới đúng, vì data lúc này đã là giá trị thật

                setResults(Array.isArray(data.data) ? data.data : []);

                setLoading(false);
            })
            .catch((err) => {
                // apiRequest của bạn tự throw new Error(...), nên lỗi abort cũng bị bọc lại thành Error thường
                // cần kiểm tra dựa theo message hoặc name tùy getErrorMessage xử lý ra sao
                if (err.name === 'AbortError' || err.name === 'CanceledError') return;
                if (queryRef.current !== q) return;
                setError(err.message || String(err));
                setLoading(false);
            });
        console.log("Check res: ", res)
    }, []);

    useEffect(() => {
        queryRef.current = query;

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            runSearch(query);
        }, DEBOUNCE_MS);

        return () => clearTimeout(debounceRef.current);
    }, [query, runSearch]);

    // Hủy request đang bay nếu component bị unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const showEmpty =
        !loading && !error && query.trim().length >= MIN_LENGTH && results.length === 0;

    return (
        console.log("Check result: ", results),
        <div className="video-search">
            <div className="search-input-wrap">
                <input
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm trận đấu..."
                    aria-label="Tìm video"
                />
            </div>

            {loading && <div className="vs-message">Đang tìm...</div>}
            {error && <div className="vs-error">Lỗi: {error}</div>}
            {showEmpty && <div className="vs-message">Không có kết quả</div>}

            <div className="video-list">
                {results.map((video) => (
                    <div
                        className="video-list-item"
                        key={video.id || video._id || video.videoId || video.title}
                    >
                        <VideoCard video={video} onClick={() => { handleSelectVideo(video); setQuery(''); }} />
                    </div>
                ))}
            </div>
        </div>
    );
}