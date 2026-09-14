import { Icons } from './CosmicIcons.js';

/**
 * Opens an interactive canvas-based image editor modal supporting:
 * - Crop (1:1, 4:1, 16:9, Free)
 * - Scale / Zoom (50% to 300%)
 * - Rotate (90° increments + fine slider)
 * - Drag / Pan
 *
 * @param {File|Blob} file - The raw image file picked by the user
 * @param {Object} options - { aspectRatio: '1:1'|'4:1'|'16:9'|'free', title: string }
 * @param {Function} onSave - Callback receiving the transformed File object
 */
export function openImageCropperModal(file, options = {}, onSave) {
  const root = document.body;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '9999';

  const defaultAspect = options.aspectRatio || '1:1';
  const modalTitle = options.title || 'Customize & Crop Image';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:680px;width:95%;padding:24px;border-radius:20px;background:var(--color-space-panel,#121626);border:1px solid rgba(0,242,254,0.25);box-shadow:0 12px 40px rgba(0,0,0,0.7);display:flex;flex-direction:column;max-height:92vh;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;">
          ${Icons.image} ${modalTitle}
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
            <button class="btn btn-sm ${defaultAspect==='1:1'?'btn-cyan':'btn-ghost'}" data-aspect="1:1" style="padding:4px 10px;font-size:12px;">1:1 Square</button>
            <button class="btn btn-sm ${defaultAspect==='4:1'?'btn-cyan':'btn-ghost'}" data-aspect="4:1" style="padding:4px 10px;font-size:12px;">4:1 Banner</button>
            <button class="btn btn-sm ${defaultAspect==='16:9'?'btn-cyan':'btn-ghost'}" data-aspect="16:9" style="padding:4px 10px;font-size:12px;">16:9 Wide</button>
            <button class="btn btn-sm ${defaultAspect==='free'?'btn-cyan':'btn-ghost'}" data-aspect="free" style="padding:4px 10px;font-size:12px;">Free</button>
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
  `;

  root.appendChild(overlay);

  const canvas = overlay.querySelector('#cropper-canvas');
  const viewport = overlay.querySelector('#cropper-viewport');
  const frame = overlay.querySelector('#cropper-frame');
  const ctx = canvas.getContext('2d');

  let img = new Image();
  let scale = 1;
  let rotation = 0; // in degrees
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let activeAspect = defaultAspect;

  const close = () => overlay.remove();
  overlay.querySelector('#cropper-close-btn').addEventListener('click', close);
  overlay.querySelector('#cropper-cancel-btn').addEventListener('click', close);

  // Load Image
  const reader = new FileReader();
  reader.onload = (e) => {
    img.onload = () => {
      initDimensions();
      draw();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  function getCropFrameSize() {
    const vw = viewport.clientWidth || 600;
    const vh = viewport.clientHeight || 340;
    let fw = vw * 0.8;
    let fh = vh * 0.8;

    if (activeAspect === '1:1') {
      const size = Math.min(fw, fh);
      return { width: size, height: size };
    } else if (activeAspect === '4:1') {
      const w = Math.min(fw, vh * 0.9 * 4);
      return { width: w, height: w / 4 };
    } else if (activeAspect === '16:9') {
      const w = Math.min(fw, vh * 0.85 * (16 / 9));
      return { width: w, height: w / (16 / 9) };
    } else {
      return { width: fw, height: fh };
    }
  }

  function initDimensions() {
    const vw = viewport.clientWidth || 600;
    const vh = viewport.clientHeight || 340;
    canvas.width = vw;
    canvas.height = vh;

    const cf = getCropFrameSize();
    frame.style.width = `${cf.width}px`;
    frame.style.height = `${cf.height}px`;
    frame.style.left = `${(vw - cf.width) / 2}px`;
    frame.style.top = `${(vh - cf.height) / 2}px`;

    // Fit image initially
    const fitScale = Math.max(cf.width / img.width, cf.height / img.height);
    scale = Math.max(fitScale, 0.5);
    overlay.querySelector('#zoom-slider').value = scale;
    overlay.querySelector('#zoom-val').textContent = `${Math.round(scale * 100)}%`;
    panX = 0;
    panY = 0;
  }

  function draw() {
    if (!img.complete || !img.naturalWidth) return;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(cw / 2 + panX, ch / 2 + panY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }

  // Panning / Dragging
  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    draw();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      viewport.style.cursor = 'grab';
    }
  });

  // Touch Support
  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - panX;
      startY = e.touches[0].clientY - panY;
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      panX = e.touches[0].clientX - startX;
      panY = e.touches[0].clientY - startY;
      draw();
    }
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Zoom controls
  const zoomSlider = overlay.querySelector('#zoom-slider');
  const zoomVal = overlay.querySelector('#zoom-val');

  zoomSlider.addEventListener('input', () => {
    scale = parseFloat(zoomSlider.value);
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
    draw();
  });

  overlay.querySelector('#zoom-in-btn').addEventListener('click', () => {
    scale = Math.min(3, scale + 0.15);
    zoomSlider.value = scale;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
    draw();
  });

  overlay.querySelector('#zoom-out-btn').addEventListener('click', () => {
    scale = Math.max(0.5, scale - 0.15);
    zoomSlider.value = scale;
    zoomVal.textContent = `${Math.round(scale * 100)}%`;
    draw();
  });

  // Rotation controls
  const rotateSlider = overlay.querySelector('#rotate-slider');
  const rotateVal = overlay.querySelector('#rotate-val');

  rotateSlider.addEventListener('input', () => {
    rotation = parseInt(rotateSlider.value);
    rotateVal.textContent = `${rotation}°`;
    draw();
  });

  overlay.querySelector('#rotate-left-btn').addEventListener('click', () => {
    rotation = (rotation - 90) % 360;
    if (rotation < -180) rotation += 360;
    rotateSlider.value = rotation;
    rotateVal.textContent = `${rotation}°`;
    draw();
  });

  overlay.querySelector('#rotate-right-btn').addEventListener('click', () => {
    rotation = (rotation + 90) % 360;
    if (rotation > 180) rotation -= 360;
    rotateSlider.value = rotation;
    rotateVal.textContent = `${rotation}°`;
    draw();
  });

  // Aspect preset switching
  overlay.querySelectorAll('#aspect-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeAspect = btn.dataset.aspect;
      overlay.querySelectorAll('#aspect-buttons button').forEach(b => {
        b.className = `btn btn-sm ${b.dataset.aspect === activeAspect ? 'btn-cyan' : 'btn-ghost'}`;
      });
      initDimensions();
      draw();
    });
  });

  // Export & Save
  overlay.querySelector('#cropper-save-btn').addEventListener('click', () => {
    const cf = getCropFrameSize();
    const vw = canvas.width;
    const vh = canvas.height;
    const cropX = (vw - cf.width) / 2;
    const cropY = (vh - cf.height) / 2;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = cf.width;
    outCanvas.height = cf.height;
    const outCtx = outCanvas.getContext('2d');

    // Draw the cropped viewport section onto output canvas
    outCtx.drawImage(
      canvas,
      cropX, cropY, cf.width, cf.height,
      0, 0, cf.width, cf.height
    );

    outCanvas.toBlob((blob) => {
      if (!blob) {
        close();
        return;
      }
      const transformedFile = new File([blob], file.name || 'custom_image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      close();
      if (typeof onSave === 'function') {
        onSave(transformedFile);
      }
    }, 'image/jpeg', 0.92);
  });
}
