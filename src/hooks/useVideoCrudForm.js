import { useState } from 'react';

export const emptyForm = {
    title: '',
    FileName: '',
    linkVideo: '',
    linkBunny: '',
    thumbnailUrl: '',
    review: '',
    cleanScore: 0,
    status: 0,
    storageID: '',
    key: '',
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
            FileName: video.FileName || '',
            linkVideo: video.linkVideo,
            linkBunny: video.linkBunny || '',
            thumbnailUrl: video.thumbnailUrl,
            review: video.review || '',
            cleanScore: video.cleanScore ?? 0,
            status: video.status ?? 0,
            storageID: video.storageID || '',
            key: video.key || '',
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
