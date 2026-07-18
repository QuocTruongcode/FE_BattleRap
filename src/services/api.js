import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

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
    const { method = 'GET', body, headers = {}, timeout = 10000 } = options;

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
        return apiRequest('/api/bars', {
            method: 'POST',
            body: payload,
        });
    },

    getBarByVideoId(id) {
        return apiRequest(`/api/bars/video/${id}`);
    },

    update(id, payload) {
        return apiRequest(`/api/bars/${id}`, {
            method: 'PUT',
            body: payload,
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
};

export const reviewService = {
    getReviewsAI(IDvideoYt) {
        return apiRequest(`/api/youtube?videoId=${IDvideoYt}`, {
            timeout: 180000, // 3 phút, chỉ áp dụng riêng cho request này
        });
    },
};

export default {
    apiRequest,
    videoService,
    barService,
    reviewService,
};
