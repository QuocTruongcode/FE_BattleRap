import { useRef, useState } from 'react';
import { LuShare2 } from 'react-icons/lu';
import { REACTION_POINT, REACTIONS_ICONS } from '../../constants/const.js';
import './CardRating.css';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { toBlob } from 'html-to-image';
const REACTION_TIMES_PER_PAGE = 24;

const LAYOUTS = [
    { id: 'tiktok', label: 'TikTok', aspectRatio: '9 / 16' },
    { id: 'facebook', label: 'Facebook', aspectRatio: '4 / 5' },
    { id: 'landscape', label: 'Ngang', aspectRatio: '16 / 9' },
];

const SCORE_SCALE = [
    { score: 10, label: 'Masterpiece' },
    { score: 9, label: 'Amazing' },
    { score: 8, label: 'Great' },
    { score: 7, label: 'Decent' },
    { score: 6, label: 'Fine' },
    { score: 5, label: 'Okay' },
    { score: 4, label: 'Poor' },
    { score: 3, label: 'Bad' },
    { score: 2, label: 'Horrible' },
    { score: 1, label: '—' },
    { score: 0, label: '—' },
];

const formatTime = (time) => {
    const seconds = Number(time);
    if (!Number.isFinite(seconds) || seconds < 0) return null;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
};

function ReactionTimePagination({ reactionTimes, battlerName }) {
    const [page, setPage] = useState(0);

    const pageCount = Math.ceil(reactionTimes.length / REACTION_TIMES_PER_PAGE);
    const activePage = Math.min(page, Math.max(pageCount - 1, 0));
    const visibleTimes = reactionTimes.slice(
        activePage * REACTION_TIMES_PER_PAGE,
        (activePage + 1) * REACTION_TIMES_PER_PAGE,
    );

    return (
        <div className="card-rating__reaction-times" aria-label={`Mốc reaction của ${battlerName}`}>
            <div className="card-rating__reaction-time-list">
                {visibleTimes.map(({ id, time, color, label }) => (
                    <span
                        className="card-rating__reaction-time"
                        key={id}
                        style={{ '--reaction-color': color }}
                        title={label}
                    >
                        {time}
                    </span>
                ))}
            </div>
            <div
                className={`card-rating__reaction-pagination${pageCount <= 1 ? ' is-hidden' : ''}`}
                aria-hidden={pageCount <= 1}
            >
                <button
                    type="button"
                    aria-label="Các mốc trước"
                    disabled={pageCount <= 1 || activePage === 0}
                    onClick={() => setPage(activePage - 1)}
                >
                    ‹
                </button>
                <span aria-live="polite">{activePage + 1}/{pageCount}</span>
                <button
                    type="button"
                    aria-label="Các mốc tiếp theo"
                    disabled={pageCount <= 1 || activePage >= pageCount - 1}
                    onClick={() => setPage(activePage + 1)}
                >
                    ›
                </button>
            </div>
        </div>
    );
}

