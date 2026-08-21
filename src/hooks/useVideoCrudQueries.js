import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { videoService } from '../services/api';

export function useVideoCrudQueries(searchQuery) {
    const queryClient = useQueryClient();

    const {
        data: videos = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['videos'],
        queryFn: async () => {
            const res = await videoService.getAll();
            return res.data ?? [];
        },
        staleTime: Infinity,
    });

    const createMutation = useMutation({
        mutationFn: (formData) => videoService.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['videos'] });
            alert('Thêm video thành công!');
        },
        onError: () => alert('Thêm video không thành công!'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }) => videoService.update(id, formData),
        onSuccess: (_, { id, formData }) => {
            queryClient.setQueryData(['videos'], (old = []) =>
                old.map((video) => (video.id === id ? { ...video, ...formData } : video))
            );
            alert('Sửa video thành công!');
        },
        onError: () => alert('Sửa video không thành công!'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => videoService.remove(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(['videos'], (old = []) =>
                old.filter((video) => video.id !== id)
            );
            alert('Xoá thành công!');
        },
        onError: () => alert('Xoá không thành công!'),
    });

    const filteredVideos = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return videos;

        return videos.filter((video) =>
            [video.title, video.linkVideo, video.linkBunny, video.thumbnailUrl].some((value) =>
                value?.toLowerCase().includes(query)
            )
        );
    }, [searchQuery, videos]);

    return {
        videos,
        filteredVideos,
        isLoading,
        isError,
        error,
        refetch,
        createMutation,
        updateMutation,
        deleteMutation,
    };
}
