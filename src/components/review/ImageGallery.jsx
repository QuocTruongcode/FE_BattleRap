import { useEffect, useState } from 'react';
import './ImageGallery.css';

function getUrl(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }

    const markdownUrl = value.match(/^\[[^\]]+\]\(([^)]+)\)$/);
    return markdownUrl ? markdownUrl[1] : value;
}

function normalizeImages(images) {
    return images
        .map((image, index) => {
            if (typeof image === 'string') {
                return {
                    src: getUrl(image),
                    alt: `Ảnh ${index + 1}`,
                    title: '',
                    keyword: '',
                    link: '',
                };
            }

            return {
                src: getUrl(image?.thumbnailUrl),
                alt: image?.alt || image?.title || `Ảnh ${index + 1}`,
                title: image?.title || '',
                keyword: image?.keyword || '',
                link: getUrl(image?.link),
            };
        })
        .filter((image) => image.src);
}

export default function ImageGallery({ images = [], alt = 'Ảnh review' }) {
    const galleryImages = normalizeImages(images);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        setActiveIndex(0);
    }, [images]);

    useEffect(() => {
        if (!isFullscreen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsFullscreen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    if (!galleryImages.length) {
        return null;
    }

    const activeImage = galleryImages[activeIndex] || galleryImages[0];
    const imageAlt = activeImage.alt === 'Ảnh 1' ? alt : activeImage.alt;
    const imageLink = activeImage.link || activeImage.src;

    const selectImage = (index) => {
        setActiveIndex(index);
    };

    return (
        <section className="image-gallery" aria-label="Thư viện ảnh">
            <div className="image-gallery-main">
                <a
                    className="image-gallery-image-link"
                    href={imageLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Mở ${activeImage.title || imageAlt}`}
                >
                    <img src={activeImage.src} alt={imageAlt} />
                </a>
                <button
                    type="button"
                    className="image-gallery-fullscreen"
                    onClick={() => setIsFullscreen(true)}
                    aria-label="Xem ảnh toàn màn hình"
                    title="Xem toàn màn hình"
                >
                    <span aria-hidden="true">⛶</span>
                </button>
            </div>

            {(activeImage.title || activeImage.keyword) && (
                <div className="image-gallery-info">
                    {activeImage.title && <h3>{activeImage.title}</h3>}
                    {activeImage.keyword && <p>{activeImage.keyword}</p>}
                </div>
            )}

            {galleryImages.length > 1 && (
                <div className="image-gallery-thumbnails" role="list" aria-label="Các ảnh khác">
                    {galleryImages.map((image, index) => (
                        <button
                            type="button"
                            className={`image-gallery-thumbnail ${index === activeIndex ? 'is-active' : ''}`}
                            key={`${image.src}-${index}`}
                            onClick={() => selectImage(index)}
                            aria-label={`Chọn ảnh ${index + 1}`}
                            aria-current={index === activeIndex ? 'true' : undefined}
                        >
                            <img src={image.src} alt="" aria-hidden="true" />
                        </button>
                    ))}
                </div>
            )}

            {isFullscreen && (
                <div
                    className="image-gallery-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ảnh toàn màn hình"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        type="button"
                        className="image-gallery-lightbox-close"
                        onClick={() => setIsFullscreen(false)}
                        aria-label="Đóng ảnh toàn màn hình"
                    >
                        ×
                    </button>
                    <a
                        className="image-gallery-lightbox-link"
                        href={imageLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <img src={activeImage.src} alt={imageAlt} />
                    </a>
                </div>
            )}
        </section>
    );
}