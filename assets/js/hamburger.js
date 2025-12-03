document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const sideNav = document.getElementById('sideNav');
    const navLinks = document.querySelectorAll('.nav-item');
    const langSwitch = document.getElementById('nav-lang-switch');

    // === 1. 汉堡菜单基础逻辑 ===
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

    // 只有点击非语言切换按钮时才关闭菜单，方便用户连续操作
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (!link.classList.contains('lang-switch')) {
                closeMenu();
            }
        });
    });


    // === 2. Google 翻译集成逻辑 ===

    // 2.1 动态注入 Google 翻译脚本 (免去修改每个HTML的麻烦)
    if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.type = 'text/javascript';
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);

        // 创建一个隐藏的 div 用于承载 Google 翻译组件
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none'; // 确保不可见
        document.body.insertBefore(div, document.body.firstChild);
    }

    // 2.2 初始化 Google 翻译的回调函数
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'zh-CN', // 网站原语言是中文
            includedLanguages: 'en,zh-CN', // 只包含英文和中文
            autoDisplay: false
        }, 'google_translate_element');
    };

    // 2.3 读取 Cookie 获取当前语言状态
    function getCookie(name) {
        const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    }

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
        document.cookie = name + "=" + value + ";path=/";
    }

    // 2.4 设置按钮初始文字
    // Google 翻译使用 'googtrans' 这个 cookie 来记录语言
    // 格式通常是: /原语言/目标语言，例如 /zh-CN/en
    const currentLangCookie = getCookie('googtrans');
    const langSpan = langSwitch ? langSwitch.querySelector('span') : null;
    const langIcon = langSwitch ? langSwitch.querySelector('.lang-icon') : null;

    if (langSpan && langIcon) {
        if (currentLangCookie && currentLangCookie.includes('/en')) {
            // 当前是英文模式，按钮显示 "中文"
            langSpan.innerText = '中文';
            langIcon.innerText = 'CN';
        } else {
            // 当前是中文模式，按钮显示 "EN"
            langSpan.innerText = 'EN';
            langIcon.innerText = '文';
        }
    }

    // 2.5 绑定点击事件：通过修改 Cookie 触发翻译
    if (langSwitch) {
        langSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            
            const currentCookie = getCookie('googtrans');

            if (currentCookie && currentCookie.includes('/en')) {
                // 如果当前是英文，切换回中文
                // 方法：清空 cookie 或者设为 /zh-CN/zh-CN
                setCookie('googtrans', '/zh-CN/zh-CN', 0); // 设为 0 会在关闭浏览器后失效，或者设具体的过期时间
                // 有时候需要完全删除 cookie 才能还原
                document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + document.domain + "; path=/;";
            } else {
                // 如果当前是中文，切换到英文
                setCookie('googtrans', '/zh-CN/en', 1);
            }

            // 刷新页面以应用更改
            location.reload();
        });
    }
});
