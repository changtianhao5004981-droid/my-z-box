document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
  });
});

async function loadVideo() {
  const id = document.getElementById('category').value;
  
  try {
    const res = await fetch(`/video?id=${id}`);
    const data = await res.json();

    if (data.status === 'success' && data.link) {
      // Check if the link actually works
      const test = await fetch(data.link, { method: 'HEAD' });
      if (!test.ok) {
        alert('视频链接已失效，请重试');
        return;
      }

      const videoPlayer = document.getElementById('videoPlayer');
      videoPlayer.src = data.link;
      videoPlayer.load();
      videoPlayer.play().catch(err => {
        console.warn('Autoplay blocked:', err);
      });

    } else {
      alert('未获取到视频地址');
    }

  } catch (err) {
    console.error(err);
    alert('获取视频失败');
  }
}

