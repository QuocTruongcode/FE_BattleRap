import { useEffect, useRef } from 'react';

export default function PreviewVideo({
    storageId,
    startDelay = 0,
    onPlay,
    className,
}) {
    const cdnUrl = import.meta.env.VITE_CDN_URL?.replace(/\/+$/, '');
    const previewUrl = storageId && cdnUrl
        ? `${cdnUrl}/v/${storageId}/preview.mp4`
        : undefined;
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !previewUrl) return undefined;

        const timeoutId = window.setTimeout(() => {
            video.play().catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Không thể tự phát video xem trước:', error);
                }
            });
        }, startDelay);

        return () => {
            window.clearTimeout(timeoutId);
            video.pause();
        };
    }, [previewUrl, startDelay]);

    return (
        // console.log("Preview đang chạy: "),
        <video
            ref={videoRef}
            className={className}
            src={previewUrl}
            muted
            playsInline
            preload="metadata"
            onPlay={onPlay}
        />
    );
}