let currentPage = 1;
const itemsPerPage = 10;
let searchData = [];

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
});

function performSearch() {
  const keyword = document.getElementById('searchInput').value.trim();
  if (!keyword) {
    showMessage('请输入搜索关键词', 'error');
    return;
  }

  searchLinks(keyword);
}

async function searchLinks(keyword) {
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  
  try {
    loading.style.display = 'block';
    results.innerHTML = '';

    console.log('Searching for keyword:', keyword);
    const apiUrl = `/api/shortvideo?text=${encodeURIComponent(keyword)}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API response data:', data);

    if (data.error) {
      throw new Error(data.error);
    }

    if (!Array.isArray(data) || data.length === 0) {
      showMessage('没有找到相关结果，请尝试其他关键词', 'info');
      return;
    }

    searchData = data;
    currentPage = 1;
    renderResults();
    renderPagination();
    
    showMessage(`找到 ${data.length} 个结果`, 'success');
    
  } catch (error) {
    console.error('搜索失败:', error);
    showMessage(`搜索失败: ${error.message}`, 'error');
  } finally {
    loading.style.display = 'none';
  }
}

function renderResults() {
  const container = document.getElementById('results');
  container.innerHTML = '';

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = searchData.slice(start, end);

  if (pageItems.length === 0) {
    container.innerHTML = '<p class="no-results">没有找到结果</p>';
    return;
  }

  pageItems.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    const itemNumber = start + index + 1;
    
    div.innerHTML = `
      <div class="result-header">
        <span class="result-number">${itemNumber}</span>
        <h3 class="result-title">${item.name || item.title || '无标题'}</h3>
      </div>
      <div class="result-content">
        <p class="result-description">${item.description || item.summary || '暂无描述'}</p>
        <div class="result-meta">
          <span class="result-time">添加时间：${item.addtime || item.date || '未知'}</span>
          ${item.duration ? `<span class="result-duration">时长：${item.duration}</span>` : ''}
        </div>
        <div class="result-actions">
          <a href="${item.viewlink || item.url || '#'}" target="_blank" class="watch-btn">观看视频</a>
          ${item.downloadlink ? `<a href="${item.downloadlink}" target="_blank" class="download-btn">下载</a>` : ''}
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });
}

function renderPagination() {
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  const totalPages = Math.ceil(searchData.length / itemsPerPage);
  
  if (totalPages <= 1) {
    return;
  }

  // Previous button
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '上一页';
    prevBtn.className = 'pagination-btn';
    prevBtn.addEventListener('click', () => {
      currentPage--;
      renderResults();
      renderPagination();
    });
    container.appendChild(prevBtn);
  }

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'pagination-btn active' : 'pagination-btn';
    
    btn.addEventListener('click', () => {
      currentPage = i;
      renderResults();
      renderPagination();
    });
    
    container.appendChild(btn);
  }

  // Next button
  if (currentPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一页';
    nextBtn.className = 'pagination-btn';
    nextBtn.addEventListener('click', () => {
      currentPage++;
      renderResults();
      renderPagination();
    });
    container.appendChild(nextBtn);
  }
}

function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
} 

