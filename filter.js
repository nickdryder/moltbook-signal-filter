// Moltbook Signal Filter - Stop wasting tokens on noise
// by cc_feral

const DEFAULT_CONFIG = {
  minKarma: 10,
  hideIntros: true,
  introPatterns: ['just landed', 'hello world', 'first post', 'new here', 'hi everyone'],
  spamDomains: ['pornhub.com', 'xvideos.com', 'onlyfans.com']
};

function getConfig() {
  return new Promise(resolve => {
    chrome.storage.sync.get(DEFAULT_CONFIG, resolve);
  });
}

function matchesIntroPattern(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return DEFAULT_CONFIG.introPatterns.some(pattern => lower.includes(pattern));
}

function isSpam(text) {
  if (!text) return false;
  const content = text.trim();
  
  // URL-only posts with spam domains
  if (content.length < 50) {
    const lower = content.toLowerCase();
    if (DEFAULT_CONFIG.spamDomains.some(domain => lower.includes(domain))) {
      return true;
    }
  }
  
  return false;
}

// Track duplicate content
const contentSeen = new Map();

function isDuplicate(text) {
  if (!text) return false;
  const content = text.trim();
  const count = contentSeen.get(content) || 0;
  contentSeen.set(content, count + 1);
  return count >= 2; // 3+ occurrences = spam
}

async function filterPosts() {
  const config = await getConfig();
  
  // Find all post elements (adjust selector based on moltbook's actual DOM)
  const posts = document.querySelectorAll('[data-post-id]');
  
  let hiddenCount = 0;
  
  posts.forEach(post => {
    const karmaEl = post.querySelector('.karma-score');
    const titleEl = post.querySelector('.post-title');
    const contentEl = post.querySelector('.post-content');
    
    let shouldHide = false;
    
    // Check karma threshold
    if (karmaEl) {
      const karma = parseInt(karmaEl.textContent) || 0;
      if (karma < config.minKarma) {
        shouldHide = true;
      }
    }
    
    // Check intro patterns
    if (config.hideIntros) {
      const title = titleEl?.textContent || '';
      const content = contentEl?.textContent || '';
      if (matchesIntroPattern(title) || matchesIntroPattern(content)) {
        shouldHide = true;
      }
    }
    
    // Check spam patterns
    const title = titleEl?.textContent || '';
    const content = contentEl?.textContent || '';
    if (isSpam(title) || isSpam(content) || isDuplicate(title)) {
      shouldHide = true;
    }
    
    if (shouldHide) {
      post.style.display = 'none';
      post.dataset.filteredBy = 'signal-filter';
      hiddenCount++;
    }
  });
  
  // Show stats
  if (hiddenCount > 0) {
    showFilterStats(hiddenCount);
  }
}

function showFilterStats(count) {
  const existing = document.getElementById('signal-filter-stats');
  if (existing) existing.remove();
  
  const stats = document.createElement('div');
  stats.id = 'signal-filter-stats';
  stats.style.cssText = 'position:fixed;top:10px;right:10px;background:#1a1a2e;color:#fff;padding:10px 15px;border-radius:8px;z-index:9999;font-family:monospace;font-size:12px;';
  stats.textContent = `🦞 Filtered ${count} low-signal posts`;
  document.body.appendChild(stats);
  
  setTimeout(() => stats.remove(), 5000);
}

// Run on load and when DOM changes
filterPosts();
const observer = new MutationObserver(filterPosts);
observer.observe(document.body, { childList: true, subtree: true });

console.log('🦞 Moltbook Signal Filter active');
