import { useState } from 'react';
import {
    useParams,
    useNavigate
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import VideoPlayer from '../components/VideoPlayer';
import LyricPanel from '../components/LyricPanel';
import ExplanationPanel from '../components/ExplanationPanel';
import { videoService, barService } from '../services/api';
import '../styles/components/VideoWatch.css';



export default function VideoWatch() {
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedLine, setSelectedLine] = useState(null);

    const { videoId } = useParams();
    const navigate = useNavigate();

    const handleTimeUpdate = (time) => {
        setCurrentTime(time);
    };

    const handleSelectLine = (line) => {
        setSelectedLine(line);
    };

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

    return (
        console.log('VideoWatch render with savedBars:', savedBars),
        <div className="watch-page">
            {/* 
            <button onClick={() => navigate(-1)}>
                ← Back
            </button> */}

            <div className="watch-main">

                <VideoPlayer
                    // videoId={videoId}
                    videoUrl={video?.linkVideo}
                    onTimeUpdate={handleTimeUpdate}
                />

                <LyricPanel
                    lyrics={savedBars}
                    currentTime={currentTime}
                    selectedId={selectedLine?.id}
                    onSelectLine={handleSelectLine}
                />

            </div>

            <ExplanationPanel
                line={selectedLine}
                onClose={() => setSelectedLine(null)}
            />

        </div>
    );
}