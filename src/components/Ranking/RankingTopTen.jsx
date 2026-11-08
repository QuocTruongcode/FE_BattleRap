import { useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import RankingCard from './RankingCard';
import RankingCardDetails from './RankingCardDetails';
import './RankingTopTen.css';

export default function RankingTopTen({ battlers = [], isLoading = false, error = null }) {
    const [selectedBattlerId, setSelectedBattlerId] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageDirection, setPageDirection] = useState('next');
    const pageSize = 9;

    if (isLoading) {
        return <p className="ranking-top-ten__status" role="status">Đang tải bảng xếp hạng...</p>;
    }

    if (error) {
        return <p className="ranking-top-ten__status ranking-top-ten__status--error" role="alert">{error.message}</p>;
    }

    if (battlers.length === 0) {
        return null;
    }

    const pageCount = Math.ceil(battlers.length / pageSize);
    const page = Math.min(currentPage, pageCount - 1);
    const visibleBattlers = battlers.slice(page * pageSize, (page + 1) * pageSize);
    const selectedBattler = battlers.find(
        (battler) => String(battler.id) === String(selectedBattlerId)
    );
    const navigateToPage = (nextPage) => {
        setPageDirection(nextPage > page ? 'next' : 'previous');
        setCurrentPage(nextPage);
        setSelectedBattlerId(null);
    };

    return (
        <section className="ranking-top-ten" aria-label="Bảng xếp hạng battler">
            {pageCount > 1 && (
                <div className="ranking-top-ten__navigation" aria-label="Điều hướng bảng xếp hạng">
                    <button
                        type="button"
                        className="ranking-top-ten__navigation-button"
                        onClick={() => navigateToPage(page - 1)}
                        disabled={page === 0}
                        aria-label="Xem 9 battler trước"
                    >
                        <LuChevronLeft aria-hidden="true" />
                    </button>
                    <span className="ranking-top-ten__page" aria-live="polite">
                        {page + 1} / {pageCount}
                    </span>
                    <button
                        type="button"
                        className="ranking-top-ten__navigation-button"
                        onClick={() => navigateToPage(page + 1)}
                        disabled={page === pageCount - 1}
                        aria-label="Xem 9 battler tiếp theo"
                    >
                        <LuChevronRight aria-hidden="true" />
                    </button>
                </div>
            )}
            <div
                key={page}
                className={`ranking-top-ten__cards ranking-top-ten__cards--${pageDirection}`}
                aria-label="Battler xếp hạng cao"
            >
                {visibleBattlers.map((battler) => (
                    <RankingCard
                        key={battler.id}
                        rank={battler.rank}
                        battlerName={battler.battlerName}
                        image={battler.image}
                        imageAlt={battler.imageAlt}
                        barsScored={battler.barsScored}
                        onSelect={() => setSelectedBattlerId((currentId) => (
                            String(currentId) === String(battler.id) ? null : battler.id
                        ))}
                        isSelected={String(selectedBattlerId) === String(battler.id)}
                        variant="compact"
                    />
                ))}
            </div>
            {selectedBattler && (
                <div className="ranking-top-ten__details">
                    <h2 className="ranking-top-ten__details-title">
                        {selectedBattler.battlerName} · TOP {selectedBattler.rank}
                    </h2>
                    <RankingCardDetails
                        battlerName={selectedBattler.battlerName}
                        barsScored={selectedBattler.barsScored}
                        videos={selectedBattler.videos}
                    />
                </div>
            )}
        </section>
    );
}
