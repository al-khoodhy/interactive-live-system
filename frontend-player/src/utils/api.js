// frontend-player/src/utils/api.js
import axios from 'axios';

// Arahkan ke port server Laravel Anda (bawaan artisan serve adalah 8000)
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export default api;