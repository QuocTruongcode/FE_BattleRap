import { useState, useRef, useCallback, useEffect } from 'react';
import {
    useParams,
    useNavigate
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { VideoPlayer, BunnyPlayer } from '../components/video';
import { LyricPanel } from '../components/bar';
import { ExplanationPanel } from '../components/review';
import { videoService, barService, barReaction } from '../services/api';
import '../components/bar/LyricsPanel.css';
import './VideoWatch.css';
import { ReactionBar } from '../components/bar-reaction';
import { VideoStage } from '../components/video';
import { useAuth } from "../contexts/AuthContext"; // context bạn đang có user, loading


export default function VideoWatch() {
    const currentTimeRef = useRef(0);
    const [selectedLine, setSelectedLine] = useState(null);
    const [selectedReactionID, setSelectedReactionID] = useState(null);
    const [selectedReactionsByLine, setSelectedReactionsByLine] = useState({});

    const activeLineIdRef = useRef(null);
    const playerRef = useRef(null);
    const { videoId } = useParams();
    const navigate = useNavigate();

    const handleTimeUpdate = useCallback((time) => {
        currentTimeRef.current = time; // ghi liên tục mỗi 100ms, KHÔNG re-render
    }, []);

    const getCurrentTime = useCallback(() => currentTimeRef.current, []); // 👈 hàm "cửa sổ" để đọc ref từ bên ngoài

    const handleSelectLine = (line) => {
        setSelectedLine(line);
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

                console.log(
                    'API ERROR:',
                    err
                );

                throw err;
            }

        },

        // Dùng cache hoàn toàn trong 5 phút
        staleTime: 5 * 60 * 1000,

        // Giữ cache trong RAM 30 phút sau khi rời component
        gcTime: 30 * 60 * 1000

    });

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

    const handleSpaceKey = () => {
        playerRef.current?.togglePlay();
    };

    const handleSelectReaction = (reactionId) => {
        const lineId = activeLineIdRef.current;
        if (!lineId) return;

        setSelectedReactionsByLine(prev => ({
            ...prev,
            [lineId]: reactionId,
        }));
        setSelectedReactionID(reactionId);
    };

    return (
        console.log("Check reactionBarByVideo: ", reactionBarByVideo),
        console.log("check user: ", user),
        // console.log("check selectedReactionID: ", selectedReactionID),
        // console.log("Check line active id: ", activeLineIdRef.current),
        console.log("Check selectedReactionsByLine: ", selectedReactionsByLine),
        <div className="watch-page">
            {/* 
                <button onClick={() => navigate(-1)}>
                    ← Back
                </button> */}

            <div className="watch-main">

                {video?.linkBunny ? (
                    <BunnyPlayer
                        ref={playerRef}
                        videoUrl={video.linkBunny}
                        onTimeUpdate={handleTimeUpdate}
                    >
                        <ReactionBar onSpaceKey={handleSpaceKey} onSelect={handleSelectReaction} />

                    </BunnyPlayer>
                ) : (
                    <VideoPlayer
                        ref={playerRef}
                        videoUrl={video?.linkVideo}
                        onTimeUpdate={handleTimeUpdate}
                    >
                        <ReactionBar onSpaceKey={handleSpaceKey} onSelect={handleSelectReaction} />
                    </VideoPlayer>
                )}

                <LyricPanel
                    lyrics={savedBars}
                    getCurrentTime={getCurrentTime}
                    // selectedId={selectedLine?.id}
                    onSelectLine={handleSelectLine}
                    usePlainCss
                    onActiveLineChange={(id) => { activeLineIdRef.current = id; }}
                    selectedReactionID={selectedReactionID}
                    activeLineId={activeLineIdRef.current}
                    selectedReactionsByLine={selectedReactionsByLine}
                    reactionBarByVideo={reactionBarByVideo}
                />


            </div>

            <ExplanationPanel
                line={selectedLine}
                onClose={() => setSelectedLine(null)}
            />


        </div>
    );
}