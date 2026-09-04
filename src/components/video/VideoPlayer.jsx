import { useEffect, useRef, forwardRef, useImperativeHandle, memo, useState } from 'react';
import VideoStage from './VideoStage';
const VideoPlayer = forwardRef(function VideoPlayer({ videoUrl, onTimeUpdate, children }, ref) {
    const [isPlaying, setIsPlaying] = useState(false); // local, không cần đẩy ra ngoài
    const playerRef = useRef(null);
    const intervalRef = useRef(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const stageRef = useRef(null);
    useEffect(() => {
        onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    useImperativeHandle(ref, () => ({
        seekTo: (time) => {
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(time, true);
            }
        },
        // requestFullscreen: () => stageRef.current?.requestFullscreen(),
        togglePlay: () => {
            if (!playerRef.current) return;
            if (isPlaying) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        },
    }));

    function getYoutubeId(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname.includes('youtube.com'))
                return parsed.searchParams.get('v');
            if (parsed.hostname.includes('youtu.be'))
                return parsed.pathname.slice(1);
            return null;
        } catch {
            return null;
        }
    }

    useEffect(() => {
        const videoId = getYoutubeId(videoUrl);
        if (!videoId) return;

        const container = document.getElementById('yt-player');
        if (!container) return;

        const initPlayer = () => {
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
            }

            playerRef.current = new window.YT.Player('yt-player', {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    fs: 0,
                },
                events: {
                    onReady: (e) => {
                        console.log('YouTube Player ready ✅', e.target);
                    },
                    onStateChange: (e) => {
                        switch (e.data) {
                            case window.YT.PlayerState.PLAYING:
                                clearInterval(intervalRef.current);
                                intervalRef.current = setInterval(() => {
                                    if (playerRef.current?.getCurrentTime) {
                                        onTimeUpdateRef.current?.(playerRef.current.getCurrentTime());
                                    }
                                }, 100);
                                setIsPlaying(true);
                                break;

                            case window.YT.PlayerState.PAUSED:
                            case window.YT.PlayerState.ENDED:
                                clearInterval(intervalRef.current);
                                setIsPlaying(false);
                                break;

                            default:
                                clearInterval(intervalRef.current);
                                break;
                        }
                    },
                },
            });
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                document.body.appendChild(script);
            }
            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                prevCallback?.();
                initPlayer();
            };
        }

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [videoUrl]);

    return (
        <VideoStage
            ref={stageRef}
            playerNode={<div id="yt-player" style={{ width: '100%', height: '100%' }}
            />}
            isPlaying={isPlaying}

        >
            {children}
        </VideoStage>
    );
});

export default memo(VideoPlayer);