import { useEffect, useRef, forwardRef, useImperativeHandle, memo, useState } from 'react';
import VideoStage from './VideoStage';

const BunnyPlayer = forwardRef(function BunnyPlayer({ videoUrl, onTimeUpdate, children }, ref) {
    const [isPlaying, setIsPlaying] = useState(false); // local, không cần đẩy ra ngoài
    const iframeRef = useRef(null);
    const playerRef = useRef(null);
    const stageRef = useRef(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    useEffect(() => {
        onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    useImperativeHandle(ref, () => ({
        seekTo: (time) => {
            if (playerRef.current) {
                playerRef.current.setCurrentTime(time);
            }
        },
        // requestFullscreen: () => stageRef.current?.requestFullscreen(),
        togglePlay: () => {
            if (!playerRef.current) return;
            if (isPlaying) {
                playerRef.current.pause();
            } else {
                playerRef.current.play();
            }
        },
    }));

    useEffect(() => {
        if (!iframeRef.current) return;

        const initPlayer = () => {
            playerRef.current = new window.playerjs.Player(iframeRef.current);

            playerRef.current.on('ready', () => {
                playerRef.current.on('ready', () => {
                    playerRef.current.on('timeupdate', (data) => onTimeUpdateRef.current?.(data.seconds));
                    playerRef.current.on('play', () => setIsPlaying(true));
                    playerRef.current.on('pause', () => setIsPlaying(false));
                    playerRef.current.on('ended', () => setIsPlaying(false));
                });
            });
        };

        if (window.playerjs) {
            initPlayer();
        } else {
            const existing = document.querySelector('script[src*="playerjs-latest.min.js"]');
            if (existing) {
                existing.addEventListener('load', initPlayer);
            } else {
                const script = document.createElement('script');
                script.src = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js';
                script.onload = initPlayer;
                document.body.appendChild(script);
            }
        }

        return () => {
            playerRef.current = null;
        };
    }, [videoUrl]);

    return (
        <VideoStage
            ref={stageRef}
            isPlaying={isPlaying}
            playerNode={
                <iframe
                    ref={iframeRef}
                    src={videoUrl}
                    loading="lazy"
                    style={{ border: 0, width: '100%', height: '100%' }}
                    allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                />
            }
        >
            {children}
        </VideoStage>
    );
});

export default memo(BunnyPlayer);