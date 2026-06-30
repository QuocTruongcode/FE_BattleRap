const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
}

export async function apiRequest(path, options = {}) {
    const { method = 'GET', body, headers = {}, timeout = 10000 } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });

        const data = await parseResponse(response);

        if (!response.ok) {
            const message =
                typeof data === 'object' && data !== null && 'message' in data
                    ? data.message
                    : `Request failed with status ${response.status}`;

            throw new Error(message);
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(
                `Không kết nối được API tại ${API_BASE_URL || '(chưa cấu hình VITE_API_BASE_URL)'}. Hãy chạy backend (port 3001) và SQL Server.`
            );
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
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

export default {
    apiRequest,
    videoService,
    barService,
};
