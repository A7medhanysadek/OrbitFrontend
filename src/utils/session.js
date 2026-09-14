/**
 * Returns a persistent unique session/device ID for guest view deduplication.
 */
export function getSessionId() {
  try {
    let sid = localStorage.getItem('orbit_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem('orbit_session_id', sid);
    }
    return sid;
  } catch {
    return 'anon_' + Date.now();
  }
}
