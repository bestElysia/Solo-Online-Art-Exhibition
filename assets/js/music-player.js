document.addEventListener('DOMContentLoaded', () => {
    // === 1. 播放列表配置 ===
    const playlist = [
        
        {
            title: "Majo no Tabitabi Literature",
            artist: "yanxu player",
            src: "assets/music/Majo no Tabitabi OPLiterature Piano Cover.mp3",
            cover: "assets/music/Majo no Tabitabi.jpg"
        }
    ];

    // 智能路径修正：判断当前是否在子文件夹中
    // 如果 URL 包含 /papers/ 或 /essays/，说明在子目录，资源路径需要加 ../
    const isInSubFolder = window.location.pathname.includes('/papers/') || window.location.pathname.includes('/essays/');
    
    playlist.forEach(track => {
        if (isInSubFolder && !track.src.startsWith('../') && !track.src.startsWith('http')) {
            track.src = '../' + track.src;
            track.cover = '../' + track.cover;
        }
    });

    // === 2. 读取记忆 (LocalStorage) ===
    const savedIndex = localStorage.getItem('music_index');
    const savedTime = localStorage.getItem('music_time');
    const savedStatus = localStorage.getItem('music_playing'); // 'true' or 'false'

    let currentTrackIndex = savedIndex ? parseInt(savedIndex) : 0;
    // 防止索引越界
    if (currentTrackIndex >= playlist.length) currentTrackIndex = 0;

    let isPlaying = false;
    
    // 创建音频对象
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = playlist[currentTrackIndex].src;

    // 如果有记忆进度，恢复进度
    if (savedTime) {
        audio.currentTime = parseFloat(savedTime);
    }

    const musicBtn = document.getElementById('music-toggle');
    
    // === 3. 核心功能 ===

    function updateMediaSession() {
        if ('mediaSession' in navigator) {
            const track = playlist[currentTrackIndex];
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist,
                album: "晨光画境", 
                artwork: [{ src: track.cover, sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', () => playMusic());
            navigator.mediaSession.setActionHandler('pause', () => pauseMusic());
            navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            navigator.mediaSession.setActionHandler('previoustrack', () => playNext());
        }
    }

    function toggleMusic() {
        if (audio.paused) {
            playMusic();
        } else {
            pauseMusic();
        }
    }

    function playMusic() {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updateUI(true);
                updateMediaSession();
                saveState(); // 保存状态：正在播放
            }).catch(error => {
                console.log("自动播放被拦截 (正常现象):", error);
                isPlaying = false;
                updateUI(false);
                saveState(); // 保存状态：暂停
            });
        }
    }

    function pauseMusic() {
        audio.pause();
        isPlaying = false;
        updateUI(false);
        saveState(); // 保存状态
    }

    function playNext() {
        currentTrackIndex++;
        if (currentTrackIndex >= playlist.length) currentTrackIndex = 0;
        
        audio.src = playlist[currentTrackIndex].src;
        audio.currentTime = 0; // 切歌归零
        playMusic();
    }

    function updateUI(playing) {
        if (musicBtn) {
            if (playing) {
                musicBtn.classList.remove('muted');
                musicBtn.classList.add('playing');
            } else {
                musicBtn.classList.add('muted');
                musicBtn.classList.remove('playing');
            }
        }
    }

    // === 4. 状态保存逻辑 (关键) ===
    function saveState() {
        localStorage.setItem('music_index', currentTrackIndex);
        localStorage.setItem('music_time', audio.currentTime);
        localStorage.setItem('music_playing', isPlaying);
    }

    // 监听进度变化，实时保存 (每秒)
    audio.addEventListener('timeupdate', () => {
        // 只有播放时才保存进度，避免覆盖成0
        if (!audio.paused) {
            localStorage.setItem('music_time', audio.currentTime);
        }
    });

    // 页面关闭/刷新/跳转前，强制保存一次
    window.addEventListener('beforeunload', () => {
        saveState();
    });

    // === 5. 初始化自动续播 ===
    // 只有当之前是 "true" (正在播放) 时，才尝试自动播放
    if (savedStatus === 'true') {
        // 尝试自动播放
        // 注意：浏览器可能会拦截非用户触发的自动播放，这是无法完全避免的
        // 但如果你是在同一个网站内跳转，现代浏览器通常会允许续播
        playMusic();
    } else {
        // 如果之前是暂停的，那就只恢复进度，不播放
        updateUI(false);
    }

    // === 6. 事件监听 ===
    if (musicBtn) {
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });
    }

    audio.addEventListener('ended', () => {
        playNext();
    });

    window.musicPlayer = {
        play: playMusic,
        pause: pauseMusic,
        next: playNext
    };
});
