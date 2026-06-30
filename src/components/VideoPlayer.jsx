import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const VideoPlayer = forwardRef(function VideoPlayer({ videoUrl, onTimeUpdate }, ref) {
    const playerRef = useRef(null);
    const intervalRef = useRef(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    useEffect(() => {
        onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    useImperativeHandle(ref, () => ({
        seekTo: (time) => {
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                playerRef.current.seekTo(time, true);
            }
        }
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
                },
                events: {
                    onReady: (e) => {
                        console.log('YouTube Player ready ✅', e.target);
                    },
                    onStateChange: (e) => {
                        if (e.data === window.YT.PlayerState.PLAYING) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = setInterval(() => {
                                if (
                                    playerRef.current &&
                                    typeof playerRef.current.getCurrentTime === 'function'
                                ) {
                                    const time = playerRef.current.getCurrentTime();
                                    onTimeUpdateRef.current?.(time);
                                }
                            }, 100);
                        } else {
                            clearInterval(intervalRef.current);
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
        <div className="video-area" style={{ width: '100%', aspectRatio: '16/9' }}>
            <div id="yt-player" style={{ width: '100%', height: '100%' }} />
        </div>
    );
});

export default VideoPlayer;