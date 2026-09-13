(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();const ie="https://orbit.tryasp.net";function se(){return localStorage.getItem("orbit_access_token")}function ge(){return localStorage.getItem("orbit_refresh_token")}function he(n,e){n&&localStorage.setItem("orbit_access_token",n),e&&localStorage.setItem("orbit_refresh_token",e)}function ye(){localStorage.removeItem("orbit_access_token"),localStorage.removeItem("orbit_refresh_token"),localStorage.removeItem("orbit_user")}function Fe(n){if(!n)return[];try{const t=n.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),s=decodeURIComponent(atob(t).split("").map(r=>"%"+("00"+r.charCodeAt(0).toString(16)).slice(-2)).join("")),o=JSON.parse(s),i=o["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]||o.role||o.roles;if(Array.isArray(i))return i;if(i)return[i]}catch{}return[]}function Me(){const n=localStorage.getItem("orbit_user");try{const e=n?JSON.parse(n):null;if(e&&(!e.roles||!e.roles.length)){const t=e.accessToken||e.token||se(),s=Fe(t);s.length&&(e.roles=s)}return e}catch{return null}}function J(n){if(n){if(!n.roles||!n.roles.length){const e=n.accessToken||n.token||se(),t=Fe(e);t.length&&(n.roles=t)}localStorage.setItem("orbit_user",JSON.stringify(n))}else localStorage.removeItem("orbit_user")}async function g(n,e={}){const t=n.startsWith("http")?n:`${ie}${n}`,s=se(),o={...e.headers||{}};!(e.body instanceof FormData)&&!o["Content-Type"]&&(o["Content-Type"]="application/json"),s&&!o.Authorization&&(o.Authorization=`Bearer ${s}`);const i=await fetch(t,{...e,headers:o});if(i.status===401&&ge()&&!e._retry)try{const r=await fetch(`${ie}/api/Auth/refresh-token`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s}`},body:JSON.stringify({refreshToken:ge()})});if(r.ok){const a=await r.json();return he(a.token||a.accessToken,a.refreshToken),e._retry=!0,g(n,e)}}catch(r){console.warn("Failed to refresh token",r),ye()}if(!i.ok){let r="An error occurred";try{const l=await i.json();r=l.message||l.error||l.title||JSON.stringify(l)}catch{r=`HTTP ${i.status}: ${i.statusText}`}const a=new Error(r);throw a.status=i.status,a}if(i.status===204)return null;try{return await i.json()}catch{return null}}class et{constructor(){this.state={currentUser:Me(),currentView:Me()?"home":"splash",viewParams:{},activeStream:null,sidebarCollapsed:!1,notifications:[],modal:null,followedChannels:JSON.parse(localStorage.getItem("orbit_followed")||"[]")},this.listeners=[]}getState(){return this.state}setState(e){this.state={...this.state,...e},this.notify()}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}navigate(e,t={}){this.setState({currentView:e,viewParams:t}),window.scrollTo({top:0,behavior:"smooth"}),history.pushState({view:e,params:t},"",`#${e}`)}setCurrentUser(e){this.setState({currentUser:e})}setActiveStream(e){this.setState({activeStream:e})}toggleSidebar(){this.setState({sidebarCollapsed:!this.state.sidebarCollapsed})}openModal(e,t={}){this.setState({modal:{type:e,data:t}})}closeModal(){this.setState({modal:null})}followChannel(e,t){const s=[...this.state.followedChannels];s.find(o=>o.id===e)||(s.push({id:e,name:t}),localStorage.setItem("orbit_followed",JSON.stringify(s)),this.setState({followedChannels:s}))}unfollowChannel(e){const t=this.state.followedChannels.filter(s=>s.id!==e);localStorage.setItem("orbit_followed",JSON.stringify(t)),this.setState({followedChannels:t})}isFollowing(e){return this.state.followedChannels.some(t=>t.id===e)}showToast(e,t="info"){const s=document.getElementById("toast-container");if(s){const o=document.createElement("div");o.className=`toast ${t}`,o.innerHTML=`<span>${e}</span><button style="opacity:0.7;font-size:16px;margin-left:8px;" onclick="this.parentElement.remove()">x</button>`,s.appendChild(o),setTimeout(()=>{o.parentElement&&o.remove()},4e3)}}}const c=new et;window.addEventListener("popstate",n=>{n.state&&n.state.view&&c.setState({currentView:n.state.view,viewParams:n.state.params||{}})});const d={home:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.02 2.84l-5.39 4.2C2.73 7.74 2 9.23 2 10.36v7.41c0 2.02 1.64 3.67 3.66 3.67h12.68C20.36 21.44 22 19.79 22 17.78v-7.26c0-1.2-.81-2.74-1.8-3.45l-6.18-4.33c-1.4-.98-3.65-.93-5 .1z"/><path d="M12 17.99v-3" stroke-linecap="round"/></svg>',search:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-linecap="round"/></svg>',live:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.09 4.26A9.93 9.93 0 0 0 2 12c0 2.84 1.18 5.41 3.09 7.24M17.91 4.26A9.93 9.93 0 0 1 22 12a9.93 9.93 0 0 1-4.09 7.24M8.78 7.35A5.96 5.96 0 0 0 6 12c0 1.87.86 3.54 2.2 4.64M15.22 7.35A5.96 5.96 0 0 1 18 12c0 1.87-.86 3.54-2.2 4.64"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',bell:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.02 2.91c-3.31 0-6 2.69-6 6v2.89c0 .61-.26 1.54-.57 2.06L4.3 15.77c-.71 1.18-.22 2.49 1.08 2.93 4.31 1.44 8.96 1.44 13.27 0 1.21-.4 1.74-1.83 1.08-2.93l-1.15-1.91c-.3-.52-.56-1.45-.56-2.06V8.91c0-3.3-2.7-6-6-6z"/><path d="M13.87 3.2a6.754 6.754 0 0 0-3.7 0M9.02 19.06c0 1.65 1.35 3 3 3 .82 0 1.56-.33 2.12-.88.56-.56.88-1.3.88-2.12"/></svg>',user:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21c0-3.31-3.58-6-8-6s-8 2.69-8 6"/></svg>',settings:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.17.44.44.82.82 1.09"/></svg>',mail:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>',lock:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',eyeClosed:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.53 9.47l-5.06 5.06a3.573 3.573 0 1 1 5.06-5.06z"/><path d="M17.82 5.77C16.07 4.45 14.07 3.73 12 3.73c-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19.79 1.24 1.71 2.31 2.71 3.17"/><path d="M8.42 19.53c1.14.48 2.35.74 3.58.74 3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-.33-.52-.69-1.01-1.06-1.47"/><path d="M15.51 12.7a3.565 3.565 0 0 1-2.82 2.82"/><path d="M2 2l20 20" stroke-linecap="round"/></svg>',eyeOpen:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 16.33c2.39 0 4.33-1.94 4.33-4.33S14.39 7.67 12 7.67 7.67 9.61 7.67 12s1.94 4.33 4.33 4.33z"/><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19C18.82 5.81 15.53 3.73 12 3.73c-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.59 5.58 5.67 9.11 5.67z"/></svg>',calendar:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',userRound:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-3 3.13-6 7-6s7 3 7 6"/></svg>',chevronLeft:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>',chevronRight:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>',chevronDown:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',x:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',copy:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',refresh:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>',trash:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',edit:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',send:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',play:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',volume:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',fullscreen:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',clip:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m16 4 3 3-9.5 9.5a2.12 2.12 0 0 1-3-3L16 4z"/><path d="M12 8 8 4M3 21h4"/></svg>',follow:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',followFilled:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',shield:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',ban:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>',clock:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',chart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',key:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',monitor:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',upload:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',users:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',globe:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',video:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="15" height="16" rx="2"/><path d="m22 7-5 3.5L22 14V7z"/></svg>',logout:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',checkCircle:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00AEBD" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',star:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',grid:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',menu:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',google:'<svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>',facebook:'<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',apple:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>',rocket:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',planet:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="12" ry="4" transform="rotate(-30 12 12)"/></svg>',admin:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',emoji:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',archive:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',link:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',image:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',dollar:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',eye:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',download:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',moreH:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>'};function tt(){const n=c.getState(),e=n.currentUser,t=n.sidebarCollapsed,s=n.currentView,o=e&&e.roles&&e.roles.includes&&e.roles.includes("Admin");return!e||["splash","login","register","otp","forgot-password","reset-password"].includes(s)?"":`
    <aside class="app-sidebar ${t?"collapsed":""}" id="app-sidebar">
      <div class="sidebar-logo">
        <img src="/Orbit_logo.png" alt="Orbit" />
        <span class="logo-text">RBIT</span>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section">Menu</div>
        <a class="sidebar-link ${s==="home"?"active":""}" data-nav="home">
          <span class="nav-icon">${d.home}</span>
          <span class="nav-label">Home</span>
        </a>
        <a class="sidebar-link ${s==="categories"?"active":""}" data-nav="categories">
          <span class="nav-icon">${d.grid}</span>
          <span class="nav-label">Browse</span>
        </a>
        <a class="sidebar-link ${s==="clips"?"active":""}" data-nav="clips">
          <span class="nav-icon">${d.clip}</span>
          <span class="nav-label">Top Clips</span>
        </a>

        <div class="sidebar-section">Creator</div>
        <a class="sidebar-link ${s==="studio"?"active":""}" data-nav="studio">
          <span class="nav-icon">${d.monitor}</span>
          <span class="nav-label">Dashboard</span>
        </a>

        ${o?`
        <div class="sidebar-section">Admin</div>
        <a class="sidebar-link ${s==="admin"?"active":""}" data-nav="admin">
          <span class="nav-icon">${d.admin}</span>
          <span class="nav-label">Admin Panel</span>
        </a>
        `:""}

        <div class="sidebar-section">Following</div>
        <div class="followed-list" id="sidebar-followed">
          ${n.followedChannels.length===0?`
            <div style="padding: 8px 14px; font-size: 12px; color: var(--color-text-muted);">
              ${t?"":"No channels followed yet"}
            </div>
          `:n.followedChannels.slice(0,8).map(i=>`
            <div class="followed-item" data-channel-id="${i.id}">
              <div class="followed-avatar">
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;">${(i.name||"C")[0].toUpperCase()}</div>
              </div>
              <span class="followed-name">${i.name||"Channel"}</span>
            </div>
          `).join("")}
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user-btn">
          <div class="user-avatar">
            ${e.profilePictureUrl?`<img src="${e.profilePictureUrl}" alt="" />`:(e.fullName||e.username||"U")[0].toUpperCase()}
          </div>
          <div class="user-info">
            <div class="user-name">${e.username||e.fullName||"User"}</div>
            <div class="user-role">${o?"Admin":"Viewer"}</div>
          </div>
        </div>
      </div>

      <button class="sidebar-toggle" id="sidebar-toggle-btn">
        ${t?d.chevronRight:d.chevronLeft}
      </button>
    </aside>
  `}function nt(){const n=c.getState(),e=n.currentUser,t=n.currentView;return!e||["splash","login","register","otp","forgot-password","reset-password"].includes(t)?"":`
    <header class="app-topbar" id="app-topbar">
      <div class="topbar-left">
        <div class="search-bar" id="topbar-search">
          ${d.search}
          <input type="text" id="topbar-search-input" placeholder="Search channels, categories, clips..." />
        </div>
      </div>
      <div class="topbar-right">
        <button class="topbar-action" id="topbar-go-live" title="Go Live">
          ${d.video}
        </button>
        <button class="topbar-action" id="topbar-notifications" title="Notifications">
          ${d.bell}
        </button>
        <div class="dropdown" id="user-dropdown">
          <button class="topbar-user-btn" id="topbar-user-trigger">
            <div class="mini-avatar">
              ${e.profilePictureUrl?`<img src="${e.profilePictureUrl}" alt="" />`:(e.fullName||e.username||"U")[0].toUpperCase()}
            </div>
            <span style="font-size:13px;font-weight:500;color:#fff;">${e.username||"User"}</span>
            ${d.chevronDown}
          </button>
          <div class="dropdown-menu hidden" id="user-dropdown-menu">
            <div class="dropdown-item" data-action="profile">${d.user} Profile</div>
            <div class="dropdown-item" data-action="studio">${d.monitor} Creator Studio</div>
            <div class="dropdown-item" data-action="settings">${d.settings} Settings</div>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:4px 0;" />
            <div class="dropdown-item" data-action="logout" style="color:var(--color-error);">${d.logout} Log Out</div>
          </div>
        </div>
      </div>
    </header>
  `}function st(){document.querySelectorAll(".sidebar-link[data-nav]").forEach(r=>{r.addEventListener("click",()=>c.navigate(r.dataset.nav))}),document.querySelectorAll(".followed-item[data-channel-id]").forEach(r=>{r.addEventListener("click",()=>c.navigate("channel",{channelId:parseInt(r.dataset.channelId)}))});const n=document.getElementById("sidebar-toggle-btn");n&&n.addEventListener("click",()=>c.toggleSidebar());const e=document.getElementById("sidebar-user-btn");e&&e.addEventListener("click",()=>c.navigate("profile"));const t=document.getElementById("topbar-search-input");t&&t.addEventListener("keydown",r=>{r.key==="Enter"&&t.value.trim()&&c.navigate("search",{query:t.value.trim()})});const s=document.getElementById("topbar-go-live");s&&s.addEventListener("click",()=>c.navigate("studio"));const o=document.getElementById("topbar-user-trigger"),i=document.getElementById("user-dropdown-menu");o&&i&&(o.addEventListener("click",r=>{r.stopPropagation(),i.classList.toggle("hidden")}),document.addEventListener("click",()=>i.classList.add("hidden")),i.querySelectorAll(".dropdown-item").forEach(r=>{r.addEventListener("click",()=>{const a=r.dataset.action;a==="logout"?(ye(),J(null),c.setCurrentUser(null),c.navigate("splash"),c.showToast("Logged out successfully","info")):a==="profile"?c.navigate("profile"):a==="studio"&&c.navigate("studio"),i.classList.add("hidden")})}))}function ot(){return`
    <div class="auth-page" style="flex-direction:column;gap:0;">
      <!-- Orbit rings -->
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-200px;left:-200px;"></div>
      </div>

      <!-- Floating icons -->
      <div class="space-icon animate-float" style="top:15%;left:12%;width:32px;">${d.rocket}</div>
      <div class="space-icon animate-float-slow" style="top:20%;right:15%;width:28px;">${d.planet}</div>
      <div class="space-icon animate-float" style="bottom:25%;left:18%;width:24px;animation-delay:1s;">${d.star}</div>
      <div class="space-icon animate-float-slow" style="bottom:20%;right:20%;width:30px;animation-delay:0.5s;">${d.rocket}</div>

      <div style="position:relative;z-index:2;text-align:center;" class="animate-fade-up">
        <div class="auth-logo-group" style="justify-content:center;margin-bottom:24px;">
          <img src="/Orbit_logo.png" alt="Orbit" style="height:120px;" />
          <span class="logo-text" style="font-size:72px;">RBIT</span>
        </div>
        <p class="auth-tagline" style="font-size:24px;margin-bottom:48px;">Stream Across the Galaxy</p>

        <div style="display:flex;flex-direction:column;gap:14px;max-width:340px;margin:0 auto;">
          <button class="btn btn-primary btn-lg btn-full" id="splash-login-btn" style="font-size:17px;">
            Login
          </button>
          <button class="btn btn-secondary btn-lg btn-full" id="splash-signup-btn" style="font-size:17px;">
            Sign Up
          </button>
        </div>

        <p style="margin-top:32px;color:var(--color-text-muted);font-size:13px;">
          Enter Your Orbit!
        </p>
      </div>
    </div>
  `}function it(){var n,e;(n=document.getElementById("splash-login-btn"))==null||n.addEventListener("click",()=>c.navigate("login")),(e=document.getElementById("splash-signup-btn"))==null||e.addEventListener("click",()=>c.navigate("register"))}const oe={async register(n){return await g("/api/Auth/register",{method:"POST",body:JSON.stringify(n)})},async confirmEmail(n,e){const t=await g("/api/Auth/confirm-email",{method:"POST",body:JSON.stringify({email:n,otp_Code:e})}),s=(t==null?void 0:t.accessToken)||(t==null?void 0:t.token);return t&&s&&(he(s,t.refreshToken),J(t)),t},async login(n,e){const t=await g("/api/Auth/login",{method:"POST",body:JSON.stringify({email:n,password:e})}),s=(t==null?void 0:t.accessToken)||(t==null?void 0:t.token);return t&&s&&(he(s,t.refreshToken),J(t)),t},async refreshToken(){const n=ge(),e=se();if(!n)return null;try{const t=await fetch(`${ie}/api/Auth/refresh-token`,{method:"POST",headers:{"Content-Type":"application/json",...e?{Authorization:`Bearer ${e}`}:{}},body:JSON.stringify({refreshToken:n})});if(t.ok){const s=await t.json(),o=(s==null?void 0:s.accessToken)||(s==null?void 0:s.token);if(s&&o)return he(o,s.refreshToken),J(s),s}}catch(t){console.warn("Failed to refresh token",t)}return null},async forgotPassword(n){return await g("/api/Auth/forgot-password",{method:"POST",body:JSON.stringify({email:n})})},async resetPassword(n,e,t){return await g("/api/Auth/reset-password",{method:"POST",body:JSON.stringify({email:n,otp_Code:e,newPassword:t})})},async revokeToken(){const n=ge();if(n)try{await g("/api/Auth/revoke-token",{method:"POST",body:JSON.stringify({refreshToken:n})})}catch(e){console.warn("Revoke token error",e)}ye()}};function rt(){return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-200px;left:-200px;"></div>
      </div>
      <div class="space-icon animate-float" style="top:10%;left:8%;width:30px;">${d.rocket}</div>
      <div class="space-icon animate-float-slow" style="top:15%;right:10%;width:28px;">${d.planet}</div>
      <div class="space-icon animate-float" style="bottom:15%;right:12%;width:26px;animation-delay:0.8s;">${d.star}</div>

      <div class="auth-container animate-fade-up">
        <div class="auth-hero">
          <div class="auth-logo-group">
            <img src="/Orbit_logo.png" alt="Orbit" />
            <span class="logo-text">RBIT</span>
          </div>
          <p class="auth-tagline">Stream Across the Galaxy</p>
        </div>

        <div class="auth-form-panel">
          <h2>Stream Across the Galaxy</h2>
          <p class="auth-subtitle">Enter your registered email to receive a reset link.</p>

          <form id="login-form">
            <div class="form-group">
              <label>Email / Username</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.mail}</span>
                <input type="email" id="login-email" placeholder="example@mail.com" required />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.lock}</span>
                <input type="password" id="login-password" placeholder="Enter your password" required />
                <span class="input-toggle" id="toggle-login-pass">${d.eyeClosed}</span>
              </div>
              <div style="text-align:right;margin-top:6px;">
                <button type="button" id="login-forgot" style="font-size:12px;color:var(--color-cyan-primary);font-weight:500;">Forget Password?</button>
              </div>
            </div>

            <button type="submit" id="login-submit" class="btn btn-primary btn-full" style="margin-top:8px;">Login</button>

            <div style="text-align:center;margin:18px 0;font-size:13px;color:var(--color-space-deep);">
              Don't have an account? <button type="button" id="login-signup" style="color:var(--color-cyan-primary);font-weight:600;">Sign up</button>
            </div>

            <div class="social-divider">or continue with</div>
            <div class="social-buttons">
              <div class="social-btn">${d.google}</div>
              <div class="social-btn">${d.facebook}</div>
              <div class="social-btn">${d.apple}</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}function at(){var t,s,o;(t=document.getElementById("login-signup"))==null||t.addEventListener("click",()=>c.navigate("register")),(s=document.getElementById("login-forgot"))==null||s.addEventListener("click",()=>c.navigate("forgot-password"));const n=document.getElementById("login-password"),e=document.getElementById("toggle-login-pass");e&&n&&e.addEventListener("click",()=>{const i=n.type==="password";n.type=i?"text":"password",e.innerHTML=i?d.eyeOpen:d.eyeClosed}),(o=document.getElementById("login-form"))==null||o.addEventListener("submit",async i=>{i.preventDefault();const r=document.getElementById("login-submit"),a=document.getElementById("login-email").value.trim(),l=n.value;r.disabled=!0,r.textContent="Logging in...";try{const p=await oe.login(a,l);c.setCurrentUser(p),c.showToast("Welcome back to Orbit!","success"),c.navigate("home")}catch(p){c.showToast(p.message||"Login failed","error")}finally{r.disabled=!1,r.textContent="Login"}})}function lt(){return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
      </div>
      <div class="space-icon animate-float" style="top:12%;right:10%;width:30px;">${d.rocket}</div>
      <div class="space-icon animate-float-slow" style="bottom:18%;left:10%;width:26px;">${d.planet}</div>

      <div class="auth-container animate-fade-up">
        <div class="auth-hero">
          <div class="auth-logo-group">
            <img src="/Orbit_logo.png" alt="Orbit" />
            <span class="logo-text">RBIT</span>
          </div>
          <p class="auth-tagline">Join the Galaxy</p>
        </div>

        <div class="auth-form-panel" style="overflow-y:auto;max-height:90vh;">
          <h2>Create Account</h2>
          <p class="auth-subtitle">Start streaming across the galaxy</p>

          <form id="register-form">
            <div class="form-group">
              <label>Username</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.userRound}</span>
                <input type="text" id="reg-username" placeholder="Choose a username" required minlength="3" maxlength="50" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <div class="input-wrapper">
                  <span class="input-icon">${d.userRound}</span>
                  <input type="text" id="reg-firstname" placeholder="First name" required />
                </div>
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <div class="input-wrapper">
                  <input type="text" id="reg-lastname" placeholder="Last name" required />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Date of Birth</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.calendar}</span>
                <input type="date" id="reg-dob" required style="color:var(--color-text-dark);" />
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.mail}</span>
                <input type="email" id="reg-email" placeholder="your@email.com" required />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.lock}</span>
                <input type="password" id="reg-password" placeholder="Min 6 characters" required minlength="6" />
                <span class="input-toggle" id="toggle-reg-pass">${d.eyeClosed}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.lock}</span>
                <input type="password" id="reg-confirm" placeholder="Re-enter password" required />
              </div>
            </div>

            <button type="submit" id="reg-submit" class="btn btn-primary btn-full" style="margin-top:12px;">Sign Up</button>

            <div style="text-align:center;margin:18px 0;font-size:13px;color:var(--color-space-deep);">
              Already have an account? <button type="button" id="reg-login" style="color:var(--color-cyan-primary);font-weight:600;">Login</button>
            </div>

            <div class="social-divider">or continue with</div>
            <div class="social-buttons">
              <div class="social-btn">${d.google}</div>
              <div class="social-btn">${d.facebook}</div>
              <div class="social-btn">${d.apple}</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}function ct(){var t,s;(t=document.getElementById("reg-login"))==null||t.addEventListener("click",()=>c.navigate("login"));const n=document.getElementById("reg-password"),e=document.getElementById("toggle-reg-pass");e&&n&&e.addEventListener("click",()=>{const o=n.type==="password";n.type=o?"text":"password",e.innerHTML=o?d.eyeOpen:d.eyeClosed}),(s=document.getElementById("register-form"))==null||s.addEventListener("submit",async o=>{o.preventDefault();const i=document.getElementById("reg-submit"),r=document.getElementById("reg-password").value,a=document.getElementById("reg-confirm").value;if(r!==a){c.showToast("Passwords do not match","error");return}const l=document.getElementById("reg-dob").value,p=Math.floor((Date.now()-new Date(l).getTime())/(365.25*24*60*60*1e3));if(p<1||p>120){c.showToast("Invalid date of birth","error");return}const u=document.getElementById("reg-firstname").value.trim(),y=document.getElementById("reg-lastname").value.trim(),m={username:document.getElementById("reg-username").value.trim(),fullName:`${u} ${y}`,email:document.getElementById("reg-email").value.trim(),password:r,age:p};i.disabled=!0,i.textContent="Creating account...";try{await oe.register(m),c.showToast("Account created! Check your email for OTP code.","success"),c.navigate("otp",{email:m.email})}catch(v){c.showToast(v.message||"Registration failed","error")}finally{i.disabled=!1,i.textContent="Sign Up"}})}function dt(){var e;return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="text-align:center;flex:unset;width:100%;">
          <div style="margin-bottom:16px;">
            <img src="/Orbit_logo.png" alt="Orbit" style="height:60px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Verify Your Email</h2>
          <p class="auth-subtitle" style="text-align:center;">We sent a 6-digit code to <strong>${((e=c.getState().viewParams)==null?void 0:e.email)||""}</strong></p>

          <div class="otp-group" id="otp-group">
            <input class="otp-box" type="text" maxlength="1" data-idx="0" inputmode="numeric" autofocus />
            <input class="otp-box" type="text" maxlength="1" data-idx="1" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="2" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="3" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="4" inputmode="numeric" />
            <input class="otp-box" type="text" maxlength="1" data-idx="5" inputmode="numeric" />
          </div>

          <button id="otp-submit" class="btn btn-primary btn-full" style="margin-top:12px;">Confirm</button>

          <div style="margin-top:20px;font-size:13px;color:var(--color-text-subtle);">
            Didn't receive code? <button id="otp-resend" style="color:var(--color-cyan-primary);font-weight:600;">Resend Code</button>
          </div>
          <div style="margin-top:12px;">
            <button id="otp-back" style="color:var(--color-text-subtle);font-size:13px;">Back to Login</button>
          </div>
        </div>
      </div>
    </div>
  `}function pt(){var e,t;const n=document.querySelectorAll(".otp-box");n.forEach((s,o)=>{s.addEventListener("input",i=>{i.target.value&&o<n.length-1&&n[o+1].focus()}),s.addEventListener("keydown",i=>{i.key==="Backspace"&&!i.target.value&&o>0&&n[o-1].focus()}),s.addEventListener("paste",i=>{i.preventDefault();const r=(i.clipboardData||window.clipboardData).getData("text").trim();[...r].slice(0,6).forEach((a,l)=>{n[l]&&(n[l].value=a)}),n[Math.min(r.length,5)]&&n[Math.min(r.length,5)].focus()})}),(e=document.getElementById("otp-back"))==null||e.addEventListener("click",()=>c.navigate("login")),(t=document.getElementById("otp-submit"))==null||t.addEventListener("click",async()=>{var r;const s=document.getElementById("otp-submit"),o=[...n].map(a=>a.value).join("");if(o.length!==6){c.showToast("Please enter the full 6-digit code","error");return}const i=(r=c.getState().viewParams)==null?void 0:r.email;if(!i){c.showToast("Email not found. Please register again.","error");return}s.disabled=!0,s.textContent="Verifying...";try{const a=await oe.confirmEmail(i,o);c.setCurrentUser(a),c.showToast("Email verified! Welcome to Orbit!","success"),c.navigate("home")}catch(a){c.showToast(a.message||"Verification failed","error")}finally{s.disabled=!1,s.textContent="Confirm"}})}function ht(){return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="flex:unset;width:100%;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="/Orbit_logo.png" alt="Orbit" style="height:50px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Forgot Password</h2>
          <p class="auth-subtitle" style="text-align:center;">Enter your email to receive a reset code</p>
          <form id="forgot-form">
            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.mail}</span>
                <input type="email" id="forgot-email" placeholder="your@email.com" required />
              </div>
            </div>
            <button type="submit" id="forgot-submit" class="btn btn-primary btn-full">Get Code</button>
            <div style="text-align:center;margin-top:16px;">
              <button type="button" id="forgot-back" class="btn btn-ghost btn-full">Back to Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}function ut(){var n,e;(n=document.getElementById("forgot-back"))==null||n.addEventListener("click",()=>c.navigate("login")),(e=document.getElementById("forgot-form"))==null||e.addEventListener("submit",async t=>{t.preventDefault();const s=document.getElementById("forgot-submit"),o=document.getElementById("forgot-email").value.trim();s.disabled=!0,s.textContent="Sending...";try{await oe.forgotPassword(o),c.showToast("Reset code sent! Check your email.","success"),c.navigate("reset-password",{email:o})}catch(i){c.showToast(i.message||"Failed to send code","error")}finally{s.disabled=!1,s.textContent="Get Code"}})}function gt(){var e;const n=((e=c.getState().viewParams)==null?void 0:e.email)||"";return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="flex:unset;width:100%;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="/Orbit_logo.png" alt="Orbit" style="height:50px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Reset Password</h2>
          <p class="auth-subtitle" style="text-align:center;">Enter the OTP code and your new password</p>
          <form id="reset-form">
            <div class="form-group">
              <label>OTP Code</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.key}</span>
                <input type="text" id="reset-otp" placeholder="Enter the 6-digit code" required />
              </div>
            </div>
            <div class="form-group">
              <label>New Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.lock}</span>
                <input type="password" id="reset-pass" placeholder="Min 6 characters" required minlength="6" />
              </div>
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${d.lock}</span>
                <input type="password" id="reset-confirm" placeholder="Re-enter password" required />
              </div>
            </div>
            <input type="hidden" id="reset-email" value="${n}" />
            <button type="submit" id="reset-submit" class="btn btn-primary btn-full">Confirm</button>
            <div style="text-align:center;margin-top:16px;">
              <button type="button" id="reset-back" class="btn btn-ghost btn-full">Back to Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}function mt(){var n,e;(n=document.getElementById("reset-back"))==null||n.addEventListener("click",()=>c.navigate("login")),(e=document.getElementById("reset-form"))==null||e.addEventListener("submit",async t=>{t.preventDefault();const s=document.getElementById("reset-submit"),o=document.getElementById("reset-pass").value,i=document.getElementById("reset-confirm").value;if(o!==i){c.showToast("Passwords do not match","error");return}const r=document.getElementById("reset-email").value,a=document.getElementById("reset-otp").value.trim();s.disabled=!0,s.textContent="Resetting...";try{await oe.resetPassword(r,a,o),c.showToast("Password reset successful! Please log in.","success"),c.navigate("login")}catch(l){c.showToast(l.message||"Reset failed","error")}finally{s.disabled=!1,s.textContent="Confirm"}})}const Z={getLiveStreams:()=>g("/api/Stream/live"),getStreamById:n=>g(`/api/Stream/${n}`),createStream:n=>g("/api/Stream/create",{method:"POST",body:JSON.stringify(n)}),updateCurrentStream:n=>g("/api/Stream/current",{method:"PATCH",body:JSON.stringify(n)}),endStream:()=>g("/api/Stream/end",{method:"POST"}),generateStreamKey:()=>g("/api/Stream/key/generate",{method:"POST"}),getStreamKey:()=>g("/api/Stream/key"),setMediaServerUrl:n=>g("/api/Stream/server/set-url",{method:"POST",body:JSON.stringify(n)}),clearMediaServerUrl:()=>g("/api/Stream/server/clear-url",{method:"POST"}),getMediaServerConfig:()=>g("/api/Stream/server/config")},I={getAll:()=>g("/api/Category"),getTop:(n=10)=>g(`/api/Category/top?count=${n}`),search:n=>g(`/api/Category/search?q=${encodeURIComponent(n)}`),getBySlug:n=>g(`/api/Category/${n}`),getStreams:n=>g(`/api/Category/${n}/streams`),getClips:(n,e=20)=>g(`/api/Category/${n}/clips?count=${e}`),create:n=>g("/api/Category",{method:"POST",body:JSON.stringify(n)}),update:(n,e)=>g(`/api/Category/${n}`,{method:"PUT",body:JSON.stringify(e)}),delete:n=>g(`/api/Category/${n}`,{method:"DELETE"}),uploadImage:(n,e)=>{const t=new FormData;return t.append("file",e),g(`/api/Category/${n}/image`,{method:"POST",body:t})}};let R=null;function vt(){return`
    <div>
      <!-- Hero Banner -->
      <div style="background:var(--bg-gradient-card);border-radius:var(--radius-card);padding:40px;margin-bottom:28px;position:relative;overflow:hidden;border:1px solid rgba(0,174,189,0.12);">
        <div style="position:absolute;top:-40px;right:-20px;opacity:0.08;font-size:180px;">&#127756;</div>
        <h1 style="font-family:var(--font-display);font-size:28px;color:var(--color-cyan-neon);margin-bottom:8px;">Welcome to Orbit</h1>
        <p style="color:var(--color-text-muted);font-size:15px;margin-bottom:20px;max-width:500px;">Discover live broadcasts from across the galaxy. Watch, chat, and connect with your favorite streamers.</p>
        <div style="display:flex;gap:12px;">
          <button id="hero-studio-btn" class="btn btn-cyan btn-sm">${d.rocket} Creator Studio</button>
          <button id="hero-explore-btn" class="btn btn-outline btn-sm">${d.grid} Browse Categories</button>
        </div>
      </div>

      <!-- Category Pills -->
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:24px;" id="home-cat-pills">
        <button class="cat-pill active" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:var(--color-cyan-primary);color:#000;border:none;cursor:pointer;flex-shrink:0;">All Channels</button>
      </div>

      <!-- Top Categories -->
      <div style="margin-bottom:32px;">
        <div class="section-title">${d.star} Top Categories</div>
        <div class="categories-grid" id="home-top-categories">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Live Broadcasts -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <div class="section-title" style="margin-bottom:0;"><span style="color:var(--color-live-red);">&#9679;</span> Live Broadcasts</div>
          <button id="refresh-streams" class="btn btn-ghost btn-sm">${d.refresh} Refresh</button>
        </div>
        <div class="streams-grid" id="home-streams-grid">
          <div class="spinner" style="grid-column:1/-1;"></div>
        </div>
      </div>
    </div>
  `}function ft(){var s,o,i;(s=document.getElementById("hero-studio-btn"))==null||s.addEventListener("click",()=>c.navigate("studio")),(o=document.getElementById("hero-explore-btn"))==null||o.addEventListener("click",()=>c.navigate("categories")),(i=document.getElementById("refresh-streams"))==null||i.addEventListener("click",()=>t()),e(),n(),t();async function n(){const r=document.getElementById("home-top-categories");if(r)try{const a=await I.getTop(8);if(!(a!=null&&a.length)){r.innerHTML='<p class="text-muted" style="grid-column:1/-1;">No categories available</p>';return}r.innerHTML=a.map((l,p)=>`
        <div class="card category-card hover-lift stagger-item" data-slug="${l.slug}">
          <div class="cat-thumb">
            ${l.imageUrl?`<img src="${l.imageUrl}" alt="${l.name}" />`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">&#127918;</div>'}
          </div>
          <div class="cat-info">
            <div class="cat-name">${l.name}</div>
            <div class="cat-viewers">${l.totalViewers||0} viewers &middot; ${l.liveStreamCount||0} live</div>
          </div>
        </div>
      `).join(""),r.querySelectorAll(".category-card").forEach(l=>{l.addEventListener("click",()=>c.navigate("category-detail",{slug:l.dataset.slug}))})}catch{r.innerHTML='<p class="text-muted" style="grid-column:1/-1;">Failed to load categories</p>'}}async function e(){const r=document.getElementById("home-cat-pills");if(r)try{const a=await I.getAll();if(!(a!=null&&a.length))return;r.innerHTML=`
        <button class="cat-pill ${R?"":"active"}" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:${R?"var(--color-space-slate)":"var(--color-cyan-primary)"};color:${R?"#fff":"#000"};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">All</button>
        ${a.map(l=>`<button class="cat-pill ${R===l.slug?"active":""}" data-slug="${l.slug}" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:500;background:${R===l.slug?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${R===l.slug?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">${l.name}</button>`).join("")}
      `,r.querySelectorAll(".cat-pill").forEach(l=>{l.addEventListener("click",()=>{R=l.dataset.slug==="all"?null:l.dataset.slug,e(),t()})})}catch{}}async function t(){var a;const r=document.getElementById("home-streams-grid");if(r){r.innerHTML='<div class="spinner" style="grid-column:1/-1;"></div>';try{let l;if(R?l=await I.getStreams(R):l=await Z.getLiveStreams(),!(l!=null&&l.length)){r.innerHTML=`
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-icon">&#128752;</div>
            <h3>No Active Broadcasts</h3>
            <p>No channels are live right now. Be the first to stream!</p>
            <button id="empty-go-live" class="btn btn-cyan btn-sm">${d.rocket} Launch Creator Studio</button>
          </div>`,(a=document.getElementById("empty-go-live"))==null||a.addEventListener("click",()=>c.navigate("studio"));return}r.innerHTML=l.map((p,u)=>`
        <div class="card stream-card hover-lift stagger-item" data-sid="${p.id}">
          <div class="stream-thumb">
            <img src="${p.thumbnailUrl||"/cosmic_orbit_banner.png"}" alt="${p.title}" />
            <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;">
              <span class="badge-live">LIVE</span>
              <span class="badge-viewers">${d.eye} ${p.viewerCount||0}</span>
            </div>
            ${p.categoryName?`<span class="badge-category" style="position:absolute;top:10px;right:10px;">${p.categoryName}</span>`:""}
          </div>
          <div class="stream-info">
            <div class="streamer-row">
              <div class="streamer-avatar">${p.profilePictureUrl?`<img src="${p.profilePictureUrl}" />`:(p.streamerName||"S")[0].toUpperCase()}</div>
              <div style="flex:1;overflow:hidden;">
                <div class="streamer-name">${p.streamerName||"Streamer"} ${d.checkCircle}</div>
                <div style="font-size:12px;color:var(--color-cyan-primary);">${p.categoryName||"General"}</div>
              </div>
            </div>
            <div class="stream-title">${p.title||"Untitled Stream"}</div>
          </div>
        </div>
      `).join(""),r.querySelectorAll(".stream-card").forEach(p=>{p.addEventListener("click",()=>{const u=parseInt(p.dataset.sid),y=l.find(m=>m.id===u);y&&(c.setActiveStream(y),c.navigate("watch",{streamId:u}))})})}catch{r.innerHTML='<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load streams</p>'}}}}const yt="modulepreload",bt=function(n,e){return new URL(n,e).href},Be={},wt=function(e,t,s){let o=Promise.resolve();if(t&&t.length>0){const r=document.getElementsByTagName("link"),a=document.querySelector("meta[property=csp-nonce]"),l=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));o=Promise.allSettled(t.map(p=>{if(p=bt(p,s),p in Be)return;Be[p]=!0;const u=p.endsWith(".css"),y=u?'[rel="stylesheet"]':"";if(!!s)for(let k=r.length-1;k>=0;k--){const O=r[k];if(O.href===p&&(!u||O.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${p}"]${y}`))return;const v=document.createElement("link");if(v.rel=u?"stylesheet":yt,u||(v.as="script"),v.crossOrigin="",v.href=p,l&&v.setAttribute("nonce",l),document.head.appendChild(v),u)return new Promise((k,O)=>{v.addEventListener("load",k),v.addEventListener("error",()=>O(new Error(`Unable to preload CSS for ${p}`)))})}))}function i(r){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=r,window.dispatchEvent(a),!a.defaultPrevented)throw r}return o.then(r=>{for(const a of r||[])a.status==="rejected"&&i(a.reason);return e().catch(i)})},P={create:n=>g("/api/Channel/create",{method:"POST",body:JSON.stringify(n)}),getMyChannel:()=>g("/api/Channel/me"),getById:n=>g(`/api/Channel/${n}`),updateProfile:n=>g("/api/Channel/profile",{method:"PUT",body:JSON.stringify(n)}),uploadPhoto:n=>{const e=new FormData;return e.append("file",n),g("/api/Channel/photo",{method:"POST",body:e})},uploadCover:n=>{const e=new FormData;return e.append("file",n),g("/api/Channel/cover",{method:"POST",body:e})},getSocialLinks:n=>g(`/api/Channel/${n}/social-links`),updateSocialLinks:n=>g("/api/Channel/social-links",{method:"PUT",body:JSON.stringify(n)}),hireModerator:n=>g("/api/Channel/moderators/hire",{method:"POST",body:JSON.stringify({username:n})}),removeModerator:n=>g(`/api/Channel/moderators/${n}`,{method:"DELETE"}),getModerators:()=>g("/api/Channel/moderators"),toggleSaveStreams:n=>g("/api/Channel/save-streams",{method:"PUT",body:JSON.stringify({saveStreams:n})}),search:n=>g(`/api/Channel/search?q=${encodeURIComponent(n)}`)},te={slice:n=>g("/api/Clip/slice",{method:"POST",body:JSON.stringify(n)}),getChannelClips:(n,e=1,t=20)=>g(`/api/Clip/channel/${n}?page=${e}&pageSize=${t}`),getTop:(n=20)=>g(`/api/Clip/top?count=${n}`),getById:n=>g(`/api/Clip/${n}`),recordView:n=>g(`/api/Clip/${n}/view`,{method:"POST"}),delete:n=>g(`/api/Clip/${n}`,{method:"DELETE"})};class K extends Error{constructor(e,t){const s=new.target.prototype;super(`${e}: Status code '${t}'`),this.statusCode=t,this.__proto__=s}}class Te extends Error{constructor(e="A timeout occurred."){const t=new.target.prototype;super(e),this.__proto__=t}}class N extends Error{constructor(e="An abort occurred."){const t=new.target.prototype;super(e),this.__proto__=t}}class xt extends Error{constructor(e,t){const s=new.target.prototype;super(e),this.transport=t,this.errorType="UnsupportedTransportError",this.__proto__=s}}class _t extends Error{constructor(e,t){const s=new.target.prototype;super(e),this.transport=t,this.errorType="DisabledTransportError",this.__proto__=s}}class Ct extends Error{constructor(e,t){const s=new.target.prototype;super(e),this.transport=t,this.errorType="FailedToStartTransportError",this.__proto__=s}}class Pe extends Error{constructor(e){const t=new.target.prototype;super(e),this.errorType="FailedToNegotiateWithServerError",this.__proto__=t}}class St extends Error{constructor(e,t){const s=new.target.prototype;super(e),this.innerErrors=t,this.__proto__=s}}class qe{constructor(e,t,s){this.statusCode=e,this.statusText=t,this.content=s}}class be{get(e,t){return this.send({...t,method:"GET",url:e})}post(e,t){return this.send({...t,method:"POST",url:e})}delete(e,t){return this.send({...t,method:"DELETE",url:e})}getCookieString(e){return""}}var h;(function(n){n[n.Trace=0]="Trace",n[n.Debug=1]="Debug",n[n.Information=2]="Information",n[n.Warning=3]="Warning",n[n.Error=4]="Error",n[n.Critical=5]="Critical",n[n.None=6]="None"})(h||(h={}));class re{constructor(){}log(e,t){}}re.instance=new re;const kt="8.0.29";class S{static isRequired(e,t){if(e==null)throw new Error(`The '${t}' argument is required.`)}static isNotEmpty(e,t){if(!e||e.match(/^\s*$/))throw new Error(`The '${t}' argument should not be empty.`)}static isIn(e,t,s){if(!(e in t))throw new Error(`Unknown ${s} value: ${e}.`)}}class _{static get isBrowser(){return!_.isNode&&typeof window=="object"&&typeof window.document=="object"}static get isWebWorker(){return!_.isNode&&typeof self=="object"&&"importScripts"in self}static get isReactNative(){return!_.isNode&&typeof window=="object"&&typeof window.document>"u"}static get isNode(){return typeof process<"u"&&process.release&&process.release.name==="node"}}function ae(n,e){let t="";return X(n)?(t=`Binary data of length ${n.byteLength}`,e&&(t+=`. Content: '${$t(n)}'`)):typeof n=="string"&&(t=`String data of length ${n.length}`,e&&(t+=`. Content: '${n}'`)),t}function $t(n){const e=new Uint8Array(n);let t="";return e.forEach(s=>{const o=s<16?"0":"";t+=`0x${o}${s.toString(16)} `}),t.substr(0,t.length-1)}function X(n){return n&&typeof ArrayBuffer<"u"&&(n instanceof ArrayBuffer||n.constructor&&n.constructor.name==="ArrayBuffer")}async function Ve(n,e,t,s,o,i){const r={},[a,l]=ne();r[a]=l,n.log(h.Trace,`(${e} transport) sending data. ${ae(o,i.logMessageContent)}.`);const p=X(o)?"arraybuffer":"text",u=await t.post(s,{content:o,headers:{...r,...i.headers},responseType:p,timeout:i.timeout,withCredentials:i.withCredentials});n.log(h.Trace,`(${e} transport) request complete. Response status: ${u.statusCode}.`)}function Et(n){return n===void 0?new me(h.Information):n===null?re.instance:n.log!==void 0?n:new me(n)}class Tt{constructor(e,t){this._subject=e,this._observer=t}dispose(){const e=this._subject.observers.indexOf(this._observer);e>-1&&this._subject.observers.splice(e,1),this._subject.observers.length===0&&this._subject.cancelCallback&&this._subject.cancelCallback().catch(t=>{})}}class me{constructor(e){this._minLevel=e,this.out=console}log(e,t){if(e>=this._minLevel){const s=`[${new Date().toISOString()}] ${h[e]}: ${t}`;switch(e){case h.Critical:case h.Error:this.out.error(s);break;case h.Warning:this.out.warn(s);break;case h.Information:this.out.info(s);break;default:this.out.log(s);break}}}}function ne(){let n="X-SignalR-User-Agent";return _.isNode&&(n="User-Agent"),[n,It(kt,Lt(),Bt(),Mt())]}function It(n,e,t,s){let o="Microsoft SignalR/";const i=n.split(".");return o+=`${i[0]}.${i[1]}`,o+=` (${n}; `,e&&e!==""?o+=`${e}; `:o+="Unknown OS; ",o+=`${t}`,s?o+=`; ${s}`:o+="; Unknown Runtime Version",o+=")",o}function Lt(){if(_.isNode)switch(process.platform){case"win32":return"Windows NT";case"darwin":return"macOS";case"linux":return"Linux";default:return process.platform}else return""}function Mt(){if(_.isNode)return process.versions.node}function Bt(){return _.isNode?"NodeJS":"Browser"}function _e(n){return n.stack?n.stack:n.message?n.message:`${n}`}function Pt(){if(typeof globalThis<"u")return globalThis;if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("could not find global")}class At extends be{constructor(e){if(super(),this._logger=e,typeof fetch>"u"||_.isNode){const t=typeof __webpack_require__=="function"?__non_webpack_require__:require;this._jar=new(t("tough-cookie")).CookieJar,typeof fetch>"u"?this._fetchType=t("node-fetch"):this._fetchType=fetch,this._fetchType=t("fetch-cookie")(this._fetchType,this._jar)}else this._fetchType=fetch.bind(Pt());if(typeof AbortController>"u"){const t=typeof __webpack_require__=="function"?__non_webpack_require__:require;this._abortControllerType=t("abort-controller")}else this._abortControllerType=AbortController}async send(e){if(e.abortSignal&&e.abortSignal.aborted)throw new N;if(!e.method)throw new Error("No method defined.");if(!e.url)throw new Error("No url defined.");const t=new this._abortControllerType;let s;e.abortSignal&&(e.abortSignal.onabort=()=>{t.abort(),s=new N});let o=null;if(e.timeout){const l=e.timeout;o=setTimeout(()=>{t.abort(),this._logger.log(h.Warning,"Timeout from HTTP request."),s=new Te},l)}e.content===""&&(e.content=void 0),e.content&&(e.headers=e.headers||{},X(e.content)?e.headers["Content-Type"]="application/octet-stream":e.headers["Content-Type"]="text/plain;charset=UTF-8");let i;try{i=await this._fetchType(e.url,{body:e.content,cache:"no-cache",credentials:e.withCredentials===!0?"include":"same-origin",headers:{"X-Requested-With":"XMLHttpRequest",...e.headers},method:e.method,mode:"cors",redirect:"follow",signal:t.signal})}catch(l){throw s||(this._logger.log(h.Warning,`Error from HTTP request. ${l}.`),l)}finally{o&&clearTimeout(o),e.abortSignal&&(e.abortSignal.onabort=null)}if(!i.ok){const l=await Ae(i,"text");throw new K(l||i.statusText,i.status)}const a=await Ae(i,e.responseType);return new qe(i.status,i.statusText,a)}getCookieString(e){let t="";return _.isNode&&this._jar&&this._jar.getCookies(e,(s,o)=>t=o.join("; ")),t}}function Ae(n,e){let t;switch(e){case"arraybuffer":t=n.arrayBuffer();break;case"text":t=n.text();break;case"blob":case"document":case"json":throw new Error(`${e} is not supported.`);default:t=n.text();break}return t}class Ut extends be{constructor(e){super(),this._logger=e}send(e){return e.abortSignal&&e.abortSignal.aborted?Promise.reject(new N):e.method?e.url?new Promise((t,s)=>{const o=new XMLHttpRequest;o.open(e.method,e.url,!0),o.withCredentials=e.withCredentials===void 0?!0:e.withCredentials,o.setRequestHeader("X-Requested-With","XMLHttpRequest"),e.content===""&&(e.content=void 0),e.content&&(X(e.content)?o.setRequestHeader("Content-Type","application/octet-stream"):o.setRequestHeader("Content-Type","text/plain;charset=UTF-8"));const i=e.headers;i&&Object.keys(i).forEach(r=>{o.setRequestHeader(r,i[r])}),e.responseType&&(o.responseType=e.responseType),e.abortSignal&&(e.abortSignal.onabort=()=>{o.abort(),s(new N)}),e.timeout&&(o.timeout=e.timeout),o.onload=()=>{e.abortSignal&&(e.abortSignal.onabort=null),o.status>=200&&o.status<300?t(new qe(o.status,o.statusText,o.response||o.responseText)):s(new K(o.response||o.responseText||o.statusText,o.status))},o.onerror=()=>{this._logger.log(h.Warning,`Error from HTTP request. ${o.status}: ${o.statusText}.`),s(new K(o.statusText,o.status))},o.ontimeout=()=>{this._logger.log(h.Warning,"Timeout from HTTP request."),s(new Te)},o.send(e.content)}):Promise.reject(new Error("No url defined.")):Promise.reject(new Error("No method defined."))}}class Nt extends be{constructor(e){if(super(),typeof fetch<"u"||_.isNode)this._httpClient=new At(e);else if(typeof XMLHttpRequest<"u")this._httpClient=new Ut(e);else throw new Error("No usable HttpClient found.")}send(e){return e.abortSignal&&e.abortSignal.aborted?Promise.reject(new N):e.method?e.url?this._httpClient.send(e):Promise.reject(new Error("No url defined.")):Promise.reject(new Error("No method defined."))}getCookieString(e){return this._httpClient.getCookieString(e)}}class L{static write(e){return`${e}${L.RecordSeparator}`}static parse(e){if(e[e.length-1]!==L.RecordSeparator)throw new Error("Message is incomplete.");const t=e.split(L.RecordSeparator);return t.pop(),t}}L.RecordSeparatorCode=30;L.RecordSeparator=String.fromCharCode(L.RecordSeparatorCode);class Rt{writeHandshakeRequest(e){return L.write(JSON.stringify(e))}parseHandshakeResponse(e){let t,s;if(X(e)){const a=new Uint8Array(e),l=a.indexOf(L.RecordSeparatorCode);if(l===-1)throw new Error("Message is incomplete.");const p=l+1;t=String.fromCharCode.apply(null,Array.prototype.slice.call(a.slice(0,p))),s=a.byteLength>p?a.slice(p).buffer:null}else{const a=e,l=a.indexOf(L.RecordSeparator);if(l===-1)throw new Error("Message is incomplete.");const p=l+1;t=a.substring(0,p),s=a.length>p?a.substring(p):null}const o=L.parse(t),i=JSON.parse(o[0]);if(i.type)throw new Error("Expected a handshake response from the server.");return[s,i]}}var f;(function(n){n[n.Invocation=1]="Invocation",n[n.StreamItem=2]="StreamItem",n[n.Completion=3]="Completion",n[n.StreamInvocation=4]="StreamInvocation",n[n.CancelInvocation=5]="CancelInvocation",n[n.Ping=6]="Ping",n[n.Close=7]="Close",n[n.Ack=8]="Ack",n[n.Sequence=9]="Sequence"})(f||(f={}));class Dt{constructor(){this.observers=[]}next(e){for(const t of this.observers)t.next(e)}error(e){for(const t of this.observers)t.error&&t.error(e)}complete(){for(const e of this.observers)e.complete&&e.complete()}subscribe(e){return this.observers.push(e),new Tt(this,e)}}class Ht{constructor(e,t,s){this._bufferSize=1e5,this._messages=[],this._totalMessageCount=0,this._waitForSequenceMessage=!1,this._nextReceivingSequenceId=1,this._latestReceivedSequenceId=0,this._bufferedByteCount=0,this._reconnectInProgress=!1,this._protocol=e,this._connection=t,this._bufferSize=s}async _send(e){const t=this._protocol.writeMessage(e);let s=Promise.resolve();if(this._isInvocationMessage(e)){this._totalMessageCount++;let o=()=>{},i=()=>{};X(t)?this._bufferedByteCount+=t.byteLength:this._bufferedByteCount+=t.length,this._bufferedByteCount>=this._bufferSize&&(s=new Promise((r,a)=>{o=r,i=a})),this._messages.push(new zt(t,this._totalMessageCount,o,i))}try{this._reconnectInProgress||await this._connection.send(t)}catch{this._disconnected()}await s}_ack(e){let t=-1;for(let s=0;s<this._messages.length;s++){const o=this._messages[s];if(o._id<=e.sequenceId)t=s,X(o._message)?this._bufferedByteCount-=o._message.byteLength:this._bufferedByteCount-=o._message.length,o._resolver();else if(this._bufferedByteCount<this._bufferSize)o._resolver();else break}t!==-1&&(this._messages=this._messages.slice(t+1))}_shouldProcessMessage(e){if(this._waitForSequenceMessage)return e.type!==f.Sequence?!1:(this._waitForSequenceMessage=!1,!0);if(!this._isInvocationMessage(e))return!0;const t=this._nextReceivingSequenceId;return this._nextReceivingSequenceId++,t<=this._latestReceivedSequenceId?(t===this._latestReceivedSequenceId&&this._ackTimer(),!1):(this._latestReceivedSequenceId=t,this._ackTimer(),!0)}_resetSequence(e){if(e.sequenceId>this._nextReceivingSequenceId){this._connection.stop(new Error("Sequence ID greater than amount of messages we've received."));return}this._nextReceivingSequenceId=e.sequenceId}_disconnected(){this._reconnectInProgress=!0,this._waitForSequenceMessage=!0}async _resend(){const e=this._messages.length!==0?this._messages[0]._id:this._totalMessageCount+1;await this._connection.send(this._protocol.writeMessage({type:f.Sequence,sequenceId:e}));const t=this._messages;for(const s of t)await this._connection.send(s._message);this._reconnectInProgress=!1}_dispose(e){e??(e=new Error("Unable to reconnect to server."));for(const t of this._messages)t._rejector(e)}_isInvocationMessage(e){switch(e.type){case f.Invocation:case f.StreamItem:case f.Completion:case f.StreamInvocation:case f.CancelInvocation:return!0;case f.Close:case f.Sequence:case f.Ping:case f.Ack:return!1}}_ackTimer(){this._ackTimerHandle===void 0&&(this._ackTimerHandle=setTimeout(async()=>{try{this._reconnectInProgress||await this._connection.send(this._protocol.writeMessage({type:f.Ack,sequenceId:this._latestReceivedSequenceId}))}catch{}clearTimeout(this._ackTimerHandle),this._ackTimerHandle=void 0},1e3))}}class zt{constructor(e,t,s,o){this._message=e,this._id=t,this._resolver=s,this._rejector=o}}const Ot=30*1e3,jt=15*1e3,Ft=1e5;var x;(function(n){n.Disconnected="Disconnected",n.Connecting="Connecting",n.Connected="Connected",n.Disconnecting="Disconnecting",n.Reconnecting="Reconnecting"})(x||(x={}));class Ie{static create(e,t,s,o,i,r,a){return new Ie(e,t,s,o,i,r,a)}constructor(e,t,s,o,i,r,a){this._nextKeepAlive=0,this._freezeEventListener=()=>{this._logger.log(h.Warning,"The page is being frozen, this will likely lead to the connection being closed and messages being lost. For more information see the docs at https://learn.microsoft.com/aspnet/core/signalr/javascript-client#bsleep")},S.isRequired(e,"connection"),S.isRequired(t,"logger"),S.isRequired(s,"protocol"),this.serverTimeoutInMilliseconds=i??Ot,this.keepAliveIntervalInMilliseconds=r??jt,this._statefulReconnectBufferSize=a??Ft,this._logger=t,this._protocol=s,this.connection=e,this._reconnectPolicy=o,this._handshakeProtocol=new Rt,this.connection.onreceive=l=>this._processIncomingData(l),this.connection.onclose=l=>this._connectionClosed(l),this._callbacks={},this._methods={},this._closedCallbacks=[],this._reconnectingCallbacks=[],this._reconnectedCallbacks=[],this._invocationId=0,this._receivedHandshakeResponse=!1,this._connectionState=x.Disconnected,this._connectionStarted=!1,this._cachedPingMessage=this._protocol.writeMessage({type:f.Ping})}get state(){return this._connectionState}get connectionId(){return this.connection&&this.connection.connectionId||null}get baseUrl(){return this.connection.baseUrl||""}set baseUrl(e){if(this._connectionState!==x.Disconnected&&this._connectionState!==x.Reconnecting)throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");if(!e)throw new Error("The HubConnection url must be a valid url.");this.connection.baseUrl=e}start(){return this._startPromise=this._startWithStateTransitions(),this._startPromise}async _startWithStateTransitions(){if(this._connectionState!==x.Disconnected)return Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));this._connectionState=x.Connecting,this._logger.log(h.Debug,"Starting HubConnection.");try{await this._startInternal(),_.isBrowser&&window.document.addEventListener("freeze",this._freezeEventListener),this._connectionState=x.Connected,this._connectionStarted=!0,this._logger.log(h.Debug,"HubConnection connected successfully.")}catch(e){return this._connectionState=x.Disconnected,this._logger.log(h.Debug,`HubConnection failed to start successfully because of error '${e}'.`),Promise.reject(e)}}async _startInternal(){this._stopDuringStartError=void 0,this._receivedHandshakeResponse=!1;const e=new Promise((t,s)=>{this._handshakeResolver=t,this._handshakeRejecter=s});await this.connection.start(this._protocol.transferFormat);try{let t=this._protocol.version;this.connection.features.reconnect||(t=1);const s={protocol:this._protocol.name,version:t};if(this._logger.log(h.Debug,"Sending handshake request."),await this._sendMessage(this._handshakeProtocol.writeHandshakeRequest(s)),this._logger.log(h.Information,`Using HubProtocol '${this._protocol.name}'.`),this._cleanupTimeout(),this._resetTimeoutPeriod(),this._resetKeepAliveInterval(),await e,this._stopDuringStartError)throw this._stopDuringStartError;(this.connection.features.reconnect||!1)&&(this._messageBuffer=new Ht(this._protocol,this.connection,this._statefulReconnectBufferSize),this.connection.features.disconnected=this._messageBuffer._disconnected.bind(this._messageBuffer),this.connection.features.resend=()=>{if(this._messageBuffer)return this._messageBuffer._resend()}),this.connection.features.inherentKeepAlive||await this._sendMessage(this._cachedPingMessage)}catch(t){throw this._logger.log(h.Debug,`Hub handshake failed with error '${t}' during start(). Stopping HubConnection.`),this._cleanupTimeout(),this._cleanupPingTimer(),await this.connection.stop(t),t}}async stop(){const e=this._startPromise;this.connection.features.reconnect=!1,this._stopPromise=this._stopInternal(),await this._stopPromise;try{await e}catch{}}_stopInternal(e){if(this._connectionState===x.Disconnected)return this._logger.log(h.Debug,`Call to HubConnection.stop(${e}) ignored because it is already in the disconnected state.`),Promise.resolve();if(this._connectionState===x.Disconnecting)return this._logger.log(h.Debug,`Call to HttpConnection.stop(${e}) ignored because the connection is already in the disconnecting state.`),this._stopPromise;const t=this._connectionState;return this._connectionState=x.Disconnecting,this._logger.log(h.Debug,"Stopping HubConnection."),this._reconnectDelayHandle?(this._logger.log(h.Debug,"Connection stopped during reconnect delay. Done reconnecting."),clearTimeout(this._reconnectDelayHandle),this._reconnectDelayHandle=void 0,this._completeClose(),Promise.resolve()):(t===x.Connected&&this._sendCloseMessage(),this._cleanupTimeout(),this._cleanupPingTimer(),this._stopDuringStartError=e||new N("The connection was stopped before the hub handshake could complete."),this.connection.stop(e))}async _sendCloseMessage(){try{await this._sendWithProtocol(this._createCloseMessage())}catch{}}stream(e,...t){const[s,o]=this._replaceStreamingParams(t),i=this._createStreamInvocation(e,t,o);let r;const a=new Dt;return a.cancelCallback=()=>{const l=this._createCancelInvocation(i.invocationId);return delete this._callbacks[i.invocationId],r.then(()=>this._sendWithProtocol(l))},this._callbacks[i.invocationId]=(l,p)=>{if(p){a.error(p);return}else l&&(l.type===f.Completion?l.error?a.error(new Error(l.error)):a.complete():a.next(l.item))},r=this._sendWithProtocol(i).catch(l=>{a.error(l),delete this._callbacks[i.invocationId]}),this._launchStreams(s,r),a}_sendMessage(e){return this._resetKeepAliveInterval(),this.connection.send(e)}_sendWithProtocol(e){return this._messageBuffer?this._messageBuffer._send(e):this._sendMessage(this._protocol.writeMessage(e))}send(e,...t){const[s,o]=this._replaceStreamingParams(t),i=this._sendWithProtocol(this._createInvocation(e,t,!0,o));return this._launchStreams(s,i),i}invoke(e,...t){const[s,o]=this._replaceStreamingParams(t),i=this._createInvocation(e,t,!1,o);return new Promise((a,l)=>{this._callbacks[i.invocationId]=(u,y)=>{if(y){l(y);return}else u&&(u.type===f.Completion?u.error?l(new Error(u.error)):a(u.result):l(new Error(`Unexpected message type: ${u.type}`)))};const p=this._sendWithProtocol(i).catch(u=>{l(u),delete this._callbacks[i.invocationId]});this._launchStreams(s,p)})}on(e,t){!e||!t||(e=e.toLowerCase(),this._methods[e]||(this._methods[e]=[]),this._methods[e].indexOf(t)===-1&&this._methods[e].push(t))}off(e,t){if(!e)return;e=e.toLowerCase();const s=this._methods[e];if(s)if(t){const o=s.indexOf(t);o!==-1&&(s.splice(o,1),s.length===0&&delete this._methods[e])}else delete this._methods[e]}onclose(e){e&&this._closedCallbacks.push(e)}onreconnecting(e){e&&this._reconnectingCallbacks.push(e)}onreconnected(e){e&&this._reconnectedCallbacks.push(e)}_processIncomingData(e){if(this._cleanupTimeout(),this._receivedHandshakeResponse||(e=this._processHandshakeResponse(e),this._receivedHandshakeResponse=!0),e){const t=this._protocol.parseMessages(e,this._logger);for(const s of t)if(!(this._messageBuffer&&!this._messageBuffer._shouldProcessMessage(s)))switch(s.type){case f.Invocation:this._invokeClientMethod(s).catch(o=>{this._logger.log(h.Error,`Invoke client method threw error: ${_e(o)}`)});break;case f.StreamItem:case f.Completion:{const o=this._callbacks[s.invocationId];if(o){s.type===f.Completion&&delete this._callbacks[s.invocationId];try{o(s)}catch(i){this._logger.log(h.Error,`Stream callback threw error: ${_e(i)}`)}}break}case f.Ping:break;case f.Close:{this._logger.log(h.Information,"Close message received from server.");const o=s.error?new Error("Server returned an error on close: "+s.error):void 0;s.allowReconnect===!0?this.connection.stop(o):this._stopPromise=this._stopInternal(o);break}case f.Ack:this._messageBuffer&&this._messageBuffer._ack(s);break;case f.Sequence:this._messageBuffer&&this._messageBuffer._resetSequence(s);break;default:this._logger.log(h.Warning,`Invalid message type: ${s.type}.`);break}}this._resetTimeoutPeriod()}_processHandshakeResponse(e){let t,s;try{[s,t]=this._handshakeProtocol.parseHandshakeResponse(e)}catch(o){const i="Error parsing handshake response: "+o;this._logger.log(h.Error,i);const r=new Error(i);throw this._handshakeRejecter(r),r}if(t.error){const o="Server returned handshake error: "+t.error;this._logger.log(h.Error,o);const i=new Error(o);throw this._handshakeRejecter(i),i}else this._logger.log(h.Debug,"Server handshake complete.");return this._handshakeResolver(),s}_resetKeepAliveInterval(){this.connection.features.inherentKeepAlive||(this._nextKeepAlive=new Date().getTime()+this.keepAliveIntervalInMilliseconds,this._cleanupPingTimer())}_resetTimeoutPeriod(){if((!this.connection.features||!this.connection.features.inherentKeepAlive)&&(this._timeoutHandle=setTimeout(()=>this.serverTimeout(),this.serverTimeoutInMilliseconds),this._pingServerHandle===void 0)){let e=this._nextKeepAlive-new Date().getTime();e<0&&(e=0),this._pingServerHandle=setTimeout(async()=>{if(this._connectionState===x.Connected)try{await this._sendMessage(this._cachedPingMessage)}catch{this._cleanupPingTimer()}},e)}}serverTimeout(){this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."))}async _invokeClientMethod(e){const t=e.target.toLowerCase(),s=this._methods[t];if(!s){this._logger.log(h.Warning,`No client method with the name '${t}' found.`),e.invocationId&&(this._logger.log(h.Warning,`No result given for '${t}' method and invocation ID '${e.invocationId}'.`),await this._sendWithProtocol(this._createCompletionMessage(e.invocationId,"Client didn't provide a result.",null)));return}const o=s.slice(),i=!!e.invocationId;let r,a,l;for(const p of o)try{const u=r;r=await p.apply(this,e.arguments),i&&r&&u&&(this._logger.log(h.Error,`Multiple results provided for '${t}'. Sending error to server.`),l=this._createCompletionMessage(e.invocationId,"Client provided multiple results.",null)),a=void 0}catch(u){a=u,this._logger.log(h.Error,`A callback for the method '${t}' threw error '${u}'.`)}l?await this._sendWithProtocol(l):i?(a?l=this._createCompletionMessage(e.invocationId,`${a}`,null):r!==void 0?l=this._createCompletionMessage(e.invocationId,null,r):(this._logger.log(h.Warning,`No result given for '${t}' method and invocation ID '${e.invocationId}'.`),l=this._createCompletionMessage(e.invocationId,"Client didn't provide a result.",null)),await this._sendWithProtocol(l)):r&&this._logger.log(h.Error,`Result given for '${t}' method but server is not expecting a result.`)}_connectionClosed(e){this._logger.log(h.Debug,`HubConnection.connectionClosed(${e}) called while in state ${this._connectionState}.`),this._stopDuringStartError=this._stopDuringStartError||e||new N("The underlying connection was closed before the hub handshake could complete."),this._handshakeResolver&&this._handshakeResolver(),this._cancelCallbacksWithError(e||new Error("Invocation canceled due to the underlying connection being closed.")),this._cleanupTimeout(),this._cleanupPingTimer(),this._connectionState===x.Disconnecting?this._completeClose(e):this._connectionState===x.Connected&&this._reconnectPolicy?this._reconnect(e):this._connectionState===x.Connected&&this._completeClose(e)}_completeClose(e){if(this._connectionStarted){this._connectionState=x.Disconnected,this._connectionStarted=!1,this._messageBuffer&&(this._messageBuffer._dispose(e??new Error("Connection closed.")),this._messageBuffer=void 0),_.isBrowser&&window.document.removeEventListener("freeze",this._freezeEventListener);try{this._closedCallbacks.forEach(t=>t.apply(this,[e]))}catch(t){this._logger.log(h.Error,`An onclose callback called with error '${e}' threw error '${t}'.`)}}}async _reconnect(e){const t=Date.now();let s=0,o=e!==void 0?e:new Error("Attempting to reconnect due to a unknown error."),i=this._getNextRetryDelay(s++,0,o);if(i===null){this._logger.log(h.Debug,"Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt."),this._completeClose(e);return}if(this._connectionState=x.Reconnecting,e?this._logger.log(h.Information,`Connection reconnecting because of error '${e}'.`):this._logger.log(h.Information,"Connection reconnecting."),this._reconnectingCallbacks.length!==0){try{this._reconnectingCallbacks.forEach(r=>r.apply(this,[e]))}catch(r){this._logger.log(h.Error,`An onreconnecting callback called with error '${e}' threw error '${r}'.`)}if(this._connectionState!==x.Reconnecting){this._logger.log(h.Debug,"Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");return}}for(;i!==null;){if(this._logger.log(h.Information,`Reconnect attempt number ${s} will start in ${i} ms.`),await new Promise(r=>{this._reconnectDelayHandle=setTimeout(r,i)}),this._reconnectDelayHandle=void 0,this._connectionState!==x.Reconnecting){this._logger.log(h.Debug,"Connection left the reconnecting state during reconnect delay. Done reconnecting.");return}try{if(await this._startInternal(),this._connectionState=x.Connected,this._logger.log(h.Information,"HubConnection reconnected successfully."),this._reconnectedCallbacks.length!==0)try{this._reconnectedCallbacks.forEach(r=>r.apply(this,[this.connection.connectionId]))}catch(r){this._logger.log(h.Error,`An onreconnected callback called with connectionId '${this.connection.connectionId}; threw error '${r}'.`)}return}catch(r){if(this._logger.log(h.Information,`Reconnect attempt failed because of error '${r}'.`),this._connectionState!==x.Reconnecting){this._logger.log(h.Debug,`Connection moved to the '${this._connectionState}' from the reconnecting state during reconnect attempt. Done reconnecting.`),this._connectionState===x.Disconnecting&&this._completeClose();return}o=r instanceof Error?r:new Error(r.toString()),i=this._getNextRetryDelay(s++,Date.now()-t,o)}}this._logger.log(h.Information,`Reconnect retries have been exhausted after ${Date.now()-t} ms and ${s} failed attempts. Connection disconnecting.`),this._completeClose()}_getNextRetryDelay(e,t,s){try{return this._reconnectPolicy.nextRetryDelayInMilliseconds({elapsedMilliseconds:t,previousRetryCount:e,retryReason:s})}catch(o){return this._logger.log(h.Error,`IRetryPolicy.nextRetryDelayInMilliseconds(${e}, ${t}) threw error '${o}'.`),null}}_cancelCallbacksWithError(e){const t=this._callbacks;this._callbacks={},Object.keys(t).forEach(s=>{const o=t[s];try{o(null,e)}catch(i){this._logger.log(h.Error,`Stream 'error' callback called with '${e}' threw error: ${_e(i)}`)}})}_cleanupPingTimer(){this._pingServerHandle&&(clearTimeout(this._pingServerHandle),this._pingServerHandle=void 0)}_cleanupTimeout(){this._timeoutHandle&&clearTimeout(this._timeoutHandle)}_createInvocation(e,t,s,o){if(s)return o.length!==0?{arguments:t,streamIds:o,target:e,type:f.Invocation}:{arguments:t,target:e,type:f.Invocation};{const i=this._invocationId;return this._invocationId++,o.length!==0?{arguments:t,invocationId:i.toString(),streamIds:o,target:e,type:f.Invocation}:{arguments:t,invocationId:i.toString(),target:e,type:f.Invocation}}}_launchStreams(e,t){if(e.length!==0){t||(t=Promise.resolve());for(const s in e)e[s].subscribe({complete:()=>{t=t.then(()=>this._sendWithProtocol(this._createCompletionMessage(s)))},error:o=>{let i;o instanceof Error?i=o.message:o&&o.toString?i=o.toString():i="Unknown error",t=t.then(()=>this._sendWithProtocol(this._createCompletionMessage(s,i)))},next:o=>{t=t.then(()=>this._sendWithProtocol(this._createStreamItemMessage(s,o)))}})}}_replaceStreamingParams(e){const t=[],s=[];for(let o=0;o<e.length;o++){const i=e[o];if(this._isObservable(i)){const r=this._invocationId;this._invocationId++,t[r]=i,s.push(r.toString()),e.splice(o,1)}}return[t,s]}_isObservable(e){return e&&e.subscribe&&typeof e.subscribe=="function"}_createStreamInvocation(e,t,s){const o=this._invocationId;return this._invocationId++,s.length!==0?{arguments:t,invocationId:o.toString(),streamIds:s,target:e,type:f.StreamInvocation}:{arguments:t,invocationId:o.toString(),target:e,type:f.StreamInvocation}}_createCancelInvocation(e){return{invocationId:e,type:f.CancelInvocation}}_createStreamItemMessage(e,t){return{invocationId:e,item:t,type:f.StreamItem}}_createCompletionMessage(e,t,s){return t?{error:t,invocationId:e,type:f.Completion}:{invocationId:e,result:s,type:f.Completion}}_createCloseMessage(){return{type:f.Close}}}const qt=[0,2e3,1e4,3e4,null];class Ue{constructor(e){this._retryDelays=e!==void 0?[...e,null]:qt}nextRetryDelayInMilliseconds(e){return this._retryDelays[e.previousRetryCount]}}class G{}G.Authorization="Authorization";G.Cookie="Cookie";class Vt extends be{constructor(e,t){super(),this._innerClient=e,this._accessTokenFactory=t}async send(e){let t=!0;this._accessTokenFactory&&(!this._accessToken||e.url&&e.url.indexOf("/negotiate?")>0)&&(t=!1,this._accessToken=await this._accessTokenFactory()),this._setAuthorizationHeader(e);const s=await this._innerClient.send(e);return t&&s.statusCode===401&&this._accessTokenFactory?(this._accessToken=await this._accessTokenFactory(),this._setAuthorizationHeader(e),await this._innerClient.send(e)):s}_setAuthorizationHeader(e){e.headers||(e.headers={}),this._accessToken?e.headers[G.Authorization]=`Bearer ${this._accessToken}`:this._accessTokenFactory&&e.headers[G.Authorization]&&delete e.headers[G.Authorization]}getCookieString(e){return this._innerClient.getCookieString(e)}}var $;(function(n){n[n.None=0]="None",n[n.WebSockets=1]="WebSockets",n[n.ServerSentEvents=2]="ServerSentEvents",n[n.LongPolling=4]="LongPolling"})($||($={}));var T;(function(n){n[n.Text=1]="Text",n[n.Binary=2]="Binary"})(T||(T={}));let Wt=class{constructor(){this._isAborted=!1,this.onabort=null}abort(){this._isAborted||(this._isAborted=!0,this.onabort&&this.onabort())}get signal(){return this}get aborted(){return this._isAborted}};class Ne{get pollAborted(){return this._pollAbort.aborted}constructor(e,t,s){this._httpClient=e,this._logger=t,this._pollAbort=new Wt,this._options=s,this._running=!1,this.onreceive=null,this.onclose=null}async connect(e,t){if(S.isRequired(e,"url"),S.isRequired(t,"transferFormat"),S.isIn(t,T,"transferFormat"),this._url=e,this._logger.log(h.Trace,"(LongPolling transport) Connecting."),t===T.Binary&&typeof XMLHttpRequest<"u"&&typeof new XMLHttpRequest().responseType!="string")throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");const[s,o]=ne(),i={[s]:o,...this._options.headers},r={abortSignal:this._pollAbort.signal,headers:i,timeout:1e5,withCredentials:this._options.withCredentials};t===T.Binary&&(r.responseType="arraybuffer");const a=`${e}&_=${Date.now()}`;this._logger.log(h.Trace,`(LongPolling transport) polling: ${a}.`);const l=await this._httpClient.get(a,r);l.statusCode!==200?(this._logger.log(h.Error,`(LongPolling transport) Unexpected response code: ${l.statusCode}.`),this._closeError=new K(l.statusText||"",l.statusCode),this._running=!1):this._running=!0,this._receiving=this._poll(this._url,r)}async _poll(e,t){try{for(;this._running;)try{const s=`${e}&_=${Date.now()}`;this._logger.log(h.Trace,`(LongPolling transport) polling: ${s}.`);const o=await this._httpClient.get(s,t);o.statusCode===204?(this._logger.log(h.Information,"(LongPolling transport) Poll terminated by server."),this._running=!1):o.statusCode!==200?(this._logger.log(h.Error,`(LongPolling transport) Unexpected response code: ${o.statusCode}.`),this._closeError=new K(o.statusText||"",o.statusCode),this._running=!1):o.content?(this._logger.log(h.Trace,`(LongPolling transport) data received. ${ae(o.content,this._options.logMessageContent)}.`),this.onreceive&&this.onreceive(o.content)):this._logger.log(h.Trace,"(LongPolling transport) Poll timed out, reissuing.")}catch(s){this._running?s instanceof Te?this._logger.log(h.Trace,"(LongPolling transport) Poll timed out, reissuing."):(this._closeError=s,this._running=!1):this._logger.log(h.Trace,`(LongPolling transport) Poll errored after shutdown: ${s.message}`)}}finally{this._logger.log(h.Trace,"(LongPolling transport) Polling complete."),this.pollAborted||this._raiseOnClose()}}async send(e){return this._running?Ve(this._logger,"LongPolling",this._httpClient,this._url,e,this._options):Promise.reject(new Error("Cannot send until the transport is connected"))}async stop(){this._logger.log(h.Trace,"(LongPolling transport) Stopping polling."),this._running=!1,this._pollAbort.abort();try{await this._receiving,this._logger.log(h.Trace,`(LongPolling transport) sending DELETE request to ${this._url}.`);const e={},[t,s]=ne();e[t]=s;const o={headers:{...e,...this._options.headers},timeout:this._options.timeout,withCredentials:this._options.withCredentials};let i;try{await this._httpClient.delete(this._url,o)}catch(r){i=r}i?i instanceof K&&(i.statusCode===404?this._logger.log(h.Trace,"(LongPolling transport) A 404 response was returned from sending a DELETE request."):this._logger.log(h.Trace,`(LongPolling transport) Error sending a DELETE request: ${i}`)):this._logger.log(h.Trace,"(LongPolling transport) DELETE request accepted.")}finally{this._logger.log(h.Trace,"(LongPolling transport) Stop finished."),this._raiseOnClose()}}_raiseOnClose(){if(this.onclose){let e="(LongPolling transport) Firing onclose event.";this._closeError&&(e+=" Error: "+this._closeError),this._logger.log(h.Trace,e),this.onclose(this._closeError)}}}class Jt{constructor(e,t,s,o){this._httpClient=e,this._accessToken=t,this._logger=s,this._options=o,this.onreceive=null,this.onclose=null}async connect(e,t){return S.isRequired(e,"url"),S.isRequired(t,"transferFormat"),S.isIn(t,T,"transferFormat"),this._logger.log(h.Trace,"(SSE transport) Connecting."),this._url=e,this._accessToken&&(e+=(e.indexOf("?")<0?"?":"&")+`access_token=${encodeURIComponent(this._accessToken)}`),new Promise((s,o)=>{let i=!1;if(t!==T.Text){o(new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));return}let r;if(_.isBrowser||_.isWebWorker)r=new this._options.EventSource(e,{withCredentials:this._options.withCredentials});else{const a=this._httpClient.getCookieString(e),l={};l.Cookie=a;const[p,u]=ne();l[p]=u,r=new this._options.EventSource(e,{withCredentials:this._options.withCredentials,headers:{...l,...this._options.headers}})}try{r.onmessage=a=>{if(this.onreceive)try{this._logger.log(h.Trace,`(SSE transport) data received. ${ae(a.data,this._options.logMessageContent)}.`),this.onreceive(a.data)}catch(l){this._close(l);return}},r.onerror=a=>{i?this._close():o(new Error("EventSource failed to connect. The connection could not be found on the server, either the connection ID is not present on the server, or a proxy is refusing/buffering the connection. If you have multiple servers check that sticky sessions are enabled."))},r.onopen=()=>{this._logger.log(h.Information,`SSE connected to ${this._url}`),this._eventSource=r,i=!0,s()}}catch(a){o(a);return}})}async send(e){return this._eventSource?Ve(this._logger,"SSE",this._httpClient,this._url,e,this._options):Promise.reject(new Error("Cannot send until the transport is connected"))}stop(){return this._close(),Promise.resolve()}_close(e){this._eventSource&&(this._eventSource.close(),this._eventSource=void 0,this.onclose&&this.onclose(e))}}class Kt{constructor(e,t,s,o,i,r){this._logger=s,this._accessTokenFactory=t,this._logMessageContent=o,this._webSocketConstructor=i,this._httpClient=e,this.onreceive=null,this.onclose=null,this._headers=r}async connect(e,t){S.isRequired(e,"url"),S.isRequired(t,"transferFormat"),S.isIn(t,T,"transferFormat"),this._logger.log(h.Trace,"(WebSockets transport) Connecting.");let s;return this._accessTokenFactory&&(s=await this._accessTokenFactory()),new Promise((o,i)=>{e=e.replace(/^http/,"ws");let r;const a=this._httpClient.getCookieString(e);let l=!1;if(_.isNode||_.isReactNative){const p={},[u,y]=ne();p[u]=y,s&&(p[G.Authorization]=`Bearer ${s}`),a&&(p[G.Cookie]=a),r=new this._webSocketConstructor(e,void 0,{headers:{...p,...this._headers}})}else s&&(e+=(e.indexOf("?")<0?"?":"&")+`access_token=${encodeURIComponent(s)}`);r||(r=new this._webSocketConstructor(e)),t===T.Binary&&(r.binaryType="arraybuffer"),r.onopen=p=>{this._logger.log(h.Information,`WebSocket connected to ${e}.`),this._webSocket=r,l=!0,o()},r.onerror=p=>{let u=null;typeof ErrorEvent<"u"&&p instanceof ErrorEvent?u=p.error:u="There was an error with the transport",this._logger.log(h.Information,`(WebSockets transport) ${u}.`)},r.onmessage=p=>{if(this._logger.log(h.Trace,`(WebSockets transport) data received. ${ae(p.data,this._logMessageContent)}.`),this.onreceive)try{this.onreceive(p.data)}catch(u){this._close(u);return}},r.onclose=p=>{if(l)this._close(p);else{let u=null;typeof ErrorEvent<"u"&&p instanceof ErrorEvent?u=p.error:u="WebSocket failed to connect. The connection could not be found on the server, either the endpoint may not be a SignalR endpoint, the connection ID is not present on the server, or there is a proxy blocking WebSockets. If you have multiple servers check that sticky sessions are enabled.",i(new Error(u))}}})}send(e){return this._webSocket&&this._webSocket.readyState===this._webSocketConstructor.OPEN?(this._logger.log(h.Trace,`(WebSockets transport) sending data. ${ae(e,this._logMessageContent)}.`),this._webSocket.send(e),Promise.resolve()):Promise.reject("WebSocket is not in the OPEN state")}stop(){return this._webSocket&&this._close(void 0),Promise.resolve()}_close(e){this._webSocket&&(this._webSocket.onclose=()=>{},this._webSocket.onmessage=()=>{},this._webSocket.onerror=()=>{},this._webSocket.close(),this._webSocket=void 0),this._logger.log(h.Trace,"(WebSockets transport) socket closed."),this.onclose&&(this._isCloseEvent(e)&&(e.wasClean===!1||e.code!==1e3)?this.onclose(new Error(`WebSocket closed with status code: ${e.code} (${e.reason||"no reason given"}).`)):e instanceof Error?this.onclose(e):this.onclose())}_isCloseEvent(e){return e&&typeof e.wasClean=="boolean"&&typeof e.code=="number"}}const Re=100;class Gt{constructor(e,t={}){if(this._stopPromiseResolver=()=>{},this.features={},this._negotiateVersion=1,S.isRequired(e,"url"),this._logger=Et(t.logger),this.baseUrl=this._resolveUrl(e),t=t||{},t.logMessageContent=t.logMessageContent===void 0?!1:t.logMessageContent,typeof t.withCredentials=="boolean"||t.withCredentials===void 0)t.withCredentials=t.withCredentials===void 0?!0:t.withCredentials;else throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");t.timeout=t.timeout===void 0?100*1e3:t.timeout;let s=null,o=null;if(_.isNode&&typeof require<"u"){const i=typeof __webpack_require__=="function"?__non_webpack_require__:require;s=i("ws"),o=i("eventsource")}!_.isNode&&typeof WebSocket<"u"&&!t.WebSocket?t.WebSocket=WebSocket:_.isNode&&!t.WebSocket&&s&&(t.WebSocket=s),!_.isNode&&typeof EventSource<"u"&&!t.EventSource?t.EventSource=EventSource:_.isNode&&!t.EventSource&&typeof o<"u"&&(t.EventSource=o),this._httpClient=new Vt(t.httpClient||new Nt(this._logger),t.accessTokenFactory),this._connectionState="Disconnected",this._connectionStarted=!1,this._options=t,this.onreceive=null,this.onclose=null}async start(e){if(e=e||T.Binary,S.isIn(e,T,"transferFormat"),this._logger.log(h.Debug,`Starting connection with transfer format '${T[e]}'.`),this._connectionState!=="Disconnected")return Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));if(this._connectionState="Connecting",this._startInternalPromise=this._startInternal(e),await this._startInternalPromise,this._connectionState==="Disconnecting"){const t="Failed to start the HttpConnection before stop() was called.";return this._logger.log(h.Error,t),await this._stopPromise,Promise.reject(new N(t))}else if(this._connectionState!=="Connected"){const t="HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";return this._logger.log(h.Error,t),Promise.reject(new N(t))}this._connectionStarted=!0}send(e){return this._connectionState!=="Connected"?Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State.")):(this._sendQueue||(this._sendQueue=new Le(this.transport)),this._sendQueue.send(e))}async stop(e){if(this._connectionState==="Disconnected")return this._logger.log(h.Debug,`Call to HttpConnection.stop(${e}) ignored because the connection is already in the disconnected state.`),Promise.resolve();if(this._connectionState==="Disconnecting")return this._logger.log(h.Debug,`Call to HttpConnection.stop(${e}) ignored because the connection is already in the disconnecting state.`),this._stopPromise;this._connectionState="Disconnecting",this._stopPromise=new Promise(t=>{this._stopPromiseResolver=t}),await this._stopInternal(e),await this._stopPromise}async _stopInternal(e){this._stopError=e;try{await this._startInternalPromise}catch{}if(this.transport){try{await this.transport.stop()}catch(t){this._logger.log(h.Error,`HttpConnection.transport.stop() threw error '${t}'.`),this._stopConnection()}this.transport=void 0}else this._logger.log(h.Debug,"HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.")}async _startInternal(e){let t=this.baseUrl;this._accessTokenFactory=this._options.accessTokenFactory,this._httpClient._accessTokenFactory=this._accessTokenFactory;try{if(this._options.skipNegotiation)if(this._options.transport===$.WebSockets)this.transport=this._constructTransport($.WebSockets),await this._startTransport(t,e);else throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");else{let s=null,o=0;do{if(s=await this._getNegotiationResponse(t),this._connectionState==="Disconnecting"||this._connectionState==="Disconnected")throw new N("The connection was stopped during negotiation.");if(s.error)throw new Error(s.error);if(s.ProtocolVersion)throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");if(s.url&&(t=s.url),s.accessToken){const i=s.accessToken;this._accessTokenFactory=()=>i,this._httpClient._accessToken=i,this._httpClient._accessTokenFactory=void 0}o++}while(s.url&&o<Re);if(o===Re&&s.url)throw new Error("Negotiate redirection limit exceeded.");await this._createTransport(t,this._options.transport,s,e)}this.transport instanceof Ne&&(this.features.inherentKeepAlive=!0),this._connectionState==="Connecting"&&(this._logger.log(h.Debug,"The HttpConnection connected successfully."),this._connectionState="Connected")}catch(s){return this._logger.log(h.Error,"Failed to start the connection: "+s),this._connectionState="Disconnected",this.transport=void 0,this._stopPromiseResolver(),Promise.reject(s)}}async _getNegotiationResponse(e){const t={},[s,o]=ne();t[s]=o;const i=this._resolveNegotiateUrl(e);this._logger.log(h.Debug,`Sending negotiation request: ${i}.`);try{const r=await this._httpClient.post(i,{content:"",headers:{...t,...this._options.headers},timeout:this._options.timeout,withCredentials:this._options.withCredentials});if(r.statusCode!==200)return Promise.reject(new Error(`Unexpected status code returned from negotiate '${r.statusCode}'`));const a=JSON.parse(r.content);return(!a.negotiateVersion||a.negotiateVersion<1)&&(a.connectionToken=a.connectionId),a.useStatefulReconnect&&this._options._useStatefulReconnect!==!0?Promise.reject(new Pe("Client didn't negotiate Stateful Reconnect but the server did.")):a}catch(r){let a="Failed to complete negotiation with the server: "+r;return r instanceof K&&r.statusCode===404&&(a=a+" Either this is not a SignalR endpoint or there is a proxy blocking the connection."),this._logger.log(h.Error,a),Promise.reject(new Pe(a))}}_createConnectUrl(e,t){return t?e+(e.indexOf("?")===-1?"?":"&")+`id=${t}`:e}async _createTransport(e,t,s,o){let i=this._createConnectUrl(e,s.connectionToken);if(this._isITransport(t)){this._logger.log(h.Debug,"Connection was provided an instance of ITransport, using that directly."),this.transport=t,await this._startTransport(i,o),this.connectionId=s.connectionId;return}const r=[],a=s.availableTransports||[];let l=s;for(const p of a){const u=this._resolveTransportOrError(p,t,o,(l==null?void 0:l.useStatefulReconnect)===!0);if(u instanceof Error)r.push(`${p.transport} failed:`),r.push(u);else if(this._isITransport(u)){if(this.transport=u,!l){try{l=await this._getNegotiationResponse(e)}catch(y){return Promise.reject(y)}i=this._createConnectUrl(e,l.connectionToken)}try{await this._startTransport(i,o),this.connectionId=l.connectionId;return}catch(y){if(this._logger.log(h.Error,`Failed to start the transport '${p.transport}': ${y}`),l=void 0,r.push(new Ct(`${p.transport} failed: ${y}`,$[p.transport])),this._connectionState!=="Connecting"){const m="Failed to select transport before stop() was called.";return this._logger.log(h.Debug,m),Promise.reject(new N(m))}}}}return r.length>0?Promise.reject(new St(`Unable to connect to the server with any of the available transports. ${r.join(" ")}`,r)):Promise.reject(new Error("None of the transports supported by the client are supported by the server."))}_constructTransport(e){switch(e){case $.WebSockets:if(!this._options.WebSocket)throw new Error("'WebSocket' is not supported in your environment.");return new Kt(this._httpClient,this._accessTokenFactory,this._logger,this._options.logMessageContent,this._options.WebSocket,this._options.headers||{});case $.ServerSentEvents:if(!this._options.EventSource)throw new Error("'EventSource' is not supported in your environment.");return new Jt(this._httpClient,this._httpClient._accessToken,this._logger,this._options);case $.LongPolling:return new Ne(this._httpClient,this._logger,this._options);default:throw new Error(`Unknown transport: ${e}.`)}}_startTransport(e,t){return this.transport.onreceive=this.onreceive,this.features.reconnect?this.transport.onclose=async s=>{let o=!1;if(this.features.reconnect)try{this.features.disconnected(),await this.transport.connect(e,t),await this.features.resend()}catch{o=!0}else{this._stopConnection(s);return}o&&this._stopConnection(s)}:this.transport.onclose=s=>this._stopConnection(s),this.transport.connect(e,t)}_resolveTransportOrError(e,t,s,o){const i=$[e.transport];if(i==null)return this._logger.log(h.Debug,`Skipping transport '${e.transport}' because it is not supported by this client.`),new Error(`Skipping transport '${e.transport}' because it is not supported by this client.`);if(Yt(t,i))if(e.transferFormats.map(a=>T[a]).indexOf(s)>=0){if(i===$.WebSockets&&!this._options.WebSocket||i===$.ServerSentEvents&&!this._options.EventSource)return this._logger.log(h.Debug,`Skipping transport '${$[i]}' because it is not supported in your environment.'`),new xt(`'${$[i]}' is not supported in your environment.`,i);this._logger.log(h.Debug,`Selecting transport '${$[i]}'.`);try{return this.features.reconnect=i===$.WebSockets?o:void 0,this._constructTransport(i)}catch(a){return a}}else return this._logger.log(h.Debug,`Skipping transport '${$[i]}' because it does not support the requested transfer format '${T[s]}'.`),new Error(`'${$[i]}' does not support ${T[s]}.`);else return this._logger.log(h.Debug,`Skipping transport '${$[i]}' because it was disabled by the client.`),new _t(`'${$[i]}' is disabled by the client.`,i)}_isITransport(e){return e&&typeof e=="object"&&"connect"in e}_stopConnection(e){if(this._logger.log(h.Debug,`HttpConnection.stopConnection(${e}) called while in state ${this._connectionState}.`),this.transport=void 0,e=this._stopError||e,this._stopError=void 0,this._connectionState==="Disconnected"){this._logger.log(h.Debug,`Call to HttpConnection.stopConnection(${e}) was ignored because the connection is already in the disconnected state.`);return}if(this._connectionState==="Connecting")throw this._logger.log(h.Warning,`Call to HttpConnection.stopConnection(${e}) was ignored because the connection is still in the connecting state.`),new Error(`HttpConnection.stopConnection(${e}) was called while the connection is still in the connecting state.`);if(this._connectionState==="Disconnecting"&&this._stopPromiseResolver(),e?this._logger.log(h.Error,`Connection disconnected with error '${e}'.`):this._logger.log(h.Information,"Connection disconnected."),this._sendQueue&&(this._sendQueue.stop().catch(t=>{this._logger.log(h.Error,`TransportSendQueue.stop() threw error '${t}'.`)}),this._sendQueue=void 0),this.connectionId=void 0,this._connectionState="Disconnected",this._connectionStarted){this._connectionStarted=!1;try{this.onclose&&this.onclose(e)}catch(t){this._logger.log(h.Error,`HttpConnection.onclose(${e}) threw error '${t}'.`)}}}_resolveUrl(e){if(e.lastIndexOf("https://",0)===0||e.lastIndexOf("http://",0)===0)return e;if(!_.isBrowser)throw new Error(`Cannot resolve '${e}'.`);const t=window.document.createElement("a");return t.href=e,this._logger.log(h.Information,`Normalizing '${e}' to '${t.href}'.`),t.href}_resolveNegotiateUrl(e){const t=new URL(e);t.pathname.endsWith("/")?t.pathname+="negotiate":t.pathname+="/negotiate";const s=new URLSearchParams(t.searchParams);return s.has("negotiateVersion")||s.append("negotiateVersion",this._negotiateVersion.toString()),s.has("useStatefulReconnect")?s.get("useStatefulReconnect")==="true"&&(this._options._useStatefulReconnect=!0):this._options._useStatefulReconnect===!0&&s.append("useStatefulReconnect","true"),t.search=s.toString(),t.toString()}}function Yt(n,e){return!n||(e&n)!==0}class Le{constructor(e){this._transport=e,this._buffer=[],this._executing=!0,this._sendBufferedData=new le,this._transportResult=new le,this._sendLoopPromise=this._sendLoop()}send(e){return this._bufferData(e),this._transportResult||(this._transportResult=new le),this._transportResult.promise}stop(){return this._executing=!1,this._sendBufferedData.resolve(),this._sendLoopPromise}_bufferData(e){if(this._buffer.length&&typeof this._buffer[0]!=typeof e)throw new Error(`Expected data to be of type ${typeof this._buffer} but was of type ${typeof e}`);this._buffer.push(e),this._sendBufferedData.resolve()}async _sendLoop(){for(;;){if(await this._sendBufferedData.promise,!this._executing){this._transportResult&&this._transportResult.reject("Connection stopped.");break}this._sendBufferedData=new le;const e=this._transportResult;this._transportResult=void 0;const t=typeof this._buffer[0]=="string"?this._buffer.join(""):Le._concatBuffers(this._buffer);this._buffer.length=0;try{await this._transport.send(t),e.resolve()}catch(s){e.reject(s)}}}static _concatBuffers(e){const t=e.map(i=>i.byteLength).reduce((i,r)=>i+r),s=new Uint8Array(t);let o=0;for(const i of e)s.set(new Uint8Array(i),o),o+=i.byteLength;return s.buffer}}class le{constructor(){this.promise=new Promise((e,t)=>[this._resolver,this._rejecter]=[e,t])}resolve(){this._resolver()}reject(e){this._rejecter(e)}}const Xt="json";class Qt{constructor(){this.name=Xt,this.version=2,this.transferFormat=T.Text}parseMessages(e,t){if(typeof e!="string")throw new Error("Invalid input for JSON hub protocol. Expected a string.");if(!e)return[];t===null&&(t=re.instance);const s=L.parse(e),o=[];for(const i of s){const r=JSON.parse(i);if(typeof r.type!="number")throw new Error("Invalid payload.");switch(r.type){case f.Invocation:this._isInvocationMessage(r);break;case f.StreamItem:this._isStreamItemMessage(r);break;case f.Completion:this._isCompletionMessage(r);break;case f.Ping:break;case f.Close:break;case f.Ack:this._isAckMessage(r);break;case f.Sequence:this._isSequenceMessage(r);break;default:t.log(h.Information,"Unknown message type '"+r.type+"' ignored.");continue}o.push(r)}return o}writeMessage(e){return L.write(JSON.stringify(e))}_isInvocationMessage(e){this._assertNotEmptyString(e.target,"Invalid payload for Invocation message."),e.invocationId!==void 0&&this._assertNotEmptyString(e.invocationId,"Invalid payload for Invocation message.")}_isStreamItemMessage(e){if(this._assertNotEmptyString(e.invocationId,"Invalid payload for StreamItem message."),e.item===void 0)throw new Error("Invalid payload for StreamItem message.")}_isCompletionMessage(e){if(e.result&&e.error)throw new Error("Invalid payload for Completion message.");!e.result&&e.error&&this._assertNotEmptyString(e.error,"Invalid payload for Completion message."),this._assertNotEmptyString(e.invocationId,"Invalid payload for Completion message.")}_isAckMessage(e){if(typeof e.sequenceId!="number")throw new Error("Invalid SequenceId for Ack message.")}_isSequenceMessage(e){if(typeof e.sequenceId!="number")throw new Error("Invalid SequenceId for Sequence message.")}_assertNotEmptyString(e,t){if(typeof e!="string"||e==="")throw new Error(t)}}const Zt={trace:h.Trace,debug:h.Debug,info:h.Information,information:h.Information,warn:h.Warning,warning:h.Warning,error:h.Error,critical:h.Critical,none:h.None};function en(n){const e=Zt[n.toLowerCase()];if(typeof e<"u")return e;throw new Error(`Unknown log level: ${n}`)}class We{configureLogging(e){if(S.isRequired(e,"logging"),tn(e))this.logger=e;else if(typeof e=="string"){const t=en(e);this.logger=new me(t)}else this.logger=new me(e);return this}withUrl(e,t){return S.isRequired(e,"url"),S.isNotEmpty(e,"url"),this.url=e,typeof t=="object"?this.httpConnectionOptions={...this.httpConnectionOptions,...t}:this.httpConnectionOptions={...this.httpConnectionOptions,transport:t},this}withHubProtocol(e){return S.isRequired(e,"protocol"),this.protocol=e,this}withAutomaticReconnect(e){if(this.reconnectPolicy)throw new Error("A reconnectPolicy has already been set.");return e?Array.isArray(e)?this.reconnectPolicy=new Ue(e):this.reconnectPolicy=e:this.reconnectPolicy=new Ue,this}withServerTimeout(e){return S.isRequired(e,"milliseconds"),this._serverTimeoutInMilliseconds=e,this}withKeepAliveInterval(e){return S.isRequired(e,"milliseconds"),this._keepAliveIntervalInMilliseconds=e,this}withStatefulReconnect(e){return this.httpConnectionOptions===void 0&&(this.httpConnectionOptions={}),this.httpConnectionOptions._useStatefulReconnect=!0,this._statefulReconnectBufferSize=e==null?void 0:e.bufferSize,this}build(){const e=this.httpConnectionOptions||{};if(e.logger===void 0&&(e.logger=this.logger),!this.url)throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");const t=new Gt(this.url,e);return Ie.create(t,this.logger||re.instance,this.protocol||new Qt,this.reconnectPolicy,this._serverTimeoutInMilliseconds,this._keepAliveIntervalInMilliseconds,this._statefulReconnectBufferSize)}}function tn(n){return n.log!==void 0}let V=null;function nn(){const n=c.getState().activeStream;return`
    <div style="display:flex;gap:0;margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <!-- Video + Info -->
      <div style="flex:1;display:flex;flex-direction:column;">
        <div class="player-wrapper" id="player-container" style="border-radius:0;aspect-ratio:16/9;background:#000;">
          <video id="stream-video" style="width:100%;height:100%;" autoplay></video>
          <div id="player-offline" class="hidden" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-gradient-card);flex-direction:column;gap:12px;">
            <div style="font-size:48px;">&#128752;</div>
            <h3 style="font-family:var(--font-display);color:var(--color-cyan-neon);">Stream Offline</h3>
          </div>
        </div>
        <div style="padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
            <div>
              <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;" id="watch-title">${(n==null?void 0:n.title)||"Loading..."}</h2>
              <div style="display:flex;gap:12px;align-items:center;" id="watch-meta">
                <span class="badge-live">LIVE</span>
                <span class="text-muted" id="watch-viewers">${d.eye} ${(n==null?void 0:n.viewerCount)||0} viewers</span>
                <span class="badge-category">${(n==null?void 0:n.categoryName)||"General"}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button id="watch-clip-btn" class="btn btn-outline btn-sm">${d.clip} Clip</button>
              <button id="watch-follow-btn" class="btn btn-cyan btn-sm follow-btn not-following">${d.follow} Follow</button>
            </div>
          </div>
          <div id="watch-channel-info" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--color-space-panel);border-radius:var(--radius-card);border:1px solid rgba(0,174,189,0.12);cursor:pointer;">
            <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#000;overflow:hidden;" id="watch-avatar">${((n==null?void 0:n.streamerName)||"S")[0].toUpperCase()}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:16px;display:flex;align-items:center;gap:6px;" id="watch-streamer">${(n==null?void 0:n.streamerName)||"Streamer"} ${d.checkCircle}</div>
              <div style="font-size:13px;color:var(--color-text-muted);" id="watch-desc"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Panel -->
      <div class="chat-panel" style="width:var(--chat-width);flex-shrink:0;">
        <div class="chat-header">
          <span>Stream Chat</span>
          <span style="font-size:12px;color:var(--color-text-muted);" id="chat-status">Connecting...</span>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Send a message..." />
          <button id="chat-send">${d.send}</button>
        </div>
      </div>
    </div>
  `}function sn(){var r,a;const n=c.getState().viewParams,e=n==null?void 0:n.streamId,t=c.getState().activeStream;e&&!t?Z.getStreamById(e).then(l=>{c.setActiveStream(l),De(l)}).catch(()=>{}):t&&De(t),on(t),rn(t==null?void 0:t.channelId);const s=document.getElementById("watch-follow-btn");if(s&&t){const l=c.isFollowing(t.channelId);s.className=`btn btn-sm follow-btn ${l?"following":"not-following"}`,s.innerHTML=l?`${d.followFilled} Following`:`${d.follow} Follow`,s.addEventListener("click",()=>{c.isFollowing(t.channelId)?(c.unfollowChannel(t.channelId),s.className="btn btn-sm follow-btn not-following",s.innerHTML=`${d.follow} Follow`):(c.followChannel(t.channelId,t.streamerName||t.channelName),s.className="btn btn-sm follow-btn following",s.innerHTML=`${d.followFilled} Following`,c.showToast(`Following ${t.streamerName}!`,"success"))})}(r=document.getElementById("watch-clip-btn"))==null||r.addEventListener("click",()=>{e&&(c.openModal("slice",{streamId:e,channelId:t==null?void 0:t.channelId}),an(e,t==null?void 0:t.channelId))}),(a=document.getElementById("watch-channel-info"))==null||a.addEventListener("click",()=>{t!=null&&t.channelId&&c.navigate("channel",{channelId:t.channelId})});const o=document.getElementById("chat-input"),i=document.getElementById("chat-send");if(o&&i){const l=()=>{const p=o.value.trim();!p||!V||(V.invoke("SendMessage",p).catch(u=>console.error("Send failed",u)),o.value="")};i.addEventListener("click",l),o.addEventListener("keydown",p=>{p.key==="Enter"&&l()})}}function De(n){const e=document.getElementById("watch-title"),t=document.getElementById("watch-streamer");e&&(e.textContent=n.title),t&&(t.innerHTML=`${n.streamerName||"Streamer"} ${d.checkCircle}`)}async function on(n){if(!(n!=null&&n.hlsUrl))return;const e=document.getElementById("stream-video");if(e)try{const t=(await wt(async()=>{const{default:s}=await import("./hls-qrK6pUM6.js");return{default:s}},[],import.meta.url)).default;if(t.isSupported()){const s=new t;s.loadSource(n.hlsUrl),s.attachMedia(e),s.on(t.Events.ERROR,(o,i)=>{var r;i.fatal&&((r=document.getElementById("player-offline"))==null||r.classList.remove("hidden"))})}else e.canPlayType("application/vnd.apple.mpegurl")&&(e.src=n.hlsUrl)}catch(t){console.warn("HLS init failed",t)}}async function rn(n,e){const t=document.getElementById("chat-status"),s=document.getElementById("chat-messages");if(!(!n||!s))try{const o=se();V=new We().withUrl(`${ie}/hubs/stream-chat`,{accessTokenFactory:()=>o}).withAutomaticReconnect().build(),V.on("ReceiveMessage",i=>{const r=document.createElement("div");r.className="chat-msg",r.innerHTML=`<span class="chat-user" style="color:${i.color||"#00AEBD"};">${i.username}:</span> <span class="chat-text">${ln(i.content)}</span>`,s.appendChild(r),s.scrollTop=s.scrollHeight}),V.on("SystemMessage",i=>{const r=document.createElement("div");r.className="chat-msg",r.innerHTML=`<span style="color:var(--color-text-muted);font-style:italic;">${i}</span>`,s.appendChild(r)}),await V.start(),await V.invoke("JoinChannel",n),t&&(t.textContent="Connected",t.style.color="var(--color-success)")}catch(o){console.warn("Chat connection failed",o),t&&(t.textContent="Disconnected",t.style.color="var(--color-error)")}}function an(n,e){var s,o,i;const t=document.getElementById("modal-root");t&&(t.innerHTML=`
    <div class="modal-overlay" id="slice-overlay">
      <div class="modal-content">
        <h3>${d.clip} Create Clip</h3>
        <div class="form-group">
          <label style="color:var(--color-text-muted);">Title</label>
          <input class="input-dark" id="slice-title" placeholder="Clip title" />
        </div>
        <div class="form-group">
          <label style="color:var(--color-text-muted);">Duration (seconds, max 300)</label>
          <input class="input-dark" type="number" id="slice-duration" value="60" min="10" max="300" />
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button id="slice-confirm" class="btn btn-cyan btn-full">Create Clip</button>
          <button id="slice-cancel" class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  `,(s=document.getElementById("slice-cancel"))==null||s.addEventListener("click",()=>{t.innerHTML="",c.closeModal()}),(o=document.getElementById("slice-overlay"))==null||o.addEventListener("click",r=>{r.target.id==="slice-overlay"&&(t.innerHTML="",c.closeModal())}),(i=document.getElementById("slice-confirm"))==null||i.addEventListener("click",async()=>{const r=document.getElementById("slice-confirm");r.disabled=!0,r.textContent="Creating...";try{await te.slice({streamId:n,channelId:e,title:document.getElementById("slice-title").value||"Untitled Clip",durationSeconds:parseInt(document.getElementById("slice-duration").value)||60}),c.showToast("Clip created!","success"),t.innerHTML="",c.closeModal()}catch(a){c.showToast(a.message||"Clip failed","error"),r.disabled=!1,r.textContent="Create Clip"}}))}function ln(n){const e=document.createElement("div");return e.textContent=n,e.innerHTML}function cn(){return`
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div class="section-title" style="margin-bottom:0;">${d.grid} Browse Categories</div>
        <div class="search-bar" style="max-width:280px;">
          ${d.search}
          <input type="text" id="cat-search-input" placeholder="Search categories..." />
        </div>
      </div>
      <div class="categories-grid" id="categories-grid">
        <div class="spinner" style="grid-column:1/-1;"></div>
      </div>
    </div>
  `}function dn(){He();const n=document.getElementById("cat-search-input");let e;n&&n.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>{const t=n.value.trim();t?pn(t):He()},300)})}async function He(){const n=document.getElementById("categories-grid");if(n){n.innerHTML='<div class="spinner" style="grid-column:1/-1;"></div>';try{const e=await I.getAll();Je(n,e)}catch{n.innerHTML='<p class="text-muted" style="grid-column:1/-1;">Failed to load categories</p>'}}}async function pn(n){const e=document.getElementById("categories-grid");if(e)try{const t=await I.search(n);Je(e,t)}catch{}}function Je(n,e){if(!(e!=null&&e.length)){n.innerHTML='<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">&#128270;</div><h3>No Categories Found</h3></div>';return}n.innerHTML=e.map((t,s)=>`
    <div class="card category-card hover-lift stagger-item" data-slug="${t.slug}">
      <div class="cat-thumb">
        ${t.imageUrl?`<img src="${t.imageUrl}" alt="${t.name}" />`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-gradient-card);">&#127918;</div>'}
      </div>
      <div class="cat-info">
        <div class="cat-name">${t.name}</div>
        <div class="cat-viewers">${t.totalViewers||0} viewers</div>
      </div>
    </div>
  `).join(""),n.querySelectorAll(".category-card").forEach(t=>{t.addEventListener("click",()=>c.navigate("category-detail",{slug:t.dataset.slug}))})}let ve="streams";function hn(){return`
    <div>
      <div id="cat-header" style="display:flex;gap:20px;align-items:center;margin-bottom:24px;padding:24px;background:var(--color-space-panel);border-radius:var(--radius-card);border:1px solid rgba(0,174,189,0.12);">
        <div id="cat-img" style="width:120px;height:160px;border-radius:12px;overflow:hidden;background:var(--bg-gradient-card);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:48px;">&#127918;</div>
        <div>
          <h1 id="cat-name" style="font-size:24px;font-weight:700;margin-bottom:4px;">Loading...</h1>
          <p id="cat-desc" style="color:var(--color-text-muted);font-size:14px;"></p>
        </div>
      </div>
      <div class="tabs">
        <button class="tab-btn ${ve==="streams"?"active":""}" data-tab="streams">Live Streams</button>
        <button class="tab-btn ${ve==="clips"?"active":""}" data-tab="clips">Top Clips</button>
      </div>
      <div id="cat-content"><div class="spinner"></div></div>
    </div>
  `}function un(){var e;const n=(e=c.getState().viewParams)==null?void 0:e.slug;n&&(gn(n),document.querySelectorAll(".tab-btn").forEach(t=>{t.addEventListener("click",()=>{ve=t.dataset.tab,document.querySelectorAll(".tab-btn").forEach(s=>s.classList.remove("active")),t.classList.add("active"),Ke(n)})}))}async function gn(n){try{const e=await I.getBySlug(n);document.getElementById("cat-name").textContent=e.name,document.getElementById("cat-desc").textContent=e.description||"";const t=document.getElementById("cat-img");e.imageUrl&&t&&(t.innerHTML=`<img src="${e.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />`),Ke(n)}catch{c.showToast("Category not found","error")}}async function Ke(n){const e=document.getElementById("cat-content");if(e)if(e.innerHTML='<div class="spinner"></div>',ve==="streams")try{const t=await I.getStreams(n);if(!(t!=null&&t.length)){e.innerHTML='<div class="empty-state"><div class="empty-icon">&#128752;</div><h3>No Live Streams</h3><p>No one is streaming in this category right now.</p></div>';return}e.innerHTML=`<div class="streams-grid">${t.map(s=>`
        <div class="card stream-card hover-lift" data-sid="${s.id}">
          <div class="stream-thumb"><img src="${s.thumbnailUrl||"/cosmic_orbit_banner.png"}" /><div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;"><span class="badge-live">LIVE</span><span class="badge-viewers">${s.viewerCount||0}</span></div></div>
          <div class="stream-info"><div class="streamer-row"><div class="streamer-avatar">${(s.streamerName||"S")[0].toUpperCase()}</div><div><div class="streamer-name">${s.streamerName||"Streamer"}</div></div></div><div class="stream-title">${s.title||"Untitled"}</div></div>
        </div>
      `).join("")}</div>`,e.querySelectorAll(".stream-card").forEach(s=>s.addEventListener("click",()=>{const o=t.find(i=>i.id===parseInt(s.dataset.sid));o&&(c.setActiveStream(o),c.navigate("watch",{streamId:o.id}))}))}catch{e.innerHTML='<p class="text-muted">Failed to load streams</p>'}else try{const t=await I.getClips(n);if(!(t!=null&&t.length)){e.innerHTML='<div class="empty-state"><div class="empty-icon">&#127916;</div><h3>No Clips</h3></div>';return}e.innerHTML=`<div class="clips-grid">${t.map(s=>`
        <div class="card clip-card hover-lift"><div class="clip-thumb"><img src="${s.thumbnailUrl||"/cosmic_orbit_banner.png"}" /><span class="clip-views">${d.eye} ${s.viewCount||0}</span></div><div class="clip-info"><div class="clip-title">${s.title||"Untitled"}</div><div class="clip-meta">by ${s.creatorUsername||"Unknown"}</div></div></div>
      `).join("")}</div>`}catch{e.innerHTML='<p class="text-muted">Failed to load clips</p>'}}let ce=[];function mn(){return`<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="section-title" style="margin-bottom:0;">${d.clip} Top Clips Across the Galaxy</div>
      <button id="refresh-clips-btn" class="btn btn-ghost btn-sm">${d.refresh} Refresh</button>
    </div>
    <div class="clips-grid" id="clips-grid"><div class="spinner" style="grid-column:1/-1;"></div></div>
    <div id="clip-modal-root"></div>
  </div>`}function vn(){var n;(n=document.getElementById("refresh-clips-btn"))==null||n.addEventListener("click",()=>ke()),ke()}async function ke(){const n=document.getElementById("clips-grid");if(n){n.innerHTML='<div class="spinner" style="grid-column:1/-1;"></div>';try{if(ce=await te.getTop(30)||[],!ce.length){n.innerHTML=`
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">&#127916;</div>
          <h3>No Clips Found</h3>
          <p>No clips have been recorded yet. Watch a live broadcast and slice a clip!</p>
        </div>`;return}n.innerHTML=ce.map(t=>`
      <div class="card clip-card hover-lift stagger-item" data-clip-id="${t.id}">
        <div class="clip-thumb">
          <img src="${t.thumbnailUrl||"/cosmic_orbit_banner.png"}"
               alt="${H(t.title||"Clip")}"
               onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
          <span class="clip-views">${d.eye} ${t.viewCount||0} views</span>
          ${t.durationSeconds?`<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${Math.round(t.durationSeconds)}s</span>`:""}
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;" class="clip-play-overlay">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--color-cyan-primary);display:flex;align-items:center;justify-content:center;color:#000;box-shadow:0 0 16px rgba(0,221,238,0.5);">
              ${d.play}
            </div>
          </div>
        </div>
        <div class="clip-info">
          <div class="clip-title truncate" title="${H(t.title||"Untitled Clip")}">${H(t.title||"Untitled Clip")}</div>
          <div class="clip-meta" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
            <span style="color:var(--color-text-muted);font-size:12px;">by <strong style="color:#fff;">${H(t.creatorName||t.creatorUsername||"Streamer")}</strong></span>
            ${t.channelName?`<span style="color:var(--color-cyan-primary);font-size:12px;">${H(t.channelName)}</span>`:""}
          </div>
        </div>
      </div>
    `).join(""),n.querySelectorAll(".clip-card").forEach(t=>{t.addEventListener("mouseenter",()=>{const s=t.querySelector(".clip-play-overlay");s&&(s.style.opacity="1")}),t.addEventListener("mouseleave",()=>{const s=t.querySelector(".clip-play-overlay");s&&(s.style.opacity="0")}),t.addEventListener("click",()=>{const s=parseInt(t.dataset.clipId),o=ce.find(i=>i.id===s);o&&we(o)})})}catch{n.innerHTML='<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load clips</p>'}}}function we(n){var a,l,p,u,y,m;const e=document.getElementById("clip-modal-root")||document.body,t=c.getState().currentUser,s=(l=(a=t==null?void 0:t.roles)==null?void 0:a.includes)==null?void 0:l.call(a,"Admin"),o=t&&(t.userId===n.creatorId||t.id===n.creatorId);te.recordView(n.id).catch(()=>{});const i=document.createElement("div");i.className="modal-overlay",i.id="active-clip-modal",i.innerHTML=`
    <div class="clip-modal-box">
      <div class="clip-modal-header">
        <div style="display:flex;align-items:center;gap:10px;overflow:hidden;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;flex-shrink:0;">
            ${(n.creatorName||n.channelName||"C")[0].toUpperCase()}
          </div>
          <div style="overflow:hidden;">
            <h3 style="font-size:16px;color:#fff;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${H(n.title||"Highlight Clip")}</h3>
            <div style="font-size:12px;color:var(--color-text-muted);">
              Clipped by <strong style="color:var(--color-cyan-neon);">${H(n.creatorName||"Unknown")}</strong>
              ${n.channelName?`&middot; Channel: <strong>${H(n.channelName)}</strong>`:""}
            </div>
          </div>
        </div>
        <button id="close-clip-modal" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;cursor:pointer;">&times;</button>
      </div>
      <div class="clip-modal-video">
        <video id="clip-video-player" src="${n.videoUrl}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;background:#000;" onerror="this.style.display='none';document.getElementById('clip-video-error').style.display='flex';">
          Your browser does not support the video tag.
        </video>
        <div id="clip-video-error" style="display:none;position:absolute;inset:0;flex-direction:column;align-items:center;justify-content:center;background:var(--color-space-panel);padding:24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">&#127916;</div>
          <h4 style="color:var(--color-cyan-neon);margin-bottom:6px;">Clip Stream File Unavailable</h4>
          <p style="color:var(--color-text-muted);font-size:13px;max-width:420px;">
            The streaming media server hosting this clip (${n.videoUrl}) is currently offline or unreachable.
          </p>
        </div>
      </div>
      <div class="clip-modal-body">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;font-size:13px;color:var(--color-text-muted);">
            <span>${d.eye} <strong style="color:#fff;">${(n.viewCount||0)+1}</strong> views</span>
            ${n.durationSeconds?`<span>&middot; Duration: <strong style="color:#fff;">${Math.round(n.durationSeconds)}s</strong></span>`:""}
            ${n.categoryName?`<span class="badge-category">${H(n.categoryName)}</span>`:""}
          </div>
          <div class="clip-modal-actions">
            ${n.channelId?`<button id="clip-visit-channel" class="btn btn-cyan btn-sm">${d.rocket} Visit Channel</button>`:""}
            <button id="clip-share-btn" class="btn btn-outline btn-sm">${d.share} Share Clip</button>
            ${s||o?`<button id="clip-delete-btn" class="btn btn-danger btn-sm">${d.trash} Delete Clip</button>`:""}
          </div>
        </div>
      </div>
    </div>
  `,e.appendChild(i);const r=()=>{const v=i.querySelector("video");v&&v.pause(),i.remove()};(p=i.querySelector("#close-clip-modal"))==null||p.addEventListener("click",r),i.addEventListener("click",v=>{v.target===i&&r()}),(u=i.querySelector("#clip-visit-channel"))==null||u.addEventListener("click",()=>{r(),n.channelId&&c.navigate("channel",{channelId:n.channelId})}),(y=i.querySelector("#clip-share-btn"))==null||y.addEventListener("click",()=>{var k;const v=n.videoUrl||window.location.href;(k=navigator.clipboard)==null||k.writeText(v).then(()=>{c.showToast("Clip URL copied to clipboard!","success")}).catch(()=>{c.showToast("Clip URL: "+v,"info")})}),(m=i.querySelector("#clip-delete-btn"))==null||m.addEventListener("click",async()=>{if(confirm("Are you sure you want to delete this clip?"))try{await te.delete(n.id),c.showToast("Clip deleted successfully","info"),r(),ke()}catch(v){c.showToast(v.message||"Failed to delete clip","error")}})}function H(n){return n?n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}const fn={getChannelVods:n=>g(`/api/Vod/channel/${n}`),getVodWithChat:n=>g(`/api/Vod/${n}`),recordView:(n,e)=>g(`/api/Vod/${n}/view${e?"?sessionId="+e:""}`,{method:"POST"}),delete:n=>g(`/api/Vod/${n}`,{method:"DELETE"})};let Y="vods";function yn(){return`
    <div>
      <div class="channel-banner" id="ch-banner"><div class="channel-banner-overlay"></div></div>
      <div class="channel-profile" id="ch-profile">
        <div class="channel-avatar" id="ch-avatar"></div>
        <div class="channel-meta">
          <h1 id="ch-name">Loading...</h1>
          <p class="channel-desc" id="ch-desc"></p>
        </div>
        <div class="channel-actions">
          <button id="ch-follow-btn" class="btn btn-cyan btn-sm">${d.follow} Follow</button>
        </div>
      </div>

      <!-- Social Links -->
      <div id="ch-social" style="display:flex;gap:10px;margin:16px 0;padding-left:124px;"></div>

      <!-- Tabs -->
      <div class="tabs" style="margin-top:16px;">
        <button class="tab-btn ${Y==="vods"?"active":""}" data-tab="vods">Saved VODs</button>
        <button class="tab-btn ${Y==="clips"?"active":""}" data-tab="clips">Top Clips</button>
        <button class="tab-btn ${Y==="about"?"active":""}" data-tab="about">About</button>
      </div>

      <div id="ch-tab-content">
        <div class="spinner"></div>
      </div>
    </div>
  `}function bn(){const n=c.getState().viewParams,e=n==null?void 0:n.channelId;e&&(wn(e),document.querySelectorAll(".tab-btn").forEach(t=>{t.addEventListener("click",()=>{Y=t.dataset.tab,document.querySelectorAll(".tab-btn").forEach(s=>s.classList.remove("active")),t.classList.add("active"),Ge(e)})}))}async function wn(n){try{const e=await P.getById(n);document.getElementById("ch-name").innerHTML=`${e.name||e.channelName||"Channel"} ${d.checkCircle}`,document.getElementById("ch-desc").textContent=e.description||"";const t=document.getElementById("ch-banner");e.coverPhotoUrl&&t&&(t.style.background=`url(${e.coverPhotoUrl}) center/cover`);const s=document.getElementById("ch-avatar");s&&(s.innerHTML=e.profilePhotoUrl?`<img src="${e.profilePhotoUrl}" />`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#000;background:linear-gradient(135deg,#00AEBD,#00DDEE);">${(e.name||"C")[0].toUpperCase()}</div>`);const o=document.getElementById("ch-follow-btn");if(o){const i=c.isFollowing(n);o.className=`btn btn-sm follow-btn ${i?"following":"not-following"}`,o.innerHTML=i?`${d.followFilled} Following`:`${d.follow} Follow`,o.addEventListener("click",()=>{c.isFollowing(n)?(c.unfollowChannel(n),o.className="btn btn-sm follow-btn not-following",o.innerHTML=`${d.follow} Follow`):(c.followChannel(n,e.name||e.channelName),o.className="btn btn-sm follow-btn following",o.innerHTML=`${d.followFilled} Following`,c.showToast(`Following ${e.name}!`,"success"))})}try{const i=await P.getSocialLinks(n),r=document.getElementById("ch-social");if(r&&i){const a=Object.entries(i).filter(([l,p])=>p&&l!=="channelId");r.innerHTML=a.map(([l,p])=>`<a href="${p}" target="_blank" class="btn btn-ghost btn-sm" style="gap:4px;">${d.link} ${l}</a>`).join("")}}catch{}Ge(n)}catch{c.showToast("Failed to load channel","error")}}async function Ge(n){const e=document.getElementById("ch-tab-content");if(e)if(e.innerHTML='<div class="spinner"></div>',Y==="vods")try{const t=await fn.getChannelVods(n);if(!(t!=null&&t.length)){e.innerHTML='<div class="empty-state"><div class="empty-icon">&#128249;</div><h3>No Saved VODs</h3><p>This channel has no saved broadcasts yet.</p></div>';return}e.innerHTML=`<div class="streams-grid">${t.map(s=>`
        <div class="card vod-card hover-lift" data-vod-id="${s.id||s.streamId}">
          <div class="vod-thumb">
            <img src="${s.thumbnailUrl||"/cosmic_orbit_banner.png"}" alt="${s.title}" />
            <span class="vod-duration">${s.duration||""}</span>
          </div>
          <div class="vod-info">
            <div class="vod-title">${s.title||"Untitled VOD"}</div>
            <div class="vod-meta">${s.rewatchCount||0} views &middot; ${s.chatMessageCount||0} messages</div>
          </div>
        </div>
      `).join("")}</div>`}catch{e.innerHTML='<p class="text-muted text-center">Failed to load VODs</p>'}else if(Y==="clips")try{const t=await te.getChannelClips(n);if(!(t!=null&&t.length)){e.innerHTML='<div class="empty-state"><div class="empty-icon">&#127916;</div><h3>No Clips Yet</h3><p>No clips have been created for this channel.</p></div>';return}e.innerHTML=`<div class="clips-grid">${t.map(s=>`
        <div class="card clip-card hover-lift" data-clip-id="${s.id}">
          <div class="clip-thumb">
            <img src="${s.thumbnailUrl||"/cosmic_orbit_banner.png"}" alt="${s.title||"Clip"}" onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
            <span class="clip-views">${d.eye} ${s.viewCount||0}</span>
          </div>
          <div class="clip-info">
            <div class="clip-title">${s.title||"Untitled"}</div>
            <div class="clip-meta">by ${s.creatorName||s.creatorUsername||"Unknown"}</div>
          </div>
        </div>
      `).join("")}</div><div id="clip-modal-root"></div>`,e.querySelectorAll(".clip-card").forEach(s=>{s.addEventListener("click",()=>{const o=parseInt(s.dataset.clipId),i=t.find(r=>r.id===o);i&&we(i)})})}catch{e.innerHTML='<p class="text-muted text-center">Failed to load clips</p>'}else Y==="about"&&(e.innerHTML='<div class="card" style="padding:24px;"><p style="color:var(--color-text-muted);">Channel details and statistics coming soon.</p></div>')}const z={getSummary:()=>g("/api/Dashboard/summary"),getLiveManager:()=>g("/api/Dashboard/live-manager"),updateStreamMeta:n=>g("/api/Dashboard/stream/current",{method:"PATCH",body:JSON.stringify(n)}),endStream:()=>g("/api/Dashboard/stream/end",{method:"POST"}),getPastStreams:(n=1,e=10)=>g(`/api/Dashboard/streams?page=${n}&pageSize=${e}`),deleteVod:n=>g(`/api/Dashboard/vods/${n}`,{method:"DELETE"}),getModeration:()=>g("/api/Dashboard/moderation"),setEmojis:n=>g("/api/Dashboard/emojis/custom",{method:"PUT",body:JSON.stringify(n)}),getEmojis:()=>g("/api/Dashboard/emojis/custom"),getBadges:()=>g("/api/Dashboard/emojis/badges")};let U="overview",fe=null,q=!1;function xn(){return c.getState().currentUser?`
    <div class="studio-layout" style="margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <aside class="studio-sidebar">
        <div style="padding:16px 14px 8px;font-size:11px;font-weight:700;color:var(--color-cyan-primary);letter-spacing:0.1em;text-transform:uppercase;">Creator Studio</div>
        <button class="studio-sidebar-btn ${U==="overview"?"active":""}" data-tab="overview"><span class="tab-icon">&#128200;</span><span class="tab-label">Overview</span></button>
        <button class="studio-sidebar-btn ${U==="channel"?"active":""}" data-tab="channel"><span class="tab-icon">&#128225;</span><span class="tab-label">Channel Setup</span></button>
        <button class="studio-sidebar-btn ${U==="broadcast"?"active":""}" data-tab="broadcast"><span class="tab-icon">&#128308;</span><span class="tab-label">Stream Manager</span></button>
        <button class="studio-sidebar-btn ${U==="analytics"?"active":""}" data-tab="analytics"><span class="tab-icon">&#128202;</span><span class="tab-label">Analytics</span></button>
        <button class="studio-sidebar-btn ${U==="vods"?"active":""}" data-tab="vods"><span class="tab-icon">&#128249;</span><span class="tab-label">VOD Archive</span></button>
        <button class="studio-sidebar-btn ${U==="moderation"?"active":""}" data-tab="moderation"><span class="tab-icon">&#128737;</span><span class="tab-label">Moderation</span></button>
        <button class="studio-sidebar-btn ${U==="emotes"?"active":""}" data-tab="emotes"><span class="tab-icon">&#128578;</span><span class="tab-label">Emotes & Badges</span></button>
      </aside>
      <main class="studio-workspace" id="studio-workspace">
        <div class="spinner"></div>
      </main>
    </div>
  `:'<div class="empty-state"><div class="empty-icon">&#128274;</div><h3>Login Required</h3><p>Please log in to access Creator Studio.</p><button id="studio-login" class="btn btn-primary">Login</button></div>'}function _n(){var n;(n=document.getElementById("studio-login"))==null||n.addEventListener("click",()=>c.navigate("login")),document.querySelectorAll(".studio-sidebar-btn").forEach(e=>{e.addEventListener("click",()=>{U=e.dataset.tab,document.querySelectorAll(".studio-sidebar-btn").forEach(t=>t.classList.remove("active")),e.classList.add("active"),xe()})}),Cn()}async function Cn(){try{fe=await P.getMyChannel(),q=!0}catch{q=!1}xe()}async function xe(){var e;const n=document.getElementById("studio-workspace");if(n){if(!q&&U!=="channel"){n.innerHTML=`
      <div class="empty-state" style="max-width:500px;margin:40px auto;">
        <div class="empty-icon">&#128225;</div>
        <h3>Create Your Channel First</h3>
        <p>You need a channel before you can stream. Set up your channel identity to get started.</p>
        <button id="ws-create-ch" class="btn btn-cyan">Create Channel</button>
      </div>`,(e=document.getElementById("ws-create-ch"))==null||e.addEventListener("click",()=>{U="channel",document.querySelectorAll(".studio-sidebar-btn").forEach(t=>{t.classList.remove("active"),t.dataset.tab==="channel"&&t.classList.add("active")}),xe()});return}switch(U){case"overview":await Sn(n);break;case"channel":kn(n);break;case"broadcast":await $n(n);break;case"analytics":await En(n);break;case"vods":await Ye(n);break;case"moderation":await Tn(n);break;case"emotes":await Ln(n);break;default:n.innerHTML="<p>Select a tab</p>"}}}async function Sn(n){n.innerHTML='<div class="spinner"></div>';try{const e=await z.getSummary(),t=e.channelProfile||fe||{},s=e.lifetimeStats||{},o=e.liveManager;n.innerHTML=`
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">Dashboard Overview</h2>
      ${o?`<div class="card" style="padding:20px;margin-bottom:20px;border-color:var(--color-live-red);"><div style="display:flex;align-items:center;gap:12px;"><span class="badge-live" style="font-size:14px;padding:4px 12px;">LIVE NOW</span><span style="font-size:16px;font-weight:600;">${o.title||"Broadcasting"}</span><span class="text-muted">${o.viewerCount||0} viewers</span></div></div>`:""}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
        <div class="stat-card animate-fade-up"><div class="stat-label">Total Streams</div><div class="stat-value">${s.totalStreams||0}</div></div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.1s;"><div class="stat-label">Peak Viewers</div><div class="stat-value">${s.peakViewers||0}</div></div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.2s;"><div class="stat-label">Total Chat Messages</div><div class="stat-value">${s.totalChatMessages||0}</div></div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.3s;"><div class="stat-label">Total Clips</div><div class="stat-value">${s.totalClips||0}</div></div>
      </div>
      <div class="chart-container" style="margin-bottom:20px;">
        <h4>Viewer Activity (Last 7 Streams)</h4>
        <div class="mini-chart" style="height:120px;align-items:flex-end;gap:6px;padding:16px 0;">
          ${ue(7,s.peakViewers||50)}
        </div>
      </div>
      <div class="card" style="padding:20px;">
        <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Channel Info</h4>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#000;overflow:hidden;">${t.profilePhotoUrl?`<img src="${t.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(t.name||"C")[0].toUpperCase()}</div>
          <div><div style="font-weight:600;">${t.name||t.channelName||"Your Channel"}</div><div style="font-size:13px;color:var(--color-text-muted);">${t.description||"No description"}</div></div>
        </div>
      </div>
    `}catch{n.innerHTML='<div class="empty-state"><h3>Failed to load dashboard</h3></div>'}}function kn(n){var t,s,o,i;const e=fe||{};n.innerHTML=`
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${q?"Channel Settings":"Create Your Channel"}</h2>
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <form id="ch-setup-form">
        <div class="form-group"><label style="color:var(--color-text-muted);">Channel Name</label><input class="input-dark" id="ch-name" value="${e.name||e.channelName||""}" placeholder="Your channel name" required /></div>
        <div class="form-group"><label style="color:var(--color-text-muted);">Description</label><textarea class="input-dark" id="ch-desc" rows="3" placeholder="Tell viewers about your channel" style="resize:vertical;padding:12px;height:auto;border-radius:12px;">${e.description||""}</textarea></div>
        <button type="submit" class="btn btn-cyan" id="ch-save-btn">${q?"Save Changes":"Create Channel"}</button>
      </form>
    </div>
    ${q?`
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Channel Images</h4>
      <div style="display:flex;gap:16px;">
        <label class="btn btn-outline btn-sm" style="cursor:pointer;">${d.image} Upload Profile Photo<input type="file" id="ch-photo-upload" accept="image/*" style="display:none;" /></label>
        <label class="btn btn-outline btn-sm" style="cursor:pointer;">${d.image} Upload Cover<input type="file" id="ch-cover-upload" accept="image/*" style="display:none;" /></label>
      </div>
    </div>
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Social Links</h4>
      <form id="social-form">
        <div class="form-row"><div class="form-group"><label style="color:var(--color-text-muted);">YouTube</label><input class="input-dark" id="sl-youtube" placeholder="https://youtube.com/..." /></div><div class="form-group"><label style="color:var(--color-text-muted);">Twitter/X</label><input class="input-dark" id="sl-twitter" placeholder="https://x.com/..." /></div></div>
        <div class="form-row"><div class="form-group"><label style="color:var(--color-text-muted);">Instagram</label><input class="input-dark" id="sl-instagram" placeholder="https://instagram.com/..." /></div><div class="form-group"><label style="color:var(--color-text-muted);">Discord</label><input class="input-dark" id="sl-discord" placeholder="https://discord.gg/..." /></div></div>
        <button type="submit" class="btn btn-outline btn-sm" style="margin-top:8px;">${d.link} Save Social Links</button>
      </form>
    </div>
    `:""}
  `,(t=document.getElementById("ch-setup-form"))==null||t.addEventListener("submit",async r=>{r.preventDefault();const a=document.getElementById("ch-save-btn");a.disabled=!0;try{q?(await P.updateProfile({channelName:document.getElementById("ch-name").value,description:document.getElementById("ch-desc").value}),c.showToast("Channel updated!","success")):(fe=await P.create({channelName:document.getElementById("ch-name").value,description:document.getElementById("ch-desc").value}),q=!0,c.showToast("Channel created! You can now stream.","success"),xe())}catch(l){c.showToast(l.message||"Failed","error")}a.disabled=!1}),(s=document.getElementById("ch-photo-upload"))==null||s.addEventListener("change",async r=>{if(r.target.files[0])try{await P.uploadPhoto(r.target.files[0]),c.showToast("Photo uploaded!","success")}catch(a){c.showToast(a.message,"error")}}),(o=document.getElementById("ch-cover-upload"))==null||o.addEventListener("change",async r=>{if(r.target.files[0])try{await P.uploadCover(r.target.files[0]),c.showToast("Cover uploaded!","success")}catch(a){c.showToast(a.message,"error")}}),(i=document.getElementById("social-form"))==null||i.addEventListener("submit",async r=>{r.preventDefault();try{await P.updateSocialLinks({youtubeUrl:document.getElementById("sl-youtube").value,twitterUrl:document.getElementById("sl-twitter").value,instagramUrl:document.getElementById("sl-instagram").value,discordUrl:document.getElementById("sl-discord").value}),c.showToast("Social links saved!","success")}catch(a){c.showToast(a.message,"error")}})}async function $n(n){var t,s,o,i,r;n.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">Stream Manager</h2>
        <p style="color:var(--color-text-muted);margin:0;font-size:14px;">Configure OBS Studio and broadcast live to your Orbit channel.</p>
      </div>
      <div id="streaming-server-status" style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--color-text-muted);">
        <span style="width:8px;height:8px;border-radius:50%;background:#888;"></span> Checking Streaming Server...
      </div>
    </div>

    <!-- OBS Settings & Ingest Card Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:20px;margin-bottom:24px;">
      <!-- Stream Connection Info -->
      <div class="card" style="padding:24px;border-color:rgba(0,242,254,0.25);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="color:var(--color-cyan-neon);font-size:18px;">${d.live}</span>
          <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--color-text);">OBS Connection Settings</h4>
        </div>

        <!-- RTMP Server URL -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">
            RTMP SERVER (OBS "Server" field)
          </label>
          <div style="display:flex;gap:8px;">
            <input class="input-dark" id="rtmp-url-display" type="text" value="rtmp://localhost:1935/live" readonly style="flex:1;font-family:monospace;font-size:13px;color:var(--color-cyan-neon);background:rgba(0,0,0,0.4);" />
            <button id="copy-rtmp" class="btn btn-ghost btn-sm" title="Copy RTMP URL" style="border:1px solid rgba(255,255,255,0.1);">${d.copy}</button>
          </div>
          <span style="display:block;font-size:11px;color:var(--color-text-muted);margin-top:4px;">
            In OBS: <b>Service</b> &rarr; <b>Custom...</b> &bull; <b>Server</b> &rarr; paste this URL
          </span>
        </div>

        <!-- Stream Key -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">
            STREAM KEY (OBS "Stream Key" field)
          </label>
          <div style="display:flex;gap:8px;">
            <input class="input-dark" id="stream-key-display" type="password" value="Loading..." readonly style="flex:1;font-family:monospace;font-size:13px;background:rgba(0,0,0,0.4);" />
            <button id="toggle-key" class="btn btn-ghost btn-sm" title="Show/Hide Key" style="border:1px solid rgba(255,255,255,0.1);">${d.eyeClosed}</button>
            <button id="copy-key" class="btn btn-ghost btn-sm" title="Copy Stream Key" style="border:1px solid rgba(255,255,255,0.1);">${d.copy}</button>
          </div>
        </div>

        <button id="gen-key" class="btn btn-outline btn-sm btn-full" style="gap:8px;">
          ${d.refresh} Generate New Key
        </button>
      </div>

      <!-- Go Live Stream Metadata -->
      <div class="card" style="padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="color:var(--color-live-red);font-size:18px;">${d.video}</span>
          <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--color-text);">Stream Session Details</h4>
        </div>
        <form id="go-live-form">
          <div class="form-group" style="margin-bottom:12px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">STREAM TITLE</label>
            <input class="input-dark" id="go-title" placeholder="e.g., Chill Late Night Gaming & Chat" required style="margin-top:4px;" />
          </div>
          <div class="form-group" style="margin-bottom:16px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">DESCRIPTION (OPTIONAL)</label>
            <input class="input-dark" id="go-desc" placeholder="What's this stream about?" style="margin-top:4px;" />
          </div>
          <button type="submit" class="btn btn-cyan btn-full" id="go-live-btn" style="padding:10px 16px;font-weight:700;">
            ${d.rocket} Create Stream Session
          </button>
        </form>
      </div>
    </div>

    <!-- Quick OBS Setup Guide Card -->
    <div class="card" style="padding:20px 24px;margin-bottom:24px;background:rgba(18,20,32,0.6);border:1px dashed rgba(0,242,254,0.3);">
      <h4 style="margin:0 0 12px 0;font-size:14px;color:var(--color-cyan-neon);display:flex;align-items:center;gap:8px;">
        ${d.settings} How to Stream with OBS Studio
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;font-size:13px;color:var(--color-text-muted);">
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">1. Generate or copy your Stream Key</strong>
          Press <code style="color:var(--color-cyan-neon);background:rgba(0,0,0,0.4);padding:2px 6px;border-radius:4px;">Generate New Key</code> shown above and copy it.
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">2. Configure OBS Stream</strong>
          In OBS: <b>Settings &rarr; Stream &rarr; Service: Custom...</b><br>
          Paste <b>Server:</b> <code style="color:var(--color-cyan-neon);">rtmp://localhost:1935/live</code>
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">3. Paste Key & Go Live</strong>
          Paste your <b>Stream Key</b> into OBS and click <b>Start Streaming</b> in OBS!
        </div>
      </div>
    </div>

    <div id="live-manager-section"></div>
  `;const e=document.getElementById("streaming-server-status");if(e)try{if((await fetch("http://localhost:8080/health",{method:"GET",mode:"cors"})).ok)e.innerHTML=`
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
          <span style="color:#10b981;">Streaming Server ONLINE</span>
        `,e.style.borderColor="rgba(16,185,129,0.3)",e.style.background="rgba(16,185,129,0.08)";else throw new Error("Server returned non-200")}catch{e.innerHTML=`
        <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></span>
        <span style="color:#f59e0b;">Streaming Server OFFLINE (run start-server.bat)</span>
      `,e.style.borderColor="rgba(245,158,11,0.3)",e.style.background="rgba(245,158,11,0.08)"}(t=document.getElementById("copy-rtmp"))==null||t.addEventListener("click",()=>{const a=document.getElementById("rtmp-url-display");a&&(navigator.clipboard.writeText(a.value),c.showToast("RTMP URL copied! Paste into OBS Server field.","success"))});try{const a=await Z.getStreamKey(),l=document.getElementById("stream-key-display");if(l&&a&&(l.value=a.streamKey||a.key||"No key generated",a.rtmpUrl)){const p=document.getElementById("rtmp-url-display");p&&(p.value=a.rtmpUrl)}}catch{const l=document.getElementById("stream-key-display");l&&(l.value="No key yet")}(s=document.getElementById("toggle-key"))==null||s.addEventListener("click",()=>{const a=document.getElementById("stream-key-display"),l=document.getElementById("toggle-key");if(a){const p=a.type==="password";a.type=p?"text":"password",l&&(l.innerHTML=p?d.eye:d.eyeClosed)}}),(o=document.getElementById("copy-key"))==null||o.addEventListener("click",()=>{const a=document.getElementById("stream-key-display");a&&(navigator.clipboard.writeText(a.value),c.showToast("Stream key copied! Keep it secret.","success"))}),(i=document.getElementById("gen-key"))==null||i.addEventListener("click",async()=>{try{const a=await Z.generateStreamKey(),l=document.getElementById("stream-key-display");if(l&&(l.value=a.streamKey||a.key||""),a.rtmpUrl){const p=document.getElementById("rtmp-url-display");p&&(p.value=a.rtmpUrl)}c.showToast("New stream key generated!","success")}catch(a){c.showToast(a.message,"error")}}),(r=document.getElementById("go-live-form"))==null||r.addEventListener("submit",async a=>{a.preventDefault();const l=document.getElementById("go-live-btn");l.disabled=!0;try{await Z.createStream({title:document.getElementById("go-title").value,description:document.getElementById("go-desc").value}),c.showToast('Stream session ready! Click "Start Streaming" in OBS.',"success"),$e()}catch(p){c.showToast(p.message,"error")}l.disabled=!1}),$e()}async function $e(){var e;const n=document.getElementById("live-manager-section");if(n)try{const t=await z.getLiveManager();if(!t){n.innerHTML='<div class="card" style="padding:20px;text-align:center;color:var(--color-text-muted);">You are currently offline. Create a stream session and start broadcasting!</div>';return}n.innerHTML=`
      <div class="card" style="padding:24px;border-color:var(--color-live-red);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:12px;"><span class="badge-live" style="font-size:14px;padding:4px 14px;">LIVE</span><h3 style="font-size:18px;">${t.title||"Broadcasting"}</h3></div>
          <button id="end-stream-btn" class="btn btn-danger btn-sm">${d.x} End Stream</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          <div class="stat-card"><div class="stat-label">Viewers</div><div class="stat-value">${t.viewerCount||0}</div></div>
          <div class="stat-card"><div class="stat-label">Duration</div><div class="stat-value">${t.duration||"0:00"}</div></div>
          <div class="stat-card"><div class="stat-label">Chat Messages</div><div class="stat-value">${t.chatMessageCount||0}</div></div>
        </div>
      </div>
    `,(e=document.getElementById("end-stream-btn"))==null||e.addEventListener("click",async()=>{if(confirm("Are you sure you want to end the stream?"))try{await z.endStream(),c.showToast("Stream ended.","info"),$e()}catch(s){c.showToast(s.message,"error")}})}catch{n.innerHTML=""}}async function En(n){n.innerHTML='<div class="spinner"></div>';try{const t=(await z.getSummary()).lifetimeStats||{};n.innerHTML=`
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${d.chart} Analytics & Insights</h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
        <div class="stat-card"><div class="stat-label">Total Streams</div><div class="stat-value">${t.totalStreams||0}</div></div>
        <div class="stat-card"><div class="stat-label">Peak Viewers</div><div class="stat-value">${t.peakViewers||0}</div></div>
        <div class="stat-card"><div class="stat-label">Total Watch Time</div><div class="stat-value">${t.totalWatchTimeHours||0}h</div></div>
        <div class="stat-card"><div class="stat-label">Avg Viewers</div><div class="stat-value">${t.avgViewers||0}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="chart-container"><h4>Viewer Trend</h4><div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;">${ue(12,t.peakViewers||100)}</div></div>
        <div class="chart-container"><h4>Chat Activity</h4><div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;">${ue(12,t.totalChatMessages||500)}</div></div>
      </div>
      <div class="chart-container"><h4>Stream Duration History</h4><div class="mini-chart" style="height:100px;gap:6px;padding:16px 0;">${ue(20,180)}</div></div>
    `}catch{n.innerHTML='<div class="empty-state"><h3>Analytics unavailable</h3></div>'}}async function Ye(n){n.innerHTML='<div class="spinner"></div>';try{const e=await z.getPastStreams(1,20),t=Array.isArray(e)?e:(e==null?void 0:e.items)||[];if(!t.length){n.innerHTML='<div class="empty-state"><div class="empty-icon">&#128249;</div><h3>No Past Streams</h3><p>Your broadcast archive is empty.</p></div>';return}n.innerHTML=`
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${d.archive} Broadcast Archive</h2>
      <table class="data-table">
        <thead><tr><th>Title</th><th>Date</th><th>Duration</th><th>Peak Viewers</th><th>Actions</th></tr></thead>
        <tbody>${t.map(s=>`
          <tr>
            <td style="font-weight:500;">${s.title||"Untitled"}</td>
            <td style="color:var(--color-text-muted);">${s.startedAt?new Date(s.startedAt).toLocaleDateString():"-"}</td>
            <td>${s.duration||"-"}</td>
            <td>${s.peakViewers||0}</td>
            <td>${s.vodId?`<button class="btn btn-ghost btn-sm" data-del-vod="${s.vodId}">${d.trash}</button>`:"-"}</td>
          </tr>
        `).join("")}</tbody>
      </table>
    `,n.querySelectorAll("[data-del-vod]").forEach(s=>{s.addEventListener("click",async()=>{if(confirm("Delete this VOD?"))try{await z.deleteVod(parseInt(s.dataset.delVod)),c.showToast("VOD deleted","info"),Ye(n)}catch(o){c.showToast(o.message,"error")}})})}catch{n.innerHTML='<div class="empty-state"><h3>Failed to load archives</h3></div>'}}async function Tn(n){var e;n.innerHTML=`
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${d.shield} Moderation & Team</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="card" style="padding:24px;">
        <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:16px;">Hire Moderator</h4>
        <div style="display:flex;gap:8px;">
          <input class="input-dark" id="mod-username" placeholder="Enter username" style="flex:1;" />
          <button id="hire-mod-btn" class="btn btn-cyan btn-sm">Hire</button>
        </div>
      </div>
      <div class="card" style="padding:24px;" id="mod-summary-card">
        <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Moderation Overview</h4>
        <div class="spinner" style="margin:0;width:24px;height:24px;"></div>
      </div>
    </div>
    <div class="card" style="padding:24px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:16px;">Current Moderators</h4>
      <div id="mod-list"><div class="spinner" style="margin:0;width:24px;height:24px;"></div></div>
    </div>
  `,(e=document.getElementById("hire-mod-btn"))==null||e.addEventListener("click",async()=>{const t=document.getElementById("mod-username").value.trim();if(t)try{await P.hireModerator(t),c.showToast(`${t} is now a moderator!`,"success"),Ee(),document.getElementById("mod-username").value=""}catch(s){c.showToast(s.message,"error")}}),Ee(),In()}async function Ee(){const n=document.getElementById("mod-list");if(n)try{const e=await P.getModerators();if(!(e!=null&&e.length)){n.innerHTML='<p class="text-muted">No moderators yet</p>';return}n.innerHTML=e.map(t=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#34C759,#30D158);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#000;">${(t.username||"M")[0].toUpperCase()}</div>
          <span style="font-weight:500;">${t.username||"Moderator"}</span>
          <span class="badge-role mod">MOD</span>
        </div>
        <button class="btn btn-ghost btn-sm" data-remove-mod="${t.username}" style="color:var(--color-error);">${d.x} Remove</button>
      </div>
    `).join(""),n.querySelectorAll("[data-remove-mod]").forEach(t=>{t.addEventListener("click",async()=>{try{await P.removeModerator(t.dataset.removeMod),c.showToast("Moderator removed","info"),Ee()}catch(s){c.showToast(s.message,"error")}})})}catch{n.innerHTML='<p class="text-muted">Failed to load moderators</p>'}}async function In(){const n=document.getElementById("mod-summary-card");if(n)try{const e=await z.getModeration();n.innerHTML=`
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Moderation Overview</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div><div style="font-size:24px;font-weight:700;color:var(--color-cyan-neon);">${e.moderatorCount||0}</div><div style="font-size:11px;color:var(--color-text-muted);">Moderators</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-error);">${e.activeBanCount||0}</div><div style="font-size:11px;color:var(--color-text-muted);">Active Bans</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-warning);">${e.activeTimeoutCount||0}</div><div style="font-size:11px;color:var(--color-text-muted);">Timeouts</div></div>
      </div>
    `}catch{n.innerHTML='<h4 style="color:var(--color-text-muted);">Moderation Overview</h4><p class="text-muted">Unavailable</p>'}}async function Ln(n){n.innerHTML=`
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${d.emoji} Emotes & Badges</h2>
    <div class="card" style="padding:24px;margin-bottom:20px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Platform Badges</h4>
      <div id="badges-list"><div class="spinner" style="margin:0;width:24px;height:24px;"></div></div>
    </div>
    <div class="card" style="padding:24px;">
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Custom Emojis</h4>
      <div id="emojis-list"><div class="spinner" style="margin:0;width:24px;height:24px;"></div></div>
    </div>
  `;try{const e=await z.getBadges(),t=document.getElementById("badges-list");t&&e&&(t.innerHTML=`<div style="display:flex;gap:20px;">${Object.entries(e).filter(([s])=>s!=="channelId").map(([s,o])=>`<div style="text-align:center;"><div style="font-size:32px;">${o}</div><div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">${s}</div></div>`).join("")}</div>`)}catch{}try{const e=await z.getEmojis(),t=document.getElementById("emojis-list");t&&(e!=null&&e.length?t.innerHTML=e.map(s=>`<span style="font-size:24px;margin:4px;" title="${s.code}">${s.emoji||s.code}</span>`).join(""):t.innerHTML='<p class="text-muted">No custom emojis configured</p>')}catch{}}function ue(n,e){return Array.from({length:n},()=>`<div class="mini-chart-bar" style="height:${Math.max(8,Math.random()*100)}%;flex:1;opacity:${.5+Math.random()*.5};animation-delay:${Math.random()*.5}s;"></div>`).join("")}const ze={uploadPicture:n=>{const e=new FormData;return e.append("file",n),g("/api/user-profile/picture",{method:"POST",body:e})},removePicture:()=>g("/api/user-profile/picture",{method:"DELETE"}),getPublicProfile:n=>g(`/api/user-profile/${n}`)};function Mn(){const n=c.getState().currentUser;return n?`
    <div style="max-width:600px;margin:0 auto;">
      <div class="card" style="padding:32px;text-align:center;margin-bottom:24px;">
        <div style="width:100px;height:100px;border-radius:50%;margin:0 auto 16px;overflow:hidden;border:3px solid var(--color-cyan-primary);background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#000;" id="profile-avatar">
          ${n.profilePictureUrl?`<img src="${n.profilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(n.fullName||n.username||"U")[0].toUpperCase()}
        </div>
        <h2 style="font-size:22px;margin-bottom:4px;">${n.fullName||n.username}</h2>
        <p style="color:var(--color-cyan-primary);font-size:14px;margin-bottom:4px;">@${n.username||""}</p>
        <p style="color:var(--color-text-muted);font-size:13px;">${n.email||""}</p>
        <div style="margin-top:16px;display:flex;justify-content:center;gap:10px;">
          <label class="btn btn-outline btn-sm" style="cursor:pointer;">
            ${d.upload} Upload Photo
            <input type="file" id="profile-upload" accept="image/*" style="display:none;" />
          </label>
          <button id="profile-remove-pic" class="btn btn-ghost btn-sm">${d.trash} Remove</button>
        </div>
      </div>

      <div class="card" style="padding:24px;">
        <h3 style="font-size:16px;margin-bottom:16px;color:var(--color-cyan-neon);">Account Info</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><span style="font-size:12px;color:var(--color-text-muted);">Username</span><p>${n.username||"-"}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Full Name</span><p>${n.fullName||"-"}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Email</span><p>${n.email||"-"}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Age</span><p>${n.age||"-"}</p></div>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;">
        <button id="profile-logout" class="btn btn-danger btn-full">${d.logout} Log Out</button>
      </div>
    </div>
  `:'<div class="empty-state"><h3>Not logged in</h3></div>'}function Bn(){var n,e,t;(n=document.getElementById("profile-upload"))==null||n.addEventListener("change",async s=>{const o=s.target.files[0];if(o)try{const i=await ze.uploadPicture(o);c.showToast("Profile picture updated!","success");const r={...c.getState().currentUser,profilePictureUrl:i.profilePictureUrl||i.url};J(r),c.setCurrentUser(r)}catch(i){c.showToast(i.message||"Upload failed","error")}}),(e=document.getElementById("profile-remove-pic"))==null||e.addEventListener("click",async()=>{try{await ze.removePicture();const s={...c.getState().currentUser,profilePictureUrl:null};J(s),c.setCurrentUser(s),c.showToast("Profile picture removed","info")}catch(s){c.showToast(s.message||"Failed","error")}}),(t=document.getElementById("profile-logout"))==null||t.addEventListener("click",async()=>{try{await oe.revokeToken()}catch{}ye(),J(null),c.setCurrentUser(null),c.navigate("splash"),c.showToast("Logged out","info")})}let b="all",Xe={channels:[],categories:[],streams:[],clips:[]};function Pn(){var e;const n=((e=c.getState().viewParams)==null?void 0:e.query)||"";return`<div>
    <div style="margin-bottom:24px;">
      <div style="display:flex;gap:12px;max-width:700px;align-items:center;">
        <div class="search-bar" style="flex:1;height:48px;">
          ${d.search}
          <input type="text" id="search-input" placeholder="Search channels, categories, streams, clips..." value="${E(n)}" autofocus style="font-size:16px;" />
        </div>
        <button id="search-submit-btn" class="btn btn-cyan btn-sm" style="height:48px;padding:0 24px;">Search</button>
      </div>
      <!-- Filter pills -->
      <div style="display:flex;gap:8px;margin-top:16px;overflow-x:auto;" id="search-filter-pills">
        <button class="cat-pill ${b==="all"?"active":""}" data-filter="all" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${b==="all"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${b==="all"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">All Results</button>
        <button class="cat-pill ${b==="channels"?"active":""}" data-filter="channels" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${b==="channels"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${b==="channels"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Channels</button>
        <button class="cat-pill ${b==="categories"?"active":""}" data-filter="categories" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${b==="categories"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${b==="categories"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Categories</button>
        <button class="cat-pill ${b==="streams"?"active":""}" data-filter="streams" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${b==="streams"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${b==="streams"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Live Streams</button>
        <button class="cat-pill ${b==="clips"?"active":""}" data-filter="clips" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${b==="clips"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${b==="clips"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Clips</button>
      </div>
    </div>
    <div id="search-results"></div>
    <div id="clip-modal-root"></div>
  </div>`}function An(){var o;const n=document.getElementById("search-input"),e=document.getElementById("search-submit-btn"),t=(o=c.getState().viewParams)==null?void 0:o.query;t&&de(t);let s;n==null||n.addEventListener("input",()=>{clearTimeout(s),s=setTimeout(()=>{const i=n.value.trim();i&&de(i)},350)}),n==null||n.addEventListener("keydown",i=>{if(i.key==="Enter"){clearTimeout(s);const r=n.value.trim();r&&de(r)}}),e==null||e.addEventListener("click",()=>{var r;const i=(r=n==null?void 0:n.value)==null?void 0:r.trim();i&&de(i)}),document.querySelectorAll("#search-filter-pills [data-filter]").forEach(i=>{i.addEventListener("click",()=>{var r;b=i.dataset.filter,document.querySelectorAll("#search-filter-pills [data-filter]").forEach(a=>{const l=a.dataset.filter===b;a.style.background=l?"var(--color-cyan-primary)":"var(--color-space-slate)",a.style.color=l?"#000":"#fff"}),Qe(((r=n==null?void 0:n.value)==null?void 0:r.trim())||t||"")})})}async function de(n){const e=document.getElementById("search-results");if(e){e.innerHTML='<div class="spinner"></div>';try{const[t,s,o,i]=await Promise.allSettled([P.search(n),I.search(n),Z.getLiveStreams(),te.getTop(30)]);let r=t.status==="fulfilled"&&Array.isArray(t.value)?t.value:[],a=s.status==="fulfilled"&&Array.isArray(s.value)?s.value:[];const l=o.status==="fulfilled"&&Array.isArray(o.value)?o.value:[],p=l.filter(m=>m.title&&m.title.toLowerCase().includes(n.toLowerCase())||m.streamerName&&m.streamerName.toLowerCase().includes(n.toLowerCase())||m.categoryName&&m.categoryName.toLowerCase().includes(n.toLowerCase()));if(!r.length&&l.length){const m=new Set;r=l.filter(v=>v.channelName&&v.channelName.toLowerCase().includes(n.toLowerCase())||v.streamerName&&v.streamerName.toLowerCase().includes(n.toLowerCase())).filter(v=>m.has(v.channelId)?!1:(m.add(v.channelId),!0)).map(v=>({id:v.channelId,channelName:v.channelName||v.streamerName,description:`Live streamer in ${v.categoryName||"Orbit"}`,profilePhotoUrl:v.profilePictureUrl,ownerUsername:v.streamerName,isLive:!0,viewerCount:v.viewerCount||0,categoryName:v.categoryName}))}const y=(i.status==="fulfilled"&&Array.isArray(i.value)?i.value:[]).filter(m=>m.title&&m.title.toLowerCase().includes(n.toLowerCase())||m.creatorName&&m.creatorName.toLowerCase().includes(n.toLowerCase())||m.channelName&&m.channelName.toLowerCase().includes(n.toLowerCase()));Xe={channels:r,categories:a,streams:p,clips:y},Qe(n)}catch{e.innerHTML='<p class="text-muted">Search failed. Please try again.</p>'}}}function Qe(n){const e=document.getElementById("search-results");if(!e)return;const{channels:t,categories:s,streams:o,clips:i}=Xe,r=(b==="all"||b==="channels")&&t.length>0,a=(b==="all"||b==="categories")&&s.length>0,l=(b==="all"||b==="streams")&&o.length>0,p=(b==="all"||b==="clips")&&i.length>0;if((b==="all"?t.length+s.length+o.length+i.length:b==="channels"?t.length:b==="categories"?s.length:b==="streams"?o.length:i.length)===0){e.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">&#128269;</div>
        <h3>No Results for "${E(n)}"</h3>
        <p>No matching ${b==="all"?"channels, categories, or broadcasts":b} found. Try searching with different keywords.</p>
      </div>`;return}let y="";r&&(y+=`
      <div style="margin-bottom:32px;">
        <div class="section-title">${d.video} Streamer Channels (${t.length})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
          ${t.map(m=>`
            <div class="channel-search-card" data-channel-id="${m.id}">
              <div class="channel-search-avatar">
                ${m.profilePhotoUrl?`<img src="${m.profilePhotoUrl}" alt="${E(m.channelName)}" onerror="this.src='/Orbit_logo.png';" />`:(m.channelName||"C")[0].toUpperCase()}
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-weight:700;color:#fff;font-size:15px;" class="truncate">${E(m.channelName)}</span>
                  ${d.checkCircle}
                  ${m.isLive?'<span class="badge-live" style="margin-left:auto;">LIVE</span>':""}
                </div>
                <div style="font-size:12px;color:var(--color-cyan-primary);margin-top:2px;">@${E(m.ownerUsername||"streamer")}</div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;" class="truncate">${E(m.description||"Broadcasting live on Orbit")}</div>
              </div>
              <button class="btn btn-outline btn-sm btn-view-channel" data-cid="${m.id}" style="flex-shrink:0;">View</button>
            </div>
          `).join("")}
        </div>
      </div>
    `),l&&(y+=`
      <div style="margin-bottom:32px;">
        <div class="section-title"><span style="color:var(--color-live-red);">&#9679;</span> Live Broadcasts (${o.length})</div>
        <div class="streams-grid">
          ${o.map(m=>`
            <div class="card stream-card hover-lift" data-stream-id="${m.id}">
              <div class="stream-thumb">
                <img src="${m.thumbnailUrl||"/cosmic_orbit_banner.png"}" alt="${E(m.title)}" />
                <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;">
                  <span class="badge-live">LIVE</span>
                  <span class="badge-viewers">${d.eye} ${m.viewerCount||0}</span>
                </div>
                ${m.categoryName?`<span class="badge-category" style="position:absolute;top:10px;right:10px;">${E(m.categoryName)}</span>`:""}
              </div>
              <div class="stream-info">
                <div class="streamer-row">
                  <div class="streamer-avatar">${m.profilePictureUrl?`<img src="${m.profilePictureUrl}" />`:(m.streamerName||"S")[0].toUpperCase()}</div>
                  <div style="flex:1;overflow:hidden;">
                    <div class="streamer-name">${E(m.streamerName||"Streamer")} ${d.checkCircle}</div>
                    <div style="font-size:12px;color:var(--color-cyan-primary);">${E(m.categoryName||"General")}</div>
                  </div>
                </div>
                <div class="stream-title">${E(m.title||"Live Stream")}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `),a&&(y+=`
      <div style="margin-bottom:32px;">
        <div class="section-title">${d.grid} Categories (${s.length})</div>
        <div class="categories-grid">
          ${s.map(m=>`
            <div class="card category-card hover-lift" data-slug="${m.slug}">
              <div class="cat-thumb">
                ${m.imageUrl?`<img src="${m.imageUrl}" alt="${E(m.name)}" />`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-gradient-card);">&#127918;</div>'}
              </div>
              <div class="cat-info">
                <div class="cat-name">${E(m.name)}</div>
                ${m.totalViewers?`<div class="cat-viewers">${m.totalViewers} viewers</div>`:""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `),p&&(y+=`
      <div style="margin-bottom:32px;">
        <div class="section-title">${d.clip} Clips (${i.length})</div>
        <div class="clips-grid">
          ${i.map(m=>`
            <div class="card clip-card hover-lift" data-clip-id="${m.id}">
              <div class="clip-thumb">
                <img src="${m.thumbnailUrl||"/cosmic_orbit_banner.png"}" alt="${E(m.title)}" onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
                <span class="clip-views">${d.eye} ${m.viewCount||0}</span>
              </div>
              <div class="clip-info">
                <div class="clip-title truncate">${E(m.title||"Untitled Clip")}</div>
                <div class="clip-meta">by ${E(m.creatorName||m.creatorUsername||"Unknown")}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `),e.innerHTML=y,e.querySelectorAll(".channel-search-card, .btn-view-channel").forEach(m=>{m.addEventListener("click",v=>{v.stopPropagation();const k=parseInt(m.dataset.channelId||m.dataset.cid);k&&c.navigate("channel",{channelId:k})})}),e.querySelectorAll(".category-card").forEach(m=>{m.addEventListener("click",()=>{c.navigate("category-detail",{slug:m.dataset.slug})})}),e.querySelectorAll(".stream-card").forEach(m=>{m.addEventListener("click",()=>{const v=parseInt(m.dataset.streamId),k=o.find(O=>O.id===v);k&&(c.setActiveStream(k),c.navigate("watch",{streamId:v}))})}),e.querySelectorAll(".clip-card").forEach(m=>{m.addEventListener("click",()=>{const v=parseInt(m.dataset.clipId),k=i.find(O=>O.id===v);k&&we(k)})})}function E(n){return n?n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}const M={async getStats(){var n,e,t,s,o;try{return await g("/api/Admin/stats")}catch{try{const[r,a,l,p]=await Promise.allSettled([g("/api/accounts-management/accounts?page=1&pageSize=1"),g("/api/Stream/live"),g("/api/Clip/top?count=1"),g("/api/Category")]);return{totalUsers:r.status==="fulfilled"&&((n=r.value)==null?void 0:n.totalCount)||0,totalChannels:r.status==="fulfilled"?Math.max(1,((e=r.value)==null?void 0:e.totalCount)||0):1,activeStreams:a.status==="fulfilled"&&((t=a.value)==null?void 0:t.length)||0,totalClips:l.status==="fulfilled"&&((s=l.value)==null?void 0:s.length)||0,totalVods:0,totalCategories:p.status==="fulfilled"&&((o=p.value)==null?void 0:o.length)||0}}catch{return{totalUsers:0,totalChannels:0,activeStreams:0,totalClips:0,totalVods:0,totalCategories:0}}}},async getUsers(n=1,e=15,t="",s=""){var o;try{let i=`/api/Admin/users?page=${n}&pageSize=${e}`;return t&&(i+=`&search=${encodeURIComponent(t)}`),s&&(i+=`&role=${encodeURIComponent(s)}`),await g(i)}catch{const r=await g(`/api/accounts-management/accounts?page=${n}&pageSize=${e}`);return{items:((r==null?void 0:r.items)||[]).map(a=>({id:a.userId||a.id,username:a.username||"User",email:a.email,fullName:a.fullName||a.username,age:a.age,roles:a.roles||[],isLockedOut:!1,hasChannel:!1})),totalCount:(r==null?void 0:r.totalCount)||((o=r==null?void 0:r.items)==null?void 0:o.length)||0,page:n,pageSize:e}}},getUserById:n=>g(`/api/Admin/users/${n}`),updateUserRoles:(n,e)=>g(`/api/Admin/users/${n}/roles`,{method:"PUT",body:JSON.stringify({roles:e})}),lockUser:(n,e,t=1440)=>g(`/api/Admin/users/${n}/lock`,{method:"POST",body:JSON.stringify({isLocked:e,lockoutMinutes:t})}),resetPassword:(n,e)=>g(`/api/Admin/users/${n}/reset-password`,{method:"POST",body:JSON.stringify({newPassword:e})}),async deleteAccount(n){try{return await g(`/api/Admin/users/${n}`,{method:"DELETE"})}catch{return await g(`/api/accounts-management/accounts/${n}`,{method:"DELETE"})}},async getChannels(n=1,e=15,t=""){try{let s=`/api/Admin/channels?page=${n}&pageSize=${e}`;return t&&(s+=`&search=${encodeURIComponent(t)}`),await g(s)}catch{return{items:[],totalCount:0,page:n,pageSize:e}}},resetChannelStreamKey:n=>g(`/api/Admin/channels/${n}/reset-stream-key`,{method:"POST"}),deleteChannel:n=>g(`/api/Admin/channels/${n}`,{method:"DELETE"}),async getLiveStreams(){try{return await g("/api/Admin/streams/live")}catch{return(await g("/api/Stream/live")||[]).map(t=>({streamId:t.id,channelId:t.channelId,channelName:t.channelName||t.streamerName||"Channel",streamerName:t.streamerName||"Streamer",title:t.title||"Live Broadcast",viewerCount:t.viewerCount||0,startedAt:t.startedAt||new Date().toISOString(),categoryName:t.categoryName,thumbnailUrl:t.thumbnailUrl}))}},forceEndStream:n=>g(`/api/Admin/streams/${n}/force-end`,{method:"POST"}),async getClips(n=1,e=20){try{return await g(`/api/Admin/clips?page=${n}&pageSize=${e}`)}catch{const s=await g(`/api/Clip/top?count=${e}`);return{items:s||[],totalCount:(s==null?void 0:s.length)||0,page:n,pageSize:e}}},deleteClip:n=>g(`/api/Clip/${n}`,{method:"DELETE"}),getVods:(n=1,e=20)=>g(`/api/Admin/vods?page=${n}&pageSize=${e}`),deleteVod:n=>g(`/api/Admin/vods/${n}`,{method:"DELETE"})};let B="overview",A=1,D=1,j=1,pe="",F="",Ce="";function Un(){var t,s;const n=c.getState().currentUser;return((s=(t=n==null?void 0:n.roles)==null?void 0:t.includes)==null?void 0:s.call(t,"Admin"))?`
    <div>
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h1 style="font-family:var(--font-display);font-size:26px;color:#fff;margin:0;">
              ${d.admin} Cosmic Admin Center
            </h1>
            <span class="badge-role admin">SYSTEM ADMIN</span>
          </div>
          <p style="color:var(--color-text-muted);font-size:14px;margin-top:4px;">
            Comprehensive platform controls, account governance, and live stream moderation.
          </p>
        </div>
        <button id="admin-refresh-all" class="btn btn-ghost btn-sm">${d.refresh} Refresh Portal</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs">
        <button class="tab-btn ${B==="overview"?"active":""}" data-admin-tab="overview">${d.grid} Overview</button>
        <button class="tab-btn ${B==="users"?"active":""}" data-admin-tab="users">${d.user} User Accounts</button>
        <button class="tab-btn ${B==="channels"?"active":""}" data-admin-tab="channels">${d.video} Channels</button>
        <button class="tab-btn ${B==="streams"?"active":""}" data-admin-tab="streams"><span style="color:var(--color-live-red);">&#9679;</span> Live Moderation</button>
        <button class="tab-btn ${B==="clips"?"active":""}" data-admin-tab="clips">${d.clip} Clips</button>
        <button class="tab-btn ${B==="categories"?"active":""}" data-admin-tab="categories">${d.star} Categories</button>
      </div>

      <!-- Active Tab Container -->
      <div id="admin-tab-body">
        <div class="spinner"></div>
      </div>

      <!-- Modal Container -->
      <div id="admin-modal-root"></div>
    </div>
  `:`
      <div class="empty-state" style="padding:80px 20px;">
        <div class="empty-icon">&#128274;</div>
        <h2 style="color:var(--color-error);font-family:var(--font-display);">Access Denied</h2>
        <p style="color:var(--color-text-muted);max-width:440px;margin:12px auto;">
          Administrative privileges are required to access this portal. If you are a system administrator, please log in with your admin credentials.
        </p>
        <button id="admin-login-btn" class="btn btn-cyan btn-sm" style="margin-top:16px;">Log in as Admin</button>
      </div>
    `}function Nn(){var n,e;(n=document.getElementById("admin-login-btn"))==null||n.addEventListener("click",()=>c.navigate("login")),(e=document.getElementById("admin-refresh-all"))==null||e.addEventListener("click",()=>w()),document.querySelectorAll("[data-admin-tab]").forEach(t=>{t.addEventListener("click",()=>{B=t.dataset.adminTab,document.querySelectorAll("[data-admin-tab]").forEach(s=>s.classList.remove("active")),t.classList.add("active"),w()})}),w()}async function w(){const n=document.getElementById("admin-tab-body");if(n)switch(n.innerHTML='<div class="spinner"></div>',B){case"overview":await Rn(n);break;case"users":await Dn(n);break;case"channels":await Hn(n);break;case"streams":await zn(n);break;case"clips":await On(n);break;case"categories":await jn(n);break}}async function Rn(n){var e,t,s;try{const o=await M.getStats();n.innerHTML=`
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-title">Platform Users</div>
          <div class="admin-stat-num">${o.totalUsers||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${d.user} Registered Accounts</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Channels</div>
          <div class="admin-stat-num">${o.totalChannels||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${d.video} Streamer Channels</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Active Broadcasts</div>
          <div class="admin-stat-num" style="color:${o.activeStreams>0?"var(--color-live-red)":"var(--color-text-muted)"};">${o.activeStreams||0}</div>
          <div style="font-size:12px;color:var(--color-live-red);">&#9679; Live Streams Now</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Highlight Clips</div>
          <div class="admin-stat-num">${o.totalClips||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${d.clip} Recorded Clips</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Categories</div>
          <div class="admin-stat-num">${o.totalCategories||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${d.grid} Stream Categories</div>
        </div>
      </div>

      <!-- Quick Platform Actions -->
      <div class="card" style="padding:24px;margin-bottom:24px;">
        <h3 style="font-size:16px;color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          ${d.rocket} Quick Administration Actions
        </h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button id="quick-users-btn" class="btn btn-cyan btn-sm">${d.user} Manage Accounts</button>
          <button id="quick-streams-btn" class="btn btn-outline btn-sm">${d.video} Monitor Live Broadcasts</button>
          <button id="quick-categories-btn" class="btn btn-ghost btn-sm">${d.grid} Add New Category</button>
        </div>
      </div>
    `,(e=document.getElementById("quick-users-btn"))==null||e.addEventListener("click",()=>{B="users",Se(),w()}),(t=document.getElementById("quick-streams-btn"))==null||t.addEventListener("click",()=>{B="streams",Se(),w()}),(s=document.getElementById("quick-categories-btn"))==null||s.addEventListener("click",()=>{B="categories",Se(),w()})}catch{n.innerHTML='<p class="text-muted">Failed to load platform overview statistics.</p>'}}async function Dn(n){var e,t;try{const s=await M.getUsers(A,12,pe,F),o=s.items||[],i=s.totalCount||o.length,r=Math.ceil(i/12)||1;n.innerHTML=`
      <!-- Toolbar -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <div class="search-bar" style="max-width:340px;height:40px;">
          ${d.search}
          <input type="text" id="admin-user-search" placeholder="Search by username or email..." value="${C(pe)}" />
        </div>
        <select id="admin-role-filter" class="input-dark" style="width:160px;height:40px;border-radius:var(--radius-pill);padding:0 16px;">
          <option value="" ${F?"":"selected"}>All Roles</option>
          <option value="Admin" ${F==="Admin"?"selected":""}>Admin</option>
          <option value="Streamer" ${F==="Streamer"?"selected":""}>Streamer</option>
          <option value="Moderator" ${F==="Moderator"?"selected":""}>Moderator</option>
        </select>
        <button id="admin-user-search-btn" class="btn btn-cyan btn-sm">Search</button>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${o.map(u=>`
              <tr data-user-row="${u.id}">
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;overflow:hidden;">
                      ${u.profilePictureUrl?`<img src="${u.profilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(u.username||"U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight:600;color:#fff;">${C(u.username||"Unknown")}</div>
                      <div style="font-size:12px;color:var(--color-text-muted);">${C(u.fullName||"")}</div>
                    </div>
                  </div>
                </td>
                <td style="color:var(--color-text-muted);">${C(u.email||"-")}</td>
                <td>
                  <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${(u.roles||[]).map(y=>`
                      <span class="badge-role ${y.toLowerCase()}">${C(y)}</span>
                    `).join("")}
                    ${!u.roles||!u.roles.length?'<span class="text-muted" style="font-size:12px;">Viewer</span>':""}
                  </div>
                </td>
                <td>
                  ${u.isLockedOut?'<span style="color:var(--color-error);font-size:12px;font-weight:600;">&#128274; Locked</span>':'<span style="color:var(--color-success);font-size:12px;font-weight:600;">&#9679; Active</span>'}
                </td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-edit-roles" data-uid="${u.id}" data-roles="${(u.roles||[]).join(",")}" title="Manage Roles">
                      ${d.settings} Roles
                    </button>
                    <button class="btn btn-ghost btn-sm btn-toggle-lock" data-uid="${u.id}" data-locked="${u.isLockedOut}" style="color:${u.isLockedOut?"var(--color-success)":"var(--color-warning)"};" title="${u.isLockedOut?"Unlock":"Lock"}">
                      ${u.isLockedOut?d.checkCircle:d.lock} ${u.isLockedOut?"Unlock":"Lock"}
                    </button>
                    <button class="btn btn-ghost btn-sm btn-reset-pass" data-uid="${u.id}" data-uname="${C(u.username)}" title="Reset Password">
                      ${d.mail} Password
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-account" data-uid="${u.id}" style="color:var(--color-error);" title="Delete Account">
                      ${d.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${o.length?"":'<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-muted);">No user accounts found matching your query.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="user-prev-page" class="btn btn-ghost btn-sm" ${A<=1?"disabled":""}>${d.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${A} of ${r} (${i} users)</span>
        <button id="user-next-page" class="btn btn-ghost btn-sm" ${A>=r?"disabled":""}>${d.chevronRight}</button>
      </div>
    `;const a=document.getElementById("admin-user-search"),l=document.getElementById("admin-user-search-btn"),p=document.getElementById("admin-role-filter");l==null||l.addEventListener("click",()=>{pe=a.value.trim(),F=p.value,A=1,w()}),a==null||a.addEventListener("keydown",u=>{u.key==="Enter"&&(pe=a.value.trim(),F=p.value,A=1,w())}),p==null||p.addEventListener("change",()=>{F=p.value,A=1,w()}),(e=document.getElementById("user-prev-page"))==null||e.addEventListener("click",()=>{A>1&&(A--,w())}),(t=document.getElementById("user-next-page"))==null||t.addEventListener("click",()=>{A<r&&(A++,w())}),n.querySelectorAll(".btn-edit-roles").forEach(u=>{u.addEventListener("click",()=>Fn(u.dataset.uid,(u.dataset.roles||"").split(",").filter(Boolean)))}),n.querySelectorAll(".btn-toggle-lock").forEach(u=>{u.addEventListener("click",async()=>{const y=u.dataset.uid,m=u.dataset.locked==="true";if(confirm(`Are you sure you want to ${m?"unlock":"lock / ban"} this user account?`))try{await M.lockUser(y,!m,1440),c.showToast(`User account ${m?"unlocked":"locked"} successfully`,"success"),w()}catch(k){c.showToast(k.message||"Operation failed","error")}})}),n.querySelectorAll(".btn-reset-pass").forEach(u=>{u.addEventListener("click",()=>qn(u.dataset.uid,u.dataset.uname))}),n.querySelectorAll(".btn-del-account").forEach(u=>{u.addEventListener("click",async()=>{const y=u.dataset.uid;if(confirm("Permanently delete this user account? All associated streams and data will be removed. This cannot be undone."))try{await M.deleteAccount(y),c.showToast("Account deleted successfully","info"),w()}catch(m){c.showToast(m.message||"Failed to delete account","error")}})})}catch{n.innerHTML='<p class="text-muted">Failed to load user accounts.</p>'}}async function Hn(n){var e,t,s;try{const o=await M.getChannels(D,12,Ce),i=o.items||[],r=Math.ceil((o.totalCount||i.length)/12)||1;n.innerHTML=`
      <!-- Toolbar -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <div class="search-bar" style="max-width:340px;height:40px;">
          ${d.search}
          <input type="text" id="admin-channel-search" placeholder="Search channels by name or owner..." value="${C(Ce)}" />
        </div>
        <button id="admin-channel-search-btn" class="btn btn-cyan btn-sm">Search</button>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Channel Name</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Stream Key</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${i.map(a=>`
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;overflow:hidden;">
                      ${a.profilePhotoUrl?`<img src="${a.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(a.channelName||"C")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight:600;color:#fff;">${C(a.channelName)}</div>
                      <div style="font-size:12px;color:var(--color-text-muted);">${C(a.description||"No description")}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight:500;">${C(a.ownerUsername||"Owner")}</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">${C(a.ownerEmail||"")}</div>
                </td>
                <td>
                  ${a.isLive?`<span class="badge-live">LIVE (${a.currentViewers} viewers)</span>`:'<span class="text-muted" style="font-size:12px;">Offline</span>'}
                </td>
                <td>
                  ${a.hasStreamKey?'<span style="color:var(--color-success);font-size:12px;">Configured</span>':'<span style="color:var(--color-warning);font-size:12px;">Not Generated</span>'}
                </td>
                <td style="color:var(--color-text-muted);font-size:13px;">${a.createdAt?new Date(a.createdAt).toLocaleDateString():"-"}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-visit-channel" data-cid="${a.id}" title="Visit Channel">
                      ${d.rocket} Visit
                    </button>
                    <button class="btn btn-ghost btn-sm btn-reset-skey" data-cid="${a.id}" title="Reset Stream Key">
                      ${d.refresh} Reset Key
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-channel" data-cid="${a.id}" style="color:var(--color-error);" title="Delete Channel">
                      ${d.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${i.length?"":'<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted);">No channels found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="ch-prev-page" class="btn btn-ghost btn-sm" ${D<=1?"disabled":""}>${d.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${D} of ${r}</span>
        <button id="ch-next-page" class="btn btn-ghost btn-sm" ${D>=r?"disabled":""}>${d.chevronRight}</button>
      </div>
    `,(e=document.getElementById("admin-channel-search-btn"))==null||e.addEventListener("click",()=>{var a,l;Ce=((l=(a=document.getElementById("admin-channel-search"))==null?void 0:a.value)==null?void 0:l.trim())||"",D=1,w()}),(t=document.getElementById("ch-prev-page"))==null||t.addEventListener("click",()=>{D>1&&(D--,w())}),(s=document.getElementById("ch-next-page"))==null||s.addEventListener("click",()=>{D<r&&(D++,w())}),n.querySelectorAll(".btn-visit-channel").forEach(a=>{a.addEventListener("click",()=>c.navigate("channel",{channelId:parseInt(a.dataset.cid)}))}),n.querySelectorAll(".btn-reset-skey").forEach(a=>{a.addEventListener("click",async()=>{if(confirm("Regenerate RTMP stream key for this channel? The streamer will need to update OBS settings."))try{const l=await M.resetChannelStreamKey(parseInt(a.dataset.cid));c.showToast("Stream key regenerated successfully","success")}catch(l){c.showToast(l.message||"Failed to reset stream key","error")}})}),n.querySelectorAll(".btn-del-channel").forEach(a=>{a.addEventListener("click",async()=>{if(confirm("Permanently delete this channel? Streamer role and all associated stream data will be affected."))try{await M.deleteChannel(parseInt(a.dataset.cid)),c.showToast("Channel deleted successfully","info"),w()}catch(l){c.showToast(l.message||"Failed to delete channel","error")}})})}catch{n.innerHTML='<p class="text-muted">Failed to load channels.</p>'}}async function zn(n){var e;try{const t=await M.getLiveStreams();n.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:16px;color:#fff;margin:0;">Active Live Broadcasts (${t.length})</h3>
        <button id="refresh-live-streams-btn" class="btn btn-ghost btn-sm">${d.refresh} Refresh</button>
      </div>

      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Broadcast</th>
              <th>Streamer / Channel</th>
              <th>Category</th>
              <th>Viewers</th>
              <th>Started</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${t.map(s=>`
              <tr>
                <td>
                  <div style="font-weight:600;color:#fff;">${C(s.title||"Untitled Stream")}</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">Stream ID: ${s.streamId}</div>
                </td>
                <td>
                  <div style="font-weight:500;">${C(s.streamerName||"Streamer")}</div>
                  <div style="font-size:12px;color:var(--color-cyan-primary);">${C(s.channelName||"")}</div>
                </td>
                <td>
                  ${s.categoryName?`<span class="badge-category">${C(s.categoryName)}</span>`:'<span class="text-muted">-</span>'}
                </td>
                <td>
                  <span class="badge-viewers" style="background:rgba(255,20,0,0.15);color:var(--color-live-red);font-weight:700;">
                    &#9679; ${s.viewerCount||0}
                  </span>
                </td>
                <td style="color:var(--color-text-muted);font-size:13px;">${s.startedAt?new Date(s.startedAt).toLocaleTimeString():"-"}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-watch-stream" data-sid="${s.streamId}">
                      ${d.eye} Watch
                    </button>
                    <button class="btn btn-danger btn-sm btn-force-end" data-sid="${s.streamId}" style="padding:0 14px;height:32px;font-size:12px;">
                      Force Terminate
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${t.length?"":'<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--color-text-muted);">No streams are currently broadcasting live across the platform.</td></tr>'}
          </tbody>
        </table>
      </div>
    `,(e=document.getElementById("refresh-live-streams-btn"))==null||e.addEventListener("click",()=>w()),n.querySelectorAll(".btn-watch-stream").forEach(s=>{s.addEventListener("click",()=>{c.navigate("watch",{streamId:parseInt(s.dataset.sid)})})}),n.querySelectorAll(".btn-force-end").forEach(s=>{s.addEventListener("click",async()=>{const o=parseInt(s.dataset.sid);if(confirm(`Are you sure you want to FORCE END stream #${o}? The RTMP stream and viewers will be disconnected immediately.`))try{await M.forceEndStream(o),c.showToast("Live stream terminated successfully","success"),w()}catch(i){c.showToast(i.message||"Failed to terminate stream","error")}})})}catch{n.innerHTML='<p class="text-muted">Failed to load active live streams.</p>'}}async function On(n){var e,t,s;try{const o=await M.getClips(j,16),i=o.items||[],r=Math.ceil((o.totalCount||i.length)/16)||1;n.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:16px;color:#fff;margin:0;">Platform Highlight Clips (${o.totalCount||i.length})</h3>
        <button id="refresh-clips-admin-btn" class="btn btn-ghost btn-sm">${d.refresh} Refresh</button>
      </div>

      <div class="clips-grid" style="margin-bottom:24px;">
        ${i.map(a=>`
          <div class="card clip-card hover-lift" data-clip-id="${a.id}">
            <div class="clip-thumb">
              <img src="${a.thumbnailUrl||"/cosmic_orbit_banner.png"}" alt="${C(a.title)}" onerror="this.onerror=null;this.src='/cosmic_orbit_banner.png';" />
              <span class="clip-views">${d.eye} ${a.viewCount||0}</span>
              ${a.durationSeconds?`<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:4px;font-size:11px;">${Math.round(a.durationSeconds)}s</span>`:""}
            </div>
            <div class="clip-info">
              <div class="clip-title truncate">${C(a.title||"Untitled Clip")}</div>
              <div class="clip-meta" style="display:flex;justify-content:space-between;margin-top:4px;">
                <span>by ${C(a.creatorName||"Streamer")}</span>
                <button class="btn-del-clip" data-cid="${a.id}" style="color:var(--color-error);font-size:12px;font-weight:600;padding:2px 6px;cursor:pointer;">Delete</button>
              </div>
            </div>
          </div>
        `).join("")}
        ${i.length?"":'<div class="empty-state" style="grid-column:1/-1;"><h3>No Clips Available</h3></div>'}
      </div>

      <div class="pagination">
        <button id="clip-prev-page" class="btn btn-ghost btn-sm" ${j<=1?"disabled":""}>${d.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${j} of ${r}</span>
        <button id="clip-next-page" class="btn btn-ghost btn-sm" ${j>=r?"disabled":""}>${d.chevronRight}</button>
      </div>
    `,(e=document.getElementById("refresh-clips-admin-btn"))==null||e.addEventListener("click",()=>w()),(t=document.getElementById("clip-prev-page"))==null||t.addEventListener("click",()=>{j>1&&(j--,w())}),(s=document.getElementById("clip-next-page"))==null||s.addEventListener("click",()=>{j<r&&(j++,w())}),n.querySelectorAll(".clip-card").forEach(a=>{a.addEventListener("click",l=>{if(l.target.closest(".btn-del-clip"))return;const p=parseInt(a.dataset.clipId),u=i.find(y=>y.id===p);u&&we(u)})}),n.querySelectorAll(".btn-del-clip").forEach(a=>{a.addEventListener("click",async l=>{l.stopPropagation();const p=parseInt(a.dataset.cid);if(confirm("Are you sure you want to permanently delete this clip?"))try{await M.deleteClip(p),c.showToast("Clip deleted successfully","info"),w()}catch(u){c.showToast(u.message||"Failed to delete clip","error")}})})}catch{n.innerHTML='<p class="text-muted">Failed to load platform clips.</p>'}}async function jn(n){var e;try{const t=await I.getAll();n.innerHTML=`
      <!-- Create Category Form -->
      <div class="card" style="padding:24px;margin-bottom:24px;">
        <h4 style="color:#fff;font-size:15px;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          ${d.plus} Add New Category
        </h4>
        <form id="admin-cat-form" style="display:flex;gap:12px;flex-wrap:wrap;">
          <input class="input-dark" id="admin-cat-name" placeholder="Category Name (e.g. Grand Theft Auto VI)" required style="flex:1;min-width:240px;" />
          <input class="input-dark" id="admin-cat-slug" placeholder="URL Slug (e.g. grand-theft-auto-6)" required style="flex:1;min-width:200px;" />
          <button type="submit" class="btn btn-cyan btn-sm" style="height:44px;">Create Category</button>
        </form>
      </div>

      <!-- Categories Table -->
      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${(t||[]).map(s=>`
              <tr>
                <td>
                  <div style="width:40px;height:52px;border-radius:6px;overflow:hidden;background:var(--bg-gradient-card);display:flex;align-items:center;justify-content:center;">
                    ${s.imageUrl?`<img src="${s.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />`:'<span style="font-size:18px;">&#127918;</span>'}
                  </div>
                </td>
                <td style="font-weight:600;color:#fff;">${C(s.name)}</td>
                <td style="color:var(--color-text-muted);">${C(s.slug)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <label class="btn btn-ghost btn-sm" style="cursor:pointer;" title="Upload Cover">
                      ${d.upload} Image
                      <input type="file" data-cat-img="${s.id}" accept="image/*" style="display:none;" />
                    </label>
                    <button class="btn btn-ghost btn-sm" data-del-cat="${s.id}" style="color:var(--color-error);" title="Delete Category">
                      ${d.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${t!=null&&t.length?"":'<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--color-text-muted);">No categories created yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `,(e=document.getElementById("admin-cat-form"))==null||e.addEventListener("submit",async s=>{var r,a,l,p;s.preventDefault();const o=(a=(r=document.getElementById("admin-cat-name"))==null?void 0:r.value)==null?void 0:a.trim(),i=(p=(l=document.getElementById("admin-cat-slug"))==null?void 0:l.value)==null?void 0:p.trim();if(!(!o||!i))try{await I.create({name:o,slug:i}),c.showToast("Category created successfully!","success"),w()}catch(u){c.showToast(u.message||"Failed to create category","error")}}),n.querySelectorAll("[data-del-cat]").forEach(s=>{s.addEventListener("click",async()=>{if(confirm("Delete this category?"))try{await I.delete(parseInt(s.dataset.delCat)),c.showToast("Category deleted","info"),w()}catch(o){c.showToast(o.message||"Failed to delete category","error")}})}),n.querySelectorAll("[data-cat-img]").forEach(s=>{s.addEventListener("change",async o=>{if(o.target.files&&o.target.files[0])try{await I.uploadImage(parseInt(s.dataset.catImg),o.target.files[0]),c.showToast("Category image uploaded!","success"),w()}catch(i){c.showToast(i.message||"Failed to upload image","error")}})})}catch{n.innerHTML='<p class="text-muted">Failed to load categories.</p>'}}function Fn(n,e){var i,r,a;const t=document.getElementById("admin-modal-root")||document.body,s=document.createElement("div");s.className="modal-overlay",s.innerHTML=`
    <div class="modal-content" style="max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">Manage User Roles</h3>
        <button id="close-roles-modal" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
      </div>
      <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px;">
        Select the role permissions for this user account:
      </p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:10px;">
          <input type="checkbox" id="role-admin" ${e.includes("Admin")?"checked":""} />
          <div>
            <strong style="color:var(--color-error);">Admin</strong>
            <div style="font-size:12px;color:var(--color-text-muted);">Full system control, platform governance, user management</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:10px;">
          <input type="checkbox" id="role-streamer" ${e.includes("Streamer")?"checked":""} />
          <div>
            <strong style="color:var(--color-cyan-primary);">Streamer</strong>
            <div style="font-size:12px;color:var(--color-text-muted);">Ability to broadcast live, generate stream keys, and earn followers</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:10px;">
          <input type="checkbox" id="role-mod" ${e.includes("Moderator")?"checked":""} />
          <div>
            <strong style="color:var(--color-success);">Moderator</strong>
            <div style="font-size:12px;color:var(--color-text-muted);">Chat moderation tools, timeouts, and bans across assigned channels</div>
          </div>
        </label>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button id="cancel-roles-btn" class="btn btn-ghost btn-sm">Cancel</button>
        <button id="save-roles-btn" class="btn btn-cyan btn-sm">Save Roles</button>
      </div>
    </div>
  `,t.appendChild(s);const o=()=>s.remove();(i=s.querySelector("#close-roles-modal"))==null||i.addEventListener("click",o),(r=s.querySelector("#cancel-roles-btn"))==null||r.addEventListener("click",o),(a=s.querySelector("#save-roles-btn"))==null||a.addEventListener("click",async()=>{const l=[];s.querySelector("#role-admin").checked&&l.push("Admin"),s.querySelector("#role-streamer").checked&&l.push("Streamer"),s.querySelector("#role-mod").checked&&l.push("Moderator");try{await M.updateUserRoles(n,l),c.showToast("User roles updated successfully","success"),o(),w()}catch(p){c.showToast(p.message||"Failed to update roles","error")}})}function qn(n,e){var i,r,a;const t=document.getElementById("admin-modal-root")||document.body,s=document.createElement("div");s.className="modal-overlay",s.innerHTML=`
    <div class="modal-content" style="max-width:420px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">Reset Password</h3>
        <button id="close-reset-modal" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
      </div>
      <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:16px;">
        Set a new secure password for <strong>${C(e)}</strong>:
      </p>
      <div class="form-group" style="margin-bottom:20px;">
        <label>New Password (min 6 characters)</label>
        <div class="input-wrapper" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
          <span class="input-icon">${d.lock}</span>
          <input type="password" id="admin-new-password" placeholder="Enter new password" style="color:#fff;" required />
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button id="cancel-reset-btn" class="btn btn-ghost btn-sm">Cancel</button>
        <button id="submit-reset-btn" class="btn btn-cyan btn-sm">Set Password</button>
      </div>
    </div>
  `,t.appendChild(s);const o=()=>s.remove();(i=s.querySelector("#close-reset-modal"))==null||i.addEventListener("click",o),(r=s.querySelector("#cancel-reset-btn"))==null||r.addEventListener("click",o),(a=s.querySelector("#submit-reset-btn"))==null||a.addEventListener("click",async()=>{var p;const l=(p=s.querySelector("#admin-new-password"))==null?void 0:p.value;if(!l||l.length<6){c.showToast("Password must be at least 6 characters","error");return}try{await M.resetPassword(n,l),c.showToast("User password reset successfully","success"),o()}catch(u){c.showToast(u.message||"Failed to reset password","error")}})}function Se(){document.querySelectorAll("[data-admin-tab]").forEach(n=>{n.classList.toggle("active",n.dataset.adminTab===B)})}function C(n){return n?n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}const ee={deleteMessage:(n,e)=>g(`/api/Moderation/${n}/messages/${e}`,{method:"DELETE"}),timeoutUser:(n,e)=>g(`/api/Moderation/${n}/timeout`,{method:"POST",body:JSON.stringify(e)}),banUser:(n,e)=>g(`/api/Moderation/${n}/ban`,{method:"POST",body:JSON.stringify(e)}),unbanUser:(n,e)=>g(`/api/Moderation/${n}/ban/${e}`,{method:"DELETE"})};let W=null,Q=null;function Vn(){var n;return Q=(n=c.getState().viewParams)==null?void 0:n.channelId,`
    <div style="display:flex;gap:0;margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <!-- Mod Chat Panel -->
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="padding:16px 20px;border-bottom:1px solid rgba(0,174,189,0.1);display:flex;align-items:center;gap:12px;">
          <span class="badge-role mod">MOD</span>
          <h2 style="font-size:18px;">Moderator View</h2>
          <span style="color:var(--color-text-muted);font-size:13px;" id="mod-status">Connecting...</span>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px 16px;" id="mod-chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="mod-chat-input" placeholder="Send a message..." />
          <button id="mod-chat-send">${d.send}</button>
        </div>
      </div>

      <!-- Mod Actions Panel -->
      <div style="width:320px;border-left:1px solid rgba(0,174,189,0.1);padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;">
        <h3 style="font-family:var(--font-display);color:var(--color-cyan-neon);font-size:16px;">${d.shield} Mod Actions</h3>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Timeout User</h4>
          <input class="input-dark" id="mod-timeout-user" placeholder="Username" style="margin-bottom:8px;" />
          <div style="display:flex;gap:6px;">
            <input class="input-dark" type="number" id="mod-timeout-dur" value="300" min="10" max="86400" style="flex:1;" />
            <button id="mod-timeout-btn" class="btn btn-sm" style="background:var(--color-warning);color:#000;">${d.clock} Timeout</button>
          </div>
        </div>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Ban User</h4>
          <input class="input-dark" id="mod-ban-user" placeholder="Username" style="margin-bottom:8px;" />
          <input class="input-dark" id="mod-ban-reason" placeholder="Reason (optional)" style="margin-bottom:8px;" />
          <button id="mod-ban-btn" class="btn btn-danger btn-sm btn-full">${d.ban} Ban</button>
        </div>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Unban User</h4>
          <div style="display:flex;gap:6px;">
            <input class="input-dark" id="mod-unban-user" placeholder="Username" style="flex:1;" />
            <button id="mod-unban-btn" class="btn btn-outline btn-sm">Unban</button>
          </div>
        </div>
      </div>
    </div>
  `}function Wn(){var s,o,i;if(!Q){c.showToast("No channel specified","error");return}Jn(Q);const n=document.getElementById("mod-chat-input"),e=document.getElementById("mod-chat-send"),t=()=>{const r=n==null?void 0:n.value.trim();!r||!W||(W.invoke("SendMessage",r).catch(a=>console.error(a)),n.value="")};e==null||e.addEventListener("click",t),n==null||n.addEventListener("keydown",r=>{r.key==="Enter"&&t()}),(s=document.getElementById("mod-timeout-btn"))==null||s.addEventListener("click",async()=>{const r=document.getElementById("mod-timeout-user").value.trim(),a=parseInt(document.getElementById("mod-timeout-dur").value)||300;if(r)try{await ee.timeoutUser(Q,{username:r,durationSeconds:a}),c.showToast(`${r} timed out for ${a}s`,"warning")}catch(l){c.showToast(l.message,"error")}}),(o=document.getElementById("mod-ban-btn"))==null||o.addEventListener("click",async()=>{const r=document.getElementById("mod-ban-user").value.trim(),a=document.getElementById("mod-ban-reason").value.trim();if(r)try{await ee.banUser(Q,{username:r,reason:a}),c.showToast(`${r} has been banned`,"error")}catch(l){c.showToast(l.message,"error")}}),(i=document.getElementById("mod-unban-btn"))==null||i.addEventListener("click",async()=>{const r=document.getElementById("mod-unban-user").value.trim();if(r)try{await ee.unbanUser(Q,r),c.showToast(`${r} has been unbanned`,"success")}catch(a){c.showToast(a.message,"error")}})}async function Jn(n){const e=document.getElementById("mod-status"),t=document.getElementById("mod-chat-messages");if(t)try{const s=se();W=new We().withUrl(`${ie}/hubs/stream-chat`,{accessTokenFactory:()=>s}).withAutomaticReconnect().build(),W.on("ReceiveMessage",o=>{var r,a,l;const i=document.createElement("div");i.className="chat-msg",i.style.display="flex",i.style.justifyContent="space-between",i.style.alignItems="flex-start",i.innerHTML=`
        <div>
          <span class="chat-user" style="color:${o.color||"#00AEBD"};">${o.username}:</span>
          <span class="chat-text">${Kn(o.content)}</span>
        </div>
        <div class="mod-actions" style="flex-shrink:0;margin-left:8px;">
          <button class="mod-action-btn delete" title="Delete message" data-msg-id="${o.id}">&#128465;</button>
          <button class="mod-action-btn timeout" title="Timeout user" data-timeout-user="${o.username}">&#9201;</button>
          <button class="mod-action-btn ban" title="Ban user" data-ban-user="${o.username}">&#128683;</button>
        </div>
      `,t.appendChild(i),t.scrollTop=t.scrollHeight,(r=i.querySelector("[data-msg-id]"))==null||r.addEventListener("click",async()=>{try{await ee.deleteMessage(n,o.id),i.style.opacity="0.3",c.showToast("Message deleted","info")}catch(p){c.showToast(p.message,"error")}}),(a=i.querySelector("[data-timeout-user]"))==null||a.addEventListener("click",async()=>{try{await ee.timeoutUser(n,{username:o.username,durationSeconds:300}),c.showToast(`${o.username} timed out`,"warning")}catch(p){c.showToast(p.message,"error")}}),(l=i.querySelector("[data-ban-user]"))==null||l.addEventListener("click",async()=>{if(confirm(`Ban ${o.username}?`))try{await ee.banUser(n,{username:o.username,reason:"Banned by moderator"}),c.showToast(`${o.username} banned`,"error")}catch(p){c.showToast(p.message,"error")}})}),W.on("SystemMessage",o=>{const i=document.createElement("div");i.className="chat-msg",i.innerHTML=`<span style="color:var(--color-warning);font-style:italic;">&#9888; ${o}</span>`,t.appendChild(i)}),await W.start(),await W.invoke("JoinChannel",n),e&&(e.textContent="Connected",e.style.color="var(--color-success)")}catch{e&&(e.textContent="Disconnected",e.style.color="var(--color-error)")}}function Kn(n){const e=document.createElement("div");return e.textContent=n,e.innerHTML}const Oe=document.getElementById("app"),Gn=["splash","login","register","otp","forgot-password","reset-password"],je={splash:{render:ot,setup:it},login:{render:rt,setup:at},register:{render:lt,setup:ct},otp:{render:dt,setup:pt},"forgot-password":{render:ht,setup:ut},"reset-password":{render:gt,setup:mt},home:{render:vt,setup:ft},watch:{render:nn,setup:sn},categories:{render:cn,setup:dn},"category-detail":{render:hn,setup:un},clips:{render:mn,setup:vn},channel:{render:yn,setup:bn},studio:{render:xn,setup:_n},profile:{render:Mn,setup:Bn},search:{render:Pn,setup:An},admin:{render:Un,setup:Nn},mod:{render:Vn,setup:Wn}};function Ze(){const n=c.getState(),e=n.currentView,t=Gn.includes(e),s=je[e]||je.home;if(t)Oe.innerHTML=`<div class="page-enter">${s.render()}</div>`;else{const o=n.sidebarCollapsed;Oe.innerHTML=`
      <div class="app-layout">
        ${tt()}
        <div class="app-main ${o?"sidebar-collapsed":""}">
          ${nt()}
          <div class="app-content page-enter" id="view-content">
            ${s.render()}
          </div>
        </div>
      </div>
    `,st()}s.setup&&s.setup()}c.subscribe(()=>Ze());Ze();console.log("Orbit Desktop Platform Ready");
