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
    // 1. Prioritize direct media server slicing (runs locally with user/streamer where chunks & recordings exist)
    const mediaCfg = await fetchMediaConfig().catch(() => null);
    let clipEndpoint = null;
    if (mediaCfg?.hlsBaseUrl) {
      clipEndpoint = `${mediaCfg.hlsBaseUrl.replace(/\/hls\/?$/, '')}/api/clip`;
    }

    const candidateEndpoints = [
      clipEndpoint,
      'https://localhost:8443/api/clip',
      'http://localhost:8080/api/clip',
      'http://127.0.0.1:8085/api/clip',
      'http://localhost:8085/api/clip'
    ].filter(Boolean);

    const endpoints = [...new Set(candidateEndpoints)];
    let sliceResult = null;

    for (const ep of endpoints) {
      try {
        console.log(`[clipApi] Attempting direct media server slice on: ${ep}`);
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25000); // 25s timeout for FFmpeg
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            streamKey: data.streamKey || '',
            recordingFileName: data.recordingFileName || null,
            isLive: data.isLive !== false,
            durationSeconds: data.durationSeconds || 60,
            title: data.title || 'Untitled Clip'
          })
        });
        clearTimeout(timer);

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

    // Direct slice produced a physical MP4 file on the media server! Register with backend
    if (sliceResult && sliceResult.clipUrl) {
      const fullClipUrl = resolveMediaUrl(sliceResult.clipUrl);
      const fullThumbUrl = sliceResult.thumbnailUrl ? resolveMediaUrl(sliceResult.thumbnailUrl) : null;
      console.log('[clipApi] Registering physical media server clip with backend API:', { fullClipUrl, fullThumbUrl });

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

    // 2. Fall back to backend slice (if backend has server-side access to media server)
    console.log('[clipApi] Direct slice not available, attempting backend slice...');
    try {
      return await apiClient('/api/Clip/slice', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      const errMsg = (err && err.message) || String(err);
      console.warn('[clipApi] Backend slice failed:', errMsg);

      // 3. Fallback: If simulated stream (e.g. YouTube embed) where no media server chunks exist
      if (data.channelId || data.liveStreamId) {
        console.log('[clipApi] Registering highlight with backend for simulated stream...');
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

      throw new Error(err.message || 'Media server is not responding to clipping requests. Please verify the streaming server is running.');
    }
  },
  getChannelClips: (channelId, page = 1, size = 20) => apiClient(`/api/Clip/channel/${channelId}?page=${page}&pageSize=${size}`),
  getTop: (count = 20) => apiClient(`/api/Clip/top?count=${count}`),
  getById: (id) => apiClient(`/api/Clip/${id}`),
  recordView: (id, sessionId) => apiClient(`/api/Clip/${id}/view${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`, { method: 'POST' }),
  delete: (id) => apiClient(`/api/Clip/${id}`, { method: 'DELETE' }),
};