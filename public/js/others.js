// --- 每日壁纸 (Bing Wallpaper) ---
async function loadBingWallpaper() {
  const size = document.getElementById('wallpaperSize').value;
  const bingImage = document.getElementById('bingImage');
  const wallpaperTitle = document.getElementById('wallpaperTitle');
  const btn = document.getElementById('loadWallpaperBtn');
  
  const originalText = btn.innerText;
  btn.innerText = '拉取中...';
  bingImage.style.opacity = '0'; // 切换时先隐去旧图

  try {
    const res = await fetch(`/api/wallpaper?size=${size}`);
    const data = await res.json();

    if (data.status === 'success' && data.url) {
      // 预加载图片实现淡入
      const img = new Image();
      img.onload = () => {
        bingImage.src = data.url;
        bingImage.style.opacity = '1';
        
        // 显示壁纸标题信息（如果有的话）
        if (data.title) {
          wallpaperTitle.innerText = data.title;
          wallpaperTitle.style.display = 'block';
        }
        btn.innerText = originalText;
      };
      img.onerror = () => {
        alert('图片资源加载失败');
        btn.innerText = originalText;
      };
      img.src = data.url;
    } else {
      alert('未获取到壁纸地址');
      btn.innerText = originalText;
    }
  } catch (err) {
    console.error(err);
    alert('获取壁纸失败');
    btn.innerText = originalText;
  }
}

// --- 单词查询 (Dictionary Search) ---
async function searchWord() {
  const word = document.getElementById("wordInput").value.trim();
  const resultDiv = document.getElementById("result");

  if (!word) {
    resultDiv.innerHTML = '<p class="loading">Please enter a word to search</p>';
    return;
  }

  resultDiv.innerHTML = '<p class="loading">Searching...</p>';

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await response.json();

    if (data.title === "No Definitions Found" || !response.ok) {
      // 完美复刻微信端样式
      resultDiv.innerHTML = `<p style="color:#6b7280;">No definition found for "<strong>${word}</strong>"</p>`;
      return;
    }

    const entry = data[0];
    const phonetic = entry.phonetic || (entry.phonetics?.[0]?.text || "");
    const audio = entry.phonetics?.find(p => p.audio)?.audio;

    // 完美复刻微信端的内联优美排版
    let html = `<h2 style="font-size:20px;color:#374151;margin-bottom:8px;">${entry.word}</h2>`;
    
    if (phonetic) {
        html += `<p style="font-size:14px;color:#10a37f;margin-bottom:10px;"><strong>🔊 Phonetic:</strong> ${phonetic}</p>`;
    }
    
    if (audio) {
        html += `<audio controls src="${audio.startsWith('http') ? audio : 'https:' + audio}" style="margin-bottom: 10px; height: 30px;"></audio>`;
    }

    entry.meanings.forEach(meaning => {
      html += `<h3 style="font-size:16px;color:#111827;margin-top:12px;margin-bottom:6px;">📝 ${meaning.partOfSpeech}</h3>`;
      meaning.definitions.forEach((def, index) => {
        html += `<p style="font-size:14px;color:#4b5563;margin-bottom:4px;"><strong>${index + 1}:</strong> ${def.definition}</p>`;
        if (def.example) {
            html += `<p style="font-size:13px;color:#6b7280;font-style:italic;margin-bottom:8px;padding-left:8px;border-left:2px solid #e5e7eb;">Example: "${def.example}"</p>`;
        }
      });
    });

    resultDiv.innerHTML = html;

  } catch (error) {
    resultDiv.innerHTML = '<p class="loading">Error fetching definition. Please try again.</p>';
    console.error('Dictionary search error:', error);
  }
}

// --- 短视频 (Video Loading) ---
// --- 短视频 (Video Loading) ---
async function loadVideo() {
  const id = document.getElementById('videoCategory').value;
  const videoPlayer = document.getElementById('videoPlayer');
  
  // 模拟微信 wx.showLoading 体验
  const btn = document.getElementById('loadVideoBtn');
  const originalText = btn.innerText;
  btn.innerText = '加载中...';

  try {
    // 请求我们自己后端的 /video 路由，并带上分类 id
    const res = await fetch(`/video?id=${encodeURIComponent(id)}`);
    const data = await res.json();

    if (data.status === 'success' && data.link) {
      // 校验链接（加了 try-catch 防止部分第三方视频云跨域导致直接报错拦截）
      try {
        const test = await fetch(data.link, { method: 'HEAD' });
        if (!test.ok) {
          alert('视频链接已失效，请重试');
          btn.innerText = originalText;
          return;
        }
      } catch (corsErr) {
        // 如果触发了跨域，不拦截，直接让 video 标签去硬装载（video 标签本身允许跨域播放）
        console.warn('HEAD check CORS restricted, proceeding to play directly.');
      }
      
      // 装载并播放
      videoPlayer.src = data.link;
      videoPlayer.load();
      videoPlayer.play().catch(err => console.warn('Autoplay blocked:', err));
    } else {
      alert('未获取到视频地址');
    }
  } catch (err) {
    console.error(err);
    alert('获取视频失败');
  } finally {
    btn.innerText = originalText;
  }
}

// --- 轮播图控制 (Carousel Slider 保持不变，它是Web端特有的交互实现) ---
const slides = document.querySelectorAll('.card-slider .slide');
const dots = document.querySelectorAll('.dot');
let current = 0;
let isTransitioning = false;

function updateCarousel() {
  if (isTransitioning) return;
  isTransitioning = true;

  const len = slides.length;

  slides.forEach(s => s.classList.remove('prev', 'current', 'next', 'hidden'));
  dots.forEach(d => d.classList.remove('active'));

  const prevIndex = (current - 1 + len) % len;
  const nextIndex = (current + 1) % len;

  setTimeout(() => {
    slides[prevIndex].classList.add('prev');
    slides[current].classList.add('current');
    slides[nextIndex].classList.add('next');

    slides.forEach((slide, index) => {
      if (index !== prevIndex && index !== current && index !== nextIndex) {
        slide.classList.add('hidden');
      }
    });

    dots[current].classList.add('active');
    isTransitioning = false;
  }, 50);
}

function goToSlide(idx) {
  if (idx >= 0 && idx < slides.length && idx !== current && !isTransitioning) {
    current = idx;
    updateCarousel();
  }
}

function nextSlide() {
  if (!isTransitioning) {
    current = (current + 1) % slides.length;
    updateCarousel();
  }
}

function previousSlide() {
  if (!isTransitioning) {
    current = (current - 1 + slides.length) % slides.length;
    updateCarousel();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    previousSlide();
  } else if (e.key === 'ArrowRight') {
    nextSlide();
  } else if (e.key === 'Enter' && document.activeElement === document.getElementById('wordInput')) {
    searchWord();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('no-transition');

  current = 0;
  if (slides.length > 0) slides[0].classList.add('current');
  if (dots.length > 0) dots[0].classList.add('active');
  updateCarousel();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove('no-transition');
    });
  });

  // 💡 页面初始化时，自动帮你拉取一次默认的Bing壁纸
  if (document.getElementById('bingImage')) {
    loadBingWallpaper();
  }

  document.getElementById('loadVideoBtn').addEventListener('click', loadVideo);
  document.querySelector('button[onclick="searchWord()"]').addEventListener('click', searchWord);
});