import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaFire, FaPlay } from 'react-icons/fa';
import { Drama } from '../../services/api';
import { ImageGallery } from '../review';
import './BannerEvent.css';

async function getDramaEvents() {
    const response = await Drama.getAllVideoOfDrama();
    const payload = Array.isArray(response) ? response : response?.data;
    const events = Array.isArray(payload) ? payload : payload?.data;

    if (!Array.isArray(events)) {
        throw new Error('Dữ liệu sự kiện trả về không hợp lệ.');
    }

    return events.filter((event) =>
        Array.isArray(event?.videos) && getEventImages(event.videos).length > 0
    );
}

function getEventImages(videos = []) {
    return videos
        .filter((video) => typeof video?.thumbnailUrl === 'string' && video.thumbnailUrl.trim())
        .map((video, index) => ({
            thumbnailUrl: video.thumbnailUrl,
            title: video.title || `Video ${index + 1}`,
            link: video.linkVideo || video.linkBunny || '',
        }));
}

function EventBanner({ event, index }) {
    const images = getEventImages(event.videos);
    const title = event.title || `Sự kiện rap ${event.id ?? index + 1}`;

    return (
        <article className="banner-event-card" aria-labelledby={`banner-event-title-${event.id ?? index}`}>
            <div className="banner-event-copy">
                <p className="banner-event-eyebrow">
                    <FaFire aria-hidden="true" />
                    <span>Tâm điểm sự kiện</span>
                </p>
                <h2 id={`banner-event-title-${event.id ?? index}`}>{title}</h2>
                <p className="banner-event-description">
                    Cùng nhìn lại những màn trình diễn và khoảnh khắc đáng chú ý trong sự kiện.
                </p>
                <div className="banner-event-stat">
                    <span className="banner-event-stat-icon">
                        <FaPlay aria-hidden="true" />
                    </span>
                    <span>
                        <strong>{images.length}</strong>
                        <span className="banner-event-stat-label">video nổi bật</span>
                    </span>
                </div>
            </div>

            <div className="banner-event-gallery">
                {images.length > 0 ? (
                    <ImageGallery images={images} alt={`Video trong sự kiện ${title}`} />
                ) : (
                    <p className="banner-event-no-images">Sự kiện chưa có thumbnail video.</p>
                )}
            </div>
        </article>
    );
}

export default function BannerEvent() {
    const carouselRef = useRef(null);
    const activeIndexRef = useRef(0);
    const { data: events = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ['dramas-with-videos'],
        queryFn: getDramaEvents,
    });

    useEffect(() => {
        activeIndexRef.current = 0;
        carouselRef.current?.scrollTo({ left: 0, behavior: 'auto' });

        if (events.length < 2) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            const nextIndex = (activeIndexRef.current + 1) % events.length;
            const nextSlide = carouselRef.current?.children[nextIndex];

            if (nextSlide) {
                const carousel = carouselRef.current;
                const slideOffset = nextSlide.getBoundingClientRect().left
                    - carousel.getBoundingClientRect().left;

                carousel.scrollTo({
                    left: carousel.scrollLeft + slideOffset,
                    behavior: 'smooth',
                });
                activeIndexRef.current = nextIndex;
            }
        }, 3000);

        return () => window.clearInterval(intervalId);
    }, [events.length]);

    if (isLoading) {
        return (
            <section className="banner-event-status" aria-live="polite">
                Đang tải sự kiện...
            </section>
        );
    }

    if (isError) {
        return (
            <section className="banner-event-status banner-event-error" role="alert">
                <p>Không tải được danh sách sự kiện: {error.message}</p>
                <button type="button" onClick={() => refetch()}>Thử lại</button>
            </section>
        );
    }

    if (events.length === 0) {
        return (
            <section className="banner-event-empty" aria-label="Sự kiện rap nổi bật">
                <div>
                    <p className="banner-event-eyebrow">
                        <FaFire aria-hidden="true" />
                        <span>Tâm điểm sự kiện</span>
                    </p>
                    <h2>Những sự kiện rap nổi bật</h2>
                    <p>Chưa có sự kiện nào có video và thumbnail để hiển thị.</p>
                </div>
            </section>
        );
    }

    return (
        <section
            className="banner-event-list"
            aria-label="Sự kiện rap nổi bật"
            aria-roledescription="carousel"
            ref={carouselRef}
        >
            {events.map((event, index) => (
                <EventBanner
                    event={event}
                    index={index}
                    key={event.id ?? `${event.title ?? 'event'}-${index}`}
                />
            ))}
        </section>
    );
}
