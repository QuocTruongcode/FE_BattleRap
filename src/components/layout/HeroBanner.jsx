import { useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import PreviewVideo from '../video/PreviewVideo';
import './HeroBanner.css';
const ROTATION_INTERVAL = 15000;

export default function HeroBanner({ videos = [], onVideoSelect }) {
    const featuredVideos = videos.slice(0, 10);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const playlistRef = useRef(null);
    const activeIndex = featuredVideos.length ? selectedIndex % featuredVideos.length : 0;

    const activeVideo = featuredVideos[activeIndex] ?? featuredVideos[0];
    if (!activeVideo) return null;

    const previewKey = `${activeIndex}:${activeVideo?.storageId ?? ''}`;
    const [playingPreviewKey, setPlayingPreviewKey] = useState(null);
    const isPreviewPlaying = playingPreviewKey === previewKey;

    const heroRef = useRef(null);

    const [isHeroVisible, setIsHeroVisible] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(
        document.visibilityState === 'visible'
    );

    const shouldPlayPreview = isHeroVisible && isPageVisible;

    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsHeroVisible(
                    entry.isIntersecting && entry.intersectionRatio >= 0.5
                );
            },
            {
                threshold: [0, 0.5, 1],
            }
        );

        observer.observe(hero);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (!shouldPlayPreview) {
            setPlayingPreviewKey(null);
        }
    }, [shouldPlayPreview]);

    useEffect(() => {
        const playlist = playlistRef.current;
        const activeItem = playlist?.children[activeIndex + 1];
        if (!playlist || !activeItem) return;

        const playlistCenter = playlist.getBoundingClientRect().left + playlist.clientWidth / 2;
        const itemCenter = activeItem.getBoundingClientRect().left + activeItem.clientWidth / 2;

        playlist.scrollTo({
            left: playlist.scrollLeft + itemCenter - playlistCenter,
            behavior: 'smooth',
        });
    }, [activeIndex]);

    useEffect(() => {
        if (!shouldPlayPreview || featuredVideos.length < 2) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setSelectedIndex(
                (currentIndex) =>
                    (currentIndex + 1) % featuredVideos.length
            );
        }, ROTATION_INTERVAL);

        return () => window.clearInterval(intervalId);
    }, [featuredVideos.length, shouldPlayPreview]);

    if (featuredVideos.length === 0) return null;

    const selectVideo = (video) => {
        if (video?.id != null) onVideoSelect?.(video.id);
    };

    return (
        // console.log("check playingPreviewKey: ", playingPreviewKey),

        // console.log("check isPreviewPlaying: ", isPreviewPlaying),

        <section
            ref={heroRef}

            className="hero-banner"
            style={{ '--hero-banner-image': `url("${activeVideo.thumbnailUrl || ''}")` }}
            aria-label="Video nổi bật"
            aria-roledescription="carousel"
        >
            {activeVideo.thumbnailUrl && !isPreviewPlaying && (
                <img
                    className="hero-banner__featured-image"
                    src={activeVideo.thumbnailUrl}
                    alt=""
                    aria-hidden="true"
                />

            )}
            {shouldPlayPreview && activeVideo.storageId && (
                <PreviewVideo
                    key={previewKey}
                    className={`hero-banner__preview-video${isPreviewPlaying ? ' is-playing' : ''
                        }`}
                    storageId={activeVideo.storageId}
                    startDelay={2000}
                    onPlay={() => setPlayingPreviewKey(previewKey)}
                />
            )}
            <div className="hero-banner__bottom-row">
                <div className="hero-banner__content" aria-live="polite">
                    <p className="hero-banner__eyebrow">Trận đấu nổi bật</p>
                    <h1 className="hero-banner__title">{activeVideo.title || 'Video chưa có tiêu đề'}</h1>
                    <button
                        className="hero-banner__watch-button"
                        type="button"
                        onClick={() => selectVideo(activeVideo)}
                        disabled={activeVideo.id == null}
                    >
                        <FaPlay aria-hidden="true" />
                        <span>Xem ngay</span>
                    </button>
                </div>

                <div
                    className="hero-banner__playlist"
                    aria-label="Danh sách video nổi bật"
                    ref={playlistRef}
                >
                    <span className="hero-banner__playlist-spacer" aria-hidden="true" />
                    {featuredVideos.map((video, index) => (
                        <button
                            className={`hero-banner__playlist-item${index === activeIndex ? ' is-active' : ''}`}
                            data-index={index}
                            key={video.id ?? `${video.title ?? 'video'}-${index}`}
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            aria-current={index === activeIndex ? 'true' : undefined}
                            aria-label={`Phát ${video.title || `video ${index + 1}`}`}
                        >
                            {video.thumbnailUrl ? (
                                <img src={video.thumbnailUrl} alt="" loading="lazy" />
                            ) : (
                                <span className="hero-banner__thumbnail-placeholder">
                                    <FaPlay aria-hidden="true" />
                                </span>
                            )}
                        </button>
                    ))}
                    <span className="hero-banner__playlist-spacer" aria-hidden="true" />
                </div>
            </div>
        </section>
    );
}
