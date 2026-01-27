/**
 * Synverta B2B News Portal - News Loading and Rendering
 */

let newsCache = null;

/**
 * Get current language from HTML data-lang attribute
 */
function getCurrentLanguage() {
    const html = document.documentElement;
    const lang = html.getAttribute('data-lang');
    return lang === 'en' ? 'en' : 'zh'; // Default to 'zh' if not set or unrecognized
}

/**
 * Fetch news data from JSON file based on current language
 */
async function fetchNews() {
    if (newsCache) {
        return newsCache;
    }

    const lang = getCurrentLanguage();
    const jsonFile = `/data/news-${lang}.json`;

    try {
        const response = await fetch(jsonFile);
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
 * Get category label based on current language
 */
function getCategoryLabel(category) {
    const lang = getCurrentLanguage();
    
    const labels = {
        'zh': {
            'industry': '行业资讯',
            'product': '产品动态',
            'company': '公司新闻'
        },
        'en': {
            'industry': 'Industry News',
            'product': 'Product Updates',
            'company': 'Company News'
        }
    };
    
    return labels[lang][category] || category;
}

/**
 * Render news list to a container
 */
function renderNewsList(containerId, items, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    // Use language-specific empty message if not provided
    if (!emptyMessage) {
        const lang = getCurrentLanguage();
        emptyMessage = lang === 'en' ? 'No news in this category yet.' : '该栏目暂时没有新闻。';
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

    const lang = getCurrentLanguage();
    const sortedNews = sortNewsByDate(newsItems);

    // Render latest 5 news items
    const latest5 = sortedNews.slice(0, 5);
    const latestEmptyMsg = lang === 'en' ? 'No news available yet.' : '暂无最新新闻。';
    renderNewsList('latest-news-list', latest5, latestEmptyMsg);

    // Render up to 3 featured items
    const featured = sortedNews.filter(item => item.featured).slice(0, 3);
    const featuredEmptyMsg = lang === 'en' ? 'No featured news yet.' : '暂无焦点新闻。';
    renderNewsList('featured-news-list', featured, featuredEmptyMsg);

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
        renderNewsList(containerId, categoryItems);
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
