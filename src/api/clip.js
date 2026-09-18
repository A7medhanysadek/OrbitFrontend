import { apiClient } from './client.js';
import { fetchMediaConfig, resolveMediaUrl } from '../utils/mediaConfig.js';

export const clipApi = {
  create: async (data) => {
    // Multi-tier resilient registration:
    // 1. Try /api/Clip/create
    try {
      return await apiClient('/api/Clip/create', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      if (err && (err.status === 404 || err.status === 405)) {
        console.warn(`[clipApi] /api/Clip/create returned ${err.status}, trying /api/Clip...`);
        // 2. Try /api/Clip
        try {
          return await apiClient('/api/Clip', { method: 'POST', body: JSON.stringify(data) });
        } catch (err2) {
          if (err2 && (err2.status === 404 || err2.status === 405)) {
            console.warn(`[clipApi] /api/Clip returned ${err2.status}, falling back to /api/Clip/slice with pre-generated videoUrl...`);
            // 3. Fall back to /api/Clip/slice (present across all backend builds)
            return await apiClient('/api/Clip/slice', {
              method: 'POST',
              body: JSON.stringify({
                liveStreamId: data.liveStreamId || data.streamId || null,
                streamId: data.liveStreamId || data.streamId || null,
                channelId: data.channelId,
                title: data.title,
                durationSeconds: data.durationSeconds,
                videoUrl: data.videoUrl,
                thumbnailUrl: data.thumbnailUrl
              })
            });
          }
          throw err2;
        }
      }
      throw err;
    }
  },
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
          console.log(`[clipApi] Attempting direct slice on: ${ep}`);
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
              console.log(`[clipApi] Direct slice succeeded on ${ep}:`, json);
              sliceResult = json;
              break;
            }
          } else {
            const errTxt = await res.text().catch(() => '');
            console.warn(`[clipApi] ${ep} responded with HTTP ${res.status}:`, errTxt);
          }
        } catch (epErr) {
          console.warn(`[clipApi] Failed to reach ${ep}:`, epErr.message);
        }
      }

      if (sliceResult && sliceResult.clipUrl) {
        const fullClipUrl = resolveMediaUrl(sliceResult.clipUrl);
        const fullThumbUrl = sliceResult.thumbnailUrl ? resolveMediaUrl(sliceResult.thumbnailUrl) : null;
        console.log('[clipApi] Registering created clip with backend API...');

        return await clipApi.create({
          title: data.title || 'Untitled Clip',
          channelId: data.channelId,
          liveStreamId: data.liveStreamId || data.streamId || null,
          categoryId: data.categoryId || null,
          durationSeconds: sliceResult.durationSeconds || data.durationSeconds || 60,
          videoUrl: fullClipUrl,
          thumbnailUrl: fullThumbUrl
        });
      }

      // Fallback: If media server has no live chunks (e.g. simulated stream), register highlight directly
      if (data.channelId || data.liveStreamId) {
        console.log('[clipApi] Media server has no active stream chunks, registering highlight with backend...');
        return await clipApi.create({
          title: data.title || 'Untitled Clip',
          channelId: data.channelId,
          liveStreamId: data.liveStreamId || data.streamId || null,
          categoryId: data.categoryId || null,
          durationSeconds: data.durationSeconds || 60,
          videoUrl: data.recordingFileName || data.videoUrl || null,
          thumbnailUrl: data.thumbnailUrl || null
        });
      }

      throw new Error('Media server is not responding to clipping requests. Please verify the streaming server is running.');
    }
  },
  getChannelClips: (channelId, page = 1, size = 20) => apiClient(`/api/Clip/channel/${channelId}?page=${page}&pageSize=${size}`),
  getTop: (count = 20) => apiClient(`/api/Clip/top?count=${count}`),
  getById: (id) => apiClient(`/api/Clip/${id}`),
  recordView: (id, sessionId) => apiClient(`/api/Clip/${id}/view${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`, { method: 'POST' }),
  delete: (id) => apiClient(`/api/Clip/${id}`, { method: 'DELETE' }),
};