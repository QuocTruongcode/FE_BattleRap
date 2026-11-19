import { useEffect, useRef, useState } from 'react';
import { Header, HeroBanner, Sidebar } from '../components/layout';
import { VideoGrid } from '../components/video';
import { RAGChatBot } from '../components/RAGChatBot';
import { videoService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaRobot } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import RankingTopTen from '../components/Ranking/RankingTopTen.jsx';
import useRankingData from '../components/Ranking/useRankingData.js';
import './Home.css';

const EMPTY_SUGGESTIONS = [];

const getSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') return suggestion;

    if (suggestion && typeof suggestion === 'object') {
        const text = suggestion.title ?? suggestion.suggestion ?? suggestion.text ?? suggestion.content ?? suggestion.message;
        return typeof text === 'string' ? text : JSON.stringify(suggestion);
    }

    return String(suggestion ?? '');
};

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const chatbotWidgetRef = useRef(null);
    const [recommendationState, setRecommendationState] = useState({
        userId: null,
        suggestions: [],
        index: 0,
    });
    const navigate = useNavigate();
    const { user } = useAuth();
    const suggestions = recommendationState.userId === user?.userId
        ? recommendationState.suggestions
        : EMPTY_SUGGESTIONS;
    const suggestionIndex = suggestions.length
        ? recommendationState.index % suggestions.length
        : 0;
    const recommendationText = suggestions.length
        ? getSuggestionText(suggestions[suggestionIndex])
        : '';
    const [displayedRecommendation, setDisplayedRecommendation] = useState(recommendationText);
    const [recommendationAnimation, setRecommendationAnimation] = useState('opening');

    useEffect(() => {
        if (recommendationText === displayedRecommendation) return undefined;

        const shouldAnimate = Boolean(displayedRecommendation && recommendationText);
        let closeTimerId;
        let openTimerId;

        closeTimerId = window.setTimeout(() => {
            if (shouldAnimate) setRecommendationAnimation('closing');
            openTimerId = window.setTimeout(() => {
                setDisplayedRecommendation(recommendationText);
                setRecommendationAnimation('opening');
            }, shouldAnimate ? 320 : 0);
        }, 0);

        return () => {
            window.clearTimeout(closeTimerId);
            window.clearTimeout(openTimerId);
        };
    }, [displayedRecommendation, recommendationText]);

    useEffect(() => {
        if (!user?.userId) return undefined;

        const key = `ai_recommendations_${user.userId}`;
        const loadSuggestions = () => {
            const raw = localStorage.getItem(key);
            if (!raw) {
                setRecommendationState({ userId: user.userId, suggestions: [], index: 0 });
                return;
            }

            try {
                const parsed = JSON.parse(raw);
                const savedSuggestions = Array.isArray(parsed)
                    ? parsed
                    : parsed?.data?.suggestions ?? parsed?.suggestions;

                if (!Array.isArray(savedSuggestions)) {
                    throw new TypeError('Dữ liệu gợi ý AI trong localStorage không phải mảng');
                }

                setRecommendationState({ userId: user.userId, suggestions: savedSuggestions, index: 0 });
                if (!Array.isArray(parsed)) {
                    try {
                        localStorage.setItem(key, JSON.stringify(savedSuggestions));
                    } catch (error) {
                        // console.error('Không thể chuẩn hóa gợi ý AI trong localStorage:', error);
                    }
                }
            } catch (error) {
                // console.error('Không thể đọc gợi ý AI từ localStorage:', error);
                setRecommendationState({ userId: user.userId, suggestions: [], index: 0 });
            }
        };
        const handleStorage = (event) => {
            if (event.key === key || event.key === null) loadSuggestions();
        };

        loadSuggestions();
        window.addEventListener('ai-recommendations-updated', loadSuggestions);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('ai-recommendations-updated', loadSuggestions);
            window.removeEventListener('storage', handleStorage);
        };
    }, [user?.userId]);

    useEffect(() => {
        if (isChatbotOpen || suggestions.length < 2) return undefined;
        const userId = user?.userId;

        const timerId = window.setInterval(() => {
            setRecommendationState((current) => {
                if (current.userId !== userId || current.suggestions.length < 2) return current;
                return {
                    ...current,
                    index: (current.index + 1) % current.suggestions.length,
                };
            });
        }, 2 * 60 * 1000);

        return () => window.clearInterval(timerId);
    }, [isChatbotOpen, suggestions, user?.userId]);

    const { data: videos = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ['videos'],
        queryFn: async () => {
            const res = await videoService.getAll();
            return res.data ?? [];
        },
        staleTime: Infinity,
    });
    const {
        topBattlers,
        isLoading: isRankingLoading,
        error: rankingError,
    } = useRankingData();

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const openWatch = (id) => {
        navigate(`/watch/${id}`);
    };

    const toggleChatbot = () => {
        setIsChatbotOpen((open) => !open);
    };

    useEffect(() => {
        const widget = chatbotWidgetRef.current;
        if (!widget) return undefined;

        let frameId = 0;
        let pointerOffsetX = 0;
        let pointerOffsetY = 0;
        const updateOffset = (nextOffsetX, nextOffsetY) => {
            pointerOffsetX = nextOffsetX;
            pointerOffsetY = nextOffsetY;
            if (frameId) return;

            frameId = window.requestAnimationFrame(() => {
                widget.style.setProperty('--pointer-offset-x', `${pointerOffsetX}px`);
                widget.style.setProperty('--pointer-offset-y', `${pointerOffsetY}px`);
                frameId = 0;
            });
        };
        const handlePointerMove = (event) => {
            if (event.pointerType === 'touch') return;
            const viewportWidth = window.innerWidth || 1;
            const viewportHeight = window.innerHeight || 1;
            const maxTop = Math.max(16, viewportHeight - widget.offsetHeight - 16);
            const verticalRange = Math.min(viewportHeight * 0.8, maxTop - 16);
            const minTop = maxTop - verticalRange;
            const verticalPosition = Math.max(0, Math.min(1, event.clientY / viewportHeight));
            const targetTop = minTop + verticalPosition * verticalRange;
            const baseTop = viewportHeight - widget.offsetHeight - 24;
            const maxLeftShift = Math.min(
                viewportWidth * 0.1,
                Math.max(0, viewportWidth - widget.offsetWidth - 40),
            );
            const horizontalPosition = Math.max(0, Math.min(1, 1 - event.clientX / viewportWidth));

            updateOffset(
                -horizontalPosition * maxLeftShift,
                targetTop - baseTop,
            );
        };
        const resetOffset = () => updateOffset(0, 0);

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerleave', resetOffset);
        window.addEventListener('blur', resetOffset);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerleave', resetOffset);
            window.removeEventListener('blur', resetOffset);
            if (frameId) window.cancelAnimationFrame(frameId);
        };
    }, []);

    return (
        // console.log("Check videos: ", videos),
        <div className="home-container">
            <Header
                onSearch={handleSearch}
                onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                isSidebarCollapsed={!isSidebarCollapsed}
            />

            <div className="home-content">
                <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((prev) => !prev)} />

                <main className="home-main-content">
                    {isLoading ? (
                        <p className="home-video-status" aria-live="polite">Đang tải video...</p>
                    ) : isError ? (
                        <section className="home-video-status home-video-error" role="alert">
                            <h2>Không tải được dữ liệu video</h2>
                            <p>{error?.message || 'Không kết nối được API backend.'}</p>
                            <p>Hãy chạy backend trước: <code>cd Backend &amp;&amp; npm run dev</code></p>
                            <button type="button" onClick={() => refetch()}>Thử lại</button>
                        </section>
                    ) : (
                        <>
                            <HeroBanner
                                videos={videos.slice(0, 10)}
                                onVideoSelect={openWatch}
                            />
                            <RankingTopTen
                                battlers={topBattlers}
                                isLoading={isRankingLoading}
                                error={rankingError}
                            />
                            <VideoGrid
                                videos={videos}
                                searchQuery={searchQuery}
                                onVideoSelect={openWatch}
                            />
                        </>
                    )}
                </main>
            </div>

            <div ref={chatbotWidgetRef} className="home-chatbot-widget">
                <div className={`home-chatbot-widget-motion${isChatbotOpen ? ' is-chatbot-open' : ''}`}>
                    {isChatbotOpen && (
                        <div className="home-chatbot-popover">
                            <RAGChatBot
                                recommendationState={recommendationState}
                                videos={videos}
                            />
                        </div>
                    )}
                    {!isChatbotOpen && displayedRecommendation && (
                        <div
                            key={displayedRecommendation}
                            className={`home-chatbot-recommendation is-${recommendationAnimation}`}
                            aria-live="polite"
                        >
                            {displayedRecommendation}
                        </div>
                    )}
                    <button
                        type="button"
                        className="home-chatbot-toggle"
                        onClick={toggleChatbot}
                        aria-label={`${isChatbotOpen ? 'Đóng chatbot' : 'Mở chatbot'}${suggestions.length > 0 ? `, ${suggestions.length} gợi ý` : ''}`}
                        aria-expanded={isChatbotOpen}
                        title={isChatbotOpen ? 'Đóng chatbot' : 'Mở chatbot'}
                    >
                        <span className="home-chatbot-energy" aria-hidden="true" />
                        <FaRobot aria-hidden="true" />
                        {suggestions.length > 0 && (
                            <span className="home-chatbot-recommendation-count" aria-hidden="true">
                                {suggestions.length > 99 ? '99+' : suggestions.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}