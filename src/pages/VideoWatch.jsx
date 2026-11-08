import { useState, useRef, useCallback, useEffect } from 'react';
import {
    useParams,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaYoutube } from 'react-icons/fa';
import { FaCloud } from 'react-icons/fa6';
import { BunnyPlayer, VideoPlayer } from '../components/video';
import { LyricPanel } from '../components/bar';
import { ExplanationPanel } from '../components/review';
import RhymePanel from '../components/review/RhymePanel';
import { videoService, barService, barReaction } from '../services/api';
import '../components/bar/LyricsPanel.css';
import './VideoWatch.css';
import { VideoAccessModal } from '../components/common';
import { ReactionBar } from '../components/bar-reaction';
import { VideoStage } from '../components/video';
import { useAuth } from "../contexts/AuthContext"; // context bạn đang có user, loading
import MyChart from '../components/layout/ReChart'
import TableSummary from '../components/layout/TableSummary'
import Comments from '../components/comment/Comments';
import HlsPlayer from '../components/video/HlsPlayer';
export default function VideoWatch() {
    const currentTimeRef = useRef(0);
    const [selectedLine, setSelectedLine] = useState(null);
    const [activeAnalysis, setActiveAnalysis] = useState('explanation');
    const [selectedReactionID, setSelectedReactionID] = useState(null);
    const [selectedReactionsByLine, setSelectedReactionsByLine] = useState({});
    const [playbackSelection, setPlaybackSelection] = useState(null);

    const activeLineIdRef = useRef(null);
    const playerRef = useRef(null);
    const playerReadyRef = useRef(false);
    const pendingSeekTimeRef = useRef(null);
    const { videoId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const startTimeParam = searchParams.get('t');
    const requestedStartTime = Number(startTimeParam);
    const hasRequestedStartTime = startTimeParam !== null
        && startTimeParam.trim() !== ''
        && Number.isFinite(requestedStartTime)
        && requestedStartTime >= 0;
    const shouldSeekOnReadyRef = useRef(hasRequestedStartTime);

    useEffect(() => {
        playerReadyRef.current = false;
        pendingSeekTimeRef.current = null;
    }, [videoId]);

    useEffect(() => {
        shouldSeekOnReadyRef.current = hasRequestedStartTime;
        if (hasRequestedStartTime && playerReadyRef.current) {
            playerRef.current?.seekTo(requestedStartTime);
            shouldSeekOnReadyRef.current = false;
        }
    }, [videoId, hasRequestedStartTime, requestedStartTime]);

    const handlePlayerReady = useCallback(() => {
        playerReadyRef.current = true;
        if (pendingSeekTimeRef.current !== null) {
            playerRef.current?.seekTo(pendingSeekTimeRef.current);
            pendingSeekTimeRef.current = null;
            return;
        }
        if (!shouldSeekOnReadyRef.current) return;

        playerRef.current?.seekTo(requestedStartTime);
        shouldSeekOnReadyRef.current = false;
    }, [requestedStartTime]);

    const handlePlaybackSourceChange = (source) => {
        if (source === playbackSource || (source === 'cloud' && !video?.storageId)) return;

        pendingSeekTimeRef.current = playerReadyRef.current
            ? currentTimeRef.current
            : shouldSeekOnReadyRef.current ? requestedStartTime : currentTimeRef.current;
        shouldSeekOnReadyRef.current = false;
        playerReadyRef.current = false;
        setPlaybackSelection({ videoId, source });
    };

    const handleTimeUpdate = useCallback((time) => {
        currentTimeRef.current = time; // ghi liên tục mỗi 100ms, KHÔNG re-render
    }, []);

    const getCurrentTime = useCallback(() => currentTimeRef.current, []); // 👈 hàm "cửa sổ" để đọc ref từ bên ngoài

    const handleSelectLine = (line) => {
        setSelectedLine(line);
    };

    const handleJoinBarComments = (barTime) => {
        setActiveAnalysis('comments');
        playerRef.current?.seekTo(barTime);
        playerRef.current?.autoPlay();

    };

    const { user } = useAuth(); // lấy user


    const {
        data: video,
        isLoading,
        error
    } = useQuery({

        queryKey: ['video', videoId],

        queryFn: async () => {
            try {

                const res =
                    await videoService.getById(videoId);
                return res.data;

            } catch (err) {

                // console.log(
                //     'API ERROR:',
                //     err
                // );

                throw err;
            }

        },

        // Dùng cache hoàn toàn trong 5 phút
        staleTime: 5 * 60 * 1000,

        // Giữ cache trong RAM 30 phút sau khi rời component
        gcTime: 30 * 60 * 1000

    });

    const playbackSource = playbackSelection?.videoId === videoId
        ? playbackSelection.source
        : video?.storageId ? 'cloud' : 'youtube';

    const { data: savedBars = [] } = useQuery({
        queryKey: ['bars', videoId],
        queryFn: async () => {
            const res = await barService.getBarByVideoId(videoId);
            return res.data.map(bar => ({
                ...bar,
                time: bar.startTime, // mapping startTime → time
            }));
        },
        enabled: !!videoId,
        staleTime: 2 * 60 * 1000,
    });


    const { data: reactionBarByVideo = [] } = useQuery({
        queryKey: ['bar-reactions', videoId, user?.userId],
        queryFn: async () => {
            if (!user?.userId) return [];
            const res = await barReaction.getReactionBarByUserAndVideo(user.userId, videoId);
            return res.data;
        },
        enabled: !!user?.userId && !!videoId,
        staleTime: 2 * 60 * 1000,
    });



    // Lưu selectedReactionsByLine vào localStorage mỗi khi nó thay đổi, nhưng chỉ khi user đã đăng nhập

    useEffect(() => {
        if (!user?.userId) return;
        if (Object.keys(selectedReactionsByLine).length === 0) return;
        localStorage.setItem(
            `pending_reactions_${user.userId}`,
            JSON.stringify(selectedReactionsByLine)
        );
    }, [selectedReactionsByLine, user?.userId]);
    // Kêt thúc useEffect

    // useEffect(() => {
    //     console.log("Check: ", document.fullscreenElement)
    // }, [])

    const handleSpaceKey = () => {
        playerRef.current?.togglePlay();
    };

    const handleSelectReaction = (reactionId) => {
        const lineId = activeLineIdRef.current;
        console.log("Check lineID: ", lineId.id)
        if (!lineId.id) return;

        setSelectedReactionsByLine(prev => ({
            ...prev,
            [lineId.id]: reactionId,
        }));
        setSelectedReactionID(reactionId);
    };
    const summaryLayout = (
        <div className="video-summary-layout">
            <MyChart savedBars={savedBars} currentTimeRef={currentTimeRef} />
            <TableSummary
                savedBars={savedBars}
                currentTimeRef={currentTimeRef}
                onBarSelect={(time) => playerRef.current?.seekTo(time)}
            />
        </div>
    );

    // if (isLoading) {
    //     // return <div className="watch-page-status" role="status">Đang tải trận đấu...</div>;
    // }

    // if (error) {
    //     return (
    //         <div className="watch-page-status" role="alert">
    //             Không tải được trận đấu: {error.message || 'Vui lòng thử lại sau.'}
    //         </div>
    //     );
    // }

    return (
        // console.log("Check currentTimeRef: ", currentTimeRef),
        // console.log("Check reactionBarByVideo: ", reactionBarByVideo),
        // console.log("check user: ", user),
        // console.log("check selectedReactionsByLine: ", selectedReactionsByLine),
        // style={{backgroundImage: `url("${video.thumbnailUrl}")`
        console.log("Check video: ", video),
        // console.log("Check activeLineIdRef: ", activeLineIdRef.current),
        <div className="watch-page" style={
            video?.thumbnailUrl
                ? { "--thumb": `url("${video.thumbnailUrl}")` }
                : undefined
        }>
            {/* 
                <button onClick={() => navigate(-1)}>
                    ← Back
                </button> */}

            <div className="watch-main">

                {playbackSource === 'cloud' && video?.storageId ? (
                    <HlsPlayer
                        ref={playerRef}
                        storageId={video.storageId}
                        onTimeUpdate={handleTimeUpdate}
                        onReady={handlePlayerReady}
                        fullscreenChildren={summaryLayout}
                    >
                        <ReactionBar onSpaceKey={handleSpaceKey} onSelect={handleSelectReaction} />
                    </HlsPlayer>
                ) : !video?.linkVideo && video?.linkBunny ? (
                    <BunnyPlayer
                        ref={playerRef}
                        videoUrl={video.linkBunny}
                        onTimeUpdate={handleTimeUpdate}
                        onReady={handlePlayerReady}
                    >
                        <ReactionBar onSpaceKey={handleSpaceKey} onSelect={handleSelectReaction} />
                    </BunnyPlayer>
                ) : (
                    <VideoPlayer
                        ref={playerRef}
                        videoUrl={video?.linkVideo}
                        onTimeUpdate={handleTimeUpdate}
                        onReady={handlePlayerReady}
                        fullscreenChildren={summaryLayout}
                    >
                        <ReactionBar onSpaceKey={handleSpaceKey} onSelect={handleSelectReaction} />
                    </VideoPlayer>
                )}

                <div className="watch-player-source-controls" role="group" aria-label="Chọn nguồn phát video">
                    <button
                        type="button"
                        className={`watch-player-source-button${playbackSource === 'youtube' ? ' is-active' : ''}`}
                        onClick={() => handlePlaybackSourceChange('youtube')}
                        aria-label="Phát bằng YouTube"
                        aria-pressed={playbackSource === 'youtube'}
                    >
                        <FaYoutube aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={`watch-player-source-button${playbackSource === 'cloud' ? ' is-active' : ''}`}
                        onClick={() => handlePlaybackSourceChange('cloud')}
                        disabled={!video?.storageId}
                        aria-label="Phát bằng Cloud"
                        aria-pressed={playbackSource === 'cloud'}
                        title={!video?.storageId ? 'Video chưa có storageId' : 'Phát bằng Cloud'}
                    >
                        <FaCloud aria-hidden="true" />
                    </button>
                </div>

                <LyricPanel
                    lyrics={savedBars}
                    getCurrentTime={getCurrentTime}
                    // selectedId={selectedLine?.id}
                    onSelectLine={handleSelectLine}
                    onJoinBarComments={handleJoinBarComments}
                    usePlainCss
                    onActiveLineChange={(id) => { activeLineIdRef.current = id; }}
                    selectedReactionID={selectedReactionID}
                    activeLineId={activeLineIdRef.current}
                    selectedReactionsByLine={selectedReactionsByLine}
                    reactionBarByVideo={reactionBarByVideo}
                />

            </div>

            <aside className="watch-analysis-panel">
                <nav className="watch-analysis-tabs" role="tablist" aria-label="Phân tích bar">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeAnalysis === 'explanation'}
                        className={activeAnalysis === 'explanation' ? 'is-active' : ''}
                        onClick={() => setActiveAnalysis('explanation')}
                    >
                        Giải thích
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeAnalysis === 'rhyme'}
                        className={activeAnalysis === 'rhyme' ? 'is-active' : ''}
                        onClick={() => setActiveAnalysis('rhyme')}
                    >
                        Gieo vần
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeAnalysis === 'comments'}
                        className={activeAnalysis === 'comments' ? 'is-active' : ''}
                        onClick={() => setActiveAnalysis('comments')}
                    >
                        Bình luận
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeAnalysis === 'results'}
                        className={activeAnalysis === 'results' ? 'is-active' : ''}
                        onClick={() => setActiveAnalysis('results')}
                    >
                        Kết quả
                    </button>
                </nav>
                <div className="watch-analysis-content">
                    {activeAnalysis === 'results' ? (
                        <div className="watch-analysis-results">
                            {summaryLayout}
                        </div>
                    ) : activeAnalysis === 'explanation' ? (
                        selectedLine ? (
                            <ExplanationPanel
                                line={selectedLine}
                                onClose={() => setSelectedLine(null)}
                                onJoinComments={handleJoinBarComments}
                            />
                        ) : (
                            <div className="watch-analysis-empty">
                                Chọn một câu rap để xem giải thích.
                            </div>
                        )
                    ) : activeAnalysis === 'rhyme' ? (
                        <RhymePanel
                            videoId={videoId}
                            onClose={() => setActiveAnalysis('explanation')}
                        />
                    ) : (
                        <Comments
                            userName={user?.UserName}
                            userId={user?.userId}
                            className="video-comments--panel"
                            resizable
                            video={video}
                            bars={savedBars}
                        />
                    )}
                </div>
            </aside>

            {(!video || typeof video.linkVideo !== 'string' || !video.linkVideo.trim()) && (
                <VideoAccessModal video={video} onClose={() => navigate('/')} />
            )}

        </div>
    );
}