export default function CardRating({ video, reactionBarByVideo = [] }) {
    const { user } = useAuth();
    const [layout, setLayout] = useState('tiktok');
    const [sharing, setSharing] = useState(false);
    const frameRef = useRef(null);

    const videoTitle = video?.title || 'Trận battle rap';

    const battlers = Array.isArray(video?.Battlers) ? video.Battlers : [];
    const battlerScores = battlers.map((entry, index) => {
        const nestedBattler = entry?.battler ?? entry?.Battler;
        const battler = nestedBattler ?? entry;
        const battlerId = nestedBattler?.id
            ?? nestedBattler?.battlerId
            ?? nestedBattler?.BattlerId
            ?? nestedBattler?.BattlerID
            ?? entry?.battlerId
            ?? entry?.BattlerId
            ?? entry?.BattlerID
            ?? entry?.id;
        const rapName = battler?.RapName
            ?? battler?.rapName
            ?? entry?.RapName
            ?? entry?.rapName
            ?? `Battler ${index + 1}`;
        const image = battler?.image
            ?? battler?.Image
            ?? entry?.image
            ?? entry?.Image;
        const battlerReactions = reactionBarByVideo
            .filter((reaction) => String(reaction.battlerId) === String(battlerId));
        const points = battlerReactions
            .map((reaction) => REACTION_POINT[reaction.ReactionType])
            .filter(Number.isFinite);
        const totalScore = points.reduce((total, point) => total + point, 0);
        const reactionTimes = battlerReactions
            .map((reaction, reactionIndex) => {
                const time = formatTime(reaction.time);
                if (time == null) return null;

                const reactionIcon = REACTIONS_ICONS.find(
                    ({ id }) => id === reaction.ReactionType
                );

                return {
                    id: reaction.id ?? reaction.barID ?? `${reaction.time}-${reactionIndex}`,
                    time,
                    seconds: Number(reaction.time),
                    color: reactionIcon?.color ?? '#bdbdbd',
                    label: reactionIcon?.label ?? 'Reaction',
                };
            })
            .filter(Boolean)
            .sort((first, second) => first.seconds - second.seconds);

        return {
            id: battlerId ?? `${rapName}-${index}`,
            image,
            rapName,
            score: totalScore,
            reactionTimes,
        };
    });
    // share button click handler to generate an image of the rating card and share it
    const handleShare = async () => {
        if (!frameRef.current || sharing) return;
        setSharing(true);

        try {
            await document.fonts.ready;

            const blob = await toBlob(frameRef.current, {
                pixelRatio: 2,
                // cacheBust: true,
                includeQueryParams: true,

                style: {
                    margin: '0',          // bỏ lề trong bản clone
                    transform: 'none',
                },

                // Ẩn các phần tử không muốn xuất hiện trong ảnh (ví dụ nút phân trang)
                filter: (node) => !node.classList?.contains('card-rating__reaction-pagination'),
            });
            if (!blob) throw new Error('Không tạo được ảnh');

            const fileName = `rating-${layout}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: videoTitle });
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('Không thể tạo ảnh, vui lòng thử lại.');
            }
        } finally {
            setSharing(false);
        }
    };

    return (
        <section className="card-rating" aria-label="Thẻ chấm điểm battle rap">
            <div className="card-rating__toolbar">
                <span className="card-rating__toolbar-label">Tỉ lệ khung hình</span>
                <div className="card-rating__layout-options" role="group" aria-label="Chọn tỉ lệ khung hình">
                    {LAYOUTS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            className={`card-rating__layout-button${layout === id ? ' is-active' : ''}`}
                            aria-pressed={layout === id}
                            onClick={() => setLayout(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={frameRef}
                className={`card-rating__frame card-rating__frame--${layout}`}
                style={{
                    '--card-rating-aspect-ratio': LAYOUTS.find(({ id }) => id === layout).aspectRatio,
                    ...(video?.thumbnailUrl ? { '--thumb': `url("${video.thumbnailUrl}")` } : {}),
                }}
            >
                {video?.thumbnailUrl && (
                    <img
                        className="card-rating__backdrop"
                        src={video.thumbnailUrl}
                        crossOrigin="anonymous"
                        alt=""
                        aria-hidden="true"
                    />
                )}
                <div className="card-rating__content">
                    <header className="card-rating__video">
                        {video?.thumbnailUrl ? (
                            <img className="card-rating__thumbnail" src={video.thumbnailUrl} crossOrigin="anonymous"
                                alt="" />
                        ) : (
                            <div className="card-rating__thumbnail card-rating__thumbnail--empty" aria-hidden="true">
                                Chưa có ảnh
                            </div>
                        )}
                        <div className="card-rating__video-info">
                            <span className="card-rating__eyebrow">Rated by {user?.UserName || 'User'}</span>
                            <h2 className="card-rating__title" title={videoTitle}>{videoTitle}</h2>
                        </div>
                    </header>

                    <div className="card-rating__score-scale" role="img" aria-label="Thang màu điểm từ 0 đến 10">
                        {SCORE_SCALE.map(({ score, label }) => (
                            <span className="card-rating__score-scale-value" key={score}>
                                <strong>{score}</strong>
                                <small>{label}</small>
                            </span>
                        ))}
                    </div>

                    <div className="card-rating__score-section" aria-label="Điểm của các battler">
                        {battlerScores.map(({ id, image, rapName, score: battlerScore, reactionTimes }) => (
                            <div className="card-rating__battler" key={id}>
                                <div className="card-rating__battler-portrait">
                                    {image ? (
                                        <img className="card-rating__battler-image" src={image} crossOrigin="anonymous" alt={rapName} />
                                    ) : (
                                        <div className="card-rating__battler-image card-rating__battler-image--empty" aria-hidden="true">
                                            {rapName.slice(0, 1)}
                                        </div>
                                    )}
                                    <strong className="card-rating__battler-score">{battlerScore}</strong>
                                </div>
                                <span className="card-rating__battler-name">{rapName}</span>
                                {reactionTimes.length > 0 && (
                                    <ReactionTimePagination
                                        reactionTimes={reactionTimes}
                                        battlerName={rapName}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <button
                type="button"
                className="card-rating__share-button"
                onClick={handleShare}
                disabled={sharing}
            >
                <LuShare2 aria-hidden="true" />
                {sharing ? 'Đang tạo ảnh...' : 'Chia sẻ ảnh'}
            </button>

            <div className='note'>*Reload lại trang để nhận được kết quả mới nhất</div>
        </section>
    );
}