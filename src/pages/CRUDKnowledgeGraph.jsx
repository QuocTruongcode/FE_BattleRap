import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/MainLayout';
import VideoSearch from '../components/VideoSearch';
import { barService, videoService } from '../services/api';
import LyricPanel from '../components/LyricPanel';
import Graph from '../components/Graph';
import './CRUDKnowledgeGraph.css';
const LAST_VIDEO_KEY = 'lastVideoId';

export default function CRUDKnowledgeGraph() {
    const [searchParams, setSearchParams] = useSearchParams();
    const videoId = searchParams.get('videoId');
    const queryClient = useQueryClient();
    const [barSelected, setBarSelected] = useState({});

    // Nếu vào trang mà URL chưa có videoId, thử khôi phục từ localStorage
    useEffect(() => {
        if (!searchParams.get('videoId')) {
            const lastId = localStorage.getItem(LAST_VIDEO_KEY);
            if (lastId) {
                setSearchParams({ videoId: lastId }, { replace: true });
            }
        }
    }, []); // chỉ chạy đúng 1 lần lúc component mount

    const handleSelectVideo = (selectedVideo) => {
        queryClient.setQueryData(['video', String(selectedVideo.id)], selectedVideo);
        localStorage.setItem(LAST_VIDEO_KEY, selectedVideo.id); // nhớ lại cho lần sau
        setSearchParams({ videoId: selectedVideo.id });
    };

    const { data: video } = useQuery({
        queryKey: ['video', videoId],
        queryFn: async () => {
            const res = await videoService.getById(videoId);
            return res.data;
        },
        enabled: !!videoId,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const { data: lyrics = [] } = useQuery({
        queryKey: ['bars', videoId],
        queryFn: async () => {
            const res = await barService.getBarByVideoId(videoId);
            return res.data.map(bar => ({
                ...bar,
                time: bar.startTime,
            }));
        },
        enabled: !!videoId,
        staleTime: 2 * 60 * 1000,
    });

    const handleSelectBar = (bar) => {
        console.log('Selected bar:', bar);
        setBarSelected(bar);
    };

    return (
        <div className="crud-knowledge-graph-page">
            <MainLayout>
                <div>
                    <VideoSearch handleSelectVideo={handleSelectVideo} />
                    <LyricPanel lyrics={lyrics} video={video} onSelectLine={handleSelectBar} />
                </div>
                <Graph video={video} barSelected={barSelected} />
            </MainLayout>
        </div>
    );
}