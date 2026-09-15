import { apiClient } from './client.js';
import { fetchMediaConfig, resolveMediaUrl } from '../utils/mediaConfig.js';

export const clipApi = {
  create: (data) => apiClient('/api/Clip/create', { method: 'POST', body: JSON.stringify(data) }),
  slice: async (data) => {
    // 1. Attempt standard backend slice
    try {
      return await apiClient('/api/Clip/slice', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      const errMsg = (err && err.message) || String(err);
      console.warn('[clipApi] Backend slice failed, attempting direct media server slice:', errMsg);

      const mediaCfg = await fetchMediaConfig().catch(() => null);
      let clipEndpoint = null;
      if (mediaCfg?.hlsBaseUrl) {
        clipEndpoint = `${mediaCfg.hlsBaseUrl.replace(/\/hls\/?$/, '')}/api/clip`;
      }

      const endpoints = [
        clipEndpoint,
        'https://localhost:8443/api/clip',
        'http://localhost:8085/api/clip',
        'http://127.0.0.1:8085/api/clip'
      ].filter(Boolean);

      let sliceResult = null;

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              streamKey: data.streamKey || '',
              recordingFileName: data.recordingFileName || null,
              isLive: data.isLive !== false,
              durationSeconds: data.durationSeconds || 60,
              title: data.title || 'Untitled Clip'
            })
          });

          if (res.ok) {
            const json = await res.json();
            if (json && (json.success || json.clipUrl)) {
              sliceResult = json;
              break;
            }
          }
        } catch (_) {}
      }

      if (sliceResult && sliceResult.clipUrl) {
        const fullClipUrl = resolveMediaUrl(sliceResult.clipUrl);
        const fullThumbUrl = sliceResult.thumbnailUrl ? resolveMediaUrl(sliceResult.thumbnailUrl) : null;

        return await apiClient('/api/Clip/create', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title || 'Untitled Clip',
            channelId: data.channelId,
            liveStreamId: data.liveStreamId || data.streamId || null,
            categoryId: data.categoryId || null,
            durationSeconds: sliceResult.durationSeconds || data.durationSeconds || 60,
            videoUrl: fullClipUrl,
            thumbnailUrl: fullThumbUrl
          })
        });
      }

      throw err;
    }
  },
  getChannelClips: (channelId, page = 1, size = 20) => apiClient(`/api/Clip/channel/${channelId}?page=${page}&pageSize=${size}`),
  getTop: (count = 20) => apiClient(`/api/Clip/top?count=${count}`),
  getById: (id) => apiClient(`/api/Clip/${id}`),
  recordView: (id, sessionId) => apiClient(`/api/Clip/${id}/view${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`, { method: 'POST' }),
  delete: (id) => apiClient(`/api/Clip/${id}`, { method: 'DELETE' }),
};