import axios from 'axios';
import { redirectToLogin } from '../styles/utils/navigation'; // 👈 file mới, sẽ tạo bên dưới

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL ?? '';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// tạo instance axios riêng cho ChatBot, nếu cần cấu hình khác
const apiChatBot = axios.create({
    baseURL: CHATBOT_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});

// 👇 Thêm đoạn này
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        // console.log('Token from localStorage:', token); // Debug: Log the token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // console.log('', config);
        return config;
    },
    (error) => Promise.reject(error)
);

// 👇 THÊM ĐOẠN NÀY — xử lý kiểm tra response và điều hướng
apiClient.interceptors.response.use(
    (response) => response, // không lỗi → trả về bình thường
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            redirectToLogin();
        }
        return Promise.reject(error); // vẫn ném lỗi ra để apiRequest xử lý message tiếp
    }
);

function getErrorMessage(error) {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return `Không kết nối được API tại ${API_BASE_URL || '(chưa cấu hình VITE_API_BASE_URL)'}. Hãy chạy backend (port 3001) và SQL Server.`;
        }

        const data = error.response.data;

        if (typeof data === 'string' && data.trim()) {
            return data;
        }

        if (typeof data === 'object' && data !== null) {
            if (typeof data.message === 'string' && data.message.trim()) {
                return data.message;
            }

            if (typeof data.error === 'string' && data.error.trim()) {
                return data.error;
            }
        }

        return `Request failed with status ${error.response.status}`;
    }

    return error instanceof Error ? error.message : 'Request failed';
}

export async function apiRequest(path, options = {}) {
    const { method = 'GET', body, headers = {}, timeout = 10000, params, signal } = options;

    try {
        const response = await apiClient.request({
            url: path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            timeout,
            data: body === undefined ? undefined : body,
            params, signal,
        });

        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error));
    }
}

export const videoService = {
    getAll() {
        return apiRequest('/api/videos');
    },

    getById(id) {
        return apiRequest(`/api/videos/${id}`);
    },

    create(payload) {
        return apiRequest('/api/videos', {
            method: 'POST',
            body: payload,
        });
    },

    update(id, payload) {
        return apiRequest(`/api/videos/${id}`, {
            method: 'PUT',
            body: payload,
        });
    },

    remove(id) {
        return apiRequest(`/api/videos/${id}`, {
            method: 'DELETE',
        });
    },
};

export const barService = {
    create(payload) {
        const normalizedPayload = Array.isArray(payload)
            ? payload.map((item) => ({
                ...item,
                barttelID: item?.barttelID ?? item?.battlerId ?? null,
            }))
            : {
                ...payload,
                barttelID: payload?.barttelID ?? payload?.battlerId ?? null,
            };

        return apiRequest('/api/bars', {
            method: 'POST',
            body: normalizedPayload,
        });
    },

    getBarByVideoId(id) {
        return apiRequest(`/api/bars/video/${id}`);
    },

    update(id, payload) {
        return apiRequest(`/api/bars/${id}`, {
            method: 'PUT',
            body: {
                ...payload,
                barttelID: payload?.barttelID ?? payload?.battlerId ?? null,
            },
        });
    },

    deleteBar(id) {
        return apiRequest(`/api/bars/${id}`, {
            method: 'DELETE',
        });
    },
    deleteAllBarByVideoId(id) {
        return apiRequest(`/api/bars/video/${id}`, {
            method: 'DELETE',
        });
    },
    explainBar(id) {
        return apiRequest(`/api/bars/explainBar/${id}`, {
            method: 'GET',
        });
    }
};

// reviewService.js

export const reviewService = {
    // Giữ cách gọi cũ cho các API bình thường khác

    // Hàm mới dành riêng cho SSE — không return data, mà nhận callback
    getReviewsAI(videoId, { onStep, onResult, onError, onCancelled }) {
        const baseURL = import.meta.env.VITE_API_BASE_URL || "";

        // 1. Tự sinh jobId ở phía client
        const jobId = crypto.randomUUID();

        // 2. Gửi kèm jobId lên server khi mở kết nối SSE
        const source = new EventSource(
            `${baseURL}/api/review?videoId=${videoId}&jobId=${jobId}`
        );

        source.addEventListener('step', (e) => {
            onStep?.(JSON.parse(e.data));
        });

        source.addEventListener('result', (e) => {
            onResult?.(JSON.parse(e.data));
            source.close();
        });

        source.addEventListener('error', (e) => {
            onError?.(e.data ? JSON.parse(e.data) : { message: 'Mất kết nối' });
            source.close();
        });

        // 3. Lắng nghe event 'cancelled' — khi job bị hủy
        source.addEventListener('cancelled', (e) => {
            onCancelled?.(e.data ? JSON.parse(e.data) : { message: 'Đã hủy' });
            source.close();
        });

        // 4. Hàm hủy — khớp với route POST /api/review/:jobId/cancel
        const cancel = async () => {
            try {
                await fetch(`${baseURL}/api/review/${jobId}/cancel`, {
                    method: 'POST'
                });
            } catch (err) {
                console.error('Lỗi khi gọi API hủy:', err);
            } finally {
                source.close();
            }
        };

        // Trả về cả source (để tự đóng khi unmount) và cancel (để bấm nút Hủy)
        return { source, jobId, cancel };
    },
};


