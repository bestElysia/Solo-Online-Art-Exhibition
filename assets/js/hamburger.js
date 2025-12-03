document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const sideNav = document.getElementById('sideNav');
    const navLinks = document.querySelectorAll('.nav-item');
    const langSwitch = document.getElementById('nav-lang-switch');

    // =========================================
    // 1. 汉堡菜单基础逻辑
    // =========================================
    let isOpen = false;

    function toggleMenu() {
        isOpen = !isOpen;
        hamburger.classList.toggle('active', isOpen);
        sideNav.classList.toggle('open', isOpen);
    }

    function closeMenu() {
        isOpen = false;
        hamburger.classList.remove('active');
        sideNav.classList.remove('open');
    }

    if(hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });
    }

    document.addEventListener('click', (e) => {
        if (isOpen && sideNav && !sideNav.contains(e.target) && !hamburger.contains(e.target)) {
            closeMenu();
        }
    });

    // 点击链接后自动关闭菜单（除了语言切换按钮）
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (!link.classList.contains('lang-switch')) {
                closeMenu();
            }
        });
    });


    // =========================================
    // 2. Google 翻译集成逻辑 (核弹修复版)
    // =========================================

    // 2.1 动态注入 Google 翻译脚本
    if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.type = 'text/javascript';
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);

        // 创建隐藏的容器
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none';
        document.body.insertBefore(div, document.body.firstChild);
    }

    // 2.2 初始化配置
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'zh-CN',
            includedLanguages: 'en,zh-CN',
            // 使用 SIMPLE 布局，减少原生横幅出现的概率
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    // 2.3 【核弹监控】防止 Google 强行修改 body 样式或插入横幅
    // 使用 MutationObserver 实时监听 DOM 变化
    const observer = new MutationObserver((mutations) => {
        // A. 强制重置 body 的 top 样式 (防止页面下沉)
        if (document.body.style.top !== '0px' && document.body.style.top !== '') {
            document.body.style.top = '0px';
            document.body.style.position = 'static';
        }
        
        // B. 暴力隐藏所有谷歌相关的 iframe 和横幅
        const banners = document.querySelectorAll('.goog-te-banner-frame, iframe.skiptranslate, body > .skiptranslate');
        banners.forEach(el => {
            if (el.style.display !== 'none') {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.height = '0';
                el.style.width = '0';
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
            }
        });
    });

    // 开始监控 body 的属性变化(style)和子节点变化(插入iframe)
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    // 同时监控 html 标签
    observer.observe(document.documentElement, { attributes: true });


    // =========================================
    // 3. 语言切换与 Cookie 控制
    // =========================================

    // 获取 Cookie
    function getCookie(name) {
        const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    }

    // 设置 Cookie
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
        document.cookie = name + "=" + value + ";path=/";
    }

    // 根据当前状态更新按钮文字
    const currentLangCookie = getCookie('googtrans');
    const langSpan = langSwitch ? langSwitch.querySelector('span') : null;
    const langIcon = langSwitch ? langSwitch.querySelector('.lang-icon') : null;

    if (langSpan && langIcon) {
        if (currentLangCookie && currentLangCookie.includes('/en')) {
            // 当前是英文，显示切回中文的提示
            langSpan.innerText = '中文';
            langIcon.innerText = 'CN';
        } else {
            // 当前是中文，显示切到英文的提示
            langSpan.innerText = 'EN';
            langIcon.innerText = '文';
        }
    }

    // 点击按钮切换语言
    if (langSwitch) {
        langSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            
            const currentCookie = getCookie('googtrans');

            if (currentCookie && currentCookie.includes('/en')) {
                // 切换回中文：清除 Cookie
                setCookie('googtrans', '/zh-CN/zh-CN', 0);
                // 彻底清除可能的残留
                document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + document.domain + "; path=/;";
            } else {
                // 切换到英文
                setCookie('googtrans', '/zh-CN/en', 1);
            }

            // 刷新页面以应用
            location.reload();
        });
    }
});
