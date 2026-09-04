// components/VideoStage.jsx
import { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import './VideoStage.css';

const VideoStage = forwardRef(function VideoStage({ children, playerNode, isPlaying }, ref) {
    const wrapperRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useImperativeHandle(ref, () => ({
        requestFullscreen: () => wrapperRef.current?.requestFullscreen(),
        exitFullscreen: () => document.exitFullscreen(),
    }));

    useEffect(() => {
        const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            wrapperRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // true khi children cần được nhìn thấy (không fullscreen, hoặc đang pause)
    const isChildrenVisible = !isFullscreen || !isPlaying;

    return (
        <div
            ref={wrapperRef}
            className={`video-area ${isFullscreen ? 'video-area--fs' : 'video-area--16-9'}`}
        >
            {playerNode}

            <div
                className="video-stage__overlay"
                style={{
                    visibility: isChildrenVisible ? 'visible' : 'hidden',
                    opacity: isChildrenVisible ? 1 : 0,
                }}
            >
                {children}
            </div>

            <button
                className="video-stage__fs-btn"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            >
                {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
            </button>
        </div>
    );
});

export default VideoStage;