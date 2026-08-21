import { useState } from 'react';

export const emptyForm = {
    title: '',
    linkVideo: '',
    linkBunny: '',
    thumbnailUrl: '',
    review: '',
};

export function useVideoCrudForm() {
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ ...emptyForm });
        setEditingId(null);
    };

    const startEdit = (video) => {
        setEditingId(video.id);
        setFormData({
            title: video.title,
            linkVideo: video.linkVideo,
            linkBunny: video.linkBunny || '',
            thumbnailUrl: video.thumbnailUrl,
            review: video.review || '',
        });
    };

    return {
        formData,
        editingId,
        handleChange,
        resetForm,
        startEdit,
    };
}
