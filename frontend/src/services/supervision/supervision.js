import axios from 'axios';

const api = axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
});

export async function getSupervisionStatus() {
    const { data } = await api.get('/supervision/status');
    return data;
}

export async function startSupervision(payload = {}) {
    const { data } = await api.post('/supervision/start', payload);
    return data;
}

export async function stopSupervision() {
    const { data } = await api.post('/supervision/stop');
    return data;
}
