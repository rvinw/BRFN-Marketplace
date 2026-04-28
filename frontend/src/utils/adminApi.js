import { apiFetch } from './api';

export const adminFetch = (path, options) => apiFetch(`/admin${path}`, options);