// services/api.js
export const searchService = {
    search(keyword, { signal } = {}) {
        return apiRequest('/api/search', {
            method: 'GET',
            params: { keyword },
            signal,
        });
    },
};

export const barReaction = {
    create(payload) {
        return apiRequest('/api/bar-reactions', {
            method: 'POST',
            body: payload,
        });
    },

    bulkCreate(payload) {
        return apiRequest('/api/bar-reactions/bulk', {
            method: 'POST',
            body: payload,
        });
    },

    getReactionBarByUserAndVideo(userId, videoId) {
        return apiRequest(`/api/bar-reactions/user/${userId}/video/${videoId}`, {
            method: 'GET',
        });
    },


    update(id, payload) {
        return apiRequest(`/api/bar-reactions/${id}`, {
            method: 'PUT',
            body: payload,
        });
    },

    deleteBarReaction(id) {
        return apiRequest(`/api/bar-reactions/${id}`, {
            method: 'DELETE',
        });
    },
    deleteAllBarReactionsByVideoId(id) {
        return apiRequest(`/api/bar-reactions/video/${id}`, {
            method: 'DELETE',
        });
    },
};

export const authService = {
    getMe() {
        return apiRequest('/api/auth/me', {
            method: 'GET',
        });
    },
};

export const loginService = {
    loginAsGuest() {
        return apiRequest('/api/auth/guest', {
            method: 'POST',
        });
    },
};

export const chatBotService = {
    postQuery(query) {
        return apiChatBot.post('/post-input-question', {
            question: query
        });
    },
};


export const battlerService = {
    getAll() {
        return apiRequest('/api/battlers');
    },

    getById(id) {
        return apiRequest(`/api/battlers/${id}`);
    },

    create(payload) {
        return apiRequest('/api/battlers', {
            method: 'POST',
            body: payload,
        });
    },

    update(id, payload) {
        return apiRequest(`/api/battlers/${id}`, {
            method: 'PUT',
            body: payload,
        });
    },

    remove(id) {
        return apiRequest(`/api/battlers/${id}`, {
            method: 'DELETE',
        });
    },
};

export const searchBattler = {
    search(keyword) {
        return apiRequest('/api/search/battlers', {
            method: 'GET',
            params: { keyword },
        });
    },
};

export const Video_battler = {

    getBattlerByVideoId(videoID) {
        return apiRequest(`/api/video-battlers/video/${videoID}`);
    },


    create(payload) {
        return apiRequest('/api/video-battlers', {
            method: 'POST',
            body: payload,
        });
    },

    update(id, payload) {
        return apiRequest(`/api/video-battlers/${id}`, {
            method: 'PUT',
            body: payload,
        });
    },

    remove(videoID, battlerID) {
        return apiRequest(`/api/video-battlers/video/${videoID}/battler/${battlerID}`, {
            method: 'DELETE',
        });
    },
};

export const explanation = {

    getExplanationByBarId(BarID) {
        return apiRequest(`/api/explanations/bar/${BarID}`);
    },


    create(payload) {
        return apiRequest('/api/explanations', {
            method: 'POST',
            body: payload,
        });
    },

    callLLMAnalysisBar(payload) {
        return apiRequest('/api/call-llm/analysis-bar', {
            method: 'POST',
            body: payload,
            timeout: 60000, // 60 giây, đủ cho luồng Gemini + Tavily search song song

        });
    },

    update(id, payload) {
        return apiRequest(`/api/explanations/${id}`, {
            method: 'PUT',
            body: payload,
        });
    },

};
export default {
    apiRequest,
    videoService,
    barService,
    reviewService,
    searchService,
    barReaction,
    authService,
    loginService,
    chatBotService,
    battlerService,
    searchBattler,
    Video_battler,
    explanation,

};
