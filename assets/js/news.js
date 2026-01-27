/**
 * Synverta B2B News Portal - News Loading and Rendering
 */

let newsCache = null;

/**
 * Fetch news data from JSON file
 */
async function fetchNews() {
    if (newsCache) {
        return newsCache;
    }

    try {
        const response = await fetch('/data/news.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch news: ${response.status}`);
        }
        newsCache = await response.json();
        return newsCache;
    } catch (error) {
        console.error('Error loading news data:', error);
        return [];
    }
}

/**
 * Sort news items by date descending
 */
function sortNewsByDate(newsItems) {
    return [...newsItems].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
}

/**
 * Render a single news item as HTML
 */
function renderNewsItem(item) {
    const tagsHtml = item.tags && item.tags.length > 0
        ? item.tags.map(tag => `<span class="news-tag">${tag}</span>`).join('')
        : '';

    const featuredBadge = item.featured
        ? '<span class="news-featured-badge">精选</span>'
        : '';

    const categoryLabel = getCategoryLabel(item.category);

    return `
        <li class="news-item">
            <div>
                <a class="news-title" href="${item.url}">
                    ${item.title}
                </a>
                <div class="news-meta">
                    <span>${item.date}</span>
                    <span>·</span>
                    <span class="news-category">${categoryLabel}</span>
                    ${featuredBadge}
                    ${tagsHtml}
                </div>
            </div>
            <div class="news-summary">
                ${item.summary}
            </div>
        </li>
    `;
}

/**
 * Get category label in Chinese
 */
function getCategoryLabel(category) {
    const labels = {
        'industry': '行业资讯',
        'product': '产品动态',
        'company': '公司新闻'
    };
    return labels[category] || category;
}

/**
 * Render news list to a container
 */
function renderNewsList(containerId, items, emptyMessage = '该栏目暂时没有新闻。') {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    if (!items || items.length === 0) {
        container.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
        return;
    }

    container.innerHTML = items.map(item => renderNewsItem(item)).join('');
}

/**
 * Initialize news for homepage
 */
async function initHomepage() {
    const newsItems = await fetchNews();
    if (!newsItems || newsItems.length === 0) {
        console.warn('No news items available');
        return;
    }

    const sortedNews = sortNewsByDate(newsItems);

    // Render latest 5 news items
    const latest5 = sortedNews.slice(0, 5);
    renderNewsList('latest-news-list', latest5, '暂无最新新闻。');

    // Render up to 3 featured items
    const featured = sortedNews.filter(item => item.featured).slice(0, 3);
    renderNewsList('featured-news-list', featured, '暂无精选新闻。');

    // Render latest 3 items for each category
    const categories = {
        'industry': 'home-industry-news-list',
        'product': 'home-product-news-list',
        'company': 'home-company-news-list'
    };

    for (const [category, containerId] of Object.entries(categories)) {
        const categoryItems = sortedNews
            .filter(item => item.category === category)
            .slice(0, 3);
        renderNewsList(containerId, categoryItems, '该栏目暂时没有新闻。');
    }
}

/**
 * Initialize news for industry news page
 */
async function initIndustryNewsPage() {
    const newsItems = await fetchNews();
    if (!newsItems || newsItems.length === 0) {
        console.warn('No news items available');
        return;
    }

    const sortedNews = sortNewsByDate(newsItems);
    const industryNews = sortedNews.filter(item => item.category === 'industry');

    renderNewsList('industry-news-list', industryNews, '该栏目暂时没有新闻。');
}

/**
 * Auto-initialize based on page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on based on containers present
    if (document.getElementById('latest-news-list') || 
        document.getElementById('featured-news-list') ||
        document.getElementById('home-industry-news-list')) {
        initHomepage();
    } else if (document.getElementById('industry-news-list')) {
        initIndustryNewsPage();
    }
});
