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

export default {
    apiRequest,
    videoService,
    barService,
    reviewService,
    searchService
};
