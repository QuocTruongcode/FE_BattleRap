import { useRef, useState } from 'react';
import { reviewService } from '../services/api';

export function useVideoReview() {
    const [isOpen, setIsOpen] = useState(false);
    const [reviewContent, setReviewContent] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const editorRef = useRef(null);
    const sseRef = useRef(null);

    const getYoutubeVideoId = (url) => {
        if (!url) return null;

        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);

        return match ? match[1] : null;
    };

    const getReviewContent = ({ editingId, formData }) => {
        if (editingId === null) {
            setReviewContent('Video chưa được thực hiện đánh giá');
            return;
        }

        setReviewContent(formData.review || 'Video chưa được thực hiện đánh giá');
    };

    const openModalReview = ({ formData, editingId }) => {
        if (!formData.linkVideo || !formData.title || !formData.thumbnailUrl) {
            return false;
        }

        setIsOpen(true);
        getReviewContent({ editingId, formData });
        return true;
    };

    const handleReviewAi = ({ formData }) => {
        setReviewContent(null);
        const videoId = getYoutubeVideoId(formData.linkVideo);

        if (!videoId) {
            alert('Link video không hợp lệ. Vui lòng nhập link video YouTube hợp lệ.');
            return;
        }

        const isConfirmed = window.confirm('Bạn có chắc chắn muốn dùng AI để đánh giá video này không?');
        if (!isConfirmed) return;

        setIsAnalyzing(true);
        setProgressMessage('');

        sseRef.current = reviewService.getReviewsAI(videoId, {
            onStep: (data) => {
                setProgressMessage(data.message);
            },
            onResult: (data) => {
                if (!data || !data.textList || data.textList.errCode !== 0) {
                    alert('Có lỗi trong quá trình lấy đánh giá từ AI. Vui lòng thử lại sau.');
                } else {
                    const newContent = data.textList.message || 'Không có đánh giá từ AI';
                    setReviewContent(newContent);
                    editorRef.current?.setMarkdown(newContent);
                }

                setIsAnalyzing(false);
                setProgressMessage('');
            },
            onError: (err) => {
                alert(`Lỗi: ${err.message}`);
                setIsAnalyzing(false);
                setProgressMessage('');
            },
        });
    };

    const triggerSubmitFromModal = (formRef) => {
        formRef.current?.requestSubmit();
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (!sseRef.current) return;

        const isConfirmed = window.confirm('Bạn có muốn hủy tiến trình đánh giá bằng AI không?');
        if (!isConfirmed) return;

        sseRef.current.cancel?.();
        setIsAnalyzing(false);
        setProgressMessage('');
    };

    return {
        isOpen,
        setIsOpen,
        reviewContent,
        setReviewContent,
        editorRef,
        isAnalyzing,
        progressMessage,
        openModalReview,
        handleReviewAi,
        triggerSubmitFromModal,
        handleCancel,
    };
}
