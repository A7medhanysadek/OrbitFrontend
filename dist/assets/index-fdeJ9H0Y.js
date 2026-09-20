(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))s(d);new MutationObserver(d=>{for(const h of d)if(h.type==="childList")for(const g of h.addedNodes)g.tagName==="LINK"&&g.rel==="modulepreload"&&s(g)}).observe(document,{childList:!0,subtree:!0});function a(d){const h={};return d.integrity&&(h.integrity=d.integrity),d.referrerPolicy&&(h.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?h.credentials="include":d.crossOrigin==="anonymous"?h.credentials="omit":h.credentials="same-origin",h}function s(d){if(d.ep)return;d.ep=!0;const h=a(d);fetch(d.href,h)}})();const Oi=typeof window<"u"&&window.localStorage&&localStorage.getItem("orbit_api_base")||"https://orbit.tryasp.net";function xi(){return localStorage.getItem("orbit_access_token")}function Qi(){return localStorage.getItem("orbit_refresh_token")}function Ri(t,e){t&&localStorage.setItem("orbit_access_token",t),e&&localStorage.setItem("orbit_refresh_token",e)}function ln(){localStorage.removeItem("orbit_access_token"),localStorage.removeItem("orbit_refresh_token"),localStorage.removeItem("orbit_user")}function Rn(t){if(!t)return[];try{const a=t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),s=decodeURIComponent(atob(a).split("").map(g=>"%"+("00"+g.charCodeAt(0).toString(16)).slice(-2)).join("")),d=JSON.parse(s),h=d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]||d.role||d.roles;if(Array.isArray(h))return h;if(h)return[h]}catch{}return[]}function Kt(){const t=localStorage.getItem("orbit_user");try{const e=t?JSON.parse(t):null;if(e&&(!e.roles||!e.roles.length)){const a=e.accessToken||e.token||xi(),s=Rn(a);s.length&&(e.roles=s)}return e}catch{return null}}function Nt(t){if(t){if(!t.roles||!t.roles.length){const e=t.accessToken||t.token||xi(),a=Rn(e);a.length&&(t.roles=a)}localStorage.setItem("orbit_user",JSON.stringify(t))}else localStorage.removeItem("orbit_user")}async function re(t,e={}){const a=t.startsWith("http")?t:`${Oi}${t}`,s=xi(),d={...e.headers||{}};!(e.body instanceof FormData)&&!d["Content-Type"]&&(d["Content-Type"]="application/json"),s&&!d.Authorization&&(d.Authorization=`Bearer ${s}`);const h=await fetch(a,{...e,headers:d});if(h.status===401&&Qi()&&!e._retry)try{const g=await fetch(`${Oi}/api/Auth/refresh-token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken:Qi()})});if(g.ok){const f=await g.json(),_=f.accessToken||f.token,b=f.refreshToken;Ri(_,b);const u=Kt();if(u){const m=Rn(_);m.length&&(u.roles=m),u.accessToken=_,Nt(u)}e._retry=!0;const x={...d,Authorization:`Bearer ${_}`};return re(t,{...e,headers:x})}}catch(g){console.warn("Failed to refresh token",g),ln()}if(!h.ok){let g="An error occurred";try{const _=await h.json();g=_.message||_.error||_.title||JSON.stringify(_)}catch{g=`HTTP ${h.status}: ${h.statusText}`}const f=new Error(g);throw f.status=h.status,f}if(h.status===204)return null;try{return await h.json()}catch{return null}}const tt={create:t=>re("/api/Channel/create",{method:"POST",body:JSON.stringify(t)}),getMyChannel:()=>re("/api/Channel/me"),getById:t=>re(`/api/Channel/${t}`),updateProfile:t=>re("/api/Channel/profile",{method:"PUT",body:JSON.stringify(t)}),uploadPhoto:t=>{const e=new FormData;return e.append("file",t),re("/api/Channel/photo",{method:"POST",body:e})},uploadCover:t=>{const e=new FormData;return e.append("file",t),re("/api/Channel/cover",{method:"POST",body:e})},getSocialLinks:t=>re(`/api/Channel/${t}/social-links`),updateSocialLinks:t=>re("/api/Channel/social-links",{method:"PUT",body:JSON.stringify(t)}),hireModerator:t=>re("/api/Channel/moderators/hire",{method:"POST",body:JSON.stringify({username:t})}),removeModerator:t=>re(`/api/Channel/moderators/${t}`,{method:"DELETE"}),getModerators:()=>re("/api/Channel/moderators"),toggleSaveStreams:t=>re("/api/Channel/save-streams",{method:"PUT",body:JSON.stringify({saveStreams:t})}),search:t=>re(`/api/Channel/search?q=${encodeURIComponent(t)}`),toggleFollow:t=>re(`/api/Channel/${t}/follow`,{method:"POST"}),isFollowing:t=>re(`/api/Channel/${t}/following`),getFollowedChannels:()=>re("/api/Channel/following")};class _o{constructor(){const e=["splash","login","register","otp","forgot-password","reset-password","home","watch","categories","category-detail","clips","channel","studio","profile","search","admin","mod"],a=typeof window<"u"&&window.location.hash.replace(/^#\/?/,"")||"";let s=Kt()?"home":"splash";a&&e.includes(a)&&(s=a),this.state={currentUser:Kt(),currentView:s,viewParams:{},activeStream:null,sidebarCollapsed:!1,notifications:[],modal:null,followedChannels:JSON.parse(localStorage.getItem("orbit_followed")||"[]")},this.listeners=[],this.state.currentUser&&this.loadFollowedChannels()}getState(){return this.state}setState(e){this.state={...this.state,...e},this.notify()}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(a=>a!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}navigate(e,a={}){this.setState({currentView:e,viewParams:a}),window.scrollTo({top:0,behavior:"smooth"}),history.pushState({view:e,params:a},"",`#${e}`)}setCurrentUser(e){this.setState({currentUser:e}),e?this.loadFollowedChannels():(localStorage.removeItem("orbit_followed"),this.setState({followedChannels:[]}))}setActiveStream(e){this.setState({activeStream:e})}toggleSidebar(){this.setState({sidebarCollapsed:!this.state.sidebarCollapsed})}openModal(e,a={}){this.setState({modal:{type:e,data:a}})}closeModal(){this.setState({modal:null})}async loadFollowedChannels(){if(this.state.currentUser)try{const e=await tt.getFollowedChannels();if(Array.isArray(e)){const a=e.map(s=>({id:s.channelId,channelId:s.channelId,name:s.channelName,channelName:s.channelName,ownerUsername:s.ownerUsername,profilePhotoUrl:s.profilePhotoUrl,isLive:s.isLive,followedAt:s.followedAt}));localStorage.setItem("orbit_followed",JSON.stringify(a)),this.setState({followedChannels:a})}}catch(e){console.warn("Failed to load server follows:",e)}}async toggleFollow(e,a=""){if(!this.state.currentUser)return this.showToast("Please log in to follow channels","warning"),this.navigate("login"),!1;try{const d=!!(await tt.toggleFollow(e)).isFollowing;let h=[...this.state.followedChannels];return d?h.some(g=>g.id===e||g.channelId===e)||h.unshift({id:e,channelId:e,name:a||"Channel",channelName:a||"Channel"}):h=h.filter(g=>g.id!==e&&g.channelId!==e),localStorage.setItem("orbit_followed",JSON.stringify(h)),this.setState({followedChannels:h}),d}catch(s){return this.showToast(s.message||"Failed to update follow status","error"),this.isFollowing(e)}}async followChannel(e,a){return this.isFollowing(e)?!0:await this.toggleFollow(e,a)}async unfollowChannel(e){return this.isFollowing(e)?await this.toggleFollow(e):!1}isFollowing(e){return this.state.followedChannels.some(a=>a.id===e||a.channelId===e)}showToast(e,a="info"){const s=document.getElementById("toast-container");if(s){const d=document.createElement("div");d.className=`toast ${a}`,d.innerHTML=`<span>${e}</span><button style="opacity:0.7;font-size:16px;margin-left:8px;" onclick="this.parentElement.remove()">x</button>`,s.appendChild(d),setTimeout(()=>{d.parentElement&&d.remove()},4e3)}}}const I=new _o;window.addEventListener("popstate",t=>{t.state&&t.state.view&&I.setState({currentView:t.state.view,viewParams:t.state.params||{}})});window.addEventListener("hashchange",()=>{const t=window.location.hash.replace(/^#\/?/,"");t&&["splash","login","register","otp","forgot-password","reset-password","home","watch","categories","category-detail","clips","channel","studio","profile","search","admin","mod"].includes(t)&&t!==I.getState().currentView&&I.setState({currentView:t})});const N={home:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.02 2.84l-5.39 4.2C2.73 7.74 2 9.23 2 10.36v7.41c0 2.02 1.64 3.67 3.66 3.67h12.68C20.36 21.44 22 19.79 22 17.78v-7.26c0-1.2-.81-2.74-1.8-3.45l-6.18-4.33c-1.4-.98-3.65-.93-5 .1z"/><path d="M12 17.99v-3" stroke-linecap="round"/></svg>',search:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" stroke-linecap="round"/></svg>',live:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.09 4.26A9.93 9.93 0 0 0 2 12c0 2.84 1.18 5.41 3.09 7.24M17.91 4.26A9.93 9.93 0 0 1 22 12a9.93 9.93 0 0 1-4.09 7.24M8.78 7.35A5.96 5.96 0 0 0 6 12c0 1.87.86 3.54 2.2 4.64M15.22 7.35A5.96 5.96 0 0 1 18 12c0 1.87-.86 3.54-2.2 4.64"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',bell:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.02 2.91c-3.31 0-6 2.69-6 6v2.89c0 .61-.26 1.54-.57 2.06L4.3 15.77c-.71 1.18-.22 2.49 1.08 2.93 4.31 1.44 8.96 1.44 13.27 0 1.21-.4 1.74-1.83 1.08-2.93l-1.15-1.91c-.3-.52-.56-1.45-.56-2.06V8.91c0-3.3-2.7-6-6-6z"/><path d="M13.87 3.2a6.754 6.754 0 0 0-3.7 0M9.02 19.06c0 1.65 1.35 3 3 3 .82 0 1.56-.33 2.12-.88.56-.56.88-1.3.88-2.12"/></svg>',user:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21c0-3.31-3.58-6-8-6s-8 2.69-8 6"/></svg>',settings:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.17.44.44.82.82 1.09"/></svg>',mail:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>',lock:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',eyeClosed:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.53 9.47l-5.06 5.06a3.573 3.573 0 1 1 5.06-5.06z"/><path d="M17.82 5.77C16.07 4.45 14.07 3.73 12 3.73c-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19.79 1.24 1.71 2.31 2.71 3.17"/><path d="M8.42 19.53c1.14.48 2.35.74 3.58.74 3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-.33-.52-.69-1.01-1.06-1.47"/><path d="M15.51 12.7a3.565 3.565 0 0 1-2.82 2.82"/><path d="M2 2l20 20" stroke-linecap="round"/></svg>',eyeOpen:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 16.33c2.39 0 4.33-1.94 4.33-4.33S14.39 7.67 12 7.67 7.67 9.61 7.67 12s1.94 4.33 4.33 4.33z"/><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19C18.82 5.81 15.53 3.73 12 3.73c-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.59 5.58 5.67 9.11 5.67z"/></svg>',calendar:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',userRound:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-3 3.13-6 7-6s7 3 7 6"/></svg>',chevronLeft:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>',chevronRight:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>',chevronDown:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',x:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',copy:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',refresh:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>',trash:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',edit:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',send:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',play:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',volume:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',fullscreen:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',clip:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m16 4 3 3-9.5 9.5a2.12 2.12 0 0 1-3-3L16 4z"/><path d="M12 8 8 4M3 21h4"/></svg>',follow:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',followFilled:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',shield:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',ban:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>',clock:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',chart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',key:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',monitor:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',upload:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',users:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',globe:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',video:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="15" height="16" rx="2"/><path d="m22 7-5 3.5L22 14V7z"/></svg>',logout:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',checkCircle:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00AEBD" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',star:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',grid:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',menu:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',google:'<svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>',facebook:'<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',apple:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>',rocket:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',planet:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="12" ry="4" transform="rotate(-30 12 12)"/></svg>',admin:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',emoji:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',archive:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',link:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',image:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',dollar:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',eye:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',download:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',moreH:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',share:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'};let ft=null,Ai=null;const oi=typeof window<"u"&&window.location.protocol==="https:",Zi=oi?"https://localhost:8443/clips":"http://localhost:8080/clips",en=oi?"https://localhost:8443/recordings":"http://localhost:8080/recordings",tn=oi?"https://localhost:8443/hls":"http://localhost:8080/hls",Sn="rtmp://localhost:1935/live",ri=["unwound-overlook-boat.ngrok-free.dev"];function vo(){if(!(typeof window>"u"||!window.localStorage))try{const t=localStorage.getItem("orbit_media_config");if(t){for(const e of ri)if(t.includes(e)){localStorage.removeItem("orbit_media_config");break}}for(const e of["orbit_clips_base","orbit_recordings_base","orbit_hls_base","orbit_rtmp_url"]){const a=localStorage.getItem(e);if(a){for(const s of ri)if(a.includes(s)){localStorage.removeItem(e);break}}}}catch{}}vo();async function Mt(t=!1){return ft&&ft._fetchedFromServer&&!t?ft:(Ai&&!t||(Ai=(async()=>{try{const e=await re("/api/Stream/server/config");if(e){let a=e.effectiveHlsBaseUrl||e.hlsBaseUrl||tn,s=e.clipsBaseUrl||(e.hlsBaseUrl?e.hlsBaseUrl.replace(/\/hls\/?$/,"/clips"):Zi),d=e.recordingsBaseUrl||(e.hlsBaseUrl?e.hlsBaseUrl.replace(/\/hls\/?$/,"/recordings"):en);return oi&&(a=a.replace("http://localhost:8080","https://localhost:8443").replace("http://127.0.0.1:8080","https://localhost:8443"),s=s.replace("http://localhost:8080","https://localhost:8443").replace("http://127.0.0.1:8080","https://localhost:8443"),d=d.replace("http://localhost:8080","https://localhost:8443").replace("http://127.0.0.1:8080","https://localhost:8443")),ft={_fetchedFromServer:!0,isConfigured:!!e.isConfigured,isCustomConfigured:!!e.isCustomConfigured,rtmpUrl:e.effectiveRtmpUrl||e.rtmpUrl||Sn,hlsBaseUrl:a,clipsBaseUrl:s,recordingsBaseUrl:d,message:e.message||""},typeof window<"u"&&window.localStorage&&localStorage.setItem("orbit_media_config",JSON.stringify(ft)),ft}}catch(e){console.warn("[mediaConfig] Could not fetch server config, using fallback/cache:",e.message)}finally{Ai=null}if(typeof window<"u"&&window.localStorage)try{const e=localStorage.getItem("orbit_media_config");if(e){let a=!1;for(const s of ri)if(e.includes(s)){a=!0;break}if(!a)return ft=JSON.parse(e),ft}}catch{}return ft={_fetchedFromServer:!1,isConfigured:!1,isCustomConfigured:!1,rtmpUrl:Sn,hlsBaseUrl:tn,clipsBaseUrl:Zi,recordingsBaseUrl:en,message:"Fallback local config"},ft})()),Ai)}function Mn(){if(ft)return ft;if(typeof window<"u"&&window.localStorage)try{const t=localStorage.getItem("orbit_media_config");if(t){let e=!1;for(const a of ri)if(t.includes(a)){e=!0;break}if(!e)return ft=JSON.parse(t),ft}}catch{}return{_fetchedFromServer:!1,isConfigured:!1,isCustomConfigured:!1,rtmpUrl:Sn,hlsBaseUrl:tn,clipsBaseUrl:Zi,recordingsBaseUrl:en}}function yi(t){return t?oi?t.replace("http://localhost:8080","https://localhost:8443").replace("http://127.0.0.1:8080","https://localhost:8443"):t:""}function yo(){if(typeof window<"u"&&window.localStorage){const a=localStorage.getItem("orbit_clips_base");if(a&&!ri.some(s=>a.includes(s)))return yi(a.replace(/\/+$/,""))}const e=Mn().clipsBaseUrl||Zi;return yi(e.replace(/\/+$/,""))}function bo(){if(typeof window<"u"&&window.localStorage){const a=localStorage.getItem("orbit_recordings_base");if(a&&!ri.some(s=>a.includes(s)))return yi(a.replace(/\/+$/,""))}const e=Mn().recordingsBaseUrl||en;return yi(e.replace(/\/+$/,""))}function xo(){if(typeof window<"u"&&window.localStorage){const a=localStorage.getItem("orbit_hls_base");if(a&&!ri.some(s=>a.includes(s)))return yi(a.replace(/\/+$/,""))}const e=Mn().hlsBaseUrl||tn;return yi(e.replace(/\/+$/,""))}function Yt(t){if(!t)return"";let e=t.trim();oi&&(e=e.replace("http://localhost:8080","https://localhost:8443").replace("http://127.0.0.1:8080","https://localhost:8443"));const a=yo(),s=bo(),d=xo();if(e.includes("/clips/")){const h=e.substring(e.lastIndexOf("/clips/")+7);if(h)return`${a}/${h}`}else if(e.includes("/recordings/")){const h=e.substring(e.lastIndexOf("/recordings/")+12);if(h)return`${s}/${h}`}else if(e.includes("/hls/")){const h=e.substring(e.lastIndexOf("/hls/")+5);if(h)return`${d}/${h}`}return oi&&e.startsWith("http://")&&!e.includes("localhost")&&!e.includes("127.0.0.1")&&(e=e.replace("http://","https://")),e}const mi="./",Jt=mi.endsWith("/")?`${mi}orbit-logo-blue.png`:`${mi}/orbit-logo-blue.png`,ht=mi.endsWith("/")?`${mi}cosmic_orbit_banner.png`:`${mi}/cosmic_orbit_banner.png`,di=new Map;async function wo(t,e,a=ht){if(!t)return;if(!e){t.src=a;return}if(e.startsWith("blob:")||e.startsWith("data:")){t.src=e;return}const s=Yt(e),d=s.includes("ngrok-free.dev")||s.includes("ngrok.io"),h=s.includes("localhost:")||s.includes("127.0.0.1:");if(s.includes("img.youtube.com")||s.includes("ytimg.com")){t.referrerPolicy="no-referrer",t.src=s,t.onerror=()=>{t.onerror=null,t.src=a};return}if(!d&&!h&&!s.includes("/clips/")&&!s.includes("/recordings/")&&!s.includes("/hls/")){t.src=s,t.onerror=()=>{t.onerror=null,t.src=a};return}if(typeof window<"u"&&window.location.protocol==="https:"&&h&&s.startsWith("http://")){t.src=a;return}if(di.has(s)){t.src=di.get(s);return}if(di.has(e)){t.src=di.get(e);return}t.src=a;try{const f={};d&&(f.headers={"ngrok-skip-browser-warning":"true"});const _=await fetch(s,f);if(!_.ok)throw new Error(`HTTP ${_.status}`);const b=await _.blob();if(b.type.includes("html"))throw new Error(`Invalid image mime type: ${b.type}`);const u=(b.type==="text/plain"||b.type==="application/octet-stream")&&s.match(/\.(jpg|jpeg|png|webp)/i)?new Blob([b],{type:"image/jpeg"}):b,x=URL.createObjectURL(u);di.set(e,x),di.set(s,x),t.src=x}catch(f){console.warn(`[MediaImage] Failed to load thumbnail: ${s}`,f.message),t.src=a}}function Et(t=document,e=ht){if(!t)return;t.querySelectorAll("img[data-thumb-src]").forEach(s=>{const d=s.getAttribute("data-thumb-src");wo(s,d,e)})}const ji={getNotifications:(t=30)=>re(`/api/Notification?count=${t}`),getUnreadCount:()=>re("/api/Notification/unread-count"),markAsRead:t=>re(`/api/Notification/${t}/read`,{method:"PUT"}),markAllAsRead:()=>re("/api/Notification/read-all",{method:"PUT"})},nn={orbitHype:{name:"orbitHype",label:"Hype Rocket",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hype-g" x1="10" y1="40" x2="38" y2="8">
          <stop offset="0%" stop-color="#00AEBD"/>
          <stop offset="100%" stop-color="#00f2fe"/>
        </linearGradient>
      </defs>
      <path d="M24 4L30 18H18L24 4Z" fill="url(#hype-g)" opacity="0.9"/>
      <rect x="20" y="18" width="8" height="16" rx="2" fill="url(#hype-g)"/>
      <path d="M16 28L20 22V34L16 28Z" fill="#00AEBD" opacity="0.7"/>
      <path d="M32 28L28 22V34L32 28Z" fill="#00AEBD" opacity="0.7"/>
      <ellipse cx="24" cy="38" rx="5" ry="7" fill="#FF6B35" opacity="0.8"/>
      <ellipse cx="24" cy="40" rx="3" ry="5" fill="#FFD93D" opacity="0.9"/>
      <circle cx="24" cy="14" r="2" fill="#fff" opacity="0.9"/>
    </svg>`},orbitFire:{name:"orbitFire",label:"Cosmic Flame",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fire-g" x1="24" y1="44" x2="24" y2="4">
          <stop offset="0%" stop-color="#FF1400"/>
          <stop offset="40%" stop-color="#FF6B35"/>
          <stop offset="70%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </linearGradient>
      </defs>
      <path d="M24 4C24 4 32 14 34 22C36 30 30 40 24 44C18 40 12 30 14 22C16 14 24 4 24 4Z" fill="url(#fire-g)" opacity="0.9"/>
      <path d="M24 16C24 16 28 22 29 26C30 30 27 36 24 38C21 36 18 30 19 26C20 22 24 16 24 16Z" fill="#00f2fe" opacity="0.6"/>
      <ellipse cx="24" cy="30" rx="4" ry="6" fill="#fff" opacity="0.3"/>
      <circle cx="22" cy="12" r="1" fill="#fff" opacity="0.8"/>
      <circle cx="28" cy="18" r="0.8" fill="#fff" opacity="0.6"/>
    </svg>`},orbitPog:{name:"orbitPog",label:"Amazed Planet",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pog-g" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#pog-g)" opacity="0.9"/>
      <circle cx="24" cy="24" r="18" fill="none" stroke="#00f2fe" stroke-width="1.5" opacity="0.5"/>
      <ellipse cx="18" cy="20" rx="3.5" ry="4.5" fill="#070a14"/>
      <ellipse cx="30" cy="20" rx="3.5" ry="4.5" fill="#070a14"/>
      <circle cx="18" cy="19" r="1.5" fill="#fff"/>
      <circle cx="30" cy="19" r="1.5" fill="#fff"/>
      <ellipse cx="24" cy="31" rx="5" ry="6" fill="#070a14"/>
      <ellipse cx="24" cy="30" rx="3" ry="2" fill="#00f2fe" opacity="0.3"/>
      <path d="M10 12C14 8 18 10 20 12" stroke="#00f2fe" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
      <path d="M28 12C30 10 34 8 38 12" stroke="#00f2fe" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
    </svg>`},orbitLove:{name:"orbitLove",label:"Nebula Heart",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="love-g" x1="10" y1="10" x2="38" y2="40">
          <stop offset="0%" stop-color="#FF69B4"/>
          <stop offset="50%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#7928CA"/>
        </linearGradient>
        <filter id="love-glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M24 42L8 24C4 18 6 10 14 8C18 7 22 9 24 12C26 9 30 7 34 8C42 10 44 18 40 24L24 42Z" fill="url(#love-g)" filter="url(#love-glow)" opacity="0.9"/>
      <path d="M24 36L14 24C12 20 13 16 17 14C19 13 22 14 24 17C26 14 29 13 31 14C35 16 36 20 34 24L24 36Z" fill="#fff" opacity="0.15"/>
      <circle cx="16" cy="18" r="1.5" fill="#fff" opacity="0.7"/>
      <circle cx="20" cy="14" r="1" fill="#fff" opacity="0.5"/>
    </svg>`},orbitGG:{name:"orbitGG",label:"Star Trophy",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gg-g" x1="14" y1="6" x2="34" y2="42">
          <stop offset="0%" stop-color="#FFD93D"/>
          <stop offset="100%" stop-color="#FF6B35"/>
        </linearGradient>
      </defs>
      <path d="M24 4L28 16H40L30 24L34 36L24 28L14 36L18 24L8 16H20L24 4Z" fill="url(#gg-g)" opacity="0.9"/>
      <path d="M24 10L26.5 18H34L28 23L30.5 31L24 26L17.5 31L20 23L14 18H21.5L24 10Z" fill="#fff" opacity="0.2"/>
      <rect x="20" y="36" width="8" height="4" rx="1" fill="#00AEBD" opacity="0.8"/>
      <rect x="16" y="40" width="16" height="3" rx="1.5" fill="#00AEBD"/>
      <text x="24" y="25" text-anchor="middle" fill="#070a14" font-size="8" font-weight="900" font-family="sans-serif">GG</text>
    </svg>`},orbitLUL:{name:"orbitLUL",label:"Laughing Moon",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lul-g" cx="40%" cy="40%">
          <stop offset="0%" stop-color="#E8E0D0"/>
          <stop offset="100%" stop-color="#9DB2CE"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#lul-g)" opacity="0.9"/>
      <circle cx="18" cy="14" r="3" fill="#9DB2CE" opacity="0.3"/>
      <circle cx="32" cy="20" r="2" fill="#9DB2CE" opacity="0.2"/>
      <circle cx="26" cy="10" r="1.5" fill="#9DB2CE" opacity="0.25"/>
      <path d="M14 20C14 20 16 17 18 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M30 20C30 20 32 17 34 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M15 28C18 34 30 34 33 28" stroke="#070a14" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M16 28C19 32 29 32 32 28" fill="#070a14" opacity="0.8"/>
      <circle cx="14" cy="25" r="2.5" fill="#FF69B4" opacity="0.25"/>
      <circle cx="34" cy="25" r="2.5" fill="#FF69B4" opacity="0.25"/>
    </svg>`},orbitSad:{name:"orbitSad",label:"Crying Comet",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sad-g" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#5B7FBB"/>
          <stop offset="100%" stop-color="#2C3E6B"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="22" r="16" fill="url(#sad-g)" opacity="0.9"/>
      <circle cx="24" cy="22" r="16" fill="none" stroke="#5B7FBB" stroke-width="1" opacity="0.4"/>
      <ellipse cx="18" cy="19" rx="3" ry="3.5" fill="#0f1424"/>
      <ellipse cx="30" cy="19" rx="3" ry="3.5" fill="#0f1424"/>
      <circle cx="17" cy="18" r="1.2" fill="#fff" opacity="0.7"/>
      <circle cx="29" cy="18" r="1.2" fill="#fff" opacity="0.7"/>
      <path d="M19 29C21 27 27 27 29 29" stroke="#0f1424" stroke-width="2" stroke-linecap="round" fill="none"/>
      <path d="M16 24L14 34L16 32L14 42" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M32 24L34 34L32 32L34 42" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <circle cx="15" cy="36" r="1.5" fill="#00f2fe" opacity="0.5"/>
      <circle cx="33" cy="38" r="1" fill="#00f2fe" opacity="0.4"/>
    </svg>`},orbitCrown:{name:"orbitCrown",label:"Cosmic Crown",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crown-g" x1="8" y1="16" x2="40" y2="40">
          <stop offset="0%" stop-color="#FFD93D"/>
          <stop offset="50%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#7928CA"/>
        </linearGradient>
      </defs>
      <path d="M6 34L12 14L20 24L24 10L28 24L36 14L42 34H6Z" fill="url(#crown-g)" opacity="0.9"/>
      <rect x="6" y="34" width="36" height="6" rx="2" fill="url(#crown-g)"/>
      <circle cx="12" cy="14" r="3" fill="#FFD93D"/>
      <circle cx="24" cy="10" r="3" fill="#00f2fe"/>
      <circle cx="36" cy="14" r="3" fill="#7928CA"/>
      <circle cx="12" cy="14" r="1.5" fill="#fff" opacity="0.6"/>
      <circle cx="24" cy="10" r="1.5" fill="#fff" opacity="0.6"/>
      <circle cx="36" cy="14" r="1.5" fill="#fff" opacity="0.6"/>
      <rect x="14" y="36" width="4" height="2" rx="1" fill="#fff" opacity="0.2"/>
      <rect x="22" y="36" width="4" height="2" rx="1" fill="#fff" opacity="0.2"/>
      <rect x="30" y="36" width="4" height="2" rx="1" fill="#fff" opacity="0.2"/>
    </svg>`},orbitWave:{name:"orbitWave",label:"Waving Satellite",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wave-g" x1="12" y1="12" x2="36" y2="36">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </linearGradient>
      </defs>
      <rect x="18" y="18" width="12" height="12" rx="2" fill="url(#wave-g)" transform="rotate(45 24 24)"/>
      <line x1="16" y1="16" x2="8" y2="8" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <line x1="32" y1="16" x2="40" y2="8" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <line x1="16" y1="32" x2="8" y2="40" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <line x1="32" y1="32" x2="40" y2="40" stroke="#00AEBD" stroke-width="2" stroke-linecap="round"/>
      <circle cx="8" cy="8" r="3" fill="#00f2fe" opacity="0.8"/>
      <circle cx="40" cy="8" r="3" fill="#00f2fe" opacity="0.8"/>
      <circle cx="24" cy="24" r="3" fill="#fff" opacity="0.3"/>
      <path d="M4 18C2 14 2 10 4 6" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
      <path d="M2 20C-1 14 -1 8 2 4" stroke="#00f2fe" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.3"/>
      <path d="M44 18C46 14 46 10 44 6" stroke="#00f2fe" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
    </svg>`},orbitRage:{name:"orbitRage",label:"Exploding Star",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rage-g" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#FF6B35"/>
          <stop offset="60%" stop-color="#FF1400"/>
          <stop offset="100%" stop-color="#8B0000"/>
        </radialGradient>
      </defs>
      <polygon points="24,2 28,14 42,14 31,22 35,36 24,28 13,36 17,22 6,14 20,14" fill="url(#rage-g)" opacity="0.9"/>
      <circle cx="24" cy="22" r="10" fill="#FF1400" opacity="0.5"/>
      <path d="M16 18L20 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M32 18L28 20" stroke="#070a14" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="19" cy="22" rx="2" ry="2.5" fill="#070a14"/>
      <ellipse cx="29" cy="22" rx="2" ry="2.5" fill="#070a14"/>
      <circle cx="19" cy="21.5" r="0.8" fill="#FF6B35"/>
      <circle cx="29" cy="21.5" r="0.8" fill="#FF6B35"/>
      <path d="M20 28L24 26L28 28" stroke="#070a14" stroke-width="2" stroke-linecap="round" fill="none"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
      <line x1="44" y1="4" x2="38" y2="10" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
      <line x1="4" y1="44" x2="10" y2="38" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
      <line x1="44" y1="44" x2="38" y2="38" stroke="#FFD93D" stroke-width="1.5" opacity="0.6"/>
    </svg>`},orbitChill:{name:"orbitChill",label:"Cool Planet",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="chill-g" cx="45%" cy="45%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="26" r="16" fill="url(#chill-g)" opacity="0.9"/>
      <circle cx="18" cy="20" r="4" fill="#00AEBD" opacity="0.3"/>
      <circle cx="30" cy="28" r="3" fill="#00AEBD" opacity="0.2"/>
      <path d="M12 22H20L22 18H36L34 22" stroke="#070a14" stroke-width="2" fill="#1a1a2e" opacity="0.85"/>
      <rect x="13" y="18" width="7" height="4" rx="1" fill="#1a1a2e" opacity="0.8"/>
      <rect x="22" y="18" width="13" height="4" rx="1" fill="#1a1a2e" opacity="0.8"/>
      <line x1="16" y1="20" x2="17" y2="20" stroke="#7928CA" stroke-width="1.5"/>
      <line x1="26" y1="20" x2="32" y2="20" stroke="#00f2fe" stroke-width="1.5" opacity="0.6"/>
      <path d="M19 33C21 35 27 35 29 33" stroke="#070a14" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle cx="14" cy="30" r="2" fill="#FF69B4" opacity="0.2"/>
      <circle cx="34" cy="30" r="2" fill="#FF69B4" opacity="0.2"/>
    </svg>`},orbitStar:{name:"orbitStar",label:"Shooting Star",svg:`<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="star-g" x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stop-color="#FFD93D"/>
          <stop offset="50%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#00AEBD"/>
        </linearGradient>
      </defs>
      <path d="M34 8L36 14H42L37 18L39 24L34 20L29 24L31 18L26 14H32L34 8Z" fill="url(#star-g)"/>
      <line x1="30" y1="20" x2="6" y2="42" stroke="url(#star-g)" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
      <line x1="28" y1="22" x2="10" y2="38" stroke="#00f2fe" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
      <line x1="32" y1="22" x2="16" y2="36" stroke="#FFD93D" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
      <circle cx="34" cy="16" r="6" fill="#FFD93D" opacity="0.15"/>
      <circle cx="10" cy="38" r="2" fill="#00f2fe" opacity="0.4"/>
      <circle cx="6" cy="42" r="1.5" fill="#00f2fe" opacity="0.3"/>
      <circle cx="18" cy="32" r="1" fill="#FFD93D" opacity="0.5"/>
      <circle cx="22" cy="28" r="0.8" fill="#fff" opacity="0.6"/>
    </svg>`}};function mt(t){var e;return((e=nn[t])==null?void 0:e.svg)||""}function ba(){return Object.values(nn)}function Bn({src:t,fallback:e="?",size:a="md"}){const s=a==="sm"?"12":a==="lg"?"20":a==="xl"?"28":"15",d=t?`<img src="${t}" alt="" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" /><span class="avatar-fallback" style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:${s}px;color:var(--color-cyan-neon);">${e}</span>`:`<span class="avatar-fallback" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:${s}px;color:var(--color-cyan-neon);">${e}</span>`;return`
    <div class="orbit-saturn-avatar saturn-${a}">
      <div class="avatar-planet">${d}</div>
      <div class="saturn-ring"></div>
      <div class="saturn-ring-2"></div>
      <div class="saturn-moon"></div>
    </div>
  `}function So(){const t=I.getState(),e=t.currentUser,a=t.sidebarCollapsed,s=t.currentView,d=e&&e.roles&&e.roles.includes&&e.roles.includes("Admin");return!e||["splash","login","register","otp","forgot-password","reset-password"].includes(s)?"":`
    <aside class="app-sidebar ${a?"collapsed":""}" id="app-sidebar">
      <div class="sidebar-logo">
        <img src="${Jt}" alt="Orbit" />
        <span class="logo-text">rbit</span>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section">Menu</div>
        <a class="sidebar-link ${s==="home"?"active":""}" data-nav="home">
          <span class="nav-icon">${N.home}</span>
          <span class="nav-label">Home</span>
        </a>
        <a class="sidebar-link ${s==="categories"?"active":""}" data-nav="categories">
          <span class="nav-icon">${N.grid}</span>
          <span class="nav-label">Browse</span>
        </a>
        <a class="sidebar-link ${s==="clips"?"active":""}" data-nav="clips">
          <span class="nav-icon">${N.clip}</span>
          <span class="nav-label">Top Clips</span>
        </a>

        <div class="sidebar-section">Creator</div>
        <a class="sidebar-link ${s==="studio"?"active":""}" data-nav="studio">
          <span class="nav-icon">${N.monitor}</span>
          <span class="nav-label">Dashboard</span>
        </a>

        ${d?`
        <div class="sidebar-section">Admin</div>
        <a class="sidebar-link ${s==="admin"?"active":""}" data-nav="admin">
          <span class="nav-icon">${N.admin}</span>
          <span class="nav-label">Admin Panel</span>
        </a>
        `:""}

        <div class="sidebar-section">Following</div>
        <div class="followed-list" id="sidebar-followed">
          ${t.followedChannels.length===0?`
            <div style="padding: 8px 14px; font-size: 12px; color: var(--color-text-muted);">
              ${a?"":"No channels followed yet"}
            </div>
          `:t.followedChannels.slice(0,8).map(h=>`
            <div class="followed-item" data-channel-id="${h.id||h.channelId}">
              <div class="followed-avatar">
                ${h.isLive?Bn({src:h.profilePhotoUrl,fallback:(h.name||h.channelName||"C")[0].toUpperCase(),size:"sm"}):h.profilePhotoUrl?`<img src="${h.profilePhotoUrl}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" />`:`<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;">${(h.name||h.channelName||"C")[0].toUpperCase()}</div>`}
              </div>
              <span class="followed-name" style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:4px;">
                <span class="truncate">${h.name||h.channelName||"Channel"}</span>
                ${h.isLive?'<span style="width:7px;height:7px;border-radius:50%;background:var(--color-error,#ef4444);display:inline-block;box-shadow:0 0 6px #ef4444;flex-shrink:0;animation:sidebar-live-pulse 2s infinite;"></span>':""}
              </span>
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
            <div class="user-role">${d?"Admin":"Viewer"}</div>
          </div>
        </div>
      </div>

      <button class="sidebar-toggle" id="sidebar-toggle-btn">
        ${a?N.chevronRight:N.chevronLeft}
      </button>
    </aside>
  `}function Eo(){const t=I.getState(),e=t.currentUser,a=t.currentView;return!e||["splash","login","register","otp","forgot-password","reset-password"].includes(a)?"":`
    <header class="app-topbar" id="app-topbar">
      <div class="topbar-left">
        <div class="search-bar" id="topbar-search">
          ${N.search}
          <input type="text" id="topbar-search-input" placeholder="Search channels, categories, clips..." />
        </div>
      </div>
      <div class="topbar-right">
        <button class="topbar-action" id="topbar-go-live" title="Go Live">
          ${N.video}
        </button>
        <div class="dropdown" id="notif-dropdown" style="position:relative;">
          <button class="topbar-action" id="topbar-notifications" title="Notifications" style="position:relative;">
            ${N.bell}
            <span class="notif-badge hidden" id="notif-badge" style="position:absolute;top:4px;right:4px;background:var(--color-live-red,#ef4444);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;line-height:1;box-shadow:0 0 8px rgba(239,68,68,0.6);">0</span>
          </button>
          <div class="dropdown-menu hidden" id="notif-dropdown-menu" style="width:340px;right:0;padding:0;border-radius:16px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.6);border:1px solid rgba(0,242,254,0.2);background:var(--color-space-panel,#121626);z-index:200;">
            <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);">
              <strong style="font-size:14px;color:#fff;">Notifications</strong>
              <button id="mark-all-read-btn" style="background:none;border:none;color:var(--color-cyan-neon,#00f2fe);font-size:12px;font-weight:600;cursor:pointer;">Mark all read</button>
            </div>
            <div id="notif-items-list" style="max-height:340px;overflow-y:auto;">
              <div style="padding:20px;text-align:center;color:var(--color-text-muted);font-size:13px;">No notifications</div>
            </div>
          </div>
        </div>
        <div class="dropdown" id="user-dropdown">
          <button class="topbar-user-btn" id="topbar-user-trigger">
            <div class="mini-avatar">
              ${e.profilePictureUrl?`<img src="${e.profilePictureUrl}" alt="" />`:(e.fullName||e.username||"U")[0].toUpperCase()}
            </div>
            <span style="font-size:13px;font-weight:500;color:#fff;">${e.username||"User"}</span>
            ${N.chevronDown}
          </button>
          <div class="dropdown-menu hidden" id="user-dropdown-menu">
            <div class="dropdown-item" data-action="profile">${N.user} Profile</div>
            <div class="dropdown-item" data-action="studio">${N.monitor} Creator Studio</div>
            <div class="dropdown-item" data-action="settings">${N.settings} Settings</div>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:4px 0;" />
            <div class="dropdown-item" data-action="logout" style="color:var(--color-error);">${N.logout} Log Out</div>
          </div>
        </div>
      </div>
    </header>
  `}function ko(){document.querySelectorAll(".sidebar-link[data-nav]").forEach(y=>{y.addEventListener("click",()=>I.navigate(y.dataset.nav))}),document.querySelectorAll(".followed-item[data-channel-id]").forEach(y=>{y.addEventListener("click",()=>I.navigate("channel",{channelId:parseInt(y.dataset.channelId)}))});const t=document.getElementById("sidebar-toggle-btn");t&&t.addEventListener("click",()=>I.toggleSidebar());const e=document.getElementById("sidebar-user-btn");e&&e.addEventListener("click",()=>I.navigate("profile"));const a=document.getElementById("topbar-search-input");a&&a.addEventListener("keydown",y=>{y.key==="Enter"&&a.value.trim()&&I.navigate("search",{query:a.value.trim()})});const s=document.getElementById("topbar-go-live");s&&s.addEventListener("click",()=>I.navigate("studio"));const d=document.getElementById("topbar-user-trigger"),h=document.getElementById("user-dropdown-menu");d&&h&&(d.addEventListener("click",y=>{y.stopPropagation(),h.classList.toggle("hidden")}),document.addEventListener("click",()=>h.classList.add("hidden")),h.querySelectorAll(".dropdown-item").forEach(y=>{y.addEventListener("click",()=>{const S=y.dataset.action;S==="logout"?(ln(),Nt(null),I.setCurrentUser(null),I.navigate("splash"),I.showToast("Logged out successfully","info")):S==="profile"?I.navigate("profile"):S==="studio"?I.navigate("studio"):S==="settings"&&I.navigate("settings"),h.classList.add("hidden")})}));const g=document.getElementById("topbar-notifications"),f=document.getElementById("notif-dropdown-menu"),_=document.getElementById("notif-badge"),b=document.getElementById("notif-items-list"),u=document.getElementById("mark-all-read-btn"),x=async()=>{try{const y=await ji.getUnreadCount(),S=(y==null?void 0:y.unreadCount)||0;_&&(S>0?(_.textContent=S>99?"99+":S,_.classList.remove("hidden")):_.classList.add("hidden"))}catch{}},m=async()=>{if(b){b.innerHTML='<div style="padding:20px;text-align:center;"><div class="spinner" style="width:20px;height:20px;margin:0 auto;"></div></div>';try{const y=await ji.getNotifications(30);if(!y||!y.length){b.innerHTML='<div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px;">No notifications yet</div>';return}b.innerHTML=y.map(S=>{let w="🔔";S.type==="STREAM_LIVE"?w="🔴":S.type==="NEW_FOLLOWER"?w="🪐":S.type==="MOD_HIRED"&&(w="🛡️");const P=S.createdAt?new Date(S.createdAt).toLocaleDateString([],{month:"short",day:"numeric"}):"";return`
          <div class="notif-item ${S.isRead?"":"unread"}" data-nid="${S.id}" data-type="${S.type}" data-data="${S.data||""}" style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);background:${S.isRead?"transparent":"rgba(0,242,254,0.05)"};cursor:pointer;display:flex;gap:12px;align-items:flex-start;transition:background 0.2s;">
            <div style="font-size:18px;line-height:1;margin-top:2px;">${w}</div>
            <div style="flex:1;overflow:hidden;">
              <div style="font-size:13px;font-weight:${S.isRead?"500":"700"};color:#fff;display:flex;justify-content:space-between;align-items:center;">
                <span class="truncate">${S.title}</span>
                <span style="font-size:11px;color:var(--color-text-muted);font-weight:400;margin-left:8px;">${P}</span>
              </div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;line-height:1.4;">${S.message}</div>
            </div>
            ${S.isRead?"":'<span style="width:8px;height:8px;border-radius:50%;background:var(--color-cyan-neon);flex-shrink:0;margin-top:6px;"></span>'}
          </div>
        `}).join(""),b.querySelectorAll(".notif-item").forEach(S=>{S.addEventListener("click",async()=>{const w=parseInt(S.dataset.nid),P=S.dataset.type,$=S.dataset.data;await ji.markAsRead(w),x(),f==null||f.classList.add("hidden"),P==="STREAM_LIVE"&&$?I.navigate("watch",{streamId:parseInt($)}):(P==="NEW_FOLLOWER"||P==="MOD_HIRED")&&$&&I.navigate("channel",{channelId:parseInt($)})})})}catch{b.innerHTML='<div style="padding:20px;text-align:center;color:var(--color-error);font-size:13px;">Failed to load notifications</div>'}}};g&&f&&(g.addEventListener("click",y=>{y.stopPropagation();const S=f.classList.contains("hidden");document.querySelectorAll(".dropdown-menu").forEach(w=>w.classList.add("hidden")),S&&(f.classList.remove("hidden"),m())}),document.addEventListener("click",()=>f.classList.add("hidden")),f.addEventListener("click",y=>y.stopPropagation()),u==null||u.addEventListener("click",async()=>{await ji.markAllAsRead(),x(),m()}),x())}function Co(){return`
    <div class="auth-page" style="flex-direction:column;gap:0;">
      <!-- Orbit rings -->
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-200px;left:-200px;"></div>
      </div>

      <!-- Floating icons -->
      <div class="space-icon animate-float" style="top:15%;left:12%;width:32px;">${N.rocket}</div>
      <div class="space-icon animate-float-slow" style="top:20%;right:15%;width:28px;">${N.planet}</div>
      <div class="space-icon animate-float" style="bottom:25%;left:18%;width:24px;animation-delay:1s;">${N.star}</div>
      <div class="space-icon animate-float-slow" style="bottom:20%;right:20%;width:30px;animation-delay:0.5s;">${N.rocket}</div>

      <div style="position:relative;z-index:2;text-align:center;" class="animate-fade-up">
        <div class="auth-logo-group" style="justify-content:center;margin-bottom:24px;">
          <img src="${Jt}" alt="Orbit" style="height:120px;" />
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
  `}function Ao(){var t,e;(t=document.getElementById("splash-login-btn"))==null||t.addEventListener("click",()=>I.navigate("login")),(e=document.getElementById("splash-signup-btn"))==null||e.addEventListener("click",()=>I.navigate("register"))}const It={async register(t){return await re("/api/Auth/register",{method:"POST",body:JSON.stringify(t)})},async confirmEmail(t,e){const a=await re("/api/Auth/confirm-email",{method:"POST",body:JSON.stringify({email:t,otp_Code:e})}),s=(a==null?void 0:a.accessToken)||(a==null?void 0:a.token);return a&&s&&(Ri(s,a.refreshToken),Nt(a)),a},async login(t,e){const a=await re("/api/Auth/login",{method:"POST",body:JSON.stringify({email:t,password:e})}),s=(a==null?void 0:a.accessToken)||(a==null?void 0:a.token);return a&&s&&(Ri(s,a.refreshToken),Nt(a)),a},async googleLogin(t){const e=await re("/api/Auth/google",{method:"POST",body:JSON.stringify({credential:t})}),a=(e==null?void 0:e.accessToken)||(e==null?void 0:e.token);return e&&a&&(Ri(a,e.refreshToken),Nt(e)),e},async refreshToken(){const t=Qi(),e=xi();if(!t)return null;try{const a=await fetch(`${Oi}/api/Auth/refresh-token`,{method:"POST",headers:{"Content-Type":"application/json",...e?{Authorization:`Bearer ${e}`}:{}},body:JSON.stringify({refreshToken:t})});if(a.ok){const s=await a.json(),d=(s==null?void 0:s.accessToken)||(s==null?void 0:s.token);if(s&&d)return Ri(d,s.refreshToken),Nt(s),s}}catch(a){console.warn("Failed to refresh token",a)}return null},async forgotPassword(t){return await re("/api/Auth/forgot-password",{method:"POST",body:JSON.stringify({email:t})})},async resetPassword(t,e,a){return await re("/api/Auth/reset-password",{method:"POST",body:JSON.stringify({email:t,otp_Code:e,newPassword:a})})},async revokeToken(){const t=Qi();if(t)try{await re("/api/Auth/revoke-token",{method:"POST",body:JSON.stringify({refreshToken:t})})}catch(e){console.warn("Revoke token error",e)}ln()},async getGoogleClientId(){return await re("/api/Auth/google-client-id")}};function To(){return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-200px;left:-200px;"></div>
      </div>
      <div class="space-icon animate-float" style="top:10%;left:8%;width:30px;">${N.rocket}</div>
      <div class="space-icon animate-float-slow" style="top:15%;right:10%;width:28px;">${N.planet}</div>
      <div class="space-icon animate-float" style="bottom:15%;right:12%;width:26px;animation-delay:0.8s;">${N.star}</div>

      <div class="auth-container animate-fade-up">
        <div class="auth-hero">
          <div class="auth-logo-group">
            <img src="${Jt}" alt="Orbit" />
            <span class="logo-text">rbit</span>
          </div>
          <p class="auth-tagline">Stream Across the Galaxy</p>
        </div>

        <div class="auth-form-panel">
          <h2>Stream Across the Galaxy</h2>
          <p class="auth-subtitle">Welcome back! Sign in to continue your cosmic journey.</p>

          <form id="login-form">
            <div class="form-group">
              <label>Email / Username</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.mail}</span>
                <input type="email" id="login-email" placeholder="example@mail.com" required />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.lock}</span>
                <input type="password" id="login-password" placeholder="Enter your password" required />
                <span class="input-toggle" id="toggle-login-pass">${N.eyeClosed}</span>
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
            <div class="social-buttons" style="justify-content:center;min-height:44px;">
              <div id="google-login-container" style="display:flex;justify-content:center;width:100%;">
                <button type="button" id="google-login-btn" class="social-btn" title="Sign in with Google" style="width:100%;height:44px;border-radius:24px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;font-weight:600;color:#333;background:#fff;border:1px solid #ddd;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                  ${N.google} <span>Continue with Google</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}function Lo(){var d,h,g,f;(d=document.getElementById("login-signup"))==null||d.addEventListener("click",()=>I.navigate("register")),(h=document.getElementById("login-forgot"))==null||h.addEventListener("click",()=>I.navigate("forgot-password"));const t=document.getElementById("login-password"),e=document.getElementById("toggle-login-pass");e&&t&&e.addEventListener("click",()=>{const _=t.type==="password";t.type=_?"text":"password",e.innerHTML=_?N.eyeOpen:N.eyeClosed}),(g=document.getElementById("login-form"))==null||g.addEventListener("submit",async _=>{_.preventDefault();const b=document.getElementById("login-submit"),u=document.getElementById("login-email").value.trim(),x=t.value;b.disabled=!0,b.textContent="Logging in...";try{const m=await It.login(u,x);I.setCurrentUser(m),I.showToast("Welcome back to Orbit!","success"),I.navigate("home")}catch(m){I.showToast(m.message||"Login failed","error")}finally{b.disabled=!1,b.textContent="Login"}});const a=async _=>{if(_!=null&&_.credential)try{I.showToast("Authenticating with Google...","info");const b=await It.googleLogin(_.credential);I.setCurrentUser(b),I.showToast("Welcome to Orbit!","success"),I.navigate("home")}catch(b){I.showToast(b.message||"Google authentication failed","error")}};(async()=>{var u,x;let _="42595995252-orbit.apps.googleusercontent.com";try{const m=await It.getGoogleClientId();m!=null&&m.clientId&&(_=m.clientId)}catch{}const b=()=>{var m,y;if((y=(m=window.google)==null?void 0:m.accounts)!=null&&y.id&&_)try{window.google.accounts.id.initialize({client_id:_,callback:a,auto_select:!1,cancel_on_tap_outside:!0});const S=document.getElementById("google-login-container");S&&window.google.accounts.id.renderButton(S,{theme:"outline",size:"large",type:"standard",shape:"pill",text:"continue_with",logo_alignment:"left",width:280})}catch(S){console.warn("[Google GIS] Initialization notice:",S)}};(x=(u=window.google)==null?void 0:u.accounts)!=null&&x.id?b():setTimeout(b,600)})(),(f=document.getElementById("google-login-btn"))==null||f.addEventListener("click",()=>{var _,b;(b=(_=window.google)==null?void 0:_.accounts)!=null&&b.id?window.google.accounts.id.prompt():I.showToast("Google services loading, please wait...","info")})}function Io(){return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
      </div>
      <div class="space-icon animate-float" style="top:12%;right:10%;width:30px;">${N.rocket}</div>
      <div class="space-icon animate-float-slow" style="bottom:18%;left:10%;width:26px;">${N.planet}</div>

      <div class="auth-container animate-fade-up">
        <div class="auth-hero">
          <div class="auth-logo-group">
            <img src="${Jt}" alt="Orbit" />
            <span class="logo-text">rbit</span>
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
                <span class="input-icon">${N.userRound}</span>
                <input type="text" id="reg-username" placeholder="Choose a username" required minlength="3" maxlength="50" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <div class="input-wrapper">
                  <span class="input-icon">${N.userRound}</span>
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
                <span class="input-icon">${N.calendar}</span>
                <input type="date" id="reg-dob" required style="color:var(--color-text-dark);" />
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.mail}</span>
                <input type="email" id="reg-email" placeholder="your@email.com" required />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.lock}</span>
                <input type="password" id="reg-password" placeholder="Min 6 characters" required minlength="6" />
                <span class="input-toggle" id="toggle-reg-pass">${N.eyeClosed}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.lock}</span>
                <input type="password" id="reg-confirm" placeholder="Re-enter password" required />
              </div>
            </div>

            <button type="submit" id="reg-submit" class="btn btn-primary btn-full" style="margin-top:12px;">Sign Up</button>

            <div style="text-align:center;margin:18px 0;font-size:13px;color:var(--color-space-deep);">
              Already have an account? <button type="button" id="reg-login" style="color:var(--color-cyan-primary);font-weight:600;">Login</button>
            </div>

            <div class="social-divider">or continue with</div>
            <div class="social-buttons" style="justify-content:center;min-height:44px;">
              <div id="google-reg-container" style="display:flex;justify-content:center;width:100%;">
                <button type="button" id="google-reg-btn" class="social-btn" title="Sign up with Google" style="width:100%;height:44px;border-radius:24px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;font-weight:600;color:#333;background:#fff;border:1px solid #ddd;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                  ${N.google} <span>Continue with Google</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}function Ro(){var d,h,g;(d=document.getElementById("reg-login"))==null||d.addEventListener("click",()=>I.navigate("login"));const t=document.getElementById("reg-password"),e=document.getElementById("toggle-reg-pass");e&&t&&e.addEventListener("click",()=>{const f=t.type==="password";t.type=f?"text":"password",e.innerHTML=f?N.eyeOpen:N.eyeClosed}),(h=document.getElementById("register-form"))==null||h.addEventListener("submit",async f=>{f.preventDefault();const _=document.getElementById("reg-submit"),b=document.getElementById("reg-password").value,u=document.getElementById("reg-confirm").value;if(b!==u){I.showToast("Passwords do not match","error");return}const x=document.getElementById("reg-dob").value,m=Math.floor((Date.now()-new Date(x).getTime())/(365.25*24*60*60*1e3));if(m<1||m>120){I.showToast("Invalid date of birth","error");return}const y=document.getElementById("reg-firstname").value.trim(),S=document.getElementById("reg-lastname").value.trim(),w={username:document.getElementById("reg-username").value.trim(),fullName:`${y} ${S}`,email:document.getElementById("reg-email").value.trim(),password:b,age:m};_.disabled=!0,_.textContent="Creating account...";try{await It.register(w),I.showToast("Account created! Check your email for OTP code.","success"),I.navigate("otp",{email:w.email})}catch(P){I.showToast(P.message||"Registration failed","error")}finally{_.disabled=!1,_.textContent="Sign Up"}});const a=async f=>{if(f!=null&&f.credential)try{I.showToast("Creating account with Google...","info");const _=await It.googleLogin(f.credential);I.setCurrentUser(_),I.showToast("Welcome to Orbit!","success"),I.navigate("home")}catch(_){I.showToast(_.message||"Google signup failed","error")}};(async()=>{var b,u;let f="42595995252-orbit.apps.googleusercontent.com";try{const x=await It.getGoogleClientId();x!=null&&x.clientId&&(f=x.clientId)}catch{}const _=()=>{var x,m;if((m=(x=window.google)==null?void 0:x.accounts)!=null&&m.id&&f)try{window.google.accounts.id.initialize({client_id:f,callback:a,auto_select:!1,cancel_on_tap_outside:!0});const y=document.getElementById("google-reg-container");y&&window.google.accounts.id.renderButton(y,{theme:"outline",size:"large",type:"standard",shape:"pill",text:"signup_with",logo_alignment:"left",width:280})}catch(y){console.warn("[Google GIS] Register init notice:",y)}};(u=(b=window.google)==null?void 0:b.accounts)!=null&&u.id?_():setTimeout(_,600)})(),(g=document.getElementById("google-reg-btn"))==null||g.addEventListener("click",()=>{var f,_;(_=(f=window.google)==null?void 0:f.accounts)!=null&&_.id?window.google.accounts.id.prompt():I.showToast("Google services loading, please wait...","info")})}function Mo(){var e;const t=((e=I.getState().viewParams)==null?void 0:e.email)||"";return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-150px;left:-150px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="text-align:center;flex:unset;width:100%;">
          <div style="margin-bottom:16px;">
            <img src="${Jt}" alt="Orbit" style="height:60px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Verify Your Email</h2>
          <p class="auth-subtitle" style="text-align:center;">We sent a 6-digit code to <strong>${t}</strong></p>

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
  `}function Bo(){var e,a;const t=document.querySelectorAll(".otp-box");t.forEach((s,d)=>{s.addEventListener("input",h=>{h.target.value&&d<t.length-1&&t[d+1].focus()}),s.addEventListener("keydown",h=>{h.key==="Backspace"&&!h.target.value&&d>0&&t[d-1].focus()}),s.addEventListener("paste",h=>{h.preventDefault();const g=(h.clipboardData||window.clipboardData).getData("text").trim();[...g].slice(0,6).forEach((f,_)=>{t[_]&&(t[_].value=f)}),t[Math.min(g.length,5)]&&t[Math.min(g.length,5)].focus()})}),(e=document.getElementById("otp-back"))==null||e.addEventListener("click",()=>I.navigate("login")),(a=document.getElementById("otp-submit"))==null||a.addEventListener("click",async()=>{var g;const s=document.getElementById("otp-submit"),d=[...t].map(f=>f.value).join("");if(d.length!==6){I.showToast("Please enter the full 6-digit code","error");return}const h=(g=I.getState().viewParams)==null?void 0:g.email;if(!h){I.showToast("Email not found. Please register again.","error");return}s.disabled=!0,s.textContent="Verifying...";try{const f=await It.confirmEmail(h,d);I.setCurrentUser(f),I.showToast("Email verified! Welcome to Orbit!","success"),I.navigate("home")}catch(f){I.showToast(f.message||"Verification failed","error")}finally{s.disabled=!1,s.textContent="Confirm"}})}function Do(){return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="flex:unset;width:100%;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${Jt}" alt="Orbit" style="height:50px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Forgot Password</h2>
          <p class="auth-subtitle" style="text-align:center;">Enter your email to receive a reset code</p>
          <form id="forgot-form">
            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.mail}</span>
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
  `}function Po(){var t,e;(t=document.getElementById("forgot-back"))==null||t.addEventListener("click",()=>I.navigate("login")),(e=document.getElementById("forgot-form"))==null||e.addEventListener("submit",async a=>{a.preventDefault();const s=document.getElementById("forgot-submit"),d=document.getElementById("forgot-email").value.trim();s.disabled=!0,s.textContent="Sending...";try{await It.forgotPassword(d),I.showToast("Reset code sent! Check your email.","success"),I.navigate("reset-password",{email:d})}catch(h){I.showToast(h.message||"Failed to send code","error")}finally{s.disabled=!1,s.textContent="Get Code"}})}function $o(){var e;const t=((e=I.getState().viewParams)==null?void 0:e.email)||"";return`
    <div class="auth-page">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="orbit-ring orbit-ring-1" style="top:-100px;left:-100px;"></div>
      </div>
      <div class="auth-container animate-fade-up" style="max-width:520px;">
        <div class="auth-form-panel" style="flex:unset;width:100%;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${Jt}" alt="Orbit" style="height:50px;margin:0 auto;filter:drop-shadow(0 4px 20px rgba(0,174,189,0.4));" />
          </div>
          <h2 style="text-align:center;">Reset Password</h2>
          <p class="auth-subtitle" style="text-align:center;">Enter the OTP code and your new password</p>
          <form id="reset-form">
            <div class="form-group">
              <label>OTP Code</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.key}</span>
                <input type="text" id="reset-otp" placeholder="Enter the 6-digit code" required />
              </div>
            </div>
            <div class="form-group">
              <label>New Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.lock}</span>
                <input type="password" id="reset-pass" placeholder="Min 6 characters" required minlength="6" />
              </div>
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">${N.lock}</span>
                <input type="password" id="reset-confirm" placeholder="Re-enter password" required />
              </div>
            </div>
            <input type="hidden" id="reset-email" value="${t}" />
            <button type="submit" id="reset-submit" class="btn btn-primary btn-full">Confirm</button>
            <div style="text-align:center;margin-top:16px;">
              <button type="button" id="reset-back" class="btn btn-ghost btn-full">Back to Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `}function Oo(){var t,e;(t=document.getElementById("reset-back"))==null||t.addEventListener("click",()=>I.navigate("login")),(e=document.getElementById("reset-form"))==null||e.addEventListener("submit",async a=>{a.preventDefault();const s=document.getElementById("reset-submit"),d=document.getElementById("reset-pass").value,h=document.getElementById("reset-confirm").value;if(d!==h){I.showToast("Passwords do not match","error");return}const g=document.getElementById("reset-email").value,f=document.getElementById("reset-otp").value.trim();s.disabled=!0,s.textContent="Resetting...";try{await It.resetPassword(g,f,d),I.showToast("Password reset successful! Please log in.","success"),I.navigate("login")}catch(_){I.showToast(_.message||"Reset failed","error")}finally{s.disabled=!1,s.textContent="Confirm"}})}const wt={getLiveStreams:()=>re("/api/Stream/live"),getActiveStreams:()=>re("/api/Stream/live"),getStreamById:t=>re(`/api/Stream/${t}`),createStream:t=>re("/api/Stream/create",{method:"POST",body:JSON.stringify(t)}),updateCurrentStream:t=>re("/api/Stream/current",{method:"PATCH",body:JSON.stringify(t)}),endStream:()=>re("/api/Stream/end",{method:"POST"}),generateStreamKey:()=>re("/api/Stream/key/generate",{method:"POST"}),getStreamKey:()=>re("/api/Stream/key"),setMediaServerUrl:t=>re("/api/Stream/server/set-url",{method:"POST",body:JSON.stringify(t)}),clearMediaServerUrl:()=>re("/api/Stream/server/clear-url",{method:"POST"}),getMediaServerConfig:()=>re("/api/Stream/server/config")},_t={getAll:()=>re("/api/Category"),getTop:(t=10)=>re(`/api/Category/top?count=${t}`),search:t=>re(`/api/Category/search?q=${encodeURIComponent(t)}`),getBySlug:t=>re(`/api/Category/${t}`),getStreams:t=>re(`/api/Category/${t}/streams`),getClips:(t,e=20)=>re(`/api/Category/${t}/clips?count=${e}`),create:t=>re("/api/Category",{method:"POST",body:JSON.stringify(t)}),update:(t,e)=>re(`/api/Category/${t}`,{method:"PUT",body:JSON.stringify(e)}),delete:t=>re(`/api/Category/${t}`,{method:"DELETE"}),uploadImage:(t,e)=>{const a=new FormData;return a.append("file",e),re(`/api/Category/${t}/image`,{method:"POST",body:a})}},Ft={create:async t=>{try{return await re("/api/Clip/create",{method:"POST",body:JSON.stringify(t)})}catch(e){if(e&&(e.status===404||e.status===405)){console.warn(`[clipApi] /api/Clip/create returned ${e.status}, trying /api/Clip...`);try{return await re("/api/Clip",{method:"POST",body:JSON.stringify(t)})}catch(a){if(a&&(a.status===404||a.status===405))return console.warn(`[clipApi] /api/Clip returned ${a.status}, falling back to /api/Clip/slice with pre-generated videoUrl...`),await re("/api/Clip/slice",{method:"POST",body:JSON.stringify({liveStreamId:t.liveStreamId||t.streamId||null,streamId:t.liveStreamId||t.streamId||null,channelId:t.channelId,title:t.title,durationSeconds:t.durationSeconds,videoUrl:t.videoUrl,thumbnailUrl:t.thumbnailUrl})});throw a}}throw e}},slice:async t=>{const e=await Mt().catch(()=>null);let a=null;e!=null&&e.hlsBaseUrl&&(a=`${e.hlsBaseUrl.replace(/\/hls\/?$/,"")}/api/clip`);const s=[a,"https://localhost:8443/api/clip","http://localhost:8080/api/clip","http://127.0.0.1:8085/api/clip","http://localhost:8085/api/clip"].filter(Boolean),d=[...new Set(s)];let h=null;for(const g of d)try{console.log(`[clipApi] Attempting direct media server slice on: ${g}`);const f=new AbortController,_=setTimeout(()=>f.abort(),25e3),b=await fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},signal:f.signal,body:JSON.stringify({streamKey:t.streamKey||"",recordingFileName:t.recordingFileName||null,isLive:t.isLive!==!1,durationSeconds:t.durationSeconds||60,title:t.title||"Untitled Clip"})});if(clearTimeout(_),b.ok){const u=await b.json();if(u&&(u.success||u.clipUrl)){console.log(`[clipApi] Direct slice succeeded on ${g}:`,u),h=u;break}}else{const u=await b.text().catch(()=>"");console.warn(`[clipApi] ${g} responded with HTTP ${b.status}:`,u)}}catch(f){console.warn(`[clipApi] Failed to reach ${g}:`,f.message)}if(h&&h.clipUrl){const g=Yt(h.clipUrl),f=h.thumbnailUrl?Yt(h.thumbnailUrl):null;return console.log("[clipApi] Registering physical media server clip with backend API:",{fullClipUrl:g,fullThumbUrl:f}),await Ft.create({title:t.title||"Untitled Clip",channelId:t.channelId,liveStreamId:t.liveStreamId||t.streamId||null,categoryId:t.categoryId||null,durationSeconds:h.durationSeconds||t.durationSeconds||60,videoUrl:g,thumbnailUrl:f})}console.log("[clipApi] Direct slice not available, attempting backend slice...");try{return await re("/api/Clip/slice",{method:"POST",body:JSON.stringify(t)})}catch(g){const f=g&&g.message||String(g);if(console.warn("[clipApi] Backend slice failed:",f),t.channelId||t.liveStreamId)return console.log("[clipApi] Registering highlight with backend for simulated stream..."),await Ft.create({title:t.title||"Untitled Clip",channelId:t.channelId,liveStreamId:t.liveStreamId||t.streamId||null,categoryId:t.categoryId||null,durationSeconds:t.durationSeconds||60,videoUrl:t.recordingFileName||t.videoUrl||null,thumbnailUrl:t.thumbnailUrl||null});throw new Error(g.message||"Media server is not responding to clipping requests. Please verify the streaming server is running.")}},getChannelClips:(t,e=1,a=20)=>re(`/api/Clip/channel/${t}?page=${e}&pageSize=${a}`),getTop:(t=20)=>re(`/api/Clip/top?count=${t}`),getById:t=>re(`/api/Clip/${t}`),recordView:(t,e)=>re(`/api/Clip/${t}/view${e?`?sessionId=${encodeURIComponent(e)}`:""}`,{method:"POST"}),delete:t=>re(`/api/Clip/${t}`,{method:"DELETE"})};var Uo=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function No(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var xa={exports:{}};/*! For license information please see mpegts.js.LICENSE.txt */(function(t,e){(function(a,s){t.exports=s()})(Uo,function(){return function(){var a={964:function(h,g,f){h.exports=function(){function _(ee){return typeof ee=="function"}var b=Array.isArray?Array.isArray:function(ee){return Object.prototype.toString.call(ee)==="[object Array]"},u=0,x=void 0,m=void 0,y=function(ee,de){F[u]=ee,F[u+1]=de,(u+=2)===2&&(m?m(E):L())},S=typeof window<"u"?window:void 0,w=S||{},P=w.MutationObserver||w.WebKitMutationObserver,$=typeof self>"u"&&typeof process<"u"&&{}.toString.call(process)==="[object process]",z=typeof Uint8ClampedArray<"u"&&typeof importScripts<"u"&&typeof MessageChannel<"u";function D(){var ee=setTimeout;return function(){return ee(E,1)}}var F=new Array(1e3);function E(){for(var ee=0;ee<u;ee+=2)(0,F[ee])(F[ee+1]),F[ee]=void 0,F[ee+1]=void 0;u=0}var Y,j,X,V,L=void 0;function C(ee,de){var fe=this,ve=new this.constructor(Q);ve[T]===void 0&&ae(ve);var be=fe._state;if(be){var Re=arguments[be-1];y(function(){return R(be,ve,Re,fe._result)})}else Ae(fe,ve,ee,de);return ve}function B(ee){if(ee&&typeof ee=="object"&&ee.constructor===this)return ee;var de=new this(Q);return G(de,ee),de}L=$?function(){return process.nextTick(E)}:P?(j=0,X=new P(E),V=document.createTextNode(""),X.observe(V,{characterData:!0}),function(){V.data=j=++j%2}):z?((Y=new MessageChannel).port1.onmessage=E,function(){return Y.port2.postMessage(0)}):S===void 0?function(){try{var ee=Function("return this")().require("vertx");return(x=ee.runOnLoop||ee.runOnContext)!==void 0?function(){x(E)}:D()}catch{return D()}}():D();var T=Math.random().toString(36).substring(2);function Q(){}var K=void 0,ce=1,ue=2;function pe(ee,de,fe){de.constructor===ee.constructor&&fe===C&&de.constructor.resolve===B?function(ve,be){be._state===ce?ye(ve,be._result):be._state===ue?le(ve,be._result):Ae(be,void 0,function(Re){return G(ve,Re)},function(Re){return le(ve,Re)})}(ee,de):fe===void 0?ye(ee,de):_(fe)?function(ve,be,Re){y(function(Je){var st=!1,Tt=function(vt,wi,un,lt){try{vt.call(wi,un,lt)}catch(Si){return Si}}(Re,be,function(vt){st||(st=!0,be!==vt?G(Je,vt):ye(Je,vt))},function(vt){st||(st=!0,le(Je,vt))},Je._label);!st&&Tt&&(st=!0,le(Je,Tt))},ve)}(ee,de,fe):ye(ee,de)}function G(ee,de){if(ee===de)le(ee,new TypeError("You cannot resolve a promise with itself"));else if(be=typeof(ve=de),ve===null||be!=="object"&&be!=="function")ye(ee,de);else{var fe=void 0;try{fe=de.then}catch(Re){return void le(ee,Re)}pe(ee,de,fe)}var ve,be}function te(ee){ee._onerror&&ee._onerror(ee._result),q(ee)}function ye(ee,de){ee._state===K&&(ee._result=de,ee._state=ce,ee._subscribers.length!==0&&y(q,ee))}function le(ee,de){ee._state===K&&(ee._state=ue,ee._result=de,y(te,ee))}function Ae(ee,de,fe,ve){var be=ee._subscribers,Re=be.length;ee._onerror=null,be[Re]=de,be[Re+ce]=fe,be[Re+ue]=ve,Re===0&&ee._state&&y(q,ee)}function q(ee){var de=ee._subscribers,fe=ee._state;if(de.length!==0){for(var ve=void 0,be=void 0,Re=ee._result,Je=0;Je<de.length;Je+=3)ve=de[Je],be=de[Je+fe],ve?R(fe,ve,be,Re):be(Re);ee._subscribers.length=0}}function R(ee,de,fe,ve){var be=_(fe),Re=void 0,Je=void 0,st=!0;if(be){try{Re=fe(ve)}catch(Tt){st=!1,Je=Tt}if(de===Re)return void le(de,new TypeError("A promises callback cannot return that same promise."))}else Re=ve;de._state!==K||(be&&st?G(de,Re):st===!1?le(de,Je):ee===ce?ye(de,Re):ee===ue&&le(de,Re))}var W=0;function ae(ee){ee[T]=W++,ee._state=void 0,ee._result=void 0,ee._subscribers=[]}var Se=function(){function ee(de,fe){this._instanceConstructor=de,this.promise=new de(Q),this.promise[T]||ae(this.promise),b(fe)?(this.length=fe.length,this._remaining=fe.length,this._result=new Array(this.length),this.length===0?ye(this.promise,this._result):(this.length=this.length||0,this._enumerate(fe),this._remaining===0&&ye(this.promise,this._result))):le(this.promise,new Error("Array Methods must be provided an Array"))}return ee.prototype._enumerate=function(de){for(var fe=0;this._state===K&&fe<de.length;fe++)this._eachEntry(de[fe],fe)},ee.prototype._eachEntry=function(de,fe){var ve=this._instanceConstructor,be=ve.resolve;if(be===B){var Re=void 0,Je=void 0,st=!1;try{Re=de.then}catch(vt){st=!0,Je=vt}if(Re===C&&de._state!==K)this._settledAt(de._state,fe,de._result);else if(typeof Re!="function")this._remaining--,this._result[fe]=de;else if(ve===_e){var Tt=new ve(Q);st?le(Tt,Je):pe(Tt,de,Re),this._willSettleAt(Tt,fe)}else this._willSettleAt(new ve(function(vt){return vt(de)}),fe)}else this._willSettleAt(be(de),fe)},ee.prototype._settledAt=function(de,fe,ve){var be=this.promise;be._state===K&&(this._remaining--,de===ue?le(be,ve):this._result[fe]=ve),this._remaining===0&&ye(be,this._result)},ee.prototype._willSettleAt=function(de,fe){var ve=this;Ae(de,void 0,function(be){return ve._settledAt(ce,fe,be)},function(be){return ve._settledAt(ue,fe,be)})},ee}(),_e=function(){function ee(de){this[T]=W++,this._result=this._state=void 0,this._subscribers=[],Q!==de&&(typeof de!="function"&&function(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}(),this instanceof ee?function(fe,ve){try{ve(function(be){G(fe,be)},function(be){le(fe,be)})}catch(be){le(fe,be)}}(this,de):function(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}())}return ee.prototype.catch=function(de){return this.then(null,de)},ee.prototype.finally=function(de){var fe=this,ve=fe.constructor;return _(de)?fe.then(function(be){return ve.resolve(de()).then(function(){return be})},function(be){return ve.resolve(de()).then(function(){throw be})}):fe.then(de,de)},ee}();return _e.prototype.then=C,_e.all=function(ee){return new Se(this,ee).promise},_e.race=function(ee){var de=this;return b(ee)?new de(function(fe,ve){for(var be=ee.length,Re=0;Re<be;Re++)de.resolve(ee[Re]).then(fe,ve)}):new de(function(fe,ve){return ve(new TypeError("You must pass an array to race."))})},_e.resolve=B,_e.reject=function(ee){var de=new this(Q);return le(de,ee),de},_e._setScheduler=function(ee){m=ee},_e._setAsap=function(ee){y=ee},_e._asap=y,_e.polyfill=function(){var ee=void 0;if(f.g!==void 0)ee=f.g;else if(typeof self<"u")ee=self;else try{ee=Function("return this")()}catch{throw new Error("polyfill failed because global object is unavailable in this environment")}var de=ee.Promise;if(de){var fe=null;try{fe=Object.prototype.toString.call(de.resolve())}catch{}if(fe==="[object Promise]"&&!de.cast)return}ee.Promise=_e},_e.Promise=_e,_e}()},7:function(h){var g,f=typeof Reflect=="object"?Reflect:null,_=f&&typeof f.apply=="function"?f.apply:function(E,Y,j){return Function.prototype.apply.call(E,Y,j)};g=f&&typeof f.ownKeys=="function"?f.ownKeys:Object.getOwnPropertySymbols?function(E){return Object.getOwnPropertyNames(E).concat(Object.getOwnPropertySymbols(E))}:function(E){return Object.getOwnPropertyNames(E)};var b=Number.isNaN||function(E){return E!=E};function u(){u.init.call(this)}h.exports=u,h.exports.once=function(E,Y){return new Promise(function(j,X){function V(C){E.removeListener(Y,L),X(C)}function L(){typeof E.removeListener=="function"&&E.removeListener("error",V),j([].slice.call(arguments))}F(E,Y,L,{once:!0}),Y!=="error"&&function(C,B){typeof C.on=="function"&&F(C,"error",B,{once:!0})}(E,V)})},u.EventEmitter=u,u.prototype._events=void 0,u.prototype._eventsCount=0,u.prototype._maxListeners=void 0;var x=10;function m(E){if(typeof E!="function")throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof E)}function y(E){return E._maxListeners===void 0?u.defaultMaxListeners:E._maxListeners}function S(E,Y,j,X){var V,L,C,B;if(m(j),(L=E._events)===void 0?(L=E._events=Object.create(null),E._eventsCount=0):(L.newListener!==void 0&&(E.emit("newListener",Y,j.listener?j.listener:j),L=E._events),C=L[Y]),C===void 0)C=L[Y]=j,++E._eventsCount;else if(typeof C=="function"?C=L[Y]=X?[j,C]:[C,j]:X?C.unshift(j):C.push(j),(V=y(E))>0&&C.length>V&&!C.warned){C.warned=!0;var T=new Error("Possible EventEmitter memory leak detected. "+C.length+" "+String(Y)+" listeners added. Use emitter.setMaxListeners() to increase limit");T.name="MaxListenersExceededWarning",T.emitter=E,T.type=Y,T.count=C.length,B=T,console&&console.warn&&console.warn(B)}return E}function w(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length===0?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function P(E,Y,j){var X={fired:!1,wrapFn:void 0,target:E,type:Y,listener:j},V=w.bind(X);return V.listener=j,X.wrapFn=V,V}function $(E,Y,j){var X=E._events;if(X===void 0)return[];var V=X[Y];return V===void 0?[]:typeof V=="function"?j?[V.listener||V]:[V]:j?function(L){for(var C=new Array(L.length),B=0;B<C.length;++B)C[B]=L[B].listener||L[B];return C}(V):D(V,V.length)}function z(E){var Y=this._events;if(Y!==void 0){var j=Y[E];if(typeof j=="function")return 1;if(j!==void 0)return j.length}return 0}function D(E,Y){for(var j=new Array(Y),X=0;X<Y;++X)j[X]=E[X];return j}function F(E,Y,j,X){if(typeof E.on=="function")X.once?E.once(Y,j):E.on(Y,j);else{if(typeof E.addEventListener!="function")throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof E);E.addEventListener(Y,function V(L){X.once&&E.removeEventListener(Y,V),j(L)})}}Object.defineProperty(u,"defaultMaxListeners",{enumerable:!0,get:function(){return x},set:function(E){if(typeof E!="number"||E<0||b(E))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+E+".");x=E}}),u.init=function(){this._events!==void 0&&this._events!==Object.getPrototypeOf(this)._events||(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},u.prototype.setMaxListeners=function(E){if(typeof E!="number"||E<0||b(E))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+E+".");return this._maxListeners=E,this},u.prototype.getMaxListeners=function(){return y(this)},u.prototype.emit=function(E){for(var Y=[],j=1;j<arguments.length;j++)Y.push(arguments[j]);var X=E==="error",V=this._events;if(V!==void 0)X=X&&V.error===void 0;else if(!X)return!1;if(X){var L;if(Y.length>0&&(L=Y[0]),L instanceof Error)throw L;var C=new Error("Unhandled error."+(L?" ("+L.message+")":""));throw C.context=L,C}var B=V[E];if(B===void 0)return!1;if(typeof B=="function")_(B,this,Y);else{var T=B.length,Q=D(B,T);for(j=0;j<T;++j)_(Q[j],this,Y)}return!0},u.prototype.addListener=function(E,Y){return S(this,E,Y,!1)},u.prototype.on=u.prototype.addListener,u.prototype.prependListener=function(E,Y){return S(this,E,Y,!0)},u.prototype.once=function(E,Y){return m(Y),this.on(E,P(this,E,Y)),this},u.prototype.prependOnceListener=function(E,Y){return m(Y),this.prependListener(E,P(this,E,Y)),this},u.prototype.removeListener=function(E,Y){var j,X,V,L,C;if(m(Y),(X=this._events)===void 0)return this;if((j=X[E])===void 0)return this;if(j===Y||j.listener===Y)--this._eventsCount===0?this._events=Object.create(null):(delete X[E],X.removeListener&&this.emit("removeListener",E,j.listener||Y));else if(typeof j!="function"){for(V=-1,L=j.length-1;L>=0;L--)if(j[L]===Y||j[L].listener===Y){C=j[L].listener,V=L;break}if(V<0)return this;V===0?j.shift():function(B,T){for(;T+1<B.length;T++)B[T]=B[T+1];B.pop()}(j,V),j.length===1&&(X[E]=j[0]),X.removeListener!==void 0&&this.emit("removeListener",E,C||Y)}return this},u.prototype.off=u.prototype.removeListener,u.prototype.removeAllListeners=function(E){var Y,j,X;if((j=this._events)===void 0)return this;if(j.removeListener===void 0)return arguments.length===0?(this._events=Object.create(null),this._eventsCount=0):j[E]!==void 0&&(--this._eventsCount===0?this._events=Object.create(null):delete j[E]),this;if(arguments.length===0){var V,L=Object.keys(j);for(X=0;X<L.length;++X)(V=L[X])!=="removeListener"&&this.removeAllListeners(V);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if(typeof(Y=j[E])=="function")this.removeListener(E,Y);else if(Y!==void 0)for(X=Y.length-1;X>=0;X--)this.removeListener(E,Y[X]);return this},u.prototype.listeners=function(E){return $(this,E,!0)},u.prototype.rawListeners=function(E){return $(this,E,!1)},u.listenerCount=function(E,Y){return typeof E.listenerCount=="function"?E.listenerCount(Y):z.call(E,Y)},u.prototype.listenerCount=z,u.prototype.eventNames=function(){return this._eventsCount>0?g(this._events):[]}},955:function(h,g,f){f.r(g);var _=function(){function b(){this.mimeType=null,this.duration=null,this.hasAudio=null,this.hasVideo=null,this.audioCodec=null,this.videoCodec=null,this.audioDataRate=null,this.videoDataRate=null,this.audioSampleRate=null,this.audioChannelCount=null,this.width=null,this.height=null,this.fps=null,this.profile=null,this.level=null,this.refFrames=null,this.chromaFormat=null,this.sarNum=null,this.sarDen=null,this.metadata=null,this.segments=null,this.segmentCount=null,this.hasKeyframesIndex=null,this.keyframesIndex=null}return b.prototype.isComplete=function(){var u=this.hasAudio===!1||this.hasAudio===!0&&this.audioCodec!=null&&this.audioSampleRate!=null&&this.audioChannelCount!=null,x=this.hasVideo===!1||this.hasVideo===!0&&this.videoCodec!=null&&this.width!=null&&this.height!=null&&this.fps!=null&&this.profile!=null&&this.level!=null&&this.refFrames!=null&&this.chromaFormat!=null&&this.sarNum!=null&&this.sarDen!=null;return this.mimeType!=null&&u&&x},b.prototype.isSeekable=function(){return this.hasKeyframesIndex===!0},b.prototype.getNearestKeyframe=function(u){if(this.keyframesIndex==null)return null;var x=this.keyframesIndex,m=this._search(x.times,u);return{index:m,milliseconds:x.times[m],fileposition:x.filepositions[m]}},b.prototype._search=function(u,x){var m=0,y=u.length-1,S=0,w=0,P=y;for(x<u[0]&&(m=0,w=P+1);w<=P;){if((S=w+Math.floor((P-w)/2))===y||x>=u[S]&&x<u[S+1]){m=S;break}u[S]<x?w=S+1:P=S-1}return m},b}();g.default=_},47:function(h,g,f){f.r(g),f.d(g,{IDRSampleList:function(){return u},MediaSegmentInfo:function(){return b},MediaSegmentInfoList:function(){return x},SampleInfo:function(){return _}});var _=function(m,y,S,w,P){this.dts=m,this.pts=y,this.duration=S,this.originalDts=w,this.isSyncPoint=P,this.fileposition=null},b=function(){function m(){this.beginDts=0,this.endDts=0,this.beginPts=0,this.endPts=0,this.originalBeginDts=0,this.originalEndDts=0,this.syncPoints=[],this.firstSample=null,this.lastSample=null}return m.prototype.appendSyncPoint=function(y){y.isSyncPoint=!0,this.syncPoints.push(y)},m}(),u=function(){function m(){this._list=[]}return m.prototype.clear=function(){this._list=[]},m.prototype.appendArray=function(y){var S=this._list;y.length!==0&&(S.length>0&&y[0].originalDts<S[S.length-1].originalDts&&this.clear(),Array.prototype.push.apply(S,y))},m.prototype.getLastSyncPointBeforeDts=function(y){if(this._list.length==0)return null;var S=this._list,w=0,P=S.length-1,$=0,z=0,D=P;for(y<S[0].dts&&(w=0,z=D+1);z<=D;){if(($=z+Math.floor((D-z)/2))===P||y>=S[$].dts&&y<S[$+1].dts){w=$;break}S[$].dts<y?z=$+1:D=$-1}return this._list[w]},m}(),x=function(){function m(y){this._type=y,this._list=[],this._lastAppendLocation=-1}return Object.defineProperty(m.prototype,"type",{get:function(){return this._type},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"length",{get:function(){return this._list.length},enumerable:!1,configurable:!0}),m.prototype.isEmpty=function(){return this._list.length===0},m.prototype.clear=function(){this._list=[],this._lastAppendLocation=-1},m.prototype._searchNearestSegmentBefore=function(y){var S=this._list;if(S.length===0)return-2;var w=S.length-1,P=0,$=0,z=w,D=0;if(y<S[0].originalBeginDts)return-1;for(;$<=z;){if((P=$+Math.floor((z-$)/2))===w||y>S[P].lastSample.originalDts&&y<S[P+1].originalBeginDts){D=P;break}S[P].originalBeginDts<y?$=P+1:z=P-1}return D},m.prototype._searchNearestSegmentAfter=function(y){return this._searchNearestSegmentBefore(y)+1},m.prototype.append=function(y){var S=this._list,w=y,P=this._lastAppendLocation,$=0;P!==-1&&P<S.length&&w.originalBeginDts>=S[P].lastSample.originalDts&&(P===S.length-1||P<S.length-1&&w.originalBeginDts<S[P+1].originalBeginDts)?$=P+1:S.length>0&&($=this._searchNearestSegmentBefore(w.originalBeginDts)+1),this._lastAppendLocation=$,this._list.splice($,0,w)},m.prototype.getLastSegmentBefore=function(y){var S=this._searchNearestSegmentBefore(y);return S>=0?this._list[S]:null},m.prototype.getLastSampleBefore=function(y){var S=this.getLastSegmentBefore(y);return S!=null?S.lastSample:null},m.prototype.getLastSyncPointBefore=function(y){for(var S=this._searchNearestSegmentBefore(y),w=this._list[S].syncPoints;w.length===0&&S>0;)S--,w=this._list[S].syncPoints;return w.length>0?w[w.length-1]:null},m}()},346:function(h,g,f){f.r(g);var _=f(7),b=f.n(_),u=f(856),x=f(994),m=f(403),y=f(867),S=function(){function w(P){this.TAG="MSEController",this._config=P,this._emitter=new(b()),this._config.isLive&&this._config.autoCleanupSourceBuffer==null&&(this._config.autoCleanupSourceBuffer=!0),this.e={onSourceOpen:this._onSourceOpen.bind(this),onSourceEnded:this._onSourceEnded.bind(this),onSourceClose:this._onSourceClose.bind(this),onStartStreaming:this._onStartStreaming.bind(this),onEndStreaming:this._onEndStreaming.bind(this),onQualityChange:this._onQualityChange.bind(this),onSourceBufferError:this._onSourceBufferError.bind(this),onSourceBufferUpdateEnd:this._onSourceBufferUpdateEnd.bind(this)},this._useManagedMediaSource=typeof self.ManagedMediaSource=="function"&&typeof self.MediaSource!="function",this._mediaSource=null,this._mediaSourceObjectURL=null,this._mediaElementProxy=null,this._isBufferFull=!1,this._hasPendingEos=!1,this._requireSetMediaDuration=!1,this._pendingMediaDuration=0,this._pendingSourceBufferInit=[],this._mimeTypes={video:null,audio:null},this._sourceBuffers={video:null,audio:null},this._lastInitSegments={video:null,audio:null},this._pendingSegments={video:[],audio:[]},this._pendingRemoveRanges={video:[],audio:[]}}return w.prototype.destroy=function(){this._mediaSource&&this.shutdown(),this._mediaSourceObjectURL&&this.revokeObjectURL(),this.e=null,this._emitter.removeAllListeners(),this._emitter=null},w.prototype.on=function(P,$){this._emitter.addListener(P,$)},w.prototype.off=function(P,$){this._emitter.removeListener(P,$)},w.prototype.initialize=function(P){if(this._mediaSource)throw new y.IllegalStateException("MediaSource has been attached to an HTMLMediaElement!");this._useManagedMediaSource&&u.default.v(this.TAG,"Using ManagedMediaSource");var $=this._mediaSource=this._useManagedMediaSource?new self.ManagedMediaSource:new self.MediaSource;$.addEventListener("sourceopen",this.e.onSourceOpen),$.addEventListener("sourceended",this.e.onSourceEnded),$.addEventListener("sourceclose",this.e.onSourceClose),this._useManagedMediaSource&&($.addEventListener("startstreaming",this.e.onStartStreaming),$.addEventListener("endstreaming",this.e.onEndStreaming),$.addEventListener("qualitychange",this.e.onQualityChange)),this._mediaElementProxy=P},w.prototype.shutdown=function(){if(this._mediaSource){var P=this._mediaSource;for(var $ in this._sourceBuffers){var z=this._pendingSegments[$];z.splice(0,z.length),this._pendingSegments[$]=null,this._pendingRemoveRanges[$]=null,this._lastInitSegments[$]=null;var D=this._sourceBuffers[$];if(D){if(P.readyState!=="closed"){try{P.removeSourceBuffer(D)}catch(F){u.default.e(this.TAG,F.message)}D.removeEventListener("error",this.e.onSourceBufferError),D.removeEventListener("updateend",this.e.onSourceBufferUpdateEnd)}this._mimeTypes[$]=null,this._sourceBuffers[$]=null}}if(P.readyState==="open")try{P.endOfStream()}catch(F){u.default.e(this.TAG,F.message)}this._mediaElementProxy=null,P.removeEventListener("sourceopen",this.e.onSourceOpen),P.removeEventListener("sourceended",this.e.onSourceEnded),P.removeEventListener("sourceclose",this.e.onSourceClose),this._useManagedMediaSource&&(P.removeEventListener("startstreaming",this.e.onStartStreaming),P.removeEventListener("endstreaming",this.e.onEndStreaming),P.removeEventListener("qualitychange",this.e.onQualityChange)),this._pendingSourceBufferInit=[],this._isBufferFull=!1,this._mediaSource=null}},w.prototype.isManagedMediaSource=function(){return this._useManagedMediaSource},w.prototype.getObject=function(){if(!this._mediaSource)throw new y.IllegalStateException("MediaSource has not been initialized yet!");return this._mediaSource},w.prototype.getHandle=function(){if(!this._mediaSource)throw new y.IllegalStateException("MediaSource has not been initialized yet!");return this._mediaSource.handle},w.prototype.getObjectURL=function(){if(!this._mediaSource)throw new y.IllegalStateException("MediaSource has not been initialized yet!");return this._mediaSourceObjectURL==null&&(this._mediaSourceObjectURL=URL.createObjectURL(this._mediaSource)),this._mediaSourceObjectURL},w.prototype.revokeObjectURL=function(){this._mediaSourceObjectURL&&(URL.revokeObjectURL(this._mediaSourceObjectURL),this._mediaSourceObjectURL=null)},w.prototype.appendInitSegment=function(P,$){if($===void 0&&($=void 0),!this._mediaSource||this._mediaSource.readyState!=="open"||this._mediaSource.streaming===!1)return this._pendingSourceBufferInit.push(P),void this._pendingSegments[P.type].push(P);var z=P,D="".concat(z.container);z.codec&&z.codec.length>0&&(z.codec==="opus"&&x.default.safari&&(z.codec="Opus"),D+=";codecs=".concat(z.codec));var F=!1;if(u.default.v(this.TAG,"Received Initialization Segment, mimeType: "+D),this._lastInitSegments[z.type]=z,D!==this._mimeTypes[z.type]){if(this._mimeTypes[z.type])u.default.v(this.TAG,"Notice: ".concat(z.type," mimeType changed, origin: ").concat(this._mimeTypes[z.type],", target: ").concat(D));else{F=!0;try{var E=this._sourceBuffers[z.type]=this._mediaSource.addSourceBuffer(D);E.addEventListener("error",this.e.onSourceBufferError),E.addEventListener("updateend",this.e.onSourceBufferUpdateEnd)}catch(Y){return u.default.e(this.TAG,Y.message),void this._emitter.emit(m.default.ERROR,{code:Y.code,msg:Y.message})}}this._mimeTypes[z.type]=D}$||this._pendingSegments[z.type].push(z),F||this._sourceBuffers[z.type]&&!this._sourceBuffers[z.type].updating&&this._doAppendSegments(),x.default.safari&&z.container==="audio/mpeg"&&z.mediaDuration>0&&(this._requireSetMediaDuration=!0,this._pendingMediaDuration=z.mediaDuration/1e3,this._updateMediaSourceDuration())},w.prototype.appendMediaSegment=function(P){var $=P;this._pendingSegments[$.type].push($),this._config.autoCleanupSourceBuffer&&this._needCleanupSourceBuffer()&&this._doCleanupSourceBuffer();var z=this._sourceBuffers[$.type];!z||z.updating||this._hasPendingRemoveRanges()||this._doAppendSegments()},w.prototype.flush=function(){for(var P in this._sourceBuffers)if(this._sourceBuffers[P]){var $=this._sourceBuffers[P];if(this._mediaSource.readyState==="open")try{$.abort()}catch(j){u.default.e(this.TAG,j.message)}var z=this._pendingSegments[P];if(z.splice(0,z.length),this._mediaSource.readyState!=="closed"){for(var D=0;D<$.buffered.length;D++){var F=$.buffered.start(D),E=$.buffered.end(D);this._pendingRemoveRanges[P].push({start:F,end:E})}if($.updating||this._doRemoveRanges(),x.default.safari){var Y=this._lastInitSegments[P];Y&&(this._pendingSegments[P].push(Y),$.updating||this._doAppendSegments())}}}},w.prototype.endOfStream=function(){var P=this._mediaSource,$=this._sourceBuffers;P&&P.readyState==="open"?$.video&&$.video.updating||$.audio&&$.audio.updating?this._hasPendingEos=!0:(this._hasPendingEos=!1,P.endOfStream()):P&&P.readyState==="closed"&&this._hasPendingSegments()&&(this._hasPendingEos=!0)},w.prototype._needCleanupSourceBuffer=function(){if(!this._config.autoCleanupSourceBuffer)return!1;var P=this._mediaElementProxy.getCurrentTime();for(var $ in this._sourceBuffers){var z=this._sourceBuffers[$];if(z){var D=z.buffered;if(D.length>=1&&P-D.start(0)>=this._config.autoCleanupMaxBackwardDuration)return!0}}return!1},w.prototype._doCleanupSourceBuffer=function(){var P=this._mediaElementProxy.getCurrentTime();for(var $ in this._sourceBuffers){var z=this._sourceBuffers[$];if(z){for(var D=z.buffered,F=!1,E=0;E<D.length;E++){var Y=D.start(E),j=D.end(E);if(Y<=P&&P<j+3){if(P-Y>=this._config.autoCleanupMaxBackwardDuration){F=!0;var X=P-this._config.autoCleanupMinBackwardDuration;this._pendingRemoveRanges[$].push({start:Y,end:X})}}else j<P&&(F=!0,this._pendingRemoveRanges[$].push({start:Y,end:j}))}F&&!z.updating&&this._doRemoveRanges()}}},w.prototype._updateMediaSourceDuration=function(){var P=this._sourceBuffers;if(this._mediaElementProxy.getReadyState()!==0&&this._mediaSource.readyState==="open"&&!(P.video&&P.video.updating||P.audio&&P.audio.updating)){var $=this._mediaSource.duration,z=this._pendingMediaDuration;z>0&&(isNaN($)||z>$)&&(u.default.v(this.TAG,"Update MediaSource duration from ".concat($," to ").concat(z)),this._mediaSource.duration=z),this._requireSetMediaDuration=!1,this._pendingMediaDuration=0}},w.prototype._doRemoveRanges=function(){for(var P in this._pendingRemoveRanges)if(this._sourceBuffers[P]&&!this._sourceBuffers[P].updating)for(var $=this._sourceBuffers[P],z=this._pendingRemoveRanges[P];z.length&&!$.updating;){var D=z.shift();$.remove(D.start,D.end)}},w.prototype._doAppendSegments=function(){var P=this._pendingSegments;for(var $ in P)if(this._sourceBuffers[$]&&!this._sourceBuffers[$].updating&&this._mediaSource.streaming!==!1&&P[$].length>0){var z=P[$].shift();if(typeof z.timestampOffset=="number"&&isFinite(z.timestampOffset)){var D=this._sourceBuffers[$].timestampOffset,F=z.timestampOffset/1e3;Math.abs(D-F)>.1&&(u.default.v(this.TAG,"Update MPEG audio timestampOffset from ".concat(D," to ").concat(F)),this._sourceBuffers[$].timestampOffset=F),delete z.timestampOffset}if(!z.data||z.data.byteLength===0)continue;try{this._sourceBuffers[$].appendBuffer(z.data),this._isBufferFull=!1}catch(E){this._pendingSegments[$].unshift(z),E.code===22?(this._isBufferFull||this._emitter.emit(m.default.BUFFER_FULL),this._isBufferFull=!0):(u.default.e(this.TAG,E.message),this._emitter.emit(m.default.ERROR,{code:E.code,msg:E.message}))}}},w.prototype._onSourceOpen=function(){if(u.default.v(this.TAG,"MediaSource onSourceOpen"),this._mediaSource.removeEventListener("sourceopen",this.e.onSourceOpen),this._pendingSourceBufferInit.length>0)for(var P=this._pendingSourceBufferInit;P.length;){var $=P.shift();this.appendInitSegment($,!0)}this._hasPendingSegments()&&this._doAppendSegments(),this._emitter.emit(m.default.SOURCE_OPEN)},w.prototype._onStartStreaming=function(){u.default.v(this.TAG,"ManagedMediaSource onStartStreaming"),this._emitter.emit(m.default.START_STREAMING)},w.prototype._onEndStreaming=function(){u.default.v(this.TAG,"ManagedMediaSource onEndStreaming"),this._emitter.emit(m.default.END_STREAMING)},w.prototype._onQualityChange=function(){u.default.v(this.TAG,"ManagedMediaSource onQualityChange")},w.prototype._onSourceEnded=function(){u.default.v(this.TAG,"MediaSource onSourceEnded")},w.prototype._onSourceClose=function(){u.default.v(this.TAG,"MediaSource onSourceClose"),this._mediaSource&&this.e!=null&&(this._mediaSource.removeEventListener("sourceopen",this.e.onSourceOpen),this._mediaSource.removeEventListener("sourceended",this.e.onSourceEnded),this._mediaSource.removeEventListener("sourceclose",this.e.onSourceClose),this._useManagedMediaSource&&(this._mediaSource.removeEventListener("startstreaming",this.e.onStartStreaming),this._mediaSource.removeEventListener("endstreaming",this.e.onEndStreaming),this._mediaSource.removeEventListener("qualitychange",this.e.onQualityChange)))},w.prototype._hasPendingSegments=function(){var P=this._pendingSegments;return P.video.length>0||P.audio.length>0},w.prototype._hasPendingRemoveRanges=function(){var P=this._pendingRemoveRanges;return P.video.length>0||P.audio.length>0},w.prototype._onSourceBufferUpdateEnd=function(){this._requireSetMediaDuration?this._updateMediaSourceDuration():this._hasPendingRemoveRanges()?this._doRemoveRanges():this._hasPendingSegments()?this._doAppendSegments():this._hasPendingEos&&this.endOfStream(),this._emitter.emit(m.default.UPDATE_END)},w.prototype._onSourceBufferError=function(P){u.default.e(this.TAG,"SourceBuffer Error: ".concat(P))},w}();g.default=S},527:function(h,g,f){f.r(g);var _=f(7),b=f.n(_),u=f(861),x=f.n(u),m=f(856),y=f(947),S=f(886),w=f(726),P=(f(137),f(955)),$=function(){function z(D,F){if(this.TAG="Transmuxer",this._emitter=new(b()),F.enableWorker&&typeof Worker<"u")try{this._worker=x()(137),this._workerDestroying=!1,this._worker.addEventListener("message",this._onWorkerMessage.bind(this)),this._worker.postMessage({cmd:"init",param:[D,F]}),this.e={onLoggingConfigChanged:this._onLoggingConfigChanged.bind(this)},y.default.registerListener(this.e.onLoggingConfigChanged),this._worker.postMessage({cmd:"logging_config",param:y.default.getConfig()})}catch{m.default.e(this.TAG,"Error while initialize transmuxing worker, fallback to inline transmuxing"),this._worker=null,this._controller=new S.default(D,F)}else this._controller=new S.default(D,F);if(this._controller){var E=this._controller;E.on(w.default.IO_ERROR,this._onIOError.bind(this)),E.on(w.default.DEMUX_ERROR,this._onDemuxError.bind(this)),E.on(w.default.INIT_SEGMENT,this._onInitSegment.bind(this)),E.on(w.default.MEDIA_SEGMENT,this._onMediaSegment.bind(this)),E.on(w.default.LOADING_COMPLETE,this._onLoadingComplete.bind(this)),E.on(w.default.RECOVERED_EARLY_EOF,this._onRecoveredEarlyEof.bind(this)),E.on(w.default.MEDIA_INFO,this._onMediaInfo.bind(this)),E.on(w.default.METADATA_ARRIVED,this._onMetaDataArrived.bind(this)),E.on(w.default.SCRIPTDATA_ARRIVED,this._onScriptDataArrived.bind(this)),E.on(w.default.TIMED_ID3_METADATA_ARRIVED,this._onTimedID3MetadataArrived.bind(this)),E.on(w.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,this._onSynchronousKLVMetadataArrived.bind(this)),E.on(w.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,this._onAsynchronousKLVMetadataArrived.bind(this)),E.on(w.default.SMPTE2038_METADATA_ARRIVED,this._onSMPTE2038MetadataArrived.bind(this)),E.on(w.default.SEI_ARRIVED,this._onSEIArrived.bind(this)),E.on(w.default.SCTE35_METADATA_ARRIVED,this._onSCTE35MetadataArrived.bind(this)),E.on(w.default.PES_PRIVATE_DATA_DESCRIPTOR,this._onPESPrivateDataDescriptor.bind(this)),E.on(w.default.PES_PRIVATE_DATA_ARRIVED,this._onPESPrivateDataArrived.bind(this)),E.on(w.default.STATISTICS_INFO,this._onStatisticsInfo.bind(this)),E.on(w.default.RECOMMEND_SEEKPOINT,this._onRecommendSeekpoint.bind(this))}}return z.prototype.destroy=function(){this._worker?this._workerDestroying||(this._workerDestroying=!0,this._worker.postMessage({cmd:"destroy"}),y.default.removeListener(this.e.onLoggingConfigChanged),this.e=null):(this._controller.destroy(),this._controller=null),this._emitter.removeAllListeners(),this._emitter=null},z.prototype.on=function(D,F){this._emitter.addListener(D,F)},z.prototype.off=function(D,F){this._emitter.removeListener(D,F)},z.prototype.hasWorker=function(){return this._worker!=null},z.prototype.open=function(){this._worker?this._worker.postMessage({cmd:"start"}):this._controller.start()},z.prototype.close=function(){this._worker?this._worker.postMessage({cmd:"stop"}):this._controller.stop()},z.prototype.seek=function(D){this._worker?this._worker.postMessage({cmd:"seek",param:D}):this._controller.seek(D)},z.prototype.pause=function(){this._worker?this._worker.postMessage({cmd:"pause"}):this._controller.pause()},z.prototype.resume=function(){this._worker?this._worker.postMessage({cmd:"resume"}):this._controller.resume()},z.prototype._onInitSegment=function(D,F){var E=this;Promise.resolve().then(function(){E._emitter.emit(w.default.INIT_SEGMENT,D,F)})},z.prototype._onMediaSegment=function(D,F){var E=this;Promise.resolve().then(function(){E._emitter.emit(w.default.MEDIA_SEGMENT,D,F)})},z.prototype._onLoadingComplete=function(){var D=this;Promise.resolve().then(function(){D._emitter.emit(w.default.LOADING_COMPLETE)})},z.prototype._onRecoveredEarlyEof=function(){var D=this;Promise.resolve().then(function(){D._emitter.emit(w.default.RECOVERED_EARLY_EOF)})},z.prototype._onMediaInfo=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.MEDIA_INFO,D)})},z.prototype._onMetaDataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.METADATA_ARRIVED,D)})},z.prototype._onScriptDataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.SCRIPTDATA_ARRIVED,D)})},z.prototype._onTimedID3MetadataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.TIMED_ID3_METADATA_ARRIVED,D)})},z.prototype._onPGSSubtitleArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.PGS_SUBTITLE_ARRIVED,D)})},z.prototype._onSynchronousKLVMetadataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,D)})},z.prototype._onAsynchronousKLVMetadataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,D)})},z.prototype._onSMPTE2038MetadataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.SMPTE2038_METADATA_ARRIVED,D)})},z.prototype._onSEIArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.SEI_ARRIVED,D)})},z.prototype._onSCTE35MetadataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.SCTE35_METADATA_ARRIVED,D)})},z.prototype._onPESPrivateDataDescriptor=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.PES_PRIVATE_DATA_DESCRIPTOR,D)})},z.prototype._onPESPrivateDataArrived=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.PES_PRIVATE_DATA_ARRIVED,D)})},z.prototype._onStatisticsInfo=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.STATISTICS_INFO,D)})},z.prototype._onIOError=function(D,F){var E=this;Promise.resolve().then(function(){E._emitter.emit(w.default.IO_ERROR,D,F)})},z.prototype._onDemuxError=function(D,F){var E=this;Promise.resolve().then(function(){E._emitter.emit(w.default.DEMUX_ERROR,D,F)})},z.prototype._onRecommendSeekpoint=function(D){var F=this;Promise.resolve().then(function(){F._emitter.emit(w.default.RECOMMEND_SEEKPOINT,D)})},z.prototype._onLoggingConfigChanged=function(D){this._worker&&this._worker.postMessage({cmd:"logging_config",param:D})},z.prototype._onWorkerMessage=function(D){var F=D.data,E=F.data;if(F.msg==="destroyed"||this._workerDestroying)return this._workerDestroying=!1,this._worker.terminate(),void(this._worker=null);switch(F.msg){case w.default.INIT_SEGMENT:case w.default.MEDIA_SEGMENT:this._emitter.emit(F.msg,E.type,E.data);break;case w.default.LOADING_COMPLETE:case w.default.RECOVERED_EARLY_EOF:this._emitter.emit(F.msg);break;case w.default.MEDIA_INFO:Object.setPrototypeOf(E,P.default.prototype),this._emitter.emit(F.msg,E);break;case w.default.METADATA_ARRIVED:case w.default.SCRIPTDATA_ARRIVED:case w.default.TIMED_ID3_METADATA_ARRIVED:case w.default.PGS_SUBTITLE_ARRIVED:case w.default.SYNCHRONOUS_KLV_METADATA_ARRIVED:case w.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED:case w.default.SMPTE2038_METADATA_ARRIVED:case w.default.SCTE35_METADATA_ARRIVED:case w.default.SEI_ARRIVED:case w.default.PES_PRIVATE_DATA_DESCRIPTOR:case w.default.PES_PRIVATE_DATA_ARRIVED:case w.default.STATISTICS_INFO:this._emitter.emit(F.msg,E);break;case w.default.IO_ERROR:case w.default.DEMUX_ERROR:this._emitter.emit(F.msg,E.type,E.info);break;case w.default.RECOMMEND_SEEKPOINT:this._emitter.emit(F.msg,E);break;case"logcat_callback":m.default.emitter.emit("log",E.type,E.logcat)}},z}();g.default=$},886:function(h,g,f){f.r(g),f.d(g,{default:function(){return fo}});var _=f(7),b=f.n(_),u=f(856),x=f(994),m=f(955);function y(r,o,n){var i=r;if(o+n<i.length){for(;n--;)if((192&i[++o])!=128)return!1;return!0}return!1}var S,w=function(r){for(var o=[],n=r,i=0,l=r.length;i<l;)if(n[i]<128)o.push(String.fromCharCode(n[i])),++i;else{if(!(n[i]<192)){if(n[i]<224){if(y(n,i,1)&&(p=(31&n[i])<<6|63&n[i+1])>=128){o.push(String.fromCharCode(65535&p)),i+=2;continue}}else if(n[i]<240){if(y(n,i,2)&&(p=(15&n[i])<<12|(63&n[i+1])<<6|63&n[i+2])>=2048&&(63488&p)!=55296){o.push(String.fromCharCode(65535&p)),i+=3;continue}}else if(n[i]<248){var p;if(y(n,i,3)&&(p=(7&n[i])<<18|(63&n[i+1])<<12|(63&n[i+2])<<6|63&n[i+3])>65536&&p<1114112){p-=65536,o.push(String.fromCharCode(p>>>10|55296)),o.push(String.fromCharCode(1023&p|56320)),i+=4;continue}}}o.push("�"),++i}return o.join("")},P=f(867),$=(S=new ArrayBuffer(2),new DataView(S).setInt16(0,256,!0),new Int16Array(S)[0]===256),z=function(){function r(){}return r.parseScriptData=function(o,n,i){var l={};try{var p=r.parseValue(o,n,i),c=r.parseValue(o,n+p.size,i-p.size);l[p.data]=c.data}catch(v){u.default.e("AMF",v.toString())}return l},r.parseObject=function(o,n,i){if(i<3)throw new P.IllegalStateException("Data not enough when parse ScriptDataObject");var l=r.parseString(o,n,i),p=r.parseValue(o,n+l.size,i-l.size),c=p.objectEnd;return{data:{name:l.data,value:p.data},size:l.size+p.size,objectEnd:c}},r.parseVariable=function(o,n,i){return r.parseObject(o,n,i)},r.parseString=function(o,n,i){if(i<2)throw new P.IllegalStateException("Data not enough when parse String");var l=new DataView(o,n,i).getUint16(0,!$);return{data:l>0?w(new Uint8Array(o,n+2,l)):"",size:2+l}},r.parseLongString=function(o,n,i){if(i<4)throw new P.IllegalStateException("Data not enough when parse LongString");var l=new DataView(o,n,i).getUint32(0,!$);return{data:l>0?w(new Uint8Array(o,n+4,l)):"",size:4+l}},r.parseDate=function(o,n,i){if(i<10)throw new P.IllegalStateException("Data size invalid when parse Date");var l=new DataView(o,n,i),p=l.getFloat64(0,!$),c=l.getInt16(8,!$);return{data:new Date(p+=60*c*1e3),size:10}},r.parseValue=function(o,n,i){if(i<1)throw new P.IllegalStateException("Data not enough when parse Value");var l,p=new DataView(o,n,i),c=1,v=p.getUint8(0),k=!1;try{switch(v){case 0:l=p.getFloat64(1,!$),c+=8;break;case 1:l=!!p.getUint8(1),c+=1;break;case 2:var A=r.parseString(o,n+1,i-1);l=A.data,c+=A.size;break;case 3:l={};var U=0;for((16777215&p.getUint32(i-4,!$))==9&&(U=3);c<i-4;){var M=r.parseObject(o,n+c,i-c-U);if(M.objectEnd)break;l[M.data.name]=M.data.value,c+=M.size}c<=i-3&&(16777215&p.getUint32(c-1,!$))==9&&(c+=3);break;case 8:for(l={},c+=4,U=0,(16777215&p.getUint32(i-4,!$))==9&&(U=3);c<i-8;){var O=r.parseVariable(o,n+c,i-c-U);if(O.objectEnd)break;l[O.data.name]=O.data.value,c+=O.size}c<=i-3&&(16777215&p.getUint32(c-1,!$))==9&&(c+=3);break;case 9:l=void 0,c=1,k=!0;break;case 10:l=[];var H=p.getUint32(1,!$);c+=4;for(var J=0;J<H;J++){var ne=r.parseValue(o,n+c,i-c);l.push(ne.data),c+=ne.size}break;case 11:var se=r.parseDate(o,n+1,i-1);l=se.data,c+=se.size;break;case 12:var he=r.parseString(o,n+1,i-1);l=he.data,c+=he.size;break;default:c=i,u.default.w("AMF","Unsupported AMF value type "+v)}}catch(Z){u.default.e("AMF",Z.toString())}return{data:l,size:c,objectEnd:k}},r}(),D=function(){function r(o){this.TAG="ExpGolomb",this._buffer=o,this._buffer_index=0,this._total_bytes=o.byteLength,this._total_bits=8*o.byteLength,this._current_word=0,this._current_word_bits_left=0}return r.prototype.destroy=function(){this._buffer=null},r.prototype._fillCurrentWord=function(){var o=this._total_bytes-this._buffer_index;if(o<=0)throw new P.IllegalStateException("ExpGolomb: _fillCurrentWord() but no bytes available");var n=Math.min(4,o),i=new Uint8Array(4);i.set(this._buffer.subarray(this._buffer_index,this._buffer_index+n)),this._current_word=new DataView(i.buffer).getUint32(0,!1),this._buffer_index+=n,this._current_word_bits_left=8*n},r.prototype.readBits=function(o){if(o>32)throw new P.InvalidArgumentException("ExpGolomb: readBits() bits exceeded max 32bits!");if(o<=this._current_word_bits_left){var n=this._current_word>>>32-o;return this._current_word<<=o,this._current_word_bits_left-=o,n}var i=this._current_word_bits_left?this._current_word:0;i>>>=32-this._current_word_bits_left;var l=o-this._current_word_bits_left;this._fillCurrentWord();var p=Math.min(l,this._current_word_bits_left),c=this._current_word>>>32-p;return this._current_word<<=p,this._current_word_bits_left-=p,i<<p|c},r.prototype.readBool=function(){return this.readBits(1)===1},r.prototype.readByte=function(){return this.readBits(8)},r.prototype._skipLeadingZero=function(){var o;for(o=0;o<this._current_word_bits_left;o++)if(this._current_word&2147483648>>>o)return this._current_word<<=o,this._current_word_bits_left-=o,o;return this._fillCurrentWord(),o+this._skipLeadingZero()},r.prototype.readUEG=function(){var o=this._skipLeadingZero();return this.readBits(o+1)-1},r.prototype.readSEG=function(){var o=this.readUEG();return 1&o?o+1>>>1:-1*(o>>>1)},r}(),F=function(){function r(){}return r._ebsp2rbsp=function(o){for(var n=o,i=n.byteLength,l=new Uint8Array(i),p=0,c=0;c<i;c++)c>=2&&n[c]===3&&n[c-1]===0&&n[c-2]===0||(l[p]=n[c],p++);return new Uint8Array(l.buffer,0,p)},r.parseSPS=function(o){for(var n=o.subarray(1,4),i="avc1.",l=0;l<3;l++){var p=n[l].toString(16);p.length<2&&(p="0"+p),i+=p}var c=r._ebsp2rbsp(o),v=new D(c);v.readByte();var k=v.readByte();v.readByte();var A=v.readByte();v.readUEG();var U=r.getProfileString(k),M=r.getLevelString(A),O=1,H=420,J=8,ne=8;if((k===100||k===110||k===122||k===244||k===44||k===83||k===86||k===118||k===128||k===138||k===144)&&((O=v.readUEG())===3&&v.readBits(1),O<=3&&(H=[0,420,422,444][O]),J=v.readUEG()+8,ne=v.readUEG()+8,v.readBits(1),v.readBool()))for(var se=O!==3?8:12,he=0;he<se;he++)v.readBool()&&(he<6?r._skipScalingList(v,16):r._skipScalingList(v,64));v.readUEG();var Z=v.readUEG();if(Z===0)v.readUEG();else if(Z===1){v.readBits(1),v.readSEG(),v.readSEG();var oe=v.readUEG();for(he=0;he<oe;he++)v.readSEG()}var we=v.readUEG();v.readBits(1);var Le=v.readUEG(),me=v.readUEG(),ge=v.readBits(1);ge===0&&v.readBits(1),v.readBits(1);var ke=0,xe=0,Oe=0,Ie=0;v.readBool()&&(ke=v.readUEG(),xe=v.readUEG(),Oe=v.readUEG(),Ie=v.readUEG());var Fe=1,He=1,De=0,Ee=!0,Be=0,We=0;if(v.readBool()){if(v.readBool()){var Te=v.readByte();Te>0&&Te<16?(Fe=[1,12,10,16,40,24,20,32,80,18,15,64,160,4,3,2][Te-1],He=[1,11,11,11,33,11,11,11,33,11,11,33,99,3,2,1][Te-1]):Te===255&&(Fe=v.readByte()<<8|v.readByte(),He=v.readByte()<<8|v.readByte())}if(v.readBool()&&v.readBool(),v.readBool()&&(v.readBits(4),v.readBool()&&v.readBits(24)),v.readBool()&&(v.readUEG(),v.readUEG()),v.readBool()){var Ke=v.readBits(32),dt=v.readBits(32);Ee=v.readBool(),De=(Be=dt)/(We=2*Ke)}}var nt=1;Fe===1&&He===1||(nt=Fe/He);var ct=0,Pe=0;O===0?(ct=1,Pe=2-ge):(ct=O===3?1:2,Pe=(O===1?2:1)*(2-ge));var Dt=16*(Le+1),Pt=16*(me+1)*(2-ge);Dt-=(ke+xe)*ct,Pt-=(Oe+Ie)*Pe;var Fi=Math.ceil(Dt*nt);return v.destroy(),v=null,{codec_mimetype:i,profile_idc:k,level_idc:A,profile_string:U,level_string:M,chroma_format_idc:O,bit_depth:J,bit_depth_luma:J,bit_depth_chroma:ne,ref_frames:we,chroma_format:H,chroma_format_string:r.getChromaFormatString(H),frame_rate:{fixed:Ee,fps:De,fps_den:We,fps_num:Be},sar_ratio:{width:Fe,height:He},codec_size:{width:Dt,height:Pt},present_size:{width:Fi,height:Pt}}},r._skipScalingList=function(o,n){for(var i=8,l=8,p=0;p<n;p++)l!==0&&(l=(i+o.readSEG()+256)%256),i=l===0?i:l},r.getProfileString=function(o){switch(o){case 66:return"Baseline";case 77:return"Main";case 88:return"Extended";case 100:return"High";case 110:return"High10";case 122:return"High422";case 244:return"High444";default:return"Unknown"}},r.getLevelString=function(o){return(o/10).toFixed(1)},r.getChromaFormatString=function(o){switch(o){case 420:return"4:2:0";case 422:return"4:2:2";case 444:return"4:4:4";default:return"Unknown"}},r}(),E=f(827),Y=function(){function r(){}return r._ebsp2rbsp=function(o){for(var n=o,i=n.byteLength,l=new Uint8Array(i),p=0,c=0;c<i;c++)c>=2&&n[c]===3&&n[c-1]===0&&n[c-2]===0||(l[p]=n[c],p++);return new Uint8Array(l.buffer,0,p)},r.parseVPS=function(o){var n=r._ebsp2rbsp(o),i=new D(n);return i.readByte(),i.readByte(),i.readBits(4),i.readBits(2),i.readBits(6),{num_temporal_layers:i.readBits(3)+1,temporal_id_nested:i.readBool()}},r.parseSPS=function(o){var n=r._ebsp2rbsp(o),i=new D(n);i.readByte(),i.readByte();for(var l=0,p=0,c=0,v=0,k=(i.readBits(4),i.readBits(3)),A=(i.readBool(),i.readBits(2)),U=i.readBool(),M=i.readBits(5),O=i.readByte(),H=i.readByte(),J=i.readByte(),ne=i.readByte(),se=i.readByte(),he=i.readByte(),Z=i.readByte(),oe=i.readByte(),we=i.readByte(),Le=i.readByte(),me=i.readByte(),ge=[],ke=[],xe=0;xe<k;xe++)ge.push(i.readBool()),ke.push(i.readBool());if(k>0)for(xe=k;xe<8;xe++)i.readBits(2);for(xe=0;xe<k;xe++)ge[xe]&&(i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte()),ke[xe]&&i.readByte();i.readUEG();var Oe=i.readUEG();Oe==3&&i.readBits(1);var Ie=i.readUEG(),Fe=i.readUEG();i.readBool()&&(l+=i.readUEG(),p+=i.readUEG(),c+=i.readUEG(),v+=i.readUEG());var He=i.readUEG(),De=i.readUEG(),Ee=i.readUEG();for(xe=i.readBool()?0:k;xe<=k;xe++)i.readUEG(),i.readUEG(),i.readUEG();if(i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readBool()&&i.readBool())for(var Be=0;Be<4;Be++)for(var We=0;We<(Be===3?2:6);We++)if(i.readBool()){var Te=Math.min(64,1<<4+(Be<<1));for(Be>1&&i.readSEG(),xe=0;xe<Te;xe++)i.readSEG()}else i.readUEG();i.readBool(),i.readBool(),i.readBool()&&(i.readByte(),i.readUEG(),i.readUEG(),i.readBool());var Ke=i.readUEG(),dt=0;for(xe=0;xe<Ke;xe++){var nt=!1;if(xe!==0&&(nt=i.readBool()),nt){xe===Ke&&i.readUEG(),i.readBool(),i.readUEG();for(var ct=0,Pe=0;Pe<=dt;Pe++){var Dt=i.readBool(),Pt=!1;Dt||(Pt=i.readBool()),(Dt||Pt)&&ct++}dt=ct}else{var Fi=i.readUEG(),Yn=i.readUEG();for(dt=Fi+Yn,Pe=0;Pe<Fi;Pe++)i.readUEG(),i.readBool();for(Pe=0;Pe<Yn;Pe++)i.readUEG(),i.readBool()}}if(i.readBool()){var mo=i.readUEG();for(xe=0;xe<mo;xe++){for(Pe=0;Pe<Ee+4;Pe++)i.readBits(1);i.readBits(1)}}var Jn=0,Ei=1,ki=1,Xn=!1,pn=1,hn=1;if(i.readBool(),i.readBool(),i.readBool()){if(i.readBool()){var Ci=i.readByte();Ci>0&&Ci<=16?(Ei=[1,12,10,16,40,24,20,32,80,18,15,64,160,4,3,2][Ci-1],ki=[1,11,11,11,33,11,11,11,33,11,11,33,99,3,2,1][Ci-1]):Ci===255&&(Ei=i.readBits(16),ki=i.readBits(16))}if(i.readBool()&&i.readBool(),i.readBool()&&(i.readBits(3),i.readBool(),i.readBool()&&(i.readByte(),i.readByte(),i.readByte())),i.readBool()&&(i.readUEG(),i.readUEG()),i.readBool(),i.readBool(),i.readBool(),i.readBool()&&(i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG()),i.readBool()&&(pn=i.readBits(32),hn=i.readBits(32),i.readBool()&&i.readUEG(),i.readBool())){var fn,mn,Hi=!1;for(fn=i.readBool(),mn=i.readBool(),(fn||mn)&&((Hi=i.readBool())&&(i.readByte(),i.readBits(5),i.readBool(),i.readBits(5)),i.readBits(4),i.readBits(4),Hi&&i.readBits(4),i.readBits(5),i.readBits(5),i.readBits(5)),xe=0;xe<=k;xe++){var Qn=i.readBool();Xn=Qn;var Zn=!0,gn=1;Qn||(Zn=i.readBool());var ea=!1;if(Zn?i.readUEG():ea=i.readBool(),ea||(gn=i.readUEG()+1),fn){for(Pe=0;Pe<gn;Pe++)i.readUEG(),i.readUEG(),Hi&&(i.readUEG(),i.readUEG());i.readBool()}if(mn){for(Pe=0;Pe<gn;Pe++)i.readUEG(),i.readUEG(),Hi&&(i.readUEG(),i.readUEG());i.readBool()}}}i.readBool()&&(i.readBool(),i.readBool(),i.readBool(),Jn=i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG())}i.readBool();var go="hvc1.".concat(M,".1.L").concat(me,".B0"),ta=Ie-(l+p)*(Oe===1||Oe===2?2:1),ia=Fe-(c+v)*(Oe===1?2:1),na=1;return Ei!==1&&ki!==1&&(na=Ei/ki),i.destroy(),i=null,{codec_mimetype:go,profile_string:r.getProfileString(M),level_string:r.getLevelString(me),profile_idc:M,bit_depth:He+8,ref_frames:1,chroma_format:Oe,chroma_format_string:r.getChromaFormatString(Oe),general_level_idc:me,general_profile_space:A,general_tier_flag:U,general_profile_idc:M,general_profile_compatibility_flags_1:O,general_profile_compatibility_flags_2:H,general_profile_compatibility_flags_3:J,general_profile_compatibility_flags_4:ne,general_constraint_indicator_flags_1:se,general_constraint_indicator_flags_2:he,general_constraint_indicator_flags_3:Z,general_constraint_indicator_flags_4:oe,general_constraint_indicator_flags_5:we,general_constraint_indicator_flags_6:Le,min_spatial_segmentation_idc:Jn,constant_frame_rate:0,chroma_format_idc:Oe,bit_depth_luma_minus8:He,bit_depth_chroma_minus8:De,frame_rate:{fixed:Xn,fps:hn/pn,fps_den:pn,fps_num:hn},sar_ratio:{width:Ei,height:ki},codec_size:{width:ta,height:ia},present_size:{width:ta*na,height:ia}}},r.parsePPS=function(o){var n=r._ebsp2rbsp(o),i=new D(n);i.readByte(),i.readByte(),i.readUEG(),i.readUEG(),i.readBool(),i.readBool(),i.readBits(3),i.readBool(),i.readBool(),i.readUEG(),i.readUEG(),i.readSEG(),i.readBool(),i.readBool(),i.readBool()&&i.readUEG(),i.readSEG(),i.readSEG(),i.readBool(),i.readBool(),i.readBool(),i.readBool();var l=i.readBool(),p=i.readBool(),c=1;return p&&l?c=0:p?c=3:l&&(c=2),{parallelismType:c}},r.getChromaFormatString=function(o){switch(o){case 0:return"4:0:0";case 1:return"4:2:0";case 2:return"4:2:2";case 3:return"4:4:4";default:return"Unknown"}},r.getProfileString=function(o){switch(o){case 1:return"Main";case 2:return"Main10";case 3:return"MainSP";case 4:return"Rext";case 9:return"SCC";default:return"Unknown"}},r.getLevelString=function(o){return(o/30).toFixed(1)},r}();function j(r){return r.byteOffset%2==0&&r.byteLength%2==0}function X(r){return r.byteOffset%4==0&&r.byteLength%4==0}function V(r,o){for(var n=0;n<r.length;n++)if(r[n]!==o[n])return!1;return!0}var L=function(r,o){return r.byteLength===o.byteLength&&(X(r)&&X(o)?function(n,i){return V(new Uint32Array(n.buffer,n.byteOffset,n.byteLength/4),new Uint32Array(i.buffer,i.byteOffset,i.byteLength/4))}(r,o):j(r)&&j(o)?function(n,i){return V(new Uint16Array(n.buffer,n.byteOffset,n.byteLength/2),new Uint16Array(i.buffer,i.byteOffset,i.byteLength/2))}(r,o):function(n,i){return V(n,i)}(r,o))},C=function(){return C=Object.assign||function(r){for(var o,n=1,i=arguments.length;n<i;n++)for(var l in o=arguments[n])Object.prototype.hasOwnProperty.call(o,l)&&(r[l]=o[l]);return r},C.apply(this,arguments)},B=function(){function r(){}return r.parseOBUs=function(o,n){for(var i=0;i<o.byteLength;){var l=i,p=(o[i],(120&o[i])>>3),c=!!(4&o[i]),v=!!(2&o[i]);o[i],i+=1,c&&(i+=1);var k=Number.POSITIVE_INFINITY;if(v){k=0;for(var A=0;;A++){var U=o[i++];if(k|=(127&U)<<7*A,!(128&U))break}}console.log(p),p===1?n=C(C({},r.parseSeuqneceHeader(o.subarray(i,i+k))),{sequence_header_data:o.subarray(l,i+k)}):(p==3&&n||p==6&&n)&&(n=r.parseOBUFrameHeader(o.subarray(i,i+k),0,0,n)),i+=k}return n},r.parseSeuqneceHeader=function(o){var n=new D(o),i=n.readBits(3),l=(n.readBool(),n.readBool()),p=!0,c=0,v=1,k=void 0,A=[];if(l)A.push({operating_point_idc:0,level:n.readBits(5),tier:0});else{if(n.readBool()){var U=n.readBits(32),M=n.readBits(32),O=n.readBool();if(O){for(var H=0;n.readBits(1)===0;)H+=1;H>=32||n.readBits(H)}c=M,v=U,p=O,n.readBool()&&(n.readBits(5),n.readBits(32),k=n.readBits(5),n.readBits(5))}for(var J=n.readBool(),ne=n.readBits(5),se=0;se<=ne;se++){var he=n.readBits(12),Z=n.readBits(5),oe=Z>7?n.readBits(1):0;A.push({operating_point_idc:he,level:Z,tier:oe}),J&&n.readBool()&&n.readBits(4)}}var we=A[0],Le=we.level,me=we.tier,ge=n.readBits(4),ke=n.readBits(4),xe=n.readBits(ge+1)+1,Oe=n.readBits(ke+1)+1,Ie=!1;l||(Ie=n.readBool()),Ie&&(n.readBits(4),n.readBits(4)),n.readBool(),n.readBool(),n.readBool();var Fe=!1,He=2,De=2,Ee=0;l||(n.readBool(),n.readBool(),n.readBool(),n.readBool(),(Fe=n.readBool())&&(n.readBool(),n.readBool()),De=(He=n.readBool()?2:n.readBits(1))?n.readBool()?2:n.readBits(1):2,Ee=Fe?n.readBits(3)+1:0);var Be=n.readBool(),We=(n.readBool(),n.readBool(),n.readBool()),Te=8;Te=i===2&&We?n.readBool()?12:10:We?10:8;var Ke=!1;i!==1&&(Ke=n.readBool()),n.readBool()&&(n.readBits(8),n.readBits(8),n.readBits(8));var dt=1,nt=1;return Ke?(n.readBits(1),dt=1,nt=1):(n.readBits(1),i==0?(dt=1,nt=1):i==1?(dt=0,nt=0):Te==12?n.readBits(1)&&n.readBits(1):(dt=1,nt=0),dt&&nt&&n.readBits(2),n.readBits(1)),n.readBool(),n.destroy(),n=null,{codec_mimetype:"av01.".concat(i,".").concat(r.getLevelString(Le,me),".").concat(Te.toString(10).padStart(2,"0")),level:Le,tier:me,level_string:r.getLevelString(Le,me),profile_idc:i,profile_string:"".concat(i),bit_depth:Te,ref_frames:1,chroma_format:r.getChromaFormat(Ke,dt,nt),chroma_format_string:r.getChromaFormatString(Ke,dt,nt),sequence_header:{frame_id_numbers_present_flag:Ie,additional_frame_id_length_minus_1:void 0,delta_frame_id_length_minus_2:void 0,reduced_still_picture_header:l,decoder_model_info_present_flag:!1,operating_points:A,buffer_removal_time_length_minus_1:k,equal_picture_interval:p,seq_force_screen_content_tools:He,seq_force_integer_mv:De,enable_order_hint:Fe,order_hint_bits:Ee,enable_superres:Be,frame_width_bit:ge+1,frame_height_bit:ke+1,max_frame_width:xe,max_frame_height:Oe},keyframe:void 0,frame_rate:{fixed:p,fps:c/v,fps_den:v,fps_num:c}}},r.parseOBUFrameHeader=function(o,n,i,l){var p=l.sequence_header,c=new D(o),v=(p.max_frame_width,p.max_frame_height,0);p.frame_id_numbers_present_flag&&(v=p.additional_frame_id_length_minus_1+p.delta_frame_id_length_minus_2+3);var k=0,A=!0,U=!0,M=!1;if(!p.reduced_still_picture_header){if(c.readBool())return l;A=(k=c.readBits(2))===2||k===0,(U=c.readBool())&&p.decoder_model_info_present_flag&&p.equal_picture_interval,U&&c.readBool(),M=!!(k===3||k===0&&U)||c.readBool()}l.keyframe=A,c.readBool();var O=p.seq_force_screen_content_tools;p.seq_force_screen_content_tools===2&&(O=c.readBits(1)),O&&(p.seq_force_integer_mv,p.seq_force_integer_mv==2&&c.readBits(1)),p.frame_id_numbers_present_flag&&c.readBits(v);var H;if(H=k==3||!p.reduced_still_picture_header&&c.readBool(),c.readBits(p.order_hint_bits),A||M||c.readBits(3),p.decoder_model_info_present_flag&&c.readBool()){for(var J=0;J<=p.operating_points_cnt_minus_1;J++)if(p.operating_points[J].decoder_model_present_for_this_op[J]){var ne=p.operating_points[J].operating_point_idc;(ne===0||ne>>n&1&&ne>>i+8&1)&&c.readBits(p.buffer_removal_time_length_minus_1+1)}}var se=255;if(k===3||k==0&&U||(se=c.readBits(8)),(A||se!==255)&&M&&p.enable_order_hint)for(var he=0;he<8;he++)c.readBits(p.order_hint_bits);if(A){var Z=r.frameSizeAndRenderSize(c,H,p);l.codec_size={width:Z.FrameWidth,height:Z.FrameHeight},l.present_size={width:Z.RenderWidth,height:Z.RenderHeight},l.sar_ratio={width:Z.RenderWidth/Z.FrameWidth,height:Z.RenderHeight/Z.FrameHeight}}return c.destroy(),c=null,l},r.frameSizeAndRenderSize=function(o,n,i){var l=i.max_frame_width,p=i.max_frame_height;n&&(l=o.readBits(i.frame_width_bit)+1,p=o.readBits(i.frame_height_bit)+1);var c=!1;i.enable_superres&&(c=o.readBool());var v=8;c&&(v=o.readBits(3)+9);var k=l;l=Math.floor((8*k+v/2)/v);var A=k,U=p;if(o.readBool()){var M=o.readBits(16)+1,O=o.readBits(16)+1;A=o.readBits(M)+1,U=o.readBits(O)+1}return{UpscaledWidth:k,FrameWidth:l,FrameHeight:p,RenderWidth:A,RenderHeight:U}},r.getLevelString=function(o,n){return"".concat(o.toString(10).padStart(2,"0")).concat(n===0?"M":"H")},r.getChromaFormat=function(o,n,i){return o?0:n===0&&i===0?3:n===1&&i===0?2:n===1&&i===1?1:Number.NaN},r.getChromaFormatString=function(o,n,i){return o?"4:0:0":n===0&&i===0?"4:4:4":n===1&&i===0?"4:2:2":n===1&&i===1?"4:2:0":"Unknown"},r}(),T=function(){};function Q(r,o,n){if(!r||r.byteLength<2)return null;var i=1;n==="h265"&&(i=2);var l=function(U){for(var M=U,O=M.byteLength,H=new Uint8Array(O),J=0,ne=0;ne<O;ne++)ne>=2&&M[ne]===3&&M[ne-1]===0&&M[ne-2]===0||(H[J]=M[ne],J++);return new Uint8Array(H.buffer,0,J)}(r.subarray(i)),p=0;if(p===l.byteLength-1&&l[p]===128)return null;for(var c=0;p<l.byteLength&&l[p]===255;)c+=255,p++;if(p>=l.byteLength)return null;c+=l[p++];for(var v=0;p<l.byteLength&&l[p]===255;)v+=255,p++;if(p>=l.byteLength||(v+=l[p++],p+v>l.byteLength))return null;var k=new T;k.type=c,k.size=v;var A=l.subarray(p,p+v);return c===5&&v>=16&&(k.uuid=A.subarray(0,16),k.user_data=A.subarray(16)),o!==void 0&&(k.pts=o),k}var K,ce=function(){function r(o,n){this.TAG="FLVDemuxer",this._config=n,this._onError=null,this._onMediaInfo=null,this._onMetaDataArrived=null,this._onScriptDataArrived=null,this._onTrackMetadata=null,this._onDataAvailable=null,this._onSeiArrived=null,this._dataOffset=o.dataOffset,this._firstParse=!0,this._dispatch=!1,this._hasAudio=o.hasAudioTrack,this._hasVideo=o.hasVideoTrack,this._hasAudioFlagOverrided=!1,this._hasVideoFlagOverrided=!1,this._audioInitialMetadataDispatched=!1,this._videoInitialMetadataDispatched=!1,this._mediaInfo=new m.default,this._mediaInfo.hasAudio=this._hasAudio,this._mediaInfo.hasVideo=this._hasVideo,this._metadata=null,this._audioMetadata=null,this._videoMetadata=null,this._naluLengthSize=4,this._timestampBase=0,this._timescale=1e3,this._duration=0,this._durationOverrided=!1,this._referenceFrameRate={fixed:!0,fps:23.976,fps_num:23976,fps_den:1e3},this._flvSoundRateTable=[5500,11025,22050,44100,48e3],this._mpegSamplingRates=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350],this._mpegAudioV10SampleRateTable=[44100,48e3,32e3,0],this._mpegAudioV20SampleRateTable=[22050,24e3,16e3,0],this._mpegAudioV25SampleRateTable=[11025,12e3,8e3,0],this._mpegAudioL1BitRateTable=[0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,-1],this._mpegAudioL2BitRateTable=[0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,-1],this._mpegAudioL3BitRateTable=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,-1],this._videoTrack={type:"video",id:1,sequenceNumber:0,samples:[],length:0},this._audioTrack={type:"audio",id:2,sequenceNumber:0,samples:[],length:0},this._littleEndian=function(){var i=new ArrayBuffer(2);return new DataView(i).setInt16(0,256,!0),new Int16Array(i)[0]===256}()}return r.prototype.destroy=function(){this._mediaInfo=null,this._metadata=null,this._audioMetadata=null,this._videoMetadata=null,this._videoTrack=null,this._audioTrack=null,this._onError=null,this._onMediaInfo=null,this._onMetaDataArrived=null,this._onScriptDataArrived=null,this._onTrackMetadata=null,this._onDataAvailable=null,this._onSeiArrived=null},r.probe=function(o){var n=new Uint8Array(o);if(n.byteLength<9)return{needMoreData:!0};var i={match:!1};if(n[0]!==70||n[1]!==76||n[2]!==86||n[3]!==1)return i;var l,p=(4&n[4])>>>2!=0,c=!!(1&n[4]),v=(l=n)[5]<<24|l[6]<<16|l[7]<<8|l[8];return v<9?i:{match:!0,consumed:v,dataOffset:v,hasAudioTrack:p,hasVideoTrack:c}},r.prototype.bindDataSource=function(o){return o.onDataArrival=this.parseChunks.bind(this),this},Object.defineProperty(r.prototype,"onTrackMetadata",{get:function(){return this._onTrackMetadata},set:function(o){this._onTrackMetadata=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"onMediaInfo",{get:function(){return this._onMediaInfo},set:function(o){this._onMediaInfo=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"onMetaDataArrived",{get:function(){return this._onMetaDataArrived},set:function(o){this._onMetaDataArrived=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"onScriptDataArrived",{get:function(){return this._onScriptDataArrived},set:function(o){this._onScriptDataArrived=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"onSeiArrived",{get:function(){return this._onSeiArrived},set:function(o){this._onSeiArrived=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"onError",{get:function(){return this._onError},set:function(o){this._onError=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"onDataAvailable",{get:function(){return this._onDataAvailable},set:function(o){this._onDataAvailable=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"timestampBase",{get:function(){return this._timestampBase},set:function(o){this._timestampBase=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"overridedDuration",{get:function(){return this._duration},set:function(o){this._durationOverrided=!0,this._duration=o,this._mediaInfo.duration=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"overridedHasAudio",{set:function(o){this._hasAudioFlagOverrided=!0,this._hasAudio=o,this._mediaInfo.hasAudio=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"overridedHasVideo",{set:function(o){this._hasVideoFlagOverrided=!0,this._hasVideo=o,this._mediaInfo.hasVideo=o},enumerable:!1,configurable:!0}),r.prototype.resetMediaInfo=function(){this._mediaInfo=new m.default},r.prototype._isInitialMetadataDispatched=function(){return this._hasAudio&&this._hasVideo?this._audioInitialMetadataDispatched&&this._videoInitialMetadataDispatched:this._hasAudio&&!this._hasVideo?this._audioInitialMetadataDispatched:!(this._hasAudio||!this._hasVideo)&&this._videoInitialMetadataDispatched},r.prototype.parseChunks=function(o,n){if(!(this._onError&&this._onMediaInfo&&this._onTrackMetadata&&this._onDataAvailable))throw new P.IllegalStateException("Flv: onError & onMediaInfo & onTrackMetadata & onDataAvailable callback must be specified");var i=0,l=this._littleEndian;if(n===0){if(!(o.byteLength>13))return 0;i=r.probe(o).dataOffset}for(this._firstParse&&(this._firstParse=!1,n+i!==this._dataOffset&&u.default.w(this.TAG,"First time parsing but chunk byteStart invalid!"),(p=new DataView(o,i)).getUint32(0,!l)!==0&&u.default.w(this.TAG,"PrevTagSize0 !== 0 !!!"),i+=4);i<o.byteLength;){this._dispatch=!0;var p=new DataView(o,i);if(i+11+4>o.byteLength)break;var c=p.getUint8(0),v=16777215&p.getUint32(0,!l);if(i+11+v+4>o.byteLength)break;if(c===8||c===9||c===18){var k=p.getUint8(4),A=p.getUint8(5),U=p.getUint8(6)|A<<8|k<<16|p.getUint8(7)<<24;16777215&p.getUint32(7,!l)&&u.default.w(this.TAG,"Meet tag which has StreamID != 0!");var M=i+11;switch(c){case 8:this._parseAudioData(o,M,v,U);break;case 9:this._parseVideoData(o,M,v,U,n+i);break;case 18:this._parseScriptData(o,M,v)}var O=p.getUint32(11+v,!l);O!==11+v&&u.default.w(this.TAG,"Invalid PrevTagSize ".concat(O)),i+=11+v+4}else u.default.w(this.TAG,"Unsupported tag type ".concat(c,", skipped")),i+=11+v+4}return this._isInitialMetadataDispatched()&&this._dispatch&&(this._audioTrack.length||this._videoTrack.length)&&this._onDataAvailable(this._audioTrack,this._videoTrack),i},r.prototype._parseScriptData=function(o,n,i){var l=z.parseScriptData(o,n,i);if(l.hasOwnProperty("onMetaData")){if(l.onMetaData==null||typeof l.onMetaData!="object")return void u.default.w(this.TAG,"Invalid onMetaData structure!");this._metadata&&u.default.w(this.TAG,"Found another onMetaData tag!"),this._metadata=l;var p=this._metadata.onMetaData;if(this._onMetaDataArrived&&this._onMetaDataArrived(Object.assign({},p)),typeof p.hasAudio=="boolean"&&this._hasAudioFlagOverrided===!1&&(this._hasAudio=p.hasAudio,this._mediaInfo.hasAudio=this._hasAudio),typeof p.hasVideo=="boolean"&&this._hasVideoFlagOverrided===!1&&(this._hasVideo=p.hasVideo,this._mediaInfo.hasVideo=this._hasVideo),typeof p.audiodatarate=="number"&&(this._mediaInfo.audioDataRate=p.audiodatarate),typeof p.videodatarate=="number"&&(this._mediaInfo.videoDataRate=p.videodatarate),typeof p.width=="number"&&(this._mediaInfo.width=p.width),typeof p.height=="number"&&(this._mediaInfo.height=p.height),typeof p.duration=="number"){if(!this._durationOverrided){var c=Math.floor(p.duration*this._timescale);this._duration=c,this._mediaInfo.duration=c}}else this._mediaInfo.duration=0;if(typeof p.framerate=="number"){var v=Math.floor(1e3*p.framerate);if(v>0){var k=v/1e3;this._referenceFrameRate.fixed=!0,this._referenceFrameRate.fps=k,this._referenceFrameRate.fps_num=v,this._referenceFrameRate.fps_den=1e3,this._mediaInfo.fps=k}}if(typeof p.keyframes=="object"){this._mediaInfo.hasKeyframesIndex=!0;var A=p.keyframes;this._mediaInfo.keyframesIndex=this._parseKeyframesIndex(A),p.keyframes=null}else this._mediaInfo.hasKeyframesIndex=!1;this._dispatch=!1,this._mediaInfo.metadata=p,u.default.v(this.TAG,"Parsed onMetaData"),this._mediaInfo.isComplete()&&this._onMediaInfo(this._mediaInfo)}Object.keys(l).length>0&&this._onScriptDataArrived&&this._onScriptDataArrived(Object.assign({},l))},r.prototype._parseSEIPayload=function(o,n,i){var l=Q(o,n,i);l&&typeof this._onSeiArrived=="function"&&this._onSeiArrived(l)},r.prototype._parseKeyframesIndex=function(o){for(var n=[],i=[],l=1;l<o.times.length;l++){var p=this._timestampBase+Math.floor(1e3*o.times[l]);n.push(p),i.push(o.filepositions[l])}return{times:n,filepositions:i}},r.prototype._parseAudioData=function(o,n,i,l){if(i<=1)u.default.w(this.TAG,"Flv: Invalid audio packet, missing SoundData payload!");else if(this._hasAudioFlagOverrided!==!0||this._hasAudio!==!1){this._littleEndian;var p=new DataView(o,n,i).getUint8(0),c=p>>>4;if(c!==9)if(c===2||c===3||c===10){var v=0,k=(12&p)>>>2;if(k>=0&&k<=4){v=this._flvSoundRateTable[k];var A=(2&p)>>>1,U=1&p,M=this._audioMetadata,O=this._audioTrack;if(M||(this._hasAudio===!1&&this._hasAudioFlagOverrided===!1&&(this._hasAudio=!0,this._mediaInfo.hasAudio=!0),(M=this._audioMetadata={}).type="audio",M.id=O.id,M.timescale=this._timescale,M.duration=this._duration,M.audioSampleRate=v,M.channelCount=U===0?1:2),c===10){var H=this._parseAACAudioData(o,n+1,i-1);if(H==null)return;if(H.packetType===0){if(M.config){if(L(H.data.config,M.config))return;u.default.w(this.TAG,"AudioSpecificConfig has been changed, re-generate initialization segment")}var J=H.data;M.audioSampleRate=J.samplingRate,M.channelCount=J.channelCount,M.codec=J.codec,M.originalCodec=J.originalCodec,M.config=J.config,M.refSampleDuration=1024/M.audioSampleRate*M.timescale,u.default.v(this.TAG,"Parsed AudioSpecificConfig"),this._isInitialMetadataDispatched()?this._dispatch&&(this._audioTrack.length||this._videoTrack.length)&&this._onDataAvailable(this._audioTrack,this._videoTrack):this._audioInitialMetadataDispatched=!0,this._dispatch=!1,this._onTrackMetadata("audio",M),(Z=this._mediaInfo).audioCodec=M.originalCodec,Z.audioSampleRate=M.audioSampleRate,Z.audioChannelCount=M.channelCount,Z.hasVideo?Z.videoCodec!=null&&(Z.mimeType='video/x-flv; codecs="'+Z.videoCodec+","+Z.audioCodec+'"'):Z.mimeType='video/x-flv; codecs="'+Z.audioCodec+'"',Z.isComplete()&&this._onMediaInfo(Z)}else if(H.packetType===1){var ne=this._timestampBase+l,se={unit:H.data,length:H.data.byteLength,dts:ne,pts:ne};O.samples.push(se),O.length+=H.data.length}else u.default.e(this.TAG,"Flv: Unsupported AAC data type ".concat(H.packetType))}else if(c===2){if(!M.codec){if((J=this._parseMP3AudioData(o,n+1,i-1,!0))==null)return;M.audioSampleRate=J.samplingRate,M.channelCount=J.channelCount,M.codec=J.codec,M.originalCodec=J.originalCodec,M.refSampleDuration=1152/M.audioSampleRate*M.timescale,u.default.v(this.TAG,"Parsed MPEG Audio Frame Header"),this._audioInitialMetadataDispatched=!0,this._onTrackMetadata("audio",M),(Z=this._mediaInfo).audioCodec=M.codec,Z.audioSampleRate=M.audioSampleRate,Z.audioChannelCount=M.channelCount,Z.audioDataRate=J.bitRate,Z.hasVideo?Z.videoCodec!=null&&(Z.mimeType='video/x-flv; codecs="'+Z.videoCodec+","+Z.audioCodec+'"'):Z.mimeType='video/x-flv; codecs="'+Z.audioCodec+'"',Z.isComplete()&&this._onMediaInfo(Z)}if((oe=this._parseMP3AudioData(o,n+1,i-1,!1))==null)return;ne=this._timestampBase+l;var he={unit:oe,length:oe.byteLength,dts:ne,pts:ne};O.samples.push(he),O.length+=oe.length}else if(c===3){var Z;M.codec||(M.audioSampleRate=v,M.sampleSize=8*(A+1),M.littleEndian=!0,M.codec="ipcm",M.originalCodec="ipcm",this._audioInitialMetadataDispatched=!0,this._onTrackMetadata("audio",M),(Z=this._mediaInfo).audioCodec=M.codec,Z.audioSampleRate=M.audioSampleRate,Z.audioChannelCount=M.channelCount,Z.audioDataRate=M.sampleSize*M.audioSampleRate,Z.hasVideo?Z.videoCodec!=null&&(Z.mimeType='video/x-flv; codecs="'+Z.videoCodec+","+Z.audioCodec+'"'):Z.mimeType='video/x-flv; codecs="'+Z.audioCodec+'"',Z.isComplete()&&this._onMediaInfo(Z));var oe=new Uint8Array(o,n+1,i-1),we=(ne=this._timestampBase+l,{unit:oe,length:oe.byteLength,dts:ne,pts:ne});O.samples.push(we),O.length+=oe.length}}else this._onError(E.default.FORMAT_ERROR,"Flv: Invalid audio sample rate idx: "+k)}else this._onError(E.default.CODEC_UNSUPPORTED,"Flv: Unsupported audio codec idx: "+c);else{if(i<=5)return void u.default.w(this.TAG,"Flv: Invalid audio packet, missing AudioFourCC in Ehnanced FLV payload!");var Le=15&p,me=String.fromCharCode.apply(String,new Uint8Array(o,n,i).slice(1,5));switch(me){case"Opus":this._parseOpusAudioPacket(o,n+5,i-5,l,Le);break;case"fLaC":this._parseFlacAudioPacket(o,n+5,i-5,l,Le);break;default:this._onError(E.default.CODEC_UNSUPPORTED,"Flv: Unsupported audio codec: "+me)}}}},r.prototype._parseAACAudioData=function(o,n,i){if(!(i<=1)){var l={},p=new Uint8Array(o,n,i);return l.packetType=p[0],p[0]===0?l.data=this._parseAACAudioSpecificConfig(o,n+1,i-1):l.data=p.subarray(1),l}u.default.w(this.TAG,"Flv: Invalid AAC packet, missing AACPacketType or/and Data!")},r.prototype._parseAACAudioSpecificConfig=function(o,n,i){var l,p,c=new Uint8Array(o,n,i),v=null,k=0,A=null;if(k=l=c[0]>>>3,(p=(7&c[0])<<1|c[1]>>>7)<0||p>=this._mpegSamplingRates.length)this._onError(E.default.FORMAT_ERROR,"Flv: AAC invalid sampling frequency index!");else{var U=this._mpegSamplingRates[p],M=(120&c[1])>>>3;if(!(M<0||M>=8)){k===5&&(A=(7&c[1])<<1|c[2]>>>7,c[2]);var O=self.navigator.userAgent.toLowerCase();return O.indexOf("firefox")!==-1?p>=6?(k=5,v=new Array(4),A=p-3):(k=2,v=new Array(2),A=p):O.indexOf("android")!==-1?(k=2,v=new Array(2),A=p):(k=5,A=p,v=new Array(4),p>=6?A=p-3:M===1&&(k=2,v=new Array(2),A=p)),v[0]=k<<3,v[0]|=(15&p)>>>1,v[1]=(15&p)<<7,v[1]|=(15&M)<<3,k===5&&(v[1]|=(15&A)>>>1,v[2]=(1&A)<<7,v[2]|=8,v[3]=0),{config:v,samplingRate:U,channelCount:M,codec:"mp4a.40."+k,originalCodec:"mp4a.40."+l}}this._onError(E.default.FORMAT_ERROR,"Flv: AAC invalid channel configuration")}},r.prototype._parseMP3AudioData=function(o,n,i,l){if(!(i<4)){this._littleEndian;var p=new Uint8Array(o,n,i),c=null;if(l){if(p[0]!==255)return;var v=p[1]>>>3&3,k=(6&p[1])>>1,A=(240&p[2])>>>4,U=(12&p[2])>>>2,M=3&~(p[3]>>>6)?2:1,O=0,H=0;switch(v){case 0:O=this._mpegAudioV25SampleRateTable[U];break;case 2:O=this._mpegAudioV20SampleRateTable[U];break;case 3:O=this._mpegAudioV10SampleRateTable[U]}switch(k){case 1:A<this._mpegAudioL3BitRateTable.length&&(H=this._mpegAudioL3BitRateTable[A]);break;case 2:A<this._mpegAudioL2BitRateTable.length&&(H=this._mpegAudioL2BitRateTable[A]);break;case 3:A<this._mpegAudioL1BitRateTable.length&&(H=this._mpegAudioL1BitRateTable[A])}c={bitRate:H,samplingRate:O,channelCount:M,codec:"mp3",originalCodec:"mp3"}}else c=p;return c}u.default.w(this.TAG,"Flv: Invalid MP3 packet, header missing!")},r.prototype._parseOpusAudioPacket=function(o,n,i,l,p){if(p===0)this._parseOpusSequenceHeader(o,n,i);else if(p===1)this._parseOpusAudioData(o,n,i,l);else if(p!==2)return void this._onError(E.default.FORMAT_ERROR,"Flv: Invalid video packet type ".concat(p))},r.prototype._parseOpusSequenceHeader=function(o,n,i){if(i<=16)u.default.w(this.TAG,"Flv: Invalid OpusSequenceHeader, lack of data!");else{var l=this._audioMetadata,p=this._audioTrack;l||(this._hasAudio===!1&&this._hasAudioFlagOverrided===!1&&(this._hasAudio=!0,this._mediaInfo.hasAudio=!0),(l=this._audioMetadata={}).type="audio",l.id=p.id,l.timescale=this._timescale,l.duration=this._duration);var c=new DataView(o,n,i);c.setUint8(8,0);var v=c.getUint8(9);c.setUint16(10,c.getUint16(10,!0),!1);var k=c.getUint32(12,!0);c.setUint32(12,c.getUint32(12,!0),!1);var A={config:new Uint8Array(o,n+8,i-8),channelCount:v,samplingFrequence:k,codec:"opus",originalCodec:"opus"};if(l.config){if(L(A.config,l.config))return;u.default.w(this.TAG,"OpusSequenceHeader has been changed, re-generate initialization segment")}l.audioSampleRate=A.samplingFrequence,l.channelCount=A.channelCount,l.codec=A.codec,l.originalCodec=A.originalCodec,l.config=A.config,l.refSampleDuration=20,u.default.v(this.TAG,"Parsed OpusSequenceHeader"),this._isInitialMetadataDispatched()?this._dispatch&&(this._audioTrack.length||this._videoTrack.length)&&this._onDataAvailable(this._audioTrack,this._videoTrack):this._audioInitialMetadataDispatched=!0,this._dispatch=!1,this._onTrackMetadata("audio",l);var U=this._mediaInfo;U.audioCodec=l.originalCodec,U.audioSampleRate=l.audioSampleRate,U.audioChannelCount=l.channelCount,U.hasVideo?U.videoCodec!=null&&(U.mimeType='video/x-flv; codecs="'+U.videoCodec+","+U.audioCodec+'"'):U.mimeType='video/x-flv; codecs="'+U.audioCodec+'"',U.isComplete()&&this._onMediaInfo(U)}},r.prototype._parseOpusAudioData=function(o,n,i,l){var p=this._audioTrack,c=new Uint8Array(o,n,i),v=this._timestampBase+l,k={unit:c,length:c.byteLength,dts:v,pts:v};p.samples.push(k),p.length+=c.length},r.prototype._parseFlacAudioPacket=function(o,n,i,l,p){if(p===0)this._parseFlacSequenceHeader(o,n,i);else if(p===1)this._parseFlacAudioData(o,n,i,l);else if(p!==2)return void this._onError(E.default.FORMAT_ERROR,"Flv: Invalid Flac audio packet type ".concat(p))},r.prototype._parseFlacSequenceHeader=function(o,n,i){var l=this._audioMetadata,p=this._audioTrack;l||(this._hasAudio===!1&&this._hasAudioFlagOverrided===!1&&(this._hasAudio=!0,this._mediaInfo.hasAudio=!0),(l=this._audioMetadata={}).type="audio",l.id=p.id,l.timescale=this._timescale,l.duration=this._duration);var c=new Uint8Array(o,n+4,i-4),v=new D(c),k=v.readBits(16),A=v.readBits(16),U=A===k?A:null;v.readBits(24),v.readBits(24);var M=v.readBits(20),O=v.readBits(3)+1,H=v.readBits(5)+1;v.destroy();var J=new Uint8Array(c.byteLength+4);J.set(c,4),J[0]=128,J[1]=c.byteLength>>>16&255,J[2]=c.byteLength>>>8&255,J[3]=c.byteLength>>>0&255;var ne={config:J,channelCount:O,samplingFrequence:M,sampleSize:H,codec:"flac",originalCodec:"flac"};if(l.config){if(L(ne.config,l.config))return;u.default.w(this.TAG,"FlacSequenceHeader has been changed, re-generate initialization segment")}l.audioSampleRate=ne.samplingFrequence,l.channelCount=ne.channelCount,l.sampleSize=ne.sampleSize,l.codec=ne.codec,l.originalCodec=ne.originalCodec,l.config=ne.config,l.refSampleDuration=U!=null?1e3*U/ne.samplingFrequence:null,u.default.v(this.TAG,"Parsed FlacSequenceHeader"),this._isInitialMetadataDispatched()?this._dispatch&&(this._audioTrack.length||this._videoTrack.length)&&this._onDataAvailable(this._audioTrack,this._videoTrack):this._audioInitialMetadataDispatched=!0,this._dispatch=!1,this._onTrackMetadata("audio",l);var se=this._mediaInfo;se.audioCodec=l.originalCodec,se.audioSampleRate=l.audioSampleRate,se.audioChannelCount=l.channelCount,se.hasVideo?se.videoCodec!=null&&(se.mimeType='video/x-flv; codecs="'+se.videoCodec+","+se.audioCodec+'"'):se.mimeType='video/x-flv; codecs="'+se.audioCodec+'"',se.isComplete()&&this._onMediaInfo(se)},r.prototype._parseFlacAudioData=function(o,n,i,l){var p=this._audioTrack,c=new Uint8Array(o,n,i),v=this._timestampBase+l,k={unit:c,length:c.byteLength,dts:v,pts:v};p.samples.push(k),p.length+=c.length},r.prototype._parseVideoData=function(o,n,i,l,p){if(i<=1)u.default.w(this.TAG,"Flv: Invalid video packet, missing VideoData payload!");else if(this._hasVideoFlagOverrided!==!0||this._hasVideo!==!1){var c=new Uint8Array(o,n,i)[0],v=(112&c)>>>4;if(128&c){var k=15&c,A=String.fromCharCode.apply(String,new Uint8Array(o,n,i).slice(1,5));if(A==="hvc1")this._parseEnhancedHEVCVideoPacket(o,n+5,i-5,l,p,v,k);else{if(A!=="av01")return void this._onError(E.default.CODEC_UNSUPPORTED,"Flv: Unsupported codec in video frame: ".concat(A));this._parseEnhancedAV1VideoPacket(o,n+5,i-5,l,p,v,k)}}else{var U=15&c;if(U===7)this._parseAVCVideoPacket(o,n+1,i-1,l,p,v);else{if(U!==12)return void this._onError(E.default.CODEC_UNSUPPORTED,"Flv: Unsupported codec in video frame: ".concat(U));this._parseHEVCVideoPacket(o,n+1,i-1,l,p,v)}}}},r.prototype._parseAVCVideoPacket=function(o,n,i,l,p,c){if(i<4)u.default.w(this.TAG,"Flv: Invalid AVC packet, missing AVCPacketType or/and CompositionTime");else{var v=this._littleEndian,k=new DataView(o,n,i),A=k.getUint8(0),U=(16777215&k.getUint32(0,!v))<<8>>8;if(A===0)this._parseAVCDecoderConfigurationRecord(o,n+4,i-4);else if(A===1)this._parseAVCVideoData(o,n+4,i-4,l,p,c,U);else if(A!==2)return void this._onError(E.default.FORMAT_ERROR,"Flv: Invalid video packet type ".concat(A))}},r.prototype._parseHEVCVideoPacket=function(o,n,i,l,p,c){if(i<4)u.default.w(this.TAG,"Flv: Invalid HEVC packet, missing HEVCPacketType or/and CompositionTime");else{var v=this._littleEndian,k=new DataView(o,n,i),A=k.getUint8(0),U=(16777215&k.getUint32(0,!v))<<8>>8;if(A===0)this._parseHEVCDecoderConfigurationRecord(o,n+4,i-4);else if(A===1)this._parseHEVCVideoData(o,n+4,i-4,l,p,c,U);else if(A!==2)return void this._onError(E.default.FORMAT_ERROR,"Flv: Invalid video packet type ".concat(A))}},r.prototype._parseEnhancedHEVCVideoPacket=function(o,n,i,l,p,c,v){var k=this._littleEndian,A=new DataView(o,n,i);if(v===0)this._parseHEVCDecoderConfigurationRecord(o,n,i);else if(v===1){var U=(4294967040&A.getUint32(0,!k))>>8;this._parseHEVCVideoData(o,n+3,i-3,l,p,c,U)}else if(v===3)this._parseHEVCVideoData(o,n,i,l,p,c,0);else if(v!==2)return void this._onError(E.default.FORMAT_ERROR,"Flv: Invalid video packet type ".concat(v))},r.prototype._parseEnhancedAV1VideoPacket=function(o,n,i,l,p,c,v){if(this._littleEndian,v===0)this._parseAV1CodecConfigurationRecord(o,n,i);else if(v===1)this._parseAV1VideoData(o,n,i,l,p,c,0);else{if(v===5)return void this._onError(E.default.FORMAT_ERROR,"Flv: Not Supported MP2T AV1 video packet type ".concat(v));if(v!==2)return void this._onError(E.default.FORMAT_ERROR,"Flv: Invalid video packet type ".concat(v))}},r.prototype._parseAVCDecoderConfigurationRecord=function(o,n,i){if(i<7)u.default.w(this.TAG,"Flv: Invalid AVCDecoderConfigurationRecord, lack of data!");else{var l=this._videoMetadata,p=this._videoTrack,c=this._littleEndian,v=new DataView(o,n,i);if(l){if(l.avcc!==void 0){var k=new Uint8Array(o,n,i);if(L(k,l.avcc))return;u.default.w(this.TAG,"AVCDecoderConfigurationRecord has been changed, re-generate initialization segment")}}else this._hasVideo===!1&&this._hasVideoFlagOverrided===!1&&(this._hasVideo=!0,this._mediaInfo.hasVideo=!0),(l=this._videoMetadata={}).type="video",l.id=p.id,l.timescale=this._timescale,l.duration=this._duration;var A=v.getUint8(0),U=v.getUint8(1);if(v.getUint8(2),v.getUint8(3),A===1&&U!==0)if(this._naluLengthSize=1+(3&v.getUint8(4)),this._naluLengthSize===3||this._naluLengthSize===4){var M=31&v.getUint8(5);if(M!==0){M>1&&u.default.w(this.TAG,"Flv: Strange AVCDecoderConfigurationRecord: SPS Count = ".concat(M));for(var O=6,H=0;H<M;H++){var J=v.getUint16(O,!c);if(O+=2,J!==0){var ne=new Uint8Array(o,n+O,J);O+=J;var se=F.parseSPS(ne);if(H===0){l.codecWidth=se.codec_size.width,l.codecHeight=se.codec_size.height,l.presentWidth=se.present_size.width,l.presentHeight=se.present_size.height,l.profile=se.profile_string,l.level=se.level_string,l.bitDepth=se.bit_depth,l.chromaFormat=se.chroma_format,l.sarRatio=se.sar_ratio,l.frameRate=se.frame_rate,se.frame_rate.fixed!==!1&&se.frame_rate.fps_num!==0&&se.frame_rate.fps_den!==0||(l.frameRate=this._referenceFrameRate);var he=l.frameRate.fps_den,Z=l.frameRate.fps_num;l.refSampleDuration=l.timescale*(he/Z);for(var oe=ne.subarray(1,4),we="avc1.",Le=0;Le<3;Le++){var me=oe[Le].toString(16);me.length<2&&(me="0"+me),we+=me}l.codec=we;var ge=this._mediaInfo;ge.width=l.codecWidth,ge.height=l.codecHeight,ge.fps=l.frameRate.fps,ge.profile=l.profile,ge.level=l.level,ge.refFrames=se.ref_frames,ge.chromaFormat=se.chroma_format_string,ge.sarNum=l.sarRatio.width,ge.sarDen=l.sarRatio.height,ge.videoCodec=we,ge.hasAudio?ge.audioCodec!=null&&(ge.mimeType='video/x-flv; codecs="'+ge.videoCodec+","+ge.audioCodec+'"'):ge.mimeType='video/x-flv; codecs="'+ge.videoCodec+'"',ge.isComplete()&&this._onMediaInfo(ge)}}}var ke=v.getUint8(O);if(ke!==0){for(ke>1&&u.default.w(this.TAG,"Flv: Strange AVCDecoderConfigurationRecord: PPS Count = ".concat(ke)),O++,H=0;H<ke;H++)J=v.getUint16(O,!c),O+=2,J!==0&&(O+=J);l.avcc=new Uint8Array(i),l.avcc.set(new Uint8Array(o,n,i),0),u.default.v(this.TAG,"Parsed AVCDecoderConfigurationRecord"),this._isInitialMetadataDispatched()?this._dispatch&&(this._audioTrack.length||this._videoTrack.length)&&this._onDataAvailable(this._audioTrack,this._videoTrack):this._videoInitialMetadataDispatched=!0,this._dispatch=!1,this._onTrackMetadata("video",l)}else this._onError(E.default.FORMAT_ERROR,"Flv: Invalid AVCDecoderConfigurationRecord: No PPS")}else this._onError(E.default.FORMAT_ERROR,"Flv: Invalid AVCDecoderConfigurationRecord: No SPS")}else this._onError(E.default.FORMAT_ERROR,"Flv: Strange NaluLengthSizeMinusOne: ".concat(this._naluLengthSize-1));else this._onError(E.default.FORMAT_ERROR,"Flv: Invalid AVCDecoderConfigurationRecord")}},r.prototype._parseHEVCDecoderConfigurationRecord=function(o,n,i){if(i<22)u.default.w(this.TAG,"Flv: Invalid HEVCDecoderConfigurationRecord, lack of data!");else{var l=this._videoMetadata,p=this._videoTrack,c=this._littleEndian,v=new DataView(o,n,i);if(l){if(l.hvcc!==void 0){var k=new Uint8Array(o,n,i);if(L(k,l.hvcc))return;u.default.w(this.TAG,"HEVCDecoderConfigurationRecord has been changed, re-generate initialization segment")}}else this._hasVideo===!1&&this._hasVideoFlagOverrided===!1&&(this._hasVideo=!0,this._mediaInfo.hasVideo=!0),(l=this._videoMetadata={}).type="video",l.id=p.id,l.timescale=this._timescale,l.duration=this._duration;var A=v.getUint8(0),U=31&v.getUint8(1);if(A!==0&&A!==1||U===0)this._onError(E.default.FORMAT_ERROR,"Flv: Invalid HEVCDecoderConfigurationRecord");else if(this._naluLengthSize=1+(3&v.getUint8(21)),this._naluLengthSize===3||this._naluLengthSize===4){for(var M=v.getUint8(22),O=0,H=23;O<M;O++){var J=63&v.getUint8(H+0),ne=v.getUint16(H+1,!c);H+=3;for(var se=0;se<ne;se++){var he=v.getUint16(H+0,!c);if(se===0)if(J===33){H+=2;var Z=new Uint8Array(o,n+H,he),oe=Y.parseSPS(Z);l.codecWidth=oe.codec_size.width,l.codecHeight=oe.codec_size.height,l.presentWidth=oe.present_size.width,l.presentHeight=oe.present_size.height,l.profile=oe.profile_string,l.level=oe.level_string,l.bitDepth=oe.bit_depth,l.chromaFormat=oe.chroma_format,l.sarRatio=oe.sar_ratio,l.frameRate=oe.frame_rate,oe.frame_rate.fixed!==!1&&oe.frame_rate.fps_num!==0&&oe.frame_rate.fps_den!==0||(l.frameRate=this._referenceFrameRate);var we=l.frameRate.fps_den,Le=l.frameRate.fps_num;l.refSampleDuration=l.timescale*(we/Le),l.codec=oe.codec_mimetype;var me=this._mediaInfo;me.width=l.codecWidth,me.height=l.codecHeight,me.fps=l.frameRate.fps,me.profile=l.profile,me.level=l.level,me.refFrames=oe.ref_frames,me.chromaFormat=oe.chroma_format_string,me.sarNum=l.sarRatio.width,me.sarDen=l.sarRatio.height,me.videoCodec=oe.codec_mimetype,me.hasAudio?me.audioCodec!=null&&(me.mimeType='video/x-flv; codecs="'+me.videoCodec+","+me.audioCodec+'"'):me.mimeType='video/x-flv; codecs="'+me.videoCodec+'"',me.isComplete()&&this._onMediaInfo(me),H+=he}else H+=2+he;else H+=2+he}}l.hvcc=new Uint8Array(i),l.hvcc.set(new Uint8Array(o,n,i),0),u.default.v(this.TAG,"Parsed HEVCDecoderConfigurationRecord"),this._isInitialMetadataDispatched()?this._dispatch&&(this._audioTrack.length||this._videoTrack.length)&&this._onDataAvailable(this._audioTrack,this._videoTrack):this._videoInitialMetadataDispatched=!0,this._dispatch=!1,this._onTrackMetadata("video",l)}else this._onError(E.default.FORMAT_ERROR,"Flv: Strange NaluLengthSizeMinusOne: ".concat(this._naluLengthSize-1))}},r.prototype._parseAV1CodecConfigurationRecord=function(o,n,i){if(i<4)u.default.w(this.TAG,"Flv: Invalid AV1CodecConfigurationRecord, lack of data!");else{var l=this._videoMetadata,p=this._videoTrack,c=(this._littleEndian,new DataView(o,n,i));l?l.av1c!==void 0&&u.default.w(this.TAG,"Found another AV1CodecConfigurationRecord!"):(this._hasVideo===!1&&this._hasVideoFlagOverrided===!1&&(this._hasVideo=!0,this._mediaInfo.hasVideo=!0),(l=this._videoMetadata={}).type="video",l.id=p.id,l.timescale=this._timescale,l.duration=this._duration);var v=127&c.getUint8(0);if(c.getUint8(1),c.getUint8(1),c.getUint8(2),v===1){var k=B.parseOBUs(new Uint8Array(o,n+4,i-4));if(k!=null){l.profile=k.profile_string,l.level=k.level_string,l.bitDepth=k.bit_depth,l.chromaFormat=k.chroma_format,l.frameRate=k.frame_rate,k.frame_rate.fixed!==!1&&k.frame_rate.fps_num!==0&&k.frame_rate.fps_den!==0||(l.frameRate=this._referenceFrameRate);var A=l.frameRate.fps_den,U=l.frameRate.fps_num;l.refSampleDuration=l.timescale*(A/U),l.codec=k.codec_mimetype,l.extra=k;var M=this._mediaInfo;M.fps=l.frameRate.fps,M.profile=l.profile,M.level=l.level,M.refFrames=k.ref_frames,M.chromaFormat=k.chroma_format_string,M.videoCodec=k.codec_mimetype,M.hasAudio?M.audioCodec!=null&&(M.mimeType='video/x-flv; codecs="'+M.videoCodec+","+M.audioCodec+'"'):M.mimeType='video/x-flv; codecs="'+M.videoCodec+'"',M.isComplete()&&this._onMediaInfo(M),l.av1c=new Uint8Array(i),l.av1c.set(new Uint8Array(o,n,i),0),u.default.v(this.TAG,"Preparing AV1CodecConfigurationRecord")}else this._onError(E.default.FORMAT_ERROR,"Flv: Invalid AV1CodecConfigurationRecord")}else this._onError(E.default.FORMAT_ERROR,"Flv: Invalid AV1CodecConfigurationRecord")}},r.prototype._parseAVCVideoData=function(o,n,i,l,p,c,v){for(var k=this._littleEndian,A=new DataView(o,n,i),U=[],M=0,O=0,H=this._naluLengthSize,J=this._timestampBase+l,ne=c===1;O<i;){if(O+4>=i){u.default.w(this.TAG,"Malformed Nalu near timestamp ".concat(J,", offset = ").concat(O,", dataSize = ").concat(i));break}var se=A.getUint32(O,!k);if(H===3&&(se>>>=8),se>i-H)return void u.default.w(this.TAG,"Malformed Nalus near timestamp ".concat(J,", NaluSize > DataSize!"));var he=31&A.getUint8(O+H);he===5&&(ne=!0);var Z=new Uint8Array(o,n+O,H+se),oe={type:he,data:Z};U.push(oe),M+=Z.byteLength,he===6&&this._parseSEIPayload(Z.subarray(H),J+v,"h264"),O+=H+se}if(U.length){var we=this._videoTrack,Le={units:U,length:M,isKeyframe:ne,dts:J,cts:v,pts:J+v};ne&&(Le.fileposition=p),we.samples.push(Le),we.length+=M}},r.prototype._parseHEVCVideoData=function(o,n,i,l,p,c,v){for(var k=this._littleEndian,A=new DataView(o,n,i),U=[],M=0,O=0,H=this._naluLengthSize,J=this._timestampBase+l,ne=c===1;O<i;){if(O+4>=i){u.default.w(this.TAG,"Malformed Nalu near timestamp ".concat(J,", offset = ").concat(O,", dataSize = ").concat(i));break}var se=A.getUint32(O,!k);if(H===3&&(se>>>=8),se>i-H)return void u.default.w(this.TAG,"Malformed Nalus near timestamp ".concat(J,", NaluSize > DataSize!"));var he=A.getUint8(O+H)>>1&63;he!==19&&he!==20&&he!==21||(ne=!0);var Z=new Uint8Array(o,n+O,H+se),oe={type:he,data:Z};U.push(oe),M+=Z.byteLength,he!==39&&he!==40||this._parseSEIPayload(Z.subarray(H),J+v,"h265"),O+=H+se}if(U.length){var we=this._videoTrack,Le={units:U,length:M,isKeyframe:ne,dts:J,cts:v,pts:J+v};ne&&(Le.fileposition=p),we.samples.push(Le),we.length+=M}},r.prototype._parseAV1VideoData=function(o,n,i,l,p,c,v){this._littleEndian;var k,A=[],U=this._timestampBase+l,M=c===1;if(M){var O=this._videoMetadata,H=B.parseOBUs(new Uint8Array(o,n,i),O.extra);if(H==null)return void this._onError(E.default.FORMAT_ERROR,"Flv: Invalid AV1 VideoData");console.log(H),O.codecWidth=H.codec_size.width,O.codecHeight=H.codec_size.height,O.presentWidth=H.present_size.width,O.presentHeight=H.present_size.height,O.sarRatio=H.sar_ratio;var J=this._mediaInfo;J.width=O.codecWidth,J.height=O.codecHeight,J.sarNum=O.sarRatio.width,J.sarDen=O.sarRatio.height,u.default.v(this.TAG,"Parsed AV1DecoderConfigurationRecord"),this._isInitialMetadataDispatched()?this._dispatch&&(this._audioTrack.length||this._videoTrack.length)&&this._onDataAvailable(this._audioTrack,this._videoTrack):this._videoInitialMetadataDispatched=!0,this._dispatch=!1,this._onTrackMetadata("video",O)}if(k=i,A.push({unitType:0,data:new Uint8Array(o,n+0,i)}),A.length){var ne=this._videoTrack,se={units:A,length:k,isKeyframe:M,dts:U,cts:v,pts:U+v};M&&(se.fileposition=p),ne.samples.push(se),ne.length+=k}},r}(),ue=ce,pe=function(){function r(){}return r.prototype.destroy=function(){this.onError=null,this.onMediaInfo=null,this.onMetaDataArrived=null,this.onTrackMetadata=null,this.onDataAvailable=null,this.onTimedID3Metadata=null,this.onPGSSubtitleData=null,this.onSynchronousKLVMetadata=null,this.onAsynchronousKLVMetadata=null,this.onSMPTE2038Metadata=null,this.onSEI=null,this.onSCTE35Metadata=null,this.onPESPrivateData=null,this.onPESPrivateDataDescriptor=null},r}(),G=function(){this.program_pmt_pid={}};(function(r){r[r.kMPEG1Audio=3]="kMPEG1Audio",r[r.kMPEG2Audio=4]="kMPEG2Audio",r[r.kPESPrivateData=6]="kPESPrivateData",r[r.kADTSAAC=15]="kADTSAAC",r[r.kLOASAAC=17]="kLOASAAC",r[r.kAC3=129]="kAC3",r[r.kEAC3=135]="kEAC3",r[r.kMetadata=21]="kMetadata",r[r.kSCTE35=134]="kSCTE35",r[r.kPGS=144]="kPGS",r[r.kH264=27]="kH264",r[r.kH265=36]="kH265"})(K||(K={}));var te,ye=function(){this.pid_stream_type={},this.common_pids={h264:void 0,h265:void 0,av1:void 0,adts_aac:void 0,loas_aac:void 0,opus:void 0,ac3:void 0,eac3:void 0,mp3:void 0},this.pes_private_data_pids={},this.timed_id3_pids={},this.pgs_pids={},this.pgs_langs={},this.synchronous_klv_pids={},this.asynchronous_klv_pids={},this.scte_35_pids={},this.smpte2038_pids={}},le=function(){},Ae=function(){},q=function(){this.slices=[],this.total_length=0,this.expected_length=0,this.file_position=0};(function(r){r[r.kUnspecified=0]="kUnspecified",r[r.kSliceNonIDR=1]="kSliceNonIDR",r[r.kSliceDPA=2]="kSliceDPA",r[r.kSliceDPB=3]="kSliceDPB",r[r.kSliceDPC=4]="kSliceDPC",r[r.kSliceIDR=5]="kSliceIDR",r[r.kSliceSEI=6]="kSliceSEI",r[r.kSliceSPS=7]="kSliceSPS",r[r.kSlicePPS=8]="kSlicePPS",r[r.kSliceAUD=9]="kSliceAUD",r[r.kEndOfSequence=10]="kEndOfSequence",r[r.kEndOfStream=11]="kEndOfStream",r[r.kFiller=12]="kFiller",r[r.kSPSExt=13]="kSPSExt",r[r.kReserved0=14]="kReserved0"})(te||(te={}));var R,W,ae=function(){},Se=function(r){var o=r.data.byteLength;this.type=r.type,this.data=new Uint8Array(4+o),new DataView(this.data.buffer).setUint32(0,o),this.data.set(r.data,4)},_e=function(){function r(o){this.TAG="H264AnnexBParser",this.current_startcode_offset_=0,this.eof_flag_=!1,this.data_=o,this.current_startcode_offset_=this.findNextStartCodeOffset(0),this.eof_flag_&&u.default.e(this.TAG,"Could not find H264 startcode until payload end!")}return r.prototype.findNextStartCodeOffset=function(o){for(var n=o,i=this.data_;;){if(n+3>=i.byteLength)return this.eof_flag_=!0,i.byteLength;var l=i[n+0]<<24|i[n+1]<<16|i[n+2]<<8|i[n+3],p=i[n+0]<<16|i[n+1]<<8|i[n+2];if(l===1||p===1)return n;n++}},r.prototype.readNextNaluPayload=function(){for(var o=this.data_,n=null;n==null&&!this.eof_flag_;){var i=this.current_startcode_offset_,l=31&o[i+=(o[i]<<24|o[i+1]<<16|o[i+2]<<8|o[i+3])==1?4:3],p=(128&o[i])>>>7,c=this.findNextStartCodeOffset(i);if(this.current_startcode_offset_=c,!(l>=te.kReserved0)&&p===0){var v=o.subarray(i,c);(n=new ae).type=l,n.data=v}}return n},r}(),ee=function(){function r(o,n,i){var l=8+o.byteLength+1+2+n.byteLength,p=!1;o[3]!==66&&o[3]!==77&&o[3]!==88&&(p=!0,l+=4);var c=this.data=new Uint8Array(l);c[0]=1,c[1]=o[1],c[2]=o[2],c[3]=o[3],c[4]=255,c[5]=225;var v=o.byteLength;c[6]=v>>>8,c[7]=255&v;var k=8;c.set(o,8),c[k+=v]=1;var A=n.byteLength;c[k+1]=A>>>8,c[k+2]=255&A,c.set(n,k+3),k+=3+A,p&&(c[k]=252|i.chroma_format_idc,c[k+1]=248|i.bit_depth_luma-8,c[k+2]=248|i.bit_depth_chroma-8,c[k+3]=0,k+=4)}return r.prototype.getData=function(){return this.data},r}();(function(r){r[r.kNull=0]="kNull",r[r.kAACMain=1]="kAACMain",r[r.kAAC_LC=2]="kAAC_LC",r[r.kAAC_SSR=3]="kAAC_SSR",r[r.kAAC_LTP=4]="kAAC_LTP",r[r.kAAC_SBR=5]="kAAC_SBR",r[r.kAAC_Scalable=6]="kAAC_Scalable",r[r.kLayer1=32]="kLayer1",r[r.kLayer2=33]="kLayer2",r[r.kLayer3=34]="kLayer3"})(R||(R={})),function(r){r[r.k96000Hz=0]="k96000Hz",r[r.k88200Hz=1]="k88200Hz",r[r.k64000Hz=2]="k64000Hz",r[r.k48000Hz=3]="k48000Hz",r[r.k44100Hz=4]="k44100Hz",r[r.k32000Hz=5]="k32000Hz",r[r.k24000Hz=6]="k24000Hz",r[r.k22050Hz=7]="k22050Hz",r[r.k16000Hz=8]="k16000Hz",r[r.k12000Hz=9]="k12000Hz",r[r.k11025Hz=10]="k11025Hz",r[r.k8000Hz=11]="k8000Hz",r[r.k7350Hz=12]="k7350Hz"}(W||(W={}));var de,fe,ve=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350],be=(de=function(r,o){return de=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,i){n.__proto__=i}||function(n,i){for(var l in i)Object.prototype.hasOwnProperty.call(i,l)&&(n[l]=i[l])},de(r,o)},function(r,o){if(typeof o!="function"&&o!==null)throw new TypeError("Class extends value "+String(o)+" is not a constructor or null");function n(){this.constructor=r}de(r,o),r.prototype=o===null?Object.create(o):(n.prototype=o.prototype,new n)}),Re=function(){},Je=function(r){function o(){return r!==null&&r.apply(this,arguments)||this}return be(o,r),o}(Re),st=function(){function r(o){this.TAG="AACADTSParser",this.data_=o,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&u.default.e(this.TAG,"Could not found ADTS syncword until payload end")}return r.prototype.findNextSyncwordOffset=function(o){for(var n=o,i=this.data_;;){if(n+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[n+0]<<8|i[n+1])>>>4==4095)return n;n++}},r.prototype.readNextAACFrame=function(){for(var o=this.data_,n=null;n==null&&!this.eof_flag_;){var i=this.current_syncword_offset_,l=(8&o[i+1])>>>3,p=(6&o[i+1])>>>1,c=1&o[i+1],v=(192&o[i+2])>>>6,k=(60&o[i+2])>>>2,A=(1&o[i+2])<<2|(192&o[i+3])>>>6,U=(3&o[i+3])<<11|o[i+4]<<3|(224&o[i+5])>>>5;if(o[i+6],i+U>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}var M=c===1?7:9,O=U-M;i+=M;var H=this.findNextSyncwordOffset(i+O);if(this.current_syncword_offset_=H,(l===0||l===1)&&p===0){var J=o.subarray(i,i+O);(n=new Re).audio_object_type=v+1,n.sampling_freq_index=k,n.sampling_frequency=ve[k],n.channel_config=A,n.data=J}}return n},r.prototype.hasIncompleteData=function(){return this.has_last_incomplete_data},r.prototype.getIncompleteData=function(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null},r}(),Tt=function(){function r(o){this.TAG="AACLOASParser",this.data_=o,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&u.default.e(this.TAG,"Could not found LOAS syncword until payload end")}return r.prototype.findNextSyncwordOffset=function(o){for(var n=o,i=this.data_;;){if(n+1>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[n+0]<<3|i[n+1]>>>5)==695)return n;n++}},r.prototype.getLATMValue=function(o){for(var n=o.readBits(2),i=0,l=0;l<=n;l++)i<<=8,i|=o.readByte();return i},r.prototype.readNextAACFrame=function(o){for(var n=this.data_,i=null;i==null&&!this.eof_flag_;){var l=this.current_syncword_offset_,p=(31&n[l+1])<<8|n[l+2];if(l+3+p>=this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}var c=new D(n.subarray(l+3,l+3+p)),v=null;if(c.readBool()){if(o==null){u.default.w(this.TAG,"StreamMuxConfig Missing"),this.current_syncword_offset_=this.findNextSyncwordOffset(l+3+p),c.destroy();continue}v=o}else{var k=c.readBool();if(k&&c.readBool()){u.default.e(this.TAG,"audioMuxVersionA is Not Supported"),c.destroy();break}if(k&&this.getLATMValue(c),!c.readBool()){u.default.e(this.TAG,"allStreamsSameTimeFraming zero is Not Supported"),c.destroy();break}if(c.readBits(6)!==0){u.default.e(this.TAG,"more than 2 numSubFrames Not Supported"),c.destroy();break}if(c.readBits(4)!==0){u.default.e(this.TAG,"more than 2 numProgram Not Supported"),c.destroy();break}if(c.readBits(3)!==0){u.default.e(this.TAG,"more than 2 numLayer Not Supported"),c.destroy();break}var A=k?this.getLATMValue(c):0,U=c.readBits(5);A-=5;var M=c.readBits(4);A-=4;var O=c.readBits(4);A-=4,c.readBits(3),(A-=3)>0&&c.readBits(A);var H=c.readBits(3);if(H!==0){u.default.e(this.TAG,"frameLengthType = ".concat(H,". Only frameLengthType = 0 Supported")),c.destroy();break}c.readByte();var J=c.readBool();if(J)if(k)this.getLATMValue(c);else{for(var ne=0;;){ne<<=8;var se=c.readBool();if(ne+=c.readByte(),!se)break}console.log(ne)}c.readBool()&&c.readByte(),(v=new Je).audio_object_type=U,v.sampling_freq_index=M,v.sampling_frequency=ve[v.sampling_freq_index],v.channel_config=O,v.other_data_present=J}for(var he=0;;){var Z=c.readByte();if(he+=Z,Z!==255)break}for(var oe=new Uint8Array(he),we=0;we<he;we++)oe[we]=c.readByte();(i=new Je).audio_object_type=v.audio_object_type,i.sampling_freq_index=v.sampling_freq_index,i.sampling_frequency=ve[v.sampling_freq_index],i.channel_config=v.channel_config,i.other_data_present=v.other_data_present,i.data=oe,this.current_syncword_offset_=this.findNextSyncwordOffset(l+3+p)}return i},r.prototype.hasIncompleteData=function(){return this.has_last_incomplete_data},r.prototype.getIncompleteData=function(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null},r}(),vt=function(r){var o=null,n=r.audio_object_type,i=r.audio_object_type,l=r.sampling_freq_index,p=r.channel_config,c=0,v=navigator.userAgent.toLowerCase();v.indexOf("firefox")!==-1?l>=6?(i=5,o=new Array(4),c=l-3):(i=2,o=new Array(2),c=l):v.indexOf("android")!==-1?(i=2,o=new Array(2),c=l):(i=5,c=l,o=new Array(4),l>=6?c=l-3:p===1&&(i=2,o=new Array(2),c=l)),o[0]=i<<3,o[0]|=(15&l)>>>1,o[1]=(15&l)<<7,o[1]|=(15&p)<<3,i===5&&(o[1]|=(15&c)>>>1,o[2]=(1&c)<<7,o[2]|=8,o[3]=0),this.config=o,this.sampling_rate=ve[l],this.channel_count=p,this.codec_mimetype="mp4a.40."+i,this.original_codec_mimetype="mp4a.40."+n},wi=function(){},un=function(){};(function(r){r[r.kSpliceNull=0]="kSpliceNull",r[r.kSpliceSchedule=4]="kSpliceSchedule",r[r.kSpliceInsert=5]="kSpliceInsert",r[r.kTimeSignal=6]="kTimeSignal",r[r.kBandwidthReservation=7]="kBandwidthReservation",r[r.kPrivateCommand=255]="kPrivateCommand"})(fe||(fe={}));var lt,Si=function(r){var o=r.readBool();return o?(r.readBits(6),{time_specified_flag:o,pts_time:4*r.readBits(31)+r.readBits(2)}):(r.readBits(7),{time_specified_flag:o})},Hn=function(r){var o=r.readBool();return r.readBits(6),{auto_return:o,duration:4*r.readBits(31)+r.readBits(2)}},Ua=function(r,o){var n=o.readBits(8);return r?{component_tag:n}:{component_tag:n,splice_time:Si(o)}},Na=function(r){return{component_tag:r.readBits(8),utc_splice_time:r.readBits(32)}},za=function(r){var o=r.readBits(32),n=r.readBool();r.readBits(7);var i={splice_event_id:o,splice_event_cancel_indicator:n};if(n)return i;if(i.out_of_network_indicator=r.readBool(),i.program_splice_flag=r.readBool(),i.duration_flag=r.readBool(),r.readBits(5),i.program_splice_flag)i.utc_splice_time=r.readBits(32);else{i.component_count=r.readBits(8),i.components=[];for(var l=0;l<i.component_count;l++)i.components.push(Na(r))}return i.duration_flag&&(i.break_duration=Hn(r)),i.unique_program_id=r.readBits(16),i.avail_num=r.readBits(8),i.avails_expected=r.readBits(8),i},Va=function(r,o,n,i){return{descriptor_tag:r,descriptor_length:o,identifier:n,provider_avail_id:i.readBits(32)}},Fa=function(r,o,n,i){var l=i.readBits(8),p=i.readBits(3);i.readBits(5);for(var c="",v=0;v<p;v++)c+=String.fromCharCode(i.readBits(8));return{descriptor_tag:r,descriptor_length:o,identifier:n,preroll:l,dtmf_count:p,DTMF_char:c}},Ha=function(r){var o=r.readBits(8);return r.readBits(7),{component_tag:o,pts_offset:4*r.readBits(31)+r.readBits(2)}},ja=function(r,o,n,i){var l=i.readBits(32),p=i.readBool();i.readBits(7);var c={descriptor_tag:r,descriptor_length:o,identifier:n,segmentation_event_id:l,segmentation_event_cancel_indicator:p};if(p)return c;if(c.program_segmentation_flag=i.readBool(),c.segmentation_duration_flag=i.readBool(),c.delivery_not_restricted_flag=i.readBool(),c.delivery_not_restricted_flag?i.readBits(5):(c.web_delivery_allowed_flag=i.readBool(),c.no_regional_blackout_flag=i.readBool(),c.archive_allowed_flag=i.readBool(),c.device_restrictions=i.readBits(2)),!c.program_segmentation_flag){c.component_count=i.readBits(8),c.components=[];for(var v=0;v<c.component_count;v++)c.components.push(Ha(i))}c.segmentation_duration_flag&&(c.segmentation_duration=i.readBits(40)),c.segmentation_upid_type=i.readBits(8),c.segmentation_upid_length=i.readBits(8);var k=new Uint8Array(c.segmentation_upid_length);for(v=0;v<c.segmentation_upid_length;v++)k[v]=i.readBits(8);return c.segmentation_upid=k.buffer,c.segmentation_type_id=i.readBits(8),c.segment_num=i.readBits(8),c.segments_expected=i.readBits(8),c.segmentation_type_id!==52&&c.segmentation_type_id!==54&&c.segmentation_type_id!==56&&c.segmentation_type_id!==58||(c.sub_segment_num=i.readBits(8),c.sub_segments_expected=i.readBits(8)),c},Ga=function(r,o,n,i){return{descriptor_tag:r,descriptor_length:o,identifier:n,TAI_seconds:i.readBits(48),TAI_ns:i.readBits(32),UTC_offset:i.readBits(16)}},qa=function(r){return{component_tag:r.readBits(8),ISO_code:String.fromCharCode(r.readBits(8),r.readBits(8),r.readBits(8)),Bit_Stream_Mode:r.readBits(3),Num_Channels:r.readBits(4),Full_Srvc_Audio:r.readBool()}},Wa=function(r,o,n,i){for(var l=i.readBits(4),p=[],c=0;c<l;c++)p.push(qa(i));return{descriptor_tag:r,descriptor_length:o,identifier:n,audio_count:l,components:p}};(function(r){r[r.kSliceIDR_W_RADL=19]="kSliceIDR_W_RADL",r[r.kSliceIDR_N_LP=20]="kSliceIDR_N_LP",r[r.kSliceCRA_NUT=21]="kSliceCRA_NUT",r[r.kSliceVPS=32]="kSliceVPS",r[r.kSliceSPS=33]="kSliceSPS",r[r.kSlicePPS=34]="kSlicePPS",r[r.kSliceAUD=35]="kSliceAUD",r[r.kSliceSEI=39]="kSliceSEI",r[r.kSliceSEISuffix=40]="kSliceSEISuffix"})(lt||(lt={}));var Ka=function(){},Ya=function(r){var o=r.data.byteLength;this.type=r.type,this.data=new Uint8Array(4+o),new DataView(this.data.buffer).setUint32(0,o),this.data.set(r.data,4)},Ja=function(){function r(o){this.TAG="H265AnnexBParser",this.current_startcode_offset_=0,this.eof_flag_=!1,this.data_=o,this.current_startcode_offset_=this.findNextStartCodeOffset(0),this.eof_flag_&&u.default.e(this.TAG,"Could not find H265 startcode until payload end!")}return r.prototype.findNextStartCodeOffset=function(o){for(var n=o,i=this.data_;;){if(n+3>=i.byteLength)return this.eof_flag_=!0,i.byteLength;var l=i[n+0]<<24|i[n+1]<<16|i[n+2]<<8|i[n+3],p=i[n+0]<<16|i[n+1]<<8|i[n+2];if(l===1||p===1)return n;n++}},r.prototype.readNextNaluPayload=function(){for(var o=this.data_,n=null;n==null&&!this.eof_flag_;){var i=this.current_startcode_offset_,l=o[i+=(o[i]<<24|o[i+1]<<16|o[i+2]<<8|o[i+3])==1?4:3]>>1&63,p=(128&o[i])>>>7,c=this.findNextStartCodeOffset(i);if(this.current_startcode_offset_=c,p===0){var v=o.subarray(i,c);(n=new Ka).type=l,n.data=v}}return n},r}(),Xa=function(){function r(o,n,i,l){var p=23+(5+o.byteLength)+(5+n.byteLength)+(5+i.byteLength),c=this.data=new Uint8Array(p);c[0]=1,c[1]=(3&l.general_profile_space)<<6|(l.general_tier_flag?1:0)<<5|31&l.general_profile_idc,c[2]=l.general_profile_compatibility_flags_1,c[3]=l.general_profile_compatibility_flags_2,c[4]=l.general_profile_compatibility_flags_3,c[5]=l.general_profile_compatibility_flags_4,c[6]=l.general_constraint_indicator_flags_1,c[7]=l.general_constraint_indicator_flags_2,c[8]=l.general_constraint_indicator_flags_3,c[9]=l.general_constraint_indicator_flags_4,c[10]=l.general_constraint_indicator_flags_5,c[11]=l.general_constraint_indicator_flags_6,c[12]=l.general_level_idc,c[13]=240|(3840&l.min_spatial_segmentation_idc)>>8,c[14]=255&l.min_spatial_segmentation_idc,c[15]=252|3&l.parallelismType,c[16]=252|3&l.chroma_format_idc,c[17]=248|7&l.bit_depth_luma_minus8,c[18]=248|7&l.bit_depth_chroma_minus8,c[19]=0,c[20]=0,c[21]=(3&l.constant_frame_rate)<<6|(7&l.num_temporal_layers)<<3|(l.temporal_id_nested?1:0)<<2|3,c[22]=3,c[23]=128|lt.kSliceVPS,c[24]=0,c[25]=1,c[26]=(65280&o.byteLength)>>8,c[27]=255&o.byteLength,c.set(o,28),c[23+(5+o.byteLength)+0]=128|lt.kSliceSPS,c[23+(5+o.byteLength)+1]=0,c[23+(5+o.byteLength)+2]=1,c[23+(5+o.byteLength)+3]=(65280&n.byteLength)>>8,c[23+(5+o.byteLength)+4]=255&n.byteLength,c.set(n,23+(5+o.byteLength)+5),c[23+(5+o.byteLength+5+n.byteLength)+0]=128|lt.kSlicePPS,c[23+(5+o.byteLength+5+n.byteLength)+1]=0,c[23+(5+o.byteLength+5+n.byteLength)+2]=1,c[23+(5+o.byteLength+5+n.byteLength)+3]=(65280&i.byteLength)>>8,c[23+(5+o.byteLength+5+n.byteLength)+4]=255&i.byteLength,c.set(i,23+(5+o.byteLength+5+n.byteLength)+5)}return r.prototype.getData=function(){return this.data},r}(),Qa=function(){},Za=function(){},eo=function(){},to=[[64,64,80,80,96,96,112,112,128,128,160,160,192,192,224,224,256,256,320,320,384,384,448,448,512,512,640,640,768,768,896,896,1024,1024,1152,1152,1280,1280],[69,70,87,88,104,105,121,122,139,140,174,175,208,209,243,244,278,279,348,349,417,418,487,488,557,558,696,697,835,836,975,976,1114,1115,1253,1254,1393,1394],[96,96,120,120,144,144,168,168,192,192,240,240,288,288,336,336,384,384,480,480,576,576,672,672,768,768,960,960,1152,1152,1344,1344,1536,1536,1728,1728,1920,1920]],io=function(){function r(o){this.TAG="AC3Parser",this.data_=o,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&u.default.e(this.TAG,"Could not found AC3 syncword until payload end")}return r.prototype.findNextSyncwordOffset=function(o){for(var n=o,i=this.data_;;){if(n+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[n+0]<<8|i[n+1])==2935)return n;n++}},r.prototype.readNextAC3Frame=function(){for(var o=this.data_,n=null;n==null&&!this.eof_flag_;){var i=this.current_syncword_offset_,l=o[i+4]>>6,p=[48e3,44200,33e3][l],c=63&o[i+4],v=2*to[l][c];if(isNaN(v)||i+v>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}var k=this.findNextSyncwordOffset(i+v);this.current_syncword_offset_=k;var A=o[i+5]>>3,U=7&o[i+5],M=o[i+6]>>5,O=0;1&M&&M!==1&&(O+=2),4&M&&(O+=2),M===2&&(O+=2);var H=(o[i+6]<<8|o[i+7])>>12-O&1,J=[2,1,2,3,3,4,4,5][M]+H;(n=new eo).sampling_frequency=p,n.channel_count=J,n.channel_mode=M,n.bit_stream_identification=A,n.low_frequency_effects_channel_on=H,n.bit_stream_mode=U,n.frame_size_code=c,n.data=o.subarray(i,i+v)}return n},r.prototype.hasIncompleteData=function(){return this.has_last_incomplete_data},r.prototype.getIncompleteData=function(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null},r}(),no=function(r){var o;o=[r.sampling_rate_code<<6|r.bit_stream_identification<<1|r.bit_stream_mode>>2,(3&r.bit_stream_mode)<<6|r.channel_mode<<3|r.low_frequency_effects_channel_on<<2|r.frame_size_code>>4,r.frame_size_code<<4&224],this.config=o,this.sampling_rate=r.sampling_frequency,this.bit_stream_identification=r.bit_stream_identification,this.bit_stream_mode=r.bit_stream_mode,this.low_frequency_effects_channel_on=r.low_frequency_effects_channel_on,this.channel_count=r.channel_count,this.channel_mode=r.channel_mode,this.codec_mimetype="ac-3",this.original_codec_mimetype="ac-3"},ao=function(){},oo=function(){function r(o){this.TAG="EAC3Parser",this.data_=o,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&u.default.e(this.TAG,"Could not found AC3 syncword until payload end")}return r.prototype.findNextSyncwordOffset=function(o){for(var n=o,i=this.data_;;){if(n+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[n+0]<<8|i[n+1])==2935)return n;n++}},r.prototype.readNextEAC3Frame=function(){for(var o=this.data_,n=null;n==null&&!this.eof_flag_;){var i=this.current_syncword_offset_,l=new D(o.subarray(i+2)),p=(l.readBits(2),l.readBits(3),l.readBits(11)+1<<1),c=l.readBits(2),v=null,k=null;c===3?(v=[24e3,22060,16e3][c=l.readBits(2)],k=3):(v=[48e3,44100,32e3][c],k=l.readBits(2));var A=l.readBits(3),U=l.readBits(1),M=l.readBits(5);if(i+p>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}var O=this.findNextSyncwordOffset(i+p);this.current_syncword_offset_=O;var H=[2,1,2,3,3,4,4,5][A]+U;l.destroy(),(n=new ao).sampling_frequency=v,n.channel_count=H,n.channel_mode=A,n.bit_stream_identification=M,n.low_frequency_effects_channel_on=U,n.frame_size=p,n.num_blks=[1,2,3,6][k],n.data=o.subarray(i,i+p)}return n},r.prototype.hasIncompleteData=function(){return this.has_last_incomplete_data},r.prototype.getIncompleteData=function(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null},r}(),ro=function(r){var o,n=Math.floor(r.frame_size*r.sampling_frequency/(16*r.num_blks));o=[255&n,248&n,r.sampling_rate_code<<6|r.bit_stream_identification<<1,r.channel_mode<<1|r.low_frequency_effects_channel_on,0],this.config=o,this.sampling_rate=r.sampling_frequency,this.bit_stream_identification=r.bit_stream_identification,this.num_blks=r.num_blks,this.low_frequency_effects_channel_on=r.low_frequency_effects_channel_on,this.channel_count=r.channel_count,this.channel_mode=r.channel_mode,this.codec_mimetype="ec-3",this.original_codec_mimetype="ec-3"},so=function(){},lo=function(){function r(o){this.TAG="AV1OBUInMpegTsParser",this.current_startcode_offset_=0,this.eof_flag_=!1,this.data_=o,this.current_startcode_offset_=this.findNextStartCodeOffset(0),this.eof_flag_&&u.default.e(this.TAG,"Could not find AV1 startcode until payload end!")}return r._ebsp2rbsp=function(o){for(var n=o,i=n.byteLength,l=new Uint8Array(i),p=0,c=0;c<i;c++)c>=2&&n[c]===3&&n[c-1]===0&&n[c-2]===0||(l[p]=n[c],p++);return new Uint8Array(l.buffer,0,p)},r.prototype.findNextStartCodeOffset=function(o){for(var n=o,i=this.data_;;){if(n+2>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[n+0]<<16|i[n+1]<<8|i[n+2])==1)return n;n++}},r.prototype.readNextOBUPayload=function(){for(var o=this.data_,n=null;n==null&&!this.eof_flag_;){var i=this.current_startcode_offset_+3,l=this.findNextStartCodeOffset(i);this.current_startcode_offset_=l,n=r._ebsp2rbsp(o.subarray(i,l))}return n},r}(),co=function(){},uo=function(){var r=function(o,n){return r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(i,l){i.__proto__=l}||function(i,l){for(var p in l)Object.prototype.hasOwnProperty.call(l,p)&&(i[p]=l[p])},r(o,n)};return function(o,n){if(typeof n!="function"&&n!==null)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function i(){this.constructor=o}r(o,n),o.prototype=n===null?Object.create(n):(i.prototype=n.prototype,new i)}}(),Ht=function(){return Ht=Object.assign||function(r){for(var o,n=1,i=arguments.length;n<i;n++)for(var l in o=arguments[n])Object.prototype.hasOwnProperty.call(o,l)&&(r[l]=o[l]);return r},Ht.apply(this,arguments)},po=function(r){function o(n,i){var l=r.call(this)||this;return l.TAG="TSDemuxer",l.first_parse_=!0,l.media_info_=new m.default,l.timescale_=90,l.duration_=0,l.current_pmt_pid_=-1,l.program_pmt_map_={},l.pes_slice_queues_={},l.section_slice_queues_={},l.video_metadata_={vps:void 0,sps:void 0,pps:void 0,av1c:void 0,details:void 0},l.audio_metadata_={codec:void 0,audio_object_type:void 0,sampling_freq_index:void 0,sampling_frequency:void 0,channel_config:void 0},l.last_pcr_base_=NaN,l.timestamp_offset_=0,l.audio_last_sample_pts_=void 0,l.aac_last_incomplete_data_=null,l.has_video_=!1,l.has_audio_=!1,l.video_init_segment_dispatched_=!1,l.audio_init_segment_dispatched_=!1,l.video_metadata_changed_=!1,l.audio_metadata_changed_=!1,l.loas_previous_frame=null,l.video_track_={type:"video",id:1,sequenceNumber:0,samples:[],length:0},l.audio_track_={type:"audio",id:2,sequenceNumber:0,samples:[],length:0},l.ts_packet_size_=n.ts_packet_size,l.sync_offset_=n.sync_offset,l.config_=i,l}return uo(o,r),o.prototype.destroy=function(){this.media_info_=null,this.pes_slice_queues_=null,this.section_slice_queues_=null,this.video_metadata_=null,this.audio_metadata_=null,this.aac_last_incomplete_data_=null,this.video_track_=null,this.audio_track_=null,r.prototype.destroy.call(this)},o.probe=function(n){var i=new Uint8Array(n),l=-1,p=188;if(i.byteLength<=3*p)return{needMoreData:!0};for(;l===-1;){for(var c=Math.min(1e3,i.byteLength-3*p),v=0;v<c;){if(i[v]===71&&i[v+p]===71&&i[v+2*p]===71){l=v;break}v++}if(l===-1)if(p===188)p=192;else{if(p!==192)break;p=204}}return l===-1?{match:!1}:(p===192&&l>=4?(u.default.v("TSDemuxer","ts_packet_size = 192, m2ts mode"),l-=4):p===204&&u.default.v("TSDemuxer","ts_packet_size = 204, RS encoded MPEG2-TS stream"),{match:!0,consumed:0,ts_packet_size:p,sync_offset:l})},o.prototype.bindDataSource=function(n){return n.onDataArrival=this.parseChunks.bind(this),this},o.prototype.resetMediaInfo=function(){this.media_info_=new m.default},o.prototype.parseChunks=function(n,i){if(!(this.onError&&this.onMediaInfo&&this.onTrackMetadata&&this.onDataAvailable))throw new P.IllegalStateException("onError & onMediaInfo & onTrackMetadata & onDataAvailable callback must be specified");var l=0;for(this.first_parse_&&(this.first_parse_=!1,l=this.sync_offset_);l+this.ts_packet_size_<=n.byteLength;){var p=i+l;this.ts_packet_size_===192&&(l+=4);var c=new Uint8Array(n,l,188),v=c[0];if(v!==71){u.default.e(this.TAG,"sync_byte = ".concat(v,", not 0x47"));break}var k=(64&c[1])>>>6,A=(c[1],(31&c[1])<<8|c[2]),U=(48&c[3])>>>4,M=15&c[3],O=!(!this.pmt_||this.pmt_.pcr_pid!==A),H={},J=4;if(U==2||U==3){var ne=c[4];if(ne>0&&(O||U==3)&&(H.discontinuity_indicator=(128&c[5])>>>7,H.random_access_indicator=(64&c[5])>>>6,H.elementary_stream_priority_indicator=(32&c[5])>>>5,(16&c[5])>>>4)){var se=300*this.getPcrBase(c)+((1&c[10])<<8|c[11]);this.last_pcr_=se}if(U==2||5+ne===188){l+=188,this.ts_packet_size_===204&&(l+=16);continue}J=5+ne}if(U==1||U==3){if(A===0||A===this.current_pmt_pid_||this.pmt_!=null&&this.pmt_.pid_stream_type[A]===K.kSCTE35){var he=188-J;this.handleSectionSlice(n,l+J,he,{pid:A,file_position:p,payload_unit_start_indicator:k,continuity_conunter:M,random_access_indicator:H.random_access_indicator})}else if(this.pmt_!=null&&this.pmt_.pid_stream_type[A]!=null){he=188-J;var Z=this.pmt_.pid_stream_type[A];A!==this.pmt_.common_pids.h264&&A!==this.pmt_.common_pids.h265&&A!==this.pmt_.common_pids.av1&&A!==this.pmt_.common_pids.adts_aac&&A!==this.pmt_.common_pids.loas_aac&&A!==this.pmt_.common_pids.ac3&&A!==this.pmt_.common_pids.eac3&&A!==this.pmt_.common_pids.opus&&A!==this.pmt_.common_pids.mp3&&this.pmt_.pes_private_data_pids[A]!==!0&&this.pmt_.timed_id3_pids[A]!==!0&&this.pmt_.pgs_pids[A]!==!0&&this.pmt_.synchronous_klv_pids[A]!==!0&&this.pmt_.asynchronous_klv_pids[A]!==!0||this.handlePESSlice(n,l+J,he,{pid:A,stream_type:Z,file_position:p,payload_unit_start_indicator:k,continuity_conunter:M,random_access_indicator:H.random_access_indicator})}}l+=188,this.ts_packet_size_===204&&(l+=16)}return this.dispatchAudioVideoMediaSegment(),l},o.prototype.handleSectionSlice=function(n,i,l,p){var c=new Uint8Array(n,i,l),v=this.section_slice_queues_[p.pid];if(p.payload_unit_start_indicator){var k=c[0];if(v!=null&&v.total_length!==0){var A=new Uint8Array(n,i+1,Math.min(l,k));v.slices.push(A),v.total_length+=A.byteLength,v.total_length===v.expected_length?this.emitSectionSlices(v,p):this.clearSlices(v,p)}for(var U=1+k;U<c.byteLength&&c[U+0]!==255;){var M=(15&c[U+1])<<8|c[U+2];this.section_slice_queues_[p.pid]=new q,(v=this.section_slice_queues_[p.pid]).expected_length=M+3,v.file_position=p.file_position,v.random_access_indicator=p.random_access_indicator,A=new Uint8Array(n,i+U,Math.min(l-U,v.expected_length-v.total_length)),v.slices.push(A),v.total_length+=A.byteLength,v.total_length===v.expected_length?this.emitSectionSlices(v,p):v.total_length>=v.expected_length&&this.clearSlices(v,p),U+=A.byteLength}}else v!=null&&v.total_length!==0&&(A=new Uint8Array(n,i,Math.min(l,v.expected_length-v.total_length)),v.slices.push(A),v.total_length+=A.byteLength,v.total_length===v.expected_length?this.emitSectionSlices(v,p):v.total_length>=v.expected_length&&this.clearSlices(v,p))},o.prototype.handlePESSlice=function(n,i,l,p){var c=new Uint8Array(n,i,l),v=c[0]<<16|c[1]<<8|c[2],k=(c[3],c[4]<<8|c[5]);if(p.payload_unit_start_indicator){if(v!==1)return void u.default.e(this.TAG,"handlePESSlice: packet_start_code_prefix should be 1 but with value ".concat(v));var A=this.pes_slice_queues_[p.pid];A&&(A.expected_length===0||A.expected_length===A.total_length?this.emitPESSlices(A,p):this.clearSlices(A,p)),this.pes_slice_queues_[p.pid]=new q,this.pes_slice_queues_[p.pid].file_position=p.file_position,this.pes_slice_queues_[p.pid].random_access_indicator=p.random_access_indicator}if(this.pes_slice_queues_[p.pid]!=null){var U=this.pes_slice_queues_[p.pid];U.slices.push(c),p.payload_unit_start_indicator&&(U.expected_length=k===0?0:k+6),U.total_length+=c.byteLength,U.expected_length>0&&U.expected_length===U.total_length?this.emitPESSlices(U,p):U.expected_length>0&&U.expected_length<U.total_length&&this.clearSlices(U,p)}},o.prototype.emitSectionSlices=function(n,i){for(var l=new Uint8Array(n.total_length),p=0,c=0;p<n.slices.length;p++){var v=n.slices[p];l.set(v,c),c+=v.byteLength}n.slices=[],n.expected_length=-1,n.total_length=0;var k=new Ae;k.pid=i.pid,k.data=l,k.file_position=n.file_position,k.random_access_indicator=n.random_access_indicator,this.parseSection(k)},o.prototype.emitPESSlices=function(n,i){for(var l=new Uint8Array(n.total_length),p=0,c=0;p<n.slices.length;p++){var v=n.slices[p];l.set(v,c),c+=v.byteLength}n.slices=[],n.expected_length=-1,n.total_length=0;var k=new le;k.pid=i.pid,k.data=l,k.stream_type=i.stream_type,k.file_position=n.file_position,k.random_access_indicator=n.random_access_indicator,this.parsePES(k)},o.prototype.clearSlices=function(n,i){n.slices=[],n.expected_length=-1,n.total_length=0},o.prototype.parseSection=function(n){var i=n.data,l=n.pid;l===0?this.parsePAT(i):l===this.current_pmt_pid_?this.parsePMT(i):this.pmt_!=null&&this.pmt_.scte_35_pids[l]&&this.parseSCTE35(i)},o.prototype.parsePES=function(n){var i=n.data,l=i[0]<<16|i[1]<<8|i[2],p=i[3],c=i[4]<<8|i[5];if(l===1)if(p!==188&&p!==190&&p!==191&&p!==240&&p!==241&&p!==255&&p!==242&&p!==248){i[6];var v=(192&i[7])>>>6,k=i[8],A=void 0,U=void 0;v!==2&&v!==3||(A=this.getTimestamp(i,9),U=v===3?this.getTimestamp(i,14):A);var M=9+k,O=void 0;if(c!==0){if(c<3+k)return void u.default.v(this.TAG,"Malformed PES: PES_packet_length < 3 + PES_header_data_length");O=c-3-k}else O=i.byteLength-M;var H=i.subarray(M,M+O);switch(n.stream_type){case K.kMPEG1Audio:case K.kMPEG2Audio:this.parseMP3Payload(H,A);break;case K.kPESPrivateData:this.pmt_.common_pids.av1===n.pid?this.parseAV1Payload(H,A,U,n.file_position,n.random_access_indicator):this.pmt_.common_pids.opus===n.pid?this.parseOpusPayload(H,A):this.pmt_.common_pids.ac3===n.pid?this.parseAC3Payload(H,A):this.pmt_.common_pids.eac3===n.pid?this.parseEAC3Payload(H,A):this.pmt_.asynchronous_klv_pids[n.pid]?this.parseAsynchronousKLVMetadataPayload(H,n.pid,p):this.pmt_.smpte2038_pids[n.pid]?this.parseSMPTE2038MetadataPayload(H,A,U,n.pid,p):this.parsePESPrivateDataPayload(H,A,U,n.pid,p);break;case K.kADTSAAC:this.parseADTSAACPayload(H,A);break;case K.kLOASAAC:this.parseLOASAACPayload(H,A);break;case K.kAC3:this.parseAC3Payload(H,A);break;case K.kEAC3:this.parseEAC3Payload(H,A);break;case K.kMetadata:this.pmt_.timed_id3_pids[n.pid]?this.parseTimedID3MetadataPayload(H,A,U,n.pid,p):this.pmt_.synchronous_klv_pids[n.pid]&&this.parseSynchronousKLVMetadataPayload(H,A,U,n.pid,p);break;case K.kPGS:this.parsePGSPayload(H,A,U,n.pid,p,this.pmt_.pgs_langs[n.pid]);break;case K.kH264:this.parseH264Payload(H,A,U,n.file_position,n.random_access_indicator);break;case K.kH265:this.parseH265Payload(H,A,U,n.file_position,n.random_access_indicator)}}else p!==188&&p!==191&&p!==240&&p!==241&&p!==255&&p!==242&&p!==248||n.stream_type!==K.kPESPrivateData||(M=6,O=void 0,O=c!==0?c:i.byteLength-M,H=i.subarray(M,M+O),this.parsePESPrivateDataPayload(H,void 0,void 0,n.pid,p));else u.default.e(this.TAG,"parsePES: packet_start_code_prefix should be 1 but with value ".concat(l))},o.prototype.parsePAT=function(n){var i=n[0];if(i===0){var l=(15&n[1])<<8|n[2],p=(n[3],n[4],(62&n[5])>>>1),c=1&n[5],v=n[6],k=(n[7],null);if(c===1&&v===0)(k=new G).version_number=p;else if((k=this.pat_)==null)return;for(var A=l-5-4,U=-1,M=-1,O=8;O<8+A;O+=4){var H=n[O]<<8|n[O+1],J=(31&n[O+2])<<8|n[O+3];H===0?k.network_pid=J:(k.program_pmt_pid[H]=J,U===-1&&(U=H),M===-1&&(M=J))}c===1&&v===0&&(this.pat_==null&&u.default.v(this.TAG,"Parsed first PAT: ".concat(JSON.stringify(k))),this.pat_=k,this.current_program_=U,this.current_pmt_pid_=M)}else u.default.e(this.TAG,"parsePAT: table_id ".concat(i," is not corresponded to PAT!"))},o.prototype.parsePMT=function(n){var i=n[0];if(i===2){var l=(15&n[1])<<8|n[2],p=n[3]<<8|n[4],c=(62&n[5])>>>1,v=1&n[5],k=n[6],A=(n[7],null);if(v===1&&k===0)(A=new ye).program_number=p,A.version_number=c,this.program_pmt_map_[p]=A;else if((A=this.program_pmt_map_[p])==null)return;A.pcr_pid=(31&n[8])<<8|n[9];for(var U=(15&n[10])<<8|n[11],M=12+U,O=l-9-U-4,H=M;H<M+O;){var J=n[H],ne=(31&n[H+1])<<8|n[H+2],se=(15&n[H+3])<<8|n[H+4];A.pid_stream_type[ne]=J;var he=A.common_pids.h264||A.common_pids.h265,Z=A.common_pids.adts_aac||A.common_pids.loas_aac||A.common_pids.ac3||A.common_pids.eac3||A.common_pids.opus||A.common_pids.mp3;if(J!==K.kH264||he)if(J!==K.kH265||he)if(J!==K.kADTSAAC||Z)if(J!==K.kLOASAAC||Z)if(J!==K.kAC3||Z)if(J!==K.kEAC3||Z)if(J!==K.kMPEG1Audio&&J!==K.kMPEG2Audio||Z){if(J===K.kPESPrivateData){if(A.pes_private_data_pids[ne]=!0,se>0){for(var oe=H+5;oe<H+5+se;){var we=n[oe+0],Le=n[oe+1];if(we===5){var me=String.fromCharCode.apply(String,Array.from(n.subarray(oe+2,oe+2+Le)));me==="VANC"?A.smpte2038_pids[ne]=!0:me==="AV01"?A.common_pids.av1=ne:me==="Opus"?A.common_pids.opus=ne:me==="KLVA"&&(A.asynchronous_klv_pids[ne]=!0)}else if(we===127){if(ne===A.common_pids.opus){var ge=null;if(n[oe+2]===128&&(ge=n[oe+3]),ge==null){u.default.e(this.TAG,"Not Supported Opus channel count.");continue}var ke={codec:"opus",channel_count:15&ge?15&ge:2,channel_config_code:ge,sample_rate:48e3},xe={codec:"opus",meta:ke};this.audio_init_segment_dispatched_==0?(this.audio_metadata_=ke,this.dispatchAudioInitSegment(xe)):this.detectAudioMetadataChange(xe)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(xe))}}else we===128&&ne===A.common_pids.av1&&(this.video_metadata_.av1c=n.subarray(oe+2,oe+2+Le));oe+=2+Le}var Oe=n.subarray(H+5,H+5+se);this.dispatchPESPrivateDataDescriptor(ne,J,Oe)}}else if(J===K.kMetadata){if(se>0)for(oe=H+5;oe<H+5+se;){we=n[oe+0];var Ie=n[oe+1];if(we===38){var Fe=n[oe+2]<<8|n[oe+3],He=null;Fe===65535&&(He=String.fromCharCode.apply(String,Array.from(n.subarray(oe+4,oe+4+4))));var De=null;if(n[oe+4+(Fe===65535?4:0)]===255){var Ee=4+(Fe===65535?4:0)+1;De=String.fromCharCode.apply(String,Array.from(n.subarray(oe+Ee,oe+Ee+4)))}He==="ID3 "&&De==="ID3 "?A.timed_id3_pids[ne]=!0:De==="KLVA"&&(A.synchronous_klv_pids[ne]=!0)}oe+=2+Ie}}else if(J===K.kSCTE35)A.scte_35_pids[ne]=!0;else if(J===K.kPGS){if(A.pgs_langs[ne]="und",se>0)for(oe=H+5;oe<H+5+se;){we=n[oe+0];var Be=n[oe+1];if(we===10){var We=String.fromCharCode.apply(String,Array.from(n.slice(oe+2,oe+5)));A.pgs_langs[ne]=We}oe+=2+Be}A.pgs_pids[ne]=!0}}else A.common_pids.mp3=ne;else A.common_pids.eac3=ne;else A.common_pids.ac3=ne;else A.common_pids.loas_aac=ne;else A.common_pids.adts_aac=ne;else A.common_pids.h265=ne;else A.common_pids.h264=ne;H+=5+se}p===this.current_program_&&(this.pmt_==null&&u.default.v(this.TAG,"Parsed first PMT: ".concat(JSON.stringify(A))),this.pmt_=A,(A.common_pids.h264||A.common_pids.h265||A.common_pids.av1)&&(this.has_video_=!0),(A.common_pids.adts_aac||A.common_pids.loas_aac||A.common_pids.ac3||A.common_pids.opus||A.common_pids.mp3)&&(this.has_audio_=!0))}else u.default.e(this.TAG,"parsePMT: table_id ".concat(i," is not corresponded to PMT!"))},o.prototype.parseSCTE35=function(n){var i=function(p){var c=new D(p),v=c.readBits(8),k=c.readBool(),A=c.readBool();c.readBits(2);var U=c.readBits(12),M=c.readBits(8),O=c.readBool(),H=c.readBits(6),J=4*c.readBits(31)+c.readBits(2),ne=c.readBits(8),se=c.readBits(12),he=c.readBits(12),Z=c.readBits(8),oe=null;Z===fe.kSpliceNull?oe={}:Z===fe.kSpliceSchedule?oe=function(Ee){for(var Be=Ee.readBits(8),We=[],Te=0;Te<Be;Te++)We.push(za(Ee));return{splice_count:Be,events:We}}(c):Z===fe.kSpliceInsert?oe=function(Ee){var Be=Ee.readBits(32),We=Ee.readBool();Ee.readBits(7);var Te={splice_event_id:Be,splice_event_cancel_indicator:We};if(We)return Te;if(Te.out_of_network_indicator=Ee.readBool(),Te.program_splice_flag=Ee.readBool(),Te.duration_flag=Ee.readBool(),Te.splice_immediate_flag=Ee.readBool(),Ee.readBits(4),Te.program_splice_flag&&!Te.splice_immediate_flag&&(Te.splice_time=Si(Ee)),!Te.program_splice_flag){Te.component_count=Ee.readBits(8),Te.components=[];for(var Ke=0;Ke<Te.component_count;Ke++)Te.components.push(Ua(Te.splice_immediate_flag,Ee))}return Te.duration_flag&&(Te.break_duration=Hn(Ee)),Te.unique_program_id=Ee.readBits(16),Te.avail_num=Ee.readBits(8),Te.avails_expected=Ee.readBits(8),Te}(c):Z===fe.kTimeSignal?oe=function(Ee){return{splice_time:Si(Ee)}}(c):Z===fe.kBandwidthReservation?oe={}:Z===fe.kPrivateCommand?oe=function(Ee,Be){for(var We=String.fromCharCode(Be.readBits(8),Be.readBits(8),Be.readBits(8),Be.readBits(8)),Te=new Uint8Array(Ee-4),Ke=0;Ke<Ee-4;Ke++)Te[Ke]=Be.readBits(8);return{identifier:We,private_data:Te.buffer}}(he,c):c.readBits(8*he);for(var we=[],Le=c.readBits(16),me=0;me<Le;){var ge=c.readBits(8),ke=c.readBits(8),xe=String.fromCharCode(c.readBits(8),c.readBits(8),c.readBits(8),c.readBits(8));ge===0?we.push(Va(ge,ke,xe,c)):ge===1?we.push(Fa(ge,ke,xe,c)):ge===2?we.push(ja(ge,ke,xe,c)):ge===3?we.push(Ga(ge,ke,xe,c)):ge===4?we.push(Wa(ge,ke,xe,c)):c.readBits(8*(ke-4)),me+=2+ke}var Oe={table_id:v,section_syntax_indicator:k,private_indicator:A,section_length:U,protocol_version:M,encrypted_packet:O,encryption_algorithm:H,pts_adjustment:J,cw_index:ne,tier:se,splice_command_length:he,splice_command_type:Z,splice_command:oe,descriptor_loop_length:Le,splice_descriptors:we,E_CRC32:O?c.readBits(32):void 0,CRC32:c.readBits(32)};if(Z===fe.kSpliceInsert){var Ie=oe;if(Ie.splice_event_cancel_indicator)return{splice_command_type:Z,detail:Oe,data:p};if(Ie.program_splice_flag&&!Ie.splice_immediate_flag){var Fe=Ie.duration_flag?Ie.break_duration.auto_return:void 0,He=Ie.duration_flag?Ie.break_duration.duration/90:void 0;return Ie.splice_time.time_specified_flag?{splice_command_type:Z,pts:(J+Ie.splice_time.pts_time)%Math.pow(2,33),auto_return:Fe,duraiton:He,detail:Oe,data:p}:{splice_command_type:Z,auto_return:Fe,duraiton:He,detail:Oe,data:p}}return{splice_command_type:Z,auto_return:Fe=Ie.duration_flag?Ie.break_duration.auto_return:void 0,duraiton:He=Ie.duration_flag?Ie.break_duration.duration/90:void 0,detail:Oe,data:p}}if(Z===fe.kTimeSignal){var De=oe;return De.splice_time.time_specified_flag?{splice_command_type:Z,pts:(J+De.splice_time.pts_time)%Math.pow(2,33),detail:Oe,data:p}:{splice_command_type:Z,detail:Oe,data:p}}return{splice_command_type:Z,detail:Oe,data:p}}(n);if(i.pts!=null){var l=Math.floor(i.pts/this.timescale_);i.pts=l}else i.nearest_pts=this.getNearestTimestampMilliseconds();this.onSCTE35Metadata&&this.onSCTE35Metadata(i)},o.prototype.parseAV1Payload=function(n,i,l,p,c){for(var v=new lo(n),k=null,A=[],U=0,M=!1,O=null;(k=v.readNextOBUPayload())!=null;){if((O=B.parseOBUs(k,this.video_metadata_.details))&&O.keyframe===!0)if(this.video_init_segment_dispatched_){if(this.detectVideoMetadataChange(null,O)===!0){var H;this.video_metadata_changed_=!0,this.dispatchVideoMediaSegment(),(H=new Uint8Array(new ArrayBuffer(this.video_metadata_.av1c.byteLength+O.sequence_header_data.byteLength))).set(this.video_metadata_.av1c,0),H.set(O.sequence_header_data,this.video_metadata_.av1c.byteLength),O.av1c=H,this.dispatchVideoInitSegment()}}else(H=new Uint8Array(new ArrayBuffer(this.video_metadata_.av1c.byteLength+O.sequence_header_data.byteLength))).set(this.video_metadata_.av1c,0),H.set(O.sequence_header_data,this.video_metadata_.av1c.byteLength),O.av1c=H,this.video_metadata_.details=O,this.dispatchVideoInitSegment();this.video_metadata_.details=O,M||(M=O.keyframe),A.push({data:k}),U+=k.byteLength}var J=Math.floor(i/this.timescale_),ne=Math.floor(l/this.timescale_);if(A.length){var se=this.video_track_,he={units:A,length:U,isKeyframe:M,dts:ne,pts:J,cts:J-ne,file_position:p};se.samples.push(he),se.length+=U}},o.prototype.parseH264Payload=function(n,i,l,p,c){for(var v=new _e(n),k=null,A=[],U=0,M=!1;(k=v.readNextNaluPayload())!=null;){var O=new Se(k);if(O.type===te.kSliceSPS){var H=F.parseSPS(k.data);this.video_init_segment_dispatched_?this.detectVideoMetadataChange(O,H)===!0&&(u.default.v(this.TAG,"H264: Critical h264 metadata has been changed, attempt to re-generate InitSegment"),this.video_metadata_changed_=!0,this.video_metadata_={vps:void 0,sps:O,pps:void 0,av1c:void 0,details:H}):(this.video_metadata_.sps=O,this.video_metadata_.details=H)}else O.type===te.kSlicePPS?this.video_init_segment_dispatched_&&!this.video_metadata_changed_||(this.video_metadata_.pps=O,this.video_metadata_.sps&&this.video_metadata_.pps&&(this.video_metadata_changed_&&this.dispatchVideoMediaSegment(),this.dispatchVideoInitSegment())):O.type===te.kSliceIDR||O.type===te.kSliceNonIDR&&c===1?M=!0:O.type===te.kSliceSEI&&this.parseSEIPayload(k.data,i,"h264");this.video_init_segment_dispatched_&&(A.push(O),U+=O.data.byteLength)}var J=Math.floor(i/this.timescale_),ne=Math.floor(l/this.timescale_);if(A.length){var se=this.video_track_,he={units:A,length:U,isKeyframe:M,dts:ne,pts:J,cts:J-ne,file_position:p};se.samples.push(he),se.length+=U}},o.prototype.parseH265Payload=function(n,i,l,p,c){for(var v=new Ja(n),k=null,A=[],U=0,M=!1;(k=v.readNextNaluPayload())!=null;){var O=new Ya(k);if(O.type===lt.kSliceVPS){if(!this.video_init_segment_dispatched_){var H=Y.parseVPS(k.data);this.video_metadata_.vps=O,this.video_metadata_.details=Ht(Ht({},this.video_metadata_.details),H)}}else O.type===lt.kSliceSPS?(H=Y.parseSPS(k.data),this.video_init_segment_dispatched_?this.detectVideoMetadataChange(O,H)===!0&&(u.default.v(this.TAG,"H265: Critical h265 metadata has been changed, attempt to re-generate InitSegment"),this.video_metadata_changed_=!0,this.video_metadata_={vps:void 0,sps:O,pps:void 0,av1c:void 0,details:H}):(this.video_metadata_.sps=O,this.video_metadata_.details=Ht(Ht({},this.video_metadata_.details),H))):O.type===lt.kSlicePPS?this.video_init_segment_dispatched_&&!this.video_metadata_changed_||(H=Y.parsePPS(k.data),this.video_metadata_.pps=O,this.video_metadata_.details=Ht(Ht({},this.video_metadata_.details),H),this.video_metadata_.vps&&this.video_metadata_.sps&&this.video_metadata_.pps&&(this.video_metadata_changed_&&this.dispatchVideoMediaSegment(),this.dispatchVideoInitSegment())):O.type===lt.kSliceIDR_W_RADL||O.type===lt.kSliceIDR_N_LP||O.type===lt.kSliceCRA_NUT?M=!0:O.type!==lt.kSliceSEI&&O.type!==lt.kSliceSEISuffix||this.parseSEIPayload(k.data,i,"h265");this.video_init_segment_dispatched_&&(A.push(O),U+=O.data.byteLength)}var J=Math.floor(i/this.timescale_),ne=Math.floor(l/this.timescale_);if(A.length){var se=this.video_track_,he={units:A,length:U,isKeyframe:M,dts:ne,pts:J,cts:J-ne,file_position:p};se.samples.push(he),se.length+=U}},o.prototype.detectVideoMetadataChange=function(n,i){if(i.codec_mimetype!==this.video_metadata_.details.codec_mimetype)return u.default.v(this.TAG,"Video: Codec mimeType changed from "+"".concat(this.video_metadata_.details.codec_mimetype," to ").concat(i.codec_mimetype)),!0;if(i.codec_size.width!==this.video_metadata_.details.codec_size.width||i.codec_size.height!==this.video_metadata_.details.codec_size.height){var l=this.video_metadata_.details.codec_size,p=i.codec_size;return u.default.v(this.TAG,"Video: Coded Resolution changed from "+"".concat(l.width,"x").concat(l.height," to ").concat(p.width,"x").concat(p.height)),!0}return i.present_size.width!==this.video_metadata_.details.present_size.width&&(u.default.v(this.TAG,"Video: Present resolution width changed from "+"".concat(this.video_metadata_.details.present_size.width," to ").concat(i.present_size.width)),!0)},o.prototype.isInitSegmentDispatched=function(){return this.has_video_&&this.has_audio_?this.video_init_segment_dispatched_&&this.audio_init_segment_dispatched_:this.has_video_&&!this.has_audio_?this.video_init_segment_dispatched_:!(this.has_video_||!this.has_audio_)&&this.audio_init_segment_dispatched_},o.prototype.dispatchVideoInitSegment=function(){var n=this.video_metadata_.details,i={type:"video"};i.id=this.video_track_.id,i.timescale=1e3,i.duration=this.duration_,i.codecWidth=n.codec_size.width,i.codecHeight=n.codec_size.height,i.presentWidth=n.present_size.width,i.presentHeight=n.present_size.height,i.profile=n.profile_string,i.level=n.level_string,i.bitDepth=n.bit_depth,i.chromaFormat=n.chroma_format,i.sarRatio=n.sar_ratio,i.frameRate=n.frame_rate;var l=i.frameRate.fps_den,p=i.frameRate.fps_num;if(i.refSampleDuration=l/p*1e3,i.codec=n.codec_mimetype,this.video_metadata_.av1c)i.av1c=this.video_metadata_.av1c,this.video_init_segment_dispatched_==0&&u.default.v(this.TAG,"Generated first AV1 for mimeType: ".concat(i.codec));else if(this.video_metadata_.vps){var c=this.video_metadata_.vps.data.subarray(4),v=this.video_metadata_.sps.data.subarray(4),k=this.video_metadata_.pps.data.subarray(4),A=new Xa(c,v,k,n);i.hvcc=A.getData(),this.video_init_segment_dispatched_==0&&u.default.v(this.TAG,"Generated first HEVCDecoderConfigurationRecord for mimeType: ".concat(i.codec))}else{v=this.video_metadata_.sps.data.subarray(4),k=this.video_metadata_.pps.data.subarray(4);var U=new ee(v,k,n);i.avcc=U.getData(),this.video_init_segment_dispatched_==0&&u.default.v(this.TAG,"Generated first AVCDecoderConfigurationRecord for mimeType: ".concat(i.codec))}this.onTrackMetadata("video",i),this.video_init_segment_dispatched_=!0,this.video_metadata_changed_=!1;var M=this.media_info_;M.hasVideo=!0,M.width=i.codecWidth,M.height=i.codecHeight,M.fps=i.frameRate.fps,M.profile=i.profile,M.level=i.level,M.refFrames=n.ref_frames,M.chromaFormat=n.chroma_format_string,M.sarNum=i.sarRatio.width,M.sarDen=i.sarRatio.height,M.videoCodec=i.codec,M.hasAudio&&M.audioCodec?M.mimeType='video/mp2t; codecs="'.concat(M.videoCodec,",").concat(M.audioCodec,'"'):M.mimeType='video/mp2t; codecs="'.concat(M.videoCodec,'"'),M.isComplete()&&this.onMediaInfo(M)},o.prototype.dispatchVideoMediaSegment=function(){this.isInitSegmentDispatched()&&this.video_track_.length&&this.onDataAvailable(null,this.video_track_)},o.prototype.dispatchAudioMediaSegment=function(){this.isInitSegmentDispatched()&&this.audio_track_.length&&this.onDataAvailable(this.audio_track_,null)},o.prototype.dispatchAudioVideoMediaSegment=function(){this.isInitSegmentDispatched()&&(this.audio_track_.length||this.video_track_.length)&&this.onDataAvailable(this.audio_track_,this.video_track_)},o.prototype.parseADTSAACPayload=function(n,i){if(!this.has_video_||this.video_init_segment_dispatched_){if(this.aac_last_incomplete_data_){var l=new Uint8Array(n.byteLength+this.aac_last_incomplete_data_.byteLength);l.set(this.aac_last_incomplete_data_,0),l.set(n,this.aac_last_incomplete_data_.byteLength),n=l}var p,c;if(i!=null&&(c=i/this.timescale_),this.audio_metadata_.codec==="aac"){if(i==null&&this.audio_last_sample_pts_!=null)p=1024/this.audio_metadata_.sampling_frequency*1e3,c=this.audio_last_sample_pts_+p;else if(i==null)return void u.default.w(this.TAG,"AAC: Unknown pts");if(this.aac_last_incomplete_data_&&this.audio_last_sample_pts_){p=1024/this.audio_metadata_.sampling_frequency*1e3;var v=this.audio_last_sample_pts_+p;Math.abs(v-c)>1&&(u.default.w(this.TAG,"AAC: Detected pts overlapped, "+"expected: ".concat(v,"ms, PES pts: ").concat(c,"ms")),c=v)}}for(var k,A=new st(n),U=null,M=c;(U=A.readNextAACFrame())!=null;){p=1024/U.sampling_frequency*1e3;var O={codec:"aac",data:U};this.audio_init_segment_dispatched_==0?(this.audio_metadata_={codec:"aac",audio_object_type:U.audio_object_type,sampling_freq_index:U.sampling_freq_index,sampling_frequency:U.sampling_frequency,channel_config:U.channel_config},this.dispatchAudioInitSegment(O)):this.detectAudioMetadataChange(O)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(O)),k=M;var H=Math.floor(M),J={unit:U.data,length:U.data.byteLength,pts:H,dts:H};this.audio_track_.samples.push(J),this.audio_track_.length+=U.data.byteLength,M+=p}A.hasIncompleteData()&&(this.aac_last_incomplete_data_=A.getIncompleteData()),k&&(this.audio_last_sample_pts_=k)}},o.prototype.parseLOASAACPayload=function(n,i){var l;if(!this.has_video_||this.video_init_segment_dispatched_){if(this.aac_last_incomplete_data_){var p=new Uint8Array(n.byteLength+this.aac_last_incomplete_data_.byteLength);p.set(this.aac_last_incomplete_data_,0),p.set(n,this.aac_last_incomplete_data_.byteLength),n=p}var c,v;if(i!=null&&(v=i/this.timescale_),this.audio_metadata_.codec==="aac"){if(i==null&&this.audio_last_sample_pts_!=null)c=1024/this.audio_metadata_.sampling_frequency*1e3,v=this.audio_last_sample_pts_+c;else if(i==null)return void u.default.w(this.TAG,"AAC: Unknown pts");if(this.aac_last_incomplete_data_&&this.audio_last_sample_pts_){c=1024/this.audio_metadata_.sampling_frequency*1e3;var k=this.audio_last_sample_pts_+c;Math.abs(k-v)>1&&(u.default.w(this.TAG,"AAC: Detected pts overlapped, "+"expected: ".concat(k,"ms, PES pts: ").concat(v,"ms")),v=k)}}for(var A,U=new Tt(n),M=null,O=v;(M=U.readNextAACFrame((l=this.loas_previous_frame)!==null&&l!==void 0?l:void 0))!=null;){this.loas_previous_frame=M,c=1024/M.sampling_frequency*1e3;var H={codec:"aac",data:M};this.audio_init_segment_dispatched_==0?(this.audio_metadata_={codec:"aac",audio_object_type:M.audio_object_type,sampling_freq_index:M.sampling_freq_index,sampling_frequency:M.sampling_frequency,channel_config:M.channel_config},this.dispatchAudioInitSegment(H)):this.detectAudioMetadataChange(H)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(H)),A=O;var J=Math.floor(O),ne={unit:M.data,length:M.data.byteLength,pts:J,dts:J};this.audio_track_.samples.push(ne),this.audio_track_.length+=M.data.byteLength,O+=c}U.hasIncompleteData()&&(this.aac_last_incomplete_data_=U.getIncompleteData()),A&&(this.audio_last_sample_pts_=A)}},o.prototype.parseAC3Payload=function(n,i){if(!this.has_video_||this.video_init_segment_dispatched_){var l,p;if(i!=null&&(p=i/this.timescale_),this.audio_metadata_.codec==="ac-3"){if(i==null&&this.audio_last_sample_pts_!=null)l=1536/this.audio_metadata_.sampling_frequency*1e3,p=this.audio_last_sample_pts_+l;else if(i==null)return void u.default.w(this.TAG,"AC3: Unknown pts")}for(var c,v=new io(n),k=null,A=p;(k=v.readNextAC3Frame())!=null;){l=1536/k.sampling_frequency*1e3;var U={codec:"ac-3",data:k};this.audio_init_segment_dispatched_==0?(this.audio_metadata_={codec:"ac-3",sampling_frequency:k.sampling_frequency,bit_stream_identification:k.bit_stream_identification,bit_stream_mode:k.bit_stream_mode,low_frequency_effects_channel_on:k.low_frequency_effects_channel_on,channel_mode:k.channel_mode},this.dispatchAudioInitSegment(U)):this.detectAudioMetadataChange(U)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(U)),c=A;var M=Math.floor(A),O={unit:k.data,length:k.data.byteLength,pts:M,dts:M};this.audio_track_.samples.push(O),this.audio_track_.length+=k.data.byteLength,A+=l}c&&(this.audio_last_sample_pts_=c)}},o.prototype.parseEAC3Payload=function(n,i){if(!this.has_video_||this.video_init_segment_dispatched_){var l,p;if(i!=null&&(p=i/this.timescale_),this.audio_metadata_.codec==="ec-3"){if(i==null&&this.audio_last_sample_pts_!=null)l=256*this.audio_metadata_.num_blks/this.audio_metadata_.sampling_frequency*1e3,p=this.audio_last_sample_pts_+l;else if(i==null)return void u.default.w(this.TAG,"EAC3: Unknown pts")}for(var c,v=new oo(n),k=null,A=p;(k=v.readNextEAC3Frame())!=null;){l=1536/k.sampling_frequency*1e3;var U={codec:"ec-3",data:k};this.audio_init_segment_dispatched_==0?(this.audio_metadata_={codec:"ec-3",sampling_frequency:k.sampling_frequency,bit_stream_identification:k.bit_stream_identification,low_frequency_effects_channel_on:k.low_frequency_effects_channel_on,num_blks:k.num_blks,channel_mode:k.channel_mode},this.dispatchAudioInitSegment(U)):this.detectAudioMetadataChange(U)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(U)),c=A;var M=Math.floor(A),O={unit:k.data,length:k.data.byteLength,pts:M,dts:M};this.audio_track_.samples.push(O),this.audio_track_.length+=k.data.byteLength,A+=l}c&&(this.audio_last_sample_pts_=c)}},o.prototype.parseOpusPayload=function(n,i){if(!this.has_video_||this.video_init_segment_dispatched_){var l,p;if(i!=null&&(p=i/this.timescale_),this.audio_metadata_.codec==="opus"){if(i==null&&this.audio_last_sample_pts_!=null)l=20,p=this.audio_last_sample_pts_+l;else if(i==null)return void u.default.w(this.TAG,"Opus: Unknown pts")}for(var c,v=p,k=0;k<n.length;){l=20;for(var A=!!(16&n[k+1]),U=!!(8&n[k+1]),M=k+2,O=0;n[M]===255;)O+=255,M+=1;O+=n[M],M+=1,M+=A?2:0,M+=U?2:0,c=v;var H=Math.floor(v),J=n.slice(M,M+O),ne={unit:J,length:J.byteLength,pts:H,dts:H};this.audio_track_.samples.push(ne),this.audio_track_.length+=J.byteLength,v+=l,k=M+O}c&&(this.audio_last_sample_pts_=c)}},o.prototype.parseMP3Payload=function(n,i){if(!this.has_video_||this.video_init_segment_dispatched_){var l=n[1]>>>3&3,p=(6&n[1])>>1,c=(n[2],(12&n[2])>>>2),v=3&~(n[3]>>>6)?2:1,k=0,A=34;switch(l){case 0:k=[11025,12e3,8e3,0][c];break;case 2:k=[22050,24e3,16e3,0][c];break;case 3:k=[44100,48e3,32e3,0][c]}switch(p){case 1:A=34;break;case 2:A=33;break;case 3:A=32}var U=new Za;U.object_type=A,U.sample_rate=k,U.channel_count=v,U.data=n;var M={codec:"mp3",data:U};this.audio_init_segment_dispatched_==0?(this.audio_metadata_={codec:"mp3",object_type:A,sample_rate:k,channel_count:v},this.dispatchAudioInitSegment(M)):this.detectAudioMetadataChange(M)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(M));var O={unit:n,length:n.byteLength,pts:i/this.timescale_,dts:i/this.timescale_};this.audio_track_.samples.push(O),this.audio_track_.length+=n.byteLength}},o.prototype.detectAudioMetadataChange=function(n){if(n.codec!==this.audio_metadata_.codec)return u.default.v(this.TAG,"Audio: Audio Codecs changed from "+"".concat(this.audio_metadata_.codec," to ").concat(n.codec)),!0;if(n.codec==="aac"&&this.audio_metadata_.codec==="aac"){if((i=n.data).audio_object_type!==this.audio_metadata_.audio_object_type)return u.default.v(this.TAG,"AAC: AudioObjectType changed from "+"".concat(this.audio_metadata_.audio_object_type," to ").concat(i.audio_object_type)),!0;if(i.sampling_freq_index!==this.audio_metadata_.sampling_freq_index)return u.default.v(this.TAG,"AAC: SamplingFrequencyIndex changed from "+"".concat(this.audio_metadata_.sampling_freq_index," to ").concat(i.sampling_freq_index)),!0;if(i.channel_config!==this.audio_metadata_.channel_config)return u.default.v(this.TAG,"AAC: Channel configuration changed from "+"".concat(this.audio_metadata_.channel_config," to ").concat(i.channel_config)),!0}else if(n.codec==="ac-3"&&this.audio_metadata_.codec==="ac-3"){var i;if((i=n.data).sampling_frequency!==this.audio_metadata_.sampling_frequency)return u.default.v(this.TAG,"AC3: Sampling Frequency changed from "+"".concat(this.audio_metadata_.sampling_frequency," to ").concat(i.sampling_frequency)),!0;if(i.bit_stream_identification!==this.audio_metadata_.bit_stream_identification)return u.default.v(this.TAG,"AC3: Bit Stream Identification changed from "+"".concat(this.audio_metadata_.bit_stream_identification," to ").concat(i.bit_stream_identification)),!0;if(i.bit_stream_mode!==this.audio_metadata_.bit_stream_mode)return u.default.v(this.TAG,"AC3: BitStream Mode changed from "+"".concat(this.audio_metadata_.bit_stream_mode," to ").concat(i.bit_stream_mode)),!0;if(i.channel_mode!==this.audio_metadata_.channel_mode)return u.default.v(this.TAG,"AC3: Channel Mode changed from "+"".concat(this.audio_metadata_.channel_mode," to ").concat(i.channel_mode)),!0;if(i.low_frequency_effects_channel_on!==this.audio_metadata_.low_frequency_effects_channel_on)return u.default.v(this.TAG,"AC3: Low Frequency Effects Channel On changed from "+"".concat(this.audio_metadata_.low_frequency_effects_channel_on," to ").concat(i.low_frequency_effects_channel_on)),!0}else if(n.codec==="opus"&&this.audio_metadata_.codec==="opus"){if((l=n.meta).sample_rate!==this.audio_metadata_.sample_rate)return u.default.v(this.TAG,"Opus: SamplingFrequencyIndex changed from "+"".concat(this.audio_metadata_.sample_rate," to ").concat(l.sample_rate)),!0;if(l.channel_count!==this.audio_metadata_.channel_count)return u.default.v(this.TAG,"Opus: Channel count changed from "+"".concat(this.audio_metadata_.channel_count," to ").concat(l.channel_count)),!0}else if(n.codec==="mp3"&&this.audio_metadata_.codec==="mp3"){var l;if((l=n.data).object_type!==this.audio_metadata_.object_type)return u.default.v(this.TAG,"MP3: AudioObjectType changed from "+"".concat(this.audio_metadata_.object_type," to ").concat(l.object_type)),!0;if(l.sample_rate!==this.audio_metadata_.sample_rate)return u.default.v(this.TAG,"MP3: SamplingFrequencyIndex changed from "+"".concat(this.audio_metadata_.sample_rate," to ").concat(l.sample_rate)),!0;if(l.channel_count!==this.audio_metadata_.channel_count)return u.default.v(this.TAG,"MP3: Channel count changed from "+"".concat(this.audio_metadata_.channel_count," to ").concat(l.channel_count)),!0}return!1},o.prototype.dispatchAudioInitSegment=function(n){var i={type:"audio"};if(i.id=this.audio_track_.id,i.timescale=1e3,i.duration=this.duration_,this.audio_metadata_.codec==="aac"){var l=n.codec==="aac"?n.data:null,p=new vt(l);i.audioSampleRate=p.sampling_rate,i.channelCount=p.channel_count,i.codec=p.codec_mimetype,i.originalCodec=p.original_codec_mimetype,i.config=p.config,i.refSampleDuration=1024/i.audioSampleRate*i.timescale}else if(this.audio_metadata_.codec==="ac-3"){var c=n.codec==="ac-3"?n.data:null,v=new no(c);i.audioSampleRate=v.sampling_rate,i.channelCount=v.channel_count,i.codec=v.codec_mimetype,i.originalCodec=v.original_codec_mimetype,i.config=v.config,i.refSampleDuration=1536/i.audioSampleRate*i.timescale}else if(this.audio_metadata_.codec==="ec-3"){var k=n.codec==="ec-3"?n.data:null,A=new ro(k);i.audioSampleRate=A.sampling_rate,i.channelCount=A.channel_count,i.codec=A.codec_mimetype,i.originalCodec=A.original_codec_mimetype,i.config=A.config,i.refSampleDuration=256*A.num_blks/i.audioSampleRate*i.timescale}else this.audio_metadata_.codec==="opus"?(i.audioSampleRate=this.audio_metadata_.sample_rate,i.channelCount=this.audio_metadata_.channel_count,i.channelConfigCode=this.audio_metadata_.channel_config_code,i.codec="opus",i.originalCodec="opus",i.config=void 0,i.refSampleDuration=20):this.audio_metadata_.codec==="mp3"&&(i.audioSampleRate=this.audio_metadata_.sample_rate,i.channelCount=this.audio_metadata_.channel_count,i.codec="mp3",i.originalCodec="mp3",i.config=void 0);this.audio_init_segment_dispatched_==0&&u.default.v(this.TAG,"Generated first AudioSpecificConfig for mimeType: ".concat(i.codec)),this.onTrackMetadata("audio",i),this.audio_init_segment_dispatched_=!0,this.video_metadata_changed_=!1;var U=this.media_info_;U.hasAudio=!0,U.audioCodec=i.originalCodec,U.audioSampleRate=i.audioSampleRate,U.audioChannelCount=i.channelCount,U.hasVideo&&U.videoCodec?U.mimeType='video/mp2t; codecs="'.concat(U.videoCodec,",").concat(U.audioCodec,'"'):U.mimeType='video/mp2t; codecs="'.concat(U.audioCodec,'"'),U.isComplete()&&this.onMediaInfo(U)},o.prototype.dispatchPESPrivateDataDescriptor=function(n,i,l){var p=new un;p.pid=n,p.stream_type=i,p.descriptor=l,this.onPESPrivateDataDescriptor&&this.onPESPrivateDataDescriptor(p)},o.prototype.parsePESPrivateDataPayload=function(n,i,l,p,c){var v=new wi;if(v.pid=p,v.stream_id=c,v.len=n.byteLength,v.data=n,i!=null){var k=Math.floor(i/this.timescale_);v.pts=k}else v.nearest_pts=this.getNearestTimestampMilliseconds();if(l!=null){var A=Math.floor(l/this.timescale_);v.dts=A}this.onPESPrivateData&&this.onPESPrivateData(v)},o.prototype.parseTimedID3MetadataPayload=function(n,i,l,p,c){var v=new wi;if(v.pid=p,v.stream_id=c,v.len=n.byteLength,v.data=n,i!=null){var k=Math.floor(i/this.timescale_);v.pts=k}if(l!=null){var A=Math.floor(l/this.timescale_);v.dts=A}this.onTimedID3Metadata&&this.onTimedID3Metadata(v)},o.prototype.parsePGSPayload=function(n,i,l,p,c,v){var k=new co;if(k.pid=p,k.lang=v,k.stream_id=c,k.len=n.byteLength,k.data=n,i!=null){var A=Math.floor(i/this.timescale_);k.pts=A}if(l!=null){var U=Math.floor(l/this.timescale_);k.dts=U}this.onPGSSubtitleData&&this.onPGSSubtitleData(k)},o.prototype.parseSynchronousKLVMetadataPayload=function(n,i,l,p,c){var v=new so;if(v.pid=p,v.stream_id=c,v.len=n.byteLength,v.data=n,i!=null){var k=Math.floor(i/this.timescale_);v.pts=k}if(l!=null){var A=Math.floor(l/this.timescale_);v.dts=A}v.access_units=function(U){for(var M=[],O=0;O+5<U.byteLength;){var H=U[O+0],J=U[O+1],ne=U[O+2],se=U[O+3]<<8|U[O+4],he=U.slice(O+5,O+5+se);M.push({service_id:H,sequence_number:J,flags:ne,data:he}),O+=5+se}return M}(n),this.onSynchronousKLVMetadata&&this.onSynchronousKLVMetadata(v)},o.prototype.parseAsynchronousKLVMetadataPayload=function(n,i,l){var p=new wi;p.pid=i,p.stream_id=l,p.len=n.byteLength,p.data=n,this.onAsynchronousKLVMetadata&&this.onAsynchronousKLVMetadata(p)},o.prototype.parseSMPTE2038MetadataPayload=function(n,i,l,p,c){var v=new Qa;if(v.pid=p,v.stream_id=c,v.len=n.byteLength,v.data=n,i!=null){var k=Math.floor(i/this.timescale_);v.pts=k}if(v.nearest_pts=this.getNearestTimestampMilliseconds(),l!=null){var A=Math.floor(l/this.timescale_);v.dts=A}v.ancillaries=function(U){for(var M=new D(U),O=0,H=[];O+=6,M.readBits(6)===0;){var J=M.readBool();O+=1;var ne=M.readBits(11);O+=11;var se=M.readBits(12);O+=12;var he=255&M.readBits(10);O+=10;var Z=255&M.readBits(10);O+=10;var oe=255&M.readBits(10);O+=10;for(var we=new Uint8Array(oe),Le=0;Le<oe;Le++){var me=255&M.readBits(10);O+=10,we[Le]=me}M.readBits(10),O+=10;var ge="User Defined";he===65?Z===7&&(ge="SCTE-104"):he===95?Z===220?ge="ARIB STD-B37 (1SEG)":Z===221?ge="ARIB STD-B37 (ANALOG)":Z===222?ge="ARIB STD-B37 (SD)":Z===223&&(ge="ARIB STD-B37 (HD)"):he===97&&(Z===1?ge="EIA-708":Z===2&&(ge="EIA-608")),H.push({yc_indicator:J,line_number:ne,horizontal_offset:se,did:he,sdid:Z,user_data:we,description:ge,information:{}}),M.readBits(8-(O-Math.floor(O/8))%8),O+=(8-(O-Math.floor(O/8)))%8}return M.destroy(),M=null,H}(n),this.onSMPTE2038Metadata&&this.onSMPTE2038Metadata(v)},o.prototype.parseSEIPayload=function(n,i,l){var p=Q(n,i!=null?Math.floor(i/this.timescale_):void 0,l);p&&this.onSEI&&this.onSEI(p)},o.prototype.getNearestTimestampMilliseconds=function(){return this.audio_last_sample_pts_!=null?Math.floor(this.audio_last_sample_pts_):this.last_pcr_!=null?Math.floor(this.last_pcr_/300/this.timescale_):void 0},o.prototype.getPcrBase=function(n){var i=33554432*n[6]+131072*n[7]+512*n[8]+2*n[9]+(128&n[10])/128+this.timestamp_offset_;return i+4294967296<this.last_pcr_base_&&(i+=8589934592,this.timestamp_offset_+=8589934592),this.last_pcr_base_=i,i},o.prototype.getTimestamp=function(n,i){var l=536870912*(14&n[i])+4194304*(255&n[i+1])+16384*(254&n[i+2])+128*(255&n[i+3])+(254&n[i+4])/2+this.timestamp_offset_;return l+4294967296<this.last_pcr_base_&&(l+=8589934592),l},o}(pe),jn=po,Gn=function(r,o,n){for(var i,l=0,p=o.length;l<p;l++)!i&&l in o||(i||(i=Array.prototype.slice.call(o,0,l)),i[l]=o[l]);return r.concat(i||Array.prototype.slice.call(o))},qn=function(){function r(){}return r.init=function(){for(var o in r.types={avc1:[],avcC:[],btrt:[],dinf:[],dref:[],esds:[],ftyp:[],hdlr:[],hvc1:[],hvcC:[],av01:[],av1C:[],mdat:[],mdhd:[],mdia:[],mfhd:[],minf:[],moof:[],moov:[],mp4a:[],mvex:[],mvhd:[],sdtp:[],stbl:[],stco:[],stsc:[],stsd:[],stsz:[],stts:[],tfdt:[],tfhd:[],traf:[],trak:[],trun:[],trex:[],tkhd:[],vmhd:[],smhd:[],chnl:[],".mp3":[],Opus:[],dOps:[],fLaC:[],dfLa:[],ipcm:[],pcmC:[],"ac-3":[],dac3:[],"ec-3":[],dec3:[]},r.types)r.types.hasOwnProperty(o)&&(r.types[o]=[o.charCodeAt(0),o.charCodeAt(1),o.charCodeAt(2),o.charCodeAt(3)]);var n=r.constants={};n.FTYP=new Uint8Array([105,115,111,109,0,0,0,1,105,115,111,109,97,118,99,49]),n.STSD_PREFIX=new Uint8Array([0,0,0,0,0,0,0,1]),n.STTS=new Uint8Array([0,0,0,0,0,0,0,0]),n.STSC=n.STCO=n.STTS,n.STSZ=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0]),n.HDLR_VIDEO=new Uint8Array([0,0,0,0,0,0,0,0,118,105,100,101,0,0,0,0,0,0,0,0,0,0,0,0,86,105,100,101,111,72,97,110,100,108,101,114,0]),n.HDLR_AUDIO=new Uint8Array([0,0,0,0,0,0,0,0,115,111,117,110,0,0,0,0,0,0,0,0,0,0,0,0,83,111,117,110,100,72,97,110,100,108,101,114,0]),n.DREF=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,12,117,114,108,32,0,0,0,1]),n.SMHD=new Uint8Array([0,0,0,0,0,0,0,0]),n.VMHD=new Uint8Array([0,0,0,1,0,0,0,0,0,0,0,0])},r.box=function(o){for(var n=8,i=null,l=Array.prototype.slice.call(arguments,1),p=l.length,c=0;c<p;c++)n+=l[c].byteLength;(i=new Uint8Array(n))[0]=n>>>24&255,i[1]=n>>>16&255,i[2]=n>>>8&255,i[3]=255&n,i.set(o,4);var v=8;for(c=0;c<p;c++)i.set(l[c],v),v+=l[c].byteLength;return i},r.generateInitSegment=function(o){var n=r.box(r.types.ftyp,r.constants.FTYP),i=r.moov(o),l=new Uint8Array(n.byteLength+i.byteLength);return l.set(n,0),l.set(i,n.byteLength),l},r.moov=function(o){var n=r.mvhd(o.timescale,o.duration),i=r.trak(o),l=r.mvex(o);return r.box(r.types.moov,n,i,l)},r.mvhd=function(o,n){return r.box(r.types.mvhd,new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,o>>>24&255,o>>>16&255,o>>>8&255,255&o,n>>>24&255,n>>>16&255,n>>>8&255,255&n,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255]))},r.trak=function(o){return r.box(r.types.trak,r.tkhd(o),r.mdia(o))},r.tkhd=function(o){var n=o.id,i=o.duration,l=o.presentWidth,p=o.presentHeight;return r.box(r.types.tkhd,new Uint8Array([0,0,0,7,0,0,0,0,0,0,0,0,n>>>24&255,n>>>16&255,n>>>8&255,255&n,0,0,0,0,i>>>24&255,i>>>16&255,i>>>8&255,255&i,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,l>>>8&255,255&l,0,0,p>>>8&255,255&p,0,0]))},r.mdia=function(o){return r.box(r.types.mdia,r.mdhd(o),r.hdlr(o),r.minf(o))},r.mdhd=function(o){var n=o.timescale,i=o.duration;return r.box(r.types.mdhd,new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,n>>>24&255,n>>>16&255,n>>>8&255,255&n,i>>>24&255,i>>>16&255,i>>>8&255,255&i,85,196,0,0]))},r.hdlr=function(o){var n;return n=o.type==="audio"?r.constants.HDLR_AUDIO:r.constants.HDLR_VIDEO,r.box(r.types.hdlr,n)},r.minf=function(o){var n;return n=o.type==="audio"?r.box(r.types.smhd,r.constants.SMHD):r.box(r.types.vmhd,r.constants.VMHD),r.box(r.types.minf,n,r.dinf(),r.stbl(o))},r.dinf=function(){return r.box(r.types.dinf,r.box(r.types.dref,r.constants.DREF))},r.stbl=function(o){return r.box(r.types.stbl,r.stsd(o),r.box(r.types.stts,r.constants.STTS),r.box(r.types.stsc,r.constants.STSC),r.box(r.types.stsz,r.constants.STSZ),r.box(r.types.stco,r.constants.STCO))},r.stsd=function(o){return o.type==="audio"?o.codec==="mp3"?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.mp3(o)):o.codec==="ac-3"?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.ac3(o)):o.codec==="ec-3"?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.ec3(o)):o.codec==="opus"?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.Opus(o)):o.codec=="flac"?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.fLaC(o)):o.codec=="ipcm"?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.ipcm(o)):r.box(r.types.stsd,r.constants.STSD_PREFIX,r.mp4a(o)):o.type==="video"&&o.codec.startsWith("hvc1")?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.hvc1(o)):o.type==="video"&&o.codec.startsWith("av01")?r.box(r.types.stsd,r.constants.STSD_PREFIX,r.av01(o)):r.box(r.types.stsd,r.constants.STSD_PREFIX,r.avc1(o))},r.mp3=function(o){var n=o.channelCount,i=o.audioSampleRate,l=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,n,0,16,0,0,0,0,i>>>8&255,255&i,0,0]);return r.box(r.types[".mp3"],l)},r.mp4a=function(o){var n=o.channelCount,i=o.audioSampleRate,l=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,n,0,16,0,0,0,0,i>>>8&255,255&i,0,0]);return r.box(r.types.mp4a,l,r.esds(o))},r.ac3=function(o){var n=o.channelCount,i=o.audioSampleRate,l=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,n,0,16,0,0,0,0,i>>>8&255,255&i,0,0]);return r.box(r.types["ac-3"],l,r.box(r.types.dac3,new Uint8Array(o.config)))},r.ec3=function(o){var n=o.channelCount,i=o.audioSampleRate,l=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,n,0,16,0,0,0,0,i>>>8&255,255&i,0,0]);return r.box(r.types["ec-3"],l,r.box(r.types.dec3,new Uint8Array(o.config)))},r.esds=function(o){var n=o.config||[],i=n.length,l=new Uint8Array([0,0,0,0,3,23+i,0,1,0,4,15+i,64,21,0,0,0,0,0,0,0,0,0,0,0,5].concat([i]).concat(n).concat([6,1,2]));return r.box(r.types.esds,l)},r.Opus=function(o){var n=o.channelCount,i=o.audioSampleRate,l=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,n,0,16,0,0,0,0,i>>>8&255,255&i,0,0]);return r.box(r.types.Opus,l,r.dOps(o))},r.dOps=function(o){var n=o.channelCount,i=o.channelConfigCode,l=o.audioSampleRate;if(o.config)return r.box(r.types.dOps,o.config);var p=[];switch(i){case 1:case 2:p=[0];break;case 0:p=[255,1,1,0,1];break;case 128:p=[255,2,0,0,1];break;case 3:p=[1,2,1,0,2,1];break;case 4:p=[1,2,2,0,1,2,3];break;case 5:p=[1,3,2,0,4,1,2,3];break;case 6:p=[1,4,2,0,4,1,2,3,5];break;case 7:p=[1,4,2,0,4,1,2,3,5,6];break;case 8:p=[1,5,3,0,6,1,2,3,4,5,7];break;case 130:p=[1,1,2,0,1];break;case 131:p=[1,1,3,0,1,2];break;case 132:p=[1,1,4,0,1,2,3];break;case 133:p=[1,1,5,0,1,2,3,4];break;case 134:p=[1,1,6,0,1,2,3,4,5];break;case 135:p=[1,1,7,0,1,2,3,4,5,6];break;case 136:p=[1,1,8,0,1,2,3,4,5,6,7]}var c=new Uint8Array(Gn([0,n,0,0,l>>>24&255,l>>>17&255,l>>>8&255,l>>>0&255,0,0],p));return r.box(r.types.dOps,c)},r.fLaC=function(o){var n=o.channelCount,i=Math.min(o.audioSampleRate,65535),l=o.sampleSize,p=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,n,0,l,0,0,0,0,i>>>8&255,255&i,0,0]);return r.box(r.types.fLaC,p,r.dfLa(o))},r.dfLa=function(o){var n=new Uint8Array(Gn([0,0,0,0],o.config));return r.box(r.types.dfLa,n)},r.ipcm=function(o){var n=o.channelCount,i=Math.min(o.audioSampleRate,65535),l=o.sampleSize,p=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,n,0,l,0,0,0,0,i>>>8&255,255&i,0,0]);return o.channelCount===1?r.box(r.types.ipcm,p,r.pcmC(o)):r.box(r.types.ipcm,p,r.chnl(o),r.pcmC(o))},r.chnl=function(o){var n=new Uint8Array([0,0,0,0,1,o.channelCount,0,0,0,0,0,0,0,0]);return r.box(r.types.chnl,n)},r.pcmC=function(o){var n=o.littleEndian?1:0,i=o.sampleSize,l=new Uint8Array([0,0,0,0,n,i]);return r.box(r.types.pcmC,l)},r.avc1=function(o){var n=o.avcc,i=o.codecWidth,l=o.codecHeight,p=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,255&i,l>>>8&255,255&l,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return r.box(r.types.avc1,p,r.box(r.types.avcC,n))},r.hvc1=function(o){var n=o.hvcc,i=o.codecWidth,l=o.codecHeight,p=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,255&i,l>>>8&255,255&l,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return r.box(r.types.hvc1,p,r.box(r.types.hvcC,n))},r.av01=function(o){var n=o.av1c,i=o.codecWidth||192,l=o.codecHeight||108,p=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,255&i,l>>>8&255,255&l,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return r.box(r.types.av01,p,r.box(r.types.av1C,n))},r.mvex=function(o){return r.box(r.types.mvex,r.trex(o))},r.trex=function(o){var n=o.id,i=new Uint8Array([0,0,0,0,n>>>24&255,n>>>16&255,n>>>8&255,255&n,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1]);return r.box(r.types.trex,i)},r.moof=function(o,n){return r.box(r.types.moof,r.mfhd(o.sequenceNumber),r.traf(o,n))},r.mfhd=function(o){var n=new Uint8Array([0,0,0,0,o>>>24&255,o>>>16&255,o>>>8&255,255&o]);return r.box(r.types.mfhd,n)},r.traf=function(o,n){var i=o.id,l=r.box(r.types.tfhd,new Uint8Array([0,0,0,0,i>>>24&255,i>>>16&255,i>>>8&255,255&i])),p=r.box(r.types.tfdt,new Uint8Array([0,0,0,0,n>>>24&255,n>>>16&255,n>>>8&255,255&n])),c=r.sdtp(o),v=r.trun(o,c.byteLength+16+16+8+16+8+8);return r.box(r.types.traf,l,p,v,c)},r.sdtp=function(o){for(var n=o.samples||[],i=n.length,l=new Uint8Array(4+i),p=0;p<i;p++){var c=n[p].flags;l[p+4]=c.isLeading<<6|c.dependsOn<<4|c.isDependedOn<<2|c.hasRedundancy}return r.box(r.types.sdtp,l)},r.trun=function(o,n){var i=o.samples||[],l=i.length,p=12+16*l,c=new Uint8Array(p);n+=8+p,c.set([0,0,15,1,l>>>24&255,l>>>16&255,l>>>8&255,255&l,n>>>24&255,n>>>16&255,n>>>8&255,255&n],0);for(var v=0;v<l;v++){var k=i[v].duration,A=i[v].size,U=i[v].flags,M=i[v].cts;c.set([k>>>24&255,k>>>16&255,k>>>8&255,255&k,A>>>24&255,A>>>16&255,A>>>8&255,255&A,U.isLeading<<2|U.dependsOn,U.isDependedOn<<6|U.hasRedundancy<<4|U.isNonSync,0,0,M>>>24&255,M>>>16&255,M>>>8&255,255&M],12+16*v)}return r.box(r.types.trun,c)},r.mdat=function(o){return r.box(r.types.mdat,o)},r}();qn.init();var li=qn,Wn=function(){function r(){}return r.getSilentFrame=function(o,n){if(o==="mp4a.40.2"){if(n===1)return new Uint8Array([0,200,0,128,35,128]);if(n===2)return new Uint8Array([33,0,73,144,2,25,0,35,128]);if(n===3)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,142]);if(n===4)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,128,44,128,8,2,56]);if(n===5)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,56]);if(n===6)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,0,178,0,32,8,224])}else{if(n===1)return new Uint8Array([1,64,34,128,163,78,230,128,186,8,0,0,0,28,6,241,193,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(n===2)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(n===3)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94])}return null},r}(),Bt=f(47),Kn=function(){function r(o){this.TAG="MP4Remuxer",this._config=o,this._isLive=o.isLive===!0,this._dtsBase=-1,this._dtsBaseInited=!1,this._audioDtsBase=1/0,this._videoDtsBase=1/0,this._audioNextDts=void 0,this._videoNextDts=void 0,this._audioStashedLastSample=null,this._videoStashedLastSample=null,this._audioMeta=null,this._videoMeta=null,this._audioSegmentInfoList=new Bt.MediaSegmentInfoList("audio"),this._videoSegmentInfoList=new Bt.MediaSegmentInfoList("video"),this._onInitSegment=null,this._onMediaSegment=null,this._forceFirstIDR=!(!x.default.chrome||!(x.default.version.major<50||x.default.version.major===50&&x.default.version.build<2661)),this._fillSilentAfterSeek=x.default.msedge||x.default.msie,this._mp3UseMpegAudio=!x.default.firefox,this._fillAudioTimestampGap=this._config.fixAudioTimestampGap}return r.prototype.destroy=function(){this._dtsBase=-1,this._dtsBaseInited=!1,this._audioMeta=null,this._videoMeta=null,this._audioSegmentInfoList.clear(),this._audioSegmentInfoList=null,this._videoSegmentInfoList.clear(),this._videoSegmentInfoList=null,this._onInitSegment=null,this._onMediaSegment=null},r.prototype.bindDataSource=function(o){return o.onDataAvailable=this.remux.bind(this),o.onTrackMetadata=this._onTrackMetadataReceived.bind(this),this},Object.defineProperty(r.prototype,"onInitSegment",{get:function(){return this._onInitSegment},set:function(o){this._onInitSegment=o},enumerable:!1,configurable:!0}),Object.defineProperty(r.prototype,"onMediaSegment",{get:function(){return this._onMediaSegment},set:function(o){this._onMediaSegment=o},enumerable:!1,configurable:!0}),r.prototype.insertDiscontinuity=function(){this._audioNextDts=this._videoNextDts=void 0},r.prototype.seek=function(o){this._audioStashedLastSample=null,this._videoStashedLastSample=null,this._videoSegmentInfoList.clear(),this._audioSegmentInfoList.clear()},r.prototype.remux=function(o,n){if(!this._onMediaSegment)throw new P.IllegalStateException("MP4Remuxer: onMediaSegment callback must be specificed!");this._dtsBaseInited||this._calculateDtsBase(o,n),n&&this._remuxVideo(n),o&&this._remuxAudio(o)},r.prototype._onTrackMetadataReceived=function(o,n){var i=null,l="mp4",p=n.codec;if(o==="audio")this._audioMeta=n,n.codec==="mp3"&&this._mp3UseMpegAudio?(l="mpeg",p="",i=new Uint8Array):i=li.generateInitSegment(n);else{if(o!=="video")return;this._videoMeta=n,i=li.generateInitSegment(n)}if(!this._onInitSegment)throw new P.IllegalStateException("MP4Remuxer: onInitSegment callback must be specified!");this._onInitSegment(o,{type:o,data:i.buffer,codec:p,container:"".concat(o,"/").concat(l),mediaDuration:n.duration})},r.prototype._calculateDtsBase=function(o,n){this._dtsBaseInited||(o&&o.samples&&o.samples.length&&(this._audioDtsBase=o.samples[0].dts),n&&n.samples&&n.samples.length&&(this._videoDtsBase=n.samples[0].dts),this._dtsBase=Math.min(this._audioDtsBase,this._videoDtsBase),this._dtsBaseInited=!0)},r.prototype.getTimestampBase=function(){if(this._dtsBaseInited)return this._dtsBase},r.prototype.flushStashedSamples=function(){var o=this._videoStashedLastSample,n=this._audioStashedLastSample,i={type:"video",id:1,sequenceNumber:0,samples:[],length:0};o!=null&&(i.samples.push(o),i.length=o.length);var l={type:"audio",id:2,sequenceNumber:0,samples:[],length:0};n!=null&&(l.samples.push(n),l.length=n.length),this._videoStashedLastSample=null,this._audioStashedLastSample=null,this._remuxVideo(i,!0),this._remuxAudio(l,!0)},r.prototype._remuxAudio=function(o,n){if(this._audioMeta!=null){var i,l=o,p=l.samples,c=void 0,v=-1,k=this._audioMeta.refSampleDuration,A=this._audioMeta.codec==="mp3"&&this._mp3UseMpegAudio,U=this._dtsBaseInited&&this._audioNextDts===void 0,M=!1;if(p&&p.length!==0&&(p.length!==1||n)){var O=0,H=null,J=0;A?(O=0,J=l.length):(O=8,J=8+l.length);var ne=null;if(p.length>1&&(J-=(ne=p.pop()).length),this._audioStashedLastSample!=null){var se=this._audioStashedLastSample;this._audioStashedLastSample=null,p.unshift(se),J+=se.length}ne!=null&&(this._audioStashedLastSample=ne);var he=p[0].dts-this._dtsBase;if(this._audioNextDts)c=he-this._audioNextDts;else if(this._audioSegmentInfoList.isEmpty())c=0,this._fillSilentAfterSeek&&!this._videoSegmentInfoList.isEmpty()&&this._audioMeta.originalCodec!=="mp3"&&(M=!0);else{var Z=this._audioSegmentInfoList.getLastSampleBefore(he);if(Z!=null){var oe=he-(Z.originalDts+Z.duration);oe<=3&&(oe=0),c=he-(Z.dts+Z.duration+oe)}else c=0}if(M){var we=he-c,Le=this._videoSegmentInfoList.getLastSegmentBefore(he);if(Le!=null&&Le.beginDts<we){if(Be=Wn.getSilentFrame(this._audioMeta.originalCodec,this._audioMeta.channelCount)){var me=Le.beginDts,ge=we-Le.beginDts;u.default.v(this.TAG,"InsertPrefixSilentAudio: dts: ".concat(me,", duration: ").concat(ge)),p.unshift({unit:Be,dts:me,pts:me}),J+=Be.byteLength}}else M=!1}for(var ke=[],xe=0;xe<p.length;xe++){var Oe=(se=p[xe]).unit,Ie=se.dts-this._dtsBase,Fe=(me=Ie,!1),He=null,De=0;if(!(Ie<-.001)){if(this._audioMeta.codec!=="mp3"&&k!=null){var Ee=Ie;if(this._audioNextDts&&(Ee=this._audioNextDts),(c=Ie-Ee)<=-3*k){u.default.w(this.TAG,"Dropping 1 audio frame (originalDts: ".concat(Ie," ms ,curRefDts: ").concat(Ee," ms)  due to dtsCorrection: ").concat(c," ms overlap."));continue}if(c>=3*k&&this._fillAudioTimestampGap){Fe=!0;var Be,We=Math.floor(c/k);u.default.w(this.TAG,`Large audio timestamp gap detected, may cause AV sync to drift. Silent frames will be generated to avoid unsync.
`+"originalDts: ".concat(Ie," ms, curRefDts: ").concat(Ee," ms, ")+"dtsCorrection: ".concat(Math.round(c)," ms, generate: ").concat(We," frames")),me=Math.floor(Ee),De=Math.floor(Ee+k)-me,(Be=Wn.getSilentFrame(this._audioMeta.originalCodec,this._audioMeta.channelCount))==null&&(u.default.w(this.TAG,"Unable to generate silent frame for "+"".concat(this._audioMeta.originalCodec," with ").concat(this._audioMeta.channelCount," channels, repeat last frame")),Be=Oe),He=[];for(var Te=0;Te<We;Te++){Ee+=k;var Ke=Math.floor(Ee),dt=Math.floor(Ee+k)-Ke,nt={dts:Ke,pts:Ke,cts:0,unit:Be,size:Be.byteLength,duration:dt,originalDts:Ie,flags:{isLeading:0,dependsOn:1,isDependedOn:0,hasRedundancy:0}};He.push(nt),J+=nt.size}this._audioNextDts=Ee+k}else me=Math.floor(Ee),De=Math.floor(Ee+k)-me,this._audioNextDts=Ee+k}else me=Ie-c,De=xe!==p.length-1?p[xe+1].dts-this._dtsBase-c-me:ne!=null?ne.dts-this._dtsBase-c-me:ke.length>=1?ke[ke.length-1].duration:Math.floor(k),this._audioNextDts=me+De;v===-1&&(v=me),ke.push({dts:me,pts:me,cts:0,unit:se.unit,size:se.unit.byteLength,duration:De,originalDts:Ie,flags:{isLeading:0,dependsOn:1,isDependedOn:0,hasRedundancy:0}}),Fe&&ke.push.apply(ke,He)}}if(ke.length===0)return l.samples=[],void(l.length=0);for(A?H=new Uint8Array(J):((H=new Uint8Array(J))[0]=J>>>24&255,H[1]=J>>>16&255,H[2]=J>>>8&255,H[3]=255&J,H.set(li.types.mdat,4)),xe=0;xe<ke.length;xe++)Oe=ke[xe].unit,H.set(Oe,O),O+=Oe.byteLength;var ct=ke[ke.length-1];i=ct.dts+ct.duration;var Pe=new Bt.MediaSegmentInfo;Pe.beginDts=v,Pe.endDts=i,Pe.beginPts=v,Pe.endPts=i,Pe.originalBeginDts=ke[0].originalDts,Pe.originalEndDts=ct.originalDts+ct.duration,Pe.firstSample=new Bt.SampleInfo(ke[0].dts,ke[0].pts,ke[0].duration,ke[0].originalDts,!1),Pe.lastSample=new Bt.SampleInfo(ct.dts,ct.pts,ct.duration,ct.originalDts,!1),this._isLive||this._audioSegmentInfoList.append(Pe),l.samples=ke,l.sequenceNumber++;var Dt;Dt=A?new Uint8Array:li.moof(l,v),l.samples=[],l.length=0;var Pt={type:"audio",data:this._mergeBoxes(Dt,H).buffer,sampleCount:ke.length,info:Pe};A&&U&&(Pt.timestampOffset=v),this._onMediaSegment("audio",Pt)}}},r.prototype._remuxVideo=function(o,n){if(this._videoMeta!=null){var i,l,p=o,c=p.samples,v=void 0,k=-1,A=-1;if(c&&c.length!==0&&(c.length!==1||n)){var U=8,M=null,O=8+o.length,H=null;if(c.length>1&&(O-=(H=c.pop()).length),this._videoStashedLastSample!=null){var J=this._videoStashedLastSample;this._videoStashedLastSample=null,c.unshift(J),O+=J.length}H!=null&&(this._videoStashedLastSample=H);var ne=c[0].dts-this._dtsBase;if(this._videoNextDts)v=ne-this._videoNextDts;else if(this._videoSegmentInfoList.isEmpty())v=0;else{var se=this._videoSegmentInfoList.getLastSampleBefore(ne);if(se!=null){var he=ne-(se.originalDts+se.duration);he<=3&&(he=0),v=ne-(se.dts+se.duration+he)}else v=0}for(var Z=new Bt.MediaSegmentInfo,oe=[],we=0;we<c.length;we++){var Le=(J=c[we]).dts-this._dtsBase,me=J.isKeyframe,ge=Le-v,ke=J.cts,xe=ge+ke;k===-1&&(k=ge,A=xe);var Oe=0;if(Oe=we!==c.length-1?c[we+1].dts-this._dtsBase-v-ge:H!=null?H.dts-this._dtsBase-v-ge:oe.length>=1?oe[oe.length-1].duration:Math.floor(this._videoMeta.refSampleDuration),me){var Ie=new Bt.SampleInfo(ge,xe,Oe,J.dts,!0);Ie.fileposition=J.fileposition,Z.appendSyncPoint(Ie)}oe.push({dts:ge,pts:xe,cts:ke,units:J.units,size:J.length,isKeyframe:me,duration:Oe,originalDts:Le,flags:{isLeading:0,dependsOn:me?2:1,isDependedOn:me?1:0,hasRedundancy:0,isNonSync:me?0:1}})}for((M=new Uint8Array(O))[0]=O>>>24&255,M[1]=O>>>16&255,M[2]=O>>>8&255,M[3]=255&O,M.set(li.types.mdat,4),we=0;we<oe.length;we++)for(var Fe=oe[we].units;Fe.length;){var He=Fe.shift().data;M.set(He,U),U+=He.byteLength}var De=oe[oe.length-1];if(i=De.dts+De.duration,l=De.pts+De.duration,this._videoNextDts=i,Z.beginDts=k,Z.endDts=i,Z.beginPts=A,Z.endPts=l,Z.originalBeginDts=oe[0].originalDts,Z.originalEndDts=De.originalDts+De.duration,Z.firstSample=new Bt.SampleInfo(oe[0].dts,oe[0].pts,oe[0].duration,oe[0].originalDts,oe[0].isKeyframe),Z.lastSample=new Bt.SampleInfo(De.dts,De.pts,De.duration,De.originalDts,De.isKeyframe),this._isLive||this._videoSegmentInfoList.append(Z),p.samples=oe,p.sequenceNumber++,this._forceFirstIDR){var Ee=oe[0].flags;Ee.dependsOn=2,Ee.isNonSync=0}var Be=li.moof(p,k);p.samples=[],p.length=0,this._onMediaSegment("video",{type:"video",data:this._mergeBoxes(Be,M).buffer,sampleCount:oe.length,info:Z})}}},r.prototype._mergeBoxes=function(o,n){var i=new Uint8Array(o.byteLength+n.byteLength);return i.set(o,0),i.set(n,o.byteLength),i},r}(),ho=f(653),qe=f(726),fo=(f(470),function(){function r(o,n){this.TAG="TransmuxingController",this._emitter=new(b()),this._config=n,o.segments||(o.segments=[{duration:o.duration,filesize:o.filesize,url:o.url}]),typeof o.cors!="boolean"&&(o.cors=!0),typeof o.withCredentials!="boolean"&&(o.withCredentials=!1),this._mediaDataSource=o,this._currentSegmentIndex=0;var i=0;this._mediaDataSource.segments.forEach(function(l){l.timestampBase=i,i+=l.duration,l.cors=o.cors,l.withCredentials=o.withCredentials,n.referrerPolicy&&(l.referrerPolicy=n.referrerPolicy)}),isNaN(i)||this._mediaDataSource.duration===i||(this._mediaDataSource.duration=i),this._mediaInfo=null,this._demuxer=null,this._remuxer=null,this._ioctl=null,this._pendingSeekTime=null,this._pendingResolveSeekPoint=null,this._statisticsReporter=null}return r.prototype.destroy=function(){this._mediaInfo=null,this._mediaDataSource=null,this._statisticsReporter&&this._disableStatisticsReporter(),this._ioctl&&(this._ioctl.destroy(),this._ioctl=null),this._demuxer&&(this._demuxer.destroy(),this._demuxer=null),this._remuxer&&(this._remuxer.destroy(),this._remuxer=null),this._emitter.removeAllListeners(),this._emitter=null},r.prototype.on=function(o,n){this._emitter.addListener(o,n)},r.prototype.off=function(o,n){this._emitter.removeListener(o,n)},r.prototype.start=function(){this._loadSegment(0),this._enableStatisticsReporter()},r.prototype._loadSegment=function(o,n){this._currentSegmentIndex=o;var i=this._mediaDataSource.segments[o],l=this._ioctl=new ho.default(i,this._config,o);l.onError=this._onIOException.bind(this),l.onSeeked=this._onIOSeeked.bind(this),l.onComplete=this._onIOComplete.bind(this),l.onRedirect=this._onIORedirect.bind(this),l.onRecoveredEarlyEof=this._onIORecoveredEarlyEof.bind(this),n?this._demuxer.bindDataSource(this._ioctl):l.onDataArrival=this._onInitChunkArrival.bind(this),l.open(n)},r.prototype.stop=function(){this._internalAbort(),this._disableStatisticsReporter()},r.prototype._internalAbort=function(){this._ioctl&&(this._ioctl.destroy(),this._ioctl=null)},r.prototype.pause=function(){this._ioctl&&this._ioctl.isWorking()&&(this._ioctl.pause(),this._disableStatisticsReporter())},r.prototype.resume=function(){this._ioctl&&this._ioctl.isPaused()&&(this._ioctl.resume(),this._enableStatisticsReporter())},r.prototype.seek=function(o){if(this._mediaInfo!=null&&this._mediaInfo.isSeekable()){var n=this._searchSegmentIndexContains(o);if(n===this._currentSegmentIndex){var i=this._mediaInfo.segments[n];if(i==null)this._pendingSeekTime=o;else{var l=i.getNearestKeyframe(o);this._remuxer.seek(l.milliseconds),this._ioctl.seek(l.fileposition),this._pendingResolveSeekPoint=l.milliseconds}}else{var p=this._mediaInfo.segments[n];p==null?(this._pendingSeekTime=o,this._internalAbort(),this._remuxer.seek(),this._remuxer.insertDiscontinuity(),this._loadSegment(n)):(l=p.getNearestKeyframe(o),this._internalAbort(),this._remuxer.seek(o),this._remuxer.insertDiscontinuity(),this._demuxer.resetMediaInfo(),this._demuxer.timestampBase=this._mediaDataSource.segments[n].timestampBase,this._loadSegment(n,l.fileposition),this._pendingResolveSeekPoint=l.milliseconds,this._reportSegmentMediaInfo(n))}this._enableStatisticsReporter()}},r.prototype._searchSegmentIndexContains=function(o){for(var n=this._mediaDataSource.segments,i=n.length-1,l=0;l<n.length;l++)if(o<n[l].timestampBase){i=l-1;break}return i},r.prototype._onInitChunkArrival=function(o,n){var i=this,l=0;if(n>0)this._demuxer.bindDataSource(this._ioctl),this._demuxer.timestampBase=this._mediaDataSource.segments[this._currentSegmentIndex].timestampBase,l=this._demuxer.parseChunks(o,n);else{var p=null;(p=ue.probe(o)).match&&(this._setupFLVDemuxerRemuxer(p),l=this._demuxer.parseChunks(o,n)),p.match||p.needMoreData||(p=jn.probe(o)).match&&(this._setupTSDemuxerRemuxer(p),l=this._demuxer.parseChunks(o,n)),p.match||p.needMoreData||(p=null,u.default.e(this.TAG,"Non MPEG-TS/FLV, Unsupported media type!"),Promise.resolve().then(function(){i._internalAbort()}),this._emitter.emit(qe.default.DEMUX_ERROR,E.default.FORMAT_UNSUPPORTED,"Non MPEG-TS/FLV, Unsupported media type!"))}return l},r.prototype._setupFLVDemuxerRemuxer=function(o){this._demuxer=new ue(o,this._config),this._remuxer||(this._remuxer=new Kn(this._config));var n=this._mediaDataSource;n.duration==null||isNaN(n.duration)||(this._demuxer.overridedDuration=n.duration),typeof n.hasAudio=="boolean"&&(this._demuxer.overridedHasAudio=n.hasAudio),typeof n.hasVideo=="boolean"&&(this._demuxer.overridedHasVideo=n.hasVideo),this._demuxer.timestampBase=n.segments[this._currentSegmentIndex].timestampBase,this._demuxer.onError=this._onDemuxException.bind(this),this._demuxer.onMediaInfo=this._onMediaInfo.bind(this),this._demuxer.onMetaDataArrived=this._onMetaDataArrived.bind(this),this._demuxer.onScriptDataArrived=this._onScriptDataArrived.bind(this),this._demuxer.onSeiArrived=this._onSEI.bind(this),this._remuxer.bindDataSource(this._demuxer.bindDataSource(this._ioctl)),this._remuxer.onInitSegment=this._onRemuxerInitSegmentArrival.bind(this),this._remuxer.onMediaSegment=this._onRemuxerMediaSegmentArrival.bind(this)},r.prototype._setupTSDemuxerRemuxer=function(o){var n=this._demuxer=new jn(o,this._config);this._remuxer||(this._remuxer=new Kn(this._config)),n.onError=this._onDemuxException.bind(this),n.onMediaInfo=this._onMediaInfo.bind(this),n.onMetaDataArrived=this._onMetaDataArrived.bind(this),n.onTimedID3Metadata=this._onTimedID3Metadata.bind(this),n.onPGSSubtitleData=this._onPGSSubtitle.bind(this),n.onSynchronousKLVMetadata=this._onSynchronousKLVMetadata.bind(this),n.onAsynchronousKLVMetadata=this._onAsynchronousKLVMetadata.bind(this),n.onSMPTE2038Metadata=this._onSMPTE2038Metadata.bind(this),n.onSEI=this._onSEI.bind(this),n.onSCTE35Metadata=this._onSCTE35Metadata.bind(this),n.onPESPrivateDataDescriptor=this._onPESPrivateDataDescriptor.bind(this),n.onPESPrivateData=this._onPESPrivateData.bind(this),this._remuxer.bindDataSource(this._demuxer),this._demuxer.bindDataSource(this._ioctl),this._remuxer.onInitSegment=this._onRemuxerInitSegmentArrival.bind(this),this._remuxer.onMediaSegment=this._onRemuxerMediaSegmentArrival.bind(this)},r.prototype._onMediaInfo=function(o){var n=this;this._mediaInfo==null&&(this._mediaInfo=Object.assign({},o),this._mediaInfo.keyframesIndex=null,this._mediaInfo.segments=[],this._mediaInfo.segmentCount=this._mediaDataSource.segments.length,Object.setPrototypeOf(this._mediaInfo,m.default.prototype));var i=Object.assign({},o);Object.setPrototypeOf(i,m.default.prototype),this._mediaInfo.segments[this._currentSegmentIndex]=i,this._reportSegmentMediaInfo(this._currentSegmentIndex),this._pendingSeekTime!=null&&Promise.resolve().then(function(){var l=n._pendingSeekTime;n._pendingSeekTime=null,n.seek(l)})},r.prototype._onMetaDataArrived=function(o){this._emitter.emit(qe.default.METADATA_ARRIVED,o)},r.prototype._onScriptDataArrived=function(o){this._emitter.emit(qe.default.SCRIPTDATA_ARRIVED,o)},r.prototype._onTimedID3Metadata=function(o){var n=this._remuxer.getTimestampBase();n!=null&&(o.pts!=null&&(o.pts-=n),o.dts!=null&&(o.dts-=n),this._emitter.emit(qe.default.TIMED_ID3_METADATA_ARRIVED,o))},r.prototype._onPGSSubtitle=function(o){var n=this._remuxer.getTimestampBase();n!=null&&(o.pts!=null&&(o.pts-=n),o.dts!=null&&(o.dts-=n),this._emitter.emit(qe.default.PGS_SUBTITLE_ARRIVED,o))},r.prototype._onSynchronousKLVMetadata=function(o){var n=this._remuxer.getTimestampBase();n!=null&&(o.pts!=null&&(o.pts-=n),o.dts!=null&&(o.dts-=n),this._emitter.emit(qe.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,o))},r.prototype._onAsynchronousKLVMetadata=function(o){this._emitter.emit(qe.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,o)},r.prototype._onSMPTE2038Metadata=function(o){var n=this._remuxer.getTimestampBase();n!=null&&(o.pts!=null&&(o.pts-=n),o.dts!=null&&(o.dts-=n),o.nearest_pts!=null&&(o.nearest_pts-=n),this._emitter.emit(qe.default.SMPTE2038_METADATA_ARRIVED,o))},r.prototype._onSEI=function(o){var n=this._remuxer.getTimestampBase();n!=null&&(o.pts!=null&&(o.pts-=n),this._emitter.emit(qe.default.SEI_ARRIVED,o))},r.prototype._onSCTE35Metadata=function(o){var n=this._remuxer.getTimestampBase();n!=null&&(o.pts!=null&&(o.pts-=n),o.nearest_pts!=null&&(o.nearest_pts-=n),this._emitter.emit(qe.default.SCTE35_METADATA_ARRIVED,o))},r.prototype._onPESPrivateDataDescriptor=function(o){this._emitter.emit(qe.default.PES_PRIVATE_DATA_DESCRIPTOR,o)},r.prototype._onPESPrivateData=function(o){var n=this._remuxer.getTimestampBase();n!=null&&(o.pts!=null&&(o.pts-=n),o.nearest_pts!=null&&(o.nearest_pts-=n),o.dts!=null&&(o.dts-=n),this._emitter.emit(qe.default.PES_PRIVATE_DATA_ARRIVED,o))},r.prototype._onIOSeeked=function(){this._remuxer.insertDiscontinuity()},r.prototype._onIOComplete=function(o){var n=o+1;n<this._mediaDataSource.segments.length?(this._internalAbort(),this._remuxer&&this._remuxer.flushStashedSamples(),this._loadSegment(n)):(this._remuxer&&this._remuxer.flushStashedSamples(),this._emitter.emit(qe.default.LOADING_COMPLETE),this._disableStatisticsReporter())},r.prototype._onIORedirect=function(o){var n=this._ioctl.extraData;this._mediaDataSource.segments[n].redirectedURL=o},r.prototype._onIORecoveredEarlyEof=function(){this._emitter.emit(qe.default.RECOVERED_EARLY_EOF)},r.prototype._onIOException=function(o,n){u.default.e(this.TAG,"IOException: type = ".concat(o,", code = ").concat(n.code,", msg = ").concat(n.msg)),this._emitter.emit(qe.default.IO_ERROR,o,n),this._disableStatisticsReporter()},r.prototype._onDemuxException=function(o,n){u.default.e(this.TAG,"DemuxException: type = ".concat(o,", info = ").concat(n)),this._emitter.emit(qe.default.DEMUX_ERROR,o,n)},r.prototype._onRemuxerInitSegmentArrival=function(o,n){this._emitter.emit(qe.default.INIT_SEGMENT,o,n)},r.prototype._onRemuxerMediaSegmentArrival=function(o,n){if(this._pendingSeekTime==null&&(this._emitter.emit(qe.default.MEDIA_SEGMENT,o,n),this._pendingResolveSeekPoint!=null&&o==="video")){var i=n.info.syncPoints,l=this._pendingResolveSeekPoint;this._pendingResolveSeekPoint=null,x.default.safari&&i.length>0&&i[0].originalDts===l&&(l=i[0].pts),this._emitter.emit(qe.default.RECOMMEND_SEEKPOINT,l)}},r.prototype._enableStatisticsReporter=function(){this._statisticsReporter==null&&(this._statisticsReporter=self.setInterval(this._reportStatisticsInfo.bind(this),this._config.statisticsInfoReportInterval))},r.prototype._disableStatisticsReporter=function(){this._statisticsReporter&&(self.clearInterval(this._statisticsReporter),this._statisticsReporter=null)},r.prototype._reportSegmentMediaInfo=function(o){var n=this._mediaInfo.segments[o],i=Object.assign({},n);i.duration=this._mediaInfo.duration,i.segmentCount=this._mediaInfo.segmentCount,delete i.segments,delete i.keyframesIndex,this._emitter.emit(qe.default.MEDIA_INFO,i)},r.prototype._reportStatisticsInfo=function(){var o={};o.url=this._ioctl.currentURL,o.hasRedirect=this._ioctl.hasRedirect,o.hasRedirect&&(o.redirectedURL=this._ioctl.currentRedirectedURL),o.speed=this._ioctl.currentSpeed,o.loaderType=this._ioctl.loaderType,o.currentSegmentIndex=this._currentSegmentIndex,o.totalSegmentCount=this._mediaDataSource.segments.length,this._emitter.emit(qe.default.STATISTICS_INFO,o)},r}())},137:function(h,g,f){f.r(g),f(856);var _=f(947),b=f(811),u=f(886),x=f(726);g.default=function(m){var y=null,S=(function(G,te){m.postMessage({msg:"logcat_callback",data:{type:G,logcat:te}})}).bind(this);function w(G,te){var ye={msg:x.default.INIT_SEGMENT,data:{type:G,data:te}};m.postMessage(ye,[te.data])}function P(G,te){var ye={msg:x.default.MEDIA_SEGMENT,data:{type:G,data:te}};m.postMessage(ye,[te.data])}function $(){var G={msg:x.default.LOADING_COMPLETE};m.postMessage(G)}function z(){var G={msg:x.default.RECOVERED_EARLY_EOF};m.postMessage(G)}function D(G){var te={msg:x.default.MEDIA_INFO,data:G};m.postMessage(te)}function F(G){var te={msg:x.default.METADATA_ARRIVED,data:G};m.postMessage(te)}function E(G){var te={msg:x.default.SCRIPTDATA_ARRIVED,data:G};m.postMessage(te)}function Y(G){var te={msg:x.default.TIMED_ID3_METADATA_ARRIVED,data:G};m.postMessage(te)}function j(G){var te={msg:x.default.PGS_SUBTITLE_ARRIVED,data:G};m.postMessage(te)}function X(G){var te={msg:x.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,data:G};m.postMessage(te)}function V(G){var te={msg:x.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,data:G};m.postMessage(te)}function L(G){var te={msg:x.default.SMPTE2038_METADATA_ARRIVED,data:G};m.postMessage(te)}function C(G){var te={msg:x.default.SEI_ARRIVED,data:G};m.postMessage(te)}function B(G){var te={msg:x.default.SCTE35_METADATA_ARRIVED,data:G};m.postMessage(te)}function T(G){var te={msg:x.default.PES_PRIVATE_DATA_DESCRIPTOR,data:G};m.postMessage(te)}function Q(G){var te={msg:x.default.PES_PRIVATE_DATA_ARRIVED,data:G};m.postMessage(te)}function K(G){var te={msg:x.default.STATISTICS_INFO,data:G};m.postMessage(te)}function ce(G,te){m.postMessage({msg:x.default.IO_ERROR,data:{type:G,info:te}})}function ue(G,te){m.postMessage({msg:x.default.DEMUX_ERROR,data:{type:G,info:te}})}function pe(G){m.postMessage({msg:x.default.RECOMMEND_SEEKPOINT,data:G})}b.default.install(),m.addEventListener("message",function(G){switch(G.data.cmd){case"init":(y=new u.default(G.data.param[0],G.data.param[1])).on(x.default.IO_ERROR,ce.bind(this)),y.on(x.default.DEMUX_ERROR,ue.bind(this)),y.on(x.default.INIT_SEGMENT,w.bind(this)),y.on(x.default.MEDIA_SEGMENT,P.bind(this)),y.on(x.default.LOADING_COMPLETE,$.bind(this)),y.on(x.default.RECOVERED_EARLY_EOF,z.bind(this)),y.on(x.default.MEDIA_INFO,D.bind(this)),y.on(x.default.METADATA_ARRIVED,F.bind(this)),y.on(x.default.SCRIPTDATA_ARRIVED,E.bind(this)),y.on(x.default.TIMED_ID3_METADATA_ARRIVED,Y.bind(this)),y.on(x.default.PGS_SUBTITLE_ARRIVED,j.bind(this)),y.on(x.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,X.bind(this)),y.on(x.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,V.bind(this)),y.on(x.default.SMPTE2038_METADATA_ARRIVED,L.bind(this)),y.on(x.default.SEI_ARRIVED,C.bind(this)),y.on(x.default.SCTE35_METADATA_ARRIVED,B.bind(this)),y.on(x.default.PES_PRIVATE_DATA_DESCRIPTOR,T.bind(this)),y.on(x.default.PES_PRIVATE_DATA_ARRIVED,Q.bind(this)),y.on(x.default.STATISTICS_INFO,K.bind(this)),y.on(x.default.RECOMMEND_SEEKPOINT,pe.bind(this));break;case"destroy":y&&(y.destroy(),y=null),m.postMessage({msg:"destroyed"});break;case"start":y.start();break;case"stop":y.stop();break;case"seek":y.seek(G.data.param);break;case"pause":y.pause();break;case"resume":y.resume();break;case"logging_config":var te=G.data.param;_.default.applyConfig(te),te.enableCallback===!0?_.default.addLogListener(S):_.default.removeLogListener(S)}})}},827:function(h,g,f){f.r(g),g.default={OK:"OK",FORMAT_ERROR:"FormatError",FORMAT_UNSUPPORTED:"FormatUnsupported",CODEC_UNSUPPORTED:"CodecUnsupported"}},976:function(h,g,f){h.exports=f(311).default},653:function(h,g,f){f.r(g),f.d(g,{default:function(){return X}});var _,b=f(856),u=function(){function V(){this._firstCheckpoint=0,this._lastCheckpoint=0,this._intervalBytes=0,this._totalBytes=0,this._lastSecondBytes=0,self.performance&&self.performance.now?this._now=self.performance.now.bind(self.performance):this._now=Date.now}return V.prototype.reset=function(){this._firstCheckpoint=this._lastCheckpoint=0,this._totalBytes=this._intervalBytes=0,this._lastSecondBytes=0},V.prototype.addBytes=function(L){this._firstCheckpoint===0?(this._firstCheckpoint=this._now(),this._lastCheckpoint=this._firstCheckpoint,this._intervalBytes+=L,this._totalBytes+=L):this._now()-this._lastCheckpoint<1e3?(this._intervalBytes+=L,this._totalBytes+=L):(this._lastSecondBytes=this._intervalBytes,this._intervalBytes=L,this._totalBytes+=L,this._lastCheckpoint=this._now())},Object.defineProperty(V.prototype,"currentKBps",{get:function(){this.addBytes(0);var L=(this._now()-this._lastCheckpoint)/1e3;return L==0&&(L=1),this._intervalBytes/L/1024},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"lastSecondKBps",{get:function(){return this.addBytes(0),this._lastSecondBytes!==0?this._lastSecondBytes/1024:this._now()-this._lastCheckpoint>=500?this.currentKBps:0},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"averageKBps",{get:function(){var L=(this._now()-this._firstCheckpoint)/1e3;return this._totalBytes/L/1024},enumerable:!1,configurable:!0}),V}(),x=f(470),m=f(994),y=f(867),S=(_=function(V,L){return _=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(C,B){C.__proto__=B}||function(C,B){for(var T in B)Object.prototype.hasOwnProperty.call(B,T)&&(C[T]=B[T])},_(V,L)},function(V,L){if(typeof L!="function"&&L!==null)throw new TypeError("Class extends value "+String(L)+" is not a constructor or null");function C(){this.constructor=V}_(V,L),V.prototype=L===null?Object.create(L):(C.prototype=L.prototype,new C)}),w=function(V){function L(C,B){var T=V.call(this,"fetch-stream-loader")||this;return T.TAG="FetchStreamLoader",T._seekHandler=C,T._config=B,T._needStash=!0,T._requestAbort=!1,T._abortController=null,T._contentLength=null,T._receivedLength=0,T}return S(L,V),L.isSupported=function(){try{var C=m.default.msedge&&m.default.version.minor>=15048,B=!m.default.msedge||C;return self.fetch&&self.ReadableStream&&B}catch{return!1}},L.prototype.destroy=function(){this.isWorking()&&this.abort(),V.prototype.destroy.call(this)},L.prototype.open=function(C,B){var T=this;this._dataSource=C,this._range=B;var Q=C.url;this._config.reuseRedirectedURL&&C.redirectedURL!=null&&(Q=C.redirectedURL);var K=this._seekHandler.getConfig(Q,B),ce=new self.Headers;if(typeof K.headers=="object"){var ue=K.headers;for(var pe in ue)ue.hasOwnProperty(pe)&&ce.append(pe,ue[pe])}var G={method:"GET",headers:ce,mode:"cors",cache:"default",referrerPolicy:"no-referrer-when-downgrade"};if(typeof this._config.headers=="object")for(var pe in this._config.headers)ce.append(pe,this._config.headers[pe]);C.cors===!1&&(G.mode="same-origin"),C.withCredentials&&(G.credentials="include"),C.referrerPolicy&&(G.referrerPolicy=C.referrerPolicy),self.AbortController&&(this._abortController=new self.AbortController,G.signal=this._abortController.signal),this._status=x.LoaderStatus.kConnecting,self.fetch(K.url,G).then(function(te){if(T._requestAbort)return T._status=x.LoaderStatus.kIdle,void te.body.cancel();if(te.ok&&te.status>=200&&te.status<=299){if(te.url!==K.url&&T._onURLRedirect){var ye=T._seekHandler.removeURLParameters(te.url);T._onURLRedirect(ye)}var le=te.headers.get("Content-Length");return le!=null&&(T._contentLength=parseInt(le),T._contentLength!==0&&T._onContentLengthKnown&&T._onContentLengthKnown(T._contentLength)),T._pump.call(T,te.body.getReader())}if(T._status=x.LoaderStatus.kError,!T._onError)throw new y.RuntimeException("FetchStreamLoader: Http code invalid, "+te.status+" "+te.statusText);T._onError(x.LoaderErrors.HTTP_STATUS_CODE_INVALID,{code:te.status,msg:te.statusText})}).catch(function(te){if(!T._abortController||!T._abortController.signal.aborted){if(T._status=x.LoaderStatus.kError,!T._onError)throw te;T._onError(x.LoaderErrors.EXCEPTION,{code:-1,msg:te.message})}})},L.prototype.abort=function(){if(this._requestAbort=!0,(this._status!==x.LoaderStatus.kBuffering||!m.default.chrome)&&this._abortController)try{this._abortController.abort()}catch{}},L.prototype._pump=function(C){var B=this;return C.read().then(function(T){if(T.done)if(B._contentLength!==null&&B._receivedLength<B._contentLength){B._status=x.LoaderStatus.kError;var Q=x.LoaderErrors.EARLY_EOF,K={code:-1,msg:"Fetch stream meet Early-EOF"};if(!B._onError)throw new y.RuntimeException(K.msg);B._onError(Q,K)}else B._status=x.LoaderStatus.kComplete,B._onComplete&&B._onComplete(B._range.from,B._range.from+B._receivedLength-1);else{if(B._abortController&&B._abortController.signal.aborted)return void(B._status=x.LoaderStatus.kComplete);if(B._requestAbort===!0)return B._status=x.LoaderStatus.kComplete,C.cancel();B._status=x.LoaderStatus.kBuffering;var ce=T.value.buffer,ue=B._range.from+B._receivedLength;B._receivedLength+=ce.byteLength,B._onDataArrival&&B._onDataArrival(ce,ue,B._receivedLength),B._pump(C)}}).catch(function(T){if(B._abortController&&B._abortController.signal.aborted)B._status=x.LoaderStatus.kComplete;else if(T.code!==11||!m.default.msedge){B._status=x.LoaderStatus.kError;var Q=0,K=null;if(T.code!==19&&T.message!=="network error"||!(B._contentLength===null||B._contentLength!==null&&B._receivedLength<B._contentLength)?(Q=x.LoaderErrors.EXCEPTION,K={code:T.code,msg:T.message}):(Q=x.LoaderErrors.EARLY_EOF,K={code:T.code,msg:"Fetch stream meet Early-EOF"}),!B._onError)throw new y.RuntimeException(K.msg);B._onError(Q,K)}})},L}(x.BaseLoader),P=function(){var V=function(L,C){return V=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(B,T){B.__proto__=T}||function(B,T){for(var Q in T)Object.prototype.hasOwnProperty.call(T,Q)&&(B[Q]=T[Q])},V(L,C)};return function(L,C){if(typeof C!="function"&&C!==null)throw new TypeError("Class extends value "+String(C)+" is not a constructor or null");function B(){this.constructor=L}V(L,C),L.prototype=C===null?Object.create(C):(B.prototype=C.prototype,new B)}}(),$=function(V){function L(C,B){var T=V.call(this,"xhr-moz-chunked-loader")||this;return T.TAG="MozChunkedLoader",T._seekHandler=C,T._config=B,T._needStash=!0,T._xhr=null,T._requestAbort=!1,T._contentLength=null,T._receivedLength=0,T}return P(L,V),L.isSupported=function(){try{var C=new XMLHttpRequest;return C.open("GET","https://example.com",!0),C.responseType="moz-chunked-arraybuffer",C.responseType==="moz-chunked-arraybuffer"}catch(B){return b.default.w("MozChunkedLoader",B.message),!1}},L.prototype.destroy=function(){this.isWorking()&&this.abort(),this._xhr&&(this._xhr.onreadystatechange=null,this._xhr.onprogress=null,this._xhr.onloadend=null,this._xhr.onerror=null,this._xhr=null),V.prototype.destroy.call(this)},L.prototype.open=function(C,B){this._dataSource=C,this._range=B;var T=C.url;this._config.reuseRedirectedURL&&C.redirectedURL!=null&&(T=C.redirectedURL);var Q=this._seekHandler.getConfig(T,B);this._requestURL=Q.url;var K=this._xhr=new XMLHttpRequest;if(K.open("GET",Q.url,!0),K.responseType="moz-chunked-arraybuffer",K.onreadystatechange=this._onReadyStateChange.bind(this),K.onprogress=this._onProgress.bind(this),K.onloadend=this._onLoadEnd.bind(this),K.onerror=this._onXhrError.bind(this),C.withCredentials&&(K.withCredentials=!0),typeof Q.headers=="object"){var ce=Q.headers;for(var ue in ce)ce.hasOwnProperty(ue)&&K.setRequestHeader(ue,ce[ue])}if(typeof this._config.headers=="object")for(var ue in ce=this._config.headers)ce.hasOwnProperty(ue)&&K.setRequestHeader(ue,ce[ue]);this._status=x.LoaderStatus.kConnecting,K.send()},L.prototype.abort=function(){this._requestAbort=!0,this._xhr&&this._xhr.abort(),this._status=x.LoaderStatus.kComplete},L.prototype._onReadyStateChange=function(C){var B=C.target;if(B.readyState===2){if(B.responseURL!=null&&B.responseURL!==this._requestURL&&this._onURLRedirect){var T=this._seekHandler.removeURLParameters(B.responseURL);this._onURLRedirect(T)}if(B.status!==0&&(B.status<200||B.status>299)){if(this._status=x.LoaderStatus.kError,!this._onError)throw new y.RuntimeException("MozChunkedLoader: Http code invalid, "+B.status+" "+B.statusText);this._onError(x.LoaderErrors.HTTP_STATUS_CODE_INVALID,{code:B.status,msg:B.statusText})}else this._status=x.LoaderStatus.kBuffering}},L.prototype._onProgress=function(C){if(this._status!==x.LoaderStatus.kError){this._contentLength===null&&C.total!==null&&C.total!==0&&(this._contentLength=C.total,this._onContentLengthKnown&&this._onContentLengthKnown(this._contentLength));var B=C.target.response,T=this._range.from+this._receivedLength;this._receivedLength+=B.byteLength,this._onDataArrival&&this._onDataArrival(B,T,this._receivedLength)}},L.prototype._onLoadEnd=function(C){this._requestAbort!==!0?this._status!==x.LoaderStatus.kError&&(this._status=x.LoaderStatus.kComplete,this._onComplete&&this._onComplete(this._range.from,this._range.from+this._receivedLength-1)):this._requestAbort=!1},L.prototype._onXhrError=function(C){this._status=x.LoaderStatus.kError;var B=0,T=null;if(this._contentLength&&C.loaded<this._contentLength?(B=x.LoaderErrors.EARLY_EOF,T={code:-1,msg:"Moz-Chunked stream meet Early-Eof"}):(B=x.LoaderErrors.EXCEPTION,T={code:-1,msg:C.constructor.name+" "+C.type}),!this._onError)throw new y.RuntimeException(T.msg);this._onError(B,T)},L}(x.BaseLoader),z=function(){var V=function(L,C){return V=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(B,T){B.__proto__=T}||function(B,T){for(var Q in T)Object.prototype.hasOwnProperty.call(T,Q)&&(B[Q]=T[Q])},V(L,C)};return function(L,C){if(typeof C!="function"&&C!==null)throw new TypeError("Class extends value "+String(C)+" is not a constructor or null");function B(){this.constructor=L}V(L,C),L.prototype=C===null?Object.create(C):(B.prototype=C.prototype,new B)}}(),D=function(V){function L(C,B){var T=V.call(this,"xhr-range-loader")||this;return T.TAG="RangeLoader",T._seekHandler=C,T._config=B,T._needStash=!1,T._chunkSizeKBList=[128,256,384,512,768,1024,1536,2048,3072,4096,5120,6144,7168,8192],T._currentChunkSizeKB=384,T._currentSpeedNormalized=0,T._zeroSpeedChunkCount=0,T._xhr=null,T._speedSampler=new u,T._requestAbort=!1,T._waitForTotalLength=!1,T._totalLengthReceived=!1,T._currentRequestURL=null,T._currentRedirectedURL=null,T._currentRequestRange=null,T._totalLength=null,T._contentLength=null,T._receivedLength=0,T._lastTimeLoaded=0,T}return z(L,V),L.isSupported=function(){try{var C=new XMLHttpRequest;return C.open("GET","https://example.com",!0),C.responseType="arraybuffer",C.responseType==="arraybuffer"}catch(B){return b.default.w("RangeLoader",B.message),!1}},L.prototype.destroy=function(){this.isWorking()&&this.abort(),this._xhr&&(this._xhr.onreadystatechange=null,this._xhr.onprogress=null,this._xhr.onload=null,this._xhr.onerror=null,this._xhr=null),V.prototype.destroy.call(this)},Object.defineProperty(L.prototype,"currentSpeed",{get:function(){return this._speedSampler.lastSecondKBps},enumerable:!1,configurable:!0}),L.prototype.open=function(C,B){this._dataSource=C,this._range=B,this._status=x.LoaderStatus.kConnecting;var T=!1;this._dataSource.filesize!=null&&this._dataSource.filesize!==0&&(T=!0,this._totalLength=this._dataSource.filesize),this._totalLengthReceived||T?this._openSubRange():(this._waitForTotalLength=!0,this._internalOpen(this._dataSource,{from:0,to:-1}))},L.prototype._openSubRange=function(){var C=1024*this._currentChunkSizeKB,B=this._range.from+this._receivedLength,T=B+C;this._contentLength!=null&&T-this._range.from>=this._contentLength&&(T=this._range.from+this._contentLength-1),this._currentRequestRange={from:B,to:T},this._internalOpen(this._dataSource,this._currentRequestRange)},L.prototype._internalOpen=function(C,B){this._lastTimeLoaded=0;var T=C.url;this._config.reuseRedirectedURL&&(this._currentRedirectedURL!=null?T=this._currentRedirectedURL:C.redirectedURL!=null&&(T=C.redirectedURL));var Q=this._seekHandler.getConfig(T,B);this._currentRequestURL=Q.url;var K=this._xhr=new XMLHttpRequest;if(K.open("GET",Q.url,!0),K.responseType="arraybuffer",K.onreadystatechange=this._onReadyStateChange.bind(this),K.onprogress=this._onProgress.bind(this),K.onload=this._onLoad.bind(this),K.onerror=this._onXhrError.bind(this),C.withCredentials&&(K.withCredentials=!0),typeof Q.headers=="object"){var ce=Q.headers;for(var ue in ce)ce.hasOwnProperty(ue)&&K.setRequestHeader(ue,ce[ue])}if(typeof this._config.headers=="object")for(var ue in ce=this._config.headers)ce.hasOwnProperty(ue)&&K.setRequestHeader(ue,ce[ue]);K.send()},L.prototype.abort=function(){this._requestAbort=!0,this._internalAbort(),this._status=x.LoaderStatus.kComplete},L.prototype._internalAbort=function(){this._xhr&&(this._xhr.onreadystatechange=null,this._xhr.onprogress=null,this._xhr.onload=null,this._xhr.onerror=null,this._xhr.abort(),this._xhr=null)},L.prototype._onReadyStateChange=function(C){var B=C.target;if(B.readyState===2){if(B.responseURL!=null){var T=this._seekHandler.removeURLParameters(B.responseURL);B.responseURL!==this._currentRequestURL&&T!==this._currentRedirectedURL&&(this._currentRedirectedURL=T,this._onURLRedirect&&this._onURLRedirect(T))}if(B.status>=200&&B.status<=299){if(this._waitForTotalLength)return;this._status=x.LoaderStatus.kBuffering}else{if(this._status=x.LoaderStatus.kError,!this._onError)throw new y.RuntimeException("RangeLoader: Http code invalid, "+B.status+" "+B.statusText);this._onError(x.LoaderErrors.HTTP_STATUS_CODE_INVALID,{code:B.status,msg:B.statusText})}}},L.prototype._onProgress=function(C){if(this._status!==x.LoaderStatus.kError){if(this._contentLength===null){var B=!1;if(this._waitForTotalLength){this._waitForTotalLength=!1,this._totalLengthReceived=!0,B=!0;var T=C.total;this._internalAbort(),T!=null&T!==0&&(this._totalLength=T)}if(this._range.to===-1?this._contentLength=this._totalLength-this._range.from:this._contentLength=this._range.to-this._range.from+1,B)return void this._openSubRange();this._onContentLengthKnown&&this._onContentLengthKnown(this._contentLength)}var Q=C.loaded-this._lastTimeLoaded;this._lastTimeLoaded=C.loaded,this._speedSampler.addBytes(Q)}},L.prototype._normalizeSpeed=function(C){var B=this._chunkSizeKBList,T=B.length-1,Q=0,K=0,ce=T;if(C<B[0])return B[0];for(;K<=ce;){if((Q=K+Math.floor((ce-K)/2))===T||C>=B[Q]&&C<B[Q+1])return B[Q];B[Q]<C?K=Q+1:ce=Q-1}},L.prototype._onLoad=function(C){if(this._status!==x.LoaderStatus.kError)if(this._waitForTotalLength)this._waitForTotalLength=!1;else{this._lastTimeLoaded=0;var B=this._speedSampler.lastSecondKBps;if(B===0&&(this._zeroSpeedChunkCount++,this._zeroSpeedChunkCount>=3&&(B=this._speedSampler.currentKBps)),B!==0){var T=this._normalizeSpeed(B);this._currentSpeedNormalized!==T&&(this._currentSpeedNormalized=T,this._currentChunkSizeKB=T)}var Q=C.target.response,K=this._range.from+this._receivedLength;this._receivedLength+=Q.byteLength;var ce=!1;this._contentLength!=null&&this._receivedLength<this._contentLength?this._openSubRange():ce=!0,this._onDataArrival&&this._onDataArrival(Q,K,this._receivedLength),ce&&(this._status=x.LoaderStatus.kComplete,this._onComplete&&this._onComplete(this._range.from,this._range.from+this._receivedLength-1))}},L.prototype._onXhrError=function(C){this._status=x.LoaderStatus.kError;var B=0,T=null;if(this._contentLength&&this._receivedLength>0&&this._receivedLength<this._contentLength?(B=x.LoaderErrors.EARLY_EOF,T={code:-1,msg:"RangeLoader meet Early-Eof"}):(B=x.LoaderErrors.EXCEPTION,T={code:-1,msg:C.constructor.name+" "+C.type}),!this._onError)throw new y.RuntimeException(T.msg);this._onError(B,T)},L}(x.BaseLoader),F=function(){var V=function(L,C){return V=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(B,T){B.__proto__=T}||function(B,T){for(var Q in T)Object.prototype.hasOwnProperty.call(T,Q)&&(B[Q]=T[Q])},V(L,C)};return function(L,C){if(typeof C!="function"&&C!==null)throw new TypeError("Class extends value "+String(C)+" is not a constructor or null");function B(){this.constructor=L}V(L,C),L.prototype=C===null?Object.create(C):(B.prototype=C.prototype,new B)}}(),E=function(V){function L(){var C=V.call(this,"websocket-loader")||this;return C.TAG="WebSocketLoader",C._needStash=!0,C._ws=null,C._requestAbort=!1,C._receivedLength=0,C}return F(L,V),L.isSupported=function(){try{return self.WebSocket!==void 0}catch{return!1}},L.prototype.destroy=function(){this._ws&&this.abort(),V.prototype.destroy.call(this)},L.prototype.open=function(C){try{var B=this._ws=new self.WebSocket(C.url);B.binaryType="arraybuffer",B.onopen=this._onWebSocketOpen.bind(this),B.onclose=this._onWebSocketClose.bind(this),B.onmessage=this._onWebSocketMessage.bind(this),B.onerror=this._onWebSocketError.bind(this),this._status=x.LoaderStatus.kConnecting}catch(Q){this._status=x.LoaderStatus.kError;var T={code:Q.code,msg:Q.message};if(!this._onError)throw new y.RuntimeException(T.msg);this._onError(x.LoaderErrors.EXCEPTION,T)}},L.prototype.abort=function(){var C=this._ws;!C||C.readyState!==0&&C.readyState!==1||(this._requestAbort=!0,C.close()),this._ws=null,this._status=x.LoaderStatus.kComplete},L.prototype._onWebSocketOpen=function(C){this._status=x.LoaderStatus.kBuffering},L.prototype._onWebSocketClose=function(C){this._requestAbort!==!0?(this._status=x.LoaderStatus.kComplete,this._onComplete&&this._onComplete(0,this._receivedLength-1)):this._requestAbort=!1},L.prototype._onWebSocketMessage=function(C){var B=this;if(C.data instanceof ArrayBuffer)this._dispatchArrayBuffer(C.data);else if(C.data instanceof Blob){var T=new FileReader;T.onload=function(){B._dispatchArrayBuffer(T.result)},T.readAsArrayBuffer(C.data)}else{this._status=x.LoaderStatus.kError;var Q={code:-1,msg:"Unsupported WebSocket message type: "+C.data.constructor.name};if(!this._onError)throw new y.RuntimeException(Q.msg);this._onError(x.LoaderErrors.EXCEPTION,Q)}},L.prototype._dispatchArrayBuffer=function(C){var B=C,T=this._receivedLength;this._receivedLength+=B.byteLength,this._onDataArrival&&this._onDataArrival(B,T,this._receivedLength)},L.prototype._onWebSocketError=function(C){this._status=x.LoaderStatus.kError;var B={code:C.code,msg:C.message};if(!this._onError)throw new y.RuntimeException(B.msg);this._onError(x.LoaderErrors.EXCEPTION,B)},L}(x.BaseLoader),Y=function(){function V(L){this._zeroStart=L||!1}return V.prototype.getConfig=function(L,C){var B={};if(C.from!==0||C.to!==-1){var T;T=C.to!==-1?"bytes=".concat(C.from.toString(),"-").concat(C.to.toString()):"bytes=".concat(C.from.toString(),"-"),B.Range=T}else this._zeroStart&&(B.Range="bytes=0-");return{url:L,headers:B}},V.prototype.removeURLParameters=function(L){return L},V}(),j=function(){function V(L,C){this._startName=L,this._endName=C}return V.prototype.getConfig=function(L,C){var B=L;if(C.from!==0||C.to!==-1){var T=!0;B.indexOf("?")===-1&&(B+="?",T=!1),T&&(B+="&"),B+="".concat(this._startName,"=").concat(C.from.toString()),C.to!==-1&&(B+="&".concat(this._endName,"=").concat(C.to.toString()))}return{url:B,headers:{}}},V.prototype.removeURLParameters=function(L){var C=L.split("?")[0],B=void 0,T=L.indexOf("?");T!==-1&&(B=L.substring(T+1));var Q="";if(B!=null&&B.length>0)for(var K=B.split("&"),ce=0;ce<K.length;ce++){var ue=K[ce].split("="),pe=ce>0;ue[0]!==this._startName&&ue[0]!==this._endName&&(pe&&(Q+="&"),Q+=K[ce])}return Q.length===0?C:C+"?"+Q},V}(),X=function(){function V(L,C,B){this.TAG="IOController",this._config=C,this._extraData=B,this._stashInitialSize=65536,C.stashInitialSize!=null&&C.stashInitialSize>0&&(this._stashInitialSize=C.stashInitialSize),this._stashUsed=0,this._stashSize=this._stashInitialSize,this._bufferSize=Math.max(this._stashSize,3145728),this._stashBuffer=new ArrayBuffer(this._bufferSize),this._stashByteStart=0,this._enableStash=!0,C.enableStashBuffer===!1&&(this._enableStash=!1),this._loader=null,this._loaderClass=null,this._seekHandler=null,this._dataSource=L,this._isWebSocketURL=/wss?:\/\/(.+?)/.test(L.url),this._refTotalLength=L.filesize?L.filesize:null,this._totalLength=this._refTotalLength,this._fullRequestFlag=!1,this._currentRange=null,this._redirectedURL=null,this._speedNormalized=0,this._speedSampler=new u,this._speedNormalizeList=[32,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096],this._isEarlyEofReconnecting=!1,this._paused=!1,this._resumeFrom=0,this._onDataArrival=null,this._onSeeked=null,this._onError=null,this._onComplete=null,this._onRedirect=null,this._onRecoveredEarlyEof=null,this._selectSeekHandler(),this._selectLoader(),this._createLoader()}return V.prototype.destroy=function(){this._loader.isWorking()&&this._loader.abort(),this._loader.destroy(),this._loader=null,this._loaderClass=null,this._dataSource=null,this._stashBuffer=null,this._stashUsed=this._stashSize=this._bufferSize=this._stashByteStart=0,this._currentRange=null,this._speedSampler=null,this._isEarlyEofReconnecting=!1,this._onDataArrival=null,this._onSeeked=null,this._onError=null,this._onComplete=null,this._onRedirect=null,this._onRecoveredEarlyEof=null,this._extraData=null},V.prototype.isWorking=function(){return this._loader&&this._loader.isWorking()&&!this._paused},V.prototype.isPaused=function(){return this._paused},Object.defineProperty(V.prototype,"status",{get:function(){return this._loader.status},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"extraData",{get:function(){return this._extraData},set:function(L){this._extraData=L},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"onDataArrival",{get:function(){return this._onDataArrival},set:function(L){this._onDataArrival=L},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"onSeeked",{get:function(){return this._onSeeked},set:function(L){this._onSeeked=L},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"onError",{get:function(){return this._onError},set:function(L){this._onError=L},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"onComplete",{get:function(){return this._onComplete},set:function(L){this._onComplete=L},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"onRedirect",{get:function(){return this._onRedirect},set:function(L){this._onRedirect=L},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"onRecoveredEarlyEof",{get:function(){return this._onRecoveredEarlyEof},set:function(L){this._onRecoveredEarlyEof=L},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"currentURL",{get:function(){return this._dataSource.url},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"hasRedirect",{get:function(){return this._redirectedURL!=null||this._dataSource.redirectedURL!=null},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"currentRedirectedURL",{get:function(){return this._redirectedURL||this._dataSource.redirectedURL},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"currentSpeed",{get:function(){return this._loaderClass===D?this._loader.currentSpeed:this._speedSampler.lastSecondKBps},enumerable:!1,configurable:!0}),Object.defineProperty(V.prototype,"loaderType",{get:function(){return this._loader.type},enumerable:!1,configurable:!0}),V.prototype._selectSeekHandler=function(){var L=this._config;if(L.seekType==="range")this._seekHandler=new Y(this._config.rangeLoadZeroStart);else if(L.seekType==="param"){var C=L.seekParamStart||"bstart",B=L.seekParamEnd||"bend";this._seekHandler=new j(C,B)}else{if(L.seekType!=="custom")throw new y.InvalidArgumentException("Invalid seekType in config: ".concat(L.seekType));if(typeof L.customSeekHandler!="function")throw new y.InvalidArgumentException("Custom seekType specified in config but invalid customSeekHandler!");this._seekHandler=new L.customSeekHandler}},V.prototype._selectLoader=function(){if(this._config.customLoader!=null)this._loaderClass=this._config.customLoader;else if(this._isWebSocketURL)this._loaderClass=E;else if(w.isSupported())this._loaderClass=w;else if($.isSupported())this._loaderClass=$;else{if(!D.isSupported())throw new y.RuntimeException("Your browser doesn't support xhr with arraybuffer responseType!");this._loaderClass=D}},V.prototype._createLoader=function(){this._loader=new this._loaderClass(this._seekHandler,this._config),this._loader.needStashBuffer===!1&&(this._enableStash=!1),this._loader.onContentLengthKnown=this._onContentLengthKnown.bind(this),this._loader.onURLRedirect=this._onURLRedirect.bind(this),this._loader.onDataArrival=this._onLoaderChunkArrival.bind(this),this._loader.onComplete=this._onLoaderComplete.bind(this),this._loader.onError=this._onLoaderError.bind(this)},V.prototype.open=function(L){this._currentRange={from:0,to:-1},L&&(this._currentRange.from=L),this._speedSampler.reset(),L||(this._fullRequestFlag=!0),this._loader.open(this._dataSource,Object.assign({},this._currentRange))},V.prototype.abort=function(){this._loader.abort(),this._paused&&(this._paused=!1,this._resumeFrom=0)},V.prototype.pause=function(){this.isWorking()&&(this._loader.abort(),this._stashUsed!==0?(this._resumeFrom=this._stashByteStart,this._currentRange.to=this._stashByteStart-1):this._resumeFrom=this._currentRange.to+1,this._stashUsed=0,this._stashByteStart=0,this._paused=!0)},V.prototype.resume=function(){if(this._paused){this._paused=!1;var L=this._resumeFrom;this._resumeFrom=0,this._internalSeek(L,!0)}},V.prototype.seek=function(L){this._paused=!1,this._stashUsed=0,this._stashByteStart=0,this._internalSeek(L,!0)},V.prototype._internalSeek=function(L,C){this._loader.isWorking()&&this._loader.abort(),this._flushStashBuffer(C),this._loader.destroy(),this._loader=null;var B={from:L,to:-1};this._currentRange={from:B.from,to:-1},this._speedSampler.reset(),this._stashSize=this._stashInitialSize,this._createLoader(),this._loader.open(this._dataSource,B),this._onSeeked&&this._onSeeked()},V.prototype.updateUrl=function(L){if(!L||typeof L!="string"||L.length===0)throw new y.InvalidArgumentException("Url must be a non-empty string!");this._dataSource.url=L},V.prototype._expandBuffer=function(L){for(var C=this._stashSize;C+1048576<L;)C*=2;if((C+=1048576)!==this._bufferSize){var B=new ArrayBuffer(C);if(this._stashUsed>0){var T=new Uint8Array(this._stashBuffer,0,this._stashUsed);new Uint8Array(B,0,C).set(T,0)}this._stashBuffer=B,this._bufferSize=C}},V.prototype._normalizeSpeed=function(L){var C=this._speedNormalizeList,B=C.length-1,T=0,Q=0,K=B;if(L<C[0])return C[0];for(;Q<=K;){if((T=Q+Math.floor((K-Q)/2))===B||L>=C[T]&&L<C[T+1])return C[T];C[T]<L?Q=T+1:K=T-1}},V.prototype._adjustStashSize=function(L){var C=0;(C=this._config.isLive?L/8:L<512?L:L>=512&&L<=1024?Math.floor(1.5*L):2*L)>8192&&(C=8192);var B=1024*C+1048576;this._bufferSize<B&&this._expandBuffer(B),this._stashSize=1024*C},V.prototype._dispatchChunks=function(L,C){return this._currentRange.to=C+L.byteLength-1,this._onDataArrival(L,C)},V.prototype._onURLRedirect=function(L){this._redirectedURL=L,this._onRedirect&&this._onRedirect(L)},V.prototype._onContentLengthKnown=function(L){L&&this._fullRequestFlag&&(this._totalLength=L,this._fullRequestFlag=!1)},V.prototype._onLoaderChunkArrival=function(L,C,B){if(!this._onDataArrival)throw new y.IllegalStateException("IOController: No existing consumer (onDataArrival) callback!");if(!this._paused){this._isEarlyEofReconnecting&&(this._isEarlyEofReconnecting=!1,this._onRecoveredEarlyEof&&this._onRecoveredEarlyEof()),this._speedSampler.addBytes(L.byteLength);var T=this._speedSampler.lastSecondKBps;if(T!==0){var Q=this._normalizeSpeed(T);this._speedNormalized!==Q&&(this._speedNormalized=Q,this._adjustStashSize(Q))}if(this._enableStash)if(this._stashUsed===0&&this._stashByteStart===0&&(this._stashByteStart=C),this._stashUsed+L.byteLength<=this._stashSize)(ue=new Uint8Array(this._stashBuffer,0,this._stashSize)).set(new Uint8Array(L),this._stashUsed),this._stashUsed+=L.byteLength;else if(ue=new Uint8Array(this._stashBuffer,0,this._bufferSize),this._stashUsed>0){var K=this._stashBuffer.slice(0,this._stashUsed);(pe=this._dispatchChunks(K,this._stashByteStart))<K.byteLength?pe>0&&(G=new Uint8Array(K,pe),ue.set(G,0),this._stashUsed=G.byteLength,this._stashByteStart+=pe):(this._stashUsed=0,this._stashByteStart+=pe),this._stashUsed+L.byteLength>this._bufferSize&&(this._expandBuffer(this._stashUsed+L.byteLength),ue=new Uint8Array(this._stashBuffer,0,this._bufferSize)),ue.set(new Uint8Array(L),this._stashUsed),this._stashUsed+=L.byteLength}else(pe=this._dispatchChunks(L,C))<L.byteLength&&((ce=L.byteLength-pe)>this._bufferSize&&(this._expandBuffer(ce),ue=new Uint8Array(this._stashBuffer,0,this._bufferSize)),ue.set(new Uint8Array(L,pe),0),this._stashUsed+=ce,this._stashByteStart=C+pe);else if(this._stashUsed===0){var ce;(pe=this._dispatchChunks(L,C))<L.byteLength&&((ce=L.byteLength-pe)>this._bufferSize&&this._expandBuffer(ce),(ue=new Uint8Array(this._stashBuffer,0,this._bufferSize)).set(new Uint8Array(L,pe),0),this._stashUsed+=ce,this._stashByteStart=C+pe)}else{var ue,pe;if(this._stashUsed+L.byteLength>this._bufferSize&&this._expandBuffer(this._stashUsed+L.byteLength),(ue=new Uint8Array(this._stashBuffer,0,this._bufferSize)).set(new Uint8Array(L),this._stashUsed),this._stashUsed+=L.byteLength,(pe=this._dispatchChunks(this._stashBuffer.slice(0,this._stashUsed),this._stashByteStart))<this._stashUsed&&pe>0){var G=new Uint8Array(this._stashBuffer,pe);ue.set(G,0)}this._stashUsed-=pe,this._stashByteStart+=pe}}},V.prototype._flushStashBuffer=function(L){if(this._stashUsed>0){var C=this._stashBuffer.slice(0,this._stashUsed),B=this._dispatchChunks(C,this._stashByteStart),T=C.byteLength-B;if(B<C.byteLength){if(!L){if(B>0){var Q=new Uint8Array(this._stashBuffer,0,this._bufferSize),K=new Uint8Array(C,B);Q.set(K,0),this._stashUsed=K.byteLength,this._stashByteStart+=B}return 0}b.default.w(this.TAG,"".concat(T," bytes unconsumed data remain when flush buffer, dropped"))}return this._stashUsed=0,this._stashByteStart=0,T}return 0},V.prototype._onLoaderComplete=function(L,C){this._flushStashBuffer(!0),this._onComplete&&this._onComplete(this._extraData)},V.prototype._onLoaderError=function(L,C){switch(b.default.e(this.TAG,"Loader error, code = ".concat(C.code,", msg = ").concat(C.msg)),this._flushStashBuffer(!1),this._isEarlyEofReconnecting&&(this._isEarlyEofReconnecting=!1,L=x.LoaderErrors.UNRECOVERABLE_EARLY_EOF),L){case x.LoaderErrors.EARLY_EOF:if(!this._config.isLive&&this._totalLength){var B=this._currentRange.to+1;return void(B<this._totalLength&&(b.default.w(this.TAG,"Connection lost, trying reconnect..."),this._isEarlyEofReconnecting=!0,this._internalSeek(B,!1)))}L=x.LoaderErrors.UNRECOVERABLE_EARLY_EOF;case x.LoaderErrors.UNRECOVERABLE_EARLY_EOF:case x.LoaderErrors.CONNECTING_TIMEOUT:case x.LoaderErrors.HTTP_STATUS_CODE_INVALID:case x.LoaderErrors.EXCEPTION:}if(!this._onError)throw new y.RuntimeException("IOException: "+C.msg);this._onError(L,C)},V}()},470:function(h,g,f){f.r(g),f.d(g,{BaseLoader:function(){return x},LoaderErrors:function(){return u},LoaderStatus:function(){return b}});var _=f(867),b={kIdle:0,kConnecting:1,kBuffering:2,kError:3,kComplete:4},u={OK:"OK",EXCEPTION:"Exception",HTTP_STATUS_CODE_INVALID:"HttpStatusCodeInvalid",CONNECTING_TIMEOUT:"ConnectingTimeout",EARLY_EOF:"EarlyEof",UNRECOVERABLE_EARLY_EOF:"UnrecoverableEarlyEof"},x=function(){function m(y){this._type=y||"undefined",this._status=b.kIdle,this._needStash=!1,this._onContentLengthKnown=null,this._onURLRedirect=null,this._onDataArrival=null,this._onError=null,this._onComplete=null}return m.prototype.destroy=function(){this._status=b.kIdle,this._onContentLengthKnown=null,this._onURLRedirect=null,this._onDataArrival=null,this._onError=null,this._onComplete=null},m.prototype.isWorking=function(){return this._status===b.kConnecting||this._status===b.kBuffering},Object.defineProperty(m.prototype,"type",{get:function(){return this._type},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"status",{get:function(){return this._status},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"needStashBuffer",{get:function(){return this._needStash},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"onContentLengthKnown",{get:function(){return this._onContentLengthKnown},set:function(y){this._onContentLengthKnown=y},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"onURLRedirect",{get:function(){return this._onURLRedirect},set:function(y){this._onURLRedirect=y},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"onDataArrival",{get:function(){return this._onDataArrival},set:function(y){this._onDataArrival=y},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"onError",{get:function(){return this._onError},set:function(y){this._onError=y},enumerable:!1,configurable:!0}),Object.defineProperty(m.prototype,"onComplete",{get:function(){return this._onComplete},set:function(y){this._onComplete=y},enumerable:!1,configurable:!0}),m.prototype.open=function(y,S){throw new _.NotImplementedException("Unimplemented abstract function!")},m.prototype.abort=function(){throw new _.NotImplementedException("Unimplemented abstract function!")},m}()},311:function(h,g,f){f.r(g),f.d(g,{default:function(){return Ae}});var _=f(811),b=f(653),u={enableWorker:!1,enableWorkerForMSE:!1,enableStashBuffer:!0,stashInitialSize:void 0,isLive:!1,liveBufferLatencyChasing:!1,liveBufferLatencyChasingOnPaused:!1,liveBufferLatencyMaxLatency:1.5,liveBufferLatencyMinRemain:.5,liveSync:!1,liveSyncMaxLatency:1.2,liveSyncTargetLatency:.8,liveSyncPlaybackRate:1.2,lazyLoad:!0,lazyLoadMaxDuration:180,lazyLoadRecoverDuration:30,deferLoadAfterSourceOpen:!0,autoCleanupMaxBackwardDuration:180,autoCleanupMinBackwardDuration:120,statisticsInfoReportInterval:600,fixAudioTimestampGap:!0,accurateSeek:!1,seekType:"range",seekParamStart:"bstart",seekParamEnd:"bend",rangeLoadZeroStart:!1,customSeekHandler:void 0,reuseRedirectedURL:!1,headers:void 0,customLoader:void 0};function x(){return Object.assign({},u)}var m=function(){function q(){}return q.supportMSEH264Playback=function(){var R='video/mp4; codecs="avc1.42E01E,mp4a.40.2"',W=self.MediaSource&&self.MediaSource.isTypeSupported(R),ae=self.ManagedMediaSource&&self.ManagedMediaSource.isTypeSupported(R);return W||ae},q.supportMSEH265Playback=function(){var R='video/mp4; codecs="hvc1.1.6.L93.B0"',W=self.MediaSource&&self.MediaSource.isTypeSupported(R),ae=self.ManagedMediaSource&&self.ManagedMediaSource.isTypeSupported(R);return W||ae},q.supportNetworkStreamIO=function(){var R=new b.default({},x()),W=R.loaderType;return R.destroy(),W=="fetch-stream-loader"||W=="xhr-moz-chunked-loader"},q.getNetworkLoaderTypeName=function(){var R=new b.default({},x()),W=R.loaderType;return R.destroy(),W},q.supportNativeMediaPlayback=function(R){q.videoElement==null&&(q.videoElement=window.document.createElement("video"));var W=q.videoElement.canPlayType(R);return W==="probably"||W=="maybe"},q.getFeatureList=function(){var R={msePlayback:!1,mseLivePlayback:!1,mseH265Playback:!1,networkStreamIO:!1,networkLoaderName:"",nativeMP4H264Playback:!1,nativeMP4H265Playback:!1,nativeWebmVP8Playback:!1,nativeWebmVP9Playback:!1};return R.msePlayback=q.supportMSEH264Playback(),R.networkStreamIO=q.supportNetworkStreamIO(),R.networkLoaderName=q.getNetworkLoaderTypeName(),R.mseLivePlayback=R.msePlayback&&R.networkStreamIO,R.mseH265Playback=q.supportMSEH265Playback(),R.nativeMP4H264Playback=q.supportNativeMediaPlayback('video/mp4; codecs="avc1.42001E, mp4a.40.2"'),R.nativeMP4H265Playback=q.supportNativeMediaPlayback('video/mp4; codecs="hvc1.1.6.L93.B0"'),R.nativeWebmVP8Playback=q.supportNativeMediaPlayback('video/webm; codecs="vp8.0, vorbis"'),R.nativeWebmVP9Playback=q.supportNativeMediaPlayback('video/webm; codecs="vp9"'),R},q}(),y=m,S=f(470),w=f(856),P=f(7),$=f.n(P),z=f(346),D=f(117),F=f(527),E=f(403),Y=f(355),j=f(867),X=f(726),V=f(994),L=f(47),C=function(){function q(R,W,ae){this.TAG="SeekingHandler",this._config=null,this._media_element=null,this._always_seek_keyframe=!1,this._on_unbuffered_seek=null,this._request_set_current_time=!1,this._seek_request_record_clocktime=null,this._idr_sample_list=new L.IDRSampleList,this.e=null,this._config=R,this._media_element=W,this._on_unbuffered_seek=ae,this.e={onMediaSeeking:this._onMediaSeeking.bind(this)};var Se=V.default.chrome&&(V.default.version.major<50||V.default.version.major===50&&V.default.version.build<2661);this._always_seek_keyframe=!!(Se||V.default.msedge||V.default.msie),this._always_seek_keyframe&&(this._config.accurateSeek=!1),this._media_element.addEventListener("seeking",this.e.onMediaSeeking)}return q.prototype.destroy=function(){this._idr_sample_list.clear(),this._idr_sample_list=null,this._media_element.removeEventListener("seeking",this.e.onMediaSeeking),this._media_element=null,this._on_unbuffered_seek=null},q.prototype.seek=function(R){var W=this._isPositionBuffered(R),ae=!1;if(R<1&&this._media_element.buffered.length>0){var Se=this._media_element.buffered.start(0);(Se<1&&R<Se||V.default.safari)&&(ae=!0,R=V.default.safari?.1:Se)}if(ae)this.directSeek(R);else if(W)if(this._always_seek_keyframe){var _e=this._getNearestKeyframe(Math.floor(1e3*R));_e!=null&&(R=_e.dts/1e3),this.directSeek(R)}else this.directSeek(R);else this._idr_sample_list.clear(),this._on_unbuffered_seek(Math.floor(1e3*R)),this._config.accurateSeek&&this.directSeek(R)},q.prototype.directSeek=function(R){this._request_set_current_time=!0,this._media_element.currentTime=R},q.prototype.appendSyncPoints=function(R){this._idr_sample_list.appendArray(R)},q.prototype._onMediaSeeking=function(R){if(this._request_set_current_time)this._request_set_current_time=!1;else{var W=this._media_element.currentTime,ae=this._media_element.buffered;if(W<1&&ae.length>0){var Se=ae.start(0);if(Se<1&&W<Se||V.default.safari){var _e=V.default.safari?.1:Se;return void this.directSeek(_e)}}if(this._isPositionBuffered(W)){if(this._always_seek_keyframe){var ee=this._getNearestKeyframe(Math.floor(1e3*W));ee!=null&&(W=ee.dts/1e3,this.directSeek(W))}}else this._seek_request_record_clocktime=q._getClockTime(),window.setTimeout(this._pollAndApplyUnbufferedSeek.bind(this),50)}},q.prototype._pollAndApplyUnbufferedSeek=function(){if(this._seek_request_record_clocktime!=null)if(this._seek_request_record_clocktime<=q._getClockTime()-100){var R=this._media_element.currentTime;this._seek_request_record_clocktime=null,this._isPositionBuffered(R)||(this._idr_sample_list.clear(),this._on_unbuffered_seek(Math.floor(1e3*R)),this._config.accurateSeek&&this.directSeek(R))}else window.setTimeout(this._pollAndApplyUnbufferedSeek.bind(this),50)},q.prototype._isPositionBuffered=function(R){for(var W=this._media_element.buffered,ae=0;ae<W.length;ae++){var Se=W.start(ae),_e=W.end(ae);if(R>=Se&&R<_e)return!0}return!1},q.prototype._getNearestKeyframe=function(R){return this._idr_sample_list.getLastSyncPointBeforeDts(R)},q._getClockTime=function(){return self.performance&&self.performance.now?self.performance.now():Date.now()},q}(),B=function(){function q(R,W,ae,Se){this.TAG="LoadingController",this._config=null,this._media_element=null,this._on_pause_transmuxer=null,this._on_resume_transmuxer=null,this._paused=!1,this.e=null,this._config=R,this._media_element=W,this._on_pause_transmuxer=ae,this._on_resume_transmuxer=Se,this.e={onMediaTimeUpdate:this._onMediaTimeUpdate.bind(this)}}return q.prototype.destroy=function(){this._media_element.removeEventListener("timeupdate",this.e.onMediaTimeUpdate),this.e=null,this._media_element=null,this._config=null,this._on_pause_transmuxer=null,this._on_resume_transmuxer=null},q.prototype.notifyBufferedPositionChanged=function(R){!this._config.isLive&&this._config.lazyLoad&&(R==null?this._suspendTransmuxerIfNeeded():this._suspendTransmuxerIfBufferedPositionExceeded(R))},q.prototype._onMediaTimeUpdate=function(R){this._paused&&this._resumeTransmuxerIfNeeded()},q.prototype._suspendTransmuxerIfNeeded=function(){for(var R=this._media_element.buffered,W=this._media_element.currentTime,ae=0,Se=0;Se<R.length;Se++){var _e=R.start(Se),ee=R.end(Se);if(_e<=W&&W<ee){ae=ee;break}}ae>0&&this._suspendTransmuxerIfBufferedPositionExceeded(ae)},q.prototype._suspendTransmuxerIfBufferedPositionExceeded=function(R){R>=this._media_element.currentTime+this._config.lazyLoadMaxDuration&&!this._paused&&(w.default.v(this.TAG,"Maximum buffering duration exceeded, suspend transmuxing task"),this.suspendTransmuxer(),this._media_element.addEventListener("timeupdate",this.e.onMediaTimeUpdate))},q.prototype.suspendTransmuxer=function(){this._paused=!0,this._on_pause_transmuxer()},q.prototype._resumeTransmuxerIfNeeded=function(){for(var R=this._media_element.buffered,W=this._media_element.currentTime,ae=this._config.lazyLoadRecoverDuration,Se=!1,_e=0;_e<R.length;_e++){var ee=R.start(_e),de=R.end(_e);if(W>=ee&&W<de){W>=de-ae&&(Se=!0);break}}Se&&(w.default.v(this.TAG,"Continue loading from paused position"),this.resumeTransmuxer(),this._media_element.removeEventListener("timeupdate",this.e.onMediaTimeUpdate))},q.prototype.resumeTransmuxer=function(){this._paused=!1,this._on_resume_transmuxer()},q}(),T=function(){function q(R,W){this.TAG="StartupStallJumper",this._media_element=null,this._on_direct_seek=null,this._canplay_received=!1,this.e=null,this._media_element=R,this._on_direct_seek=W,this.e={onMediaCanPlay:this._onMediaCanPlay.bind(this),onMediaStalled:this._onMediaStalled.bind(this),onMediaProgress:this._onMediaProgress.bind(this)},this._media_element.addEventListener("canplay",this.e.onMediaCanPlay),this._media_element.addEventListener("stalled",this.e.onMediaStalled),this._media_element.addEventListener("progress",this.e.onMediaProgress)}return q.prototype.destroy=function(){this._media_element.removeEventListener("canplay",this.e.onMediaCanPlay),this._media_element.removeEventListener("stalled",this.e.onMediaStalled),this._media_element.removeEventListener("progress",this.e.onMediaProgress),this._media_element=null,this._on_direct_seek=null},q.prototype._onMediaCanPlay=function(R){this._canplay_received=!0,this._media_element.removeEventListener("canplay",this.e.onMediaCanPlay)},q.prototype._onMediaStalled=function(R){this._detectAndFixStuckPlayback(!0)},q.prototype._onMediaProgress=function(R){this._detectAndFixStuckPlayback()},q.prototype._detectAndFixStuckPlayback=function(R){var W=this._media_element,ae=W.buffered;R||!this._canplay_received||W.readyState<2?ae.length>0&&W.currentTime<ae.start(0)&&(w.default.w(this.TAG,"Playback seems stuck at ".concat(W.currentTime,", seek to ").concat(ae.start(0))),this._on_direct_seek(ae.start(0)),this._media_element.removeEventListener("progress",this.e.onMediaProgress)):this._media_element.removeEventListener("progress",this.e.onMediaProgress)},q}(),Q=function(){function q(R,W,ae){this._config=null,this._media_element=null,this._on_direct_seek=null,this._config=R,this._media_element=W,this._on_direct_seek=ae}return q.prototype.destroy=function(){this._on_direct_seek=null,this._media_element=null,this._config=null},q.prototype.notifyBufferedRangeUpdate=function(){this._chaseLiveLatency()},q.prototype._chaseLiveLatency=function(){var R=this._media_element.buffered,W=this._media_element.currentTime,ae=this._media_element.paused;if(this._config.isLive&&this._config.liveBufferLatencyChasing&&R.length!=0&&(this._config.liveBufferLatencyChasingOnPaused||!ae)){var Se=R.end(R.length-1);if(Se>this._config.liveBufferLatencyMaxLatency&&Se-W>this._config.liveBufferLatencyMaxLatency){var _e=Se-this._config.liveBufferLatencyMinRemain;this._on_direct_seek(_e)}}},q}(),K=function(){function q(R,W){this._config=null,this._media_element=null,this.e=null,this._config=R,this._media_element=W,this.e={onMediaTimeUpdate:this._onMediaTimeUpdate.bind(this)},this._media_element.addEventListener("timeupdate",this.e.onMediaTimeUpdate)}return q.prototype.destroy=function(){this._media_element.removeEventListener("timeupdate",this.e.onMediaTimeUpdate),this._media_element=null,this._config=null},q.prototype._onMediaTimeUpdate=function(R){if(this._config.isLive&&this._config.liveSync){var W=this._getCurrentLatency();if(W>this._config.liveSyncMaxLatency){var ae=Math.min(2,Math.max(1,this._config.liveSyncPlaybackRate));this._media_element.playbackRate=ae}else W>this._config.liveSyncTargetLatency||this._media_element.playbackRate!==1&&this._media_element.playbackRate!==0&&(this._media_element.playbackRate=1)}},q.prototype._getCurrentLatency=function(){if(!this._media_element)return 0;var R=this._media_element.buffered,W=this._media_element.currentTime;return R.length==0?0:R.end(R.length-1)-W},q}(),ce=function(){function q(R,W){this.TAG="PlayerEngineMainThread",this._emitter=new P,this._media_element=null,this._mse_controller=null,this._transmuxer=null,this._pending_seek_time=null,this._seeking_handler=null,this._loading_controller=null,this._startup_stall_jumper=null,this._live_latency_chaser=null,this._live_latency_synchronizer=null,this._mse_source_opened=!1,this._has_pending_load=!1,this._loaded_metadata_received=!1,this._media_info=null,this._statistics_info=null,this.e=null,this._media_data_source=R,this._config=x(),typeof W=="object"&&Object.assign(this._config,W),R.isLive===!0&&(this._config.isLive=!0),this.e={onMediaLoadedMetadata:this._onMediaLoadedMetadata.bind(this)}}return q.prototype.destroy=function(){this._emitter.emit(D.default.DESTROYING),this._transmuxer&&this.unload(),this._media_element&&this.detachMediaElement(),this.e=null,this._media_data_source=null,this._emitter.removeAllListeners(),this._emitter=null},q.prototype.on=function(R,W){var ae=this;this._emitter.addListener(R,W),R===D.default.MEDIA_INFO&&this._media_info?Promise.resolve().then(function(){return ae._emitter.emit(D.default.MEDIA_INFO,ae.mediaInfo)}):R==D.default.STATISTICS_INFO&&this._statistics_info&&Promise.resolve().then(function(){return ae._emitter.emit(D.default.STATISTICS_INFO,ae.statisticsInfo)})},q.prototype.off=function(R,W){this._emitter.removeListener(R,W)},q.prototype.attachMediaElement=function(R){var W=this;this._media_element=R,R.src="",R.removeAttribute("src"),R.srcObject=null,R.load(),R.addEventListener("loadedmetadata",this.e.onMediaLoadedMetadata),this._mse_controller=new z.default(this._config),this._mse_controller.on(E.default.UPDATE_END,this._onMSEUpdateEnd.bind(this)),this._mse_controller.on(E.default.BUFFER_FULL,this._onMSEBufferFull.bind(this)),this._mse_controller.on(E.default.SOURCE_OPEN,this._onMSESourceOpen.bind(this)),this._mse_controller.on(E.default.ERROR,this._onMSEError.bind(this)),this._mse_controller.on(E.default.START_STREAMING,this._onMSEStartStreaming.bind(this)),this._mse_controller.on(E.default.END_STREAMING,this._onMSEEndStreaming.bind(this)),this._mse_controller.initialize({getCurrentTime:function(){return W._media_element.currentTime},getReadyState:function(){return W._media_element.readyState}}),this._mse_controller.isManagedMediaSource()?(R.disableRemotePlayback=!0,R.srcObject=this._mse_controller.getObject()):R.src=this._mse_controller.getObjectURL()},q.prototype.detachMediaElement=function(){this._media_element&&(this._mse_controller.shutdown(),this._media_element.removeEventListener("loadedmetadata",this.e.onMediaLoadedMetadata),this._media_element.src="",this._media_element.removeAttribute("src"),this._media_element.srcObject=null,this._media_element.load(),this._media_element=null,this._mse_controller.revokeObjectURL()),this._mse_controller&&(this._mse_controller.destroy(),this._mse_controller=null)},q.prototype.load=function(){var R=this;if(!this._media_element)throw new j.IllegalStateException("HTMLMediaElement must be attached before load()!");if(this._transmuxer)throw new j.IllegalStateException("load() has been called, please call unload() first!");this._has_pending_load||(!this._config.deferLoadAfterSourceOpen||this._mse_source_opened?(this._transmuxer=new F.default(this._media_data_source,this._config),this._transmuxer.on(X.default.INIT_SEGMENT,function(W,ae){R._mse_controller.appendInitSegment(ae)}),this._transmuxer.on(X.default.MEDIA_SEGMENT,function(W,ae){R._mse_controller.appendMediaSegment(ae),!R._config.isLive&&W==="video"&&ae.data&&ae.data.byteLength>0&&"info"in ae&&R._seeking_handler.appendSyncPoints(ae.info.syncPoints),R._loading_controller.notifyBufferedPositionChanged(ae.info.endDts/1e3)}),this._transmuxer.on(X.default.LOADING_COMPLETE,function(){R._mse_controller.endOfStream(),R._emitter.emit(D.default.LOADING_COMPLETE)}),this._transmuxer.on(X.default.RECOVERED_EARLY_EOF,function(){R._emitter.emit(D.default.RECOVERED_EARLY_EOF)}),this._transmuxer.on(X.default.IO_ERROR,function(W,ae){R._emitter.emit(D.default.ERROR,Y.ErrorTypes.NETWORK_ERROR,W,ae)}),this._transmuxer.on(X.default.DEMUX_ERROR,function(W,ae){R._emitter.emit(D.default.ERROR,Y.ErrorTypes.MEDIA_ERROR,W,ae)}),this._transmuxer.on(X.default.MEDIA_INFO,function(W){R._media_info=W,R._emitter.emit(D.default.MEDIA_INFO,Object.assign({},W))}),this._transmuxer.on(X.default.STATISTICS_INFO,function(W){R._statistics_info=R._fillStatisticsInfo(W),R._emitter.emit(D.default.STATISTICS_INFO,Object.assign({},W))}),this._transmuxer.on(X.default.RECOMMEND_SEEKPOINT,function(W){R._media_element&&!R._config.accurateSeek&&R._seeking_handler.directSeek(W/1e3)}),this._transmuxer.on(X.default.METADATA_ARRIVED,function(W){R._emitter.emit(D.default.METADATA_ARRIVED,W)}),this._transmuxer.on(X.default.SCRIPTDATA_ARRIVED,function(W){R._emitter.emit(D.default.SCRIPTDATA_ARRIVED,W)}),this._transmuxer.on(X.default.TIMED_ID3_METADATA_ARRIVED,function(W){R._emitter.emit(D.default.TIMED_ID3_METADATA_ARRIVED,W)}),this._transmuxer.on(X.default.PGS_SUBTITLE_ARRIVED,function(W){R._emitter.emit(D.default.PGS_SUBTITLE_ARRIVED,W)}),this._transmuxer.on(X.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,function(W){R._emitter.emit(D.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,W)}),this._transmuxer.on(X.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,function(W){R._emitter.emit(D.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,W)}),this._transmuxer.on(X.default.SMPTE2038_METADATA_ARRIVED,function(W){R._emitter.emit(D.default.SMPTE2038_METADATA_ARRIVED,W)}),this._transmuxer.on(X.default.SEI_ARRIVED,function(W){R._emitter.emit(D.default.SEI_ARRIVED,W)}),this._transmuxer.on(X.default.SCTE35_METADATA_ARRIVED,function(W){R._emitter.emit(D.default.SCTE35_METADATA_ARRIVED,W)}),this._transmuxer.on(X.default.PES_PRIVATE_DATA_DESCRIPTOR,function(W){R._emitter.emit(D.default.PES_PRIVATE_DATA_DESCRIPTOR,W)}),this._transmuxer.on(X.default.PES_PRIVATE_DATA_ARRIVED,function(W){R._emitter.emit(D.default.PES_PRIVATE_DATA_ARRIVED,W)}),this._seeking_handler=new C(this._config,this._media_element,this._onRequiredUnbufferedSeek.bind(this)),this._loading_controller=new B(this._config,this._media_element,this._onRequestPauseTransmuxer.bind(this),this._onRequestResumeTransmuxer.bind(this)),this._startup_stall_jumper=new T(this._media_element,this._onRequestDirectSeek.bind(this)),this._config.isLive&&this._config.liveBufferLatencyChasing&&(this._live_latency_chaser=new Q(this._config,this._media_element,this._onRequestDirectSeek.bind(this))),this._config.isLive&&this._config.liveSync&&(this._live_latency_synchronizer=new K(this._config,this._media_element)),this._media_element.readyState>0&&this._seeking_handler.directSeek(0),this._transmuxer.open()):this._has_pending_load=!0)},q.prototype.unload=function(){var R,W,ae,Se,_e,ee,de,fe,ve;(R=this._media_element)===null||R===void 0||R.pause(),(W=this._live_latency_synchronizer)===null||W===void 0||W.destroy(),this._live_latency_synchronizer=null,(ae=this._live_latency_chaser)===null||ae===void 0||ae.destroy(),this._live_latency_chaser=null,(Se=this._startup_stall_jumper)===null||Se===void 0||Se.destroy(),this._startup_stall_jumper=null,(_e=this._loading_controller)===null||_e===void 0||_e.destroy(),this._loading_controller=null,(ee=this._seeking_handler)===null||ee===void 0||ee.destroy(),this._seeking_handler=null,(de=this._mse_controller)===null||de===void 0||de.flush(),(fe=this._transmuxer)===null||fe===void 0||fe.close(),(ve=this._transmuxer)===null||ve===void 0||ve.destroy(),this._transmuxer=null},q.prototype.play=function(){return this._media_element.play()},q.prototype.pause=function(){this._media_element.pause()},q.prototype.seek=function(R){this._media_element&&this._seeking_handler?this._seeking_handler.seek(R):this._pending_seek_time=R},Object.defineProperty(q.prototype,"mediaInfo",{get:function(){return Object.assign({},this._media_info)},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"statisticsInfo",{get:function(){return Object.assign({},this._statistics_info)},enumerable:!1,configurable:!0}),q.prototype._onMSESourceOpen=function(){this._mse_source_opened=!0,this._has_pending_load&&(this._has_pending_load=!1,this.load())},q.prototype._onMSEUpdateEnd=function(){this._config.isLive&&this._config.liveBufferLatencyChasing&&this._live_latency_chaser&&this._live_latency_chaser.notifyBufferedRangeUpdate(),this._loading_controller.notifyBufferedPositionChanged()},q.prototype._onMSEBufferFull=function(){w.default.v(this.TAG,"MSE SourceBuffer is full, suspend transmuxing task"),this._loading_controller.suspendTransmuxer()},q.prototype._onMSEError=function(R){this._emitter.emit(D.default.ERROR,Y.ErrorTypes.MEDIA_ERROR,Y.ErrorDetails.MEDIA_MSE_ERROR,R)},q.prototype._onMSEStartStreaming=function(){this._loaded_metadata_received&&(this._config.isLive||(w.default.v(this.TAG,"Resume transmuxing task due to ManagedMediaSource onStartStreaming"),this._loading_controller.resumeTransmuxer()))},q.prototype._onMSEEndStreaming=function(){this._config.isLive||(w.default.v(this.TAG,"Suspend transmuxing task due to ManagedMediaSource onEndStreaming"),this._loading_controller.suspendTransmuxer())},q.prototype._onMediaLoadedMetadata=function(R){this._loaded_metadata_received=!0,this._pending_seek_time!=null&&(this._seeking_handler.seek(this._pending_seek_time),this._pending_seek_time=null)},q.prototype._onRequestDirectSeek=function(R){this._seeking_handler.directSeek(R)},q.prototype._onRequiredUnbufferedSeek=function(R){this._mse_controller.flush(),this._transmuxer.seek(R)},q.prototype._onRequestPauseTransmuxer=function(){this._transmuxer.pause()},q.prototype._onRequestResumeTransmuxer=function(){this._transmuxer.resume()},q.prototype._fillStatisticsInfo=function(R){if(R.playerType="MSEPlayer",!(this._media_element instanceof HTMLVideoElement))return R;var W=!0,ae=0,Se=0;if(this._media_element.getVideoPlaybackQuality){var _e=this._media_element.getVideoPlaybackQuality();ae=_e.totalVideoFrames,Se=_e.droppedVideoFrames}else this._media_element.webkitDecodedFrameCount!=null?(ae=this._media_element.webkitDecodedFrameCount,Se=this._media_element.webkitDroppedFrameCount):W=!1;return W&&(R.decodedFrames=ae,R.droppedFrames=Se),R},q}(),ue=f(861),pe=f(947),G=function(){function q(R,W){this.TAG="PlayerEngineDedicatedThread",this._emitter=new P,this._media_element=null,this._worker_destroying=!1,this._seeking_handler=null,this._loading_controller=null,this._startup_stall_jumper=null,this._live_latency_chaser=null,this._live_latency_synchronizer=null,this._pending_seek_time=null,this._media_info=null,this._statistics_info=null,this.e=null,this._media_data_source=R,this._config=x(),typeof W=="object"&&Object.assign(this._config,W),R.isLive===!0&&(this._config.isLive=!0),this.e={onLoggingConfigChanged:this._onLoggingConfigChanged.bind(this),onMediaLoadedMetadata:this._onMediaLoadedMetadata.bind(this),onMediaTimeUpdate:this._onMediaTimeUpdate.bind(this),onMediaReadyStateChanged:this._onMediaReadyStateChange.bind(this)},pe.default.registerListener(this.e.onLoggingConfigChanged),this._worker=ue(877,{all:!0}),this._worker.addEventListener("message",this._onWorkerMessage.bind(this)),this._worker.postMessage({cmd:"init",media_data_source:this._media_data_source,config:this._config}),this._worker.postMessage({cmd:"logging_config",logging_config:pe.default.getConfig()})}return q.isSupported=function(){return!!(self.Worker&&(self.MediaSource&&"canConstructInDedicatedWorker"in self.MediaSource&&self.MediaSource.canConstructInDedicatedWorker===!0||self.ManagedMediaSource&&"canConstructInDedicatedWorker"in self.ManagedMediaSource&&self.ManagedMediaSource.canConstructInDedicatedWorker===!0))},q.prototype.destroy=function(){this._emitter.emit(D.default.DESTROYING),this.unload(),this.detachMediaElement(),this._worker_destroying=!0,this._worker.postMessage({cmd:"destroy"}),pe.default.removeListener(this.e.onLoggingConfigChanged),this.e=null,this._media_data_source=null,this._emitter.removeAllListeners(),this._emitter=null},q.prototype.on=function(R,W){var ae=this;this._emitter.addListener(R,W),R===D.default.MEDIA_INFO&&this._media_info?Promise.resolve().then(function(){return ae._emitter.emit(D.default.MEDIA_INFO,ae.mediaInfo)}):R==D.default.STATISTICS_INFO&&this._statistics_info&&Promise.resolve().then(function(){return ae._emitter.emit(D.default.STATISTICS_INFO,ae.statisticsInfo)})},q.prototype.off=function(R,W){this._emitter.removeListener(R,W)},q.prototype.attachMediaElement=function(R){this._media_element=R,this._media_element.src="",this._media_element.removeAttribute("src"),this._media_element.srcObject=null,this._media_element.load(),this._media_element.addEventListener("loadedmetadata",this.e.onMediaLoadedMetadata),this._media_element.addEventListener("timeupdate",this.e.onMediaTimeUpdate),this._media_element.addEventListener("readystatechange",this.e.onMediaReadyStateChanged),this._worker.postMessage({cmd:"initialize_mse"})},q.prototype.detachMediaElement=function(){this._worker.postMessage({cmd:"shutdown_mse"}),this._media_element&&(this._media_element.removeEventListener("loadedmetadata",this.e.onMediaLoadedMetadata),this._media_element.removeEventListener("timeupdate",this.e.onMediaTimeUpdate),this._media_element.removeEventListener("readystatechange",this.e.onMediaReadyStateChanged),this._media_element.src="",this._media_element.removeAttribute("src"),this._media_element.srcObject=null,this._media_element.load(),this._media_element=null)},q.prototype.load=function(){this._worker.postMessage({cmd:"load"}),this._seeking_handler=new C(this._config,this._media_element,this._onRequiredUnbufferedSeek.bind(this)),this._loading_controller=new B(this._config,this._media_element,this._onRequestPauseTransmuxer.bind(this),this._onRequestResumeTransmuxer.bind(this)),this._startup_stall_jumper=new T(this._media_element,this._onRequestDirectSeek.bind(this)),this._config.isLive&&this._config.liveBufferLatencyChasing&&(this._live_latency_chaser=new Q(this._config,this._media_element,this._onRequestDirectSeek.bind(this))),this._config.isLive&&this._config.liveSync&&(this._live_latency_synchronizer=new K(this._config,this._media_element)),this._media_element.readyState>0&&this._seeking_handler.directSeek(0)},q.prototype.unload=function(){var R,W,ae,Se,_e,ee;(R=this._media_element)===null||R===void 0||R.pause(),this._worker.postMessage({cmd:"unload"}),(W=this._live_latency_synchronizer)===null||W===void 0||W.destroy(),this._live_latency_synchronizer=null,(ae=this._live_latency_chaser)===null||ae===void 0||ae.destroy(),this._live_latency_chaser=null,(Se=this._startup_stall_jumper)===null||Se===void 0||Se.destroy(),this._startup_stall_jumper=null,(_e=this._loading_controller)===null||_e===void 0||_e.destroy(),this._loading_controller=null,(ee=this._seeking_handler)===null||ee===void 0||ee.destroy(),this._seeking_handler=null},q.prototype.play=function(){return this._media_element.play()},q.prototype.pause=function(){this._media_element.pause()},q.prototype.seek=function(R){this._media_element&&this._seeking_handler?this._seeking_handler.seek(R):this._pending_seek_time=R},Object.defineProperty(q.prototype,"mediaInfo",{get:function(){return Object.assign({},this._media_info)},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"statisticsInfo",{get:function(){return Object.assign({},this._statistics_info)},enumerable:!1,configurable:!0}),q.prototype._onLoggingConfigChanged=function(R){var W;(W=this._worker)===null||W===void 0||W.postMessage({cmd:"logging_config",logging_config:R})},q.prototype._onMSEUpdateEnd=function(){this._config.isLive&&this._config.liveBufferLatencyChasing&&this._live_latency_chaser&&this._live_latency_chaser.notifyBufferedRangeUpdate(),this._loading_controller.notifyBufferedPositionChanged()},q.prototype._onMSEBufferFull=function(){w.default.v(this.TAG,"MSE SourceBuffer is full, suspend transmuxing task"),this._loading_controller.suspendTransmuxer()},q.prototype._onMediaLoadedMetadata=function(R){this._pending_seek_time!=null&&(this._seeking_handler.seek(this._pending_seek_time),this._pending_seek_time=null)},q.prototype._onRequestDirectSeek=function(R){this._seeking_handler.directSeek(R)},q.prototype._onRequiredUnbufferedSeek=function(R){this._worker.postMessage({cmd:"unbuffered_seek",milliseconds:R})},q.prototype._onRequestPauseTransmuxer=function(){this._worker.postMessage({cmd:"pause_transmuxer"})},q.prototype._onRequestResumeTransmuxer=function(){this._worker.postMessage({cmd:"resume_transmuxer"})},q.prototype._onMediaTimeUpdate=function(R){this._worker.postMessage({cmd:"timeupdate",current_time:R.target.currentTime})},q.prototype._onMediaReadyStateChange=function(R){this._worker.postMessage({cmd:"readystatechange",ready_state:R.target.readyState})},q.prototype._onWorkerMessage=function(R){var W,ae=R.data,Se=ae.msg;if(Se=="destroyed"||this._worker_destroying)return this._worker_destroying=!1,(W=this._worker)===null||W===void 0||W.terminate(),void(this._worker=null);switch(Se){case"mse_init":var _e=ae;typeof self.ManagedMediaSource=="function"&&typeof self.MediaSource!="function"&&(this._media_element.disableRemotePlayback=!0),this._media_element.srcObject=_e.handle;break;case"mse_event":(_e=ae).event==E.default.UPDATE_END?this._onMSEUpdateEnd():_e.event==E.default.BUFFER_FULL&&this._onMSEBufferFull();break;case"transmuxing_event":if((_e=ae).event==X.default.MEDIA_INFO){var ee=ae;this._media_info=ee.info,this._emitter.emit(D.default.MEDIA_INFO,Object.assign({},ee.info))}else if(_e.event==X.default.STATISTICS_INFO){var de=ae;this._statistics_info=this._fillStatisticsInfo(de.info),this._emitter.emit(D.default.STATISTICS_INFO,Object.assign({},de.info))}else if(_e.event==X.default.RECOMMEND_SEEKPOINT){var fe=ae;this._media_element&&!this._config.accurateSeek&&this._seeking_handler.directSeek(fe.milliseconds/1e3)}break;case"player_event":if((_e=ae).event==D.default.ERROR){var ve=ae;this._emitter.emit(D.default.ERROR,ve.error_type,ve.error_detail,ve.info)}else if("extraData"in _e){var be=ae;this._emitter.emit(be.event,be.extraData)}break;case"logcat_callback":_e=ae,w.default.emitter.emit("log",_e.type,_e.logcat);break;case"buffered_position_changed":_e=ae,this._loading_controller.notifyBufferedPositionChanged(_e.buffered_position_milliseconds/1e3)}},q.prototype._fillStatisticsInfo=function(R){if(R.playerType="MSEPlayer",!(this._media_element instanceof HTMLVideoElement))return R;var W=!0,ae=0,Se=0;if(this._media_element.getVideoPlaybackQuality){var _e=this._media_element.getVideoPlaybackQuality();ae=_e.totalVideoFrames,Se=_e.droppedVideoFrames}else this._media_element.webkitDecodedFrameCount!=null?(ae=this._media_element.webkitDecodedFrameCount,Se=this._media_element.webkitDroppedFrameCount):W=!1;return W&&(R.decodedFrames=ae,R.droppedFrames=Se),R},q}(),te=function(){function q(R,W){this.TAG="MSEPlayer",this._type="MSEPlayer",this._media_element=null,this._player_engine=null;var ae=R.type.toLowerCase();if(ae!=="mse"&&ae!=="mpegts"&&ae!=="m2ts"&&ae!=="flv")throw new j.InvalidArgumentException("MSEPlayer requires an mpegts/m2ts/flv MediaDataSource input!");if(W&&W.enableWorkerForMSE&&G.isSupported())try{this._player_engine=new G(R,W)}catch{w.default.e(this.TAG,"Error while initializing PlayerEngineDedicatedThread, fallback to PlayerEngineMainThread"),this._player_engine=new ce(R,W)}else this._player_engine=new ce(R,W)}return q.prototype.destroy=function(){this._player_engine.destroy(),this._player_engine=null,this._media_element=null},q.prototype.on=function(R,W){this._player_engine.on(R,W)},q.prototype.off=function(R,W){this._player_engine.off(R,W)},q.prototype.attachMediaElement=function(R){this._media_element=R,this._player_engine.attachMediaElement(R)},q.prototype.detachMediaElement=function(){this._media_element=null,this._player_engine.detachMediaElement()},q.prototype.load=function(){this._player_engine.load()},q.prototype.unload=function(){this._player_engine.unload()},q.prototype.play=function(){return this._player_engine.play()},q.prototype.pause=function(){this._player_engine.pause()},Object.defineProperty(q.prototype,"type",{get:function(){return this._type},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"buffered",{get:function(){return this._media_element.buffered},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"duration",{get:function(){return this._media_element.duration},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"volume",{get:function(){return this._media_element.volume},set:function(R){this._media_element.volume=R},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"muted",{get:function(){return this._media_element.muted},set:function(R){this._media_element.muted=R},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"currentTime",{get:function(){return this._media_element?this._media_element.currentTime:0},set:function(R){this._player_engine.seek(R)},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"mediaInfo",{get:function(){return this._player_engine.mediaInfo},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"statisticsInfo",{get:function(){return this._player_engine.statisticsInfo},enumerable:!1,configurable:!0}),q}(),ye=function(){function q(R,W){this.TAG="NativePlayer",this._type="NativePlayer",this._emitter=new($()),this._config=x(),typeof W=="object"&&Object.assign(this._config,W);var ae=R.type.toLowerCase();if(ae==="mse"||ae==="mpegts"||ae==="m2ts"||ae==="flv")throw new j.InvalidArgumentException("NativePlayer does't support mse/mpegts/m2ts/flv MediaDataSource input!");if(R.hasOwnProperty("segments"))throw new j.InvalidArgumentException("NativePlayer(".concat(R.type,") doesn't support multipart playback!"));this.e={onvLoadedMetadata:this._onvLoadedMetadata.bind(this)},this._pendingSeekTime=null,this._statisticsReporter=null,this._mediaDataSource=R,this._mediaElement=null}return q.prototype.destroy=function(){this._emitter.emit(D.default.DESTROYING),this._mediaElement&&(this.unload(),this.detachMediaElement()),this.e=null,this._mediaDataSource=null,this._emitter.removeAllListeners(),this._emitter=null},q.prototype.on=function(R,W){var ae=this;R===D.default.MEDIA_INFO?this._mediaElement!=null&&this._mediaElement.readyState!==0&&Promise.resolve().then(function(){ae._emitter.emit(D.default.MEDIA_INFO,ae.mediaInfo)}):R===D.default.STATISTICS_INFO&&this._mediaElement!=null&&this._mediaElement.readyState!==0&&Promise.resolve().then(function(){ae._emitter.emit(D.default.STATISTICS_INFO,ae.statisticsInfo)}),this._emitter.addListener(R,W)},q.prototype.off=function(R,W){this._emitter.removeListener(R,W)},q.prototype.attachMediaElement=function(R){if(this._mediaElement=R,R.addEventListener("loadedmetadata",this.e.onvLoadedMetadata),this._pendingSeekTime!=null)try{R.currentTime=this._pendingSeekTime,this._pendingSeekTime=null}catch{}},q.prototype.detachMediaElement=function(){this._mediaElement&&(this._mediaElement.src="",this._mediaElement.removeAttribute("src"),this._mediaElement.removeEventListener("loadedmetadata",this.e.onvLoadedMetadata),this._mediaElement=null),this._statisticsReporter!=null&&(window.clearInterval(this._statisticsReporter),this._statisticsReporter=null)},q.prototype.load=function(){if(!this._mediaElement)throw new j.IllegalStateException("HTMLMediaElement must be attached before load()!");this._mediaElement.src=this._mediaDataSource.url,this._mediaElement.readyState>0&&(this._mediaElement.currentTime=0),this._mediaElement.preload="auto",this._mediaElement.load(),this._statisticsReporter=window.setInterval(this._reportStatisticsInfo.bind(this),this._config.statisticsInfoReportInterval)},q.prototype.unload=function(){this._mediaElement&&(this._mediaElement.src="",this._mediaElement.removeAttribute("src")),this._statisticsReporter!=null&&(window.clearInterval(this._statisticsReporter),this._statisticsReporter=null)},q.prototype.play=function(){return this._mediaElement.play()},q.prototype.pause=function(){this._mediaElement.pause()},Object.defineProperty(q.prototype,"type",{get:function(){return this._type},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"buffered",{get:function(){return this._mediaElement.buffered},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"duration",{get:function(){return this._mediaElement.duration},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"volume",{get:function(){return this._mediaElement.volume},set:function(R){this._mediaElement.volume=R},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"muted",{get:function(){return this._mediaElement.muted},set:function(R){this._mediaElement.muted=R},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"currentTime",{get:function(){return this._mediaElement?this._mediaElement.currentTime:0},set:function(R){this._mediaElement?this._mediaElement.currentTime=R:this._pendingSeekTime=R},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"mediaInfo",{get:function(){var R={mimeType:(this._mediaElement instanceof HTMLAudioElement?"audio/":"video/")+this._mediaDataSource.type};return this._mediaElement&&(R.duration=Math.floor(1e3*this._mediaElement.duration),this._mediaElement instanceof HTMLVideoElement&&(R.width=this._mediaElement.videoWidth,R.height=this._mediaElement.videoHeight)),R},enumerable:!1,configurable:!0}),Object.defineProperty(q.prototype,"statisticsInfo",{get:function(){var R={playerType:this._type,url:this._mediaDataSource.url};if(!(this._mediaElement instanceof HTMLVideoElement))return R;var W=!0,ae=0,Se=0;if(this._mediaElement.getVideoPlaybackQuality){var _e=this._mediaElement.getVideoPlaybackQuality();ae=_e.totalVideoFrames,Se=_e.droppedVideoFrames}else this._mediaElement.webkitDecodedFrameCount!=null?(ae=this._mediaElement.webkitDecodedFrameCount,Se=this._mediaElement.webkitDroppedFrameCount):W=!1;return W&&(R.decodedFrames=ae,R.droppedFrames=Se),R},enumerable:!1,configurable:!0}),q.prototype._onvLoadedMetadata=function(R){this._pendingSeekTime!=null&&(this._mediaElement.currentTime=this._pendingSeekTime,this._pendingSeekTime=null),this._emitter.emit(D.default.MEDIA_INFO,this.mediaInfo)},q.prototype._reportStatisticsInfo=function(){this._emitter.emit(D.default.STATISTICS_INFO,this.statisticsInfo)},q}();_.default.install();var le={createPlayer:function(q,R){var W=q;if(W==null||typeof W!="object")throw new j.InvalidArgumentException("MediaDataSource must be an javascript object!");if(!W.hasOwnProperty("type"))throw new j.InvalidArgumentException("MediaDataSource must has type field to indicate video file type!");switch(W.type){case"mse":case"mpegts":case"m2ts":case"flv":return new te(W,R);default:return new ye(W,R)}},isSupported:function(){return y.supportMSEH264Playback()},getFeatureList:function(){return y.getFeatureList()}};le.BaseLoader=S.BaseLoader,le.LoaderStatus=S.LoaderStatus,le.LoaderErrors=S.LoaderErrors,le.Events=D.default,le.ErrorTypes=Y.ErrorTypes,le.ErrorDetails=Y.ErrorDetails,le.MSEPlayer=te,le.NativePlayer=ye,le.LoggingControl=pe.default,Object.defineProperty(le,"version",{enumerable:!0,get:function(){return"1.8.2"}});var Ae=le},355:function(h,g,f){f.r(g),f.d(g,{ErrorDetails:function(){return x},ErrorTypes:function(){return u}});var _=f(470),b=f(827),u={NETWORK_ERROR:"NetworkError",MEDIA_ERROR:"MediaError",OTHER_ERROR:"OtherError"},x={NETWORK_EXCEPTION:_.LoaderErrors.EXCEPTION,NETWORK_STATUS_CODE_INVALID:_.LoaderErrors.HTTP_STATUS_CODE_INVALID,NETWORK_TIMEOUT:_.LoaderErrors.CONNECTING_TIMEOUT,NETWORK_UNRECOVERABLE_EARLY_EOF:_.LoaderErrors.UNRECOVERABLE_EARLY_EOF,MEDIA_MSE_ERROR:"MediaMSEError",MEDIA_FORMAT_ERROR:b.default.FORMAT_ERROR,MEDIA_FORMAT_UNSUPPORTED:b.default.FORMAT_UNSUPPORTED,MEDIA_CODEC_UNSUPPORTED:b.default.CODEC_UNSUPPORTED}},994:function(h,g,f){f.r(g);var _={};(function(){var b=self.navigator.userAgent.toLowerCase(),u=/(edge)\/([\w.]+)/.exec(b)||/(opr)[\/]([\w.]+)/.exec(b)||/(chrome)[ \/]([\w.]+)/.exec(b)||/(iemobile)[\/]([\w.]+)/.exec(b)||/(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(b)||/(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(b)||/(webkit)[ \/]([\w.]+)/.exec(b)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(b)||/(msie) ([\w.]+)/.exec(b)||b.indexOf("trident")>=0&&/(rv)(?::| )([\w.]+)/.exec(b)||b.indexOf("compatible")<0&&/(firefox)[ \/]([\w.]+)/.exec(b)||[],x=/(ipad)/.exec(b)||/(ipod)/.exec(b)||/(windows phone)/.exec(b)||/(iphone)/.exec(b)||/(kindle)/.exec(b)||/(android)/.exec(b)||/(windows)/.exec(b)||/(mac)/.exec(b)||/(linux)/.exec(b)||/(cros)/.exec(b)||[],m={browser:u[5]||u[3]||u[1]||"",version:u[2]||u[4]||"0",majorVersion:u[4]||u[2]||"0",platform:x[0]||""},y={};if(m.browser){y[m.browser]=!0;var S=m.majorVersion.split(".");y.version={major:parseInt(m.majorVersion,10),string:m.version},S.length>1&&(y.version.minor=parseInt(S[1],10)),S.length>2&&(y.version.build=parseInt(S[2],10))}if(m.platform&&(y[m.platform]=!0),(y.chrome||y.opr||y.safari)&&(y.webkit=!0),y.rv||y.iemobile){y.rv&&delete y.rv;var w="msie";m.browser=w,y[w]=!0}if(y.edge){delete y.edge;var P="msedge";m.browser=P,y[P]=!0}if(y.opr){var $="opera";m.browser=$,y[$]=!0}if(y.safari&&y.android){var z="android";m.browser=z,y[z]=!0}for(var D in y.name=m.browser,y.platform=m.platform,_)_.hasOwnProperty(D)&&delete _[D];Object.assign(_,y)})(),g.default=_},867:function(h,g,f){f.r(g),f.d(g,{IllegalStateException:function(){return x},InvalidArgumentException:function(){return m},NotImplementedException:function(){return y},RuntimeException:function(){return u}});var _,b=(_=function(S,w){return _=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(P,$){P.__proto__=$}||function(P,$){for(var z in $)Object.prototype.hasOwnProperty.call($,z)&&(P[z]=$[z])},_(S,w)},function(S,w){if(typeof w!="function"&&w!==null)throw new TypeError("Class extends value "+String(w)+" is not a constructor or null");function P(){this.constructor=S}_(S,w),S.prototype=w===null?Object.create(w):(P.prototype=w.prototype,new P)}),u=function(){function S(w){this._message=w}return Object.defineProperty(S.prototype,"name",{get:function(){return"RuntimeException"},enumerable:!1,configurable:!0}),Object.defineProperty(S.prototype,"message",{get:function(){return this._message},enumerable:!1,configurable:!0}),S.prototype.toString=function(){return this.name+": "+this.message},S}(),x=function(S){function w(P){return S.call(this,P)||this}return b(w,S),Object.defineProperty(w.prototype,"name",{get:function(){return"IllegalStateException"},enumerable:!1,configurable:!0}),w}(u),m=function(S){function w(P){return S.call(this,P)||this}return b(w,S),Object.defineProperty(w.prototype,"name",{get:function(){return"InvalidArgumentException"},enumerable:!1,configurable:!0}),w}(u),y=function(S){function w(P){return S.call(this,P)||this}return b(w,S),Object.defineProperty(w.prototype,"name",{get:function(){return"NotImplementedException"},enumerable:!1,configurable:!0}),w}(u)},856:function(h,g,f){f.r(g);var _=f(7),b=f.n(_),u=function(){function x(){}return x.e=function(m,y){m&&!x.FORCE_GLOBAL_TAG||(m=x.GLOBAL_TAG);var S="[".concat(m,"] > ").concat(y);x.ENABLE_CALLBACK&&x.emitter.emit("log","error",S),x.ENABLE_ERROR&&(console.error?console.error(S):console.warn?console.warn(S):console.log(S))},x.i=function(m,y){m&&!x.FORCE_GLOBAL_TAG||(m=x.GLOBAL_TAG);var S="[".concat(m,"] > ").concat(y);x.ENABLE_CALLBACK&&x.emitter.emit("log","info",S),x.ENABLE_INFO&&(console.info?console.info(S):console.log(S))},x.w=function(m,y){m&&!x.FORCE_GLOBAL_TAG||(m=x.GLOBAL_TAG);var S="[".concat(m,"] > ").concat(y);x.ENABLE_CALLBACK&&x.emitter.emit("log","warn",S),x.ENABLE_WARN&&(console.warn?console.warn(S):console.log(S))},x.d=function(m,y){m&&!x.FORCE_GLOBAL_TAG||(m=x.GLOBAL_TAG);var S="[".concat(m,"] > ").concat(y);x.ENABLE_CALLBACK&&x.emitter.emit("log","debug",S),x.ENABLE_DEBUG&&(console.debug?console.debug(S):console.log(S))},x.v=function(m,y){m&&!x.FORCE_GLOBAL_TAG||(m=x.GLOBAL_TAG);var S="[".concat(m,"] > ").concat(y);x.ENABLE_CALLBACK&&x.emitter.emit("log","verbose",S),x.ENABLE_VERBOSE&&console.log(S)},x}();u.GLOBAL_TAG="mpegts.js",u.FORCE_GLOBAL_TAG=!1,u.ENABLE_ERROR=!0,u.ENABLE_INFO=!0,u.ENABLE_WARN=!0,u.ENABLE_DEBUG=!0,u.ENABLE_VERBOSE=!0,u.ENABLE_CALLBACK=!1,u.emitter=new(b()),g.default=u},947:function(h,g,f){f.r(g);var _=f(7),b=f.n(_),u=f(856),x=function(){function m(){}return Object.defineProperty(m,"forceGlobalTag",{get:function(){return u.default.FORCE_GLOBAL_TAG},set:function(y){u.default.FORCE_GLOBAL_TAG=y,m._notifyChange()},enumerable:!1,configurable:!0}),Object.defineProperty(m,"globalTag",{get:function(){return u.default.GLOBAL_TAG},set:function(y){u.default.GLOBAL_TAG=y,m._notifyChange()},enumerable:!1,configurable:!0}),Object.defineProperty(m,"enableAll",{get:function(){return u.default.ENABLE_VERBOSE&&u.default.ENABLE_DEBUG&&u.default.ENABLE_INFO&&u.default.ENABLE_WARN&&u.default.ENABLE_ERROR},set:function(y){u.default.ENABLE_VERBOSE=y,u.default.ENABLE_DEBUG=y,u.default.ENABLE_INFO=y,u.default.ENABLE_WARN=y,u.default.ENABLE_ERROR=y,m._notifyChange()},enumerable:!1,configurable:!0}),Object.defineProperty(m,"enableDebug",{get:function(){return u.default.ENABLE_DEBUG},set:function(y){u.default.ENABLE_DEBUG=y,m._notifyChange()},enumerable:!1,configurable:!0}),Object.defineProperty(m,"enableVerbose",{get:function(){return u.default.ENABLE_VERBOSE},set:function(y){u.default.ENABLE_VERBOSE=y,m._notifyChange()},enumerable:!1,configurable:!0}),Object.defineProperty(m,"enableInfo",{get:function(){return u.default.ENABLE_INFO},set:function(y){u.default.ENABLE_INFO=y,m._notifyChange()},enumerable:!1,configurable:!0}),Object.defineProperty(m,"enableWarn",{get:function(){return u.default.ENABLE_WARN},set:function(y){u.default.ENABLE_WARN=y,m._notifyChange()},enumerable:!1,configurable:!0}),Object.defineProperty(m,"enableError",{get:function(){return u.default.ENABLE_ERROR},set:function(y){u.default.ENABLE_ERROR=y,m._notifyChange()},enumerable:!1,configurable:!0}),m.getConfig=function(){return{globalTag:u.default.GLOBAL_TAG,forceGlobalTag:u.default.FORCE_GLOBAL_TAG,enableVerbose:u.default.ENABLE_VERBOSE,enableDebug:u.default.ENABLE_DEBUG,enableInfo:u.default.ENABLE_INFO,enableWarn:u.default.ENABLE_WARN,enableError:u.default.ENABLE_ERROR,enableCallback:u.default.ENABLE_CALLBACK}},m.applyConfig=function(y){u.default.GLOBAL_TAG=y.globalTag,u.default.FORCE_GLOBAL_TAG=y.forceGlobalTag,u.default.ENABLE_VERBOSE=y.enableVerbose,u.default.ENABLE_DEBUG=y.enableDebug,u.default.ENABLE_INFO=y.enableInfo,u.default.ENABLE_WARN=y.enableWarn,u.default.ENABLE_ERROR=y.enableError,u.default.ENABLE_CALLBACK=y.enableCallback},m._notifyChange=function(){var y=m.emitter;if(y.listenerCount("change")>0){var S=m.getConfig();y.emit("change",S)}},m.registerListener=function(y){m.emitter.addListener("change",y)},m.removeListener=function(y){m.emitter.removeListener("change",y)},m.addLogListener=function(y){u.default.emitter.addListener("log",y),u.default.emitter.listenerCount("log")>0&&(u.default.ENABLE_CALLBACK=!0,m._notifyChange())},m.removeLogListener=function(y){u.default.emitter.removeListener("log",y),u.default.emitter.listenerCount("log")===0&&(u.default.ENABLE_CALLBACK=!1,m._notifyChange())},m}();x.emitter=new(b()),g.default=x},811:function(h,g,f){f.r(g);var _=function(){function b(){}return b.install=function(){Object.setPrototypeOf=Object.setPrototypeOf||function(u,x){return u.__proto__=x,u},Object.assign=Object.assign||function(u){if(u==null)throw new TypeError("Cannot convert undefined or null to object");for(var x=Object(u),m=1;m<arguments.length;m++){var y=arguments[m];if(y!=null)for(var S in y)y.hasOwnProperty(S)&&(x[S]=y[S])}return x},String.prototype.startsWith||Object.defineProperty(String.prototype,"startsWith",{value:function(u,x){var m=x>0?0|x:0;return this.substring(m,m+u.length)===u}}),typeof self.Promise!="function"&&f(964).polyfill()},b}();_.install(),g.default=_},861:function(h,g,f){function _(w){var P={};function $(D){if(P[D])return P[D].exports;var F=P[D]={i:D,id:D,l:!1,loaded:!1,exports:{}};return w[D].call(F.exports,F,F.exports,$),F.l=!0,F.loaded=!0,F.exports}$.m=w,$.c=P,$.d=function(D,F){for(var E in F)$.o(F,E)&&!$.o(D,E)&&Object.defineProperty(D,E,{enumerable:!0,get:F[E]})},$.r=function(D){typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(D,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(D,"__esModule",{value:!0})},$.n=function(D){var F=D&&D.__esModule?function(){return D.default}:function(){return D};return $.d(F,{a:F}),F},$.o=function(D,F){return Object.prototype.hasOwnProperty.call(D,F)},$.g=function(){if(typeof globalThis=="object")return globalThis;try{return this||new Function("return this")()}catch{if(typeof self=="object")return self}}(),$.p="/";var z=$(ENTRY_MODULE);return z.default||z}var b="[\\.|\\-|\\+|\\w|/|@]+",u="\\(\\s*(/\\*.*?\\*/)?\\s*.*?("+b+").*?\\)";function x(w){return(w+"").replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")}function m(w){return!isNaN(1*w)}function y(w,P,$){var z={};z[$]=[];var D=P.toString(),F=D.match(/^(?:function\s*\w*\s*)?\(\s*\w+\s*,\s*\w+\s*,\s*(\w+)\s*\)/);if(!F)return z;for(var E,Y=F[1],j=new RegExp("(\\\\n|\\W)"+x(Y)+u,"g");E=j.exec(D);)E[3]!=="dll-reference"&&z[$].push(E[3]);for(j=new RegExp("\\("+x(Y)+'\\("(dll-reference\\s('+b+'))"\\)\\)'+u,"g");E=j.exec(D);)w[E[2]]||(z[$].push(E[1]),w[E[2]]=f(E[1]).m),z[E[2]]=z[E[2]]||[],z[E[2]].push(E[4]);for(var X=Object.keys(z),V=0;V<X.length;V++)for(var L=0;L<z[X[V]].length;L++)m(z[X[V]][L])&&(z[X[V]][L]=1*z[X[V]][L]);return z}function S(w){return Object.keys(w).reduce(function(P,$){return P||w[$].length>0},!1)}h.exports=function(w,P){P=P||{};var $={main:f.m},z=P.all?{main:Object.keys($.main)}:function(j,X){for(var V={main:[X]},L={main:[]},C={main:{}};S(V);)for(var B=Object.keys(V),T=0;T<B.length;T++){var Q=B[T],K=V[Q].pop();if(C[Q]=C[Q]||{},!C[Q][K]&&j[Q][K]){C[Q][K]=!0,L[Q]=L[Q]||[],L[Q].push(K);for(var ce=y(j,j[Q][K],Q),ue=Object.keys(ce),pe=0;pe<ue.length;pe++)V[ue[pe]]=V[ue[pe]]||[],V[ue[pe]]=V[ue[pe]].concat(ce[ue[pe]])}}return L}($,w),D="";Object.keys(z).filter(function(j){return j!=="main"}).forEach(function(j){for(var X=0;z[j][X];)X++;z[j].push(X),$[j][X]="(function(module, exports, __webpack_require__) { module.exports = __webpack_require__; })",D=D+"var "+j+" = ("+_.toString().replace("ENTRY_MODULE",JSON.stringify(X))+")({"+z[j].map(function(V){return JSON.stringify(V)+": "+$[j][V].toString()}).join(",")+`});
`}),D=D+"new (("+_.toString().replace("ENTRY_MODULE",JSON.stringify(w))+")({"+z.main.map(function(j){return JSON.stringify(j)+": "+$.main[j].toString()}).join(",")+"}))(self);";var F=new self.Blob([D],{type:"text/javascript"});if(P.bare)return F;var E=(self.URL||self.webkitURL||self.mozURL||self.msURL).createObjectURL(F),Y=new self.Worker(E);return Y.objectURL=E,Y}},403:function(h,g,f){var _;f.r(g),function(b){b.ERROR="error",b.SOURCE_OPEN="source_open",b.UPDATE_END="update_end",b.BUFFER_FULL="buffer_full",b.START_STREAMING="start_streaming",b.END_STREAMING="end_streaming"}(_||(_={})),g.default=_},726:function(h,g,f){var _;f.r(g),function(b){b.IO_ERROR="io_error",b.DEMUX_ERROR="demux_error",b.INIT_SEGMENT="init_segment",b.MEDIA_SEGMENT="media_segment",b.LOADING_COMPLETE="loading_complete",b.RECOVERED_EARLY_EOF="recovered_early_eof",b.MEDIA_INFO="media_info",b.METADATA_ARRIVED="metadata_arrived",b.SCRIPTDATA_ARRIVED="scriptdata_arrived",b.TIMED_ID3_METADATA_ARRIVED="timed_id3_metadata_arrived",b.PGS_SUBTITLE_ARRIVED="pgs_subtitle_arrived",b.SYNCHRONOUS_KLV_METADATA_ARRIVED="synchronous_klv_metadata_arrived",b.ASYNCHRONOUS_KLV_METADATA_ARRIVED="asynchronous_klv_metadata_arrived",b.SMPTE2038_METADATA_ARRIVED="smpte2038_metadata_arrived",b.SEI_ARRIVED="sei_arrived",b.SCTE35_METADATA_ARRIVED="scte35_metadata_arrived",b.PES_PRIVATE_DATA_DESCRIPTOR="pes_private_data_descriptor",b.PES_PRIVATE_DATA_ARRIVED="pes_private_data_arrived",b.STATISTICS_INFO="statistics_info",b.RECOMMEND_SEEKPOINT="recommend_seekpoint"}(_||(_={})),g.default=_},877:function(h,g,f){f.r(g);var _=f(856),b=f(947),u=f(867),x=f(403),m=f(346),y=f(527),S=f(726),w=f(117),P=f(355);g.default=function($){var z="PlayerEngineWorker",D=(function(le,Ae){$.postMessage({msg:"logcat_callback",type:le,logcat:Ae})}).bind(void 0),F=null,E=null,Y=null,j=null,X=!1,V=!1,L=0,C=0,B=!1;function T(){Y&&(Y.shutdown(),Y.destroy(),Y=null)}function Q(){if(F==null||E==null)throw new u.IllegalStateException("Worker not initialized");if(j)throw new u.IllegalStateException("Transmuxer has been initialized");V||(!E.deferLoadAfterSourceOpen||X?((j=new y.default(F,E)).on(S.default.INIT_SEGMENT,function(le,Ae){Y.appendInitSegment(Ae)}),j.on(S.default.MEDIA_SEGMENT,function(le,Ae){Y.appendMediaSegment(Ae),$.postMessage({msg:"buffered_position_changed",buffered_position_milliseconds:Ae.info.endDts})}),j.on(S.default.LOADING_COMPLETE,function(){Y.endOfStream(),$.postMessage({msg:"player_event",event:w.default.LOADING_COMPLETE})}),j.on(S.default.RECOVERED_EARLY_EOF,function(){$.postMessage({msg:"player_event",event:w.default.RECOVERED_EARLY_EOF})}),j.on(S.default.IO_ERROR,function(le,Ae){$.postMessage({msg:"player_event",event:w.default.ERROR,error_type:P.ErrorTypes.NETWORK_ERROR,error_detail:le,info:Ae})}),j.on(S.default.DEMUX_ERROR,function(le,Ae){$.postMessage({msg:"player_event",event:w.default.ERROR,error_type:P.ErrorTypes.MEDIA_ERROR,error_detail:le,info:Ae})}),j.on(S.default.MEDIA_INFO,function(le){te(S.default.MEDIA_INFO,le)}),j.on(S.default.STATISTICS_INFO,function(le){te(S.default.STATISTICS_INFO,le)}),j.on(S.default.RECOMMEND_SEEKPOINT,function(le){(function(Ae){$.postMessage({msg:"transmuxing_event",event:S.default.RECOMMEND_SEEKPOINT,milliseconds:Ae})})(le)}),j.on(S.default.METADATA_ARRIVED,function(le){ye(w.default.METADATA_ARRIVED,le)}),j.on(S.default.SCRIPTDATA_ARRIVED,function(le){ye(w.default.SCRIPTDATA_ARRIVED,le)}),j.on(S.default.TIMED_ID3_METADATA_ARRIVED,function(le){ye(w.default.TIMED_ID3_METADATA_ARRIVED,le)}),j.on(S.default.PGS_SUBTITLE_ARRIVED,function(le){ye(w.default.PGS_SUBTITLE_ARRIVED,le)}),j.on(S.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,function(le){ye(w.default.SYNCHRONOUS_KLV_METADATA_ARRIVED,le)}),j.on(S.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,function(le){ye(w.default.ASYNCHRONOUS_KLV_METADATA_ARRIVED,le)}),j.on(S.default.SMPTE2038_METADATA_ARRIVED,function(le){ye(w.default.SMPTE2038_METADATA_ARRIVED,le)}),j.on(S.default.SEI_ARRIVED,function(le){ye(w.default.SEI_ARRIVED,le)}),j.on(S.default.SCTE35_METADATA_ARRIVED,function(le){ye(w.default.SCTE35_METADATA_ARRIVED,le)}),j.on(S.default.PES_PRIVATE_DATA_DESCRIPTOR,function(le){ye(w.default.PES_PRIVATE_DATA_DESCRIPTOR,le)}),j.on(S.default.PES_PRIVATE_DATA_ARRIVED,function(le){ye(w.default.PES_PRIVATE_DATA_ARRIVED,le)}),j.open()):V=!0)}function K(){Y&&Y.flush(),j&&(j.close(),j.destroy(),j=null)}function ce(){X=!0,V&&(V=!1,Q())}function ue(){$.postMessage({msg:"mse_event",event:x.default.UPDATE_END})}function pe(){_.default.v(z,"MSE SourceBuffer is full, report to main thread"),$.postMessage({msg:"mse_event",event:x.default.BUFFER_FULL})}function G(le){$.postMessage({msg:"player_event",event:w.default.ERROR,error_type:P.ErrorTypes.MEDIA_ERROR,error_detail:P.ErrorTypes.MEDIA_MSE_ERROR,info:le})}function te(le,Ae){$.postMessage({msg:"transmuxing_event",event:le,info:Ae})}function ye(le,Ae){$.postMessage({msg:"player_event",event:le,extraData:Ae})}$.addEventListener("message",function(le){if(!B){var Ae=le.data;switch(Ae.cmd){case"logging_config":var q=Ae;b.default.applyConfig(q.logging_config),q.logging_config.enableCallback===!0?b.default.addLogListener(D):b.default.removeLogListener(D);break;case"init":F=(q=Ae).media_data_source,E=q.config;break;case"destroy":j&&K(),Y&&T(),B=!0,$.postMessage({msg:"destroyed"});break;case"initialize_mse":(function(){_.default.v(z,"Initializing MediaSource in DedicatedWorker"),(Y=new m.default(E)).on(x.default.SOURCE_OPEN,ce.bind(this)),Y.on(x.default.UPDATE_END,ue.bind(this)),Y.on(x.default.BUFFER_FULL,pe.bind(this)),Y.on(x.default.ERROR,G.bind(this)),Y.initialize({getCurrentTime:function(){return L},getReadyState:function(){return C}});var R=Y.getHandle();$.postMessage({msg:"mse_init",handle:R},[R])})();break;case"shutdown_mse":T();break;case"load":Q();break;case"unload":K();break;case"unbuffered_seek":q=Ae,Y.flush(),j.seek(q.milliseconds);break;case"timeupdate":L=(q=Ae).current_time;break;case"readystatechange":C=(q=Ae).ready_state;break;case"pause_transmuxer":j.pause();break;case"resume_transmuxer":j.resume()}}})}},117:function(h,g,f){var _;f.r(g),function(b){b.ERROR="error",b.LOADING_COMPLETE="loading_complete",b.RECOVERED_EARLY_EOF="recovered_early_eof",b.MEDIA_INFO="media_info",b.METADATA_ARRIVED="metadata_arrived",b.SCRIPTDATA_ARRIVED="scriptdata_arrived",b.TIMED_ID3_METADATA_ARRIVED="timed_id3_metadata_arrived",b.PGS_SUBTITLE_ARRIVED="pgs_subtitle_arrived",b.SYNCHRONOUS_KLV_METADATA_ARRIVED="synchronous_klv_metadata_arrived",b.ASYNCHRONOUS_KLV_METADATA_ARRIVED="asynchronous_klv_metadata_arrived",b.SMPTE2038_METADATA_ARRIVED="smpte2038_metadata_arrived",b.SEI_ARRIVED="sei_arrived",b.SCTE35_METADATA_ARRIVED="scte35_metadata_arrived",b.PES_PRIVATE_DATA_DESCRIPTOR="pes_private_data_descriptor",b.PES_PRIVATE_DATA_ARRIVED="pes_private_data_arrived",b.STATISTICS_INFO="statistics_info",b.DESTROYING="destroying"}(_||(_={})),g.default=_}},s={};function d(h){var g=s[h];if(g!==void 0)return g.exports;var f=s[h]={exports:{}};return a[h].call(f.exports,f,f.exports,d),f.exports}return d.m=a,d.n=function(h){var g=h&&h.__esModule?function(){return h.default}:function(){return h};return d.d(g,{a:g}),g},d.d=function(h,g){if(Array.isArray(g))for(var f=0;f<g.length;){var _=g[f++],b=g[f++];d.o(h,_)?b===0&&f++:b===0?Object.defineProperty(h,_,{enumerable:!0,value:g[f++]}):Object.defineProperty(h,_,{enumerable:!0,get:b})}else for(var _ in g)d.o(g,_)&&!d.o(h,_)&&Object.defineProperty(h,_,{enumerable:!0,get:g[_]})},d.g=function(){if(typeof globalThis=="object")return globalThis;try{return this||new Function("return this")()}catch{if(typeof window=="object")return window}}(),d.o=function(h,g){return Object.prototype.hasOwnProperty.call(h,g)},d.r=function(h){typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(h,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(h,"__esModule",{value:!0})},d(976)}()})})(xa);var zo=xa.exports;const gi=No(zo);function wa(){try{let t=localStorage.getItem("orbit_session_id");return t||(t="sess_"+Math.random().toString(36).substring(2,15)+"_"+Date.now().toString(36),localStorage.setItem("orbit_session_id",t)),t}catch{return"anon_"+Date.now()}}let Qt=null,Mi=null,Pi=null;async function zi(t,e=null){var X,V,L,C,B;if(ci(),!t)return;const a=I.getState().currentUser,s=(V=(X=a==null?void 0:a.roles)==null?void 0:X.includes)==null?void 0:V.call(X,"Admin"),d=a&&(a.userId===t.creatorId||a.id===t.creatorId);t.id&&Ft.recordView(t.id,wa()).catch(()=>{}),await Mt().catch(()=>{});const h=t.videoUrl||t.url||"";let g=Yt(h);const f=g.toLowerCase().includes(".flv"),_=g.toLowerCase().includes(".mp4"),b=typeof window<"u"&&window.location.protocol==="https:",u=g.startsWith("http://localhost")||g.startsWith("http://127.0.0.1"),x=b&&u,m=document.createElement("div");m.id="clip-player-modal",m.style.cssText=`
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(4, 7, 18, 0.88);
    backdrop-filter: blur(14px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  `,m.innerHTML=`
    <div style="
      background: var(--color-space-panel, #0f1424);
      border: 1px solid rgba(0, 242, 254, 0.3);
      border-radius: 16px;
      width: 100%;
      max-width: 960px;
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.12);
      overflow: hidden;
    ">
      <!-- Modal Header -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      ">
        <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
          <span style="color: var(--color-cyan-neon, #00f2fe); font-size: 18px; display: flex; align-items: center;">
            ${N.clip}
          </span>
          <h3 id="clip-modal-title" style="
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: var(--color-text, #fff);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${Ti(t.title||"Highlight Clip")}
          </h3>
          <span id="clip-modal-format" style="
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            background: rgba(0, 242, 254, 0.15);
            color: var(--color-cyan-neon, #00f2fe);
            font-weight: 700;
            letter-spacing: 0.05em;
            flex-shrink: 0;
          ">${f?"FLV STREAM":_?"MP4 CLIP":"CLIP"}</span>
        </div>
        <button id="clip-modal-close" class="btn btn-ghost btn-sm" style="padding: 6px 10px; border-radius: 8px;" title="Close (Esc)">
          ${N.x}
        </button>
      </div>

      <!-- Modal Body (Video Player) -->
      <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        <video id="clip-video" controls playsinline style="width: 100%; height: 100%; max-height: 60vh; background: #000; object-fit: contain;"></video>
        
        <!-- Loading Spinner -->
        <div id="clip-loading-spinner" style="position: absolute; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--color-cyan-neon, #00f2fe);">
          <div class="spinner"></div>
          <span style="font-size: 13px; font-weight: 500; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">Loading clip stream...</span>
        </div>

        <!-- Error / Info State Overlay -->
        <div id="clip-error-box" style="display: none; position: absolute; inset: 0; background: rgba(10, 12, 22, 0.96); flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; text-align: center; overflow-y: auto;">
          <div id="clip-error-icon" style="font-size: 40px; color: #ef4444;">&#9888;</div>
          <h4 id="clip-error-title" style="margin: 0; color: #fff; font-size: 17px; font-weight: 700;">Clip Stream Unavailable</h4>
          <div id="clip-error-msg" style="margin: 0; color: var(--color-text-muted, #888); font-size: 13px; max-width: 520px; line-height: 1.5;">
            The clip media file could not be loaded or the streaming server is offline.
          </div>
          <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; justify-content: center;">
            <a id="clip-direct-link" href="${g||"#"}" target="_blank" class="btn btn-cyan btn-sm">
              ${N.play} Open in VLC / New Tab
            </a>
            <button id="clip-copy-url-btn" class="btn btn-outline btn-sm">
              ${N.share} Copy Media URL
            </button>
            <button id="clip-retry-btn" class="btn btn-ghost btn-sm">
              ${N.refresh} Refresh & Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Video Info & Actions Footer -->
      <div style="padding: 16px 20px; background: var(--color-space-panel, #0f1424); border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <!-- Left: Creator & Channel details -->
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-cyan-primary, #00AEBD), var(--color-cyan-neon, #00f2fe));
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: 700;
            font-size: 16px;
            overflow: hidden;
            flex-shrink: 0;
          ">
            ${t.creatorProfilePictureUrl?`<img src="${t.creatorProfilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(t.creatorName||t.creatorUsername||"C")[0].toUpperCase()}
          </div>
          <div style="min-width: 0;">
            <div style="font-size: 14px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span>Clipped by <strong style="color: var(--color-cyan-neon, #00f2fe);">${Ti(t.creatorName||t.creatorUsername||"Streamer")}</strong></span>
              ${t.channelName?`<span style="color: var(--color-text-muted, #888);">&bull; Channel: <strong style="color: #fff;">${Ti(t.channelName)}</strong></span>`:""}
            </div>
            <div style="font-size: 12px; color: var(--color-text-muted, #888); margin-top: 3px; display: flex; align-items: center; gap: 8px;">
              <span>${N.eye} ${(t.viewCount||0)+1} views</span>
              ${t.durationSeconds?`<span>&bull; ${Math.round(t.durationSeconds)}s</span>`:""}
              ${t.categoryName?`<span class="badge-category" style="font-size: 10px; padding: 1px 7px;">${Ti(t.categoryName)}</span>`:""}
            </div>
          </div>
        </div>

        <!-- Right: Action Buttons -->
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          ${t.channelId?`
            <button id="clip-visit-channel" class="btn btn-cyan btn-sm">
              ${N.rocket} Visit Channel
            </button>
          `:""}
          <button id="clip-share-btn" class="btn btn-ghost btn-sm">
            ${N.share} Share
          </button>
          ${s||d?`
            <button id="clip-delete-btn" class="btn btn-danger btn-sm" title="Delete Clip">
              ${N.trash} Delete
            </button>
          `:""}
        </div>
      </div>
    </div>
  `,document.body.appendChild(m),Mi=m;const y=m.querySelector("#clip-modal-close");y==null||y.addEventListener("click",ci),m.addEventListener("click",T=>{T.target===m&&ci()});const S=T=>{T.key==="Escape"&&(ci(),window.removeEventListener("keydown",S))};window.addEventListener("keydown",S);const w=m.querySelector("#clip-video"),P=m.querySelector("#clip-loading-spinner"),$=m.querySelector("#clip-error-box"),z=m.querySelector("#clip-error-title"),D=m.querySelector("#clip-error-msg"),F=m.querySelector("#clip-error-icon"),E=m.querySelector("#clip-retry-btn"),Y=m.querySelector("#clip-copy-url-btn");Y==null||Y.addEventListener("click",()=>{var T;g&&((T=navigator.clipboard)==null||T.writeText(g).then(()=>{I.showToast("Media URL copied to clipboard for VLC / external player!","success")}).catch(()=>{I.showToast("Media URL: "+g,"info")}))}),(L=m.querySelector("#clip-visit-channel"))==null||L.addEventListener("click",()=>{ci(),t.channelId&&I.navigate("channel",{channelId:t.channelId})}),(C=m.querySelector("#clip-share-btn"))==null||C.addEventListener("click",()=>{var Q;const T=g||window.location.href;(Q=navigator.clipboard)==null||Q.writeText(T).then(()=>{I.showToast("Clip URL copied to clipboard!","success")}).catch(()=>{I.showToast("Clip URL: "+T,"info")})}),(B=m.querySelector("#clip-delete-btn"))==null||B.addEventListener("click",async()=>{if(confirm("Are you sure you want to delete this clip?"))try{await Ft.delete(t.id),I.showToast("Clip deleted successfully","info"),ci(),typeof e=="function"?e(t.id):I.getState().currentView==="clips"&&I.navigate("clips")}catch(T){I.showToast(T.message||"Failed to delete clip","error")}}),E==null||E.addEventListener("click",async()=>{$&&($.style.display="none"),P&&(P.style.display="flex"),await Mt(!0).catch(()=>{}),g=Yt(h);const T=m.querySelector("#clip-direct-link");T&&(T.href=g||"#"),j()});async function j(){if(!g){P&&(P.style.display="none"),$&&($.style.display="flex",D&&(D.textContent="No clip video URL was found for this highlight."));return}if(x){P&&(P.style.display="none"),$&&($.style.display="flex",F&&(F.innerHTML="&#128274;",F.style.color="var(--color-cyan-neon, #00f2fe)"),z&&(z.textContent="Browser Mixed-Content Restriction"),D&&(D.innerHTML=`
            <div style="text-align: left; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 14px; margin-top: 4px; font-size: 13px; line-height: 1.6;">
              <p style="margin: 0 0 10px; color: #eee;">
                You are viewing Orbit over <strong>HTTPS</strong> (<code style="color:var(--color-cyan-neon,#00f2fe);">${window.location.host}</code>), but your media server is configured to local <strong>HTTP</strong> (<code style="color:var(--color-cyan-neon,#00f2fe);">${Ti(g.substring(0,g.indexOf("/clips")+6)||g)}</code>). Modern browsers block plaintext HTTP media requests inside HTTPS pages.
              </p>
              <div style="display: flex; flex-direction: column; gap: 8px; color: #ccc; font-size: 12px;">
                <div>&#128640; <strong>Recommended for Local Testing:</strong> Run the frontend locally (<code style="color:var(--color-cyan-neon,#00f2fe);">npm run dev</code> at <code style="color:var(--color-cyan-neon,#00f2fe);">http://localhost:5173</code>). It connects to your live MonsterASP backend with zero mixed-content restrictions!</div>
                <div>&#127760; <strong>For Online Playback:</strong> Set an HTTPS tunnel (e.g. ngrok HTTPS URL) in <strong>Admin &rarr; Media Server</strong> settings.</div>
                <div>&#127911; <strong>External Player:</strong> You can open or stream this clip directly in VLC or media player.</div>
              </div>
            </div>
          `));return}try{if(f&&gi.isSupported()){const T=gi.createPlayer({type:"flv",url:g,isLive:!1,cors:!0},{headers:{"ngrok-skip-browser-warning":"true"},enableWorker:!0,lazyLoadMaxDuration:180,seekType:"range"});T.attachMediaElement(w),T.load(),Qt=T,T.on(gi.Events.ERROR,(Q,K)=>{console.error("[ClipPlayer] mpegts error:",Q,K),P&&(P.style.display="none"),$&&($.style.display="flex",D&&(D.textContent=`FLV playback error (${Q}: ${K}). You can open the raw clip in VLC.`))}),w.addEventListener("canplay",()=>{P&&(P.style.display="none")},{once:!0}),T.play().catch(()=>{})}else{if(g.includes("ngrok"))try{const Q=await fetch(g,{headers:{"ngrok-skip-browser-warning":"true"}});if(!Q.ok)throw new Error(`HTTP ${Q.status}: ${Q.statusText}`);const K=await Q.blob();Pi=URL.createObjectURL(K),w.src=Pi,w.load(),w.addEventListener("canplay",()=>{P&&(P.style.display="none")},{once:!0}),w.play().catch(()=>{})}catch(Q){console.warn("[ClipPlayer] Blob fetch failed, falling back to direct src:",Q),w.src=g,w.load(),w.play().catch(()=>{})}else w.src=g,w.load(),w.addEventListener("canplay",()=>{P&&(P.style.display="none")},{once:!0}),w.play().catch(()=>{});w.addEventListener("error",Q=>{console.error("[ClipPlayer] Video element error:",Q),P&&(P.style.display="none"),$&&($.style.display="flex",D&&(D.textContent="Clip could not be decoded or was blocked by the browser. You can play directly in VLC."))})}}catch(T){console.error("[ClipPlayer] Initialization error:",T),P&&(P.style.display="none"),$&&($.style.display="flex",D&&(D.textContent=T.message||"Failed to initialize player."))}}j()}function ci(){if(Qt){try{Qt.pause(),Qt.unload(),Qt.detachMediaElement(),Qt.destroy()}catch{}Qt=null}if(Pi){try{URL.revokeObjectURL(Pi)}catch{}Pi=null}if(Mi){const e=Mi.querySelector("video");if(e)try{e.pause(),e.removeAttribute("src"),e.load()}catch{}Mi.remove(),Mi=null}const t=document.getElementById("clip-player-modal");t&&t.remove()}function Ti(t){return t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let Gi=[];function Vo(){return`<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div class="section-title" style="margin-bottom:0;">${N.clip} Top Clips Across the Galaxy</div>
      <button id="refresh-clips-btn" class="btn btn-ghost btn-sm">${N.refresh} Refresh</button>
    </div>
    <div class="clips-grid" id="clips-grid"><div class="spinner" style="grid-column:1/-1;"></div></div>
    <div id="clip-modal-root"></div>
  </div>`}function Fo(){var t;(t=document.getElementById("refresh-clips-btn"))==null||t.addEventListener("click",async()=>{await Mt(!0).catch(()=>{}),En()}),En()}async function En(){const t=document.getElementById("clips-grid");if(t){t.innerHTML='<div class="spinner" style="grid-column:1/-1;"></div>';try{if(await Mt().catch(()=>{}),Gi=await Ft.getTop(30)||[],!Gi.length){t.innerHTML=`
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">&#127916;</div>
          <h3>No Clips Found</h3>
          <p>No clips have been recorded yet. Watch a live broadcast and slice a clip!</p>
        </div>`;return}t.innerHTML=Gi.map(a=>`
      <div class="card clip-card hover-lift stagger-item" data-clip-id="${a.id}">
        <div class="clip-thumb">
          <img src="${ht}"
               data-thumb-src="${a.thumbnailUrl||""}"
               alt="${ui(a.title||"Clip")}" />
          <span class="clip-views">${N.eye} ${a.viewCount||0} views</span>
          ${a.durationSeconds?`<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${Math.round(a.durationSeconds)}s</span>`:""}
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;" class="clip-play-overlay">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--color-cyan-primary);display:flex;align-items:center;justify-content:center;color:#000;box-shadow:0 0 16px rgba(0,221,238,0.5);">
              ${N.play}
            </div>
          </div>
        </div>
        <div class="clip-info">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <div class="clip-title truncate" title="${ui(a.title||"Untitled Clip")}" style="flex:1;">${ui(a.title||"Untitled Clip")}</div>
            ${a.categoryName?`<span class="badge-category" style="font-size:10px;padding:1px 6px;flex-shrink:0;">${ui(a.categoryName)}</span>`:""}
          </div>
          <div class="clip-meta" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
            <span style="color:var(--color-text-muted);font-size:12px;">by <strong style="color:#fff;">${ui(a.creatorName||a.creatorUsername||"Streamer")}</strong></span>
            ${a.channelName?`<span style="color:var(--color-cyan-primary);font-size:12px;">${ui(a.channelName)}</span>`:""}
          </div>
        </div>
      </div>
    `).join(""),Et(t),t.querySelectorAll(".clip-card").forEach(a=>{a.addEventListener("mouseenter",()=>{const s=a.querySelector(".clip-play-overlay");s&&(s.style.opacity="1")}),a.addEventListener("mouseleave",()=>{const s=a.querySelector(".clip-play-overlay");s&&(s.style.opacity="0")}),a.addEventListener("click",()=>{const s=parseInt(a.dataset.clipId),d=Gi.find(h=>h.id===s);d&&zi(d,()=>En())})})}catch{t.innerHTML='<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load clips</p>'}}}function ui(t){return t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let Lt=null,kt=0,et=[],qi=null;function it(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function Ho(){return`
    <div>
      <!-- Kick-Style Hero Carousel Container -->
      <div id="home-hero-mount">
        <!-- Rendered dynamically based on live streams availability -->
        <div class="kick-hero-carousel" style="min-height:360px;display:flex;align-items:center;justify-content:center;">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Live Broadcasts Section -->
      <div style="margin-bottom:36px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="cosmic-beacon"></span>
            <h2 style="font-family:var(--font-display);font-size:22px;color:var(--color-text-white);margin:0;">
              Live Channels
            </h2>
          </div>
          <button id="refresh-streams" class="btn btn-ghost btn-sm">${N.refresh} Refresh</button>
        </div>

        <!-- Category Filter Pills -->
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:20px;" id="home-cat-pills">
          <button class="cat-pill active" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:var(--color-cyan-primary);color:#000;border:none;cursor:pointer;flex-shrink:0;">All Channels</button>
        </div>

        <!-- Streams Grid -->
        <div class="streams-grid" id="home-streams-grid">
          <div class="spinner" style="grid-column:1/-1;"></div>
        </div>
      </div>

      <!-- Top Categories Shelf -->
      <div style="margin-bottom:40px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;color:var(--color-cyan-neon);">${N.star}</span>
            <h2 style="font-family:var(--font-display);font-size:20px;color:var(--color-text-white);margin:0;">
              Top Categories
            </h2>
          </div>
          <button id="view-all-cats-btn" class="btn btn-ghost btn-sm" style="color:var(--color-cyan-primary);">
            View All &rarr;
          </button>
        </div>
        <div class="categories-grid" id="home-top-categories">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Trending Highlights / Clips Shelf -->
      <div style="margin-bottom:40px;" id="home-trending-clips-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;color:var(--color-cyan-neon);">${N.clip}</span>
            <h2 style="font-family:var(--font-display);font-size:20px;color:var(--color-text-white);margin:0;">
              Trending Highlights &amp; Clips
            </h2>
          </div>
          <button id="view-all-clips-btn" class="btn btn-ghost btn-sm" style="color:var(--color-cyan-primary);">
            Explore Clips &rarr;
          </button>
        </div>
        <div class="streams-grid" id="home-clips-grid" style="grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));">
          <div class="spinner" style="grid-column:1/-1;"></div>
        </div>
      </div>
    </div>
  `}function jo(){var t,e,a;(t=document.getElementById("refresh-streams"))==null||t.addEventListener("click",()=>{Dn()}),(e=document.getElementById("view-all-cats-btn"))==null||e.addEventListener("click",()=>{I.navigate("categories")}),(a=document.getElementById("view-all-clips-btn"))==null||a.addEventListener("click",()=>{I.navigate("clips")}),Go()}async function Go(){await Promise.allSettled([Sa(),qo(),Dn(),Wo()])}function Bi(){var s,d,h,g,f,_;const t=document.getElementById("home-hero-mount");if(!t)return;if(qi&&(clearInterval(qi),qi=null),!et||et.length===0){t.innerHTML=`
      <div style="position:relative;background:radial-gradient(ellipse at top right, rgba(0, 242, 254, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(121, 40, 202, 0.2), transparent 50%), var(--bg-gradient-card);border-radius:var(--radius-card);padding:48px 40px;margin-bottom:36px;overflow:hidden;border:1px solid rgba(0, 174, 189, 0.15);box-shadow:0 12px 36px rgba(0,0,0,0.4);">
        <!-- Celestial Orbiting Rings -->
        <div class="orbit-ring orbit-ring-1" style="top:-60px;right:60px;border-color:rgba(0,242,254,0.25);pointer-events:none;"></div>
        <div class="orbit-ring orbit-ring-2" style="top:-110px;right:10px;border-color:rgba(121,40,202,0.3);pointer-events:none;"></div>
        <div class="orbit-ring orbit-ring-3" style="top:-160px;right:-40px;border-color:rgba(0,174,189,0.15);pointer-events:none;"></div>

        <!-- Floating Nebula Dust -->
        <div style="position:absolute;top:20%;right:15%;width:180px;height:180px;background:radial-gradient(circle, rgba(0,242,254,0.2), transparent 70%);animation:nebula-pulse 8s ease-in-out infinite;pointer-events:none;"></div>

        <div style="position:relative;z-index:2;max-width:600px;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:rgba(0,242,254,0.08);border:1px solid rgba(0,242,254,0.25);margin-bottom:16px;">
            <span style="font-size:12px;color:var(--color-cyan-neon);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
              ${N.rocket} Next-Gen Streaming Platform
            </span>
          </div>
          <h1 style="font-family:var(--font-display);font-size:34px;color:#fff;margin:0 0 12px;line-height:1.2;">
            Broadcast Across the <span style="background:linear-gradient(135deg, var(--color-cyan-neon), #00aebd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Cosmos</span>
          </h1>
          <p style="color:var(--color-text-muted);font-size:15px;line-height:1.6;margin:0 0 24px;">
            Discover live creators, join interactive real-time chats, and stream with low-latency RTMP to viewers worldwide.
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button id="hero-studio-btn" class="btn btn-cyan btn-sm" style="padding:10px 22px;font-weight:700;">
              ${N.rocket} Creator Studio
            </button>
            <button id="hero-explore-btn" class="btn btn-outline btn-sm" style="padding:10px 22px;">
              ${N.grid} Browse Categories
            </button>
          </div>
        </div>
      </div>
    `,(s=document.getElementById("hero-studio-btn"))==null||s.addEventListener("click",()=>I.navigate("studio")),(d=document.getElementById("hero-explore-btn"))==null||d.addEventListener("click",()=>I.navigate("categories"));return}kt>=et.length&&(kt=0);const e=et[kt];t.innerHTML=`
    <div class="kick-hero-carousel">
      <div class="kick-hero-main">
        <!-- Main Video Preview Stage -->
        <div class="kick-hero-preview" id="hero-preview-stage" title="Click to watch stream">
          <img src="${ht}" data-thumb-src="${e.thumbnailUrl||""}" alt="${it(e.title)}" />
          
          <!-- Badges overlay -->
          <div style="position:absolute;top:16px;left:16px;display:flex;align-items:center;gap:8px;z-index:2;">
            <span class="badge-live" style="font-size:13px;padding:4px 12px;display:inline-flex;align-items:center;gap:6px;">
              <span class="cosmic-beacon" style="width:8px;height:8px;"></span> LIVE
            </span>
            <span class="badge-viewers" style="font-size:13px;padding:4px 10px;">
              ${N.eye} ${e.viewerCount||0}
            </span>
          </div>

          <!-- Play overlay icon -->
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.25);transition:background 0.3s;" class="hero-play-overlay">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(0,242,254,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,242,254,0.8);color:#000;">
              <span style="font-size:24px;margin-left:4px;">▶</span>
            </div>
          </div>
        </div>

        <!-- Streamer Details Sidebar -->
        <div class="kick-hero-details">
          <div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
              ${Bn({src:e.profilePictureUrl,fallback:(e.streamerName||"S")[0].toUpperCase(),size:"lg"})}
              <div>
                <div style="font-weight:700;font-size:16px;color:var(--color-text-white);display:flex;align-items:center;gap:6px;">
                  <span>${it(e.streamerName||"Streamer")}</span>
                  <span style="color:var(--color-cyan-neon);">${N.checkCircle}</span>
                </div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">
                  Streaming ${it(e.categoryName||"General")}
                </div>
              </div>
            </div>

            <h3 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 10px;line-height:1.3;">
              ${it(e.title||"Live Broadcast")}
            </h3>

            ${e.categoryName?`
              <span class="badge-category" style="margin-bottom:14px;display:inline-block;">
                ${it(e.categoryName)}
              </span>
            `:""}

            <p style="font-size:13px;color:var(--color-text-muted);line-height:1.5;margin:0 0 20px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
              ${it(e.description||"Welcome to the live stream! Come join the chat, say hello, and hang out with the community.")}
            </p>
          </div>

          <div>
            <button id="hero-watch-btn" class="btn btn-cyan btn-full" style="padding:12px;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 0 16px rgba(0,242,254,0.3);">
              ${N.play} Watch Live Stream
            </button>

            <!-- Carousel Controls -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;">
              <div class="kick-hero-nav-pills">
                ${et.map((b,u)=>`
                  <button class="kick-hero-nav-pill ${u===kt?"active":""}" data-hero-index="${u}"></button>
                `).join("")}
              </div>

              <div style="display:flex;gap:6px;">
                <button id="hero-prev-btn" class="btn btn-ghost btn-sm" style="padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">&larr;</button>
                <button id="hero-next-btn" class="btn btn-ghost btn-sm" style="padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">&rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,Et(t);const a=()=>{I.setActiveStream(e),I.navigate("watch",{streamId:e.id})};(h=document.getElementById("hero-preview-stage"))==null||h.addEventListener("click",a),(g=document.getElementById("hero-watch-btn"))==null||g.addEventListener("click",a),(f=document.getElementById("hero-prev-btn"))==null||f.addEventListener("click",()=>{kt=(kt-1+et.length)%et.length,Bi()}),(_=document.getElementById("hero-next-btn"))==null||_.addEventListener("click",()=>{kt=(kt+1)%et.length,Bi()}),t.querySelectorAll(".kick-hero-nav-pill").forEach(b=>{b.addEventListener("click",()=>{kt=parseInt(b.dataset.heroIndex),Bi()})}),et.length>1&&(qi=setInterval(()=>{kt=(kt+1)%et.length,Bi()},8e3))}async function Dn(){var e;const t=document.getElementById("home-streams-grid");if(t){t.innerHTML='<div class="spinner" style="grid-column:1/-1;"></div>';try{let a;if(Lt?a=await _t.getStreams(Lt):a=await wt.getLiveStreams(),et=Array.isArray(a)?a:[],et.length>0){const s=[...new Set(et.map(d=>d.channelId).filter(Boolean))];await Promise.allSettled(s.map(async d=>{try{const h=await tt.getById(d);if(h){const g=h.profilePhotoUrl||h.ownerProfilePictureUrl||h.profilePictureUrl;et.forEach(f=>{f.channelId===d&&(f.profilePictureUrl=f.profilePictureUrl||g)})}}catch(h){console.warn("[HomeFeed] Could not load channel profile for",d,h)}}))}if(Bi(),!et.length){t.innerHTML=`
        <div class="empty-state" style="grid-column:1/-1;padding:48px 20px;">
          <div class="empty-icon">&#128752;</div>
          <h3 style="font-size:18px;color:#fff;">No Active Broadcasts</h3>
          <p style="color:var(--color-text-muted);font-size:14px;max-width:380px;margin:8px auto 16px;">
            ${Lt?"No streams currently live in this category.":"No channels are live right now. Be the first to start broadcasting!"}
          </p>
          <button id="empty-go-live" class="btn btn-cyan btn-sm">${N.rocket} Launch Creator Studio</button>
        </div>`,(e=document.getElementById("empty-go-live"))==null||e.addEventListener("click",()=>I.navigate("studio"));return}t.innerHTML=et.map(s=>`
      <div class="card stream-card" data-sid="${s.id}" style="cursor:pointer;">
        <div class="stream-thumb" style="position:relative;aspect-ratio:16/9;background:#000;border-radius:12px 12px 0 0;overflow:hidden;">
          <img src="${ht}" data-thumb-src="${s.thumbnailUrl||""}" alt="${it(s.title)}" style="width:100%;height:100%;object-fit:cover;" />
          <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;z-index:2;">
            <span class="badge-live" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;">
              <span class="cosmic-beacon" style="width:6px;height:6px;"></span> LIVE
            </span>
            <span class="badge-viewers" style="font-size:11px;padding:3px 8px;">${N.eye} ${s.viewerCount||0}</span>
          </div>
          ${s.categoryName?`<span class="badge-category" style="position:absolute;top:10px;right:10px;font-size:11px;">${it(s.categoryName)}</span>`:""}
        </div>
        <div class="stream-info" style="padding:14px;">
          <div class="streamer-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            ${Bn({src:s.profilePictureUrl,fallback:(s.streamerName||"S")[0].toUpperCase(),size:"sm"})}
            <div style="flex:1;overflow:hidden;">
              <div class="streamer-name" style="font-size:13px;font-weight:700;color:var(--color-text-primary);display:flex;align-items:center;gap:4px;">
                <span>${it(s.streamerName||"Streamer")}</span>
                <span style="color:var(--color-cyan-neon);font-size:11px;">${N.checkCircle||"✓"}</span>
              </div>
              <div style="font-size:11px;color:var(--color-cyan-primary);">${it(s.categoryName||"General")}</div>
            </div>
          </div>
          <div class="stream-title" style="font-size:13px;font-weight:600;color:var(--color-text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${it(s.title||"Live Stream")}
          </div>
        </div>
      </div>
    `).join(""),Et(t),t.querySelectorAll(".stream-card").forEach(s=>{s.addEventListener("click",()=>{const d=parseInt(s.dataset.sid),h=et.find(g=>g.id===d);h&&(I.setActiveStream(h),I.navigate("watch",{streamId:d}))})})}catch{t.innerHTML='<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load live streams.</p>'}}}async function Sa(){const t=document.getElementById("home-cat-pills");if(t)try{const e=await _t.getAll();if(!(e!=null&&e.length))return;t.innerHTML=`
      <button class="cat-pill ${Lt?"":"active"}" data-slug="all" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:${Lt?"var(--color-space-slate)":"var(--color-cyan-primary)"};color:${Lt?"var(--color-text-white)":"#000"};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">All</button>
      ${e.map(a=>`<button class="cat-pill ${Lt===a.slug?"active":""}" data-slug="${a.slug}" style="padding:8px 18px;border-radius:20px;font-size:13px;font-weight:500;background:${Lt===a.slug?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${Lt===a.slug?"#000":"var(--color-text-white)"};border:1px solid var(--color-cyan-border);cursor:pointer;flex-shrink:0;">${it(a.name)}</button>`).join("")}
    `,t.querySelectorAll(".cat-pill").forEach(a=>{a.addEventListener("click",()=>{Lt=a.dataset.slug==="all"?null:a.dataset.slug,Sa(),Dn()})})}catch{}}async function qo(){const t=document.getElementById("home-top-categories");if(t)try{const e=await _t.getTop(8);if(!(e!=null&&e.length)){t.innerHTML='<p class="text-muted" style="grid-column:1/-1;">No categories available.</p>';return}t.innerHTML=e.map(a=>`
      <div class="card category-card hover-lift stagger-item" data-slug="${a.slug}" style="cursor:pointer;border-radius:12px;overflow:hidden;">
        <div class="cat-thumb" style="aspect-ratio:3/4;background:var(--color-space-slate);overflow:hidden;position:relative;">
          ${a.imageUrl?`<img src="${a.imageUrl}" alt="${it(a.name)}" style="width:100%;height:100%;object-fit:cover;" />`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">🎮</div>'}
          <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.85), transparent);padding:24px 12px 8px;">
            <div style="font-weight:700;color:#fff;font-size:14px;">${it(a.name)}</div>
            <div style="font-size:11px;color:var(--color-cyan-neon);margin-top:2px;">${a.totalViewers||0} viewers &bull; ${a.liveStreamCount||0} live</div>
          </div>
        </div>
      </div>
    `).join(""),t.querySelectorAll(".category-card").forEach(a=>{a.addEventListener("click",()=>I.navigate("category-detail",{slug:a.dataset.slug}))})}catch{t.innerHTML='<p class="text-muted" style="grid-column:1/-1;">Failed to load categories.</p>'}}async function Wo(){const t=document.getElementById("home-clips-grid");if(t)try{const e=await Ft.getTop(4);if(!(e!=null&&e.length)){const a=document.getElementById("home-trending-clips-section");a&&(a.style.display="none");return}t.innerHTML=e.map(a=>`
      <div class="card clip-card hover-lift stagger-item" data-clip-id="${a.id}" style="cursor:pointer;border-radius:12px;overflow:hidden;">
        <div style="position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;">
          <img src="${ht}" data-thumb-src="${a.thumbnailUrl||""}" alt="${it(a.title)}" style="width:100%;height:100%;object-fit:cover;" />
          <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.65);padding:2px 8px;border-radius:4px;font-size:11px;color:#fff;">
            ${N.eye} ${a.viewCount||0}
          </div>
          <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.75);padding:2px 6px;border-radius:4px;font-size:11px;color:var(--color-cyan-neon);font-family:monospace;">
            ${a.durationSeconds?`${Math.floor(a.durationSeconds)}s`:"0:30"}
          </div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(0,242,254,0.9);display:flex;align-items:center;justify-content:center;color:#000;font-size:14px;">
              ▶
            </div>
          </div>
        </div>
        <div style="padding:12px;">
          <div style="font-weight:600;font-size:13px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${it(a.title||"Highlight Clip")}
          </div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">
            Clipped by @${it(a.creatorUsername||"user")}
          </div>
        </div>
      </div>
    `).join(""),Et(t),t.querySelectorAll(".clip-card").forEach(a=>{a.addEventListener("click",()=>{const s=parseInt(a.dataset.clipId),d=e.find(h=>h.id===s);d&&zi(d)})})}catch{const a=document.getElementById("home-trending-clips-section");a&&(a.style.display="none")}}const Ko="modulepreload",Yo=function(t,e){return new URL(t,e).href},aa={},Ea=function(e,a,s){let d=Promise.resolve();if(a&&a.length>0){const g=document.getElementsByTagName("link"),f=document.querySelector("meta[property=csp-nonce]"),_=(f==null?void 0:f.nonce)||(f==null?void 0:f.getAttribute("nonce"));d=Promise.allSettled(a.map(b=>{if(b=Yo(b,s),b in aa)return;aa[b]=!0;const u=b.endsWith(".css"),x=u?'[rel="stylesheet"]':"";if(!!s)for(let S=g.length-1;S>=0;S--){const w=g[S];if(w.href===b&&(!u||w.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${b}"]${x}`))return;const y=document.createElement("link");if(y.rel=u?"stylesheet":Ko,u||(y.as="script"),y.crossOrigin="",y.href=b,_&&y.setAttribute("nonce",_),document.head.appendChild(y),u)return new Promise((S,w)=>{y.addEventListener("load",S),y.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${b}`)))})}))}function h(g){const f=new Event("vite:preloadError",{cancelable:!0});if(f.payload=g,window.dispatchEvent(f),!f.defaultPrevented)throw g}return d.then(g=>{for(const f of g||[])f.status==="rejected"&&h(f.reason);return e().catch(h)})},Jo={getStreamChat:t=>re(`/api/Chat/${t}`),getStreamChatRange:(t,e,a)=>re(`/api/Chat/${t}/range?from=${e}&to=${a}`)},zt={deleteMessage:(t,e)=>re(`/api/Moderation/${t}/messages/${e}`,{method:"DELETE"}),timeoutUser:(t,e)=>re(`/api/Moderation/${t}/timeout`,{method:"POST",body:JSON.stringify(e)}),banUser:(t,e)=>re(`/api/Moderation/${t}/ban`,{method:"POST",body:JSON.stringify(e)}),unbanUser:(t,e)=>re(`/api/Moderation/${t}/ban/${e}`,{method:"DELETE"})};class ii extends Error{constructor(e,a){const s=new.target.prototype;super(`${e}: Status code '${a}'`),this.statusCode=a,this.__proto__=s}}class Pn extends Error{constructor(e="A timeout occurred."){const a=new.target.prototype;super(e),this.__proto__=a}}class At extends Error{constructor(e="An abort occurred."){const a=new.target.prototype;super(e),this.__proto__=a}}class Xo extends Error{constructor(e,a){const s=new.target.prototype;super(e),this.transport=a,this.errorType="UnsupportedTransportError",this.__proto__=s}}class Qo extends Error{constructor(e,a){const s=new.target.prototype;super(e),this.transport=a,this.errorType="DisabledTransportError",this.__proto__=s}}class Zo extends Error{constructor(e,a){const s=new.target.prototype;super(e),this.transport=a,this.errorType="FailedToStartTransportError",this.__proto__=s}}class oa extends Error{constructor(e){const a=new.target.prototype;super(e),this.errorType="FailedToNegotiateWithServerError",this.__proto__=a}}class er extends Error{constructor(e,a){const s=new.target.prototype;super(e),this.innerErrors=a,this.__proto__=s}}class ka{constructor(e,a,s){this.statusCode=e,this.statusText=a,this.content=s}}class dn{get(e,a){return this.send({...a,method:"GET",url:e})}post(e,a){return this.send({...a,method:"POST",url:e})}delete(e,a){return this.send({...a,method:"DELETE",url:e})}getCookieString(e){return""}}var ie;(function(t){t[t.Trace=0]="Trace",t[t.Debug=1]="Debug",t[t.Information=2]="Information",t[t.Warning=3]="Warning",t[t.Error=4]="Error",t[t.Critical=5]="Critical",t[t.None=6]="None"})(ie||(ie={}));class Ui{constructor(){}log(e,a){}}Ui.instance=new Ui;const tr="8.0.29";class Ye{static isRequired(e,a){if(e==null)throw new Error(`The '${a}' argument is required.`)}static isNotEmpty(e,a){if(!e||e.match(/^\s*$/))throw new Error(`The '${a}' argument should not be empty.`)}static isIn(e,a,s){if(!(e in a))throw new Error(`Unknown ${s} value: ${e}.`)}}class Ge{static get isBrowser(){return!Ge.isNode&&typeof window=="object"&&typeof window.document=="object"}static get isWebWorker(){return!Ge.isNode&&typeof self=="object"&&"importScripts"in self}static get isReactNative(){return!Ge.isNode&&typeof window=="object"&&typeof window.document>"u"}static get isNode(){return typeof process<"u"&&process.release&&process.release.name==="node"}}function Ni(t,e){let a="";return si(t)?(a=`Binary data of length ${t.byteLength}`,e&&(a+=`. Content: '${ir(t)}'`)):typeof t=="string"&&(a=`String data of length ${t.length}`,e&&(a+=`. Content: '${t}'`)),a}function ir(t){const e=new Uint8Array(t);let a="";return e.forEach(s=>{const d=s<16?"0":"";a+=`0x${d}${s.toString(16)} `}),a.substr(0,a.length-1)}function si(t){return t&&typeof ArrayBuffer<"u"&&(t instanceof ArrayBuffer||t.constructor&&t.constructor.name==="ArrayBuffer")}async function Ca(t,e,a,s,d,h){const g={},[f,_]=bi();g[f]=_,t.log(ie.Trace,`(${e} transport) sending data. ${Ni(d,h.logMessageContent)}.`);const b=si(d)?"arraybuffer":"text",u=await a.post(s,{content:d,headers:{...g,...h.headers},responseType:b,timeout:h.timeout,withCredentials:h.withCredentials});t.log(ie.Trace,`(${e} transport) request complete. Response status: ${u.statusCode}.`)}function nr(t){return t===void 0?new an(ie.Information):t===null?Ui.instance:t.log!==void 0?t:new an(t)}class ar{constructor(e,a){this._subject=e,this._observer=a}dispose(){const e=this._subject.observers.indexOf(this._observer);e>-1&&this._subject.observers.splice(e,1),this._subject.observers.length===0&&this._subject.cancelCallback&&this._subject.cancelCallback().catch(a=>{})}}class an{constructor(e){this._minLevel=e,this.out=console}log(e,a){if(e>=this._minLevel){const s=`[${new Date().toISOString()}] ${ie[e]}: ${a}`;switch(e){case ie.Critical:case ie.Error:this.out.error(s);break;case ie.Warning:this.out.warn(s);break;case ie.Information:this.out.info(s);break;default:this.out.log(s);break}}}}function bi(){let t="X-SignalR-User-Agent";return Ge.isNode&&(t="User-Agent"),[t,or(tr,rr(),lr(),sr())]}function or(t,e,a,s){let d="Microsoft SignalR/";const h=t.split(".");return d+=`${h[0]}.${h[1]}`,d+=` (${t}; `,e&&e!==""?d+=`${e}; `:d+="Unknown OS; ",d+=`${a}`,s?d+=`; ${s}`:d+="; Unknown Runtime Version",d+=")",d}function rr(){if(Ge.isNode)switch(process.platform){case"win32":return"Windows NT";case"darwin":return"macOS";case"linux":return"Linux";default:return process.platform}else return""}function sr(){if(Ge.isNode)return process.versions.node}function lr(){return Ge.isNode?"NodeJS":"Browser"}function _n(t){return t.stack?t.stack:t.message?t.message:`${t}`}function dr(){if(typeof globalThis<"u")return globalThis;if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("could not find global")}class cr extends dn{constructor(e){if(super(),this._logger=e,typeof fetch>"u"||Ge.isNode){const a=typeof __webpack_require__=="function"?__non_webpack_require__:require;this._jar=new(a("tough-cookie")).CookieJar,typeof fetch>"u"?this._fetchType=a("node-fetch"):this._fetchType=fetch,this._fetchType=a("fetch-cookie")(this._fetchType,this._jar)}else this._fetchType=fetch.bind(dr());if(typeof AbortController>"u"){const a=typeof __webpack_require__=="function"?__non_webpack_require__:require;this._abortControllerType=a("abort-controller")}else this._abortControllerType=AbortController}async send(e){if(e.abortSignal&&e.abortSignal.aborted)throw new At;if(!e.method)throw new Error("No method defined.");if(!e.url)throw new Error("No url defined.");const a=new this._abortControllerType;let s;e.abortSignal&&(e.abortSignal.onabort=()=>{a.abort(),s=new At});let d=null;if(e.timeout){const _=e.timeout;d=setTimeout(()=>{a.abort(),this._logger.log(ie.Warning,"Timeout from HTTP request."),s=new Pn},_)}e.content===""&&(e.content=void 0),e.content&&(e.headers=e.headers||{},si(e.content)?e.headers["Content-Type"]="application/octet-stream":e.headers["Content-Type"]="text/plain;charset=UTF-8");let h;try{h=await this._fetchType(e.url,{body:e.content,cache:"no-cache",credentials:e.withCredentials===!0?"include":"same-origin",headers:{"X-Requested-With":"XMLHttpRequest",...e.headers},method:e.method,mode:"cors",redirect:"follow",signal:a.signal})}catch(_){throw s||(this._logger.log(ie.Warning,`Error from HTTP request. ${_}.`),_)}finally{d&&clearTimeout(d),e.abortSignal&&(e.abortSignal.onabort=null)}if(!h.ok){const _=await ra(h,"text");throw new ii(_||h.statusText,h.status)}const f=await ra(h,e.responseType);return new ka(h.status,h.statusText,f)}getCookieString(e){let a="";return Ge.isNode&&this._jar&&this._jar.getCookies(e,(s,d)=>a=d.join("; ")),a}}function ra(t,e){let a;switch(e){case"arraybuffer":a=t.arrayBuffer();break;case"text":a=t.text();break;case"blob":case"document":case"json":throw new Error(`${e} is not supported.`);default:a=t.text();break}return a}class ur extends dn{constructor(e){super(),this._logger=e}send(e){return e.abortSignal&&e.abortSignal.aborted?Promise.reject(new At):e.method?e.url?new Promise((a,s)=>{const d=new XMLHttpRequest;d.open(e.method,e.url,!0),d.withCredentials=e.withCredentials===void 0?!0:e.withCredentials,d.setRequestHeader("X-Requested-With","XMLHttpRequest"),e.content===""&&(e.content=void 0),e.content&&(si(e.content)?d.setRequestHeader("Content-Type","application/octet-stream"):d.setRequestHeader("Content-Type","text/plain;charset=UTF-8"));const h=e.headers;h&&Object.keys(h).forEach(g=>{d.setRequestHeader(g,h[g])}),e.responseType&&(d.responseType=e.responseType),e.abortSignal&&(e.abortSignal.onabort=()=>{d.abort(),s(new At)}),e.timeout&&(d.timeout=e.timeout),d.onload=()=>{e.abortSignal&&(e.abortSignal.onabort=null),d.status>=200&&d.status<300?a(new ka(d.status,d.statusText,d.response||d.responseText)):s(new ii(d.response||d.responseText||d.statusText,d.status))},d.onerror=()=>{this._logger.log(ie.Warning,`Error from HTTP request. ${d.status}: ${d.statusText}.`),s(new ii(d.statusText,d.status))},d.ontimeout=()=>{this._logger.log(ie.Warning,"Timeout from HTTP request."),s(new Pn)},d.send(e.content)}):Promise.reject(new Error("No url defined.")):Promise.reject(new Error("No method defined."))}}class pr extends dn{constructor(e){if(super(),typeof fetch<"u"||Ge.isNode)this._httpClient=new cr(e);else if(typeof XMLHttpRequest<"u")this._httpClient=new ur(e);else throw new Error("No usable HttpClient found.")}send(e){return e.abortSignal&&e.abortSignal.aborted?Promise.reject(new At):e.method?e.url?this._httpClient.send(e):Promise.reject(new Error("No url defined.")):Promise.reject(new Error("No method defined."))}getCookieString(e){return this._httpClient.getCookieString(e)}}class bt{static write(e){return`${e}${bt.RecordSeparator}`}static parse(e){if(e[e.length-1]!==bt.RecordSeparator)throw new Error("Message is incomplete.");const a=e.split(bt.RecordSeparator);return a.pop(),a}}bt.RecordSeparatorCode=30;bt.RecordSeparator=String.fromCharCode(bt.RecordSeparatorCode);class hr{writeHandshakeRequest(e){return bt.write(JSON.stringify(e))}parseHandshakeResponse(e){let a,s;if(si(e)){const f=new Uint8Array(e),_=f.indexOf(bt.RecordSeparatorCode);if(_===-1)throw new Error("Message is incomplete.");const b=_+1;a=String.fromCharCode.apply(null,Array.prototype.slice.call(f.slice(0,b))),s=f.byteLength>b?f.slice(b).buffer:null}else{const f=e,_=f.indexOf(bt.RecordSeparator);if(_===-1)throw new Error("Message is incomplete.");const b=_+1;a=f.substring(0,b),s=f.length>b?f.substring(b):null}const d=bt.parse(a),h=JSON.parse(d[0]);if(h.type)throw new Error("Expected a handshake response from the server.");return[s,h]}}var Ce;(function(t){t[t.Invocation=1]="Invocation",t[t.StreamItem=2]="StreamItem",t[t.Completion=3]="Completion",t[t.StreamInvocation=4]="StreamInvocation",t[t.CancelInvocation=5]="CancelInvocation",t[t.Ping=6]="Ping",t[t.Close=7]="Close",t[t.Ack=8]="Ack",t[t.Sequence=9]="Sequence"})(Ce||(Ce={}));class fr{constructor(){this.observers=[]}next(e){for(const a of this.observers)a.next(e)}error(e){for(const a of this.observers)a.error&&a.error(e)}complete(){for(const e of this.observers)e.complete&&e.complete()}subscribe(e){return this.observers.push(e),new ar(this,e)}}class mr{constructor(e,a,s){this._bufferSize=1e5,this._messages=[],this._totalMessageCount=0,this._waitForSequenceMessage=!1,this._nextReceivingSequenceId=1,this._latestReceivedSequenceId=0,this._bufferedByteCount=0,this._reconnectInProgress=!1,this._protocol=e,this._connection=a,this._bufferSize=s}async _send(e){const a=this._protocol.writeMessage(e);let s=Promise.resolve();if(this._isInvocationMessage(e)){this._totalMessageCount++;let d=()=>{},h=()=>{};si(a)?this._bufferedByteCount+=a.byteLength:this._bufferedByteCount+=a.length,this._bufferedByteCount>=this._bufferSize&&(s=new Promise((g,f)=>{d=g,h=f})),this._messages.push(new gr(a,this._totalMessageCount,d,h))}try{this._reconnectInProgress||await this._connection.send(a)}catch{this._disconnected()}await s}_ack(e){let a=-1;for(let s=0;s<this._messages.length;s++){const d=this._messages[s];if(d._id<=e.sequenceId)a=s,si(d._message)?this._bufferedByteCount-=d._message.byteLength:this._bufferedByteCount-=d._message.length,d._resolver();else if(this._bufferedByteCount<this._bufferSize)d._resolver();else break}a!==-1&&(this._messages=this._messages.slice(a+1))}_shouldProcessMessage(e){if(this._waitForSequenceMessage)return e.type!==Ce.Sequence?!1:(this._waitForSequenceMessage=!1,!0);if(!this._isInvocationMessage(e))return!0;const a=this._nextReceivingSequenceId;return this._nextReceivingSequenceId++,a<=this._latestReceivedSequenceId?(a===this._latestReceivedSequenceId&&this._ackTimer(),!1):(this._latestReceivedSequenceId=a,this._ackTimer(),!0)}_resetSequence(e){if(e.sequenceId>this._nextReceivingSequenceId){this._connection.stop(new Error("Sequence ID greater than amount of messages we've received."));return}this._nextReceivingSequenceId=e.sequenceId}_disconnected(){this._reconnectInProgress=!0,this._waitForSequenceMessage=!0}async _resend(){const e=this._messages.length!==0?this._messages[0]._id:this._totalMessageCount+1;await this._connection.send(this._protocol.writeMessage({type:Ce.Sequence,sequenceId:e}));const a=this._messages;for(const s of a)await this._connection.send(s._message);this._reconnectInProgress=!1}_dispose(e){e??(e=new Error("Unable to reconnect to server."));for(const a of this._messages)a._rejector(e)}_isInvocationMessage(e){switch(e.type){case Ce.Invocation:case Ce.StreamItem:case Ce.Completion:case Ce.StreamInvocation:case Ce.CancelInvocation:return!0;case Ce.Close:case Ce.Sequence:case Ce.Ping:case Ce.Ack:return!1}}_ackTimer(){this._ackTimerHandle===void 0&&(this._ackTimerHandle=setTimeout(async()=>{try{this._reconnectInProgress||await this._connection.send(this._protocol.writeMessage({type:Ce.Ack,sequenceId:this._latestReceivedSequenceId}))}catch{}clearTimeout(this._ackTimerHandle),this._ackTimerHandle=void 0},1e3))}}class gr{constructor(e,a,s,d){this._message=e,this._id=a,this._resolver=s,this._rejector=d}}const _r=30*1e3,vr=15*1e3,yr=1e5;var je;(function(t){t.Disconnected="Disconnected",t.Connecting="Connecting",t.Connected="Connected",t.Disconnecting="Disconnecting",t.Reconnecting="Reconnecting"})(je||(je={}));class $n{static create(e,a,s,d,h,g,f){return new $n(e,a,s,d,h,g,f)}constructor(e,a,s,d,h,g,f){this._nextKeepAlive=0,this._freezeEventListener=()=>{this._logger.log(ie.Warning,"The page is being frozen, this will likely lead to the connection being closed and messages being lost. For more information see the docs at https://learn.microsoft.com/aspnet/core/signalr/javascript-client#bsleep")},Ye.isRequired(e,"connection"),Ye.isRequired(a,"logger"),Ye.isRequired(s,"protocol"),this.serverTimeoutInMilliseconds=h??_r,this.keepAliveIntervalInMilliseconds=g??vr,this._statefulReconnectBufferSize=f??yr,this._logger=a,this._protocol=s,this.connection=e,this._reconnectPolicy=d,this._handshakeProtocol=new hr,this.connection.onreceive=_=>this._processIncomingData(_),this.connection.onclose=_=>this._connectionClosed(_),this._callbacks={},this._methods={},this._closedCallbacks=[],this._reconnectingCallbacks=[],this._reconnectedCallbacks=[],this._invocationId=0,this._receivedHandshakeResponse=!1,this._connectionState=je.Disconnected,this._connectionStarted=!1,this._cachedPingMessage=this._protocol.writeMessage({type:Ce.Ping})}get state(){return this._connectionState}get connectionId(){return this.connection&&this.connection.connectionId||null}get baseUrl(){return this.connection.baseUrl||""}set baseUrl(e){if(this._connectionState!==je.Disconnected&&this._connectionState!==je.Reconnecting)throw new Error("The HubConnection must be in the Disconnected or Reconnecting state to change the url.");if(!e)throw new Error("The HubConnection url must be a valid url.");this.connection.baseUrl=e}start(){return this._startPromise=this._startWithStateTransitions(),this._startPromise}async _startWithStateTransitions(){if(this._connectionState!==je.Disconnected)return Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));this._connectionState=je.Connecting,this._logger.log(ie.Debug,"Starting HubConnection.");try{await this._startInternal(),Ge.isBrowser&&window.document.addEventListener("freeze",this._freezeEventListener),this._connectionState=je.Connected,this._connectionStarted=!0,this._logger.log(ie.Debug,"HubConnection connected successfully.")}catch(e){return this._connectionState=je.Disconnected,this._logger.log(ie.Debug,`HubConnection failed to start successfully because of error '${e}'.`),Promise.reject(e)}}async _startInternal(){this._stopDuringStartError=void 0,this._receivedHandshakeResponse=!1;const e=new Promise((a,s)=>{this._handshakeResolver=a,this._handshakeRejecter=s});await this.connection.start(this._protocol.transferFormat);try{let a=this._protocol.version;this.connection.features.reconnect||(a=1);const s={protocol:this._protocol.name,version:a};if(this._logger.log(ie.Debug,"Sending handshake request."),await this._sendMessage(this._handshakeProtocol.writeHandshakeRequest(s)),this._logger.log(ie.Information,`Using HubProtocol '${this._protocol.name}'.`),this._cleanupTimeout(),this._resetTimeoutPeriod(),this._resetKeepAliveInterval(),await e,this._stopDuringStartError)throw this._stopDuringStartError;(this.connection.features.reconnect||!1)&&(this._messageBuffer=new mr(this._protocol,this.connection,this._statefulReconnectBufferSize),this.connection.features.disconnected=this._messageBuffer._disconnected.bind(this._messageBuffer),this.connection.features.resend=()=>{if(this._messageBuffer)return this._messageBuffer._resend()}),this.connection.features.inherentKeepAlive||await this._sendMessage(this._cachedPingMessage)}catch(a){throw this._logger.log(ie.Debug,`Hub handshake failed with error '${a}' during start(). Stopping HubConnection.`),this._cleanupTimeout(),this._cleanupPingTimer(),await this.connection.stop(a),a}}async stop(){const e=this._startPromise;this.connection.features.reconnect=!1,this._stopPromise=this._stopInternal(),await this._stopPromise;try{await e}catch{}}_stopInternal(e){if(this._connectionState===je.Disconnected)return this._logger.log(ie.Debug,`Call to HubConnection.stop(${e}) ignored because it is already in the disconnected state.`),Promise.resolve();if(this._connectionState===je.Disconnecting)return this._logger.log(ie.Debug,`Call to HttpConnection.stop(${e}) ignored because the connection is already in the disconnecting state.`),this._stopPromise;const a=this._connectionState;return this._connectionState=je.Disconnecting,this._logger.log(ie.Debug,"Stopping HubConnection."),this._reconnectDelayHandle?(this._logger.log(ie.Debug,"Connection stopped during reconnect delay. Done reconnecting."),clearTimeout(this._reconnectDelayHandle),this._reconnectDelayHandle=void 0,this._completeClose(),Promise.resolve()):(a===je.Connected&&this._sendCloseMessage(),this._cleanupTimeout(),this._cleanupPingTimer(),this._stopDuringStartError=e||new At("The connection was stopped before the hub handshake could complete."),this.connection.stop(e))}async _sendCloseMessage(){try{await this._sendWithProtocol(this._createCloseMessage())}catch{}}stream(e,...a){const[s,d]=this._replaceStreamingParams(a),h=this._createStreamInvocation(e,a,d);let g;const f=new fr;return f.cancelCallback=()=>{const _=this._createCancelInvocation(h.invocationId);return delete this._callbacks[h.invocationId],g.then(()=>this._sendWithProtocol(_))},this._callbacks[h.invocationId]=(_,b)=>{if(b){f.error(b);return}else _&&(_.type===Ce.Completion?_.error?f.error(new Error(_.error)):f.complete():f.next(_.item))},g=this._sendWithProtocol(h).catch(_=>{f.error(_),delete this._callbacks[h.invocationId]}),this._launchStreams(s,g),f}_sendMessage(e){return this._resetKeepAliveInterval(),this.connection.send(e)}_sendWithProtocol(e){return this._messageBuffer?this._messageBuffer._send(e):this._sendMessage(this._protocol.writeMessage(e))}send(e,...a){const[s,d]=this._replaceStreamingParams(a),h=this._sendWithProtocol(this._createInvocation(e,a,!0,d));return this._launchStreams(s,h),h}invoke(e,...a){const[s,d]=this._replaceStreamingParams(a),h=this._createInvocation(e,a,!1,d);return new Promise((f,_)=>{this._callbacks[h.invocationId]=(u,x)=>{if(x){_(x);return}else u&&(u.type===Ce.Completion?u.error?_(new Error(u.error)):f(u.result):_(new Error(`Unexpected message type: ${u.type}`)))};const b=this._sendWithProtocol(h).catch(u=>{_(u),delete this._callbacks[h.invocationId]});this._launchStreams(s,b)})}on(e,a){!e||!a||(e=e.toLowerCase(),this._methods[e]||(this._methods[e]=[]),this._methods[e].indexOf(a)===-1&&this._methods[e].push(a))}off(e,a){if(!e)return;e=e.toLowerCase();const s=this._methods[e];if(s)if(a){const d=s.indexOf(a);d!==-1&&(s.splice(d,1),s.length===0&&delete this._methods[e])}else delete this._methods[e]}onclose(e){e&&this._closedCallbacks.push(e)}onreconnecting(e){e&&this._reconnectingCallbacks.push(e)}onreconnected(e){e&&this._reconnectedCallbacks.push(e)}_processIncomingData(e){if(this._cleanupTimeout(),this._receivedHandshakeResponse||(e=this._processHandshakeResponse(e),this._receivedHandshakeResponse=!0),e){const a=this._protocol.parseMessages(e,this._logger);for(const s of a)if(!(this._messageBuffer&&!this._messageBuffer._shouldProcessMessage(s)))switch(s.type){case Ce.Invocation:this._invokeClientMethod(s).catch(d=>{this._logger.log(ie.Error,`Invoke client method threw error: ${_n(d)}`)});break;case Ce.StreamItem:case Ce.Completion:{const d=this._callbacks[s.invocationId];if(d){s.type===Ce.Completion&&delete this._callbacks[s.invocationId];try{d(s)}catch(h){this._logger.log(ie.Error,`Stream callback threw error: ${_n(h)}`)}}break}case Ce.Ping:break;case Ce.Close:{this._logger.log(ie.Information,"Close message received from server.");const d=s.error?new Error("Server returned an error on close: "+s.error):void 0;s.allowReconnect===!0?this.connection.stop(d):this._stopPromise=this._stopInternal(d);break}case Ce.Ack:this._messageBuffer&&this._messageBuffer._ack(s);break;case Ce.Sequence:this._messageBuffer&&this._messageBuffer._resetSequence(s);break;default:this._logger.log(ie.Warning,`Invalid message type: ${s.type}.`);break}}this._resetTimeoutPeriod()}_processHandshakeResponse(e){let a,s;try{[s,a]=this._handshakeProtocol.parseHandshakeResponse(e)}catch(d){const h="Error parsing handshake response: "+d;this._logger.log(ie.Error,h);const g=new Error(h);throw this._handshakeRejecter(g),g}if(a.error){const d="Server returned handshake error: "+a.error;this._logger.log(ie.Error,d);const h=new Error(d);throw this._handshakeRejecter(h),h}else this._logger.log(ie.Debug,"Server handshake complete.");return this._handshakeResolver(),s}_resetKeepAliveInterval(){this.connection.features.inherentKeepAlive||(this._nextKeepAlive=new Date().getTime()+this.keepAliveIntervalInMilliseconds,this._cleanupPingTimer())}_resetTimeoutPeriod(){if((!this.connection.features||!this.connection.features.inherentKeepAlive)&&(this._timeoutHandle=setTimeout(()=>this.serverTimeout(),this.serverTimeoutInMilliseconds),this._pingServerHandle===void 0)){let e=this._nextKeepAlive-new Date().getTime();e<0&&(e=0),this._pingServerHandle=setTimeout(async()=>{if(this._connectionState===je.Connected)try{await this._sendMessage(this._cachedPingMessage)}catch{this._cleanupPingTimer()}},e)}}serverTimeout(){this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."))}async _invokeClientMethod(e){const a=e.target.toLowerCase(),s=this._methods[a];if(!s){this._logger.log(ie.Warning,`No client method with the name '${a}' found.`),e.invocationId&&(this._logger.log(ie.Warning,`No result given for '${a}' method and invocation ID '${e.invocationId}'.`),await this._sendWithProtocol(this._createCompletionMessage(e.invocationId,"Client didn't provide a result.",null)));return}const d=s.slice(),h=!!e.invocationId;let g,f,_;for(const b of d)try{const u=g;g=await b.apply(this,e.arguments),h&&g&&u&&(this._logger.log(ie.Error,`Multiple results provided for '${a}'. Sending error to server.`),_=this._createCompletionMessage(e.invocationId,"Client provided multiple results.",null)),f=void 0}catch(u){f=u,this._logger.log(ie.Error,`A callback for the method '${a}' threw error '${u}'.`)}_?await this._sendWithProtocol(_):h?(f?_=this._createCompletionMessage(e.invocationId,`${f}`,null):g!==void 0?_=this._createCompletionMessage(e.invocationId,null,g):(this._logger.log(ie.Warning,`No result given for '${a}' method and invocation ID '${e.invocationId}'.`),_=this._createCompletionMessage(e.invocationId,"Client didn't provide a result.",null)),await this._sendWithProtocol(_)):g&&this._logger.log(ie.Error,`Result given for '${a}' method but server is not expecting a result.`)}_connectionClosed(e){this._logger.log(ie.Debug,`HubConnection.connectionClosed(${e}) called while in state ${this._connectionState}.`),this._stopDuringStartError=this._stopDuringStartError||e||new At("The underlying connection was closed before the hub handshake could complete."),this._handshakeResolver&&this._handshakeResolver(),this._cancelCallbacksWithError(e||new Error("Invocation canceled due to the underlying connection being closed.")),this._cleanupTimeout(),this._cleanupPingTimer(),this._connectionState===je.Disconnecting?this._completeClose(e):this._connectionState===je.Connected&&this._reconnectPolicy?this._reconnect(e):this._connectionState===je.Connected&&this._completeClose(e)}_completeClose(e){if(this._connectionStarted){this._connectionState=je.Disconnected,this._connectionStarted=!1,this._messageBuffer&&(this._messageBuffer._dispose(e??new Error("Connection closed.")),this._messageBuffer=void 0),Ge.isBrowser&&window.document.removeEventListener("freeze",this._freezeEventListener);try{this._closedCallbacks.forEach(a=>a.apply(this,[e]))}catch(a){this._logger.log(ie.Error,`An onclose callback called with error '${e}' threw error '${a}'.`)}}}async _reconnect(e){const a=Date.now();let s=0,d=e!==void 0?e:new Error("Attempting to reconnect due to a unknown error."),h=this._getNextRetryDelay(s++,0,d);if(h===null){this._logger.log(ie.Debug,"Connection not reconnecting because the IRetryPolicy returned null on the first reconnect attempt."),this._completeClose(e);return}if(this._connectionState=je.Reconnecting,e?this._logger.log(ie.Information,`Connection reconnecting because of error '${e}'.`):this._logger.log(ie.Information,"Connection reconnecting."),this._reconnectingCallbacks.length!==0){try{this._reconnectingCallbacks.forEach(g=>g.apply(this,[e]))}catch(g){this._logger.log(ie.Error,`An onreconnecting callback called with error '${e}' threw error '${g}'.`)}if(this._connectionState!==je.Reconnecting){this._logger.log(ie.Debug,"Connection left the reconnecting state in onreconnecting callback. Done reconnecting.");return}}for(;h!==null;){if(this._logger.log(ie.Information,`Reconnect attempt number ${s} will start in ${h} ms.`),await new Promise(g=>{this._reconnectDelayHandle=setTimeout(g,h)}),this._reconnectDelayHandle=void 0,this._connectionState!==je.Reconnecting){this._logger.log(ie.Debug,"Connection left the reconnecting state during reconnect delay. Done reconnecting.");return}try{if(await this._startInternal(),this._connectionState=je.Connected,this._logger.log(ie.Information,"HubConnection reconnected successfully."),this._reconnectedCallbacks.length!==0)try{this._reconnectedCallbacks.forEach(g=>g.apply(this,[this.connection.connectionId]))}catch(g){this._logger.log(ie.Error,`An onreconnected callback called with connectionId '${this.connection.connectionId}; threw error '${g}'.`)}return}catch(g){if(this._logger.log(ie.Information,`Reconnect attempt failed because of error '${g}'.`),this._connectionState!==je.Reconnecting){this._logger.log(ie.Debug,`Connection moved to the '${this._connectionState}' from the reconnecting state during reconnect attempt. Done reconnecting.`),this._connectionState===je.Disconnecting&&this._completeClose();return}d=g instanceof Error?g:new Error(g.toString()),h=this._getNextRetryDelay(s++,Date.now()-a,d)}}this._logger.log(ie.Information,`Reconnect retries have been exhausted after ${Date.now()-a} ms and ${s} failed attempts. Connection disconnecting.`),this._completeClose()}_getNextRetryDelay(e,a,s){try{return this._reconnectPolicy.nextRetryDelayInMilliseconds({elapsedMilliseconds:a,previousRetryCount:e,retryReason:s})}catch(d){return this._logger.log(ie.Error,`IRetryPolicy.nextRetryDelayInMilliseconds(${e}, ${a}) threw error '${d}'.`),null}}_cancelCallbacksWithError(e){const a=this._callbacks;this._callbacks={},Object.keys(a).forEach(s=>{const d=a[s];try{d(null,e)}catch(h){this._logger.log(ie.Error,`Stream 'error' callback called with '${e}' threw error: ${_n(h)}`)}})}_cleanupPingTimer(){this._pingServerHandle&&(clearTimeout(this._pingServerHandle),this._pingServerHandle=void 0)}_cleanupTimeout(){this._timeoutHandle&&clearTimeout(this._timeoutHandle)}_createInvocation(e,a,s,d){if(s)return d.length!==0?{arguments:a,streamIds:d,target:e,type:Ce.Invocation}:{arguments:a,target:e,type:Ce.Invocation};{const h=this._invocationId;return this._invocationId++,d.length!==0?{arguments:a,invocationId:h.toString(),streamIds:d,target:e,type:Ce.Invocation}:{arguments:a,invocationId:h.toString(),target:e,type:Ce.Invocation}}}_launchStreams(e,a){if(e.length!==0){a||(a=Promise.resolve());for(const s in e)e[s].subscribe({complete:()=>{a=a.then(()=>this._sendWithProtocol(this._createCompletionMessage(s)))},error:d=>{let h;d instanceof Error?h=d.message:d&&d.toString?h=d.toString():h="Unknown error",a=a.then(()=>this._sendWithProtocol(this._createCompletionMessage(s,h)))},next:d=>{a=a.then(()=>this._sendWithProtocol(this._createStreamItemMessage(s,d)))}})}}_replaceStreamingParams(e){const a=[],s=[];for(let d=0;d<e.length;d++){const h=e[d];if(this._isObservable(h)){const g=this._invocationId;this._invocationId++,a[g]=h,s.push(g.toString()),e.splice(d,1)}}return[a,s]}_isObservable(e){return e&&e.subscribe&&typeof e.subscribe=="function"}_createStreamInvocation(e,a,s){const d=this._invocationId;return this._invocationId++,s.length!==0?{arguments:a,invocationId:d.toString(),streamIds:s,target:e,type:Ce.StreamInvocation}:{arguments:a,invocationId:d.toString(),target:e,type:Ce.StreamInvocation}}_createCancelInvocation(e){return{invocationId:e,type:Ce.CancelInvocation}}_createStreamItemMessage(e,a){return{invocationId:e,item:a,type:Ce.StreamItem}}_createCompletionMessage(e,a,s){return a?{error:a,invocationId:e,type:Ce.Completion}:{invocationId:e,result:s,type:Ce.Completion}}_createCloseMessage(){return{type:Ce.Close}}}const br=[0,2e3,1e4,3e4,null];class sa{constructor(e){this._retryDelays=e!==void 0?[...e,null]:br}nextRetryDelayInMilliseconds(e){return this._retryDelays[e.previousRetryCount]}}class ni{}ni.Authorization="Authorization";ni.Cookie="Cookie";class xr extends dn{constructor(e,a){super(),this._innerClient=e,this._accessTokenFactory=a}async send(e){let a=!0;this._accessTokenFactory&&(!this._accessToken||e.url&&e.url.indexOf("/negotiate?")>0)&&(a=!1,this._accessToken=await this._accessTokenFactory()),this._setAuthorizationHeader(e);const s=await this._innerClient.send(e);return a&&s.statusCode===401&&this._accessTokenFactory?(this._accessToken=await this._accessTokenFactory(),this._setAuthorizationHeader(e),await this._innerClient.send(e)):s}_setAuthorizationHeader(e){e.headers||(e.headers={}),this._accessToken?e.headers[ni.Authorization]=`Bearer ${this._accessToken}`:this._accessTokenFactory&&e.headers[ni.Authorization]&&delete e.headers[ni.Authorization]}getCookieString(e){return this._innerClient.getCookieString(e)}}var Xe;(function(t){t[t.None=0]="None",t[t.WebSockets=1]="WebSockets",t[t.ServerSentEvents=2]="ServerSentEvents",t[t.LongPolling=4]="LongPolling"})(Xe||(Xe={}));var rt;(function(t){t[t.Text=1]="Text",t[t.Binary=2]="Binary"})(rt||(rt={}));let wr=class{constructor(){this._isAborted=!1,this.onabort=null}abort(){this._isAborted||(this._isAborted=!0,this.onabort&&this.onabort())}get signal(){return this}get aborted(){return this._isAborted}};class la{get pollAborted(){return this._pollAbort.aborted}constructor(e,a,s){this._httpClient=e,this._logger=a,this._pollAbort=new wr,this._options=s,this._running=!1,this.onreceive=null,this.onclose=null}async connect(e,a){if(Ye.isRequired(e,"url"),Ye.isRequired(a,"transferFormat"),Ye.isIn(a,rt,"transferFormat"),this._url=e,this._logger.log(ie.Trace,"(LongPolling transport) Connecting."),a===rt.Binary&&typeof XMLHttpRequest<"u"&&typeof new XMLHttpRequest().responseType!="string")throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");const[s,d]=bi(),h={[s]:d,...this._options.headers},g={abortSignal:this._pollAbort.signal,headers:h,timeout:1e5,withCredentials:this._options.withCredentials};a===rt.Binary&&(g.responseType="arraybuffer");const f=`${e}&_=${Date.now()}`;this._logger.log(ie.Trace,`(LongPolling transport) polling: ${f}.`);const _=await this._httpClient.get(f,g);_.statusCode!==200?(this._logger.log(ie.Error,`(LongPolling transport) Unexpected response code: ${_.statusCode}.`),this._closeError=new ii(_.statusText||"",_.statusCode),this._running=!1):this._running=!0,this._receiving=this._poll(this._url,g)}async _poll(e,a){try{for(;this._running;)try{const s=`${e}&_=${Date.now()}`;this._logger.log(ie.Trace,`(LongPolling transport) polling: ${s}.`);const d=await this._httpClient.get(s,a);d.statusCode===204?(this._logger.log(ie.Information,"(LongPolling transport) Poll terminated by server."),this._running=!1):d.statusCode!==200?(this._logger.log(ie.Error,`(LongPolling transport) Unexpected response code: ${d.statusCode}.`),this._closeError=new ii(d.statusText||"",d.statusCode),this._running=!1):d.content?(this._logger.log(ie.Trace,`(LongPolling transport) data received. ${Ni(d.content,this._options.logMessageContent)}.`),this.onreceive&&this.onreceive(d.content)):this._logger.log(ie.Trace,"(LongPolling transport) Poll timed out, reissuing.")}catch(s){this._running?s instanceof Pn?this._logger.log(ie.Trace,"(LongPolling transport) Poll timed out, reissuing."):(this._closeError=s,this._running=!1):this._logger.log(ie.Trace,`(LongPolling transport) Poll errored after shutdown: ${s.message}`)}}finally{this._logger.log(ie.Trace,"(LongPolling transport) Polling complete."),this.pollAborted||this._raiseOnClose()}}async send(e){return this._running?Ca(this._logger,"LongPolling",this._httpClient,this._url,e,this._options):Promise.reject(new Error("Cannot send until the transport is connected"))}async stop(){this._logger.log(ie.Trace,"(LongPolling transport) Stopping polling."),this._running=!1,this._pollAbort.abort();try{await this._receiving,this._logger.log(ie.Trace,`(LongPolling transport) sending DELETE request to ${this._url}.`);const e={},[a,s]=bi();e[a]=s;const d={headers:{...e,...this._options.headers},timeout:this._options.timeout,withCredentials:this._options.withCredentials};let h;try{await this._httpClient.delete(this._url,d)}catch(g){h=g}h?h instanceof ii&&(h.statusCode===404?this._logger.log(ie.Trace,"(LongPolling transport) A 404 response was returned from sending a DELETE request."):this._logger.log(ie.Trace,`(LongPolling transport) Error sending a DELETE request: ${h}`)):this._logger.log(ie.Trace,"(LongPolling transport) DELETE request accepted.")}finally{this._logger.log(ie.Trace,"(LongPolling transport) Stop finished."),this._raiseOnClose()}}_raiseOnClose(){if(this.onclose){let e="(LongPolling transport) Firing onclose event.";this._closeError&&(e+=" Error: "+this._closeError),this._logger.log(ie.Trace,e),this.onclose(this._closeError)}}}class Sr{constructor(e,a,s,d){this._httpClient=e,this._accessToken=a,this._logger=s,this._options=d,this.onreceive=null,this.onclose=null}async connect(e,a){return Ye.isRequired(e,"url"),Ye.isRequired(a,"transferFormat"),Ye.isIn(a,rt,"transferFormat"),this._logger.log(ie.Trace,"(SSE transport) Connecting."),this._url=e,this._accessToken&&(e+=(e.indexOf("?")<0?"?":"&")+`access_token=${encodeURIComponent(this._accessToken)}`),new Promise((s,d)=>{let h=!1;if(a!==rt.Text){d(new Error("The Server-Sent Events transport only supports the 'Text' transfer format"));return}let g;if(Ge.isBrowser||Ge.isWebWorker)g=new this._options.EventSource(e,{withCredentials:this._options.withCredentials});else{const f=this._httpClient.getCookieString(e),_={};_.Cookie=f;const[b,u]=bi();_[b]=u,g=new this._options.EventSource(e,{withCredentials:this._options.withCredentials,headers:{..._,...this._options.headers}})}try{g.onmessage=f=>{if(this.onreceive)try{this._logger.log(ie.Trace,`(SSE transport) data received. ${Ni(f.data,this._options.logMessageContent)}.`),this.onreceive(f.data)}catch(_){this._close(_);return}},g.onerror=f=>{h?this._close():d(new Error("EventSource failed to connect. The connection could not be found on the server, either the connection ID is not present on the server, or a proxy is refusing/buffering the connection. If you have multiple servers check that sticky sessions are enabled."))},g.onopen=()=>{this._logger.log(ie.Information,`SSE connected to ${this._url}`),this._eventSource=g,h=!0,s()}}catch(f){d(f);return}})}async send(e){return this._eventSource?Ca(this._logger,"SSE",this._httpClient,this._url,e,this._options):Promise.reject(new Error("Cannot send until the transport is connected"))}stop(){return this._close(),Promise.resolve()}_close(e){this._eventSource&&(this._eventSource.close(),this._eventSource=void 0,this.onclose&&this.onclose(e))}}class Er{constructor(e,a,s,d,h,g){this._logger=s,this._accessTokenFactory=a,this._logMessageContent=d,this._webSocketConstructor=h,this._httpClient=e,this.onreceive=null,this.onclose=null,this._headers=g}async connect(e,a){Ye.isRequired(e,"url"),Ye.isRequired(a,"transferFormat"),Ye.isIn(a,rt,"transferFormat"),this._logger.log(ie.Trace,"(WebSockets transport) Connecting.");let s;return this._accessTokenFactory&&(s=await this._accessTokenFactory()),new Promise((d,h)=>{e=e.replace(/^http/,"ws");let g;const f=this._httpClient.getCookieString(e);let _=!1;if(Ge.isNode||Ge.isReactNative){const b={},[u,x]=bi();b[u]=x,s&&(b[ni.Authorization]=`Bearer ${s}`),f&&(b[ni.Cookie]=f),g=new this._webSocketConstructor(e,void 0,{headers:{...b,...this._headers}})}else s&&(e+=(e.indexOf("?")<0?"?":"&")+`access_token=${encodeURIComponent(s)}`);g||(g=new this._webSocketConstructor(e)),a===rt.Binary&&(g.binaryType="arraybuffer"),g.onopen=b=>{this._logger.log(ie.Information,`WebSocket connected to ${e}.`),this._webSocket=g,_=!0,d()},g.onerror=b=>{let u=null;typeof ErrorEvent<"u"&&b instanceof ErrorEvent?u=b.error:u="There was an error with the transport",this._logger.log(ie.Information,`(WebSockets transport) ${u}.`)},g.onmessage=b=>{if(this._logger.log(ie.Trace,`(WebSockets transport) data received. ${Ni(b.data,this._logMessageContent)}.`),this.onreceive)try{this.onreceive(b.data)}catch(u){this._close(u);return}},g.onclose=b=>{if(_)this._close(b);else{let u=null;typeof ErrorEvent<"u"&&b instanceof ErrorEvent?u=b.error:u="WebSocket failed to connect. The connection could not be found on the server, either the endpoint may not be a SignalR endpoint, the connection ID is not present on the server, or there is a proxy blocking WebSockets. If you have multiple servers check that sticky sessions are enabled.",h(new Error(u))}}})}send(e){return this._webSocket&&this._webSocket.readyState===this._webSocketConstructor.OPEN?(this._logger.log(ie.Trace,`(WebSockets transport) sending data. ${Ni(e,this._logMessageContent)}.`),this._webSocket.send(e),Promise.resolve()):Promise.reject("WebSocket is not in the OPEN state")}stop(){return this._webSocket&&this._close(void 0),Promise.resolve()}_close(e){this._webSocket&&(this._webSocket.onclose=()=>{},this._webSocket.onmessage=()=>{},this._webSocket.onerror=()=>{},this._webSocket.close(),this._webSocket=void 0),this._logger.log(ie.Trace,"(WebSockets transport) socket closed."),this.onclose&&(this._isCloseEvent(e)&&(e.wasClean===!1||e.code!==1e3)?this.onclose(new Error(`WebSocket closed with status code: ${e.code} (${e.reason||"no reason given"}).`)):e instanceof Error?this.onclose(e):this.onclose())}_isCloseEvent(e){return e&&typeof e.wasClean=="boolean"&&typeof e.code=="number"}}const da=100;class kr{constructor(e,a={}){if(this._stopPromiseResolver=()=>{},this.features={},this._negotiateVersion=1,Ye.isRequired(e,"url"),this._logger=nr(a.logger),this.baseUrl=this._resolveUrl(e),a=a||{},a.logMessageContent=a.logMessageContent===void 0?!1:a.logMessageContent,typeof a.withCredentials=="boolean"||a.withCredentials===void 0)a.withCredentials=a.withCredentials===void 0?!0:a.withCredentials;else throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");a.timeout=a.timeout===void 0?100*1e3:a.timeout;let s=null,d=null;if(Ge.isNode&&typeof require<"u"){const h=typeof __webpack_require__=="function"?__non_webpack_require__:require;s=h("ws"),d=h("eventsource")}!Ge.isNode&&typeof WebSocket<"u"&&!a.WebSocket?a.WebSocket=WebSocket:Ge.isNode&&!a.WebSocket&&s&&(a.WebSocket=s),!Ge.isNode&&typeof EventSource<"u"&&!a.EventSource?a.EventSource=EventSource:Ge.isNode&&!a.EventSource&&typeof d<"u"&&(a.EventSource=d),this._httpClient=new xr(a.httpClient||new pr(this._logger),a.accessTokenFactory),this._connectionState="Disconnected",this._connectionStarted=!1,this._options=a,this.onreceive=null,this.onclose=null}async start(e){if(e=e||rt.Binary,Ye.isIn(e,rt,"transferFormat"),this._logger.log(ie.Debug,`Starting connection with transfer format '${rt[e]}'.`),this._connectionState!=="Disconnected")return Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));if(this._connectionState="Connecting",this._startInternalPromise=this._startInternal(e),await this._startInternalPromise,this._connectionState==="Disconnecting"){const a="Failed to start the HttpConnection before stop() was called.";return this._logger.log(ie.Error,a),await this._stopPromise,Promise.reject(new At(a))}else if(this._connectionState!=="Connected"){const a="HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";return this._logger.log(ie.Error,a),Promise.reject(new At(a))}this._connectionStarted=!0}send(e){return this._connectionState!=="Connected"?Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State.")):(this._sendQueue||(this._sendQueue=new On(this.transport)),this._sendQueue.send(e))}async stop(e){if(this._connectionState==="Disconnected")return this._logger.log(ie.Debug,`Call to HttpConnection.stop(${e}) ignored because the connection is already in the disconnected state.`),Promise.resolve();if(this._connectionState==="Disconnecting")return this._logger.log(ie.Debug,`Call to HttpConnection.stop(${e}) ignored because the connection is already in the disconnecting state.`),this._stopPromise;this._connectionState="Disconnecting",this._stopPromise=new Promise(a=>{this._stopPromiseResolver=a}),await this._stopInternal(e),await this._stopPromise}async _stopInternal(e){this._stopError=e;try{await this._startInternalPromise}catch{}if(this.transport){try{await this.transport.stop()}catch(a){this._logger.log(ie.Error,`HttpConnection.transport.stop() threw error '${a}'.`),this._stopConnection()}this.transport=void 0}else this._logger.log(ie.Debug,"HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.")}async _startInternal(e){let a=this.baseUrl;this._accessTokenFactory=this._options.accessTokenFactory,this._httpClient._accessTokenFactory=this._accessTokenFactory;try{if(this._options.skipNegotiation)if(this._options.transport===Xe.WebSockets)this.transport=this._constructTransport(Xe.WebSockets),await this._startTransport(a,e);else throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");else{let s=null,d=0;do{if(s=await this._getNegotiationResponse(a),this._connectionState==="Disconnecting"||this._connectionState==="Disconnected")throw new At("The connection was stopped during negotiation.");if(s.error)throw new Error(s.error);if(s.ProtocolVersion)throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");if(s.url&&(a=s.url),s.accessToken){const h=s.accessToken;this._accessTokenFactory=()=>h,this._httpClient._accessToken=h,this._httpClient._accessTokenFactory=void 0}d++}while(s.url&&d<da);if(d===da&&s.url)throw new Error("Negotiate redirection limit exceeded.");await this._createTransport(a,this._options.transport,s,e)}this.transport instanceof la&&(this.features.inherentKeepAlive=!0),this._connectionState==="Connecting"&&(this._logger.log(ie.Debug,"The HttpConnection connected successfully."),this._connectionState="Connected")}catch(s){return this._logger.log(ie.Error,"Failed to start the connection: "+s),this._connectionState="Disconnected",this.transport=void 0,this._stopPromiseResolver(),Promise.reject(s)}}async _getNegotiationResponse(e){const a={},[s,d]=bi();a[s]=d;const h=this._resolveNegotiateUrl(e);this._logger.log(ie.Debug,`Sending negotiation request: ${h}.`);try{const g=await this._httpClient.post(h,{content:"",headers:{...a,...this._options.headers},timeout:this._options.timeout,withCredentials:this._options.withCredentials});if(g.statusCode!==200)return Promise.reject(new Error(`Unexpected status code returned from negotiate '${g.statusCode}'`));const f=JSON.parse(g.content);return(!f.negotiateVersion||f.negotiateVersion<1)&&(f.connectionToken=f.connectionId),f.useStatefulReconnect&&this._options._useStatefulReconnect!==!0?Promise.reject(new oa("Client didn't negotiate Stateful Reconnect but the server did.")):f}catch(g){let f="Failed to complete negotiation with the server: "+g;return g instanceof ii&&g.statusCode===404&&(f=f+" Either this is not a SignalR endpoint or there is a proxy blocking the connection."),this._logger.log(ie.Error,f),Promise.reject(new oa(f))}}_createConnectUrl(e,a){return a?e+(e.indexOf("?")===-1?"?":"&")+`id=${a}`:e}async _createTransport(e,a,s,d){let h=this._createConnectUrl(e,s.connectionToken);if(this._isITransport(a)){this._logger.log(ie.Debug,"Connection was provided an instance of ITransport, using that directly."),this.transport=a,await this._startTransport(h,d),this.connectionId=s.connectionId;return}const g=[],f=s.availableTransports||[];let _=s;for(const b of f){const u=this._resolveTransportOrError(b,a,d,(_==null?void 0:_.useStatefulReconnect)===!0);if(u instanceof Error)g.push(`${b.transport} failed:`),g.push(u);else if(this._isITransport(u)){if(this.transport=u,!_){try{_=await this._getNegotiationResponse(e)}catch(x){return Promise.reject(x)}h=this._createConnectUrl(e,_.connectionToken)}try{await this._startTransport(h,d),this.connectionId=_.connectionId;return}catch(x){if(this._logger.log(ie.Error,`Failed to start the transport '${b.transport}': ${x}`),_=void 0,g.push(new Zo(`${b.transport} failed: ${x}`,Xe[b.transport])),this._connectionState!=="Connecting"){const m="Failed to select transport before stop() was called.";return this._logger.log(ie.Debug,m),Promise.reject(new At(m))}}}}return g.length>0?Promise.reject(new er(`Unable to connect to the server with any of the available transports. ${g.join(" ")}`,g)):Promise.reject(new Error("None of the transports supported by the client are supported by the server."))}_constructTransport(e){switch(e){case Xe.WebSockets:if(!this._options.WebSocket)throw new Error("'WebSocket' is not supported in your environment.");return new Er(this._httpClient,this._accessTokenFactory,this._logger,this._options.logMessageContent,this._options.WebSocket,this._options.headers||{});case Xe.ServerSentEvents:if(!this._options.EventSource)throw new Error("'EventSource' is not supported in your environment.");return new Sr(this._httpClient,this._httpClient._accessToken,this._logger,this._options);case Xe.LongPolling:return new la(this._httpClient,this._logger,this._options);default:throw new Error(`Unknown transport: ${e}.`)}}_startTransport(e,a){return this.transport.onreceive=this.onreceive,this.features.reconnect?this.transport.onclose=async s=>{let d=!1;if(this.features.reconnect)try{this.features.disconnected(),await this.transport.connect(e,a),await this.features.resend()}catch{d=!0}else{this._stopConnection(s);return}d&&this._stopConnection(s)}:this.transport.onclose=s=>this._stopConnection(s),this.transport.connect(e,a)}_resolveTransportOrError(e,a,s,d){const h=Xe[e.transport];if(h==null)return this._logger.log(ie.Debug,`Skipping transport '${e.transport}' because it is not supported by this client.`),new Error(`Skipping transport '${e.transport}' because it is not supported by this client.`);if(Cr(a,h))if(e.transferFormats.map(f=>rt[f]).indexOf(s)>=0){if(h===Xe.WebSockets&&!this._options.WebSocket||h===Xe.ServerSentEvents&&!this._options.EventSource)return this._logger.log(ie.Debug,`Skipping transport '${Xe[h]}' because it is not supported in your environment.'`),new Xo(`'${Xe[h]}' is not supported in your environment.`,h);this._logger.log(ie.Debug,`Selecting transport '${Xe[h]}'.`);try{return this.features.reconnect=h===Xe.WebSockets?d:void 0,this._constructTransport(h)}catch(f){return f}}else return this._logger.log(ie.Debug,`Skipping transport '${Xe[h]}' because it does not support the requested transfer format '${rt[s]}'.`),new Error(`'${Xe[h]}' does not support ${rt[s]}.`);else return this._logger.log(ie.Debug,`Skipping transport '${Xe[h]}' because it was disabled by the client.`),new Qo(`'${Xe[h]}' is disabled by the client.`,h)}_isITransport(e){return e&&typeof e=="object"&&"connect"in e}_stopConnection(e){if(this._logger.log(ie.Debug,`HttpConnection.stopConnection(${e}) called while in state ${this._connectionState}.`),this.transport=void 0,e=this._stopError||e,this._stopError=void 0,this._connectionState==="Disconnected"){this._logger.log(ie.Debug,`Call to HttpConnection.stopConnection(${e}) was ignored because the connection is already in the disconnected state.`);return}if(this._connectionState==="Connecting")throw this._logger.log(ie.Warning,`Call to HttpConnection.stopConnection(${e}) was ignored because the connection is still in the connecting state.`),new Error(`HttpConnection.stopConnection(${e}) was called while the connection is still in the connecting state.`);if(this._connectionState==="Disconnecting"&&this._stopPromiseResolver(),e?this._logger.log(ie.Error,`Connection disconnected with error '${e}'.`):this._logger.log(ie.Information,"Connection disconnected."),this._sendQueue&&(this._sendQueue.stop().catch(a=>{this._logger.log(ie.Error,`TransportSendQueue.stop() threw error '${a}'.`)}),this._sendQueue=void 0),this.connectionId=void 0,this._connectionState="Disconnected",this._connectionStarted){this._connectionStarted=!1;try{this.onclose&&this.onclose(e)}catch(a){this._logger.log(ie.Error,`HttpConnection.onclose(${e}) threw error '${a}'.`)}}}_resolveUrl(e){if(e.lastIndexOf("https://",0)===0||e.lastIndexOf("http://",0)===0)return e;if(!Ge.isBrowser)throw new Error(`Cannot resolve '${e}'.`);const a=window.document.createElement("a");return a.href=e,this._logger.log(ie.Information,`Normalizing '${e}' to '${a.href}'.`),a.href}_resolveNegotiateUrl(e){const a=new URL(e);a.pathname.endsWith("/")?a.pathname+="negotiate":a.pathname+="/negotiate";const s=new URLSearchParams(a.searchParams);return s.has("negotiateVersion")||s.append("negotiateVersion",this._negotiateVersion.toString()),s.has("useStatefulReconnect")?s.get("useStatefulReconnect")==="true"&&(this._options._useStatefulReconnect=!0):this._options._useStatefulReconnect===!0&&s.append("useStatefulReconnect","true"),a.search=s.toString(),a.toString()}}function Cr(t,e){return!t||(e&t)!==0}class On{constructor(e){this._transport=e,this._buffer=[],this._executing=!0,this._sendBufferedData=new Wi,this._transportResult=new Wi,this._sendLoopPromise=this._sendLoop()}send(e){return this._bufferData(e),this._transportResult||(this._transportResult=new Wi),this._transportResult.promise}stop(){return this._executing=!1,this._sendBufferedData.resolve(),this._sendLoopPromise}_bufferData(e){if(this._buffer.length&&typeof this._buffer[0]!=typeof e)throw new Error(`Expected data to be of type ${typeof this._buffer} but was of type ${typeof e}`);this._buffer.push(e),this._sendBufferedData.resolve()}async _sendLoop(){for(;;){if(await this._sendBufferedData.promise,!this._executing){this._transportResult&&this._transportResult.reject("Connection stopped.");break}this._sendBufferedData=new Wi;const e=this._transportResult;this._transportResult=void 0;const a=typeof this._buffer[0]=="string"?this._buffer.join(""):On._concatBuffers(this._buffer);this._buffer.length=0;try{await this._transport.send(a),e.resolve()}catch(s){e.reject(s)}}}static _concatBuffers(e){const a=e.map(h=>h.byteLength).reduce((h,g)=>h+g),s=new Uint8Array(a);let d=0;for(const h of e)s.set(new Uint8Array(h),d),d+=h.byteLength;return s.buffer}}class Wi{constructor(){this.promise=new Promise((e,a)=>[this._resolver,this._rejecter]=[e,a])}resolve(){this._resolver()}reject(e){this._rejecter(e)}}const Ar="json";class Tr{constructor(){this.name=Ar,this.version=2,this.transferFormat=rt.Text}parseMessages(e,a){if(typeof e!="string")throw new Error("Invalid input for JSON hub protocol. Expected a string.");if(!e)return[];a===null&&(a=Ui.instance);const s=bt.parse(e),d=[];for(const h of s){const g=JSON.parse(h);if(typeof g.type!="number")throw new Error("Invalid payload.");switch(g.type){case Ce.Invocation:this._isInvocationMessage(g);break;case Ce.StreamItem:this._isStreamItemMessage(g);break;case Ce.Completion:this._isCompletionMessage(g);break;case Ce.Ping:break;case Ce.Close:break;case Ce.Ack:this._isAckMessage(g);break;case Ce.Sequence:this._isSequenceMessage(g);break;default:a.log(ie.Information,"Unknown message type '"+g.type+"' ignored.");continue}d.push(g)}return d}writeMessage(e){return bt.write(JSON.stringify(e))}_isInvocationMessage(e){this._assertNotEmptyString(e.target,"Invalid payload for Invocation message."),e.invocationId!==void 0&&this._assertNotEmptyString(e.invocationId,"Invalid payload for Invocation message.")}_isStreamItemMessage(e){if(this._assertNotEmptyString(e.invocationId,"Invalid payload for StreamItem message."),e.item===void 0)throw new Error("Invalid payload for StreamItem message.")}_isCompletionMessage(e){if(e.result&&e.error)throw new Error("Invalid payload for Completion message.");!e.result&&e.error&&this._assertNotEmptyString(e.error,"Invalid payload for Completion message."),this._assertNotEmptyString(e.invocationId,"Invalid payload for Completion message.")}_isAckMessage(e){if(typeof e.sequenceId!="number")throw new Error("Invalid SequenceId for Ack message.")}_isSequenceMessage(e){if(typeof e.sequenceId!="number")throw new Error("Invalid SequenceId for Sequence message.")}_assertNotEmptyString(e,a){if(typeof e!="string"||e==="")throw new Error(a)}}const Lr={trace:ie.Trace,debug:ie.Debug,info:ie.Information,information:ie.Information,warn:ie.Warning,warning:ie.Warning,error:ie.Error,critical:ie.Critical,none:ie.None};function Ir(t){const e=Lr[t.toLowerCase()];if(typeof e<"u")return e;throw new Error(`Unknown log level: ${t}`)}class Aa{configureLogging(e){if(Ye.isRequired(e,"logging"),Rr(e))this.logger=e;else if(typeof e=="string"){const a=Ir(e);this.logger=new an(a)}else this.logger=new an(e);return this}withUrl(e,a){return Ye.isRequired(e,"url"),Ye.isNotEmpty(e,"url"),this.url=e,typeof a=="object"?this.httpConnectionOptions={...this.httpConnectionOptions,...a}:this.httpConnectionOptions={...this.httpConnectionOptions,transport:a},this}withHubProtocol(e){return Ye.isRequired(e,"protocol"),this.protocol=e,this}withAutomaticReconnect(e){if(this.reconnectPolicy)throw new Error("A reconnectPolicy has already been set.");return e?Array.isArray(e)?this.reconnectPolicy=new sa(e):this.reconnectPolicy=e:this.reconnectPolicy=new sa,this}withServerTimeout(e){return Ye.isRequired(e,"milliseconds"),this._serverTimeoutInMilliseconds=e,this}withKeepAliveInterval(e){return Ye.isRequired(e,"milliseconds"),this._keepAliveIntervalInMilliseconds=e,this}withStatefulReconnect(e){return this.httpConnectionOptions===void 0&&(this.httpConnectionOptions={}),this.httpConnectionOptions._useStatefulReconnect=!0,this._statefulReconnectBufferSize=e==null?void 0:e.bufferSize,this}build(){const e=this.httpConnectionOptions||{};if(e.logger===void 0&&(e.logger=this.logger),!this.url)throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");const a=new kr(this.url,e);return $n.create(a,this.logger||Ui.instance,this.protocol||new Tr,this.reconnectPolicy,this._serverTimeoutInMilliseconds,this._keepAliveIntervalInMilliseconds,this._statefulReconnectBufferSize)}}function Rr(t){return t.log!==void 0}const Mr={":hype:":"orbitHype",":rocket:":"orbitHype",":fire:":"orbitFire",":flame:":"orbitFire",":pog:":"orbitPog",":poggers:":"orbitPog",":love:":"orbitLove",":heart:":"orbitLove",":gg:":"orbitGG",":trophy:":"orbitGG",":lul:":"orbitLUL",":lol:":"orbitLUL",":sad:":"orbitSad",":cry:":"orbitSad",":crown:":"orbitCrown",":king:":"orbitCrown",":wave:":"orbitWave",":hi:":"orbitWave",":rage:":"orbitRage",":mad:":"orbitRage",":chill:":"orbitChill",":cool:":"orbitChill",":star:":"orbitStar"};function Br(t){if(!t)return"";let e=Vt(t);for(const[a,s]of Object.entries(Mr)){const d=mt(s);if(d){const h=`<span class="orbit-chat-emote" title="${a}" style="display:inline-flex;vertical-align:middle;width:22px;height:22px;margin:-2px 2px 0 2px;">${d}</span>`;e=e.replaceAll(a,h)}}return e}function Dr(t,e){var g;const a=I.getState().activeStream,s=a&&(e===a.streamerName||e===a.channelName||e===((g=a.channel)==null?void 0:g.ownerUsername)),d=String((t==null?void 0:t.senderBadge)||(t==null?void 0:t.SenderBadge)||""),h=String((t==null?void 0:t.senderRole)||(t==null?void 0:t.SenderRole)||"").toLowerCase();return s||d.includes("👑")||h==="broadcaster"||h==="streamer"?'<span class="chat-role-badge badge-broadcaster" title="Broadcaster" style="background:linear-gradient(135deg,#FFD700,#FFA500);color:#000;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(255,215,0,0.5);margin-right:4px;">👑 HOST</span>':d.includes("🛡️")||h==="moderator"||h==="mod"?'<span class="chat-role-badge badge-mod" title="Moderator" style="background:linear-gradient(135deg,#10B981,#059669);color:#fff;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(16,185,129,0.4);margin-right:4px;">🛡️ MOD</span>':d.includes("⚡")||h==="admin"?'<span class="chat-role-badge badge-admin" title="Orbit Admin" style="background:linear-gradient(135deg,#7928CA,#4C1D95);color:#fff;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(121,40,202,0.4);margin-right:4px;">⚡ ADMIN</span>':d.includes("💎")||h==="vip"?'<span class="chat-role-badge badge-vip" title="VIP" style="background:linear-gradient(135deg,#00f2fe,#00AEBD);color:#000;font-size:10px;font-weight:800;padding:2px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px;box-shadow:0 0 6px rgba(0,242,254,0.4);margin-right:4px;">💎 VIP</span>':d?`<span style="font-size:11px;margin-right:4px;">${Vt(d)}</span>`:""}function Pr(t,e){const a=String(e||"").toLowerCase();return t?"#FFD700":a==="moderator"||a==="mod"?"#10B981":a==="admin"?"#c084fc":"var(--color-cyan-neon, #00f2fe)"}let Ve=null,ot=null,Li=null,yt=null,_i=null,vn=null,$e={isYt:!1,isPlaying:!0,isMuted:!1,volume:1};function jt(t,e=[]){const a=document.getElementById("youtube-player-frame");a&&a.contentWindow&&a.contentWindow.postMessage(JSON.stringify({event:"command",func:t,args:e}),"*")}function $i(){const t=document.getElementById("orbit-play-icon"),e=document.getElementById("orbit-volume-icon"),a=document.getElementById("orbit-ctrl-vol-slider");t&&(t.textContent=$e.isPlaying?"⏸":"▶"),e&&(e.textContent=$e.isMuted||$e.volume===0?"🔇":$e.volume<.5?"🔉":"🔊"),a&&(a.value=$e.isMuted?0:$e.volume)}function ut(){const t=document.getElementById("orbit-player-controls");t&&(t.style.opacity="1",vn&&clearTimeout(vn),$e.isPlaying&&(vn=setTimeout(()=>{t&&$e.isPlaying&&(t.style.opacity="0")},2500)))}function kn(t){(isNaN(t)||t<0)&&(t=0);const e=Math.floor(t/3600),a=Math.floor(t%3600/60),s=Math.floor(t%60);return e>0?`${e}:${a.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`:`${a}:${s.toString().padStart(2,"0")}`}function ti(){const t=document.getElementById("stream-video");if(!t||$e.isYt||!t.seekable||t.seekable.length===0)return;const e=t.seekable.start(0),a=t.seekable.end(0),s=Math.max(1,a-e),d=Math.min(a,Math.max(e,t.currentTime)),h=Math.max(0,Math.min(100,(d-e)/s*100)),g=document.getElementById("orbit-dvr-progress"),f=document.getElementById("orbit-dvr-handle"),_=document.getElementById("orbit-ctrl-live-badge"),b=document.getElementById("orbit-live-dot"),u=document.getElementById("orbit-live-text"),x=document.getElementById("orbit-dvr-time-display");g&&(g.style.width=`${h}%`),f&&(f.style.left=`${h}%`);const m=document.getElementById("orbit-dvr-buffered");if(m&&t.buffered&&t.buffered.length>0)try{const S=t.buffered.end(t.buffered.length-1),w=Math.max(0,Math.min(100,(S-e)/s*100));m.style.width=`${w}%`}catch{}const y=Math.round(a-d);y<=5?(_&&(_.title="You are currently at the live edge (L)",_.style.background="rgba(255, 20, 0, 0.2)",_.style.borderColor="rgba(255, 20, 0, 0.5)",_.style.color="#ff3b30"),b&&(b.style.background="#ff3b30",b.style.boxShadow="0 0 8px #ff3b30",b.style.animation="pulseLive 1.5s infinite"),u&&(u.textContent="LIVE"),x&&(x.textContent="LIVE")):(_&&(_.title="Rewound broadcast — Click to jump back to LIVE (L)",_.style.background="rgba(255, 180, 0, 0.2)",_.style.borderColor="rgba(255, 180, 0, 0.6)",_.style.color="#ffb400"),b&&(b.style.background="#ffb400",b.style.boxShadow="0 0 8px #ffb400",b.style.animation="none"),u&&(u.textContent=`⟲ LIVE (-${kn(y)})`),x&&(x.textContent=`-${kn(y)}`))}function ca(){const t=document.getElementById("stream-video");if(!t||!t.seekable||t.seekable.length===0)return;const e=t.seekable.end(0);t.currentTime=Math.max(0,e-.5),t.play().catch(()=>{}),ti(),I.showToast("Synced to Live broadcast","info")}function Ki(t){const e=document.getElementById("stream-video");if(!e||!e.seekable||e.seekable.length===0)return;const a=e.seekable.start(0),s=e.seekable.end(0),d=Math.max(a,Math.min(s-.5,e.currentTime+t));e.currentTime=d,ti()}function Vt(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function $r(){const t=I.getState().activeStream,e=Kt(),a=(t==null?void 0:t.title)||"Loading...";return`
    <div style="display:flex;gap:0;margin:-24px;min-height:calc(100vh - var(--topbar-height));">
      <!-- Video + Info Column -->
      <div style="flex:1;display:flex;flex-direction:column;overflow-y:auto;min-width:0;">
        <div class="player-wrapper" id="player-container" style="position:relative;border-radius:0;aspect-ratio:16/9;background:#000;overflow:hidden;">
          <video id="stream-video" style="width:100%;height:100%;background:#000;" autoplay playsinline></video>

          <!-- Interaction Shield: Captures 100% of mouse/hover interactions so YouTube iframe never shows hover options -->
          <div id="orbit-player-shield" style="position:absolute;inset:0;z-index:4;cursor:pointer;background:rgba(0,0,0,0.001);pointer-events:auto;"></div>

          <!-- Authentic Orbit Stream Controls Overlay (Kick & Twitch style with Live DVR) -->
          <div id="orbit-player-controls" class="orbit-player-controls-overlay" style="position:absolute;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:flex-end;z-index:10;opacity:0;transition:opacity 0.25s ease;">
            <!-- DVR Scrubber Bar Area -->
            <div id="orbit-dvr-scrubber-area" style="pointer-events:auto;position:relative;width:100%;height:18px;display:flex;align-items:center;cursor:pointer;padding:0 16px;box-sizing:border-box;">
              <!-- Scrubber Track Background -->
              <div id="orbit-dvr-track" style="position:relative;width:100%;height:5px;background:rgba(255,255,255,0.22);border-radius:3px;overflow:visible;">
                <!-- Buffered Range Fill -->
                <div id="orbit-dvr-buffered" style="position:absolute;left:0;top:0;height:100%;width:0%;background:rgba(255,255,255,0.35);border-radius:3px;pointer-events:none;"></div>
                <!-- Progress Fill (Cyan Neon Gradient) -->
                <div id="orbit-dvr-progress" style="position:absolute;left:0;top:0;height:100%;width:100%;background:linear-gradient(90deg, #00f2fe, #00aebd);border-radius:3px;pointer-events:none;"></div>
                <!-- Scrubber Handle / Thumb -->
                <div id="orbit-dvr-handle" style="position:absolute;top:50%;left:100%;transform:translate(-50%, -50%);width:13px;height:13px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(0,242,254,0.9);pointer-events:none;"></div>
              </div>
              <!-- Floating Hover Timestamp Preview Tooltip -->
              <div id="orbit-dvr-tooltip" style="display:none;position:absolute;bottom:24px;transform:translateX(-50%);background:rgba(4,7,18,0.95);border:1px solid rgba(0,242,254,0.4);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;color:#fff;pointer-events:none;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.5);z-index:20;">--:--</div>
            </div>

            <!-- Controls Bottom Bar -->
            <div style="pointer-events:auto;background:linear-gradient(180deg, transparent 0%, rgba(4,7,18,0.85) 40%, rgba(4,7,18,0.96) 100%);padding:10px 20px 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <!-- Left: Play/Pause, Rewind -10s, Forward +10s, Live Badge, Time Display, Volume -->
              <div style="display:flex;align-items:center;gap:10px;">
                <button id="orbit-ctrl-play" title="Play/Pause (Space)" class="orbit-ctrl-btn">
                  <span id="orbit-play-icon" style="font-size:18px;">⏸</span>
                </button>

                <button id="orbit-ctrl-rewind-10" title="Rewind 10 seconds (Left Arrow)" class="orbit-ctrl-btn" style="font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);">
                  ⟲ 10s
                </button>

                <button id="orbit-ctrl-forward-10" title="Forward 10 seconds (Right Arrow)" class="orbit-ctrl-btn" style="font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);">
                  10s ⟳
                </button>

                <!-- Clickable Live Badge: clicking syncs directly to live edge -->
                <button id="orbit-ctrl-live-badge" title="Click to jump to live broadcast (L)" style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;background:rgba(255,20,0,0.2);border:1px solid rgba(255,20,0,0.5);font-size:11px;font-weight:700;color:#ff3b30;letter-spacing:0.05em;cursor:pointer;transition:all 0.2s ease;">
                  <span id="orbit-live-dot" style="width:7px;height:7px;border-radius:50%;background:#ff3b30;display:inline-block;box-shadow:0 0 8px #ff3b30;animation:pulseLive 1.5s infinite;"></span>
                  <span id="orbit-live-text">LIVE</span>
                </button>

                <!-- Time display (e.g. -01:45 behind live, or LIVE) -->
                <div id="orbit-dvr-time-display" style="font-size:12px;font-weight:600;color:var(--color-text-muted,#aaa);font-variant-numeric:tabular-nums;min-width:55px;">
                  LIVE
                </div>

                <div class="orbit-volume-group" style="display:flex;align-items:center;gap:6px;margin-left:4px;">
                  <button id="orbit-ctrl-mute" title="Mute/Unmute (M)" class="orbit-ctrl-btn">
                    <span id="orbit-volume-icon" style="font-size:16px;">🔊</span>
                  </button>
                  <input type="range" id="orbit-ctrl-vol-slider" min="0" max="1" step="0.05" value="1" style="width:70px;height:4px;accent-color:var(--color-cyan-primary,#00aebd);cursor:pointer;" />
                </div>
              </div>

              <!-- Right: Options, PiP, Theater & Fullscreen -->
              <div style="display:flex;align-items:center;gap:8px;">
                <span id="orbit-ctrl-quality" style="font-size:10px;font-weight:700;color:var(--color-cyan-neon,#00f2fe);background:rgba(0,221,238,0.12);border:1px solid rgba(0,221,238,0.3);padding:2px 7px;border-radius:4px;letter-spacing:0.04em;" title="Quality: 1080p60 Ultra-Low Latency">1080p60</span>
                <button id="orbit-ctrl-pip" title="Picture-in-Picture (P)" class="orbit-ctrl-btn">
                  <span style="font-size:15px;">🗔</span>
                </button>
                <button id="orbit-ctrl-theater" title="Theater Mode (T)" class="orbit-ctrl-btn">
                  <span id="orbit-theater-icon" style="font-size:15px;">⬚</span>
                </button>
                <button id="orbit-ctrl-fullscreen" title="Fullscreen (F)" class="orbit-ctrl-btn">
                  <span id="orbit-fullscreen-icon" style="font-size:16px;">⛶</span>
                </button>
              </div>
            </div>
          </div>

          <button id="player-unmute-btn" style="display:none;position:absolute;bottom:70px;left:20px;z-index:11;background:rgba(4,7,18,0.9);border:1px solid rgba(0,242,254,0.5);color:var(--color-cyan-neon,#00f2fe);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;align-items:center;gap:6px;backdrop-filter:blur(6px);box-shadow:0 0 16px rgba(0,242,254,0.3);">
            ${N.volume} Click to Unmute
          </button>
          
          <div id="player-offline" class="hidden" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-gradient-card);flex-direction:column;gap:12px;z-index:5;">
            <div style="font-size:48px;">&#128752;</div>
            <h3 style="font-family:var(--font-display);color:var(--color-cyan-neon,#00f2fe);">Stream Offline</h3>
            <p style="color:var(--color-text-muted);font-size:13px;margin:0;">The broadcaster is not currently streaming.</p>
          </div>
        </div>

        <div style="padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
            <div>
              <h2 style="font-size:20px;font-weight:700;margin:0 0 6px;" id="watch-title">${Vt(a)}</h2>
              <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;" id="watch-meta">
                <span class="badge-live">LIVE</span>
                <span class="text-muted" id="watch-viewers">${N.eye} <span id="viewer-count-num">${(t==null?void 0:t.viewerCount)||0}</span> viewers</span>
                <span class="badge-category">${Vt((t==null?void 0:t.categoryName)||"General")}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button id="watch-clip-btn" class="btn btn-outline btn-sm">${N.clip} Clip</button>
              <button id="watch-follow-btn" class="btn btn-cyan btn-sm follow-btn not-following">${N.follow} Follow</button>
            </div>
          </div>

          <div id="watch-channel-info" style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--color-space-panel);border-radius:var(--radius-card);border:1px solid rgba(0,174,189,0.12);cursor:pointer;">
            <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#000;overflow:hidden;flex-shrink:0;" id="watch-avatar">
              ${t!=null&&t.profilePictureUrl||t!=null&&t.channelPhotoUrl?`<img src="${t.profilePictureUrl||t.channelPhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`:((t==null?void 0:t.streamerName)||(t==null?void 0:t.channelName)||"S")[0].toUpperCase()}
            </div>
            <div style="flex:1;overflow:hidden;">
              <div style="font-weight:600;font-size:16px;display:flex;align-items:center;gap:6px;" id="watch-streamer">
                <span>${Vt((t==null?void 0:t.streamerName)||"Streamer")}</span> ${N.checkCircle}
              </div>
              <div style="font-size:13px;color:var(--color-text-muted);" id="watch-desc">Click to visit channel profile</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Kick/Twitch Style Stream Chat Panel -->
      <div class="chat-panel" style="width:var(--chat-width, 340px);flex-shrink:0;display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,0.08);background:var(--color-space-panel, #0f1424);height:calc(100vh - var(--topbar-height));position:relative;">
        <div class="chat-header" style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(4,7,18,0.4);">
          <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:var(--color-text-primary,#fff);">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-cyan-neon);box-shadow:0 0 8px var(--color-cyan-neon);"></span>
            <span>Stream Chat</span>
          </div>
          <span style="font-size:11px;font-weight:600;color:var(--color-text-muted);" id="chat-status">Connecting...</span>
        </div>

        <div class="chat-messages" id="chat-messages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:4px;scroll-behavior:smooth;">
          <div class="chat-guidelines-banner" style="background:rgba(0,242,254,0.06);border:1px solid rgba(0,242,254,0.18);border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:12px;color:var(--color-text-muted);display:flex;align-items:flex-start;gap:8px;">
            <span style="font-size:16px;">🚀</span>
            <div style="flex:1;line-height:1.4;">
              <strong style="color:var(--color-text-primary,#fff);display:block;margin-bottom:2px;font-size:12px;">Welcome to Orbit Chat!</strong>
              Be respectful, support the broadcaster, and have fun.
            </div>
          </div>
        </div>

        <!-- Floating scroll-to-bottom indicator -->
        <button id="chat-scroll-bottom" style="display:none;position:absolute;bottom:110px;left:50%;transform:translateX(-50%);background:rgba(0,242,254,0.95);color:#000;font-size:11px;font-weight:700;border:none;border-radius:20px;padding:5px 14px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.6);z-index:10;">
          ↓ New Messages
        </button>

        <!-- Quick Reactions Bar -->
        <div class="chat-quick-reactions" id="chat-quick-reactions" style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(0,0,0,0.25);border-top:1px solid rgba(255,255,255,0.06);overflow-x:auto;">
          <span style="font-size:10px;font-weight:700;color:var(--color-text-muted);letter-spacing:0.04em;text-transform:uppercase;margin-right:2px;white-space:nowrap;">React:</span>
          <button class="chat-quick-pill" data-emote=":hype:" title="Hype Rocket (:hype:)" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:14px;background:rgba(0,242,254,0.08);border:1px solid rgba(0,242,254,0.25);color:var(--color-cyan-neon);font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all 0.15s;">
            <span style="width:16px;height:16px;display:inline-flex;">${mt("orbitHype")}</span> Hype
          </button>
          <button class="chat-quick-pill" data-emote=":fire:" title="Cosmic Flame (:fire:)" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:14px;background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.25);color:#FF6B35;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all 0.15s;">
            <span style="width:16px;height:16px;display:inline-flex;">${mt("orbitFire")}</span> Fire
          </button>
          <button class="chat-quick-pill" data-emote=":pog:" title="Amazed Planet (:pog:)" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:14px;background:rgba(0,174,189,0.08);border:1px solid rgba(0,174,189,0.25);color:#00AEBD;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all 0.15s;">
            <span style="width:16px;height:16px;display:inline-flex;">${mt("orbitPog")}</span> Pog
          </button>
          <button class="chat-quick-pill" data-emote=":gg:" title="Star Trophy (:gg:)" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:14px;background:rgba(255,217,61,0.08);border:1px solid rgba(255,217,61,0.25);color:#FFD93D;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all 0.15s;">
            <span style="width:16px;height:16px;display:inline-flex;">${mt("orbitGG")}</span> GG
          </button>
          <button class="chat-quick-pill" data-emote=":love:" title="Nebula Heart (:love:)" style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:14px;background:rgba(255,105,180,0.08);border:1px solid rgba(255,105,180,0.25);color:#FF69B4;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all 0.15s;">
            <span style="width:16px;height:16px;display:inline-flex;">${mt("orbitLove")}</span> Love
          </button>
        </div>

        <!-- Emote Picker Popover -->
        <div id="chat-emote-picker" style="display:none;position:absolute;bottom:100px;right:12px;left:12px;background:rgba(12,16,28,0.96);border:1px solid rgba(0,242,254,0.3);border-radius:10px;padding:12px;box-shadow:0 12px 36px rgba(0,0,0,0.6);backdrop-filter:blur(16px);z-index:20;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:12px;font-weight:700;color:var(--color-cyan-neon);">Custom Orbit Emotes</span>
            <button id="chat-emote-picker-close" style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:14px;">✕</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;max-height:160px;overflow-y:auto;padding:4px;">
            ${ba().map(s=>`
              <button class="chat-emote-select-btn" data-code=":${s.name.replace("orbit","").toLowerCase()}:" title="${s.label} (:${s.name.replace("orbit","").toLowerCase()}:)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 4px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.15s;">
                <span style="width:28px;height:28px;display:inline-flex;">${s.svg}</span>
                <span style="font-size:10px;color:var(--color-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">${s.label}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="chat-input-area" style="padding:10px 12px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.25);">
          ${e?`
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="text" id="chat-input" placeholder="Say something... (:hype:, :fire:)" maxlength="500" class="input-dark" style="flex:1;height:38px;padding:0 12px;font-size:13px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);" />
              <button id="chat-emote-btn" type="button" title="Orbit Emotes" style="width:38px;height:38px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:var(--color-cyan-neon);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;transition:all 0.15s;flex-shrink:0;">
                😊
              </button>
              <button id="chat-send" class="btn btn-cyan btn-sm" style="height:38px;padding:0 14px;border-radius:8px;flex-shrink:0;">
                ${N.send}
              </button>
            </div>
          `:`
            <button id="chat-login-btn" class="btn btn-cyan btn-sm" style="width:100%;height:38px;font-weight:600;border-radius:8px;justify-content:center;">
              Log in to Chat
            </button>
          `}
        </div>
      </div>
    </div>
  `}function Or(){var T,Q,K,ce,ue,pe;const t=I.getState().viewParams,e=t==null?void 0:t.streamId,a=I.getState().activeStream;Ve&&(Li&&Ve.invoke("LeaveStream",Li).catch(()=>{}),Ve.stop().catch(()=>{}),Ve=null),ot&&(ot.destroy(),ot=null),yt&&(clearInterval(yt),yt=null),_i&&(clearTimeout(_i),_i=null);const s=document.getElementById("youtube-player-frame");s&&s.remove();const d=G=>{G&&(Li=G.id,G.channelId,I.state.activeStream=G,Un(G),Nn(G),Nr(G.channelId,G.id),Ur(G),G.channelId&&tt.getById(G.channelId).then(te=>{if(!te)return;const ye=te.profilePhotoUrl||te.ownerProfilePictureUrl,le=document.getElementById("watch-avatar");le&&ye&&ye.startsWith("http")&&(le.innerHTML=`<img src="${ye}" style="width:100%;height:100%;object-fit:cover;" />`);const Ae=document.getElementById("watch-desc");Ae&&te.description&&(Ae.textContent=te.description)}).catch(te=>console.warn("Could not load channel details for watch room:",te)))};if(e){const G=parseInt(e);!a||a.id!==G?wt.getStreamById(e).then(te=>{d(te)}).catch(te=>{var ye;console.warn("Could not load stream details:",te),a?d(a):(ye=document.getElementById("player-offline"))==null||ye.classList.remove("hidden")}):d(a)}else a&&d(a);(T=document.getElementById("watch-clip-btn"))==null||T.addEventListener("click",()=>{const G=I.getState().activeStream,te=e||(G==null?void 0:G.id);if(!te)return;if(!Kt()){I.showToast("Please log in to create a clip","info"),I.navigate("login");return}I.openModal("slice",{streamId:te,channelId:G==null?void 0:G.channelId}),zr(te,G==null?void 0:G.channelId)});const h=document.getElementById("orbit-ctrl-play"),g=document.getElementById("orbit-ctrl-mute"),f=document.getElementById("orbit-ctrl-vol-slider"),_=document.getElementById("orbit-ctrl-fullscreen"),b=document.getElementById("player-container"),u=document.getElementById("stream-video"),x=()=>{$e.isPlaying?($e.isYt?jt("pauseVideo"):u&&u.pause(),$e.isPlaying=!1):($e.isYt?jt("playVideo"):u&&u.play().catch(()=>{}),$e.isPlaying=!0),$i(),ut()};h==null||h.addEventListener("click",x);const m=document.getElementById("orbit-player-shield");m==null||m.addEventListener("click",x),m==null||m.addEventListener("dblclick",()=>_==null?void 0:_.click()),m==null||m.addEventListener("mousemove",ut);const y=()=>{if($e.isMuted){$e.isMuted=!1;const G=$e.volume||1;$e.isYt?(jt("unMute"),jt("setVolume",[Math.round(G*100)])):u&&(u.muted=!1,u.volume=G)}else $e.isMuted=!0,$e.isYt?jt("mute"):u&&(u.muted=!0);$i(),ut()};g==null||g.addEventListener("click",y),f==null||f.addEventListener("input",G=>{const te=parseFloat(G.target.value);$e.volume=te,te===0?($e.isMuted=!0,$e.isYt?jt("mute"):u&&(u.muted=!0)):($e.isMuted=!1,$e.isYt?(jt("unMute"),jt("setVolume",[Math.round(te*100)])):u&&(u.muted=!1,u.volume=te)),$i(),ut()}),_==null||_.addEventListener("click",()=>{document.fullscreenElement?document.exitFullscreen().catch(()=>{}):b&&b.requestFullscreen().catch(()=>{})});let S=!1;const w=document.getElementById("orbit-ctrl-theater"),P=()=>{S=!S,b&&(S?(b.style.maxHeight="calc(100vh - 120px)",b.style.height="calc(100vh - 120px)",w==null||w.classList.add("active"),I.showToast("Theater mode enabled (T)","info")):(b.style.maxHeight="",b.style.height="",w==null||w.classList.remove("active")))};w==null||w.addEventListener("click",P);const $=document.getElementById("orbit-ctrl-pip"),z=async()=>{if(document.pictureInPictureElement)document.exitPictureInPicture().catch(()=>{});else if(u&&u.requestPictureInPicture)try{await u.requestPictureInPicture()}catch{I.showToast("Picture-in-Picture not available for this stream","info")}};$==null||$.addEventListener("click",z),(Q=document.getElementById("orbit-ctrl-rewind-10"))==null||Q.addEventListener("click",G=>{G.stopPropagation(),Ki(-10),ut()}),(K=document.getElementById("orbit-ctrl-forward-10"))==null||K.addEventListener("click",G=>{G.stopPropagation(),Ki(10),ut()}),(ce=document.getElementById("orbit-ctrl-live-badge"))==null||ce.addEventListener("click",G=>{G.stopPropagation(),ca(),ut()});const D=document.getElementById("orbit-dvr-scrubber-area"),F=document.getElementById("orbit-dvr-tooltip");let E=!1;const Y=G=>{if(!u||!u.seekable||u.seekable.length===0)return;const te=D.getBoundingClientRect(),ye=Math.max(0,Math.min(1,(G.clientX-te.left)/te.width)),le=u.seekable.start(0),Ae=u.seekable.end(0),q=le+ye*(Ae-le);u.currentTime=Math.min(Ae-.5,q),ti()};D==null||D.addEventListener("mousedown",G=>{E=!0,Y(G)}),window.addEventListener("mousemove",G=>{E&&Y(G)}),window.addEventListener("mouseup",()=>{E&&(E=!1,ut())}),D==null||D.addEventListener("mousemove",G=>{if(!u||!u.seekable||u.seekable.length===0)return;const te=D.getBoundingClientRect(),ye=Math.max(0,Math.min(1,(G.clientX-te.left)/te.width)),le=u.seekable.start(0),Ae=u.seekable.end(0),q=le+ye*(Ae-le),R=Math.round(Ae-q);F&&(F.style.display="block",F.style.left=`${ye*100}%`,F.textContent=R<=5?"LIVE":`-${kn(R)}`)}),D==null||D.addEventListener("mouseleave",()=>{F&&(F.style.display="none")});const j=G=>{var ye,le;const te=(ye=document.activeElement)==null?void 0:ye.tagName;te==="INPUT"||te==="TEXTAREA"||(le=document.activeElement)!=null&&le.isContentEditable||(G.key===" "||G.code==="Space"?(G.preventDefault(),x()):G.key==="ArrowLeft"?(G.preventDefault(),Ki(-10),ut()):G.key==="ArrowRight"?(G.preventDefault(),Ki(10),ut()):G.key==="l"||G.key==="L"?(G.preventDefault(),ca(),ut()):G.key==="m"||G.key==="M"?(G.preventDefault(),y()):G.key==="f"||G.key==="F"?(G.preventDefault(),_==null||_.click()):G.key==="t"||G.key==="T"?(G.preventDefault(),P()):(G.key==="p"||G.key==="P")&&(G.preventDefault(),z()))};window.addEventListener("keydown",j),b==null||b.addEventListener("mousemove",ut),b==null||b.addEventListener("mouseenter",ut),b==null||b.addEventListener("mouseleave",()=>{const G=document.getElementById("orbit-player-controls");G&&$e.isPlaying&&(G.style.opacity="0")}),(ue=document.getElementById("watch-channel-info"))==null||ue.addEventListener("click",()=>{const G=I.getState().activeStream;G!=null&&G.channelId&&I.navigate("channel",{channelId:G.channelId})}),(pe=document.getElementById("chat-login-btn"))==null||pe.addEventListener("click",()=>{I.navigate("login")});const X=document.getElementById("chat-input"),V=document.getElementById("chat-send");if(X&&V){const G=async()=>{const te=X.value.trim(),ye=Li||parseInt(e);if(!(!te||!Ve||!ye))try{await Ve.invoke("SendMessage",ye,te),X.value=""}catch(le){I.showToast(le.message||"Failed to send message","error")}};V.addEventListener("click",G),X.addEventListener("keydown",te=>{te.key==="Enter"&&G()})}document.querySelectorAll(".chat-quick-pill").forEach(G=>{G.addEventListener("click",async()=>{const te=G.dataset.emote;if(!Kt()){I.showToast("Please log in to chat","info"),I.navigate("login");return}const le=Li||parseInt(e);if(Ve&&le&&te)try{await Ve.invoke("SendMessage",le,te)}catch(Ae){I.showToast(Ae.message||"Failed to send reaction","error")}})});const L=document.getElementById("chat-emote-btn"),C=document.getElementById("chat-emote-picker"),B=document.getElementById("chat-emote-picker-close");L&&C&&(L.addEventListener("click",G=>{G.stopPropagation();const te=C.style.display==="none"||!C.style.display;C.style.display=te?"block":"none"}),B==null||B.addEventListener("click",G=>{G.stopPropagation(),C.style.display="none"}),document.addEventListener("click",G=>{C&&!C.contains(G.target)&&G.target!==L&&(C.style.display="none")}),document.querySelectorAll(".chat-emote-select-btn").forEach(G=>{G.addEventListener("click",te=>{te.stopPropagation();const ye=G.dataset.code;if(X&&ye){const le=X.value?X.value.trim():"";X.value=le?`${le} ${ye} `:`${ye} `,X.focus()}C.style.display="none"})}))}function Ur(t){const e=document.getElementById("watch-follow-btn");if(!e||!(t!=null&&t.channelId))return;const a=I.isFollowing(t.channelId);e.className=`btn btn-sm follow-btn ${a?"following":"not-following"}`,e.innerHTML=a?`${N.followFilled} Following`:`${N.follow} Follow`,e.onclick=async()=>{e.disabled=!0;const s=t.streamerName||t.channelName||"Streamer",d=await I.toggleFollow(t.channelId,s);e.className=`btn btn-sm follow-btn ${d?"following":"not-following"}`,e.innerHTML=d?`${N.followFilled} Following`:`${N.follow} Follow`,I.showToast(d?`Following ${s}!`:`Unfollowed ${s}`,"info"),e.disabled=!1}}function Un(t){const e=document.getElementById("watch-title");e&&(e.textContent=t.title||"Untitled Stream");const a=document.getElementById("viewer-count-num");a&&(a.textContent=t.viewerCount||0);const s=document.getElementById("watch-streamer");s&&(s.innerHTML=`<span>${Vt(t.streamerName||t.channelName||"Streamer")}</span> ${N.checkCircle}`);const d=document.getElementById("watch-avatar");if(d){const h=t.profilePictureUrl||t.channelPhotoUrl||t.profilePhotoUrl;h&&h.startsWith("http")?d.innerHTML=`<img src="${h}" style="width:100%;height:100%;object-fit:cover;" />`:d.textContent=(t.streamerName||t.channelName||"S")[0].toUpperCase()}}async function Nn(t){var f;const e=document.getElementById("player-offline");if(!(t!=null&&t.hlsUrl)){if(e){e.classList.remove("hidden");const _=e.querySelector("p"),b=Kt(),u=b&&t&&(t.streamerId===b.id||t.streamerName===b.fullName||t.channelId===b.channelId);_&&(_.textContent=u?'Stream session ready. Click "Start Streaming" in OBS to go live.':"The broadcaster is not currently streaming.")}t!=null&&t.id&&!yt&&(yt=setInterval(async()=>{try{const _=await wt.getStreamById(t.id);_&&_.isLive&&_.hlsUrl&&(clearInterval(yt),yt=null,I.state.activeStream=_,Un(_),Nn(_))}catch{}},3e3));return}yt&&(clearInterval(yt),yt=null);const a=(t==null?void 0:t.youtubeUrl)||(t!=null&&t.hlsUrl&&(t.hlsUrl.includes("youtube.com")||t.hlsUrl.includes("youtu.be"))?t.hlsUrl:null);if(t!=null&&t.isSimulated||a){const _=a?a.match(/(?:v=|\/live\/|\/embed\/|youtu\.be\/|\/v\/)([^?&/]+)/):null,b=_?_[1]:null;if(b){ot&&(ot.destroy(),ot=null);const u=document.getElementById("stream-video");u&&(u.pause(),u.style.display="none");const x=document.getElementById("player-unmute-btn");x&&(x.style.display="none"),e==null||e.classList.add("hidden");let m=document.getElementById("youtube-player-frame");m||(m=document.createElement("iframe"),m.id="youtube-player-frame",m.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",m.allowFullscreen=!0,(f=document.getElementById("player-container"))==null||f.appendChild(m)),m.style.cssText="position:absolute;top:-60px;left:0;width:100%;height:calc(100% + 120px);border:none;z-index:2;pointer-events:none;";const y=typeof window<"u"?window.location.origin:"";m.src=`https://www.youtube.com/embed/${b}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(y)}`,m.style.display="block",$e.isYt=!0,$e.isPlaying=!0,$e.isMuted=!1,$i(),ut();return}}const s=document.getElementById("youtube-player-frame");s&&s.remove();let d=t.hlsUrl;typeof window<"u"&&window.location.protocol==="https:"&&(d=d.replace("http://localhost:8080","https://localhost:8443").replace("http://127.0.0.1:8080","https://localhost:8443"));const h=document.getElementById("stream-video");if(!h)return;h.style.display="block",ot&&(ot.destroy(),ot=null);const g=document.getElementById("player-unmute-btn");h.muted=!0,h.playsInline=!0,g&&(g.style.display="flex",g.onclick=()=>{h.muted=!1,g.style.display="none"});try{const _=(await Ea(async()=>{const{default:b}=await import("./hls-qrK6pUM6.js");return{default:b}},[],import.meta.url)).default;if(_.isSupported()){const b=new _({xhrSetup:u=>{u.setRequestHeader("ngrok-skip-browser-warning","true")},enableWorker:!0,lowLatencyMode:!0,backBufferLength:14400,liveBackBufferLength:14400,liveSyncDurationCount:3,liveMaxLatencyDurationCount:10,manifestLoadingMaxRetry:10,manifestLoadingRetryDelay:1500});ot=b,b.loadSource(d),b.attachMedia(h),h.ontimeupdate=ti,h.onprogress=ti,h.onseeking=ti,h.onseeked=ti,b.on(_.Events.MANIFEST_PARSED,()=>{e==null||e.classList.add("hidden"),$e.isYt=!1,$e.isPlaying=!0,$e.isMuted=h.muted,$i(),ut(),h.play().catch(u=>{console.warn("[WatchRoom] Autoplay blocked, click video or unmute to play",u)})}),b.on(_.Events.ERROR,(u,x)=>{if(x.fatal)switch(console.warn("[WatchRoom] HLS fatal error:",x.type,x.details),x.type){case _.ErrorTypes.NETWORK_ERROR:_i&&clearTimeout(_i),_i=setTimeout(()=>{ot&&ot.startLoad()},2e3);break;case _.ErrorTypes.MEDIA_ERROR:b.recoverMediaError();break;default:e==null||e.classList.remove("hidden"),b.destroy(),ot=null;break}})}else h.canPlayType("application/vnd.apple.mpegurl")&&(h.src=d,h.addEventListener("loadedmetadata",()=>{e==null||e.classList.add("hidden"),h.play().catch(()=>{})}))}catch(_){console.warn("[WatchRoom] HLS init failed",_),e==null||e.classList.remove("hidden")}}async function Nr(t,e){var _,b,u;const a=document.getElementById("chat-status"),s=document.getElementById("chat-messages"),d=document.getElementById("chat-scroll-bottom");if(!e||!s)return;const h=Kt(),g=h&&(((_=h.roles)==null?void 0:_.includes("Admin"))||((b=h.roles)==null?void 0:b.includes("Moderator"))||((u=h.roles)==null?void 0:u.includes("Streamer")));try{const x=await Jo.getStreamChat(e);Array.isArray(x)&&(s.innerHTML=x.map(m=>ua(m,g)).join(""),s.scrollTop=s.scrollHeight)}catch(x){console.warn("Could not load chat history:",x)}let f=!0;s.addEventListener("scroll",()=>{f=s.scrollHeight-s.clientHeight<=s.scrollTop+60,d&&(d.style.display=f?"none":"block")}),d==null||d.addEventListener("click",()=>{s.scrollTop=s.scrollHeight,d.style.display="none"}),s.addEventListener("click",async x=>{const m=x.target.closest(".btn-del-msg");if(m){const w=parseInt(m.dataset.msgId);if(!confirm("Delete this message?"))return;try{Ve?await Ve.invoke("DeleteMessage",e,w):await zt.deleteMessage(t,w),I.showToast("Message deleted","info")}catch(P){I.showToast(P.message||"Failed to delete message","error")}return}const y=x.target.closest(".btn-timeout-user");if(y){const w=y.dataset.username;if(!confirm(`Timeout ${w} for 5 minutes?`))return;try{await zt.timeoutUser(t,{username:w,durationSeconds:300,reason:"Chat violation"}),I.showToast(`${w} timed out for 5 minutes`,"info")}catch(P){I.showToast(P.message||"Failed to timeout user","error")}return}const S=x.target.closest(".btn-ban-user");if(S){const w=S.dataset.username;if(!confirm(`Permanently ban ${w} from this channel's chat?`))return;try{await zt.banUser(t,{username:w,reason:"Chat violation"}),I.showToast(`${w} banned from chat`,"info")}catch(P){I.showToast(P.message||"Failed to ban user","error")}}});try{const x=xi();Ve=new Aa().withUrl(`${Oi}/hubs/stream-chat`,{accessTokenFactory:()=>x||""}).withAutomaticReconnect().build(),Ve.on("ReceiveMessage",m=>{const y=document.createElement("div");y.innerHTML=ua(m,g);const S=y.firstElementChild;S&&s.appendChild(S),f?s.scrollTop=s.scrollHeight:d&&(d.style.display="block")}),Ve.on("MessageDeleted",m=>{const y=s.querySelector(`[data-msg-id="${m}"]`);y&&(y.innerHTML='<span style="color:var(--color-text-muted);font-style:italic;font-size:12px;opacity:0.7;">&lt;message deleted by moderator&gt;</span>')}),Ve.on("ViewerCountUpdate",(m,y)=>{if(m===e){const S=document.getElementById("viewer-count-num");S&&(S.textContent=y)}}),Ve.on("StreamUpdated",m=>{if(m&&m.streamId===e){const y=document.getElementById("watch-title");y&&m.title&&(y.textContent=m.title);const S=document.querySelector("#watch-meta .badge-category");S&&m.categoryName&&(S.textContent=m.categoryName)}}),Ve.on("UserTimedOut",(m,y)=>{const S=document.createElement("div");S.style.cssText="color:#f59e0b;font-style:italic;font-size:11px;padding:3px 8px;background:rgba(245,158,11,0.08);border-radius:4px;",S.textContent=`⏳ ${m} was timed out (${y}s)`,s.appendChild(S),f&&(s.scrollTop=s.scrollHeight)}),Ve.on("UserBanned",m=>{const y=document.createElement("div");y.style.cssText="color:#ef4444;font-style:italic;font-size:11px;padding:3px 8px;background:rgba(239,68,68,0.08);border-radius:4px;",y.textContent=`🚫 ${m} was banned from chat`,s.appendChild(y),f&&(s.scrollTop=s.scrollHeight)}),Ve.on("Error",m=>{I.showToast(m,"error")}),Ve.onreconnecting(m=>{console.warn("[Chat] SignalR reconnecting:",m),a&&(a.textContent="Reconnecting...",a.style.color="#f59e0b")}),Ve.onreconnected(()=>{console.log("[Chat] SignalR reconnected"),a&&(a.textContent="Connected",a.style.color="var(--color-success, #10b981)"),Ve.invoke("JoinStream",e).catch(console.warn)}),Ve.onclose(m=>{console.warn("[Chat] SignalR connection closed:",m),a&&(a.textContent="Disconnected",a.style.color="var(--color-error, #ef4444)")}),Ve.on("StreamStarted",m=>{if(console.log("[WatchRoom] SignalR StreamStarted received:",m),m&&(m.streamId===e||!e)){yt&&(clearInterval(yt),yt=null);const y=I.getState().activeStream||{},S={...y,...m,isLive:!0,hlsUrl:m.hlsUrl||y.hlsUrl};I.state.activeStream=S,Un(S),Nn(S),I.showToast("The stream is now LIVE!","success")}}),Ve.on("StreamEnded",m=>{var y;if(m===e){ot&&(ot.destroy(),ot=null),(y=document.getElementById("player-offline"))==null||y.classList.remove("hidden");const S=document.getElementById("watch-meta"),w=S==null?void 0:S.querySelector(".badge-live");w&&(w.style.display="none"),I.showToast("Live stream has ended.","info")}}),await Ve.start(),await Ve.invoke("JoinStream",e),a&&(a.textContent="Connected",a.style.color="var(--color-success, #10b981)")}catch(x){console.warn("Chat connection failed:",x),a&&(a.textContent="Disconnected",a.style.color="var(--color-error, #ef4444)")}}function ua(t,e){var m;const a=t.senderName||t.SenderName||t.username||"Viewer",s=t.content||t.Content||"",d=t.id||t.Id,h=t.sentAt||t.SentAt,g=h?new Date(h).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"",f=Br(s),_=I.getState().activeStream,b=_&&(a===_.streamerName||a===_.channelName||a===((m=_.channel)==null?void 0:m.ownerUsername)),u=Dr(t,a),x=Pr(b,t.senderRole||t.SenderRole);return`
    <div class="chat-msg chat-msg-animate" data-msg-id="${d||""}" style="display:flex;align-items:flex-start;justify-content:space-between;padding:5px 8px;border-radius:6px;gap:6px;transition:background 0.15s ease;">
      <div style="flex:1;word-break:break-word;font-size:13px;line-height:1.5;">
        <span style="font-size:10px;color:var(--color-text-muted);margin-right:4px;opacity:0.65;font-variant-numeric:tabular-nums;">${g}</span>
        ${u}
        <span class="chat-user" style="font-weight:700;color:${x};margin-right:5px;cursor:pointer;">${Vt(a)}:</span>
        <span class="chat-text" style="color:var(--color-text-primary,#e2e8f0);">${f}</span>
      </div>
      ${e&&d?`
        <div class="chat-msg-actions" style="display:flex;gap:2px;opacity:0.35;transition:opacity 0.2s;flex-shrink:0;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0.35">
          <button class="btn btn-ghost btn-del-msg" data-msg-id="${d}" title="Delete Message" style="padding:2px 4px;font-size:10px;color:#ef4444;border:none;background:none;cursor:pointer;">
            ${N.trash}
          </button>
          <button class="btn btn-ghost btn-timeout-user" data-username="${Vt(a)}" title="Timeout (5m)" style="padding:2px 4px;font-size:10px;color:#f59e0b;border:none;background:none;cursor:pointer;">
            ⏱
          </button>
          <button class="btn btn-ghost btn-ban-user" data-username="${Vt(a)}" title="Ban" style="padding:2px 4px;font-size:10px;color:#ef4444;border:none;background:none;cursor:pointer;">
            🚫
          </button>
        </div>
      `:""}
    </div>
  `}function zr(t,e){var h,g,f;const a=document.getElementById("modal-root")||document.body,s=document.createElement("div");s.className="modal-overlay",s.id="slice-overlay",s.innerHTML=`
    <div class="modal-content" style="max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">${N.clip} Create Highlight Clip</h3>
        <button id="slice-close-x" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button>
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Clip Title</label>
        <input class="input-dark" id="slice-title" placeholder="Epic play or funny moment" style="margin-top:4px;" />
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Duration (seconds, max 300)</label>
        <input class="input-dark" type="number" id="slice-duration" value="60" min="10" max="300" style="margin-top:4px;" />
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button id="slice-cancel" class="btn btn-ghost btn-sm">Cancel</button>
        <button id="slice-confirm" class="btn btn-cyan btn-sm">Create Clip</button>
      </div>
    </div>
  `,a.appendChild(s);const d=()=>{s.remove(),I.closeModal()};(h=s.querySelector("#slice-close-x"))==null||h.addEventListener("click",d),(g=s.querySelector("#slice-cancel"))==null||g.addEventListener("click",d),s.addEventListener("click",_=>{_.target===s&&d()}),(f=s.querySelector("#slice-confirm"))==null||f.addEventListener("click",async()=>{var b,u,x;const _=s.querySelector("#slice-confirm");_.disabled=!0,_.textContent="Generating...";try{const m=I.getState().activeStream,y=parseInt(t)||(m==null?void 0:m.id),S=e?parseInt(e):(m==null?void 0:m.channelId)||((b=m==null?void 0:m.channel)==null?void 0:b.id),w=((u=m==null?void 0:m.channel)==null?void 0:u.streamKey)||(m==null?void 0:m.streamKey)||"",P=(m==null?void 0:m.isLive)??!0,$=(m==null?void 0:m.recordingFileName)||(m==null?void 0:m.videoUrl)||null,z=(m==null?void 0:m.categoryId)||((x=m==null?void 0:m.category)==null?void 0:x.id)||null;await Ft.slice({streamId:y,liveStreamId:y,channelId:S,streamKey:w,isLive:P,recordingFileName:$,categoryId:z,title:s.querySelector("#slice-title").value.trim()||"Untitled Clip",durationSeconds:parseInt(s.querySelector("#slice-duration").value)||60}),I.showToast("Clip created successfully!","success"),d()}catch(m){I.showToast(m.message||"Failed to create clip","error"),_.disabled=!1,_.textContent="Create Clip"}})}let Rt="live",pi=null,cn=[],zn=[];function fi(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function Vr(){return`
    <div>
      <!-- Browse Header with Tabs and Search -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
        <div style="display:flex;align-items:center;gap:16px;">
          <div class="section-title" style="margin-bottom:0;">${N.grid} Browse</div>
          <div class="tab-group" style="display:flex;background:var(--color-space-panel, #0f1424);padding:4px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);gap:4px;">
            <button id="browse-tab-live" class="tab-btn ${Rt==="live"?"active":""}" style="padding:6px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
              <span style="color:#ff3b30;margin-right:4px;">●</span> Live Channels
            </button>
            <button id="browse-tab-cats" class="tab-btn ${Rt==="categories"?"active":""}" style="padding:6px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">
              ${N.grid} Categories
            </button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;">
          <div class="search-bar" style="max-width:280px;">
            ${N.search}
            <input type="text" id="cat-search-input" placeholder="${Rt==="live"?"Search live channels...":"Search categories..."}" />
          </div>
          <button id="browse-refresh-btn" class="btn btn-ghost btn-sm" title="Refresh list" style="padding:8px 12px;border-radius:8px;">
            ${N.refresh}
          </button>
        </div>
      </div>

      <!-- Main Content Container -->
      <div id="browse-content-container">
        <div class="spinner" style="margin:40px auto;"></div>
      </div>
    </div>
  `}function Fr(){var a,s,d;pi&&(clearInterval(pi),pi=null),yn(!0),pi=setInterval(()=>{if(!document.getElementById("browse-content-container")){clearInterval(pi),pi=null;return}yn(!1)},15e3),(a=document.getElementById("browse-tab-live"))==null||a.addEventListener("click",()=>{Rt="live",pa(),Cn()}),(s=document.getElementById("browse-tab-cats"))==null||s.addEventListener("click",()=>{Rt="categories",pa(),Cn()}),(d=document.getElementById("browse-refresh-btn"))==null||d.addEventListener("click",()=>{yn(!0)});const t=document.getElementById("cat-search-input");let e;t&&t.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>{Hr(t.value.trim())},250)})}function pa(){const t=document.getElementById("browse-tab-live"),e=document.getElementById("browse-tab-cats"),a=document.getElementById("cat-search-input");t&&t.classList.toggle("active",Rt==="live"),e&&e.classList.toggle("active",Rt==="categories"),a&&(a.placeholder=Rt==="live"?"Search live channels...":"Search categories...",a.value="")}async function yn(t=!1){const e=document.getElementById("browse-content-container");if(e){t&&(e.innerHTML='<div class="spinner" style="margin:40px auto;"></div>');try{const[a,s]=await Promise.all([(typeof wt.getActiveStreams=="function"?wt.getActiveStreams():typeof wt.getLiveStreams=="function"?wt.getLiveStreams():Promise.resolve([])).catch(()=>[]),_t.getAll().catch(()=>[])]);cn=Array.isArray(a)?a:[],zn=Array.isArray(s)?s:[],Cn()}catch(a){console.warn("[Browse] Error loading data:",a),t&&(e.innerHTML='<p class="text-muted text-center" style="margin:40px 0;">Failed to load browse content.</p>')}}}function Cn(){const t=document.getElementById("browse-content-container");t&&(Rt==="live"?Ta(t,cn):La(t,zn))}function Hr(t){const e=document.getElementById("browse-content-container");if(!e)return;const a=t.toLowerCase();if(Rt==="live"){const s=cn.filter(d=>d.title&&d.title.toLowerCase().includes(a)||d.streamerName&&d.streamerName.toLowerCase().includes(a)||d.channelName&&d.channelName.toLowerCase().includes(a)||d.categoryName&&d.categoryName.toLowerCase().includes(a));Ta(e,s)}else{const s=zn.filter(d=>d.name&&d.name.toLowerCase().includes(a)||d.slug&&d.slug.toLowerCase().includes(a));La(e,s)}}function Ta(t,e){var a;if(!(e!=null&&e.length)){t.innerHTML=`
      <div class="empty-state" style="margin:60px auto;text-align:center;">
        <div class="empty-icon" style="font-size:48px;margin-bottom:12px;">📡</div>
        <h3 style="margin-bottom:6px;">No Live Broadcasts Right Now</h3>
        <p class="text-muted" style="font-size:13px;max-width:400px;margin:0 auto 16px;">
          No channels are currently broadcasting. Check back in a moment or start your own stream!
        </p>
        <button id="browse-go-studio-btn" class="btn btn-cyan btn-sm">Go to Streamer Dashboard</button>
      </div>
    `,(a=t.querySelector("#browse-go-studio-btn"))==null||a.addEventListener("click",()=>I.navigate("dashboard"));return}t.innerHTML=`
    <div class="streams-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:20px;">
      ${e.map(s=>{const d=(s.streamerName||s.channelName||"S")[0].toUpperCase();return`
          <div class="card stream-card hover-lift" data-stream-id="${s.id}" style="cursor:pointer;overflow:hidden;border-radius:12px;background:var(--color-space-panel, #0f1424);border:1px solid rgba(255,255,255,0.08);">
            <div class="stream-thumb" style="position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;">
              <img src="${ht}" data-thumb-src="${s.thumbnailUrl||""}" alt="${fi(s.title||"Live Stream")}" style="width:100%;height:100%;object-fit:cover;" />
              <div class="badge-live" style="position:absolute;top:10px;left:10px;background:#ff3b30;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.6);">
                <span style="width:6px;height:6px;border-radius:50%;background:#fff;display:inline-block;"></span>
                LIVE
              </div>
              <div style="position:absolute;bottom:10px;left:10px;background:rgba(4,7,18,0.85);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;backdrop-filter:blur(4px);">
                ${N.eye} <span>${s.viewerCount||0} viewers</span>
              </div>
            </div>
            <div style="padding:14px;display:flex;gap:12px;align-items:flex-start;">
              <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#000;flex-shrink:0;">
                ${d}
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="font-weight:700;font-size:14px;color:var(--color-text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;">
                  ${fi(s.title||"Live Stream")}
                </div>
                <div style="font-size:12px;color:var(--color-text-muted,#aaa);margin-bottom:4px;">
                  ${fi(s.streamerName||s.channelName||"Streamer")}
                </div>
                ${s.categoryName?`<span class="badge-category" style="font-size:10px;padding:1px 6px;">${fi(s.categoryName)}</span>`:""}
              </div>
            </div>
          </div>
        `}).join("")}
    </div>
  `,Et(t),t.querySelectorAll(".stream-card").forEach(s=>{s.addEventListener("click",()=>{const d=parseInt(s.dataset.streamId,10),h=e.find(g=>g.id===d);h&&(I.setActiveStream(h),I.navigate("watch",{streamId:d}))})})}function La(t,e){if(!(e!=null&&e.length)){t.innerHTML='<div class="empty-state" style="margin:40px auto;text-align:center;"><div class="empty-icon" style="font-size:48px;">🔍</div><h3>No Categories Found</h3></div>';return}const a={};for(const s of cn)s.categoryId&&(a[s.categoryId]=(a[s.categoryId]||0)+(s.viewerCount||0));t.innerHTML=`
    <div class="categories-grid" id="categories-grid">
      ${e.map(s=>{const d=a[s.id]||s.totalViewers||0;return`
          <div class="card category-card hover-lift stagger-item" data-slug="${s.slug}" style="cursor:pointer;">
            <div class="cat-thumb">
              ${s.imageUrl?`<img src="${s.imageUrl}" alt="${fi(s.name)}" />`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-gradient-card);">🎮</div>'}
            </div>
            <div class="cat-info">
              <div class="cat-name">${fi(s.name)}</div>
              <div class="cat-viewers" style="color:${d>0?"#ff3b30":"inherit"};font-weight:${d>0?"700":"400"};">
                ${d>0?`● ${d} viewers`:"0 viewers"}
              </div>
            </div>
          </div>
        `}).join("")}
    </div>
  `,t.querySelectorAll(".category-card").forEach(s=>{s.addEventListener("click",()=>I.navigate("category-detail",{slug:s.dataset.slug}))})}let on="streams";function jr(){return`
    <div>
      <div id="cat-header" style="display:flex;gap:20px;align-items:center;margin-bottom:24px;padding:24px;background:var(--color-space-panel);border-radius:var(--radius-card);border:1px solid rgba(0,174,189,0.12);">
        <div id="cat-img" style="width:120px;height:160px;border-radius:12px;overflow:hidden;background:var(--bg-gradient-card);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:48px;">&#127918;</div>
        <div>
          <h1 id="cat-name" style="font-size:24px;font-weight:700;margin-bottom:4px;">Loading...</h1>
          <p id="cat-desc" style="color:var(--color-text-muted);font-size:14px;"></p>
        </div>
      </div>
      <div class="tabs">
        <button class="tab-btn ${on==="streams"?"active":""}" data-tab="streams">Live Streams</button>
        <button class="tab-btn ${on==="clips"?"active":""}" data-tab="clips">Top Clips</button>
      </div>
      <div id="cat-content"><div class="spinner"></div></div>
    </div>
  `}function Gr(){var e;const t=(e=I.getState().viewParams)==null?void 0:e.slug;t&&(qr(t),document.querySelectorAll(".tab-btn").forEach(a=>{a.addEventListener("click",()=>{on=a.dataset.tab,document.querySelectorAll(".tab-btn").forEach(s=>s.classList.remove("active")),a.classList.add("active"),Ia(t)})}))}async function qr(t){try{const e=await _t.getBySlug(t);document.getElementById("cat-name").textContent=e.name,document.getElementById("cat-desc").textContent=e.description||"";const a=document.getElementById("cat-img");e.imageUrl&&a&&(a.innerHTML=`<img src="${e.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />`),Ia(t)}catch{I.showToast("Category not found","error")}}async function Ia(t){const e=document.getElementById("cat-content");if(e)if(e.innerHTML='<div class="spinner"></div>',on==="streams")try{const a=await _t.getStreams(t);if(!(a!=null&&a.length)){e.innerHTML='<div class="empty-state"><div class="empty-icon">&#128752;</div><h3>No Live Streams</h3><p>No one is streaming in this category right now.</p></div>';return}e.innerHTML=`<div class="streams-grid">${a.map(s=>`
        <div class="card stream-card hover-lift" data-sid="${s.id}">
          <div class="stream-thumb"><img src="${ht}" data-thumb-src="${s.thumbnailUrl||""}" /><div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;"><span class="badge-live">LIVE</span><span class="badge-viewers">${s.viewerCount||0}</span></div></div>
          <div class="stream-info"><div class="streamer-row"><div class="streamer-avatar">${(s.streamerName||"S")[0].toUpperCase()}</div><div><div class="streamer-name">${s.streamerName||"Streamer"}</div></div></div><div class="stream-title">${s.title||"Untitled"}</div></div>
        </div>
      `).join("")}</div>`,Et(e),e.querySelectorAll(".stream-card").forEach(s=>s.addEventListener("click",()=>{const d=a.find(h=>h.id===parseInt(s.dataset.sid));d&&(I.setActiveStream(d),I.navigate("watch",{streamId:d.id}))}))}catch{e.innerHTML='<p class="text-muted">Failed to load streams</p>'}else try{const a=await _t.getClips(t);if(!(a!=null&&a.length)){e.innerHTML='<div class="empty-state"><div class="empty-icon">&#127916;</div><h3>No Clips</h3></div>';return}e.innerHTML=`<div class="clips-grid">${a.map(s=>`
        <div class="card clip-card hover-lift"><div class="clip-thumb"><img src="${ht}" data-thumb-src="${s.thumbnailUrl||""}" /><span class="clip-views">${N.eye} ${s.viewCount||0}</span></div><div class="clip-info"><div class="clip-title">${s.title||"Untitled"}</div><div class="clip-meta">by ${s.creatorUsername||"Unknown"}</div></div></div>
      `).join("")}</div>`,Et(e)}catch{e.innerHTML='<p class="text-muted">Failed to load clips</p>'}}const An={getChannelVods:t=>re(`/api/Vod/channel/${t}`),getVodWithChat:t=>re(`/api/Vod/${t}`),recordView:(t,e)=>re(`/api/Vod/${t}/view${e?"?sessionId="+e:""}`,{method:"POST"}),delete:t=>re(`/api/Vod/${t}`,{method:"DELETE"})};let Zt=null,Di=null;async function Vn(t){Yi(),await Mt().catch(()=>{});const e=t.id||t.streamId;let a=t,s=[];const d=document.createElement("div");d.id="vod-player-modal",d.style.cssText=`
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(4, 7, 18, 0.88);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  `,d.innerHTML=`
    <div style="
      background: var(--color-space-panel, #0f1424);
      border: 1px solid rgba(0, 242, 254, 0.25);
      border-radius: 16px;
      width: 100%;
      max-width: 1100px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    ">
      <!-- Modal Header -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: var(--color-cyan-neon, #00f2fe); font-size: 18px;">${N.play}</span>
          <h3 id="vod-modal-title" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--color-text, #fff);">
            ${Ii(t.title||"Broadcast Replay")}
          </h3>
          <span id="vod-modal-format" style="
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            background: rgba(0, 242, 254, 0.12);
            color: var(--color-cyan-neon, #00f2fe);
            font-weight: 600;
          ">VOD</span>
        </div>
        <button id="vod-modal-close" class="btn btn-ghost btn-sm" style="padding: 6px 10px; border-radius: 8px;">
          ${N.x}
        </button>
      </div>

      <!-- Modal Body (Player + Chat Replay) -->
      <div style="display: flex; flex: 1; min-height: 0; flex-direction: row; background: #000;">
        <!-- Left: Video Area -->
        <div style="flex: 1; display: flex; flex-direction: column; background: #000; position: relative; min-width: 0;">
          <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            <video id="vod-video" controls playsinline style="width: 100%; height: 100%; max-height: 55vh; background: #000;"></video>
            <div id="vod-loading-spinner" style="position: absolute; display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--color-cyan-neon, #00f2fe);">
              <div class="spinner"></div>
              <span style="font-size: 13px;">Loading video recording...</span>
            </div>
            <div id="vod-error-box" style="display: none; position: absolute; inset: 0; background: rgba(10,12,20,0.96); flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center; overflow-y: auto;">
              <div id="vod-error-icon" style="font-size: 36px; color: #ef4444;">&#9888;</div>
              <h4 id="vod-error-title" style="margin: 0; color: #fff;">Playback Failed</h4>
              <div id="vod-error-msg" style="margin: 0; color: var(--color-text-muted, #888); font-size: 13px; max-width: 500px; line-height: 1.5;"></div>
              <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; justify-content: center;">
                <a id="vod-direct-link" href="#" target="_blank" class="btn btn-cyan btn-sm">
                  ${N.play} Open in VLC / New Tab
                </a>
                <button id="vod-copy-url-btn" class="btn btn-outline btn-sm">
                  ${N.share} Copy Stream URL
                </button>
                <button id="vod-retry-btn" class="btn btn-ghost btn-sm">
                  ${N.refresh} Retry
                </button>
              </div>
            </div>
          </div>

          <!-- Video Info Sub-bar -->
          <div style="padding: 14px 20px; background: var(--color-space-panel, #0f1424); border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--color-text, #fff);" id="vod-info-streamer">
                ${Ii(t.streamerName||t.channelName||"Broadcaster")}
              </div>
              <div style="font-size: 12px; color: var(--color-text-muted, #888);" id="vod-info-meta">
                ${t.duration?`Duration: ${t.duration} &bull; `:""}${t.rewatchCount||0} views
              </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="vod-copy-url-footer" class="btn btn-ghost btn-sm">
                ${N.share} Share URL
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Synchronized Chat Replay -->
        <div id="vod-chat-panel" style="width: 320px; border-left: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; background: rgba(18, 22, 38, 0.95);">
          <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: var(--color-text, #fff); display: flex; align-items: center; gap: 6px;">
              ${N.emoji} Chat Replay
            </span>
            <span id="vod-chat-count" style="font-size: 11px; color: var(--color-text-muted, #888);">0 messages</span>
          </div>
          <div id="vod-chat-messages" style="flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="color: var(--color-text-muted, #888); text-align: center; margin-top: 40px;">
              Loading chat messages...
            </div>
          </div>
        </div>
      </div>
    </div>
  `,document.body.appendChild(d),Di=d;const h=d.querySelector("#vod-modal-close");h==null||h.addEventListener("click",Yi),d.addEventListener("click",K=>{K.target===d&&Yi()});const g=K=>{K.key==="Escape"&&(Yi(),window.removeEventListener("keydown",g))};if(window.addEventListener("keydown",g),e)try{const K=await An.getVodWithChat(e);if(K&&(a={...t,...K},Array.isArray(K.chatMessages))){s=K.chatMessages;const ce=d.querySelector("#vod-chat-count");ce&&(ce.textContent=`${s.length} messages`)}An.recordView(e,wa()).catch(()=>{})}catch(K){console.warn("[VodPlayer] Could not fetch extended VOD details",K)}const f=d.querySelector("#vod-modal-title");f&&a.title&&(f.textContent=a.title);const _=d.querySelector("#vod-info-streamer");_&&(_.textContent=a.streamerName||a.channelName||"Broadcaster");const b=d.querySelector("#vod-info-meta");b&&(b.innerHTML=`${a.duration?`Duration: ${a.duration} &bull; `:""}${a.rewatchCount||0} views`);const u=a.vodUrl||a.url||t.vodUrl||t.url;let x=Yt(u);const m=d.querySelector("#vod-direct-link");m&&x&&(m.href=x);const y=d.querySelector("#vod-video"),S=d.querySelector("#vod-loading-spinner"),w=d.querySelector("#vod-error-box"),P=d.querySelector("#vod-error-title"),$=d.querySelector("#vod-error-msg"),z=d.querySelector("#vod-error-icon"),D=d.querySelector("#vod-modal-format"),F=d.querySelector("#vod-copy-url-btn"),E=d.querySelector("#vod-copy-url-footer"),Y=d.querySelector("#vod-retry-btn"),j=()=>{var K;x&&((K=navigator.clipboard)==null||K.writeText(x).then(()=>{I.showToast("VOD URL copied to clipboard for VLC!","success")}).catch(()=>{I.showToast("VOD URL: "+x,"info")}))};if(F==null||F.addEventListener("click",j),E==null||E.addEventListener("click",j),Y==null||Y.addEventListener("click",async()=>{w&&(w.style.display="none"),S&&(S.style.display="flex"),await Mt(!0).catch(()=>{}),x=Yt(u),m&&(m.href=x||"#"),T()}),!x){S&&(S.style.display="none"),w&&(w.style.display="flex",$&&($.textContent="No recording video URL was found for this broadcast session."));return}const X=x.toLowerCase().includes(".flv"),V=x.toLowerCase().includes(".mp4");D&&(D.textContent=X?"FLV STREAM":V?"MP4 VIDEO":"VOD");const L=typeof window<"u"&&window.location.protocol==="https:",C=x.startsWith("http://localhost")||x.startsWith("http://127.0.0.1"),B=L&&C;function T(){if(B){S&&(S.style.display="none"),w&&(w.style.display="flex",z&&(z.innerHTML="&#128274;",z.style.color="var(--color-cyan-neon, #00f2fe)"),P&&(P.textContent="Browser Mixed-Content Restriction"),$&&($.innerHTML=`
            <div style="text-align: left; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 14px; margin-top: 4px; font-size: 13px; line-height: 1.6;">
              <p style="margin: 0 0 10px; color: #eee;">
                You are viewing Orbit on <strong>HTTPS</strong> (<code style="color:var(--color-cyan-neon,#00f2fe);">${window.location.host}</code>), but your media server is configured to local <strong>HTTP</strong> (<code style="color:var(--color-cyan-neon,#00f2fe);">${Ii(x.substring(0,x.indexOf("/recordings")+11)||x)}</code>). Browsers block insecure HTTP video requests on HTTPS pages.
              </p>
              <div style="display: flex; flex-direction: column; gap: 8px; color: #ccc; font-size: 12px;">
                <div>&#128640; <strong>Recommended for Local Testing:</strong> Run Orbit locally (<code style="color:var(--color-cyan-neon,#00f2fe);">npm run dev</code> at <code style="color:var(--color-cyan-neon,#00f2fe);">http://localhost:5173</code>). It connects directly to your live MonsterASP backend with no mixed-content restrictions!</div>
                <div>&#127760; <strong>For Online Playback:</strong> Configure an HTTPS tunnel (e.g. ngrok HTTPS URL) in <strong>Admin &rarr; Media Server</strong> settings.</div>
                <div>&#127911; <strong>External Player:</strong> Stream this FLV recording directly in VLC or media player.</div>
              </div>
            </div>
          `));return}try{if(X&&gi.isSupported()){const K=gi.createPlayer({type:"flv",url:x,isLive:!1,cors:!0},{headers:{"ngrok-skip-browser-warning":"true"},enableWorker:!0,lazyLoadMaxDuration:180,seekType:"range"});K.attachMediaElement(y),K.load(),Zt=K,K.on(gi.Events.ERROR,(ce,ue)=>{console.error("[VodPlayer] mpegts error:",ce,ue),S&&(S.style.display="none"),w&&(w.style.display="flex",$&&($.textContent=`FLV playback failed (${ce}: ${ue}). You can open the raw stream in VLC player.`))}),y.addEventListener("canplay",()=>{S&&(S.style.display="none")},{once:!0}),K.play().catch(()=>{})}else S&&(S.style.display="none"),y.src=x,y.load(),y.play().catch(()=>{}),y.addEventListener("error",()=>{w&&(w.style.display="flex",$&&($.textContent=X?"Your browser does not support native FLV playback and mpegts MSE is unavailable. Please play in VLC.":"Video could not be decoded or was blocked by the browser. You can play directly in VLC."))})}catch(K){console.error("[VodPlayer] Initialization error:",K),S&&(S.style.display="none"),w&&(w.style.display="flex",$&&($.textContent=K.message||"Failed to initialize player."))}}T();const Q=d.querySelector("#vod-chat-messages");if(Q)if(!s||s.length===0)Q.innerHTML='<div style="color:var(--color-text-muted,#888);text-align:center;margin-top:40px;">No saved chat messages for this broadcast.</div>';else{let K=-1;y.addEventListener("timeupdate",()=>{const ce=Math.floor(y.currentTime);if(ce===K)return;K=ce;const ue=s.filter(pe=>(pe.streamOffsetSeconds||0)<=ce);if(ue.length===0){Q.innerHTML='<div style="color:var(--color-text-muted,#888);text-align:center;margin-top:40px;">Chat will appear as the broadcast progresses...</div>';return}Q.innerHTML=ue.map(pe=>`
          <div style="display:flex;align-items:flex-start;gap:8px;line-height:1.4;">
            <span style="color:var(--color-cyan-neon,#00f2fe);font-size:11px;opacity:0.7;font-family:monospace;white-space:nowrap;margin-top:1px;">
              ${Wr(pe.streamOffsetSeconds||0)}
            </span>
            <div style="word-break:break-word;">
              <span style="font-weight:600;color:var(--color-text,#fff);margin-right:6px;">${Ii(pe.senderName||"Viewer")}:</span>
              <span style="color:rgba(255,255,255,0.85);">${Ii(pe.content||"")}</span>
            </div>
          </div>
        `).join(""),Q.scrollTop=Q.scrollHeight})}}function Yi(){if(Zt){try{Zt.pause(),Zt.unload(),Zt.detachMediaElement(),Zt.destroy()}catch{}Zt=null}if(Di){const t=Di.querySelector("video");if(t)try{t.pause(),t.src=""}catch{}Di.remove(),Di=null}}function Wr(t){const e=Math.floor(t),a=Math.floor(e/60),s=e%60;return`${a}:${s<10?"0":""}${s}`}function Ii(t){return t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let ai="vods",Ra=null,Ut=null;function Ze(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function Kr(){return`
    <div>
      <!-- Kick/Twitch Style Live Stream Hero (Embedded Player when Channel is Live) -->
      <div id="ch-live-hero-container" style="display:none;margin-bottom:24px;border-radius:16px;overflow:hidden;background:rgba(4,7,18,0.96);border:1px solid rgba(255,59,48,0.4);box-shadow:0 8px 32px rgba(255,59,48,0.22);position:relative;">
        <div id="ch-hero-player-wrapper" style="position:relative;width:100%;aspect-ratio:16/9;max-height:560px;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          <video id="ch-live-video" style="width:100%;height:100%;object-fit:contain;background:#000;" playsinline autoplay muted></video>

          <!-- Top Overlay: Badges and Action Controls -->
          <div style="position:absolute;top:14px;left:14px;right:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:6;pointer-events:none;">
            <div style="display:flex;align-items:center;gap:8px;pointer-events:auto;flex-wrap:wrap;">
              <span class="badge-live" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:5px 12px;box-shadow:0 0 16px rgba(255,59,48,0.7);letter-spacing:0.05em;font-weight:800;">
                <span class="cosmic-beacon" style="width:8px;height:8px;background:#fff;"></span> LIVE NOW
              </span>
              <span id="ch-hero-viewers-badge" style="background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);color:#eee;font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);display:inline-flex;align-items:center;gap:6px;">
                👥 <span id="ch-hero-viewers">1 viewer</span>
              </span>
              <span id="ch-hero-category-badge" style="background:rgba(0,242,254,0.15);color:var(--color-cyan-neon,#00f2fe);border:1px solid rgba(0,242,254,0.35);font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;">
                Gaming
              </span>
            </div>

            <div style="display:flex;align-items:center;gap:10px;pointer-events:auto;">
              <button id="ch-hero-unmute-btn" class="btn btn-sm" style="background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;cursor:pointer;">
                🔊 Unmute
              </button>
              <button id="ch-hero-watch-room-btn" class="btn btn-sm" style="background:linear-gradient(135deg, #00f2fe, #00aebd);color:#040712;font-weight:800;border:none;padding:6px 16px;border-radius:20px;box-shadow:0 0 18px rgba(0,242,254,0.4);cursor:pointer;">
                💬 Watch Room & Chat
              </button>
              <button id="ch-hero-fullscreen-btn" class="btn btn-ghost btn-sm" title="Fullscreen" style="color:#fff;padding:6px 10px;border-radius:8px;">
                ⛶
              </button>
            </div>
          </div>

          <!-- Bottom Stream Title Overlay -->
          <div style="position:absolute;bottom:0;left:0;right:0;padding:28px 20px 14px;background:linear-gradient(180deg, transparent 0%, rgba(4,7,18,0.92) 100%);display:flex;align-items:center;justify-content:space-between;gap:16px;z-index:5;">
            <div>
              <h2 id="ch-hero-title" style="margin:0;font-size:18px;font-weight:800;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.8);">Stream Title</h2>
              <div id="ch-hero-meta" style="font-size:12px;color:var(--color-text-muted,#aaa);margin-top:4px;">Broadcasting live on Orbit</div>
            </div>
          </div>
        </div>
      </div>

      <div class="channel-banner" id="ch-banner"><div class="channel-banner-overlay"></div></div>
      <div class="channel-profile" id="ch-profile">
        <div class="channel-avatar" id="ch-avatar"></div>
        <div class="channel-meta">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <h1 id="ch-name" style="margin:0;">Loading...</h1>
            <span id="ch-live-badge" style="display:none;" class="badge-live" data-channel-live="true"></span>
            <span id="ch-followers" class="badge" style="background:rgba(0,242,254,0.12);color:var(--color-cyan-neon,#00f2fe);border:1px solid rgba(0,242,254,0.25);font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">0 followers</span>
          </div>
          <p class="channel-desc" id="ch-desc" style="margin-top:6px;"></p>
        </div>
        <div class="channel-actions" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button id="ch-watch-live-btn" class="btn btn-sm" style="display:none;gap:6px;font-weight:700;background:linear-gradient(135deg,#e53e3e,#f56565);color:#fff;border:none;box-shadow:0 0 16px rgba(229,62,62,0.4);animation:live-glow 2s ease-in-out infinite alternate;">${N.play} Watch Live</button>
          <button id="ch-follow-btn" class="btn btn-cyan btn-sm">${N.follow} Follow</button>
        </div>
      </div>

      <!-- Social Links -->
      <div id="ch-social" style="display:flex;gap:10px;margin:16px 0;padding-left:124px;flex-wrap:wrap;"></div>

      <!-- Tabs -->
      <div class="tabs" style="margin-top:16px;">
        <button class="tab-btn ${ai==="vods"?"active":""}" data-tab="vods">Saved VODs</button>
        <button class="tab-btn ${ai==="clips"?"active":""}" data-tab="clips">Top Clips</button>
        <button class="tab-btn ${ai==="about"?"active":""}" data-tab="about">About</button>
      </div>

      <div id="ch-tab-content">
        <div class="spinner"></div>
      </div>
    </div>
  `}function Yr(){const t=I.getState().viewParams,e=t==null?void 0:t.channelId;if(e){if(Ut){try{Ut.destroy()}catch{}Ut=null}Jr(e),document.querySelectorAll(".tab-btn").forEach(a=>{a.addEventListener("click",()=>{ai=a.dataset.tab,document.querySelectorAll(".tab-btn").forEach(s=>s.classList.remove("active")),a.classList.add("active"),Ma(e)})})}}async function Jr(t){var e,a,s,d,h,g,f;try{const _=await tt.getById(t);Ra=_;const b=_.name||_.channelName||"Channel",u=document.getElementById("ch-name");u&&(u.innerHTML=`${Ze(b)} ${N.checkCircle}`);const x=document.getElementById("ch-live-badge"),m=document.getElementById("ch-watch-live-btn"),y=document.getElementById("ch-live-hero-container"),S=document.getElementById("ch-avatar");if(_.isLive){x&&(x.style.display="inline-flex",x.innerHTML='<span class="cosmic-beacon" style="width:8px;height:8px;"></span> LIVE',x.style.cssText+="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 12px;animation:live-glow 2s ease-in-out infinite alternate;"),S&&(S.style.border="3px solid #ff3b30",S.style.boxShadow="0 0 18px rgba(255, 59, 48, 0.75)");try{const E=(await wt.getLiveStreams().catch(()=>[])).find(Y=>Y.channelId===parseInt(t));if(E&&y){y.style.display="block";const Y=document.getElementById("ch-hero-title");Y&&(Y.textContent=E.title||`${b}'s Live Broadcast`);const j=document.getElementById("ch-hero-category-badge");j&&(j.textContent=((e=E.category)==null?void 0:e.name)||E.categoryName||"Live Stream");const X=document.getElementById("ch-hero-viewers");if(X){const ce=E.peakViewers||E.viewers||1;X.textContent=`${ce} viewer${ce===1?"":"s"}`}const V=document.getElementById("ch-hero-meta");if(V&&E.startedAt){const ce=Math.max(1,Math.round((Date.now()-new Date(E.startedAt).getTime())/6e4));V.textContent=`Streaming for ${ce} min • ${((a=E.category)==null?void 0:a.name)||"General"}`}const L=document.getElementById("ch-hero-watch-room-btn");L&&(L.onclick=()=>{I.setActiveStream(E),I.navigate("watch",{streamId:E.id})}),m&&(m.style.display="inline-flex",m.onclick=()=>{I.setActiveStream(E),I.navigate("watch",{streamId:E.id})});const C=document.getElementById("ch-live-video"),B=document.getElementById("ch-hero-unmute-btn"),T=document.getElementById("ch-hero-fullscreen-btn"),Q=document.getElementById("ch-hero-player-wrapper");if(B&&C&&(B.onclick=()=>{C.muted=!C.muted,B.textContent=C.muted?"🔊 Unmute":"🔇 Mute"}),T&&Q&&(T.onclick=()=>{document.fullscreenElement?document.exitFullscreen().catch(()=>{}):Q.requestFullscreen().catch(()=>{})}),(((s=E.recordingFileName)==null?void 0:s.includes("youtube.com"))||((d=E.recordingFileName)==null?void 0:d.includes("youtu.be"))||((h=E.hlsUrl)==null?void 0:h.includes("youtube.com"))||((g=E.title)==null?void 0:g.toLowerCase().includes("space"))||((f=E.title)==null?void 0:f.toLowerCase().includes("nasa")))&&Q){C&&(C.style.display="none"),B&&(B.style.display="none"),T&&(T.style.display="none");let ce="live_stream";const ue=(E.recordingFileName||E.hlsUrl||"").match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);ue&&(ce=ue[1]);const pe=document.createElement("iframe");pe.style.cssText="position:absolute;top:-60px;left:0;width:100%;height:calc(100% + 120px);border:none;pointer-events:none;",pe.src=`https://www.youtube-nocookie.com/embed/${ce}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`,pe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",Q.appendChild(pe);const G=document.createElement("div");G.style.cssText="position:absolute;inset:0;z-index:3;cursor:pointer;display:flex;align-items:flex-end;padding:24px;background:linear-gradient(to top, rgba(4,7,18,0.75) 0%, transparent 50%);transition:background 0.2s ease;",G.innerHTML=`
              <div style="display:flex;align-items:center;gap:12px;">
                <button class="btn btn-cyan btn-sm" style="display:inline-flex;align-items:center;gap:8px;font-weight:700;box-shadow:0 0 16px rgba(0,242,254,0.35);">
                  ${N.play} Enter Watch Room & Chat
                </button>
                <span style="font-size:12px;color:rgba(255,255,255,0.8);font-weight:500;">Click anywhere to watch live broadcast</span>
              </div>
            `,G.addEventListener("mouseenter",()=>{G.style.background="linear-gradient(to top, rgba(4,7,18,0.85) 0%, rgba(0,242,254,0.06) 50%, transparent 100%)"}),G.addEventListener("mouseleave",()=>{G.style.background="linear-gradient(to top, rgba(4,7,18,0.75) 0%, transparent 50%)"}),G.addEventListener("click",()=>{I.setActiveStream(E),I.navigate("watch",{streamId:E.id})}),Q.appendChild(G)}else if(C){C.style.display="block";let ce=E.hlsUrl||`${Yt(E.hlsUrl||"")}`;ce.includes(".m3u8")||(ce=`https://localhost:8443/hls/${_.streamKey||E.streamKey}.m3u8`),typeof window<"u"&&window.location.protocol==="https:"&&(ce=ce.replace("http://localhost:8080","https://localhost:8443").replace("http://127.0.0.1:8080","https://localhost:8443"));try{const ue=(await Ea(async()=>{const{default:pe}=await import("./hls-qrK6pUM6.js");return{default:pe}},[],import.meta.url)).default;if(ue.isSupported()){Ut&&Ut.destroy();const pe=new ue({xhrSetup:G=>{G.setRequestHeader("ngrok-skip-browser-warning","true")},enableWorker:!0,lowLatencyMode:!0});Ut=pe,pe.loadSource(ce),pe.attachMedia(C),pe.on(ue.Events.MANIFEST_PARSED,()=>{C.play().catch(()=>{})})}else C.canPlayType("application/vnd.apple.mpegurl")&&(C.src=ce,C.play().catch(()=>{}))}catch(ue){console.warn("[ChannelView] Could not initialize HLS hero player:",ue.message)}}}}catch(F){console.warn("[ChannelView] Could not load active stream for channel:",F.message)}}else if(x&&(x.style.display="none"),m&&(m.style.display="none"),y&&(y.style.display="none"),S&&(S.style.border="",S.style.boxShadow=""),Ut){try{Ut.destroy()}catch{}Ut=null}const w=document.getElementById("ch-desc");w&&(w.textContent=_.description||"");const P=document.getElementById("ch-followers");P&&(P.textContent=`${_.followerCount||0} followers`);const $=document.getElementById("ch-banner");_.coverPhotoUrl&&$&&($.style.background=`url(${_.coverPhotoUrl}) center/cover`),S&&(S.innerHTML=_.profilePhotoUrl?`<img src="${_.profilePhotoUrl}" alt="${Ze(b)}" />`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#000;background:linear-gradient(135deg,#00AEBD,#00DDEE);">${Ze(b)[0].toUpperCase()}</div>`);const z=document.getElementById("ch-follow-btn");if(z){const F=I.isFollowing(t);z.className=`btn btn-sm follow-btn ${F?"following":"not-following"}`,z.innerHTML=F?`${N.followFilled} Following`:`${N.follow} Follow`,z.onclick=async()=>{z.disabled=!0;const E=await I.toggleFollow(t,b);z.className=`btn btn-sm follow-btn ${E?"following":"not-following"}`,z.innerHTML=E?`${N.followFilled} Following`:`${N.follow} Follow`;const Y=E?1:-1;_.followerCount=Math.max(0,(_.followerCount||0)+Y),P&&(P.textContent=`${_.followerCount} followers`),I.showToast(E?`Following ${b}!`:`Unfollowed ${b}`,"info"),z.disabled=!1}}const D=document.getElementById("ch-social");if(D){const F=Array.isArray(_.socialLinks)?_.socialLinks:[];F.length>0?D.innerHTML=F.map(E=>`
          <a href="${Ze(E.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" style="gap:6px;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 12px;font-size:12px;">
            ${N.link} <span style="text-transform:capitalize;">${Ze(E.platform)}</span>
          </a>
        `).join(""):D.innerHTML=""}Ma(t)}catch{I.showToast("Failed to load channel","error")}}async function Ma(t){const e=document.getElementById("ch-tab-content");if(e){if(e.innerHTML='<div class="spinner"></div>',ai==="vods")try{const a=await An.getChannelVods(t);if(!a||!a.length){e.innerHTML=`
          <div class="empty-state">
            <div class="empty-icon">&#128249;</div>
            <h3>No Saved VODs</h3>
            <p>This channel has no saved broadcasts yet.</p>
          </div>`;return}e.innerHTML=`<div class="streams-grid">${a.map(s=>`
        <div class="card vod-card hover-lift" data-vod-id="${s.id||s.streamId}">
          <div class="vod-thumb">
            <img src="${ht}" data-thumb-src="${s.thumbnailUrl||""}" alt="${Ze(s.title||"VOD")}" />
            <span class="vod-duration">${s.duration||""}</span>
          </div>
          <div class="vod-info">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
              <div class="vod-title" style="margin:0;">${Ze(s.title||"Untitled VOD")}</div>
              ${s.categoryName?`<span class="badge-category" style="font-size:10px;padding:1px 6px;">${Ze(s.categoryName)}</span>`:""}
            </div>
            <div class="vod-meta" style="display:flex;gap:10px;align-items:center;">
              <span>${s.rewatchCount||0} views</span>
              <span>&bull;</span>
              <span>${s.chatMessageCount||0} messages</span>
            </div>
          </div>
        </div>
      `).join("")}</div>`,Et(e),e.querySelectorAll(".vod-card").forEach(s=>{s.addEventListener("click",()=>{const d=parseInt(s.dataset.vodId),h=a.find(g=>g.id===d||g.streamId===d);h&&Vn(h)})})}catch{e.innerHTML='<p class="text-muted text-center">Failed to load VODs</p>'}else if(ai==="clips")try{const a=await Ft.getChannelClips(t);if(!a||!a.length){e.innerHTML=`
          <div class="empty-state">
            <div class="empty-icon">&#127916;</div>
            <h3>No Clips Yet</h3>
            <p>No clips have been created for this channel.</p>
          </div>`;return}e.innerHTML=`<div class="clips-grid">${a.map(s=>`
        <div class="card clip-card hover-lift" data-clip-id="${s.id}">
          <div class="clip-thumb">
            <img src="${ht}" data-thumb-src="${s.thumbnailUrl||""}" alt="${Ze(s.title||"Clip")}" />
            <span class="clip-views">${N.eye} ${s.viewCount||0}</span>
          </div>
          <div class="clip-info">
            <div class="clip-title">${Ze(s.title||"Untitled")}</div>
            <div class="clip-meta">by ${Ze(s.creatorName||s.creatorUsername||"Unknown")}</div>
          </div>
        </div>
      `).join("")}</div><div id="clip-modal-root"></div>`,Et(e),e.querySelectorAll(".clip-card").forEach(s=>{s.addEventListener("click",()=>{const d=parseInt(s.dataset.clipId),h=a.find(g=>g.id===d);h&&zi(h)})})}catch{e.innerHTML='<p class="text-muted text-center">Failed to load clips</p>'}else if(ai==="about"){const a=Ra||{},s=Array.isArray(a.socialLinks)?a.socialLinks:[];e.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:20px;max-width:900px;">
        <!-- Bio Card -->
        <div class="card" style="padding:24px;border-radius:16px;">
          <h3 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#fff;">About ${Ze(a.channelName||a.name||"Channel")}</h3>
          <p style="margin:0;color:var(--color-text-muted,#888);line-height:1.6;font-size:14px;white-space:pre-line;">
            ${Ze(a.description||"This channel has not added a description yet.")}
          </p>
          <div style="display:flex;gap:24px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;">
            <div>
              <div style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted,#888);font-weight:700;letter-spacing:0.05em;">Followers</div>
              <div style="font-size:18px;font-weight:700;color:#fff;margin-top:2px;">${a.followerCount||0}</div>
            </div>
            <div>
              <div style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted,#888);font-weight:700;letter-spacing:0.05em;">Joined</div>
              <div style="font-size:18px;font-weight:700;color:#fff;margin-top:2px;">${a.createdAt?new Date(a.createdAt).toLocaleDateString(void 0,{year:"numeric",month:"short"}):"Recent"}</div>
            </div>
            <div>
              <div style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted,#888);font-weight:700;letter-spacing:0.05em;">VOD Archives</div>
              <div style="font-size:18px;font-weight:700;color:${a.saveStreams?"var(--color-cyan-neon,#00f2fe)":"var(--color-text-muted,#888)"};margin-top:2px;">
                ${a.saveStreams?"Enabled":"Disabled"}
              </div>
            </div>
          </div>
        </div>

        <!-- Donation Section -->
        <div class="card" style="padding:24px;background:linear-gradient(135deg,rgba(16,22,42,0.9),rgba(10,14,28,0.9));border:1px solid rgba(0,242,254,0.25);border-radius:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
            <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:260px;">
              <div style="width:48px;height:48px;border-radius:14px;background:rgba(0,242,254,0.15);display:flex;align-items:center;justify-content:center;color:var(--color-cyan-neon,#00f2fe);font-size:24px;flex-shrink:0;">
                &#128176;
              </div>
              <div>
                <h3 style="margin:0;font-size:17px;font-weight:700;color:#fff;">Support & Donations</h3>
                <p style="margin:4px 0 0;font-size:13px;color:var(--color-text-muted,#888);line-height:1.4;">
                  ${Ze(a.donationMessage||"Support the streamer and help keep the stream going!")}
                </p>
              </div>
            </div>
            ${a.donationUrl?`
              <a href="${Ze(a.donationUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-cyan" style="gap:8px;font-weight:700;padding:10px 22px;border-radius:10px;">
                ${N.play} Tip / Donate
              </a>
            `:`
              <span style="font-size:13px;color:var(--color-text-muted);font-style:italic;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px;">No donation link configured</span>
            `}
          </div>
        </div>

        <!-- Social Media Links -->
        ${s.length>0?`
          <div class="card" style="padding:24px;border-radius:16px;">
            <h3 style="margin:0 0 16px;font-size:17px;font-weight:700;color:#fff;">Social Links</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              ${s.map(d=>`
                <a href="${Ze(d.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="gap:8px;padding:8px 16px;border-radius:10px;text-transform:capitalize;">
                  ${N.link} ${Ze(d.platform)}
                </a>
              `).join("")}
            </div>
          </div>
        `:""}
      </div>
    `}}}const St={getSummary:()=>re("/api/Dashboard/summary"),getLiveManager:()=>re("/api/Dashboard/live-manager"),updateStreamMeta:t=>re("/api/Dashboard/stream/current",{method:"PATCH",body:JSON.stringify(t)}),endStream:()=>re("/api/Dashboard/stream/end",{method:"POST"}),getPastStreams:(t=1,e=10)=>re(`/api/Dashboard/streams?page=${t}&pageSize=${e}`),deleteVod:t=>re(`/api/Dashboard/vods/${t}`,{method:"DELETE"}),getModeration:()=>re("/api/Dashboard/moderation"),setEmojis:t=>re("/api/Dashboard/emojis/custom",{method:"PUT",body:JSON.stringify(t)}),getEmojis:()=>re("/api/Dashboard/emojis/custom"),getBadges:()=>re("/api/Dashboard/emojis/badges")};function rn(t,e={},a){const s=document.body,d=document.createElement("div");d.className="modal-overlay",d.style.zIndex="9999";const h=e.aspectRatio||"1:1",g=e.title||"Customize & Crop Image";d.innerHTML=`
    <div class="modal-content" style="max-width:680px;width:95%;padding:24px;border-radius:20px;background:var(--color-space-panel,#121626);border:1px solid rgba(0,242,254,0.25);box-shadow:0 12px 40px rgba(0,0,0,0.7);display:flex;flex-direction:column;max-height:92vh;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;">
          ${N.image} ${g}
        </h3>
        <button id="cropper-close-btn" style="background:none;border:none;color:#aaa;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
      </div>

      <!-- Canvas Viewport -->
      <div style="position:relative;width:100%;height:340px;background:#05070d;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.08);cursor:grab;" id="cropper-viewport">
        <canvas id="cropper-canvas" style="display:block;"></canvas>
        <div id="cropper-frame" style="position:absolute;pointer-events:none;border:2px dashed var(--color-cyan-neon,#00f2fe);box-shadow:0 0 0 9999px rgba(0,0,0,0.6);border-radius:8px;transition:all 0.15s ease;"></div>
      </div>

      <!-- Controls Panel -->
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px;overflow-y:auto;padding:4px;">
        <!-- Aspect Ratio presets -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:600;color:var(--color-text-muted);">Aspect Ratio:</span>
          <div style="display:flex;gap:6px;" id="aspect-buttons">
            <button class="btn btn-sm ${h==="1:1"?"btn-cyan":"btn-ghost"}" data-aspect="1:1" style="padding:4px 10px;font-size:12px;">1:1 Square</button>
            <button class="btn btn-sm ${h==="4:1"?"btn-cyan":"btn-ghost"}" data-aspect="4:1" style="padding:4px 10px;font-size:12px;">4:1 Banner</button>
            <button class="btn btn-sm ${h==="16:9"?"btn-cyan":"btn-ghost"}" data-aspect="16:9" style="padding:4px 10px;font-size:12px;">16:9 Wide</button>
            <button class="btn btn-sm ${h==="free"?"btn-cyan":"btn-ghost"}" data-aspect="free" style="padding:4px 10px;font-size:12px;">Free</button>
          </div>
        </div>

        <!-- Zoom / Scale Slider -->
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;font-weight:600;color:var(--color-text-muted);min-width:60px;">Scale:</span>
          <button id="zoom-out-btn" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:14px;">-</button>
          <input type="range" id="zoom-slider" min="0.5" max="3" step="0.05" value="1" style="flex:1;accent-color:var(--color-cyan-neon);" />
          <button id="zoom-in-btn" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:14px;">+</button>
          <span id="zoom-val" style="font-size:12px;color:#fff;min-width:40px;text-align:right;">100%</span>
        </div>

        <!-- Rotate Slider & Actions -->
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;font-weight:600;color:var(--color-text-muted);min-width:60px;">Rotate:</span>
          <button id="rotate-left-btn" class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:12px;" title="Rotate 90° Left">↺ 90°</button>
          <input type="range" id="rotate-slider" min="-180" max="180" step="1" value="0" style="flex:1;accent-color:var(--color-cyan-neon);" />
          <button id="rotate-right-btn" class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:12px;" title="Rotate 90° Right">↻ 90°</button>
          <span id="rotate-val" style="font-size:12px;color:#fff;min-width:40px;text-align:right;">0°</span>
        </div>
      </div>

      <!-- Action Footer -->
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">
        <button id="cropper-cancel-btn" class="btn btn-ghost btn-sm" style="padding:8px 18px;">Cancel</button>
        <button id="cropper-save-btn" class="btn btn-cyan btn-sm" style="padding:8px 24px;font-weight:700;">
          Apply &amp; Upload
        </button>
      </div>
    </div>
  `,s.appendChild(d);const f=d.querySelector("#cropper-canvas"),_=d.querySelector("#cropper-viewport"),b=d.querySelector("#cropper-frame"),u=f.getContext("2d");let x=new Image,m=1,y=0,S=0,w=0,P=!1,$=0,z=0,D=h;const F=()=>d.remove();d.querySelector("#cropper-close-btn").addEventListener("click",F),d.querySelector("#cropper-cancel-btn").addEventListener("click",F);const E=new FileReader;E.onload=T=>{x.onload=()=>{j(),X()},x.src=T.target.result},E.readAsDataURL(t);function Y(){const T=_.clientWidth||600,Q=_.clientHeight||340;let K=T*.8,ce=Q*.8;if(D==="1:1"){const ue=Math.min(K,ce);return{width:ue,height:ue}}else if(D==="4:1"){const ue=Math.min(K,Q*.9*4);return{width:ue,height:ue/4}}else if(D==="16:9"){const ue=Math.min(K,Q*.85*1.7777777777777777);return{width:ue,height:ue/(16/9)}}else return{width:K,height:ce}}function j(){const T=_.clientWidth||600,Q=_.clientHeight||340;f.width=T,f.height=Q;const K=Y();b.style.width=`${K.width}px`,b.style.height=`${K.height}px`,b.style.left=`${(T-K.width)/2}px`,b.style.top=`${(Q-K.height)/2}px`;const ce=Math.max(K.width/x.width,K.height/x.height);m=Math.max(ce,.5),d.querySelector("#zoom-slider").value=m,d.querySelector("#zoom-val").textContent=`${Math.round(m*100)}%`,S=0,w=0}function X(){if(!x.complete||!x.naturalWidth)return;const T=f.width,Q=f.height;u.clearRect(0,0,T,Q),u.save(),u.translate(T/2+S,Q/2+w),u.rotate(y*Math.PI/180),u.scale(m,m),u.drawImage(x,-x.width/2,-x.height/2),u.restore()}_.addEventListener("mousedown",T=>{P=!0,$=T.clientX-S,z=T.clientY-w,_.style.cursor="grabbing"}),window.addEventListener("mousemove",T=>{P&&(S=T.clientX-$,w=T.clientY-z,X())}),window.addEventListener("mouseup",()=>{P&&(P=!1,_.style.cursor="grab")}),_.addEventListener("touchstart",T=>{T.touches.length===1&&(P=!0,$=T.touches[0].clientX-S,z=T.touches[0].clientY-w)}),window.addEventListener("touchmove",T=>{P&&T.touches.length===1&&(S=T.touches[0].clientX-$,w=T.touches[0].clientY-z,X())}),window.addEventListener("touchend",()=>{P=!1});const V=d.querySelector("#zoom-slider"),L=d.querySelector("#zoom-val");V.addEventListener("input",()=>{m=parseFloat(V.value),L.textContent=`${Math.round(m*100)}%`,X()}),d.querySelector("#zoom-in-btn").addEventListener("click",()=>{m=Math.min(3,m+.15),V.value=m,L.textContent=`${Math.round(m*100)}%`,X()}),d.querySelector("#zoom-out-btn").addEventListener("click",()=>{m=Math.max(.5,m-.15),V.value=m,L.textContent=`${Math.round(m*100)}%`,X()});const C=d.querySelector("#rotate-slider"),B=d.querySelector("#rotate-val");C.addEventListener("input",()=>{y=parseInt(C.value),B.textContent=`${y}°`,X()}),d.querySelector("#rotate-left-btn").addEventListener("click",()=>{y=(y-90)%360,y<-180&&(y+=360),C.value=y,B.textContent=`${y}°`,X()}),d.querySelector("#rotate-right-btn").addEventListener("click",()=>{y=(y+90)%360,y>180&&(y-=360),C.value=y,B.textContent=`${y}°`,X()}),d.querySelectorAll("#aspect-buttons button").forEach(T=>{T.addEventListener("click",()=>{D=T.dataset.aspect,d.querySelectorAll("#aspect-buttons button").forEach(Q=>{Q.className=`btn btn-sm ${Q.dataset.aspect===D?"btn-cyan":"btn-ghost"}`}),j(),X()})}),d.querySelector("#cropper-save-btn").addEventListener("click",()=>{const T=Y(),Q=f.width,K=f.height,ce=(Q-T.width)/2,ue=(K-T.height)/2,pe=document.createElement("canvas");pe.width=T.width,pe.height=T.height,pe.getContext("2d").drawImage(f,ce,ue,T.width,T.height,0,0,T.width,T.height),pe.toBlob(te=>{if(!te){F();return}const ye=new File([te],t.name||"custom_image.jpg",{type:"image/jpeg",lastModified:Date.now()});F(),typeof a=="function"&&a(ye)},"image/jpeg",.92)})}let xt="overview",$t="profile",pt=null,vi=!1,Tn=!1,Fn=[],Xt=null;function ze(t){return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function Xr(t){if(!t)return null;if(t instanceof Date)return t;let e=String(t).trim();if(!e)return null;if(e.includes("T")){const d=e.split("T")[1];!d.includes("Z")&&!d.includes("+")&&!d.includes("-")&&(e=`${e}Z`)}else!e.includes("Z")&&!e.includes("+")&&(e=`${e}Z`);const a=new Date(e);return isNaN(a.getTime())?null:a}function Qr(){return I.getState().currentUser?`
    <div>
      <!-- Header (Admin-Synced Layout) -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h1 style="font-family:var(--font-display);font-size:26px;color:#fff;margin:0;">
              ${N.video} Cosmic Creator Studio
            </h1>
            <span class="badge-role streamer">CREATOR STUDIO</span>
          </div>
          <p style="color:var(--color-text-muted);font-size:14px;margin-top:4px;">
            Live stream management, broadcast analytics, channel branding, and custom emote studio.
          </p>
        </div>
        <button id="studio-refresh-all" class="btn btn-ghost btn-sm">${N.refresh} Refresh Studio</button>
      </div>

      <!-- Navigation Tabs (Horizontal Admin Sync) -->
      <div class="tabs">
        <button class="tab-btn ${xt==="overview"?"active":""}" data-studio-tab="overview">${N.grid} Overview</button>
        <button class="tab-btn ${xt==="broadcast"?"active":""}" data-studio-tab="broadcast"><span style="color:var(--color-live-red);">&#9679;</span> Stream Manager</button>
        <button class="tab-btn ${xt==="channel"?"active":""}" data-studio-tab="channel">${N.user} Channel Setup</button>
        <button class="tab-btn ${xt==="analytics"?"active":""}" data-studio-tab="analytics">${N.chart} Analytics &amp; Insights</button>
        <button class="tab-btn ${xt==="vods"?"active":""}" data-studio-tab="vods">${N.video} Broadcast Archive</button>
        <button class="tab-btn ${xt==="moderation"?"active":""}" data-studio-tab="moderation">${N.shield} Moderation</button>
        <button class="tab-btn ${xt==="emotes"?"active":""}" data-studio-tab="emotes">${N.emoji} Emotes &amp; Badges</button>
      </div>

      <!-- Active Tab Container -->
      <div id="studio-tab-body">
        <div class="spinner"></div>
      </div>
    </div>
  `:`
      <div class="empty-state" style="padding:80px 20px;">
        <div class="empty-icon">&#128274;</div>
        <h2 style="color:var(--color-error);font-family:var(--font-display);">Authentication Required</h2>
        <p style="color:var(--color-text-muted);max-width:440px;margin:12px auto;">
          Please log in to your account to access Creator Studio, broadcast live, and manage channel assets.
        </p>
        <button id="studio-login-btn" class="btn btn-cyan btn-sm" style="margin-top:16px;">Log in</button>
      </div>
    `}function Zr(){var t,e;(t=document.getElementById("studio-login-btn"))==null||t.addEventListener("click",()=>I.navigate("login")),(e=document.getElementById("studio-refresh-all"))==null||e.addEventListener("click",()=>ha()),document.querySelectorAll("[data-studio-tab]").forEach(a=>{a.addEventListener("click",()=>{xt=a.dataset.studioTab,document.querySelectorAll("[data-studio-tab]").forEach(s=>s.classList.remove("active")),a.classList.add("active"),Vi()})}),ha()}async function ha(){var t;Tn=!1;try{const[e,a]=await Promise.allSettled([tt.getMyChannel(),_t.getAll()]);e.status==="fulfilled"?(pt=e.value,vi=!!pt):(((t=e.reason)==null?void 0:t.status)===401&&(Tn=!0),vi=!1),a.status==="fulfilled"&&Array.isArray(a.value)&&(Fn=a.value)}catch{vi=!1}Vi()}async function Vi(){var e,a;const t=document.getElementById("studio-tab-body");if(t){if(Tn){t.innerHTML=`
      <div class="empty-state" style="max-width:500px;margin:40px auto;">
        <div class="empty-icon">&#128274;</div>
        <h3>Session Expired</h3>
        <p>Your session has expired. Please log in again to access Creator Studio.</p>
        <button id="ws-relogin-btn" class="btn btn-cyan btn-sm">Log In</button>
      </div>`,(e=document.getElementById("ws-relogin-btn"))==null||e.addEventListener("click",()=>I.navigate("login"));return}if(!vi&&xt!=="channel"){t.innerHTML=`
      <div class="empty-state" style="max-width:500px;margin:40px auto;">
        <div class="empty-icon">&#128225;</div>
        <h3>Create Your Channel First</h3>
        <p>You need a channel before you can stream. Set up your channel identity to unlock broadcasting with OBS.</p>
        <button id="ws-create-ch" class="btn btn-cyan btn-sm">Create Channel</button>
      </div>`,(a=document.getElementById("ws-create-ch"))==null||a.addEventListener("click",()=>{xt="channel",document.querySelectorAll("[data-studio-tab]").forEach(s=>{s.classList.remove("active"),s.dataset.studioTab==="channel"&&s.classList.add("active")}),Vi()});return}switch(xt){case"overview":await es(t);break;case"broadcast":await ts(t);break;case"channel":is(t);break;case"analytics":await ns(t);break;case"vods":await Ba(t);break;case"moderation":await as(t);break;case"emotes":await rs(t);break;default:t.innerHTML="<p>Select a tab</p>"}}}async function es(t){var e,a,s,d;t.innerHTML='<div class="spinner"></div>';try{const h=await St.getSummary(),g=h.channelProfile||pt||{},f=h.lifetimeStats||{},_=h.liveManager;t.innerHTML=`
      ${_&&_.isLive?`
        <div class="card" style="padding:20px;margin-bottom:24px;border-color:var(--color-live-red);background:rgba(255,0,85,0.04);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <span class="badge-live" style="font-size:14px;padding:4px 14px;">LIVE NOW</span>
            <div>
              <div style="font-size:16px;font-weight:700;color:#fff;">${ze(_.title||"Broadcasting Live")}</div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">
                ${_.currentViewerCount||0} viewers &bull; Uptime: ${_.formattedUptime||"00:00"} &bull; ${ze(_.categoryName||"General")}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="ov-watch-btn" class="btn btn-outline btn-sm">${N.eye} Watch Room</button>
            <button id="ov-manage-btn" class="btn btn-cyan btn-sm">${N.video} Stream Manager</button>
          </div>
        </div>
      `:""}

      <!-- Lifetime Numerical KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:28px;">
        <div class="stat-card animate-stat-in">
          <div class="stat-label">Total Streams</div>
          <div class="stat-value">${f.totalStreams||0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Completed broadcasts</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.05s;">
          <div class="stat-label">All-Time Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-live-red);">${f.allTimePeakViewers||0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Highest concurrent audience</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.1s;">
          <div class="stat-label">Average Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-cyan-primary);">${f.averagePeakViewers?f.averagePeakViewers.toFixed(1):0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Per stream session average</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.15s;">
          <div class="stat-label">Total Broadcast Time</div>
          <div class="stat-value">${f.totalBroadcastHours||"0h"}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Avg duration: ${f.averageStreamDurationFormatted||"0m"}</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.2s;">
          <div class="stat-label">Total Chat Messages</div>
          <div class="stat-value" style="color:var(--color-cyan-neon);">${f.totalChatMessages||0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${f.uniqueChattersCount||0} unique chatters</div>
        </div>
        <div class="stat-card animate-stat-in" style="animation-delay:0.25s;">
          <div class="stat-label">Total Clips Created</div>
          <div class="stat-value">${f.totalClipsCount||0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${f.totalClipViews||0} total clip views</div>
        </div>
      </div>

      <!-- Quick Chart & Channel Info Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:20px;">
        <div class="chart-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h4 style="margin:0;font-size:14px;color:#fff;">Viewer Activity (Recent Streams)</h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">Peak: ${f.allTimePeakViewers||0}</span>
          </div>
          <div class="mini-chart" style="height:130px;align-items:flex-end;gap:8px;padding:16px 0;">
            ${ss(8,f.allTimePeakViewers||50)}
          </div>
        </div>

        <div class="card" style="padding:22px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--color-cyan-primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Channel Identity</div>
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:#000;overflow:hidden;flex-shrink:0;">
                ${g.profilePhotoUrl?`<img src="${g.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(g.name||g.channelName||"C")[0].toUpperCase()}
              </div>
              <div>
                <div style="font-weight:700;font-size:16px;color:#fff;">${ze(g.name||g.channelName||"Your Channel")}</div>
                <div style="font-size:13px;color:var(--color-text-muted);margin-top:2px;">${ze(g.description||"No description added yet.")}</div>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:20px;">
            <button id="ov-setup-btn" class="btn btn-outline btn-sm" style="flex:1;">Channel Branding</button>
            <button id="ov-emotes-btn" class="btn btn-ghost btn-sm" style="flex:1;">Emotes Studio</button>
          </div>
        </div>
      </div>
    `,(e=document.getElementById("ov-watch-btn"))==null||e.addEventListener("click",()=>{_!=null&&_.streamId&&I.navigate("watch",{streamId:_.streamId})}),(a=document.getElementById("ov-manage-btn"))==null||a.addEventListener("click",()=>{bn("broadcast")}),(s=document.getElementById("ov-setup-btn"))==null||s.addEventListener("click",()=>{bn("channel")}),(d=document.getElementById("ov-emotes-btn"))==null||d.addEventListener("click",()=>{bn("emotes")})}catch{t.innerHTML='<div class="empty-state"><h3>Failed to load dashboard overview</h3></div>'}}async function ts(t){var a,s,d,h,g;t.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">Stream Manager</h2>
        <p style="color:var(--color-text-muted);margin:0;font-size:14px;">Configure OBS Studio, pick stream categories, and broadcast live to Orbit viewers.</p>
      </div>
      <div id="streaming-server-status" style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--color-text-muted);">
        <span style="width:8px;height:8px;border-radius:50%;background:#888;"></span> Checking Streaming Server...
      </div>
    </div>

    <!-- Active Live Stream Manager & Metadata Editor Container -->
    <div id="live-manager-section" style="margin-bottom:24px;"></div>

    <!-- OBS Settings & Ingest Card Grid -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:20px;margin-bottom:24px;">
      <!-- Stream Connection Info -->
      <div class="card" style="padding:24px;border-color:rgba(0,242,254,0.25);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="color:var(--color-cyan-neon);font-size:18px;">${N.live}</span>
          <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--color-text);">OBS Connection Settings</h4>
        </div>

        <!-- RTMP Server URL -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">
            RTMP SERVER (OBS "Server" field)
          </label>
          <div style="display:flex;gap:8px;">
            <input class="input-dark" id="rtmp-url-display" type="text" value="rtmp://localhost/live" readonly style="flex:1;font-family:monospace;font-size:13px;color:var(--color-cyan-neon);background:rgba(0,0,0,0.4);" />
            <button id="copy-rtmp" class="btn btn-ghost btn-sm" title="Copy RTMP URL" style="border:1px solid rgba(255,255,255,0.1);">${N.copy}</button>
          </div>
          <span style="display:block;font-size:11px;color:var(--color-text-muted);margin-top:4px;">
            In OBS: <b>Settings &rarr; Stream &rarr; Service: Custom...</b> &bull; Paste this URL
          </span>
        </div>

        <!-- Stream Key -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">
            STREAM KEY (OBS "Stream Key" field)
          </label>
          <div style="display:flex;gap:8px;">
            <input class="input-dark" id="stream-key-display" type="password" value="Loading..." readonly style="flex:1;font-family:monospace;font-size:13px;background:rgba(0,0,0,0.4);" />
            <button id="toggle-key" class="btn btn-ghost btn-sm" title="Show/Hide Key" style="border:1px solid rgba(255,255,255,0.1);">${N.eyeClosed}</button>
            <button id="copy-key" class="btn btn-ghost btn-sm" title="Copy Stream Key" style="border:1px solid rgba(255,255,255,0.1);">${N.copy}</button>
          </div>
        </div>

        <button id="gen-key" class="btn btn-outline btn-sm btn-full" style="gap:8px;">
          ${N.refresh} Generate New Key
        </button>
      </div>

      <!-- Go Live Stream Metadata with Category Selection -->
      <div class="card" style="padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="color:var(--color-live-red);font-size:18px;">${N.video}</span>
          <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--color-text);">New Stream Session</h4>
        </div>
        <form id="go-live-form">
          <div class="form-group" style="margin-bottom:12px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">STREAM TITLE</label>
            <input class="input-dark" id="go-title" placeholder="e.g. Late Night Cosmic Gaming &amp; Q&amp;A" required style="margin-top:4px;" />
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">STREAM CATEGORY</label>
            <select class="input-dark" id="go-category" style="margin-top:4px;">
              <option value="">Select Category (Optional)</option>
              ${Fn.map(f=>`<option value="${f.id}">${ze(f.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:16px;">
            <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">DESCRIPTION (OPTIONAL)</label>
            <input class="input-dark" id="go-desc" placeholder="What's this stream about?" style="margin-top:4px;" />
          </div>
          <button type="submit" class="btn btn-cyan btn-full" id="go-live-btn" style="padding:10px 16px;font-weight:700;">
            ${N.rocket} Create Stream Session
          </button>
        </form>
      </div>
    </div>

    <!-- Quick OBS Setup Guide Card -->
    <div class="card" style="padding:20px 24px;margin-bottom:24px;background:rgba(18,20,32,0.6);border:1px dashed rgba(0,242,254,0.3);">
      <h4 style="margin:0 0 12px 0;font-size:14px;color:var(--color-cyan-neon);display:flex;align-items:center;gap:8px;">
        ${N.settings} How to Broadcast with OBS Studio
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;font-size:13px;color:var(--color-text-muted);">
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">1. Copy your Stream Key</strong>
          Click the copy button next to your <b>Stream Key</b> above.
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">2. Paste into OBS Settings</strong>
          In OBS: <b>Settings &rarr; Stream &rarr; Service: Custom...</b><br>
          Server: <code style="color:var(--color-cyan-neon);">rtmp://localhost/live</code>
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:12px 14px;border-radius:8px;border-left:3px solid var(--color-cyan-neon);">
          <strong style="color:var(--color-text);display:block;margin-bottom:4px;">3. Start Streaming</strong>
          Hit <b>Start Streaming</b> in OBS to go live immediately!
        </div>
      </div>
    </div>
  `;const e=document.getElementById("streaming-server-status");if(e)try{const _=typeof window<"u"&&window.location.protocol==="https:"?"https://localhost:8443/health":"http://localhost:8080/health";if((await fetch(_,{method:"GET",mode:"cors"})).ok)e.innerHTML=`
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
          <span style="color:#10b981;">Streaming Server ONLINE</span>
        `,e.style.borderColor="rgba(16,185,129,0.3)",e.style.background="rgba(16,185,129,0.08)";else throw new Error("Server non-200")}catch{e.innerHTML=`
        <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></span>
        <span style="color:#f59e0b;">Streaming Server OFFLINE (run start-server.bat)</span>
      `,e.style.borderColor="rgba(245,158,11,0.3)",e.style.background="rgba(245,158,11,0.08)"}(a=document.getElementById("copy-rtmp"))==null||a.addEventListener("click",()=>{const f=document.getElementById("rtmp-url-display");f&&(navigator.clipboard.writeText(f.value),I.showToast("RTMP URL copied! Paste into OBS Server field.","success"))});try{const f=await wt.getStreamKey(),_=document.getElementById("stream-key-display");if(_&&f&&(_.value=f.streamKey||f.key||"No key generated",f.rtmpUrl)){const b=document.getElementById("rtmp-url-display");b&&(b.value=f.rtmpUrl)}}catch{const _=document.getElementById("stream-key-display");_&&(_.value="No key yet")}(s=document.getElementById("toggle-key"))==null||s.addEventListener("click",()=>{const f=document.getElementById("stream-key-display"),_=document.getElementById("toggle-key");if(f){const b=f.type==="password";f.type=b?"text":"password",_&&(_.innerHTML=b?N.eye:N.eyeClosed)}}),(d=document.getElementById("copy-key"))==null||d.addEventListener("click",()=>{const f=document.getElementById("stream-key-display");f&&(navigator.clipboard.writeText(f.value),I.showToast("Stream key copied! Keep it secret.","success"))}),(h=document.getElementById("gen-key"))==null||h.addEventListener("click",async()=>{try{const f=await wt.generateStreamKey(),_=document.getElementById("stream-key-display");if(_&&(_.value=f.streamKey||f.key||""),f.rtmpUrl){const b=document.getElementById("rtmp-url-display");b&&(b.value=f.rtmpUrl)}I.showToast("New stream key generated!","success")}catch(f){I.showToast(f.message,"error")}}),(g=document.getElementById("go-live-form"))==null||g.addEventListener("submit",async f=>{var b,u,x;f.preventDefault();const _=document.getElementById("go-live-btn");_.disabled=!0;try{const m=(b=document.getElementById("go-title"))==null?void 0:b.value,y=(u=document.getElementById("go-desc"))==null?void 0:u.value,S=(x=document.getElementById("go-category"))==null?void 0:x.value,w=S?parseInt(S):null;await wt.createStream({title:m,description:y,categoryId:w}),I.showToast('Stream session ready! Click "Start Streaming" in OBS.',"success"),sn()}catch(m){I.showToast(m.message,"error")}_.disabled=!1}),sn()}async function sn(){var e,a,s;const t=document.getElementById("live-manager-section");if(t)try{const d=await St.getLiveManager();if(!d){t.innerHTML=`
        <div class="card" style="padding:24px;text-align:center;color:var(--color-text-muted);">
          <div style="font-size:28px;margin-bottom:8px;">&#128225;</div>
          <div style="font-weight:600;color:#fff;font-size:15px;margin-bottom:4px;">You are currently offline</div>
          <div style="font-size:13px;">Create a new stream session below and start streaming in OBS to go live.</div>
        </div>
      `;return}const h=d.isLive,g=h?'<span class="badge-live" style="font-size:14px;padding:4px 14px;">LIVE</span>':'<span style="font-size:12px;padding:4px 12px;border-radius:12px;background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700;border:1px solid rgba(245,158,11,0.4);">READY (WAITING FOR OBS)</span>',f=h?`${N.x} End Stream`:`${N.x} Cancel Session`,_=h?"var(--color-live-red)":"rgba(245,158,11,0.4)",b=h?"Broadcasting live to viewers":'Stream session ready &bull; Click "Start Streaming" in OBS to go live';if(t.innerHTML=`
      <div class="card" style="padding:24px;border-color:${_};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            ${g}
            <div>
              <h3 style="font-size:18px;margin:0 0 2px 0;color:#fff;" id="active-live-title">${ze(d.title||"Broadcasting")}</h3>
              <div style="font-size:12px;color:var(--color-text-muted);" id="active-live-meta">
                ${b} &bull; Category: <strong style="color:var(--color-cyan-primary);">${ze(d.categoryName||"General")}</strong>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            ${h?`<button id="studio-view-live-btn" class="btn btn-outline btn-sm">${N.eye} Open Watch Room</button>`:""}
            <button id="end-stream-btn" class="btn btn-danger btn-sm">${f}</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px;margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-label">Viewers</div>
            <div class="stat-value">${d.currentViewerCount||d.viewerCount||0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Duration</div>
            <div class="stat-value" id="live-stream-duration">${h?d.formattedUptime||d.duration||"0:00":"00:00"}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="font-size:16px;color:${h?"#10b981":"#f59e0b"};">
              ${h?"Active":"Pending OBS"}
            </div>
          </div>
        </div>

        <!-- Live Stream Metadata Editor (Real-Time Edit While Streaming) -->
        <div style="background:rgba(0,242,254,0.03);border:1px solid rgba(0,242,254,0.15);border-radius:12px;padding:18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <h4 style="color:#fff;font-size:14px;margin:0;display:flex;align-items:center;gap:6px;">
              ${N.edit||"✏️"} Edit Stream Info (Broadcasts Real-Time)
            </h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">Updates live to watching viewers</span>
          </div>

          <form id="live-edit-meta-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group" style="grid-column:span 2;">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Stream Title</label>
              <input class="input-dark" id="live-meta-title" value="${ze(d.title||"")}" required style="margin-top:4px;" />
            </div>
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Category</label>
              <select class="input-dark" id="live-meta-category" style="margin-top:4px;">
                <option value="">Select Category (Optional)</option>
                ${(Fn||[]).map(u=>`
                  <option value="${u.id}" ${u.id===d.categoryId?"selected":""}>${ze(u.name)}</option>
                `).join("")}
              </select>
            </div>
            <div class="form-group">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Actions</label>
              <button type="submit" id="live-meta-save-btn" class="btn btn-cyan btn-sm" style="margin-top:4px;width:100%;height:40px;">
                Update Stream Info
              </button>
            </div>
            <div class="form-group" style="grid-column:span 2;">
              <label style="font-size:11px;font-weight:600;color:var(--color-text-muted);">Description</label>
              <textarea class="input-dark" id="live-meta-desc" rows="2" style="margin-top:4px;height:auto;padding:8px 12px;border-radius:10px;">${ze(d.description||"")}</textarea>
            </div>
          </form>
        </div>
      </div>
    `,Xt&&(clearInterval(Xt),Xt=null),h&&(d.startedAt||d.createdAt)){const u=Xr(d.startedAt||d.createdAt),x=u?u.getTime():Date.now(),m=()=>{const y=document.getElementById("live-stream-duration");if(!y)return;const S=Math.max(0,Math.floor((Date.now()-x)/1e3)),w=Math.floor(S/3600),P=Math.floor(S%3600/60),$=S%60;y.textContent=w>0?`${w}:${String(P).padStart(2,"0")}:${String($).padStart(2,"0")}`:`${String(P).padStart(2,"0")}:${String($).padStart(2,"0")}`};m(),Xt=setInterval(m,1e3)}(e=document.getElementById("studio-view-live-btn"))==null||e.addEventListener("click",()=>{I.navigate("watch",{streamId:d.id})}),(a=document.getElementById("live-edit-meta-form"))==null||a.addEventListener("submit",async u=>{var m,y,S;u.preventDefault();const x=document.getElementById("live-meta-save-btn");x.disabled=!0;try{const w=(m=document.getElementById("live-meta-title"))==null?void 0:m.value.trim(),P=(y=document.getElementById("live-meta-desc"))==null?void 0:y.value.trim(),$=(S=document.getElementById("live-meta-category"))==null?void 0:S.value,z=$?parseInt($):null;await St.updateStreamMeta({title:w,description:P,categoryId:z}),I.showToast("Stream information updated and broadcasted!","success"),sn()}catch(w){I.showToast(w.message||"Failed to update stream info","error")}x.disabled=!1}),(s=document.getElementById("end-stream-btn"))==null||s.addEventListener("click",async()=>{if(!confirm(h?"Are you sure you want to end your active live broadcast?":"Are you sure you want to cancel this pending stream session?"))return;Xt&&(clearInterval(Xt),Xt=null);const x=document.getElementById("end-stream-btn");x&&(x.disabled=!0);try{await St.endStream(),I.showToast(h?"Stream ended successfully.":"Pending session cancelled.","info"),sn()}catch(m){I.showToast(m.message||"Failed to end stream","error"),x&&(x.disabled=!1)}})}catch(d){console.warn("[Studio] loadLiveManager error",d),t.innerHTML=""}}function is(t){var g,f;const e=pt||{};if(!vi){t.innerHTML=`
      <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">Create Your Channel</h2>
      <div class="card" style="padding:28px;max-width:640px;border-radius:16px;">
        <p style="color:var(--color-text-muted);margin-bottom:20px;line-height:1.5;">
          Launch your streaming journey on Orbit! Creating a channel grants you the Streamer role and unlocks broadcasting with OBS.
        </p>
        <form id="ch-setup-form">
          <div class="form-group">
            <label style="color:var(--color-text-muted);font-weight:600;">Channel Name</label>
            <input class="input-dark" id="ch-name" placeholder="e.g. AstroStreamer" required style="margin-top:6px;" />
          </div>
          <div class="form-group" style="margin-top:16px;">
            <label style="color:var(--color-text-muted);font-weight:600;">Bio / Description</label>
            <textarea class="input-dark" id="ch-desc" rows="3" placeholder="Tell viewers what your content is about..." style="margin-top:6px;resize:vertical;padding:12px;height:auto;border-radius:12px;"></textarea>
          </div>
          <button type="submit" class="btn btn-cyan" id="ch-save-btn" style="margin-top:20px;width:100%;padding:12px;font-weight:700;">
            Create Channel &amp; Become Streamer
          </button>
        </form>
      </div>
    `,(g=document.getElementById("ch-setup-form"))==null||g.addEventListener("submit",async _=>{_.preventDefault();const b=document.getElementById("ch-save-btn");b.disabled=!0;try{pt=await tt.create({channelName:document.getElementById("ch-name").value.trim(),description:document.getElementById("ch-desc").value.trim()}),vi=!0,I.showToast("Channel created! You are now a streamer.","success"),Vi()}catch(u){I.showToast(u.message||"Failed to create channel","error"),b.disabled=!1}});return}const a=e.name||e.channelName||"Your Channel",s=Array.isArray(e.socialLinks)?e.socialLinks:[],d=_=>{var b;return((b=s.find(u=>u.platform&&u.platform.toLowerCase()===_.toLowerCase()))==null?void 0:b.url)||""};t.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">Channel Settings</h2>
        <p style="color:var(--color-text-muted);margin:0;font-size:14px;">Manage your public streamer brand, VOD archiving, tips, and social links.</p>
      </div>
      <button id="view-my-ch-btn" class="btn btn-outline btn-sm" style="gap:6px;border-radius:10px;">
        ${N.eye} View Channel
      </button>
    </div>

    <!-- Sub-tab Navigation (Twitch / Kick Style) -->
    <div class="tabs" id="ch-subtabs" style="margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:2px;">
      <button class="tab-btn ${$t==="profile"?"active":""}" data-subtab="profile">
        ${N.user} Profile &amp; Branding
      </button>
      <button class="tab-btn ${$t==="stream-vods"?"active":""}" data-subtab="stream-vods">
        ${N.video} Stream &amp; VODs
      </button>
      <button class="tab-btn ${$t==="donations"?"active":""}" data-subtab="donations">
        💰 Donations &amp; Tips
      </button>
      <button class="tab-btn ${$t==="socials"?"active":""}" data-subtab="socials">
        ${N.link} Social Links
      </button>
    </div>

    <!-- Sub-tab Content Area -->
    <div id="ch-subtab-content"></div>
  `,(f=document.getElementById("view-my-ch-btn"))==null||f.addEventListener("click",()=>{e.id&&I.navigate("channel",{channelId:e.id})}),document.querySelectorAll("#ch-subtabs .tab-btn").forEach(_=>{_.addEventListener("click",()=>{$t=_.dataset.subtab,document.querySelectorAll("#ch-subtabs .tab-btn").forEach(b=>b.classList.remove("active")),_.classList.add("active"),h()})}),h();function h(){var b,u,x,m,y,S;const _=document.getElementById("ch-subtab-content");_&&($t==="profile"?(_.innerHTML=`
        <div style="display:flex;flex-direction:column;gap:24px;max-width:800px;">
          <!-- Profile Info Form -->
          <div class="card" style="padding:24px;border-radius:16px;">
            <h4 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;">Profile Information</h4>
            <form id="profile-edit-form">
              <div class="form-group">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Channel Name</label>
                <input class="input-dark" value="${ze(a)}" disabled style="opacity:0.75;cursor:not-allowed;margin-top:6px;" title="Channel name is permanent" />
              </div>
              <div class="form-group" style="margin-top:16px;">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Bio / About (Max 500 characters)</label>
                <textarea class="input-dark" id="profile-desc" rows="4" maxlength="500" placeholder="Tell viewers about yourself, schedule, and content..." style="margin-top:6px;resize:vertical;padding:12px;height:auto;border-radius:12px;">${ze(e.description||"")}</textarea>
              </div>
              <button type="submit" class="btn btn-cyan btn-sm" id="profile-save-btn" style="margin-top:16px;padding:8px 20px;">
                Save Profile Changes
              </button>
            </form>
          </div>

          <!-- Channel Branding Images (With Image Cropper) -->
          <div class="card" style="padding:24px;border-radius:16px;">
            <h4 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;">Channel Branding &amp; Images</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
              <!-- Avatar -->
              <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;text-align:center;">
                <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#00AEBD,#00DDEE);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;color:#000;overflow:hidden;margin-bottom:12px;">
                  ${e.profilePhotoUrl?`<img src="${e.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`:ze(a)[0].toUpperCase()}
                </div>
                <div style="font-size:13px;font-weight:600;color:#fff;">Profile Picture (1:1)</div>
                <div style="font-size:11px;color:var(--color-text-muted);margin:4px 0 12px;">Interactive Cropper &bull; Max 10MB</div>
                <label class="btn btn-outline btn-sm" style="cursor:pointer;width:100%;justify-content:center;">
                  ${N.image} Crop &amp; Upload Photo
                  <input type="file" id="ch-photo-upload" accept="image/*" style="display:none;" />
                </label>
              </div>

              <!-- Cover Banner -->
              <div style="background:rgba(255,255,255,0.03);padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;align-items:center;text-align:center;">
                <div style="width:100%;height:72px;border-radius:8px;background:${e.coverPhotoUrl?`url(${e.coverPhotoUrl}) center/cover`:"linear-gradient(135deg,#0f1424,#1a2035)"};display:flex;align-items:center;justify-content:center;margin-bottom:12px;border:1px solid rgba(255,255,255,0.1);">
                  ${e.coverPhotoUrl?"":'<span style="font-size:12px;color:var(--color-text-muted);">No Cover Set</span>'}
                </div>
                <div style="font-size:13px;font-weight:600;color:#fff;">Channel Banner (4:1)</div>
                <div style="font-size:11px;color:var(--color-text-muted);margin:4px 0 12px;">Interactive Cropper &bull; 1200x300</div>
                <label class="btn btn-outline btn-sm" style="cursor:pointer;width:100%;justify-content:center;">
                  ${N.image} Crop &amp; Upload Banner
                  <input type="file" id="ch-cover-upload" accept="image/*" style="display:none;" />
                </label>
              </div>
            </div>
          </div>
        </div>
      `,(b=document.getElementById("profile-edit-form"))==null||b.addEventListener("submit",async w=>{w.preventDefault();const P=document.getElementById("profile-save-btn");P.disabled=!0;try{const $=await tt.updateProfile({description:document.getElementById("profile-desc").value.trim()});pt={...pt,...$},I.showToast("Profile updated successfully!","success")}catch($){I.showToast($.message||"Failed to update profile","error")}P.disabled=!1}),(u=document.getElementById("ch-photo-upload"))==null||u.addEventListener("change",async w=>{if(w.target.files&&w.target.files[0]){const P=w.target.files[0];rn(P,{aspectRatio:1,title:"Crop Channel Avatar (1:1)"},async $=>{try{I.showToast("Uploading photo...","info");const z=await tt.uploadPhoto($);pt={...pt,...z},I.showToast("Profile photo updated!","success"),h()}catch(z){I.showToast(z.message||"Failed to upload photo","error")}}),w.target.value=""}}),(x=document.getElementById("ch-cover-upload"))==null||x.addEventListener("change",async w=>{if(w.target.files&&w.target.files[0]){const P=w.target.files[0];rn(P,{aspectRatio:4/1,title:"Crop Channel Banner (4:1)"},async $=>{try{I.showToast("Uploading banner...","info");const z=await tt.uploadCover($);pt={...pt,...z},I.showToast("Channel banner updated!","success"),h()}catch(z){I.showToast(z.message||"Failed to upload banner","error")}}),w.target.value=""}})):$t==="stream-vods"?(_.innerHTML=`
        <div style="display:flex;flex-direction:column;gap:20px;max-width:800px;">
          <!-- Save Streams / VOD Archiving Card -->
          <div class="card" style="padding:24px;border-radius:16px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
              <div>
                <h4 style="margin:0 0 6px;color:#fff;font-size:16px;font-weight:700;">Store Past Broadcasts (VODs)</h4>
                <p style="margin:0;font-size:13px;color:var(--color-text-muted);line-height:1.5;">
                  Automatically save your live stream broadcasts as Video On Demand (VOD) archives. Viewers can rewatch full past streams and generate highlight clips anytime.
                </p>
              </div>
              <label class="toggle-switch" style="position:relative;display:inline-block;width:48px;height:26px;flex-shrink:0;">
                <input type="checkbox" id="save-vods-toggle" ${e.saveStreams?"checked":""} style="opacity:0;width:0;height:0;">
                <span class="toggle-slider" style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,0.15);transition:0.3s;border-radius:26px;"></span>
              </label>
            </div>
            <div id="vod-toggle-status" style="margin-top:12px;font-size:12px;font-weight:600;color:${e.saveStreams?"var(--color-cyan-neon)":"var(--color-text-muted)"};">
              ${e.saveStreams?"&#10003; Automatic VOD archiving is currently ENABLED.":"&#10007; Automatic VOD archiving is currently DISABLED."}
            </div>
          </div>
        </div>
      `,(m=document.getElementById("save-vods-toggle"))==null||m.addEventListener("change",async w=>{const P=w.target.checked,$=document.getElementById("vod-toggle-status");try{const z=await tt.toggleSaveStreams(P);pt.saveStreams=z.saveStreams,$&&($.innerHTML=P?"&#10003; Automatic VOD archiving is currently ENABLED.":"&#10007; Automatic VOD archiving is currently DISABLED.",$.style.color=P?"var(--color-cyan-neon)":"var(--color-text-muted)"),I.showToast(`VOD archiving ${P?"enabled":"disabled"}!`,"success")}catch(z){w.target.checked=!P,I.showToast(z.message||"Failed to update VOD settings","error")}})):$t==="donations"?(_.innerHTML=`
        <div style="display:flex;flex-direction:column;gap:20px;max-width:800px;">
          <div class="card" style="padding:24px;border-radius:16px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <span style="font-size:20px;">💰</span>
              <h4 style="margin:0;color:#fff;font-size:16px;font-weight:700;">Streamer Donations &amp; Tip Jar</h4>
            </div>
            <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 20px;line-height:1.5;">
              Let your community support you! Configure an external donation link (PayPal, Ko-fi, BuyMeACoffee, Streamlabs) that will be featured prominently on your channel page.
            </p>
            <form id="donation-form">
              <div class="form-group">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Donation / Tip Page URL</label>
                <input class="input-dark" id="don-url" type="url" value="${ze(e.donationUrl||"")}" placeholder="https://ko-fi.com/yourname or https://streamlabs.com/yourname/tip" style="margin-top:6px;" />
              </div>
              <div class="form-group" style="margin-top:16px;">
                <label style="color:var(--color-text-muted);font-size:13px;font-weight:600;">Custom Tip Message / Callout (Max 200 chars)</label>
                <input class="input-dark" id="don-msg" maxlength="200" value="${ze(e.donationMessage||"")}" placeholder="Support the broadcast! Tips go towards new stream equipment." style="margin-top:6px;" />
              </div>
              <button type="submit" class="btn btn-cyan btn-sm" id="don-save-btn" style="margin-top:20px;padding:8px 22px;">
                Save Donation Settings
              </button>
            </form>
          </div>
        </div>
      `,(y=document.getElementById("donation-form"))==null||y.addEventListener("submit",async w=>{var $,z;w.preventDefault();const P=document.getElementById("don-save-btn");P.disabled=!0;try{const D=await tt.updateProfile({donationUrl:(($=document.getElementById("don-url"))==null?void 0:$.value.trim())||null,donationMessage:((z=document.getElementById("don-msg"))==null?void 0:z.value.trim())||null});pt={...pt,...D},I.showToast("Donation settings saved!","success")}catch(D){I.showToast(D.message||"Failed to save donation settings","error")}P.disabled=!1})):$t==="socials"&&(_.innerHTML=`
        <div style="display:flex;flex-direction:column;gap:20px;max-width:800px;">
          <div class="card" style="padding:24px;border-radius:16px;">
            <h4 style="margin:0 0 8px;color:#fff;font-size:16px;font-weight:700;">Social Media Links</h4>
            <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 20px;">
              Connect your social media presence. These links will appear in your public channel About section.
            </p>
            <form id="social-form">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">YouTube</label>
                  <input class="input-dark" id="sl-youtube" value="${ze(d("youtube"))}" placeholder="https://youtube.com/@channel" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Twitter / X</label>
                  <input class="input-dark" id="sl-twitter" value="${ze(d("twitter"))}" placeholder="https://x.com/username" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Discord</label>
                  <input class="input-dark" id="sl-discord" value="${ze(d("discord"))}" placeholder="https://discord.gg/invite" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Instagram</label>
                  <input class="input-dark" id="sl-instagram" value="${ze(d("instagram"))}" placeholder="https://instagram.com/profile" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">TikTok</label>
                  <input class="input-dark" id="sl-tiktok" value="${ze(d("tiktok"))}" placeholder="https://tiktok.com/@profile" style="margin-top:4px;" />
                </div>
                <div class="form-group">
                  <label style="color:var(--color-text-muted);font-size:12px;font-weight:600;">Twitch / Kick</label>
                  <input class="input-dark" id="sl-twitch" value="${ze(d("twitch"))}" placeholder="https://twitch.tv/channel" style="margin-top:4px;" />
                </div>
              </div>
              <button type="submit" class="btn btn-cyan btn-sm" id="sl-save-btn" style="margin-top:20px;padding:8px 22px;">
                ${N.link} Save Social Links
              </button>
            </form>
          </div>
        </div>
      `,(S=document.getElementById("social-form"))==null||S.addEventListener("submit",async w=>{var D,F,E,Y,j,X;w.preventDefault();const P=document.getElementById("sl-save-btn");P.disabled=!0;const z=[{platform:"youtube",url:(D=document.getElementById("sl-youtube"))==null?void 0:D.value.trim()},{platform:"twitter",url:(F=document.getElementById("sl-twitter"))==null?void 0:F.value.trim()},{platform:"discord",url:(E=document.getElementById("sl-discord"))==null?void 0:E.value.trim()},{platform:"instagram",url:(Y=document.getElementById("sl-instagram"))==null?void 0:Y.value.trim()},{platform:"tiktok",url:(j=document.getElementById("sl-tiktok"))==null?void 0:j.value.trim()},{platform:"twitch",url:(X=document.getElementById("sl-twitch"))==null?void 0:X.value.trim()}].filter(V=>V.url&&V.url.length>0);try{const V=await tt.updateSocialLinks({socialLinks:z});pt.socialLinks=V,I.showToast("Social links saved!","success")}catch(V){I.showToast(V.message||"Failed to save social links","error")}P.disabled=!1})))}}async function ns(t){var e;t.innerHTML='<div class="spinner"></div>';try{const[a,s]=await Promise.allSettled([St.getSummary(),St.getPastStreams(1,10)]),d=a.status==="fulfilled"?a.value:{},h=d.lifetimeStats||{},g=s.status==="fulfilled"&&Array.isArray(s.value)?s.value:[],f=g.filter(y=>y.isSaved||y.durationSeconds>0&&y.durationSeconds<86400&&y.vodUrl),_=f.length>0?f.reduce((y,S)=>y+(S.durationSeconds||0),0):(e=d.lifetimeStats)!=null&&e.totalBroadcastSeconds&&d.lifetimeStats.totalBroadcastSeconds<86400*5?d.lifetimeStats.totalBroadcastSeconds:0,b=_>0?`${(_/3600).toFixed(1)} hrs`:"0.0 hrs",u=g.map(y=>y.peakViewers||0).filter(y=>y>0),x=Math.max(h.allTimePeakViewers||0,...u,0),m=h.averagePeakViewers&&h.averagePeakViewers>0?h.averagePeakViewers.toFixed(1):u.length>0?(u.reduce((y,S)=>y+S,0)/u.length).toFixed(1):x>0?x.toFixed(1):"0.0";t.innerHTML=`
      <div style="margin-bottom:24px;">
        <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">${N.chart||"📊"} Analytics &amp; Insights</h2>
        <p style="color:var(--color-text-muted);font-size:14px;margin:0;">Channel performance metrics, numerical viewer records, watch time, and broadcast breakdown.</p>
      </div>

      <!-- Numerical KPI Metric Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:28px;">
        <div class="stat-card animate-fade-up">
          <div class="stat-label">All-Time Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-live-red);">${x}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Highest concurrent viewers</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.05s;">
          <div class="stat-label">Average Peak Viewers</div>
          <div class="stat-value" style="color:var(--color-cyan-primary);">${m}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Average peak across all streams</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.1s;">
          <div class="stat-label">Total Broadcast Time</div>
          <div class="stat-value" style="color:#fff;">${b}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Avg duration: ${h.averageStreamDurationFormatted||"0m"}</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.15s;">
          <div class="stat-label">Total Stream Sessions</div>
          <div class="stat-value" style="color:#fff;">${Math.max(h.totalStreams||0,g.length)}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Completed broadcast sessions</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.2s;">
          <div class="stat-label">Total Chat Messages</div>
          <div class="stat-value" style="color:var(--color-cyan-neon);">${h.totalChatMessages||0}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${h.uniqueChattersCount||0} unique chatters</div>
        </div>
        <div class="stat-card animate-fade-up" style="animation-delay:0.25s;">
          <div class="stat-label">VOD &amp; Clip Views</div>
          <div class="stat-value" style="color:#10b981;">${(h.totalVodViews||0)+(h.totalClipViews||0)}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">${h.totalVodViews||0} VOD &bull; ${h.totalClipViews||0} Clip</div>
        </div>
      </div>

      <!-- Activity & Engagement Charts -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:20px;margin-bottom:28px;">
        <div class="chart-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h4 style="margin:0;font-size:14px;color:#fff;">Viewer Activity (Recent Streams)</h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">Peak: ${x} viewers</span>
          </div>
          <div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;align-items:flex-end;">
            ${In(g,"peakViewers",12)}
          </div>
        </div>
        <div class="chart-container">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h4 style="margin:0;font-size:14px;color:#fff;">Chat Engagement Activity</h4>
            <span style="font-size:11px;color:var(--color-cyan-primary);">${h.totalChatMessages||0} total messages</span>
          </div>
          <div class="mini-chart" style="height:140px;gap:8px;padding:20px 0;align-items:flex-end;">
            ${In(g,"chatMessageCount",12)}
          </div>
        </div>
      </div>

      <!-- Numerical Past Broadcasts Table -->
      <div class="card" style="padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
          <h4 style="margin:0;font-size:15px;font-weight:700;color:#fff;">Recent Broadcast Performance</h4>
          <span style="font-size:12px;color:var(--color-text-muted);">Showing recent ${g.length} sessions</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Stream Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Peak Viewers</th>
                <th>Chat Messages</th>
                <th>Clips Created</th>
                <th>VOD Archive</th>
              </tr>
            </thead>
            <tbody>
              ${(g||[]).map(y=>`
                <tr>
                  <td style="font-weight:600;color:#fff;">${ze(y.title||"Untitled Stream")}</td>
                  <td><span class="badge-category">${ze(y.categoryName||"General")}</span></td>
                  <td style="color:var(--color-text-muted);font-size:12px;">${y.startedAt?new Date(y.startedAt).toLocaleDateString():"N/A"}</td>
                  <td style="font-weight:600;color:var(--color-cyan-primary);">${y.formattedDuration||"0m"}</td>
                  <td style="font-weight:700;color:var(--color-live-red);">${y.peakViewers||0}</td>
                  <td style="color:var(--color-text);">${y.chatMessageCount||0}</td>
                  <td style="color:var(--color-text);">${y.clipsCount||0}</td>
                  <td>${y.vodUrl?'<span style="color:#10b981;font-size:12px;font-weight:600;">✓ Saved</span>':'<span style="color:var(--color-text-muted);font-size:12px;">Not Saved</span>'}</td>
                </tr>
              `).join("")}
              ${g!=null&&g.length?"":'<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--color-text-muted);">No broadcasts recorded yet. Start streaming to populate performance analytics!</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `}catch{t.innerHTML='<div class="empty-state"><h3>Failed to load analytics</h3></div>'}}async function Ba(t){t.innerHTML='<div class="spinner"></div>';try{const e=await St.getPastStreams(1,20),a=Array.isArray(e)?e:(e==null?void 0:e.items)||[];if(!a.length){t.innerHTML='<div class="empty-state"><div class="empty-icon">&#128249;</div><h3>No Past Streams</h3><p>Your broadcast archive is empty.</p></div>';return}t.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;">${N.archive||"📼"} Broadcast Archive</h2>
          <p style="color:var(--color-text-muted);font-size:14px;margin:0;">Stored Video-On-Demand (VOD) replays recorded from your live streams.</p>
        </div>
      </div>
      <table class="data-table">
        <thead><tr><th>Title</th><th>Date</th><th>Duration</th><th>Peak Viewers</th><th>Actions</th></tr></thead>
        <tbody>${a.map(s=>`
          <tr>
            <td style="font-weight:600;color:#fff;">${ze(s.title||"Untitled Stream")}</td>
            <td style="color:var(--color-text-muted);">${s.startedAt?new Date(s.startedAt).toLocaleDateString():"-"}</td>
            <td style="color:var(--color-cyan-primary);font-weight:600;">${s.formattedDuration||s.duration||"-"}</td>
            <td>${s.peakViewers||0}</td>
            <td style="white-space:nowrap;">
              <button class="btn btn-outline btn-sm" data-play-vod="${s.id||s.vodId}" style="margin-right:8px;padding:4px 10px;">
                ${N.play} Watch
              </button>
              ${s.vodId||s.id?`<button class="btn btn-ghost btn-sm" data-del-vod="${s.vodId||s.id}" title="Delete VOD" style="color:#ef4444;">${N.trash}</button>`:""}
            </td>
          </tr>
        `).join("")}</tbody>
      </table>
    `,t.querySelectorAll("[data-play-vod]").forEach(s=>{s.addEventListener("click",()=>{const d=parseInt(s.dataset.playVod),h=a.find(g=>g.id===d||g.vodId===d);h&&Vn(h)})}),t.querySelectorAll("[data-del-vod]").forEach(s=>{s.addEventListener("click",async()=>{if(confirm("Permanently delete this VOD from your channel archive?"))try{await St.deleteVod(parseInt(s.dataset.delVod)),I.showToast("VOD deleted","info"),Ba(t)}catch(d){I.showToast(d.message,"error")}})})}catch{t.innerHTML='<div class="empty-state"><h3>Failed to load archives</h3></div>'}}async function as(t){var e;t.innerHTML=`
    <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin-bottom:24px;">${N.shield} Moderation &amp; Team</h2>
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
  `,(e=document.getElementById("hire-mod-btn"))==null||e.addEventListener("click",async()=>{const a=document.getElementById("mod-username").value.trim();if(a)try{await tt.hireModerator(a),I.showToast(`${a} is now a moderator!`,"success"),Ln(),document.getElementById("mod-username").value=""}catch(s){I.showToast(s.message,"error")}}),Ln(),os()}async function Ln(){const t=document.getElementById("mod-list");if(t)try{const e=await tt.getModerators();if(!(e!=null&&e.length)){t.innerHTML='<p class="text-muted" style="margin:0;">No moderators assigned yet.</p>';return}t.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${e.map(a=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="badge-role mod">MOD</span>
              <span style="font-weight:600;color:#fff;">@${ze(a.username||a.userName)}</span>
            </div>
            <button class="btn btn-ghost btn-sm btn-unhire" data-user="${ze(a.username||a.userName)}" style="color:var(--color-error);">Remove</button>
          </div>
        `).join("")}
      </div>
    `,t.querySelectorAll(".btn-unhire").forEach(a=>{a.addEventListener("click",async()=>{const s=a.dataset.user;if(confirm(`Remove moderator privileges from @${s}?`))try{await tt.removeModerator(s),I.showToast(`Removed @${s} from moderators`,"info"),Ln()}catch(d){I.showToast(d.message,"error")}})})}catch{t.innerHTML='<p class="text-muted">Failed to load moderators.</p>'}}async function os(){const t=document.getElementById("mod-summary-card");if(t)try{const e=await St.getModeration();t.innerHTML=`
      <h4 style="color:var(--color-text-muted);font-size:14px;margin-bottom:12px;">Moderation Overview</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div><div style="font-size:24px;font-weight:700;color:var(--color-cyan-neon);">${e.totalModerators||e.moderatorCount||0}</div><div style="font-size:11px;color:var(--color-text-muted);">Moderators</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-error);">${e.activeBansCount||e.activeBanCount||0}</div><div style="font-size:11px;color:var(--color-text-muted);">Active Bans</div></div>
        <div><div style="font-size:24px;font-weight:700;color:var(--color-warning);">${e.activeTimeoutsCount||e.activeTimeoutCount||0}</div><div style="font-size:11px;color:var(--color-text-muted);">Timeouts</div></div>
      </div>
    `}catch{t.innerHTML='<h4 style="color:var(--color-text-muted);">Moderation Overview</h4><p class="text-muted">Unavailable</p>'}}async function rs(t){var e,a,s,d,h;t.innerHTML='<div class="spinner"></div>';try{let $=function(){y!=null&&y.checked?(w==null||w.style.setProperty("background","linear-gradient(135deg,rgba(0,174,189,0.3),rgba(0,221,238,0.2))"),w==null||w.style.setProperty("color","#fff"),w==null||w.style.setProperty("box-shadow","0 0 10px rgba(0,174,189,0.3)"),S==null||S.style.setProperty("background","transparent"),S==null||S.style.setProperty("color","var(--color-text-muted)"),S==null||S.style.setProperty("box-shadow","none")):(S==null||S.style.setProperty("background","linear-gradient(135deg,rgba(0,174,189,0.3),rgba(0,221,238,0.2))"),S==null||S.style.setProperty("color","#fff"),S==null||S.style.setProperty("box-shadow","0 0 10px rgba(0,174,189,0.3)"),w==null||w.style.setProperty("background","transparent"),w==null||w.style.setProperty("color","var(--color-text-muted)"),w==null||w.style.setProperty("box-shadow","none"))},z=function(){var F;y.checked?(P.innerHTML=`
          <label style="font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:4px;display:block;">
            Upload Image (1:1 Aspect Ratio)
          </label>
          <label class="btn btn-outline btn-sm" style="cursor:pointer;width:100%;height:42px;justify-content:center;margin-top:0;">
            ${N.upload||"⬆"} ${x?"Image Selected (Crop Done)":"Select &amp; Crop Image"}
            <input type="file" id="emote-file-inp" accept="image/*" style="display:none;" />
          </label>
        `,(F=document.getElementById("emote-file-inp"))==null||F.addEventListener("change",E=>{if(E.target.files&&E.target.files[0]){const Y=E.target.files[0];rn(Y,{aspectRatio:1,title:"Crop Custom Emote (1:1)"},j=>{u=j;const X=new FileReader;X.onload=V=>{x=V.target.result,z(),I.showToast("Image cropped and ready!","success")},X.readAsDataURL(j)}),E.target.value=""}})):P.innerHTML=`
          <label style="font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:4px;display:block;">
            Emote Character / SVG
          </label>
          <input class="input-dark" id="new-emote-val" placeholder="Paste emoji or pick from presets below" style="width:100%;font-size:18px;" />
        `},D=function(){const F=document.getElementById("emotes-grid"),E=document.getElementById("emotes-count"),Y=document.getElementById("save-emojis-server-btn");if(E&&(E.textContent=_.length),Y&&(Y.textContent=`Save All Emotes (${_.length}/50)`),!!F){if(!_.length){F.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--color-text-muted);">No custom emojis configured yet. Add your first emote above!</div>';return}F.innerHTML=_.map((j,X)=>`
        <div class="orbit-emote-card stagger-item">
          <div class="emote-display">
            ${j.isCustomImage?`<img src="${j.emojiValue}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;" alt=":${ze(j.name)}:" />`:j.emojiValue.startsWith("orbit:")&&nn[j.emojiValue.replace("orbit:","")]?nn[j.emojiValue.replace("orbit:","")].svg:`<span style="font-size:28px;">${j.emojiValue}</span>`}
          </div>
          <div class="emote-name">:${ze(j.name)}:</div>
          <div class="emote-type-label">${j.isCustomImage?"Custom Image":j.emojiValue.startsWith("orbit:")?"Orbit SVG":"Unicode"}</div>
          <button class="btn btn-ghost btn-sm del-emote-btn" data-index="${X}" title="Remove Emote" style="margin-top:8px;color:var(--color-error);padding:2px 8px;font-size:11px;">
            ${N.trash||"🗑"} Delete
          </button>
        </div>
      `).join(""),F.querySelectorAll(".del-emote-btn").forEach(j=>{j.addEventListener("click",()=>{const X=parseInt(j.dataset.index);_.splice(X,1),D(),I.showToast('Emote removed from list. Click "Save All Emotes" to commit.',"info")})})}};const[g,f]=await Promise.allSettled([St.getEmojis(),St.getBadges()]);let _=g.status==="fulfilled"&&Array.isArray(g.value)?g.value:[];const b=f.status==="fulfilled"?f.value:null;t.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-family:var(--font-display);color:var(--color-cyan-neon);margin:0 0 4px 0;display:flex;align-items:center;gap:10px;">
            <span style="width:28px;height:28px;display:inline-flex;">${mt("orbitPog")}</span>
            Emotes &amp; Badges Studio
          </h2>
          <p style="color:var(--color-text-muted);font-size:14px;margin:0;">Configure custom emotes for your channel chat and view celestial role badges.</p>
        </div>
        <button id="save-emojis-server-btn" class="btn btn-cyan btn-sm" style="padding:8px 20px;">
          ${N.check||"✓"} Save All Emotes (${_.length}/50)
        </button>
      </div>

      <!-- Add New Custom Emote Card -->
      <div class="card" style="padding:24px;margin-bottom:24px;border-color:rgba(0,242,254,0.2);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(0,242,254,0.06),transparent 70%);pointer-events:none;"></div>
        <h4 style="color:#fff;font-size:15px;font-weight:700;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
          ${N.plus||"+"} Add New Custom Emote
        </h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;align-items:end;">
          <div class="form-group">
            <label style="font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:4px;display:block;">
              Emote Shortcode (e.g. <code style="color:var(--color-cyan-neon);">orbitPog</code>)
            </label>
            <input class="input-dark" id="new-emote-name" placeholder="orbitPog (alphanumeric)" style="width:100%;" />
          </div>
          <div class="form-group">
            <label style="font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:6px;display:block;">
              Emote Type
            </label>
            <div class="emote-type-toggle-group" style="display:inline-flex;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:3px;gap:4px;">
              <button type="button" id="toggle-type-unicode" class="emote-toggle-btn active" style="flex:1;border:none;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,rgba(0,174,189,0.3),rgba(0,221,238,0.2));color:#fff;box-shadow:0 0 10px rgba(0,174,189,0.3);transition:all 0.2s ease;">
                <span style="width:16px;height:16px;display:inline-flex;">${mt("orbitStar")}</span> Orbit Emote
              </button>
              <button type="button" id="toggle-type-image" class="emote-toggle-btn" style="flex:1;border:none;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;color:var(--color-text-muted);transition:all 0.2s ease;">
                <span>🖼️</span> Custom Image
              </button>
            </div>
            <input type="radio" name="emote-type" value="unicode" checked id="type-unicode" style="display:none;" />
            <input type="radio" name="emote-type" value="image" id="type-image" style="display:none;" />
          </div>
          <div class="form-group" id="emote-input-container">
            <label style="font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:4px;display:block;">
              Emote Character / SVG
            </label>
            <input class="input-dark" id="new-emote-val" placeholder="Paste emoji or pick from presets below" style="width:100%;font-size:18px;" />
          </div>
          <div>
            <button id="add-emote-btn" class="btn btn-cyan btn-sm btn-full" style="height:42px;">
              Add to Emotes
            </button>
          </div>
        </div>

        <!-- Orbit Custom Emote Presets -->
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="width:18px;height:18px;display:inline-flex;">${mt("orbitHype")}</span>
            <span style="font-size:13px;font-weight:700;color:var(--color-cyan-neon);">Orbit Exclusive Presets</span>
            <span style="font-size:11px;color:var(--color-text-muted);">(Click to add)</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;" id="orbit-presets-container">
            ${ba().map(F=>`
              <button class="orbit-preset-btn preset-btn" data-name="${F.name}" data-val="orbit:${F.name}" title=":${F.name}:">
                <span style="width:20px;height:20px;display:inline-flex;">${F.svg}</span>
                <span>:${F.name}:</span>
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Channel Custom Emotes Gallery -->
      <div class="card" style="padding:24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4 style="color:#fff;font-size:15px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
            <span style="width:20px;height:20px;display:inline-flex;">${mt("orbitCrown")}</span>
            Active Channel Emotes (<span id="emotes-count">${_.length}</span>/50)
          </h4>
          <span style="font-size:12px;color:var(--color-text-muted);">Type <code style="color:var(--color-cyan-neon);">:name:</code> in stream chat to use</span>
        </div>
        <div id="emotes-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:14px;">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- Platform Role Badges -->
      <div class="card" style="padding:24px;">
        <h4 style="color:#fff;font-size:15px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;">
          <span style="width:20px;height:20px;display:inline-flex;">${mt("orbitGG")}</span>
          Cosmic Role Badges
        </h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;">
          <div class="orbit-badge-card">
            <div class="badge-icon" style="background:linear-gradient(135deg,rgba(0,174,189,0.15),rgba(0,242,254,0.1));">
              <span style="width:28px;height:28px;display:inline-flex;">${mt("orbitStar")}</span>
            </div>
            <div>
              <strong style="color:var(--color-cyan-primary);font-size:14px;">${((e=b==null?void 0:b.owner)==null?void 0:e.role)||"Channel Owner"}</strong>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Earth — Creator of the channel</div>
            </div>
          </div>
          <div class="orbit-badge-card">
            <div class="badge-icon" style="background:linear-gradient(135deg,rgba(16,185,129,0.15),rgba(52,211,153,0.1));">
              <span style="width:28px;height:28px;display:inline-flex;">${mt("orbitChill")}</span>
            </div>
            <div>
              <strong style="color:#10b981;font-size:14px;">${((a=b==null?void 0:b.moderator)==null?void 0:a.role)||"Moderator"}</strong>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Saturn — Shield of the stream chat</div>
            </div>
          </div>
          <div class="orbit-badge-card">
            <div class="badge-icon" style="background:linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.1));">
              <span style="width:28px;height:28px;display:inline-flex;">${mt("orbitCrown")}</span>
            </div>
            <div>
              <strong style="color:#f59e0b;font-size:14px;">${((s=b==null?void 0:b.ogUser)==null?void 0:s.role)||"OG Pioneer"}</strong>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Gold Star — Early platform adopter</div>
            </div>
          </div>
        </div>
      </div>
    `;let u=null,x="";const m=document.getElementById("type-unicode"),y=document.getElementById("type-image"),S=document.getElementById("toggle-type-unicode"),w=document.getElementById("toggle-type-image"),P=document.getElementById("emote-input-container");S==null||S.addEventListener("click",()=>{m&&(m.checked=!0),y&&(y.checked=!1),$(),z()}),w==null||w.addEventListener("click",()=>{y&&(y.checked=!0),m&&(m.checked=!1),$(),z()}),m==null||m.addEventListener("change",z),y==null||y.addEventListener("change",z),D(),(d=document.getElementById("add-emote-btn"))==null||d.addEventListener("click",()=>{var Y,j;const F=document.getElementById("new-emote-name"),E=(Y=F==null?void 0:F.value)==null?void 0:Y.trim().replace(/^:/,"").replace(/:$/,"");if(!E||!/^[a-zA-Z0-9_]{2,32}$/.test(E)){I.showToast("Emote name must be 2-32 characters alphanumeric/underscore","error");return}if(_.some(X=>X.name.toLowerCase()===E.toLowerCase())){I.showToast("An emote with this shortcode already exists","error");return}if(y.checked){if(!x){I.showToast("Please select and crop an image first","error");return}_.push({name:E,emojiValue:x,isCustomImage:!0}),x="",u=null,z()}else{const X=document.getElementById("new-emote-val"),V=(j=X==null?void 0:X.value)==null?void 0:j.trim();if(!V){I.showToast("Please enter an emoji character","error");return}_.push({name:E,emojiValue:V,isCustomImage:!1}),X&&(X.value="")}F&&(F.value=""),D(),I.showToast(`:${E}: added! Click "Save All Emotes" to save to channel.`,"success")}),document.querySelectorAll(".preset-btn").forEach(F=>{F.addEventListener("click",()=>{const E=F.dataset.name,Y=F.dataset.val;if(_.some(j=>j.name.toLowerCase()===E.toLowerCase())){I.showToast(`:${E}: is already in your emotes list`,"info");return}_.push({name:E,emojiValue:Y,isCustomImage:!1}),D(),I.showToast(`Added :${E}: preset!`,"success")})}),(h=document.getElementById("save-emojis-server-btn"))==null||h.addEventListener("click",async()=>{const F=document.getElementById("save-emojis-server-btn");F.disabled=!0;try{const E={emojis:_.map(j=>({name:j.name,emojiValue:j.emojiValue,isCustomImage:j.isCustomImage}))};_=await St.setEmojis(E)||[],D(),I.showToast("Custom emotes saved successfully to your channel!","success")}catch(E){I.showToast(E.message||"Failed to save emotes to server","error")}F.disabled=!1})}catch{t.innerHTML='<div class="empty-state"><h3>Failed to load emotes studio</h3></div>'}}function bn(t){xt=t,document.querySelectorAll("[data-studio-tab]").forEach(e=>{e.classList.toggle("active",e.dataset.studioTab===t)}),Vi()}function In(t,e="peakViewers",a=8){if(Array.isArray(t)&&t.length>0){const s=[...t].slice(0,12).reverse(),d=s.map(g=>g[e]||0),h=Math.max(...d,1);return s.map(g=>{const f=g[e]||0,_=Math.max(14,Math.round(f/h*100)),b=e==="peakViewers"?`${f} peak viewers`:`${f} chat msgs`;return`
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:4px;" title="${`${ze(g.title||"Stream")}: ${b}`}">
          <div class="mini-chart-bar" style="height:${_}%;width:100%;background:${e==="peakViewers"?"linear-gradient(180deg, var(--color-live-red, #ff1400), rgba(255, 20, 0, 0.4))":"linear-gradient(180deg, var(--color-cyan-neon, #00f2fe), var(--color-cyan-primary, #00aebd))"};border-radius:4px 4px 0 0;opacity:0.95;transition:all 0.3s ease;cursor:pointer;"></div>
          <span style="font-size:9px;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:36px;text-align:center;">${f}</span>
        </div>
      `}).join("")}return Array.from({length:a},()=>`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:4px;">
        <div class="mini-chart-bar" style="height:15%;width:100%;background:rgba(255,255,255,0.06);border-radius:4px 4px 0 0;"></div>
        <span style="font-size:9px;color:var(--color-text-muted);">-</span>
      </div>
    `).join("")}function ss(t,e){return In([],"peakViewers",t)}const fa={uploadPicture:t=>{const e=new FormData;return e.append("file",t),re("/api/user-profile/picture",{method:"POST",body:e})},removePicture:()=>re("/api/user-profile/picture",{method:"DELETE"}),getPublicProfile:t=>re(`/api/user-profile/${t}`)};function ls(){const t=I.getState().currentUser;return t?`
    <div style="max-width:600px;margin:0 auto;">
      <div class="card" style="padding:32px;text-align:center;margin-bottom:24px;">
        <div style="width:100px;height:100px;border-radius:50%;margin:0 auto 16px;overflow:hidden;border:3px solid var(--color-cyan-primary);background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#000;" id="profile-avatar">
          ${t.profilePictureUrl?`<img src="${t.profilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(t.fullName||t.username||"U")[0].toUpperCase()}
        </div>
        <h2 style="font-size:22px;margin-bottom:4px;">${t.fullName||t.username}</h2>
        <p style="color:var(--color-cyan-primary);font-size:14px;margin-bottom:4px;">@${t.username||""}</p>
        <p style="color:var(--color-text-muted);font-size:13px;">${t.email||""}</p>
        <div style="margin-top:16px;display:flex;justify-content:center;gap:10px;">
          <label class="btn btn-outline btn-sm" style="cursor:pointer;">
            ${N.upload} Upload Photo
            <input type="file" id="profile-upload" accept="image/*" style="display:none;" />
          </label>
          <button id="profile-remove-pic" class="btn btn-ghost btn-sm">${N.trash} Remove</button>
        </div>
      </div>

      <div class="card" style="padding:24px;">
        <h3 style="font-size:16px;margin-bottom:16px;color:var(--color-cyan-neon);">Account Info</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><span style="font-size:12px;color:var(--color-text-muted);">Username</span><p>${t.username||"-"}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Full Name</span><p>${t.fullName||"-"}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Email</span><p>${t.email||"-"}</p></div>
          <div><span style="font-size:12px;color:var(--color-text-muted);">Age</span><p>${t.age||"-"}</p></div>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;">
        <button id="profile-logout" class="btn btn-danger btn-full">${N.logout} Log Out</button>
      </div>
    </div>
  `:'<div class="empty-state"><h3>Not logged in</h3></div>'}function ds(){var t,e,a;(t=document.getElementById("profile-upload"))==null||t.addEventListener("change",async s=>{const d=s.target.files[0];if(d)try{const h=await fa.uploadPicture(d);I.showToast("Profile picture updated!","success");const g={...I.getState().currentUser,profilePictureUrl:h.profilePictureUrl||h.url};Nt(g),I.setCurrentUser(g)}catch(h){I.showToast(h.message||"Upload failed","error")}}),(e=document.getElementById("profile-remove-pic"))==null||e.addEventListener("click",async()=>{try{await fa.removePicture();const s={...I.getState().currentUser,profilePictureUrl:null};Nt(s),I.setCurrentUser(s),I.showToast("Profile picture removed","info")}catch(s){I.showToast(s.message||"Failed","error")}}),(a=document.getElementById("profile-logout"))==null||a.addEventListener("click",async()=>{try{await It.revokeToken()}catch{}ln(),Nt(null),I.setCurrentUser(null),I.navigate("splash"),I.showToast("Logged out","info")})}let Ue="all",Da={channels:[],categories:[],streams:[],clips:[]};function cs(){var e;const t=((e=I.getState().viewParams)==null?void 0:e.query)||"";return`<div>
    <div style="margin-bottom:24px;">
      <div style="display:flex;gap:12px;max-width:700px;align-items:center;">
        <div class="search-bar" style="flex:1;height:48px;">
          ${N.search}
          <input type="text" id="search-input" placeholder="Search channels, categories, streams, clips..." value="${at(t)}" autofocus style="font-size:16px;" />
        </div>
        <button id="search-submit-btn" class="btn btn-cyan btn-sm" style="height:48px;padding:0 24px;">Search</button>
      </div>
      <!-- Filter pills -->
      <div style="display:flex;gap:8px;margin-top:16px;overflow-x:auto;" id="search-filter-pills">
        <button class="cat-pill ${Ue==="all"?"active":""}" data-filter="all" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${Ue==="all"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${Ue==="all"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">All Results</button>
        <button class="cat-pill ${Ue==="channels"?"active":""}" data-filter="channels" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${Ue==="channels"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${Ue==="channels"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Channels</button>
        <button class="cat-pill ${Ue==="categories"?"active":""}" data-filter="categories" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${Ue==="categories"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${Ue==="categories"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Categories</button>
        <button class="cat-pill ${Ue==="streams"?"active":""}" data-filter="streams" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${Ue==="streams"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${Ue==="streams"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Live Streams</button>
        <button class="cat-pill ${Ue==="clips"?"active":""}" data-filter="clips" style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:${Ue==="clips"?"var(--color-cyan-primary)":"var(--color-space-slate)"};color:${Ue==="clips"?"#000":"#fff"};border:1px solid var(--color-cyan-border);cursor:pointer;">Clips</button>
      </div>
    </div>
    <div id="search-results"></div>
    <div id="clip-modal-root"></div>
  </div>`}function us(){var d;const t=document.getElementById("search-input"),e=document.getElementById("search-submit-btn"),a=(d=I.getState().viewParams)==null?void 0:d.query;a&&Ji(a);let s;t==null||t.addEventListener("input",()=>{clearTimeout(s),s=setTimeout(()=>{const h=t.value.trim();h&&Ji(h)},350)}),t==null||t.addEventListener("keydown",h=>{if(h.key==="Enter"){clearTimeout(s);const g=t.value.trim();g&&Ji(g)}}),e==null||e.addEventListener("click",()=>{var g;const h=(g=t==null?void 0:t.value)==null?void 0:g.trim();h&&Ji(h)}),document.querySelectorAll("#search-filter-pills [data-filter]").forEach(h=>{h.addEventListener("click",()=>{var g;Ue=h.dataset.filter,document.querySelectorAll("#search-filter-pills [data-filter]").forEach(f=>{const _=f.dataset.filter===Ue;f.style.background=_?"var(--color-cyan-primary)":"var(--color-space-slate)",f.style.color=_?"#000":"#fff"}),Pa(((g=t==null?void 0:t.value)==null?void 0:g.trim())||a||"")})})}async function Ji(t){const e=document.getElementById("search-results");if(e){e.innerHTML='<div class="spinner"></div>';try{const[a,s,d,h]=await Promise.allSettled([tt.search(t),_t.search(t),wt.getLiveStreams(),Ft.getTop(30)]);let g=a.status==="fulfilled"&&Array.isArray(a.value)?a.value:[],f=s.status==="fulfilled"&&Array.isArray(s.value)?s.value:[];const _=d.status==="fulfilled"&&Array.isArray(d.value)?d.value:[],b=_.filter(m=>m.title&&m.title.toLowerCase().includes(t.toLowerCase())||m.streamerName&&m.streamerName.toLowerCase().includes(t.toLowerCase())||m.categoryName&&m.categoryName.toLowerCase().includes(t.toLowerCase()));if(!g.length&&_.length){const m=new Set;g=_.filter(y=>y.channelName&&y.channelName.toLowerCase().includes(t.toLowerCase())||y.streamerName&&y.streamerName.toLowerCase().includes(t.toLowerCase())).filter(y=>m.has(y.channelId)?!1:(m.add(y.channelId),!0)).map(y=>({id:y.channelId,channelName:y.channelName||y.streamerName,description:`Live streamer in ${y.categoryName||"Orbit"}`,profilePhotoUrl:y.profilePictureUrl,ownerUsername:y.streamerName,isLive:!0,viewerCount:y.viewerCount||0,categoryName:y.categoryName}))}const x=(h.status==="fulfilled"&&Array.isArray(h.value)?h.value:[]).filter(m=>m.title&&m.title.toLowerCase().includes(t.toLowerCase())||m.creatorName&&m.creatorName.toLowerCase().includes(t.toLowerCase())||m.channelName&&m.channelName.toLowerCase().includes(t.toLowerCase()));Da={channels:g,categories:f,streams:b,clips:x},Pa(t)}catch{e.innerHTML='<p class="text-muted">Search failed. Please try again.</p>'}}}function Pa(t){const e=document.getElementById("search-results");if(!e)return;const{channels:a,categories:s,streams:d,clips:h}=Da,g=(Ue==="all"||Ue==="channels")&&a.length>0,f=(Ue==="all"||Ue==="categories")&&s.length>0,_=(Ue==="all"||Ue==="streams")&&d.length>0,b=(Ue==="all"||Ue==="clips")&&h.length>0;if((Ue==="all"?a.length+s.length+d.length+h.length:Ue==="channels"?a.length:Ue==="categories"?s.length:Ue==="streams"?d.length:h.length)===0){e.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">&#128269;</div>
        <h3>No Results for "${at(t)}"</h3>
        <p>No matching ${Ue==="all"?"channels, categories, or broadcasts":Ue} found. Try searching with different keywords.</p>
      </div>`;return}let x="";g&&(x+=`
      <div style="margin-bottom:32px;">
        <div class="section-title">${N.video} Streamer Channels (${a.length})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
          ${a.map(m=>`
            <div class="channel-search-card" data-channel-id="${m.id}">
              <div class="channel-search-avatar">
                ${m.profilePhotoUrl?`<img src="${m.profilePhotoUrl}" alt="${at(m.channelName)}" onerror="this.src='${Jt}';" />`:(m.channelName||"C")[0].toUpperCase()}
              </div>
              <div style="flex:1;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-weight:700;color:#fff;font-size:15px;" class="truncate">${at(m.channelName)}</span>
                  ${N.checkCircle}
                  ${m.isLive?'<span class="badge-live" style="margin-left:auto;">LIVE</span>':""}
                </div>
                <div style="font-size:12px;color:var(--color-cyan-primary);margin-top:2px;">@${at(m.ownerUsername||"streamer")}</div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;" class="truncate">${at(m.description||"Broadcasting live on Orbit")}</div>
              </div>
              <button class="btn btn-outline btn-sm btn-view-channel" data-cid="${m.id}" style="flex-shrink:0;">View</button>
            </div>
          `).join("")}
        </div>
      </div>
    `),_&&(x+=`
      <div style="margin-bottom:32px;">
        <div class="section-title"><span style="color:var(--color-live-red);">&#9679;</span> Live Broadcasts (${d.length})</div>
        <div class="streams-grid">
          ${d.map(m=>`
            <div class="card stream-card hover-lift" data-stream-id="${m.id}">
              <div class="stream-thumb">
                <img src="${ht}" data-thumb-src="${m.thumbnailUrl||""}" alt="${at(m.title)}" />
                <div style="position:absolute;top:10px;left:10px;display:flex;gap:6px;">
                  <span class="badge-live">LIVE</span>
                  <span class="badge-viewers">${N.eye} ${m.viewerCount||0}</span>
                </div>
                ${m.categoryName?`<span class="badge-category" style="position:absolute;top:10px;right:10px;">${at(m.categoryName)}</span>`:""}
              </div>
              <div class="stream-info">
                <div class="streamer-row">
                  <div class="streamer-avatar">${m.profilePictureUrl?`<img src="${m.profilePictureUrl}" />`:(m.streamerName||"S")[0].toUpperCase()}</div>
                  <div style="flex:1;overflow:hidden;">
                    <div class="streamer-name">${at(m.streamerName||"Streamer")} ${N.checkCircle}</div>
                    <div style="font-size:12px;color:var(--color-cyan-primary);">${at(m.categoryName||"General")}</div>
                  </div>
                </div>
                <div class="stream-title">${at(m.title||"Live Stream")}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `),f&&(x+=`
      <div style="margin-bottom:32px;">
        <div class="section-title">${N.grid} Categories (${s.length})</div>
        <div class="categories-grid">
          ${s.map(m=>`
            <div class="card category-card hover-lift" data-slug="${m.slug}">
              <div class="cat-thumb">
                ${m.imageUrl?`<img src="${m.imageUrl}" alt="${at(m.name)}" />`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-gradient-card);">&#127918;</div>'}
              </div>
              <div class="cat-info">
                <div class="cat-name">${at(m.name)}</div>
                ${m.totalViewers?`<div class="cat-viewers">${m.totalViewers} viewers</div>`:""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `),b&&(x+=`
      <div style="margin-bottom:32px;">
        <div class="section-title">${N.clip} Clips (${h.length})</div>
        <div class="clips-grid">
          ${h.map(m=>`
            <div class="card clip-card hover-lift" data-clip-id="${m.id}">
              <div class="clip-thumb">
                <img src="${ht}" data-thumb-src="${m.thumbnailUrl||""}" alt="${at(m.title)}" />
                <span class="clip-views">${N.eye} ${m.viewCount||0}</span>
              </div>
              <div class="clip-info">
                <div class="clip-title truncate">${at(m.title||"Untitled Clip")}</div>
                <div class="clip-meta">by ${at(m.creatorName||m.creatorUsername||"Unknown")}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `),e.innerHTML=x,Et(e),e.querySelectorAll(".channel-search-card, .btn-view-channel").forEach(m=>{m.addEventListener("click",y=>{y.stopPropagation();const S=parseInt(m.dataset.channelId||m.dataset.cid);S&&I.navigate("channel",{channelId:S})})}),e.querySelectorAll(".category-card").forEach(m=>{m.addEventListener("click",()=>{I.navigate("category-detail",{slug:m.dataset.slug})})}),e.querySelectorAll(".stream-card").forEach(m=>{m.addEventListener("click",()=>{const y=parseInt(m.dataset.streamId),S=d.find(w=>w.id===y);S&&(I.setActiveStream(S),I.navigate("watch",{streamId:y}))})}),e.querySelectorAll(".clip-card").forEach(m=>{m.addEventListener("click",()=>{const y=parseInt(m.dataset.clipId),S=h.find(w=>w.id===y);S&&zi(S)})})}function at(t){return t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}const Qe={getStats:()=>re("/api/Admin/stats"),getUsers(t=1,e=15,a="",s=""){let d=`/api/Admin/users?page=${t}&pageSize=${e}`;return a&&(d+=`&search=${encodeURIComponent(a)}`),s&&(d+=`&role=${encodeURIComponent(s)}`),re(d)},getUserById:t=>re(`/api/Admin/users/${t}`),updateUserRoles:(t,e)=>re(`/api/Admin/users/${t}/roles`,{method:"PUT",body:JSON.stringify({roles:e})}),lockUser:(t,e,a=1440)=>re(`/api/Admin/users/${t}/lock`,{method:"POST",body:JSON.stringify({isLocked:e,lockoutMinutes:a})}),resetPassword:(t,e)=>re(`/api/Admin/users/${t}/reset-password`,{method:"POST",body:JSON.stringify({newPassword:e})}),deleteAccount:t=>re(`/api/Admin/users/${t}`,{method:"DELETE"}),getChannels(t=1,e=15,a=""){let s=`/api/Admin/channels?page=${t}&pageSize=${e}`;return a&&(s+=`&search=${encodeURIComponent(a)}`),re(s)},resetChannelStreamKey:t=>re(`/api/Admin/channels/${t}/reset-stream-key`,{method:"POST"}),deleteChannel:t=>re(`/api/Admin/channels/${t}`,{method:"DELETE"}),getLiveStreams:()=>re("/api/Admin/streams/live"),forceEndStream:t=>re(`/api/Admin/streams/${t}/force-end`,{method:"POST"}),simulateYoutubeStream:t=>re("/api/Admin/simulate-youtube-stream",{method:"POST",body:JSON.stringify(t)}),endSimulatedStream:t=>re(`/api/Admin/streams/${t}/end-simulated`,{method:"POST"}),getClips:(t=1,e=20)=>re(`/api/Admin/clips?page=${t}&pageSize=${e}`),deleteClip:t=>re(`/api/Admin/clips/${t}`,{method:"DELETE"}),getVods:(t=1,e=20)=>re(`/api/Admin/vods?page=${t}&pageSize=${e}`),deleteVod:t=>re(`/api/Admin/vods/${t}`,{method:"DELETE"}),getMediaServerConfig:()=>re("/api/Admin/media-server/config"),setMediaServerUrls:(t,e)=>re("/api/Admin/media-server/set-url",{method:"POST",body:JSON.stringify({rtmpUrl:t,hlsBaseUrl:e})}),clearMediaServerUrls:()=>re("/api/Admin/media-server/clear-url",{method:"POST"})};let gt="overview",Ct=1,Ot=1,Gt=1,qt=1,Xi="",Wt="",xn="";function ps(){var a,s;const t=I.getState().currentUser;return((s=(a=t==null?void 0:t.roles)==null?void 0:a.includes)==null?void 0:s.call(a,"Admin"))?`
    <div>
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h1 style="font-family:var(--font-display);font-size:26px;color:#fff;margin:0;">
              ${N.admin} Cosmic Admin Center
            </h1>
            <span class="badge-role admin">SYSTEM ADMIN</span>
          </div>
          <p style="color:var(--color-text-muted);font-size:14px;margin-top:4px;">
            Comprehensive platform controls, account governance, and live stream moderation.
          </p>
        </div>
        <button id="admin-refresh-all" class="btn btn-ghost btn-sm">${N.refresh} Refresh Portal</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs">
        <button class="tab-btn ${gt==="overview"?"active":""}" data-admin-tab="overview">${N.grid} Overview</button>
        <button class="tab-btn ${gt==="users"?"active":""}" data-admin-tab="users">${N.user} User Accounts</button>
        <button class="tab-btn ${gt==="channels"?"active":""}" data-admin-tab="channels">${N.video} Channels</button>
        <button class="tab-btn ${gt==="streams"?"active":""}" data-admin-tab="streams"><span style="color:var(--color-live-red);">&#9679;</span> Live Moderation</button>
        <button class="tab-btn ${gt==="clips"?"active":""}" data-admin-tab="clips">${N.clip} Clips</button>
        <button class="tab-btn ${gt==="vods"?"active":""}" data-admin-tab="vods">${N.video} VOD Archives</button>
        <button class="tab-btn ${gt==="categories"?"active":""}" data-admin-tab="categories">${N.star} Categories</button>
        <button class="tab-btn ${gt==="media-server"?"active":""}" data-admin-tab="media-server">${N.settings} Media Server</button>
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
    `}function hs(){var t,e;(t=document.getElementById("admin-login-btn"))==null||t.addEventListener("click",()=>I.navigate("login")),(e=document.getElementById("admin-refresh-all"))==null||e.addEventListener("click",()=>Me()),document.querySelectorAll("[data-admin-tab]").forEach(a=>{a.addEventListener("click",()=>{gt=a.dataset.adminTab,document.querySelectorAll("[data-admin-tab]").forEach(s=>s.classList.remove("active")),a.classList.add("active"),Me()})}),Me()}async function Me(){const t=document.getElementById("admin-tab-body");if(t)switch(t.innerHTML='<div class="spinner"></div>',gt){case"overview":await fs(t);break;case"users":await ms(t);break;case"channels":await gs(t);break;case"streams":await _s(t);break;case"clips":await vs(t);break;case"vods":await ys(t);break;case"categories":await bs(t);break;case"media-server":await xs(t);break}}async function fs(t){var e,a,s;try{const d=await Qe.getStats();t.innerHTML=`
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-title">Platform Users</div>
          <div class="admin-stat-num">${d.totalUsers||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${N.user} Registered Accounts</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Channels</div>
          <div class="admin-stat-num">${d.totalChannels||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${N.video} Streamer Channels</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Active Broadcasts</div>
          <div class="admin-stat-num" style="color:${d.activeStreams>0?"var(--color-live-red)":"var(--color-text-muted)"};">${d.activeStreams||0}</div>
          <div style="font-size:12px;color:var(--color-live-red);">&#9679; Live Streams Now</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Highlight Clips</div>
          <div class="admin-stat-num">${d.totalClips||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${N.clip} Recorded Clips</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Categories</div>
          <div class="admin-stat-num">${d.totalCategories||0}</div>
          <div style="font-size:12px;color:var(--color-cyan-primary);">${N.grid} Stream Categories</div>
        </div>
      </div>

      <!-- Quick Platform Actions -->
      <div class="card" style="padding:24px;margin-bottom:24px;">
        <h3 style="font-size:16px;color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          ${N.rocket} Quick Administration Actions
        </h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button id="quick-users-btn" class="btn btn-cyan btn-sm">${N.user} Manage Accounts</button>
          <button id="quick-streams-btn" class="btn btn-outline btn-sm">${N.video} Monitor Live Broadcasts</button>
          <button id="quick-categories-btn" class="btn btn-ghost btn-sm">${N.grid} Add New Category</button>
        </div>
      </div>
    `,(e=document.getElementById("quick-users-btn"))==null||e.addEventListener("click",()=>{gt="users",wn(),Me()}),(a=document.getElementById("quick-streams-btn"))==null||a.addEventListener("click",()=>{gt="streams",wn(),Me()}),(s=document.getElementById("quick-categories-btn"))==null||s.addEventListener("click",()=>{gt="categories",wn(),Me()})}catch{t.innerHTML='<p class="text-muted">Failed to load platform overview statistics.</p>'}}async function ms(t){var e,a;try{const s=await Qe.getUsers(Ct,12,Xi,Wt),d=s.items||[],h=s.totalCount||d.length,g=Math.ceil(h/12)||1;t.innerHTML=`
      <!-- Toolbar -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <div class="search-bar" style="max-width:340px;height:40px;">
          ${N.search}
          <input type="text" id="admin-user-search" placeholder="Search by username or email..." value="${Ne(Xi)}" />
        </div>
        <select id="admin-role-filter" class="input-dark" style="width:160px;height:40px;border-radius:var(--radius-pill);padding:0 16px;">
          <option value="" ${Wt?"":"selected"}>All Roles</option>
          <option value="Admin" ${Wt==="Admin"?"selected":""}>Admin</option>
          <option value="Streamer" ${Wt==="Streamer"?"selected":""}>Streamer</option>
          <option value="Moderator" ${Wt==="Moderator"?"selected":""}>Moderator</option>
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
            ${d.map(u=>`
              <tr data-user-row="${u.id}">
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;overflow:hidden;">
                      ${u.profilePictureUrl?`<img src="${u.profilePictureUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(u.username||"U")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight:600;color:#fff;">${Ne(u.username||"Unknown")}</div>
                      <div style="font-size:12px;color:var(--color-text-muted);">${Ne(u.fullName||"")}</div>
                    </div>
                  </div>
                </td>
                <td style="color:var(--color-text-muted);">${Ne(u.email||"-")}</td>
                <td>
                  <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${(u.roles||[]).map(x=>`
                      <span class="badge-role ${x.toLowerCase()}">${Ne(x)}</span>
                    `).join("")}
                    ${!u.roles||!u.roles.length?'<span class="text-muted" style="font-size:12px;">Viewer</span>':""}
                  </div>
                </td>
                <td>
                  ${u.isLockedOut?'<span style="color:var(--color-error);font-size:12px;font-weight:600;">&#128274; Locked</span>':'<span style="color:var(--color-success);font-size:12px;font-weight:600;">&#9679; Active</span>'}
                </td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-edit-roles" data-uid="${u.id}" data-roles="${(u.roles||[]).join(",")}" data-uname="${Ne(u.username||"User")}" title="Manage Roles">
                      ${N.settings} Roles
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-account" data-uid="${u.id}" style="color:var(--color-error);" title="Delete Account">
                      ${N.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${d.length?"":'<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-muted);">No user accounts found matching your query.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="user-prev-page" class="btn btn-ghost btn-sm" ${Ct<=1?"disabled":""}>${N.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${Ct} of ${g} (${h} users)</span>
        <button id="user-next-page" class="btn btn-ghost btn-sm" ${Ct>=g?"disabled":""}>${N.chevronRight}</button>
      </div>
    `;const f=document.getElementById("admin-user-search"),_=document.getElementById("admin-user-search-btn"),b=document.getElementById("admin-role-filter");_==null||_.addEventListener("click",()=>{Xi=f.value.trim(),Wt=b.value,Ct=1,Me()}),f==null||f.addEventListener("keydown",u=>{u.key==="Enter"&&(Xi=f.value.trim(),Wt=b.value,Ct=1,Me())}),b==null||b.addEventListener("change",()=>{Wt=b.value,Ct=1,Me()}),(e=document.getElementById("user-prev-page"))==null||e.addEventListener("click",()=>{Ct>1&&(Ct--,Me())}),(a=document.getElementById("user-next-page"))==null||a.addEventListener("click",()=>{Ct<g&&(Ct++,Me())}),t.querySelectorAll(".btn-edit-roles").forEach(u=>{u.addEventListener("click",()=>ws(u.dataset.uid,(u.dataset.roles||"").split(",").filter(Boolean),u.dataset.uname))}),t.querySelectorAll(".btn-del-account").forEach(u=>{u.addEventListener("click",async()=>{const x=u.dataset.uid;if(confirm("Permanently delete this user account? All associated streams and data will be removed. This cannot be undone."))try{await Qe.deleteAccount(x),I.showToast("Account deleted successfully","info"),Me()}catch(m){I.showToast(m.message||"Failed to delete account","error")}})})}catch{t.innerHTML='<p class="text-muted">Failed to load user accounts.</p>'}}async function gs(t){var e,a,s;try{const d=await Qe.getChannels(Ot,12,xn),h=d.items||[],g=Math.ceil((d.totalCount||h.length)/12)||1;t.innerHTML=`
      <!-- Toolbar -->
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <div class="search-bar" style="max-width:340px;height:40px;">
          ${N.search}
          <input type="text" id="admin-channel-search" placeholder="Search channels by name or owner..." value="${Ne(xn)}" />
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
            ${h.map(f=>`
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--color-cyan-primary),var(--color-cyan-neon));display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;overflow:hidden;">
                      ${f.profilePhotoUrl?`<img src="${f.profilePhotoUrl}" style="width:100%;height:100%;object-fit:cover;" />`:(f.channelName||"C")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight:600;color:#fff;">${Ne(f.channelName)}</div>
                      <div style="font-size:12px;color:var(--color-text-muted);">${Ne(f.description||"No description")}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight:500;">${Ne(f.ownerUsername||"Owner")}</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">${Ne(f.ownerEmail||"")}</div>
                </td>
                <td>
                  ${f.isLive?`<span class="badge-live">LIVE (${f.currentViewers} viewers)</span>`:'<span class="text-muted" style="font-size:12px;">Offline</span>'}
                </td>
                <td>
                  ${f.hasStreamKey?'<span style="color:var(--color-success);font-size:12px;">Configured</span>':'<span style="color:var(--color-warning);font-size:12px;">Not Generated</span>'}
                </td>
                <td style="color:var(--color-text-muted);font-size:13px;">${f.createdAt?new Date(f.createdAt).toLocaleDateString():"-"}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-visit-channel" data-cid="${f.id}" title="Visit Channel">
                      ${N.rocket} Visit
                    </button>
                    <button class="btn btn-ghost btn-sm btn-reset-skey" data-cid="${f.id}" title="Reset Stream Key">
                      ${N.refresh} Reset Key
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-channel" data-cid="${f.id}" style="color:var(--color-error);" title="Delete Channel">
                      ${N.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${h.length?"":'<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted);">No channels found.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="ch-prev-page" class="btn btn-ghost btn-sm" ${Ot<=1?"disabled":""}>${N.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${Ot} of ${g}</span>
        <button id="ch-next-page" class="btn btn-ghost btn-sm" ${Ot>=g?"disabled":""}>${N.chevronRight}</button>
      </div>
    `,(e=document.getElementById("admin-channel-search-btn"))==null||e.addEventListener("click",()=>{var f,_;xn=((_=(f=document.getElementById("admin-channel-search"))==null?void 0:f.value)==null?void 0:_.trim())||"",Ot=1,Me()}),(a=document.getElementById("ch-prev-page"))==null||a.addEventListener("click",()=>{Ot>1&&(Ot--,Me())}),(s=document.getElementById("ch-next-page"))==null||s.addEventListener("click",()=>{Ot<g&&(Ot++,Me())}),t.querySelectorAll(".btn-visit-channel").forEach(f=>{f.addEventListener("click",()=>I.navigate("channel",{channelId:parseInt(f.dataset.cid)}))}),t.querySelectorAll(".btn-reset-skey").forEach(f=>{f.addEventListener("click",async()=>{if(confirm("Regenerate RTMP stream key for this channel? The streamer will need to update OBS settings."))try{const _=await Qe.resetChannelStreamKey(parseInt(f.dataset.cid));I.showToast("Stream key regenerated successfully","success")}catch(_){I.showToast(_.message||"Failed to reset stream key","error")}})}),t.querySelectorAll(".btn-del-channel").forEach(f=>{f.addEventListener("click",async()=>{if(confirm("Permanently delete this channel? Streamer role and all associated stream data will be affected."))try{await Qe.deleteChannel(parseInt(f.dataset.cid)),I.showToast("Channel deleted successfully","info"),Me()}catch(_){I.showToast(_.message||"Failed to delete channel","error")}})})}catch{t.innerHTML='<p class="text-muted">Failed to load channels.</p>'}}async function _s(t){var e,a;try{const[s,d,h]=await Promise.allSettled([Qe.getLiveStreams(),Qe.getChannels(1,100),_t.getAll()]),g=s.status==="fulfilled"?s.value:[],f=d.status==="fulfilled"&&((e=d.value)!=null&&e.items)?d.value.items:[],_=h.status==="fulfilled"&&Array.isArray(h.value)?h.value:[];t.innerHTML=`
      <!-- YouTube Simulation Relay Ingest Card -->
      <div class="card" style="margin-bottom:24px;background:rgba(255,0,60,0.03);border:1px solid rgba(255,0,60,0.22);border-radius:var(--radius-lg);padding:24px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:38px;height:38px;border-radius:8px;background:rgba(255,0,60,0.15);color:#ff3344;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;">
            ▶
          </div>
          <div>
            <h3 style="font-size:16px;color:#fff;margin:0;font-weight:700;">Simulate Live Stream (YouTube Relay Ingest)</h3>
            <p style="color:var(--color-text-muted);font-size:13px;margin:2px 0 0;">
              Paste any YouTube Live URL to simulate an active live broadcast on a chosen channel for testing player, chat, and room dynamics without saving VODs.
            </p>
          </div>
        </div>

        <form id="admin-simulate-youtube-form" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;align-items:end;margin-top:16px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">Target Channel</label>
            <select id="sim-channel-id" class="input-dark" style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;" required>
              <option value="">Select Channel...</option>
              ${f.map(u=>`<option value="${u.id}">${Ne(u.channelName)} (@${Ne(u.ownerUsername)})</option>`).join("")}
            </select>
          </div>

          <div style="grid-column: span 2;">
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">YouTube Live / Video URL</label>
            <input type="url" id="sim-youtube-url" class="input-dark" placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/live/..." style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;" required />
          </div>

          <div>
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">Stream Title (Optional)</label>
            <input type="text" id="sim-stream-title" class="input-dark" placeholder="e.g. 24/7 Lo-Fi Beats Test" style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;" />
          </div>

          <div>
            <label style="display:block;font-size:12px;color:var(--color-text-muted);margin-bottom:6px;font-weight:600;">Category</label>
            <select id="sim-category-id" class="input-dark" style="width:100%;height:40px;border-radius:var(--radius-md);padding:0 12px;">
              <option value="">Select Category (Optional)</option>
              ${_.map(u=>`<option value="${u.id}">${Ne(u.name)}</option>`).join("")}
            </select>
          </div>

          <div>
            <button type="submit" id="sim-submit-btn" class="btn btn-sm" style="background:#ff3344;color:#fff;font-weight:600;width:100%;height:40px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;gap:8px;">
              Launch Simulated Stream
            </button>
          </div>
        </form>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:16px;color:#fff;margin:0;">Active Live Broadcasts (${g.length})</h3>
        <button id="refresh-live-streams-btn" class="btn btn-ghost btn-sm">${N.refresh} Refresh</button>
      </div>

      <div class="card" style="padding:0;overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Broadcast</th>
              <th>Streamer / Channel</th>
              <th>Type</th>
              <th>Category</th>
              <th>Viewers</th>
              <th>Started</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${g.map(u=>`
              <tr>
                <td>
                  <div style="font-weight:600;color:#fff;">${Ne(u.title||"Untitled Stream")}</div>
                  <div style="font-size:12px;color:var(--color-text-muted);">Stream ID: ${u.streamId}</div>
                </td>
                <td>
                  <div style="font-weight:500;">${Ne(u.streamerName||"Streamer")}</div>
                  <div style="font-size:12px;color:var(--color-cyan-primary);">${Ne(u.channelName||"")}</div>
                </td>
                <td>
                  ${u.isSimulated?`
                    <span class="badge" style="background:rgba(255,0,50,0.15);color:#ff4455;border:1px solid rgba(255,0,50,0.3);font-size:11px;padding:2px 8px;border-radius:12px;display:inline-flex;align-items:center;gap:4px;">
                      ▶ YouTube
                    </span>
                  `:`
                    <span class="badge" style="background:rgba(0,255,200,0.1);color:var(--color-cyan-primary);font-size:11px;padding:2px 8px;border-radius:12px;">
                      RTMP / HLS
                    </span>
                  `}
                </td>
                <td>
                  ${u.categoryName?`<span class="badge-category">${Ne(u.categoryName)}</span>`:'<span class="text-muted">-</span>'}
                </td>
                <td>
                  <span class="badge-viewers" style="background:rgba(255,20,0,0.15);color:var(--color-live-red);font-weight:700;">
                    &#9679; ${u.viewerCount||0}
                  </span>
                </td>
                <td style="color:var(--color-text-muted);font-size:13px;">${u.startedAt?new Date(u.startedAt).toLocaleTimeString():"-"}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm btn-watch-stream" data-sid="${u.streamId}">
                      ${N.eye} Watch
                    </button>
                    ${u.isSimulated?`
                      <button class="btn btn-danger btn-sm btn-end-sim" data-sid="${u.streamId}" style="padding:0 14px;height:32px;font-size:12px;background:rgba(255,0,50,0.18);border:1px solid #ff3344;color:#ff4455;">
                        End Simulation
                      </button>
                    `:`
                      <button class="btn btn-danger btn-sm btn-force-end" data-sid="${u.streamId}" style="padding:0 14px;height:32px;font-size:12px;">
                        Force Terminate
                      </button>
                    `}
                  </div>
                </td>
              </tr>
            `).join("")}
            ${g.length?"":'<tr><td colspan="7" style="text-align:center;padding:48px;color:var(--color-text-muted);">No streams are currently broadcasting live across the platform.</td></tr>'}
          </tbody>
        </table>
      </div>
    `,(a=document.getElementById("refresh-live-streams-btn"))==null||a.addEventListener("click",()=>Me());const b=document.getElementById("admin-simulate-youtube-form");b&&b.addEventListener("submit",async u=>{var P,$,z,D,F,E;u.preventDefault();const x=(P=document.getElementById("sim-channel-id"))==null?void 0:P.value,m=(z=($=document.getElementById("sim-youtube-url"))==null?void 0:$.value)==null?void 0:z.trim(),y=(F=(D=document.getElementById("sim-stream-title"))==null?void 0:D.value)==null?void 0:F.trim(),S=(E=document.getElementById("sim-category-id"))==null?void 0:E.value;if(!x||!m){I.showToast("Please select a channel and enter a YouTube URL","error");return}const w=document.getElementById("sim-submit-btn");w&&(w.disabled=!0,w.innerHTML="Starting...");try{await Qe.simulateYoutubeStream({channelId:parseInt(x),youtubeUrl:m,title:y||null,categoryId:S?parseInt(S):null}),I.showToast("YouTube live simulation started successfully!","success"),Me()}catch(Y){I.showToast(Y.message||"Failed to start YouTube simulation","error"),w&&(w.disabled=!1,w.innerHTML="Launch Simulated Stream")}}),t.querySelectorAll(".btn-watch-stream").forEach(u=>{u.addEventListener("click",()=>{I.navigate("watch",{streamId:parseInt(u.dataset.sid)})})}),t.querySelectorAll(".btn-end-sim").forEach(u=>{u.addEventListener("click",async()=>{const x=parseInt(u.dataset.sid);if(confirm(`End YouTube simulation for stream #${x}?`))try{await Qe.endSimulatedStream(x),I.showToast("Simulated stream ended successfully","success"),Me()}catch(m){I.showToast(m.message||"Failed to end simulation","error")}})}),t.querySelectorAll(".btn-force-end").forEach(u=>{u.addEventListener("click",async()=>{const x=parseInt(u.dataset.sid);if(confirm(`Are you sure you want to FORCE END stream #${x}? The RTMP stream and viewers will be disconnected immediately.`))try{await Qe.forceEndStream(x),I.showToast("Live stream terminated successfully","success"),Me()}catch(m){I.showToast(m.message||"Failed to terminate stream","error")}})})}catch{t.innerHTML='<p class="text-muted">Failed to load active live streams.</p>'}}async function vs(t){var e,a,s;try{const d=await Qe.getClips(Gt,16),h=d.items||[],g=Math.ceil((d.totalCount||h.length)/16)||1;t.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:16px;color:#fff;margin:0;">Platform Highlight Clips (${d.totalCount||h.length})</h3>
        <button id="refresh-clips-admin-btn" class="btn btn-ghost btn-sm">${N.refresh} Refresh</button>
      </div>

      <div class="clips-grid" style="margin-bottom:24px;">
        ${h.map(f=>`
          <div class="card clip-card hover-lift" data-clip-id="${f.id}">
            <div class="clip-thumb">
              <img src="${ht}" data-thumb-src="${f.thumbnailUrl||""}" alt="${Ne(f.title)}" />
              <span class="clip-views">${N.eye} ${f.viewCount||0}</span>
              ${f.durationSeconds?`<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);padding:2px 8px;border-radius:4px;font-size:11px;">${Math.round(f.durationSeconds)}s</span>`:""}
            </div>
            <div class="clip-info">
              <div class="clip-title truncate">${Ne(f.title||"Untitled Clip")}</div>
              <div class="clip-meta" style="display:flex;justify-content:space-between;margin-top:4px;">
                <span>by ${Ne(f.creatorName||"Streamer")}</span>
                <button class="btn-del-clip" data-cid="${f.id}" style="color:var(--color-error);font-size:12px;font-weight:600;padding:2px 6px;cursor:pointer;">Delete</button>
              </div>
            </div>
          </div>
        `).join("")}
        ${h.length?"":'<div class="empty-state" style="grid-column:1/-1;"><h3>No Clips Available</h3></div>'}
      </div>

      <div class="pagination">
        <button id="clip-prev-page" class="btn btn-ghost btn-sm" ${Gt<=1?"disabled":""}>${N.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${Gt} of ${g}</span>
        <button id="clip-next-page" class="btn btn-ghost btn-sm" ${Gt>=g?"disabled":""}>${N.chevronRight}</button>
      </div>
    `,Et(t),(e=document.getElementById("refresh-clips-admin-btn"))==null||e.addEventListener("click",()=>Me()),(a=document.getElementById("clip-prev-page"))==null||a.addEventListener("click",()=>{Gt>1&&(Gt--,Me())}),(s=document.getElementById("clip-next-page"))==null||s.addEventListener("click",()=>{Gt<g&&(Gt++,Me())}),t.querySelectorAll(".clip-card").forEach(f=>{f.addEventListener("click",_=>{if(_.target.closest(".btn-del-clip"))return;const b=parseInt(f.dataset.clipId),u=h.find(x=>x.id===b);u&&zi(u)})}),t.querySelectorAll(".btn-del-clip").forEach(f=>{f.addEventListener("click",async _=>{_.stopPropagation();const b=parseInt(f.dataset.cid);if(confirm("Are you sure you want to permanently delete this clip?"))try{await Qe.deleteClip(b),I.showToast("Clip deleted successfully","info"),Me()}catch(u){I.showToast(u.message||"Failed to delete clip","error")}})})}catch{t.innerHTML='<p class="text-muted">Failed to load platform clips.</p>'}}async function ys(t){var e,a,s;try{const d=await Qe.getVods(qt,15),h=d.items||[],g=d.totalCount||0,f=Math.ceil(g/15)||1;t.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <h3 style="margin:0;font-size:18px;">VOD Archives Management (${g} Total)</h3>
        <button id="refresh-vods-btn" class="btn btn-ghost btn-sm">${N.refresh} Refresh</button>
      </div>

      <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:70px;">Preview</th>
              <th>Broadcast Title</th>
              <th>Streamer / Channel</th>
              <th>Duration</th>
              <th>Views</th>
              <th>Chat Messages</th>
              <th>Recorded At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${h.map(_=>`
              <tr data-vod-row="${_.id}">
                <td>
                  <div style="width:60px;height:36px;border-radius:6px;overflow:hidden;background:#000;position:relative;">
                    <img src="${ht}" data-thumb-src="${_.thumbnailUrl||""}" style="width:100%;height:100%;object-fit:cover;" alt="" />
                  </div>
                </td>
                <td style="font-weight:600;color:#fff;">${Ne(_.title||"Untitled Broadcast")}</td>
                <td>
                  <span style="color:var(--color-cyan-neon,#00f2fe);">${Ne(_.streamerName||_.channelName||"Streamer")}</span>
                </td>
                <td style="color:var(--color-text-muted);">${_.duration||"-"}</td>
                <td>${_.rewatchCount||0}</td>
                <td style="color:var(--color-text-muted);">${_.chatMessageCount||0} msgs</td>
                <td style="color:var(--color-text-muted);font-size:12px;">${_.startedAt?new Date(_.startedAt).toLocaleDateString():"-"}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-outline btn-sm btn-watch-vod" data-vid="${_.id}" style="padding:4px 10px;">
                      ${N.play} Watch
                    </button>
                    <button class="btn btn-ghost btn-sm btn-del-vod" data-vid="${_.id}" style="color:var(--color-error);" title="Delete VOD">
                      ${N.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${h.length?"":'<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--color-text-muted);">No recorded VODs found on the platform.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button id="vod-prev-page" class="btn btn-ghost btn-sm" ${qt<=1?"disabled":""}>${N.chevronLeft}</button>
        <span style="color:var(--color-text-muted);font-size:14px;">Page ${qt} of ${f} (${g} VODs)</span>
        <button id="vod-next-page" class="btn btn-ghost btn-sm" ${qt>=f?"disabled":""}>${N.chevronRight}</button>
      </div>
    `,Et(t),(e=document.getElementById("refresh-vods-btn"))==null||e.addEventListener("click",()=>Me()),(a=document.getElementById("vod-prev-page"))==null||a.addEventListener("click",()=>{qt>1&&(qt--,Me())}),(s=document.getElementById("vod-next-page"))==null||s.addEventListener("click",()=>{qt<f&&(qt++,Me())}),t.querySelectorAll(".btn-watch-vod").forEach(_=>{_.addEventListener("click",()=>{const b=parseInt(_.dataset.vid),u=h.find(x=>x.id===b);u&&Vn(u)})}),t.querySelectorAll(".btn-del-vod").forEach(_=>{_.addEventListener("click",async()=>{const b=parseInt(_.dataset.vid);if(confirm("Permanently delete this VOD and its recorded chat replay from the system?"))try{await Qe.deleteVod(b),I.showToast("VOD deleted successfully","info"),Me()}catch(u){I.showToast(u.message||"Failed to delete VOD","error")}})})}catch{t.innerHTML='<p class="text-muted">Failed to load VOD archives.</p>'}}async function bs(t){var e;try{const a=await _t.getAll();t.innerHTML=`
      <!-- Create Category Form -->
      <div class="card" style="padding:24px;margin-bottom:24px;">
        <h4 style="color:#fff;font-size:15px;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          ${N.plus} Add New Category
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
            ${(a||[]).map(s=>`
              <tr>
                <td>
                  <div style="width:40px;height:52px;border-radius:6px;overflow:hidden;background:var(--bg-gradient-card);display:flex;align-items:center;justify-content:center;">
                    ${s.imageUrl?`<img src="${s.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />`:'<span style="font-size:18px;">&#127918;</span>'}
                  </div>
                </td>
                <td style="font-weight:600;color:#fff;">${Ne(s.name)}</td>
                <td style="color:var(--color-text-muted);">${Ne(s.slug)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <label class="btn btn-ghost btn-sm" style="cursor:pointer;" title="Upload Cover">
                      ${N.upload} Image
                      <input type="file" data-cat-img="${s.id}" accept="image/*" style="display:none;" />
                    </label>
                    <button class="btn btn-ghost btn-sm" data-del-cat="${s.id}" style="color:var(--color-error);" title="Delete Category">
                      ${N.trash}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
            ${a!=null&&a.length?"":'<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--color-text-muted);">No categories created yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `,(e=document.getElementById("admin-cat-form"))==null||e.addEventListener("submit",async s=>{var g,f,_,b;s.preventDefault();const d=(f=(g=document.getElementById("admin-cat-name"))==null?void 0:g.value)==null?void 0:f.trim(),h=(b=(_=document.getElementById("admin-cat-slug"))==null?void 0:_.value)==null?void 0:b.trim();if(!(!d||!h))try{await _t.create({name:d,slug:h}),I.showToast("Category created successfully!","success"),Me()}catch(u){I.showToast(u.message||"Failed to create category","error")}}),t.querySelectorAll("[data-del-cat]").forEach(s=>{s.addEventListener("click",async()=>{if(confirm("Delete this category?"))try{await _t.delete(parseInt(s.dataset.delCat)),I.showToast("Category deleted","info"),Me()}catch(d){I.showToast(d.message||"Failed to delete category","error")}})}),t.querySelectorAll("[data-cat-img]").forEach(s=>{s.addEventListener("change",async d=>{if(d.target.files&&d.target.files[0]){const h=d.target.files[0],g=parseInt(s.dataset.catImg);rn(h,{aspectRatio:3/4,title:"Crop Category Cover (3:4)"},async f=>{try{await _t.uploadImage(g,f),I.showToast("Category image uploaded!","success"),Me()}catch(_){I.showToast(_.message||"Failed to upload image","error")}}),s.value=""}})})}catch{t.innerHTML='<p class="text-muted">Failed to load categories.</p>'}}async function xs(t){var e,a;try{const s=await Qe.getMediaServerConfig(),d=s.isCustomConfigured;t.innerHTML=`
      <div style="max-width:800px;">
        <div class="card" style="padding:28px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
              <h3 style="color:#fff;font-size:18px;margin:0;display:flex;align-items:center;gap:8px;">
                ${N.settings} Media Server Streaming Ingest & Playback
              </h3>
              <p style="color:var(--color-text-muted);font-size:13px;margin:4px 0 0 0;">
                Configure the RTMP broadcast ingest endpoint and HLS playback base URLs used for live streaming across the platform.
              </p>
            </div>
            <span class="badge" style="background:${d?"rgba(0,242,254,0.15)":"rgba(255,255,255,0.08)"};color:${d?"var(--color-cyan-primary)":"var(--color-text-muted)"};border:1px solid ${d?"rgba(0,242,254,0.3)":"rgba(255,255,255,0.1)"};padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">
              ${d?"Custom URLs Active":"Default URLs Active"}
            </span>
          </div>

          <form id="admin-media-server-form" style="display:flex;flex-direction:column;gap:18px;">
            <div class="form-group">
              <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-muted);margin-bottom:6px;">
                RTMP Ingest Server URL (used by OBS, Streamlabs, vMix)
              </label>
              <div class="input-wrapper" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:2px 12px;display:flex;align-items:center;">
                <span class="input-icon" style="color:var(--color-cyan-primary);margin-right:8px;">${N.video}</span>
                <input class="input-dark" id="admin-media-rtmp" type="text" value="${Ne(s.effectiveRtmpUrl||"")}" placeholder="e.g. rtmp://stream.orbit.live/live" required style="width:100%;background:transparent;border:none;color:#fff;padding:10px 0;" />
              </div>
              <span style="font-size:11px;color:var(--color-text-muted);margin-top:4px;display:block;">Default: <code>rtmp://localhost/live</code></span>
            </div>

            <div class="form-group">
              <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-muted);margin-bottom:6px;">
                HLS Playback Base URL (HTTP / HTTPS live video delivery)
              </label>
              <div class="input-wrapper" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:2px 12px;display:flex;align-items:center;">
                <span class="input-icon" style="color:var(--color-cyan-primary);margin-right:8px;">${N.play}</span>
                <input class="input-dark" id="admin-media-hls" type="text" value="${Ne(s.effectiveHlsBaseUrl||"")}" placeholder="e.g. https://cdn.orbit.live/hls" required style="width:100%;background:transparent;border:none;color:#fff;padding:10px 0;" />
              </div>
              <span style="font-size:11px;color:var(--color-text-muted);margin-top:4px;display:block;">Default: <code>https://localhost:8443/hls</code> (Secure HTTPS) or <code>http://localhost:8080/hls</code> (HTTP). (Format: <code>{hlsBaseUrl}/{streamKey}.m3u8</code>)</span>
              <div style="font-size:12px;color:var(--color-cyan-neon,#00f2fe);margin-top:8px;padding:8px 12px;background:rgba(0,242,254,0.06);border:1px solid rgba(0,242,254,0.15);border-radius:6px;display:flex;flex-direction:column;gap:4px;">
                <div>Clips Base URL: <strong style="color:#fff;">${Ne(s.clipsBaseUrl||(s.effectiveHlsBaseUrl?s.effectiveHlsBaseUrl.replace("/hls","/clips"):"http://localhost:8080/clips"))}</strong></div>
                <div>Recordings (VOD) Base URL: <strong style="color:#fff;">${Ne(s.recordingsBaseUrl||(s.effectiveHlsBaseUrl?s.effectiveHlsBaseUrl.replace("/hls","/recordings"):"http://localhost:8080/recordings"))}</strong></div>
              </div>
            </div>

            <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap;">
              <button type="button" id="admin-media-reset-btn" class="btn btn-ghost btn-sm" style="color:var(--color-text-muted);">
                Reset to System Defaults
              </button>
              <button type="submit" id="admin-media-save-btn" class="btn btn-cyan btn-sm" style="min-width:140px;">
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        <div class="card" style="padding:20px;background:rgba(0,242,254,0.03);border:1px solid rgba(0,242,254,0.15);">
          <h4 style="color:var(--color-cyan-primary);margin:0 0 8px 0;font-size:14px;display:flex;align-items:center;gap:6px;">
            ${N.info} Deployment & HTTPS / Localhost Notes
          </h4>
          <p style="font-size:12px;color:var(--color-text-muted);line-height:1.6;margin:0 0 8px 0;">
            Changing these endpoints updates live stream ingest, HLS manifests, clips delivery, and VOD playback URLs across the platform immediately.
          </p>
          <p style="font-size:12px;color:var(--color-text-muted);line-height:1.6;margin:0;">
            <strong style="color:#fff;">Important for Localhost Testing:</strong> Modern browsers strictly block plaintext HTTP media requests (like <code>http://localhost:8080</code>) on HTTPS websites (such as GitHub Pages). If testing with a local NGINX server on your computer, run the frontend locally with <code style="color:var(--color-cyan-neon,#00f2fe);">npm run dev</code> (at <code>http://localhost:5173</code>), which connects directly to the MonsterASP backend without any mixed-content restrictions. Alternatively, configure an HTTPS tunnel (e.g. ngrok HTTPS URL) above for online playback on HTTPS pages.
          </p>
        </div>
      </div>
    `,(e=document.getElementById("admin-media-server-form"))==null||e.addEventListener("submit",async h=>{var _,b,u,x;h.preventDefault();const g=(b=(_=document.getElementById("admin-media-rtmp"))==null?void 0:_.value)==null?void 0:b.trim(),f=(x=(u=document.getElementById("admin-media-hls"))==null?void 0:u.value)==null?void 0:x.trim();if(!g||!f){I.showToast("Please fill in both RTMP and HLS URLs","error");return}try{await Qe.setMediaServerUrls(g,f),await Mt(!0),I.showToast("Media server URLs updated successfully!","success"),Me()}catch(m){I.showToast(m.message||"Failed to update media server URLs","error")}}),(a=document.getElementById("admin-media-reset-btn"))==null||a.addEventListener("click",async()=>{if(confirm("Reset media server URLs to local development defaults?"))try{await Qe.clearMediaServerUrls(),await Mt(!0),I.showToast("Reset to default media server URLs","info"),Me()}catch(h){I.showToast(h.message||"Failed to reset media server URLs","error")}})}catch{t.innerHTML='<p class="text-muted">Failed to load media server configuration.</p>'}}function ws(t,e,a=""){var g,f,_;const s=document.getElementById("admin-modal-root")||document.body,d=document.createElement("div");d.className="modal-overlay",d.innerHTML=`
    <div class="modal-content" style="max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;">Manage Roles ${a?`for @${Ne(a)}`:""}</h3>
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
  `,s.appendChild(d);const h=()=>d.remove();(g=d.querySelector("#close-roles-modal"))==null||g.addEventListener("click",h),(f=d.querySelector("#cancel-roles-btn"))==null||f.addEventListener("click",h),(_=d.querySelector("#save-roles-btn"))==null||_.addEventListener("click",async()=>{const b=[];d.querySelector("#role-admin").checked&&b.push("Admin"),d.querySelector("#role-streamer").checked&&b.push("Streamer"),d.querySelector("#role-mod").checked&&b.push("Moderator");try{await Qe.updateUserRoles(t,b),I.showToast("User roles updated successfully","success"),h(),Me()}catch(u){I.showToast(u.message||"Failed to update roles","error")}})}function wn(){document.querySelectorAll("[data-admin-tab]").forEach(t=>{t.classList.toggle("active",t.dataset.adminTab===gt)})}function Ne(t){return t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}let ei=null,hi=null;function Ss(){var t;return hi=(t=I.getState().viewParams)==null?void 0:t.channelId,`
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
          <button id="mod-chat-send">${N.send}</button>
        </div>
      </div>

      <!-- Mod Actions Panel -->
      <div style="width:320px;border-left:1px solid rgba(0,174,189,0.1);padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;">
        <h3 style="font-family:var(--font-display);color:var(--color-cyan-neon);font-size:16px;">${N.shield} Mod Actions</h3>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Timeout User</h4>
          <input class="input-dark" id="mod-timeout-user" placeholder="Username" style="margin-bottom:8px;" />
          <div style="display:flex;gap:6px;">
            <input class="input-dark" type="number" id="mod-timeout-dur" value="300" min="10" max="86400" style="flex:1;" />
            <button id="mod-timeout-btn" class="btn btn-sm" style="background:var(--color-warning);color:#000;">${N.clock} Timeout</button>
          </div>
        </div>

        <div class="card" style="padding:16px;">
          <h4 style="font-size:13px;color:var(--color-text-muted);margin-bottom:10px;">Ban User</h4>
          <input class="input-dark" id="mod-ban-user" placeholder="Username" style="margin-bottom:8px;" />
          <input class="input-dark" id="mod-ban-reason" placeholder="Reason (optional)" style="margin-bottom:8px;" />
          <button id="mod-ban-btn" class="btn btn-danger btn-sm btn-full">${N.ban} Ban</button>
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
  `}function Es(){var s,d,h;if(!hi){I.showToast("No channel specified","error");return}ks(hi);const t=document.getElementById("mod-chat-input"),e=document.getElementById("mod-chat-send"),a=()=>{const g=t==null?void 0:t.value.trim();!g||!ei||(ei.invoke("SendMessage",g).catch(f=>console.error(f)),t.value="")};e==null||e.addEventListener("click",a),t==null||t.addEventListener("keydown",g=>{g.key==="Enter"&&a()}),(s=document.getElementById("mod-timeout-btn"))==null||s.addEventListener("click",async()=>{const g=document.getElementById("mod-timeout-user").value.trim(),f=parseInt(document.getElementById("mod-timeout-dur").value)||300;if(g)try{await zt.timeoutUser(hi,{username:g,durationSeconds:f}),I.showToast(`${g} timed out for ${f}s`,"warning")}catch(_){I.showToast(_.message,"error")}}),(d=document.getElementById("mod-ban-btn"))==null||d.addEventListener("click",async()=>{const g=document.getElementById("mod-ban-user").value.trim(),f=document.getElementById("mod-ban-reason").value.trim();if(g)try{await zt.banUser(hi,{username:g,reason:f}),I.showToast(`${g} has been banned`,"error")}catch(_){I.showToast(_.message,"error")}}),(h=document.getElementById("mod-unban-btn"))==null||h.addEventListener("click",async()=>{const g=document.getElementById("mod-unban-user").value.trim();if(g)try{await zt.unbanUser(hi,g),I.showToast(`${g} has been unbanned`,"success")}catch(f){I.showToast(f.message,"error")}})}async function ks(t){const e=document.getElementById("mod-status"),a=document.getElementById("mod-chat-messages");if(a)try{const s=xi();ei=new Aa().withUrl(`${Oi}/hubs/stream-chat`,{accessTokenFactory:()=>s}).withAutomaticReconnect().build(),ei.on("ReceiveMessage",d=>{var g,f,_;const h=document.createElement("div");h.className="chat-msg",h.style.display="flex",h.style.justifyContent="space-between",h.style.alignItems="flex-start",h.innerHTML=`
        <div>
          <span class="chat-user" style="color:${d.color||"#00AEBD"};">${d.username}:</span>
          <span class="chat-text">${Cs(d.content)}</span>
        </div>
        <div class="mod-actions" style="flex-shrink:0;margin-left:8px;">
          <button class="mod-action-btn delete" title="Delete message" data-msg-id="${d.id}">&#128465;</button>
          <button class="mod-action-btn timeout" title="Timeout user" data-timeout-user="${d.username}">&#9201;</button>
          <button class="mod-action-btn ban" title="Ban user" data-ban-user="${d.username}">&#128683;</button>
        </div>
      `,a.appendChild(h),a.scrollTop=a.scrollHeight,(g=h.querySelector("[data-msg-id]"))==null||g.addEventListener("click",async()=>{try{await zt.deleteMessage(t,d.id),h.style.opacity="0.3",I.showToast("Message deleted","info")}catch(b){I.showToast(b.message,"error")}}),(f=h.querySelector("[data-timeout-user]"))==null||f.addEventListener("click",async()=>{try{await zt.timeoutUser(t,{username:d.username,durationSeconds:300}),I.showToast(`${d.username} timed out`,"warning")}catch(b){I.showToast(b.message,"error")}}),(_=h.querySelector("[data-ban-user]"))==null||_.addEventListener("click",async()=>{if(confirm(`Ban ${d.username}?`))try{await zt.banUser(t,{username:d.username,reason:"Banned by moderator"}),I.showToast(`${d.username} banned`,"error")}catch(b){I.showToast(b.message,"error")}})}),ei.on("SystemMessage",d=>{const h=document.createElement("div");h.className="chat-msg",h.innerHTML=`<span style="color:var(--color-warning);font-style:italic;">&#9888; ${d}</span>`,a.appendChild(h)}),await ei.start(),await ei.invoke("JoinChannel",t),e&&(e.textContent="Connected",e.style.color="var(--color-success)")}catch{e&&(e.textContent="Disconnected",e.style.color="var(--color-error)")}}function Cs(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function As(){const t=localStorage.getItem("orbit_theme")||"dark",e=localStorage.getItem("orbit_pref_autoplay")!=="false",a=localStorage.getItem("orbit_pref_low_latency")!=="false",s=localStorage.getItem("orbit_pref_chat_timestamps")==="true";localStorage.getItem("orbit_pref_chat_sound");const d=localStorage.getItem("orbit_pref_chat_font_size")||"normal",h=localStorage.getItem("orbit_pref_volume")||"80";return`
    <div style="max-width:960px;margin:0 auto;padding:24px 16px;">
      <!-- Page Header -->
      <div style="margin-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:20px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,rgba(0,174,189,0.2),rgba(0,242,254,0.1));border:1px solid var(--color-cyan-primary);display:flex;align-items:center;justify-content:center;color:var(--color-cyan-primary);font-size:24px;">
            ${N.settings}
          </div>
          <div>
            <h1 style="font-size:26px;font-family:var(--font-display);color:#fff;margin:0;">System & Platform Settings</h1>
            <p style="color:var(--color-text-muted);font-size:14px;margin:4px 0 0;">
              Customize your Orbit experience, toggle display themes, and tune audio/video playback.
            </p>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:32px;">
        <!-- 1. Appearance & Theme -->
        <section class="card" style="padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="color:var(--color-cyan-primary);font-size:20px;">${N.palette||"🎨"}</span>
            <h2 style="font-size:18px;color:#fff;margin:0;font-weight:700;">Appearance & Theme</h2>
          </div>
          <p style="color:var(--color-text-muted);font-size:13px;margin:0 0 20px;">
            Switch between deep space dark mode and high-contrast stellar light mode.
          </p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;">
            <!-- Dark Theme Card -->
            <div class="theme-choice-card ${t==="dark"?"active-theme":""}" data-theme-mode="dark" style="cursor:pointer;padding:20px;border-radius:var(--radius-lg);border:2px solid ${t==="dark"?"var(--color-cyan-primary)":"rgba(255,255,255,0.1)"};background:rgba(15,20,36,0.9);box-shadow:${t==="dark"?"0 0 20px rgba(0,174,189,0.2)":"none"};transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:20px;">🌌</span>
                ${t==="dark"?'<span style="background:var(--color-cyan-primary);color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">ACTIVE</span>':""}
              </div>
              <div style="font-weight:700;color:#fff;font-size:16px;margin-bottom:4px;">Cosmic Dark</div>
              <div style="font-size:12px;color:var(--color-text-muted);line-height:1.4;">
                Deep space midnight palette tailored for low-light streaming environments.
              </div>
            </div>

            <!-- Light Theme Card -->
            <div class="theme-choice-card ${t==="light"?"active-theme":""}" data-theme-mode="light" style="cursor:pointer;padding:20px;border-radius:var(--radius-lg);border:2px solid ${t==="light"?"var(--color-cyan-primary)":"rgba(255,255,255,0.1)"};background:rgba(255,255,255,0.06);box-shadow:${t==="light"?"0 0 20px rgba(0,174,189,0.2)":"none"};transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:20px;">☀️</span>
                ${t==="light"?'<span style="background:var(--color-cyan-primary);color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">ACTIVE</span>':""}
              </div>
              <div style="font-weight:700;color:#fff;font-size:16px;margin-bottom:4px;">Stellar Light</div>
              <div style="font-size:12px;color:var(--color-text-muted);line-height:1.4;">
                Clean, luminous daytime interface with crisp slate panels and high contrast.
              </div>
            </div>

            <!-- System Sync Card -->
            <div class="theme-choice-card ${t==="system"?"active-theme":""}" data-theme-mode="system" style="cursor:pointer;padding:20px;border-radius:var(--radius-lg);border:2px solid ${t==="system"?"var(--color-cyan-primary)":"rgba(255,255,255,0.1)"};background:rgba(0,0,0,0.2);box-shadow:${t==="system"?"0 0 20px rgba(0,174,189,0.2)":"none"};transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:20px;">💻</span>
                ${t==="system"?'<span style="background:var(--color-cyan-primary);color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">ACTIVE</span>':""}
              </div>
              <div style="font-weight:700;color:#fff;font-size:16px;margin-bottom:4px;">System Default</div>
              <div style="font-size:12px;color:var(--color-text-muted);line-height:1.4;">
                Automatically synchronizes with your operating system's dark/light schedule.
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Video & Stream Playback -->
        <section class="card" style="padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="color:var(--color-cyan-primary);font-size:20px;">${N.video}</span>
            <h2 style="font-size:18px;color:#fff;margin:0;font-weight:700;">Playback & Audio</h2>
          </div>
          <p style="color:var(--color-text-muted);font-size:13px;margin:0 0 24px;">
            Tune HLS live player behaviors, auto-buffering, and sound levels.
          </p>

          <div style="display:flex;flex-direction:column;gap:20px;">
            <!-- Autoplay -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Autoplay Streams</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Automatically start streaming video when opening a broadcast channel.</div>
              </div>
              <label class="switch-toggle" style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer;">
                <input type="checkbox" id="pref-autoplay" ${e?"checked":""} style="opacity:0;width:0;height:0;" />
                <span class="toggle-slider" style="position:absolute;inset:0;background:${e?"var(--color-cyan-primary)":"rgba(255,255,255,0.2)"};border-radius:26px;transition:0.2s;">
                  <span style="position:absolute;content:'';height:20px;width:20px;left:${e?"24px":"3px"};bottom:3px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                </span>
              </label>
            </div>

            <!-- Low Latency Mode -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Ultra Low Latency Mode</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Reduces broadcast latency (1-3s delay) for responsive streamer chat interaction.</div>
              </div>
              <label class="switch-toggle" style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer;">
                <input type="checkbox" id="pref-low-latency" ${a?"checked":""} style="opacity:0;width:0;height:0;" />
                <span class="toggle-slider" style="position:absolute;inset:0;background:${a?"var(--color-cyan-primary)":"rgba(255,255,255,0.2)"};border-radius:26px;transition:0.2s;">
                  <span style="position:absolute;content:'';height:20px;width:20px;left:${a?"24px":"3px"};bottom:3px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                </span>
              </label>
            </div>

            <!-- Default Volume -->
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Default Audio Volume (<span id="volume-val-display">${h}%</span>)</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Set standard initial volume when opening any stream or clip.</div>
              </div>
              <div style="width:180px;">
                <input type="range" id="pref-volume" min="0" max="100" value="${h}" style="width:100%;accent-color:var(--color-cyan-primary);cursor:pointer;" />
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Chat & Notifications -->
        <section class="card" style="padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="color:var(--color-cyan-primary);font-size:20px;">💬</span>
            <h2 style="font-size:18px;color:#fff;margin:0;font-weight:700;">Chat Preferences</h2>
          </div>
          <p style="color:var(--color-text-muted);font-size:13px;margin:0 0 24px;">
            Customize chat presentation, timestamps, and alert sounds.
          </p>

          <div style="display:flex;flex-direction:column;gap:20px;">
            <!-- Timestamps -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Show Chat Timestamps</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Displays the exact time next to every incoming chat message.</div>
              </div>
              <label class="switch-toggle" style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer;">
                <input type="checkbox" id="pref-chat-timestamps" ${s?"checked":""} style="opacity:0;width:0;height:0;" />
                <span class="toggle-slider" style="position:absolute;inset:0;background:${s?"var(--color-cyan-primary)":"rgba(255,255,255,0.2)"};border-radius:26px;transition:0.2s;">
                  <span style="position:absolute;content:'';height:20px;width:20px;left:${s?"24px":"3px"};bottom:3px;background:#fff;border-radius:50%;transition:0.2s;"></span>
                </span>
              </label>
            </div>

            <!-- Chat Font Size -->
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-weight:600;color:#fff;font-size:15px;">Chat Font Size</div>
                <div style="font-size:12px;color:var(--color-text-muted);">Adjust message typography scaling in watch room.</div>
              </div>
              <select id="pref-chat-font" class="input-dark" style="width:140px;height:38px;padding:0 12px;border-radius:var(--radius-md);">
                <option value="small" ${d==="small"?"selected":""}>Small (12px)</option>
                <option value="normal" ${d==="normal"?"selected":""}>Normal (14px)</option>
                <option value="large" ${d==="large"?"selected":""}>Large (16px)</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  `}function Ts(){var a,s,d,h;document.querySelectorAll("[data-theme-mode]").forEach(g=>{g.addEventListener("click",()=>{const f=g.dataset.themeMode;$a(f),localStorage.setItem("orbit_theme",f),I.showToast(`Theme changed to ${f==="dark"?"Cosmic Dark":f==="light"?"Stellar Light":"System Sync"}`,"success"),I.navigate("settings")})}),(a=document.getElementById("pref-autoplay"))==null||a.addEventListener("change",g=>{localStorage.setItem("orbit_pref_autoplay",g.target.checked),I.showToast(`Autoplay ${g.target.checked?"enabled":"disabled"}`,"info")}),(s=document.getElementById("pref-low-latency"))==null||s.addEventListener("change",g=>{localStorage.setItem("orbit_pref_low_latency",g.target.checked),I.showToast(`Low latency mode ${g.target.checked?"enabled":"disabled"}`,"info")});const t=document.getElementById("pref-volume"),e=document.getElementById("volume-val-display");t&&(t.addEventListener("input",g=>{e&&(e.textContent=`${g.target.value}%`)}),t.addEventListener("change",g=>{localStorage.setItem("orbit_pref_volume",g.target.value),I.showToast(`Default volume set to ${g.target.value}%`,"info")})),(d=document.getElementById("pref-chat-timestamps"))==null||d.addEventListener("change",g=>{localStorage.setItem("orbit_pref_chat_timestamps",g.target.checked),I.showToast(`Chat timestamps ${g.target.checked?"enabled":"disabled"}`,"info")}),(h=document.getElementById("pref-chat-font"))==null||h.addEventListener("change",g=>{localStorage.setItem("orbit_pref_chat_font_size",g.target.value),I.showToast(`Chat font size set to ${g.target.value}`,"info")})}function $a(t){t==="light"||t==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches?(document.documentElement.classList.add("theme-light"),document.body.classList.add("theme-light")):(document.documentElement.classList.remove("theme-light"),document.body.classList.remove("theme-light"))}const ma=document.getElementById("app"),Ls=["splash","login","register","otp","forgot-password","reset-password"],ga={splash:{render:Co,setup:Ao},login:{render:To,setup:Lo},register:{render:Io,setup:Ro},otp:{render:Mo,setup:Bo},"forgot-password":{render:Do,setup:Po},"reset-password":{render:$o,setup:Oo},home:{render:Ho,setup:jo},watch:{render:$r,setup:Or},categories:{render:Vr,setup:Fr},"category-detail":{render:jr,setup:Gr},clips:{render:Vo,setup:Fo},channel:{render:Kr,setup:Yr},studio:{render:Qr,setup:Zr},profile:{render:ls,setup:ds},search:{render:cs,setup:us},admin:{render:ps,setup:hs},mod:{render:Ss,setup:Es},settings:{render:As,setup:Ts}};let _a=null,va=null,ya=null;function Oa(){const t=I.getState(),e=t.currentView,a=Ls.includes(e),s=ga[e]||ga.home,d=t.currentUser?t.currentUser.id||t.currentUser.token||"user":"guest",h=JSON.stringify(t.viewParams||{});if(e!==_a||h!==va||d!==ya){if(_a=e,va=h,ya=d,a)ma.innerHTML=`<div class="page-enter">${s.render()}</div>`;else{const f=t.sidebarCollapsed;ma.innerHTML=`
        <div class="app-layout">
          ${So()}
          <div class="app-main ${f?"sidebar-collapsed":""}">
            ${Eo()}
            <div class="app-content page-enter" id="view-content">
              ${s.render()}
            </div>
          </div>
        </div>
      `,ko()}s.setup&&s.setup()}else{const f=document.getElementById("app-sidebar")||document.querySelector(".app-sidebar"),_=document.querySelector(".app-main"),b=document.getElementById("sidebar-toggle-btn");f&&(t.sidebarCollapsed?f.classList.add("collapsed"):f.classList.remove("collapsed")),_&&(t.sidebarCollapsed?_.classList.add("sidebar-collapsed"):_.classList.remove("sidebar-collapsed")),b&&(b.innerHTML=t.sidebarCollapsed?N.chevronRight:N.chevronLeft,b.title=t.sidebarCollapsed?"Expand sidebar":"Collapse sidebar")}}I.subscribe(()=>Oa());const Is=localStorage.getItem("orbit_theme")||"dark";$a(Is);Oa();Mt().catch(t=>console.warn("Media server config init:",t));console.log("Orbit Desktop Platform Ready");
