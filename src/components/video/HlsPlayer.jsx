import { useEffect, useRef, forwardRef, useImperativeHandle, memo, useState } from 'react';
import Hls from 'hls.js';
import VideoStage from './VideoStage';

const HlsPlayer = forwardRef(function HlsPlayer(
    { storageId, onTimeUpdate, children, fullscreenChildren },
    ref
) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);
    const stageRef = useRef(null);
    const intervalRef = useRef(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    useEffect(() => {
        onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    useImperativeHandle(ref, () => ({
        seekTo: (time) => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = time;
            onTimeUpdateRef.current?.(time); // cập nhật lyric ngay cả khi đang pause
        },
        togglePlay: () => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) video.play().catch(() => { });
            else video.pause();
        },
    }));

    // 1) Nạp HLS
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !storageId) return;

        const src = `${import.meta.env.VITE_CDN_URL}/v/${storageId}/master.m3u8`;
        let hls;

        if (Hls.isSupported()) {
            hls = new Hls({
                xhrSetup: (xhr, url) => {
                    // chỉ gắn token cho request lấy khóa, KHÔNG gắn cho R2
                    if (url.includes('/api/keys/')) {
                        const token = localStorage.getItem('token');
                        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    }
                },
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) console.error('HLS fatal error:', data);
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native: không gắn được header Authorization
            video.src = src;
        }

        return () => {
            hls?.destroy();
        };
    }, [storageId]);

    // 2) Sự kiện play/pause + bắn time mỗi 100ms (giống VideoPlayer YouTube)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const startTick = () => {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                onTimeUpdateRef.current?.(video.currentTime);
            }, 100);
        };
        const stopTick = () => clearInterval(intervalRef.current);

        const onPlay = () => { startTick(); setIsPlaying(true); };
        const onPause = () => { stopTick(); setIsPlaying(false); };
        const onSeeked = () => onTimeUpdateRef.current?.(video.currentTime); // kéo thanh tua khi đang pause

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('ended', onPause);
        video.addEventListener('seeked', onSeeked);

        return () => {
            stopTick();
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', onPause);
            video.removeEventListener('seeked', onSeeked);
        };
    }, []);

    return (
        <VideoStage
            ref={stageRef}
            playerNode={
                <video
                    ref={videoRef}
                    controls
                    controlsList="nofullscreen" // fullscreen do VideoStage xử lý (tương đương fs: 0 của YouTube)
                    playsInline
                    style={{ width: '100%', height: '100%' }}
                />
            }
            isPlaying={isPlaying}
            fullscreenChildren={fullscreenChildren}
        >
            {children}
        </VideoStage>
    );
});

export default memo(HlsPlayer);