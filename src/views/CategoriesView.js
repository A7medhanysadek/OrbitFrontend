import { store } from '../state/store.js';
import { categoryApi } from '../api/category.js';
import { Icons } from '../components/CosmicIcons.js';

export function renderCategoriesView() {
  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div class="section-title" style="margin-bottom:0;">${Icons.grid} Browse Categories</div>
        <div class="search-bar" style="max-width:280px;">
          ${Icons.search}
          <input type="text" id="cat-search-input" placeholder="Search categories..." />
        </div>
      </div>
      <div class="categories-grid" id="categories-grid">
        <div class="spinner" style="grid-column:1/-1;"></div>
      </div>
    </div>
  `;
}

export function setupCategoriesEvents() {
  loadAllCategories();
  const searchInput = document.getElementById('cat-search-input');
  let timeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const q = searchInput.value.trim();
        if (q) searchCategories(q); else loadAllCategories();
      }, 300);
    });
  }
}

async function loadAllCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner" style="grid-column:1/-1;"></div>';
  try {
    const cats = await categoryApi.getAll();
    renderCats(grid, cats);
  } catch (e) { grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;">Failed to load categories</p>'; }
}

async function searchCategories(q) {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  try {
    const cats = await categoryApi.search(q);
    renderCats(grid, cats);
  } catch (e) {}
}

function renderCats(grid, cats) {
  if (!cats?.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">&#128270;</div><h3>No Categories Found</h3></div>'; return; }
  grid.innerHTML = cats.map((cat, i) => `
    <div class="card category-card hover-lift stagger-item" data-slug="${cat.slug}">
      <div class="cat-thumb">
        ${cat.imageUrl ? `<img src="${cat.imageUrl}" alt="${cat.name}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-gradient-card);">&#127918;</div>`}
      </div>
      <div class="cat-info">
        <div class="cat-name">${cat.name}</div>
        <div class="cat-viewers">${cat.totalViewers || 0} viewers</div>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => store.navigate('category-detail', { slug: card.dataset.slug }));
  });
}