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

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (!link.classList.contains('lang-switch')) {
                closeMenu();
            }
        });
    });


    // === 2. Google 翻译集成逻辑 (修复版) ===

    // 2.1 动态注入 Google 翻译脚本
    if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.type = 'text/javascript';
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);

        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none';
        document.body.insertBefore(div, document.body.firstChild);
    }

    // 2.2 初始化函数 (这里加了关键修复)
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'zh-CN',
            includedLanguages: 'en,zh-CN',
            // 【关键修改】设置为 SIMPLE 布局，这会去掉顶部的蓝色/白色横幅
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE, 
            autoDisplay: false
        }, 'google_translate_element');
    };

    // 2.3 读取 Cookie
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
    const currentLangCookie = getCookie('googtrans');
    const langSpan = langSwitch ? langSwitch.querySelector('span') : null;
    const langIcon = langSwitch ? langSwitch.querySelector('.lang-icon') : null;

    if (langSpan && langIcon) {
        if (currentLangCookie && currentLangCookie.includes('/en')) {
            langSpan.innerText = '中文';
            langIcon.innerText = 'CN';
        } else {
            langSpan.innerText = 'EN';
            langIcon.innerText = '文';
        }
    }

    // 2.5 绑定点击事件
    if (langSwitch) {
        langSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            const currentCookie = getCookie('googtrans');
            if (currentCookie && currentCookie.includes('/en')) {
                // 切回中文
                setCookie('googtrans', '/zh-CN/zh-CN', 0);
                document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + document.domain + "; path=/;";
            } else {
                // 切到英文
                setCookie('googtrans', '/zh-CN/en', 1);
            }
            location.reload();
        });
    }
});
