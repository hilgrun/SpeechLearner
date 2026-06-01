// 全局变量
const video = document.getElementById('video');
const subtitlesDiv = document.getElementById('subtitles');
const favoritesDiv = document.getElementById('favorites');
const toggleOcclusionBtn = document.getElementById('toggle-occlusion');
const fontIncreaseBtn = document.getElementById('font-increase');
const fontDecreaseBtn = document.getElementById('font-decrease');
const fontSizeDisplay = document.getElementById('font-size-display');
const browserIframe = document.getElementById('browser-iframe');
const iframeError = document.getElementById('iframe-error');
const openInNewTabBtn = document.getElementById('open-in-new-tab');
const globalOffsetDecreaseBtn = document.getElementById('global-offset-decrease');
const globalOffsetIncreaseBtn = document.getElementById('global-offset-increase');
const cumulativeTimeElement = document.getElementById('cumulative-time');
let repeatTimer = null; // 用于存储连续播放中的 setTimeout ID
let pauseTime = 0; // 添加停顿时间变量，默认0秒
let arrowStep = 2; // 默认箭头调整步长（秒）
let playbackSpeed = 1.0; // 默认播放速度
let repeatCount = 3; // 默认重复次数
let currentLanguage = 'zh';
let subtitles = [];
let favorites = [];
let srtFilename = '';
let currentTimeUpdateHandler = null;
let lastActiveSubtitle = null;
let isSinglePlayback = false;
let isOcclusionEnabled = false;
let fontSize = 1.2;
let currentIframeUrl = '';
let isClearing = false;
let footer;

let startTime = null; // 延迟初始化，直到文件打开
let totalElapsed = 0; // 累计可见时间（秒）
let totalCumulativeElapsed = parseInt(localStorage.getItem('totalCumulativeElapsed')) || 0; // 所有访问页面的总累计时间（秒）
let lastStarCount = -1; // 记录上一次添加星星的小时数，默认 -1 表示未达到 1 小时
const usageTimeElement = document.getElementById('usage-time');
const starContainer = document.getElementById('star-container');
let timerId = null; // 用于存储 setInterval 的 ID
let isPageVisible = true; // 跟踪页面可见性
let debounceTimeout = null; // 用于防抖
let globalOffset = 0; // 整体时间偏移（秒）
let currentEditingSub = null; // 当前正在编辑的字幕对象
let currentColorTarget = null; // <--- 新增：'foreColor' 或 'hiliteColor'

const translations = {
    zh: {
        pageTitle: "视频播放器工具",
        pageHeading: "视频播放器工具",
        videoLabel: "选择视频文件",
        srtLabel: "选择字幕文件",
        favoritesLabel: "选择收藏列表文件",
        clearButton: "清空选择",
        openButton: "打开",
        rearrangeButton: "字幕重排",
        exportRearrangedButton: "导出重排字幕",
        exportButton: "导出收藏列表",
        playAllFavoritesButton: "播放全部收藏",
        toggleOcclusionButtonOn: "隐藏字幕",
        toggleOcclusionButtonOff: "显示字幕",
        startDecreaseTitle: "开始时间减少0.2秒",
        startIncreaseTitle: "开始时间增加0.2秒",
        playSingleTitle: "播放这句话并暂停",
        favoriteButton: "收藏",
        endDecreaseTitle: "结束时间减少0.2秒",
        endIncreaseTitle: "结束时间增加0.2秒",
        playContinuousTitle: "从这句开始连续播放后续字幕",
        removeButton: "移除",
        alertMessage: "请上传视频和SRT文件",
        videoError: "视频加载失败，请检查文件格式或路径。",
        fontSizeDisplay: "字体大小",
        timeOffsetDisplay: "整体字幕时间偏移",
        kimiButton: "Kimi",
        baiduButton: "百度翻译",
        testButton: "找台词",
        openInNewTabButton: "在新窗口打开",
        iframeError: "网站屏蔽窗口访问",
        footerHeading: "使用方法",
        footerImport: "导入：点击页面顶部的文件输入框，选择视频文件(.mp4)+字幕（.srt），或视频+保存项目(.zip)。点击“打开”按钮加载文件。",
        footerExport: "导出：会把整个项目打包导出到zip文件，文件保存在视频文件夹内",
        cumulativeTime: "累计时长",
        footerUsage: `
- 点击（青色）▶️”播放单句，点击（黄色）“▶️”连续播放后续字幕，通过句间停顿时间调整播放舒适性。
- 快捷键： 小键盘
- 7（加收藏），8（遮蔽字幕），9（笔记）
- 4（上一句)  ，5（重播）       ，6（下一句），
- 1（减速播放）3（加速播放），
- 0（连续播放/暂停视频）
- T（整体字幕时间前移），Y（整体字幕时间后移），
- /（起始时间-0.2秒），*（起始时间+0.2秒），-（结束时间-0.2秒），+（结束时间+0.2秒）
- ← → 播放时间前后跳跃
- 使用“字幕重排”按句子重新组织字幕，令句子完整播放，使用字体调整按钮更改字幕和收藏文本大小。
- 右下侧浏览器提供网站实供时学习。
- 星星显示累计投入学习时长：半小时1个星星，10个星星换1个太阳
        `
    },
    en: {
        pageTitle: "Video Player Tool",
        pageHeading: "Video Player Tool",
        videoLabel: "Select Video File",
        srtLabel: "Select SRT Subtitle File",
        favoritesLabel: "Select JSON Favorites File",
        clearButton: "Clear Selection",
        openButton: "Open",
        rearrangeButton: "Rearrange Subtitles",
        exportRearrangedButton: "Export Rearranged Subtitles",
        exportButton: "Export Favorites List",
        playAllFavoritesButton: "Play All Favorites",
        toggleOcclusionButtonOn: "Show Subtitles",
        toggleOcclusionButtonOff: "Hide Subtitles",
        startDecreaseTitle: "Decrease start time by 0.2s",
        startIncreaseTitle: "Increase start time by 0.2s",
        playSingleTitle: "Play this subtitle and pause",
        favoriteButton: "Favorite",
        endDecreaseTitle: "Decrease end time by 0.2s",
        endIncreaseTitle: "Increase end time by 0.2s",
        playContinuousTitle: "Play consecutive subtitles starting from this one",
        removeButton: "Remove",
        alertMessage: "Please upload a video and SRT file",
        videoError: "Video loading failed, please check file format or path.",
        fontSizeDisplay: "Font Size",
        timeOffsetDisplay: "Time Offset",
        kimiButton: "Kimi",
        baiduButton: "Baidu Translate",
        testButton: "Find Subtitles",
        openInNewTabButton: "Open in New Tab",
        iframeError: "Website blocks iframe access",
        footerHeading: "How to Use",
        footerImport: "Import: Click the file input fields at the top to select a video file (supports common formats like MP4), an SRT subtitle file (.srt), and optionally a favorites list (.json). Click the 'Open' button to load the files.",
        footerExport: "Export: Supports two export types. 1) Rearranged Subtitles: Click 'Export Rearranged Subtitles' to generate an SRT file with reorganized subtitles and adjusted offsets, useful for subtitle editing or playback. 2) Favorites List: Click 'Export Favorites List' to save favorite subtitles with their adjusted timestamps for study or review.",
        cumulativeTime: "Total Time",
        footerUsage: `
- After loading files, the subtitle list displays each subtitle's time and text.
- Adjust time offsets (±0.2s or manual input).
- Click '▶️' (cyan) to play a single subtitle, or '▶️' (yellow) to play consecutive subtitles.
- Click 'Favorite' or press W to add to the favorites list, which supports removal or single subtitle playback.
- Click 'Play All Favorites' to play all favorites in sequence with a 1s pause between subtitles.
- Use 'Rearrange Subtitles' to reorganize subtitles by sentences, automatically adjusting times to avoid overlaps.
- Click 'Show/Hide Subtitles' or press Q to toggle a frosted glass effect over the bottom 1/5 of the video and subtitle texts.
- Use font adjustment buttons to change subtitle and favorite text size.
- Use global time offset buttons (±0.2s, shortcuts Y/H) to adjust all subtitle timings.
- The navigation bar provides page links, and the right-side browser provides 'Kimi' and 'Baidu Translate' buttons to load the respective websites, with a fallback to open in a new tab if loading fails.
        `
    }
};

// 函数定义

// 打开编辑器
function openEditor(sub, subtitleElement) {
    currentEditingSub = { sub, subtitleElement };

    const editor = document.getElementById("rich-editor");
    // 如果有富文本内容就加载，否则用原始文本
    editor.innerHTML = sub.textHtml || sub.text;

    document.getElementById("editor-modal").style.display = "block";
}

// 格式化函数（扩展支持下划线样式和颜色类型）
function formatText(cmd, value = null) {
    if (cmd === 'underline' && value) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('insertHTML', false, '<span style="text-decoration: ' + value + ';">' + document.getSelection() + '</span>');
    } else if (cmd === 'hiliteColor' || cmd === 'foreColor') {
        document.execCommand(cmd, false, value);
    } else {
        document.execCommand(cmd, false, value);
    }
}


// 新的 applyUnderline 函数
function applyUnderline(style) {
    const underlineBtn = document.getElementById('underline-btn');
    const underlineMenu = document.getElementById('underline-menu');
    
    // 1. 更新按钮样式以显示当前选择
    underlineBtn.style.borderBottomStyle = style;
    underlineBtn.dataset.style = style;
    
    // 2. 应用到选中文本：先移除现有下划线，然后添加新样式（underline + border-bottom）
    const selection = document.getSelection();
    if (selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('removeFormat', false, 'underline'); // 先移除任何现有下划线，避免冲突
        
        const uniqueId = "underline-" + Date.now();
        let borderStyle = '';
        switch (style) { // 根据选择映射到 border-bottom 样式，同时保留 text-decoration
            case 'solid': borderStyle = 'solid'; break;
            case 'dashed': borderStyle = 'dashed'; break; // 长虚线
            case 'dotted': borderStyle = 'dotted'; break; // 短虚线
            case 'double': borderStyle = 'double'; break;
            default: borderStyle = 'solid';
        }
        // 插入 span：始终添加 underline，并叠加自定义 border-bottom（不覆盖原有颜色/样式）
        document.execCommand('insertHTML', false, `<span id="${uniqueId}" style="text-decoration: underline; border-bottom: 2px ${borderStyle} currentColor;">${selection.toString()}</span>`);
        const appliedElement = document.getElementById(uniqueId);
        if (appliedElement) {
            appliedElement.removeAttribute('id');
        }
    }
    
    // 3. 关闭菜单
    underlineMenu.style.display = 'none';
}

function applyBorder() {
    document.execCommand('styleWithCSS', false, true);
    const uniqueId = "border-" + Date.now();
    const selection = document.getSelection();
    if (selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
        // 添加 1px 黑色实线边框
        document.execCommand('insertHTML', false, `<span id="${uniqueId}" style="border: 1px solid black; padding: 2px;">${selection}</span>`);
        const appliedElement = document.getElementById(uniqueId);
        if (appliedElement) {
            appliedElement.removeAttribute('id');
        }
    }
}

function stopContinuousPlayback() {
    // 移除 timeupdate 监听器
    if (currentTimeUpdateHandler) {
        video.removeEventListener('timeupdate', currentTimeUpdateHandler);
        currentTimeUpdateHandler = null;
    }
    // 清除任何待执行的定时器
    if (repeatTimer) {
        clearTimeout(repeatTimer);
        repeatTimer = null;
    }
}

// 新的 applyColor 函数
function applyColor(color) {
    if (!currentColorTarget) return; // 如果没有目标，则不执行
    
    // 1. 应用颜色
    document.execCommand(currentColorTarget, false, color);
    
    // 2. 更新对应按钮的预览颜色
    const btnId = currentColorTarget === 'foreColor' ? 'forecolor-btn' : 'backcolor-btn';
    const colorBtn = document.getElementById(btnId);
    if(colorBtn) { // 确保按钮存在
        colorBtn.style.backgroundColor = color;
    }
    
    // 3. 关闭菜单
    const colorMenu = document.getElementById('color-menu');
    if(colorMenu) { // 确保菜单存在
        colorMenu.style.display = 'none';
    }
    currentColorTarget = null; // 重置目标
}

function applyPreset(style) {
    document.execCommand('styleWithCSS', false, true);
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const selText = selection.toString();
    const uniqueId = "preset-" + Date.now();
    let appliedEl = null;

    switch (style) {
        case 'phrase': {
            // 优先尝试 surroundContents 保留内部 HTML
            const span = document.createElement('span');
            span.className = 'preset-phrase';
            span.style.cssText = 'border:2px solid #00D7FF; padding:2px; display:inline-block; box-sizing:border-box;';
            try {
                range.surroundContents(span);
                appliedEl = span;
            } catch (e) {
                // 跨节点时 fallback 到 insertHTML
                const html = `<span id="${uniqueId}" class="preset-phrase" style="border:1px solid #00D7FF; padding:2px; display:inline-block; box-sizing:border-box;">${selText}</span>`;
                document.execCommand('insertHTML', false, html);
                appliedEl = document.getElementById(uniqueId);
                if (appliedEl) appliedEl.removeAttribute('id');
            }
        } break;

        case 'new-word': {
            const html = `<span id="${uniqueId}" class="preset-new-word" style="background-color:red;color:white; display:inline-block; padding:0 2px;">${selText}</span>`;
            document.execCommand('insertHTML', false, html);
            appliedEl = document.getElementById(uniqueId); if (appliedEl) appliedEl.removeAttribute('id');
        } break;

        case 'linking': {
            const html = `<span id="${uniqueId}" class="preset-linking" style="background-color:yellow;color:red;text-decoration:underline; display:inline-block; padding:0 2px;">${selText}</span>`;
            document.execCommand('insertHTML', false, html);
            appliedEl = document.getElementById(uniqueId); if (appliedEl) appliedEl.removeAttribute('id');
        } break;

        case 'weak': {
            const html = `<span id="${uniqueId}" class="preset-weak" style="background-color:blue; color:white; border-bottom:2px dotted white; display:inline-block; padding:0 2px;">${selText}</span>`;
            document.execCommand('insertHTML', false, html);
            appliedEl = document.getElementById(uniqueId); if (appliedEl) appliedEl.removeAttribute('id');
        } break;

        case 'schwa': {
            const html = `<span id="${uniqueId}" class="preset-schwa" style="background-color:green;color:white;border-bottom:4px double yellow; display:inline-block; padding:0 2px;">${selText}</span>`;
            document.execCommand('insertHTML', false, html);
            appliedEl = document.getElementById(uniqueId); if (appliedEl) appliedEl.removeAttribute('id');
        } break;

        case 'silent': {
            const html = `<span id="${uniqueId}" class="preset-silent" style="text-decoration:line-through; display:inline-block; padding:0 2px;">${selText}</span>`;
            document.execCommand('insertHTML', false, html);
            appliedEl = document.getElementById(uniqueId); if (appliedEl) appliedEl.removeAttribute('id');
        } break;

        default:
            return;
    }

    // 恢复选区：优先选中刚插入/包裹的元素（保持选中状态）
    const sel = document.getSelection();
    sel.removeAllRanges();
    if (appliedEl) {
        const newRange = document.createRange();
        try {
            newRange.selectNodeContents(appliedEl);
            sel.addRange(newRange);
        } catch (e) {
            // 若 selectNodeContents 失败，回退到原来的 range
            sel.addRange(range);
        }
    } else {
        sel.addRange(range);
    }
}


function clearFormat() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const plain = selection.toString();        // 取纯文本
    range.deleteContents();                    // 删除原选区
    const textNode = document.createTextNode(plain);
    range.insertNode(textNode);                // 插入纯文本节点
    // 恢复选区到刚插入的文本（保持选中）
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    selection.addRange(newRange);
}

//切换语言
function switchLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.getElementById('page-title').textContent = translations[lang].pageTitle;
    //document.getElementById('video-label').textContent = translations[lang].videoLabel;
    //document.getElementById('srt-label').textContent = translations[lang].srtLabel;
    //document.getElementById('favorites-label').textContent = translations[lang].favoritesLabel;
    document.getElementById('clear').textContent = translations[lang].clearButton;
    document.getElementById('open').textContent = translations[lang].openButton;
    document.getElementById('rearrange').textContent = translations[lang].rearrangeButton;
    //document.getElementById('export-rearranged').textContent = translations[lang].exportRearrangedButton;
    //document.getElementById('export').textContent = translations[lang].exportButton;
    document.getElementById('play-all-favorites').textContent = translations[lang].playAllFavoritesButton;
    toggleOcclusionBtn.textContent = isOcclusionEnabled ? translations[lang].toggleOcclusionButtonOff : translations[lang].toggleOcclusionButtonOn;
    document.getElementById('font-size-display').textContent = translations[lang].fontSizeDisplay;
    document.getElementById('time-offset-display').textContent = translations[lang].timeOffsetDisplay;
    document.getElementById('kimi-btn').textContent = translations[lang].kimiButton;
    document.getElementById('baidu-btn').textContent = translations[lang].baiduButton;
    document.getElementById('test-btn').textContent = translations[lang].testButton;
    document.getElementById('open-in-new-tab').textContent = translations[lang].openInNewTabButton;
    document.getElementById('iframe-error').textContent = translations[lang].iframeError;
    document.getElementById('footer-heading').textContent = translations[lang].footerHeading;
    document.getElementById('footer-import').textContent = translations[lang].footerImport;
    document.getElementById('footer-export').textContent = translations[lang].footerExport;
    const usageLines = translations[lang].footerUsage.trim().split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line);
    const usageList = document.getElementById('footer-usage');
    usageList.innerHTML = usageLines.map(line => `<li>${line}</li>`).join('');
    displaySubtitles();
    displayFavorites();
}

function switchTheme(theme) {
    document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    const sidebar = document.getElementById('sidebar');
    sidebar.className = `collapsed ${theme === 'light' ? 'light-theme' : 'dark-theme'}`;
    footer.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    subtitlesDiv.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    favoritesDiv.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    document.querySelectorAll('.subtitle').forEach(el => el.className = `subtitle ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.querySelectorAll('.favorite').forEach(el => el.className = `favorite ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.querySelectorAll('.subtitle-text').forEach(el => el.className = `subtitle-text ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.querySelectorAll('.subtitle-index').forEach(el => el.className = `subtitle-index ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.querySelectorAll('.favorite-text').forEach(el => el.className = `favorite-text ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.querySelectorAll('.favorite-time').forEach(el => el.className = `favorite-time ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.querySelectorAll('.offset-input').forEach(el => el.className = `offset-input ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.querySelectorAll('.remove-btn, .adjust-btn').forEach(el => el.className = `${el.className.split(' ')[0]} ${theme === 'light' ? 'light-theme' : 'dark-theme'}`);
    document.getElementById('video-container').style.borderColor = theme === 'light' ? '#ccc' : '#444';
    document.getElementById('favorites').style.borderColor = theme === 'light' ? '#ccc' : '#444';
    document.getElementById('browser-iframe').style.background = theme === 'light' ? '#fff' : '#222';
    starContainer.className = theme === 'light' ? 'star-container light-theme' : 'star-container dark-theme';
    cumulativeTimeElement.className = theme === 'light' ? 'cumulative-time light-theme' : 'cumulative-time dark-theme';
}

function toggleOcclusion() {
    isOcclusionEnabled = !isOcclusionEnabled;
    const displayValue = isOcclusionEnabled ? 'block' : 'none';
    document.getElementById('video-occlusion').style.display = displayValue;
    document.querySelectorAll('.subtitle-occlusion').forEach(el => el.style.display = displayValue);
    document.querySelectorAll('.favorite-occlusion').forEach(el => el.style.display = displayValue);
    toggleOcclusionBtn.textContent = isOcclusionEnabled ? translations[currentLanguage].toggleOcclusionButtonOff : translations[currentLanguage].toggleOcclusionButtonOn;
}

function updateFontSize(change) {
    fontSize = Math.max(0.5, Math.min(fontSize + change, 2.0));
    document.querySelectorAll('.subtitle-text, .favorite-text').forEach(el => {
        el.style.fontSize = `${fontSize}em`;
    });
    fontSizeDisplay.textContent = translations[currentLanguage].fontSizeDisplay;
}

function parseSRT(srtText) {
    const blocks = [];
    const lines = srtText.split('\n');
    let i = 0;
    while (i < lines.length) {
        let line = lines[i].trim();
        if (line === '') { i++; continue; }
        const index = parseInt(line);
        i++;
        const time = lines[i++].trim();
        const [start, end] = time.split(' --> ').map(t => t.trim());
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
            text += lines[i++] + '\n';
        }
        i++;
        blocks.push({ index, start, end, text: text.trim(), startOffset: 0, endOffset: 0 });
    }
    return blocks;
}

function timeToSeconds(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    const [hours, minutes, secondsStr] = timeStr.split(':');
    const seconds = parseFloat(secondsStr.replace(',', '.'));
    return parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + seconds;
}

function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toFixed(3).replace('.', ',').padStart(6, '0');
    return `${hours}:${mins}:${secs}`;
}

function adjustSubtitleTimes(subtitles) {
    for (let i = 0; i < subtitles.length - 1; i++) {
        const currentSub = subtitles[i];
        const nextSub = subtitles[i + 1];
        const currentEnd = timeToSeconds(currentSub.end) + (currentSub.endOffset || 0);
        const nextStart = timeToSeconds(nextSub.start) + (nextSub.startOffset || 0);
        if (currentEnd > nextStart) {
            nextSub.start = secondsToTime(currentEnd + 0.1);
            nextSub.startOffset = 0;
        }
    }
    return subtitles;
}

function rearrangeSRT(blocks) {
    const newBlocks = [];
    let buffer = [];
    let start = null;
    let startOffset = 0;
    let endOffset = 0;
    const sentenceEndRegex = /^[.!?。！？]$/;
    const englishRegex = /[a-zA-Z]/; // 检查是否包含英文字符

    for (let block of blocks) {
        // 检查整句是否在括号内，若是则丢弃
        let text = block.text.replace(/\n/g, ' ').trim();
        if (/^\s*\(.*\)\s*$/.test(text)) {
            continue; // 整句在括号内，跳过
        }

        // 移除括号及其内容
        text = text.replace(/\(.*?\)/g, '').trim();

        // 如果处理后文本为空，或不包含任何英文字符，跳过
        if (text === '' || !englishRegex.test(text)) {
            continue;
        }

        if (start === null) {
            start = block.start;
            startOffset = block.startOffset || 0;
        }
        buffer.push(text);
        const currentText = buffer.join(' ').trim();
        endOffset = block.endOffset || 0;

        if (sentenceEndRegex.test(currentText.slice(-1)) && !currentText.endsWith('...')) {
            // 检查最终句子是否包含英文字符
            if (englishRegex.test(currentText)) {
                newBlocks.push({
                    start,
                    end: block.end,
                    text: currentText,
                    startOffset,
                    endOffset
                });
            }
            buffer = [];
            start = null;
            startOffset = 0;
            endOffset = 0;
        }
    }

    if (buffer.length > 0) {
        const finalText = buffer.join(' ').trim().replace(/\(.*?\)/g, '').trim();
        // 如果最终句子不为空且包含英文字符，才加入
        if (finalText !== '' && !/^\s*\(.*\)\s*$/.test(finalText) && englishRegex.test(finalText)) {
            newBlocks.push({
                start,
                end: blocks[blocks.length - 1].end,
                text: finalText,
                startOffset,
                endOffset
            });
        }
    }

    return adjustSubtitleTimes(newBlocks);
}

function generateSRT(blocks) {
    let output = '';
    for (let i = 0; i < blocks.length; i++) {
        output += (i + 1) + '\n';
        const startTime = timeToSeconds(blocks[i].start) + (blocks[i].startOffset || 0) + globalOffset;
        const endTime = timeToSeconds(blocks[i].end) + (blocks[i].endOffset || 0) + globalOffset;
        output += secondsToTime(startTime) + ' --> ' + secondsToTime(endTime) + '\n';
        output += blocks[i].text + '\n\n';
    }
    return output;
}

//修改字幕列表输出
// ==== 重写并修复版：字幕列表输出（可直接替换） ====
function displaySubtitles() {
    subtitlesDiv.innerHTML = '';

    subtitles.forEach((sub, idx) => {
        const div = document.createElement('div');
        div.className = 'subtitle';
        div.dataset.start = timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset;
        div.dataset.end = timeToSeconds(sub.end) + (sub.endOffset || 0) + globalOffset;

        // === 时间列（开始时间： - [input] + ） ===
        const timeContainer = document.createElement('div');
        timeContainer.className = 'time-container';

        const minusBtn = document.createElement('button');
        minusBtn.className = 'time-adjust-btn';
        minusBtn.innerText = '−';
        minusBtn.title = translations[currentLanguage]?.startDecreaseTitle || '时间提前 0.2 秒';
minusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const shift = -0.2;
    const newStart = timeToSeconds(sub.start) + shift;
    sub.start = secondsToTime(newStart);
    // 不移除这行注释：不要修改结束时间
    displaySubtitles();
});

        const timeInput = document.createElement('input');
        timeInput.className = 'time-input';
        timeInput.type = 'text';
        timeInput.value = sub.start;
        timeInput.title = '输入新开始时间 (格式 00:00:05,200 或 秒数)';
        timeInput.addEventListener('change', (e) => {
            e.stopPropagation();
            const val = e.target.value.trim();
            let newTime;
            if (/^\d+(\.\d+)?$/.test(val)) {
                newTime = parseFloat(val);
            } else {
                newTime = timeToSeconds(val);
            }
            if (isNaN(newTime)) {
                alert('时间格式无效，请输入 00:00:05,200 或 秒数');
                e.target.value = sub.start;
                return;
            }
            const oldStart = timeToSeconds(sub.start);
            const diff = newTime - oldStart;
            sub.start = secondsToTime(newTime);
            sub.end = secondsToTime(timeToSeconds(sub.end) + diff); // 保持持续时长
            displaySubtitles();
        });

        const plusBtn = document.createElement('button');
        plusBtn.className = 'time-adjust-btn';
        plusBtn.innerText = '+';
        plusBtn.title = translations[currentLanguage]?.startIncreaseTitle || '时间延后 0.2 秒';
plusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const shift = 0.2;
    const newStart = timeToSeconds(sub.start) + shift;
    sub.start = secondsToTime(newStart);
    // 不移除这行注释：不要修改结束时间
    displaySubtitles();
});

        timeContainer.appendChild(minusBtn);
        timeContainer.appendChild(timeInput);
        timeContainer.appendChild(plusBtn);

        // === 调整列：恢复【结束时间】的 - [input] + （放在第二列，保持 grid 列对齐） ===
        const adjustContainer = document.createElement('div');
        adjustContainer.className = 'adjust-container';

        const endRow = document.createElement('div');
        endRow.className = 'adjust-row';

        const endDecreaseBtn = document.createElement('button');
        endDecreaseBtn.className = 'adjust-btn';
        endDecreaseBtn.innerText = '−';
        endDecreaseBtn.title = translations[currentLanguage]?.endDecreaseTitle || '结束时间提前 0.2 秒';
        endDecreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sub.end = secondsToTime(timeToSeconds(sub.end) - 0.2);
            // 若必要，检查与下一句重叠并自动调整下一句 start
            if (idx < subtitles.length - 1) {
                const nextSub = subtitles[idx + 1];
                const newEnd = timeToSeconds(sub.end);
                const nextStart = timeToSeconds(nextSub.start);
                if (newEnd > nextStart) {
                    // 将下句 start 后移一点，尽量避免覆盖（保持原逻辑的调整意图）
                    nextSub.start = secondsToTime(newEnd + 0.1);
                }
            }
            displaySubtitles();
        });

        const endInput = document.createElement('input');
        endInput.type = 'text';
        endInput.className = 'offset-input end-input';
        endInput.value = sub.end;
        endInput.title = '直接编辑结束时间 (格式 00:00:05,200 或 秒数)';
        endInput.addEventListener('change', (e) => {
            e.stopPropagation();
            const val = e.target.value.trim();
            let newTime;
            if (/^\d+(\.\d+)?$/.test(val)) {
                newTime = parseFloat(val);
            } else {
                newTime = timeToSeconds(val);
            }
            if (isNaN(newTime)) {
                alert('时间格式无效，请输入 00:00:05,200 或 秒数');
                e.target.value = sub.end;
                return;
            }
            // 保证 end >= start + tiny epsilon
            const minEnd = timeToSeconds(sub.start) + 0.05;
            if (newTime <= timeToSeconds(sub.start)) {
                newTime = minEnd;
            }
            sub.end = secondsToTime(newTime);
            // 若与下一句冲突，可微调下一句 start（可根据需求取消）
            if (idx < subtitles.length - 1) {
                const nextSub = subtitles[idx + 1];
                const nextStart = timeToSeconds(nextSub.start);
                if (newTime > nextStart) {
                    nextSub.start = secondsToTime(newTime + 0.1);
                }
            }
            displaySubtitles();
        });

        const endIncreaseBtn = document.createElement('button');
        endIncreaseBtn.className = 'adjust-btn';
        endIncreaseBtn.innerText = '+';
        endIncreaseBtn.title = translations[currentLanguage]?.endIncreaseTitle || '结束时间延后 0.2 秒';
        endIncreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sub.end = secondsToTime(timeToSeconds(sub.end) + 0.2);
            // 若与下一句重叠，自动推后下一句 start
            if (idx < subtitles.length - 1) {
                const nextSub = subtitles[idx + 1];
                const newEnd = timeToSeconds(sub.end);
                const nextStart = timeToSeconds(nextSub.start);
                if (newEnd > nextStart) {
                    nextSub.start = secondsToTime(newEnd + 0.1);
                }
            }
            displaySubtitles();
        });

        endRow.appendChild(endDecreaseBtn);
        endRow.appendChild(endInput);
        endRow.appendChild(endIncreaseBtn);

        adjustContainer.appendChild(endRow);

        // ===== 播放按钮（单句） =====
        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.innerText = '▶️';
        playBtn.title = translations[currentLanguage]?.playSingleTitle;
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSingleSubtitle(sub);
        });

        // 字幕文本
        const textSpan = document.createElement('span');
        textSpan.className = 'subtitle-text';
        textSpan.style.fontSize = `${fontSize}em`;
        textSpan.innerHTML = sub.textHtml || sub.text;
        textSpan.addEventListener('click', () => playSingleSubtitle(sub));

        // 收藏 + 编辑按钮（上下两行）
        const actionContainer = document.createElement('div');
        actionContainer.className = 'action-container';

        const favBtn = document.createElement('button');
        favBtn.innerText = translations[currentLanguage]?.favoriteButton || '收藏';
        favBtn.className = 'edit-btn';
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToFavorites(sub);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerText = '笔记';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditor(sub, div);
        });

        actionContainer.appendChild(favBtn);
        actionContainer.appendChild(editBtn);

        // 标签输入
        const tagInput = document.createElement('input');
        tagInput.className = 'tag-input';
        tagInput.setAttribute('list', 'tag-options');
        tagInput.value = sub.tag || '';
        tagInput.addEventListener('change', (e) => {
            sub.tag = e.target.value;
            const fav = favorites.find(f => f.start === sub.start && f.end === sub.end);
            if (fav) {
                fav.tag = sub.tag;
                displayFavorites();
            }
        });

        // ===== 播放按钮容器（垂直排列） =====
        const playContainer = document.createElement('div');
        playContainer.className = 'play-container';
        playContainer.appendChild(playBtn);

        const playContinuousBtn = document.createElement('button');
        playContinuousBtn.className = 'play-continuous-btn';
        playContinuousBtn.innerText = '▶️';
        playContinuousBtn.title = translations[currentLanguage]?.playContinuousTitle;
        playContinuousBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const curIdx = subtitles.indexOf(sub);
            if (curIdx >= 0) playConsecutiveSubtitles(sub, curIdx);
        });
        playContainer.appendChild(playContinuousBtn);

        // ===== 删除按钮 =====
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = '删除此句';
        deleteBtn.innerText = '🗑';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm('确定要删除此句字幕吗？')) return;
            const remIdx = subtitles.indexOf(sub);
            if (remIdx !== -1) {
                // 同步删除 favorites 中对应项（可选）
                favorites = favorites.filter(f => !(f.start === sub.start && f.end === sub.end && f.text === sub.text));
                subtitles.splice(remIdx, 1);
                if (lastActiveSubtitle === sub) lastActiveSubtitle = null;
                displayFavorites();
                displaySubtitles();
            }
        });

        // 遮挡层
        const occlusionDiv = document.createElement('div');
        occlusionDiv.className = 'subtitle-occlusion';
        occlusionDiv.style.display = isOcclusionEnabled ? 'block' : 'none';

// === 创建合并的时间调整容器 ===
const timeAdjustContainer = document.createElement('div');
timeAdjustContainer.className = 'time-adjust-container';

// 将开始时间调整和结束时间调整添加到合并容器中
timeAdjustContainer.appendChild(timeContainer);
timeAdjustContainer.appendChild(adjustContainer);

        // === 按原先顺序插入元素（保持 grid 列对应） ===
div.appendChild(timeAdjustContainer);   // 列 1: 合并的时间调整
div.appendChild(playContainer);         // 列 2: 播放按钮列
div.appendChild(textSpan);              // 列 3: 字幕文本（1fr）
div.appendChild(actionContainer);       // 列 4: 收藏/笔记
div.appendChild(tagInput);              // 列 5: 标签
div.appendChild(deleteBtn);             // 列 6: 删除按钮
div.appendChild(occlusionDiv);

        subtitlesDiv.appendChild(div);
    });

    // 重新应用当前主题并更新高亮
    const currentTheme = document.body.className === 'light-theme' ? 'light' : 'dark';
    switchTheme(currentTheme);
    updateHighlight();
}

function displayFavorites() {
    favoritesDiv.innerHTML = '';
    favorites.forEach((fav, idx) => {
        const div = document.createElement('div');
        div.className = 'favorite-subtitle';  // 或 'favorite'，取决于您的代码

        // 时间显示（如果需要取消注释）
        // const timeSpan = ... (保持注释或添加，如果需要)

        // 播放按钮
        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.innerText = '▶️';
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSingleSubtitle(fav);
        });

        // 文本（支持富文本）
        const textSpan = document.createElement('span');
        textSpan.className = 'favorite-text';
        textSpan.style.fontSize = `${fontSize}em`;
        textSpan.innerHTML = fav.textHtml || fav.text;

        // 移除按钮
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerText = '❌';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            favorites.splice(idx, 1);
            displayFavorites();  // 或 displayFavorites()
        });

        // 标签输入（下拉框，已固定宽度 120px）
        const tagInput = document.createElement('input');
        tagInput.className = 'tag-input';
        tagInput.setAttribute("list", "tag-options");
        tagInput.value = fav.tag || "";
        tagInput.style.width = "120px";
        tagInput.addEventListener('change', (e) => {
            fav.tag = e.target.value;
            const sub = subtitles.find(s => s.start === fav.start && s.end === fav.end);
            if (sub) {
                sub.tag = fav.tag;
                displaySubtitles();
            }
        });
	tagInput.addEventListener("mousedown", function () {
    		if (this.value !== "") {
        		this.dataset.oldValue = this.value;
        		this.value = "";
        		setTimeout(() => {
            			if (this.dataset.oldValue) {
                			this.value = this.dataset.oldValue;
            			}
        		}, 200);
    		}
	});

        // 遮挡层（稍后处理第二个问题）
        const occlusionDiv = document.createElement('div');
        occlusionDiv.className = 'favorite-occlusion';
        occlusionDiv.style.display = isOcclusionEnabled ? 'block' : 'none';
        div.appendChild(occlusionDiv);  // 取消注释，确保添加

        // 添加到行（新顺序：播放 → 文本 → 移除 → 标签）
        div.appendChild(playBtn);
        div.appendChild(textSpan);
        div.appendChild(removeBtn);  // 现在移除在标签前
        div.appendChild(tagInput);   // 标签移到最后

        favoritesDiv.appendChild(div);
    });

favoritesDiv.scrollTop = favoritesDiv.scrollHeight;// 保持收藏区滚动到底部
}
function addToFavorites(sub) {
    const fav = {
        start: sub.start,
        end: sub.end,
        text: sub.text,
        startOffset: sub.startOffset || 0,
        endOffset: sub.endOffset || 0,
        tag: sub.tag || "",
        textHtml: sub.textHtml || sub.text
    };
    if (!favorites.some(f => f.start === fav.start && f.end === fav.end && f.text === fav.text)) {
        favorites.push(fav);
        displayFavorites();
    }
}

function playSingleSubtitle(sub) {
    stopContinuousPlayback(); // 清理定时器及旧监听器
    const startTime = timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset;
    const endTime = timeToSeconds(sub.end) + (sub.endOffset || 0) + globalOffset;
    video.currentTime = startTime;
    video.play();
    isSinglePlayback = true;
    const handler = () => {
        if (video.currentTime >= endTime) {
            video.pause();
            video.currentTime = endTime - 0.01;
            isSinglePlayback = false;
        }
    };
    video.addEventListener('timeupdate', handler);
    currentTimeUpdateHandler = handler;
}

//连续播放按钮
function playConsecutiveSubtitles(startSub, startIndex) {
    stopContinuousPlayback(); // 清理之前的连续播放
    if (!subtitles.length) return;

    let currentIdx = startIndex;
    let currentRepeat = 0;

    const playCurrent = () => {
        const sub = subtitles[currentIdx];
        const startTime = timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset;
        const endTime = timeToSeconds(sub.end) + (sub.endOffset || 0) + globalOffset;

        video.currentTime = startTime;
        video.play();

        const handler = () => {
            if (video.currentTime >= endTime) {
                video.pause();
                video.removeEventListener('timeupdate', handler);
                currentRepeat++;

                if (currentRepeat < repeatCount) {
                    // 同一句重播，等待 pauseTime 后重新开始
                    if (repeatTimer) clearTimeout(repeatTimer);
                    repeatTimer = setTimeout(() => {
                        video.currentTime = startTime;
                        video.play();
                        video.addEventListener('timeupdate', handler);
                    }, pauseTime * 1000);
                } else {
                    currentRepeat = 0;
                    currentIdx++;
                    if (currentIdx < subtitles.length) {
                        if (repeatTimer) clearTimeout(repeatTimer);
                        repeatTimer = setTimeout(() => {
                            playCurrent(); // 播放下一个字幕
                        }, pauseTime * 1000);
                    }
                }
            }
        };
        video.addEventListener('timeupdate', handler);
        currentTimeUpdateHandler = handler;
    };

    playCurrent();
}

function playAllFavorites() {
    if (favorites.length === 0) {
        alert("没有收藏的字幕。");
        return;
    }

    if (currentTimeUpdateHandler) {
        video.removeEventListener('timeupdate', currentTimeUpdateHandler);
        currentTimeUpdateHandler = null;
    }

    let favIdx = 0;           // 收藏列表索引
    let currentRepeat = 0;    // 当前收藏字幕重复次数

    const playNextFavorite = () => {
        if (favIdx >= favorites.length) {
            video.pause();
            return;
        }
        const sub = favorites[favIdx];
        const startTime = timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset;
        const endTime = timeToSeconds(sub.end) + (sub.endOffset || 0) + globalOffset;

        video.currentTime = startTime;
        video.play();

        const handler = () => {
            if (video.currentTime >= endTime) {
                video.pause();
                video.removeEventListener('timeupdate', handler);
                currentRepeat++;

                if (currentRepeat < repeatCount) {
                    // 重复当前收藏
                    setTimeout(() => {
                        video.currentTime = startTime;
                        video.play();
                        video.addEventListener('timeupdate', handler);
                    }, pauseTime * 1000);
                } else {
                    currentRepeat = 0;
                    favIdx++;
                    setTimeout(() => {
                        playNextFavorite();
                    }, pauseTime * 1000);
                }
            }
        };
        video.addEventListener('timeupdate', handler);
        currentTimeUpdateHandler = handler;
    };

    playNextFavorite();
}


function removeFromFavorites(fav) {
    favorites = favorites.filter(f => f.start !== fav.start || f.text !== fav.text);
    displayFavorites();
}

function updateHighlight() {
    document.querySelectorAll('.subtitle').forEach(el => el.classList.remove('active'));

    if (!lastActiveSubtitle) return;

    const targetStart = timeToSeconds(lastActiveSubtitle.start) + (lastActiveSubtitle.startOffset || 0) + globalOffset;

    // ✅ 容差匹配，避免浮点数不一致
    let targetElement = null;
    let minDiff = Infinity;

    document.querySelectorAll('.subtitle').forEach(el => {
        const start = parseFloat(el.dataset.start);
        const diff = Math.abs(start - targetStart);
        if (diff < minDiff) {
            minDiff = diff;
            targetElement = el;
        }
    });

    if (targetElement) {
        targetElement.classList.add('active');
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


function highlightSubtitle() {
    const currentTime = video.currentTime;
    let activeSubtitle = subtitles.find(sub =>
        currentTime >= timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset &&
        currentTime <= timeToSeconds(sub.end) + (sub.endOffset || 0) + globalOffset  // 移除 +tolerance
    );
    if (!activeSubtitle && lastActiveSubtitle && 
        currentTime <= timeToSeconds(lastActiveSubtitle.end) + (lastActiveSubtitle.endOffset || 0) + globalOffset) {
        activeSubtitle = lastActiveSubtitle;  // 保留备份
    }
    if (!activeSubtitle && subtitles.length > 0) {
        activeSubtitle = subtitles[0];
    }
    // 清除所有 active class
    document.querySelectorAll('.subtitle.active').forEach(el => el.classList.remove('active'));
    if (activeSubtitle) {
        const subtitleElements = document.querySelectorAll('.subtitle');
        subtitleElements.forEach(el => {
            const start = parseFloat(el.dataset.start);
            const end = parseFloat(el.dataset.end);
            if (currentTime >= start && currentTime <= end) {  // 移除 +tolerance
                el.classList.add('active');
            }
        });
        lastActiveSubtitle = activeSubtitle;

        // 新增：自动滚动到高亮字幕
        const activeElement = document.querySelector('.subtitle.active');
        if (activeElement) {
            activeElement.scrollIntoView({
                behavior: 'smooth',  // 平滑滚动
                block: 'center',     // 滚动到视口中心
                inline: 'nearest'    // 水平方向最近
            });
        }
    }
}
function handleRearrange() {
    if (!subtitles.length || !srtFilename) return;
    const newBlocks = rearrangeSRT(subtitles);
    subtitles = newBlocks.map((block, idx) => ({
        index: idx + 1,
        start: block.start,
        end: block.end,
        text: block.text,
        startOffset: block.startOffset || 0,
        endOffset: block.endOffset || 0
    }));
    lastActiveSubtitle = null;
    displaySubtitles();
}



// 添加星星或太阳（保留以备扩展）
function addStar() {
    const star = document.createElement('span');
    star.className = 'star';
    star.innerText = '⭐';
    starContainer.appendChild(star);
}

function addSun() {
    const sun = document.createElement('span');
    sun.className = 'sun';
    sun.innerText = '☀️';
    starContainer.appendChild(sun);
}

// 更新使用时长的函数
function updateUsageTime() {
    if (!startTime) return; // 未开始计时
    const now = performance.now();
    const elapsed = totalElapsed + Math.floor((now - startTime) / 1000); // 累计秒数
    const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    usageTimeElement.textContent = `使用时长: ${hours}:${minutes}:${seconds}`;
    const star_unit = 1800; // <==========================================修改这里，每n秒1个星星
    const sun_unit = 10;    //   <==========================================修改这里，每n个星星换1个太阳
    // 检查并更新星星和太阳
    const currentStar = Math.floor(totalCumulativeElapsed / star_unit);
    if (currentStar > lastStarCount) {
        starContainer.innerHTML = ''; // 清空现有星星和太阳
        const sun_count = Math.floor(currentStar / sun_unit); // 每4个星星换1个太阳
        const remainingStars = currentStar % sun_unit; // 剩余星星数
        for (let i = 0; i < sun_count; i++) {
            const sun = document.createElement('span');
            sun.className = 'sun';
            sun.innerText = '☀️';
            starContainer.appendChild(sun);
        }
        for (let i = 0; i < remainingStars; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.innerText = '⭐';
            starContainer.appendChild(star);
        }
        lastStarCount = currentStar; // 更新 lastStarCount 为当前星星数
    }

    // 更新累计时长
    totalCumulativeElapsed += 1; // 每秒增加1秒
    localStorage.setItem('totalCumulativeElapsed', totalCumulativeElapsed);
    const cumHours = Math.floor(totalCumulativeElapsed / 3600).toString().padStart(2, '0');
    const cumMinutes = Math.floor((totalCumulativeElapsed % 3600) / 60).toString().padStart(2, '0');
    const cumSeconds = (totalCumulativeElapsed % 60).toString().padStart(2, '0');
    cumulativeTimeElement.textContent = `累计时长: ${cumHours}:${cumMinutes}:${cumSeconds}`;
}

// 启动定时器
function startTimer() {
    if (timerId || !startTime || !isPageVisible) return; // 防止重复启动
    startTime = performance.now(); // 重置开始时间
    timerId = setInterval(updateUsageTime, 1000);
    console.log('Timer started, startTime:', new Date().toLocaleString());
}

// 停止定时器
function stopTimer() {
    if (timerId) {
        totalElapsed += Math.floor((performance.now() - startTime) / 1000); // 保存累计时间
        totalCumulativeElapsed += Math.floor((performance.now() - startTime) / 1000); // 更新累计时长
        localStorage.setItem('totalCumulativeElapsed', totalCumulativeElapsed);
        clearInterval(timerId);
        timerId = null;
        console.log('Timer stopped, totalElapsed:', totalElapsed);
    }
}

// 初始化事件
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    footer = document.querySelector('footer');
    const sidebar = document.getElementById('sidebar');
    const collapseToggle = document.getElementById('collapse-toggle');

    // Sidebar Toggle
    collapseToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        document.body.style.marginLeft = isCollapsed ? '70px' : '200px';
        collapseToggle.textContent = isCollapsed ? '☰' : '×';
    });

    // 初始化语言和主题
    switchLanguage('zh');
    switchTheme('dark');

    // 初始化时长显示
    usageTimeElement.textContent = `使用时长: 0:00:00`;

    // 从 localStorage 加载累计时长并渲染初始星星和太阳
    totalCumulativeElapsed = parseInt(localStorage.getItem('totalCumulativeElapsed')) || 0;
    starContainer.innerHTML = ''; // 清空现有星星和太阳
    const star_unit = 1800// <==================修改这里，每n秒1个星星
    const sun_unit=10 // <===========================修改这里，每n个星星换1个太阳
    const star_count = Math.floor(totalCumulativeElapsed / star_unit);   
    const sun_count = Math.floor(star_count / sun_unit); 
    const remainingStars = star_count % sun_unit;     
    for (let i = 0; i < sun_count; i++) {
        const sun = document.createElement('span');
        sun.className = 'sun';
        sun.innerText = '☀️';
        starContainer.appendChild(sun);
    }
    for (let i = 0; i < remainingStars; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.innerText = '⭐';
        starContainer.appendChild(star);
    }
    lastStarCount = star_count; // 更新 lastStarCount 为总小时数

    const cumHours = Math.floor(totalCumulativeElapsed / 3600).toString().padStart(2, '0');
    const cumMinutes = Math.floor((totalCumulativeElapsed % 3600) / 60).toString().padStart(2, '0');
    const cumSeconds = (totalCumulativeElapsed % 60).toString().padStart(2, '0');
    cumulativeTimeElement.textContent = `累计时长: ${cumHours}:${cumMinutes}:${cumSeconds}`;

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const isHidden = document.hidden;
            console.log('Visibility changed (debounced), hidden:', isHidden, 'isPageVisible:', isPageVisible, 'startTime:', new Date().toLocaleString());
            if (isHidden && startTime) {
                stopTimer();
                isPageVisible = false;
            } else if (!isHidden && startTime) {
                isPageVisible = true;
                startTimer();
            }
        }, 100); // 100ms 防抖
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 整体偏移按钮事件
    globalOffsetIncreaseBtn.addEventListener('click', () => {
        globalOffset += 0.2; //整体偏移+0.2秒
        displaySubtitles();
        displayFavorites();
    });

    globalOffsetDecreaseBtn.addEventListener('click', () => {
        globalOffset -= 0.2;//整体偏移-0.2秒
        displaySubtitles();
        displayFavorites();
    });

    // 停顿时间控制
    document.getElementById('decrease-pause').addEventListener('click', () => {
        pauseTime = Math.max(0, pauseTime - 1);
        document.getElementById('pause-time').textContent = pauseTime;
    });

    document.getElementById('increase-pause').addEventListener('click', () => {
        pauseTime += 1;
        document.getElementById('pause-time').textContent = pauseTime;
    });

    //复读次数控制
    const repeatSelect = document.getElementById('repeat-select');
    repeatSelect.value = repeatCount;   // 同步变量到下拉框
    repeatSelect.addEventListener('change', (e) => {
        repeatCount = parseInt(e.target.value, 10);
    });

    // 箭头步长下拉框
    const arrowStepSelect = document.getElementById('arrow-step');
    arrowStepSelect.value = arrowStep; // 设置默认选中
    arrowStepSelect.addEventListener('change', (e) => {
        arrowStep = parseInt(e.target.value, 10);
    });

    // 事件监听
    video.addEventListener('error', () => {
        if (!isClearing) {
            console.error('Video error:', video.error);
            alert(translations[currentLanguage].videoError);
        }
    });

// ======== 富文本编辑器新逻辑 - 开始 ========
    const editorToolbar = document.getElementById('editor-toolbar');
    const underlineContainer = document.getElementById('underline-container');
    const underlineBtn = document.getElementById('underline-btn');
    const underlineMenu = document.getElementById('underline-menu');
    const forecolorContainer = document.getElementById('forecolor-container');
    const backcolorContainer = document.getElementById('backcolor-container');
    const colorMenu = document.getElementById('color-menu');




document.getElementById('clear-format-btn').addEventListener('click', clearFormat);
document.getElementById('preset-phrase').addEventListener('click', () => applyPreset('phrase'));
document.getElementById('preset-new-word').addEventListener('click', () => applyPreset('new-word'));
document.getElementById('preset-linking').addEventListener('click', () => applyPreset('linking'));
document.getElementById('preset-weak').addEventListener('click', () => applyPreset('weak'));
document.getElementById('preset-schwa').addEventListener('click', () => applyPreset('schwa'));
//document.getElementById('preset-silent').addEventListener('click', () => applyPreset('silent'));
    // ======== 富文本编辑器新逻辑 - 结束 ========


// 保存编辑结果
document.getElementById("save-edit").addEventListener("click", () => {
    if (!currentEditingSub) return;

    const editor = document.getElementById("rich-editor");
    const { sub, subtitleElement } = currentEditingSub;

    // 保存富文本 HTML
    sub.textHtml = editor.innerHTML;

    // 更新字幕列表里的显示
    const textSpan = subtitleElement.querySelector(".subtitle-text");
    if (textSpan) {
        textSpan.innerHTML = sub.textHtml;
    }

    // 关闭模态框
    document.getElementById("editor-modal").style.display = "none";
    currentEditingSub = null;
});

// 取消编辑
document.getElementById("cancel-edit").addEventListener("click", () => {
    document.getElementById("editor-modal").style.display = "none";
    currentEditingSub = null;
});



// 打开按钮事件监听器
document.getElementById('open').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);

    if (files.length === 0) {
        alert("请选择文件。");
        return;
    }
    resetProjectState(); // 加载前重置状态
    document.getElementById('container').style.display = 'block';

    // 提取视频文件（必须有）
    const videoFile = files.find(f => f.type.startsWith('video/'));
    if (!videoFile) {
        alert("请上传视频文件。");
        return;
    }
    videoFilename = videoFile.name;
    video.src = URL.createObjectURL(videoFile);
    video.load();

    // 立即添加 loadedmetadata 监听器，并用 Promise 包装等待事件触发
const metadataPromise = new Promise(resolve => {
    video.addEventListener('loadedmetadata', () => {
        requestAnimationFrame(() => {
            subtitlesDiv.style.height = `${video.offsetHeight}px`;
            favoritesDiv.style.height = `${browserIframe.offsetHeight}px`;
            resolve();
        });
    }, { once: true });
});

    // 检查是否有 zip 文件
    const zipFile = files.find(f => f.name.toLowerCase().endsWith('.zip'));
    if (zipFile) {
        // 处理 zip：解压获取 srt/json 等
        try {
            const zip = await JSZip.loadAsync(zipFile);
            let srtFile, favoritesFile, editedFile;

	zip.forEach((relativePath, file) => {
    		const lowerCaseName = relativePath.toLowerCase();
    		if (lowerCaseName.endsWith('.srt')) {
        		srtFile = file;
        		srtFilename = file.name;
    		} else if (lowerCaseName.includes('favorites.json')) {
        		favoritesFile = file;
    		} else if (lowerCaseName.includes('edited_subtitles.json')) {
        		editedFile = file;
    		} else if (lowerCaseName.includes('highlight_index.json')) {
        		highlightFile = file;
    		}
	});

            if (!srtFile) {
                throw new Error("ZIP 文件中必须包含 SRT 字幕文件。");
            }

            if (editedFile) {
                const editedContent = await editedFile.async("string");
                subtitles = JSON.parse(editedContent);
            } else {
                const srtContent = await srtFile.async("string");
                subtitles = parseSRT(srtContent);
            }
            displaySubtitles();

            if (favoritesFile) {
                const favoritesContent = await favoritesFile.async("string");
                favorites = JSON.parse(favoritesContent);
                displayFavorites();
            }

            // 等待视频元数据加载完成（设置高度）
            await metadataPromise;

            commonFileLoadSetup();

if (highlightFile) {
    try {
        const { index } = JSON.parse(await highlightFile.async("string"));
        if (index >= 0 && index < subtitles.length) {
            // 保存目标索引
            const highlightIndex = index;

            // 重新渲染字幕
            displaySubtitles();

            // ✅ 延迟执行以确保DOM加载完成
            setTimeout(() => {
                jumpToHighlightIndex(highlightIndex);
            }, 300);
        }
    } catch (e) {
        console.warn("读取 highlight_index.json 失败:", e);
    }
}



        } catch (error) {
            console.error("处理 ZIP 文件失败:", error);
            alert(`处理 ZIP 文件失败: ${error.message}`);
        }
    } else {
        // 无 zip，处理 srt + 可选 json
        const srtFile = files.find(f => f.name.toLowerCase().endsWith('.srt'));
        const jsonFile = files.find(f => f.name.toLowerCase().endsWith('.json'));

        if (!srtFile) {
            alert("请上传 SRT 文件或 ZIP 项目文件。");
            return;
        }

        srtFilename = srtFile.name;
        const srtReader = new FileReader();
        srtReader.onload = async (e) => {
            try {
                subtitles = parseSRT(e.target.result);
                displaySubtitles();

                if (jsonFile) {
                    const jsonReader = new FileReader();
                    jsonReader.onload = (ev) => {
                        favorites = JSON.parse(ev.target.result);
                        displayFavorites();
                    };
                    jsonReader.readAsText(jsonFile);
                }

                // 等待视频元数据加载完成（设置高度）
                await metadataPromise;

                commonFileLoadSetup();
            } catch (err) {
                console.error('解析 SRT 失败:', err);
                alert('无法解析 SRT 文件，请检查文件内容。');
            }
        };
        srtReader.onerror = () => alert('无法读取 SRT 文件。');
        srtReader.readAsText(srtFile);
    }
});

// 更新“清空选择”按钮事件监听器
document.getElementById('clear').addEventListener('click', () => {
    document.getElementById('fileInput').value = '';
    resetProjectState(); // 使用新的重置函数
});

// 新增“保存项目”按钮事件监听器
document.getElementById('save-project').addEventListener('click', async () => {
    if (!video.src || !srtFilename) {
        alert("没有可保存的项目。请先导入视频和字幕。");
        return;
    }

    try {
        const zip = new JSZip();

        // 1. 添加重排后的SRT文件
        const rearrangedSubtitles = rearrangeSRT([...subtitles]);
        const srtContent = generateSRT(rearrangedSubtitles);
        zip.file(srtFilename.replace(/.srt/i, '_rearranged.srt'), srtContent);

        // 2. 添加收藏列表 JSON 文件
        if (favorites.length > 0) {
            const favoritesJson = JSON.stringify(favorites, null, 2);
            zip.file('favorites.json', favoritesJson);
        }

	// 保存当前高亮字幕索引
	const highlightIndex = subtitles.findIndex(s => s === lastActiveSubtitle);
	zip.file('highlight_index.json', JSON.stringify({ index: highlightIndex }));

        // 3. 添加包含富文本编辑的字幕 JSON 文件

        const editedSubtitlesJson = JSON.stringify(subtitles, null, 2);
        zip.file('edited_subtitles.json', editedSubtitlesJson);

        // 生成 ZIP 文件并下载
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        const projectFilename = videoFilename.substring(0, videoFilename.lastIndexOf('.')) || 'project';
        link.download = `${projectFilename}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("创建项目文件失败:", error);
        alert("创建项目文件失败，请查看控制台获取更多信息。");
    }
});
    document.getElementById('playback-speed-decrease').addEventListener('click', () => updatePlaybackSpeed(-0.2));
    document.getElementById('playback-speed-increase').addEventListener('click', () => updatePlaybackSpeed(0.2));
    document.getElementById('rearrange').addEventListener('click', handleRearrange);
    document.getElementById('play-all-favorites').addEventListener('click', playAllFavorites);
    document.getElementById('toggle-occlusion').addEventListener('click', toggleOcclusion);
    fontIncreaseBtn.addEventListener('click', () => updateFontSize(0.1));
    fontDecreaseBtn.addEventListener('click', () => updateFontSize(-0.1));

    document.querySelectorAll('input[name="language"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) switchLanguage(e.target.value);
        });
    });

    document.querySelectorAll('input[name="theme"]')?.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) switchTheme(e.target.value);
        });
    });

    const kimiBtn = document.getElementById('kimi-btn');
    kimiBtn.addEventListener('click', () => {
        currentIframeUrl = 'https://kimi.moonshot.cn';
        iframeError.style.display = 'none';
        openInNewTabBtn.style.display = 'none';
        browserIframe.src = currentIframeUrl;
    });

    const baiduBtn = document.getElementById('baidu-btn');
    baiduBtn.addEventListener('click', () => {
        currentIframeUrl = 'https://fanyi.baidu.com';
        iframeError.style.display = 'none';
        openInNewTabBtn.style.display = 'none';
        browserIframe.src = currentIframeUrl;
    });

    const zhaotaiciBtn = document.getElementById('test-btn');
    zhaotaiciBtn.addEventListener('click', () => {
        currentIframeUrl = 'https://33.agilestudio.cn/';
        iframeError.style.display = 'none';
        openInNewTabBtn.style.display = 'none';
        browserIframe.src = currentIframeUrl;
    });

    browserIframe.addEventListener('error', () => {
        iframeError.style.display = 'block';
        openInNewTabBtn.style.display = 'block';
        openInNewTabBtn.onclick = () => {
            if (currentIframeUrl) {
                window.open(currentIframeUrl, '_blank');
            }
        };
    });

    browserIframe.addEventListener('load', () => {
        if (browserIframe.src !== 'about:blank') {
            iframeError.style.display = 'none';
            openInNewTabBtn.style.display = 'none';
        }
    });

document.addEventListener('keydown', (e) => {
    if (!subtitles.length || !video.src) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    console.log(`Key pressed: ${e.key}`);

    const currentTime = video.currentTime;
    let currentSubtitleIndex = subtitles.findIndex(sub => 
        currentTime >= timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset && 
        currentTime <= timeToSeconds(sub.end) + (sub.endOffset || 0) + globalOffset
    );
    if (currentSubtitleIndex === -1 && lastActiveSubtitle) {
        currentSubtitleIndex = subtitles.indexOf(lastActiveSubtitle);  // 优先用上一个活跃句
    }
    if (currentSubtitleIndex === -1) {  // 再 fallback
        currentSubtitleIndex = subtitles.findIndex(sub => 
            timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset > currentTime 
        ) - 1;
        if (currentSubtitleIndex < 0) currentSubtitleIndex = 0;
    }

	// 富文本编辑器键盘快捷键
	document.addEventListener('keydown', (e) => {
    	const modal = document.getElementById('editor-modal');
   	 if (modal.style.display === 'block') {
       	 	// ESC 关闭不保存
        	if (e.key === 'Escape') {
            		e.preventDefault();
            		modal.style.display = 'none';
        	}
		// Shift + Enter 保存并关闭
		if (e.key === 'Enter' && e.shiftKey) {
			e.preventDefault();
			document.getElementById('save-edit').click();
			}
		}
	});
    console.log('Attempting to adjust startOffset. lastActiveSubtitle:', lastActiveSubtitle);
    
    // 处理左右箭头调整播放时间
    if (e.key === '1') {
        e.preventDefault();
        if (video.duration) {
            video.currentTime = Math.max(0, video.currentTime - arrowStep);
        }
        return;
    }
    if (e.key === '2') {
        e.preventDefault();
        if (video.duration) {
            video.currentTime = Math.min(video.duration, video.currentTime + arrowStep);
        }
        return;
    }
    if (e.key === '.' || e.key === 'Decimal') {
        e.preventDefault();
        updatePlaybackSpeed(-0.2);
        return; // 直接返回，避免进入 switch
    }
    //处理数字键快捷键
    switch (e.key.toLowerCase()) {
        case '4':
            if (currentSubtitleIndex > 0) {
                e.preventDefault();
                playSingleSubtitle(subtitles[currentSubtitleIndex - 1]);
            }
            break;
        case '6':
            if (currentSubtitleIndex < subtitles.length - 1) {
                e.preventDefault();
                playSingleSubtitle(subtitles[currentSubtitleIndex + 1]);
            }
            break;
        case '5':
            e.preventDefault();
            const currentSubS = lastActiveSubtitle || subtitles[currentSubtitleIndex] || subtitles[0];
            if (currentSubS) playSingleSubtitle(currentSubS);
            break;

        case '.': // 新增：小键盘2（以及主键盘2）触发连续播放
            e.preventDefault();
            let startIdx = subtitles.indexOf(lastActiveSubtitle);
            if (startIdx === -1) {
                startIdx = subtitles.findIndex(sub => 
                    currentTime >= timeToSeconds(sub.start) + (sub.startOffset || 0) + globalOffset && 
                    currentTime <= timeToSeconds(sub.end) + (sub.endOffset || 0) + globalOffset
                );
            }
            if (startIdx === -1 && subtitles.length > 0) {
                startIdx = 0;
            }
            if (startIdx !== -1) {
                playConsecutiveSubtitles(subtitles[startIdx], startIdx);
            }
            break;

        case '0':
            	e.preventDefault();
    		// 修复：清除单句播放的 timeupdate 监听器，避免整段播放立即停止
   		if (currentTimeUpdateHandler) {
        		video.removeEventListener('timeupdate', currentTimeUpdateHandler);
        		currentTimeUpdateHandler = null;
    		}
   		isSinglePlayback = false; // 确认不是单句播放模式

    		if (video.paused) {
        		video.play();
    		} else {
        		video.pause();
    		}
    		break;
        case '8':
            e.preventDefault();
            toggleOcclusion();
            break;
        case '7':
            e.preventDefault();
            if (lastActiveSubtitle) addToFavorites(lastActiveSubtitle);
            break;
        case '9':
            e.preventDefault();
            if (lastActiveSubtitle) {
                const el = [...document.querySelectorAll('.subtitle')].find(
                    elem => parseFloat(elem.dataset.start) === timeToSeconds(lastActiveSubtitle.start) + (lastActiveSubtitle.startOffset || 0) + globalOffset
                );
                if (el) openEditor(lastActiveSubtitle, el);
            }
            break;
        case '*':
            e.preventDefault();
            if (lastActiveSubtitle) {
		const shift = 0.2;
		const newStart = timeToSeconds(lastActiveSubtitle.start) + shift;
        	lastActiveSubtitle.start = secondsToTime(newStart);

                const idx = subtitles.indexOf(lastActiveSubtitle);  //  重叠调整
                if (idx > 0) {
                    const prevSub = subtitles[idx - 1];
                    const prevEnd = timeToSeconds(prevSub.end) + (prevSub.endOffset || 0) + globalOffset;
                    const newStart = timeToSeconds(lastActiveSubtitle.start) + lastActiveSubtitle.startOffset + globalOffset;
                    if (newStart < prevEnd) {
                        prevSub.endOffset = (newStart - timeToSeconds(prevSub.end) - 0.1 - globalOffset) || 0;
                        displaySubtitles();
                    }
                }
                displaySubtitles();
            }

            break;
        case '/':
            e.preventDefault();
            if (lastActiveSubtitle) {  
                const shift = -0.2; // 模拟开始时间 -0.2（同 minusBtn）
                const newStart = timeToSeconds(lastActiveSubtitle.start) + shift;
                lastActiveSubtitle.start = secondsToTime(newStart);

                const idx = subtitles.indexOf(lastActiveSubtitle);// 重叠检查
                if (idx > 0) {
                    const prevSub = subtitles[idx - 1];
                    const prevEnd = timeToSeconds(prevSub.end) + (prevSub.endOffset || 0) + globalOffset;
                    const newStart = timeToSeconds(lastActiveSubtitle.start) + lastActiveSubtitle.startOffset + globalOffset;
                    if (newStart < prevEnd) {
                        prevSub.endOffset = (newStart - timeToSeconds(prevSub.end) - 0.1 - globalOffset) || 0;
                        displaySubtitles();
                    }
                }
                displaySubtitles();
            }
            break;
        case '-':
            e.preventDefault();
            if (lastActiveSubtitle) {
               
            	lastActiveSubtitle.end = secondsToTime(timeToSeconds(lastActiveSubtitle.end) - 0.2); // 模拟结束时间 -0.2（同 endDecreaseBtn）
                const idx = subtitles.indexOf(lastActiveSubtitle);// 重叠调整
                if (idx < subtitles.length - 1) {
                    const nextSub = subtitles[idx + 1];
                    const currentEnd = timeToSeconds(lastActiveSubtitle.end) + lastActiveSubtitle.endOffset + globalOffset;
                    const nextStart = timeToSeconds(nextSub.start) + (nextSub.startOffset || 0) + globalOffset;
                    if (currentEnd > nextStart) {
                        nextSub.startOffset = (currentEnd + 0.1 - timeToSeconds(nextSub.start) - globalOffset) || 0;
                    }
                }
                displaySubtitles();
            }
            break;
        case '+':
            e.preventDefault();
            if (lastActiveSubtitle) {
                // 模拟结束时间 +0.2（同 endIncreaseBtn）
            	lastActiveSubtitle.end = secondsToTime(timeToSeconds(lastActiveSubtitle.end) + 0.2);
                const idx = subtitles.indexOf(lastActiveSubtitle);
                if (idx < subtitles.length - 1) {
                    const nextSub = subtitles[idx + 1];
                    const currentEnd = timeToSeconds(lastActiveSubtitle.end) + lastActiveSubtitle.endOffset + globalOffset;
                    const nextStart = timeToSeconds(nextSub.start) + (nextSub.startOffset || 0) + globalOffset;
                    if (currentEnd > nextStart) {
                        nextSub.startOffset = (currentEnd + 0.1 - timeToSeconds(nextSub.start) - globalOffset) || 0;
                    }
                }
                displaySubtitles();
            }
            break;
        case 'y':
            e.preventDefault();
	    // 全局字幕时间偏移增加：+0.2 全局
            subtitles.forEach(sub => {
            	sub.start = secondsToTime(timeToSeconds(sub.start) + 0.2);
            	sub.end = secondsToTime(timeToSeconds(sub.end) + 0.2);
            });
            displaySubtitles();
            displayFavorites();
            break;
        case 't':
            e.preventDefault();
	    // 全局字幕时间偏移减少：遍历所有字幕，调整 start 和 end（相当于 -0.2 全局）
            subtitles.forEach(sub => {
            	sub.start = secondsToTime(timeToSeconds(sub.start) - 0.2);
            	sub.end = secondsToTime(timeToSeconds(sub.end) - 0.2);
            });
            displaySubtitles();
            displayFavorites();
            break;
	case '3':
   		e.preventDefault();
    		updatePlaybackSpeed(+0.2);
    		break;
    }
});

/**
 * =================================================
 * === 新增的功能函数 (统一导入/导出)
 * =================================================
 */

// 函数1: 重置项目状态，用于清空或加载新项目
function resetProjectState() {
    isClearing = true;
    subtitles = [];
    favorites = [];
    srtFilename = '';
    videoFilename = '';
    video.removeAttribute('src');
    video.pause();
    video.currentTime = 0;
    subtitlesDiv.innerHTML = '';
    favoritesDiv.innerHTML = '';
    document.getElementById('container').style.display = 'none';
    lastActiveSubtitle = null;
    isSinglePlayback = false;
    globalOffset = 0;
    stopTimer();
    usageTimeElement.textContent = `使用时长: 0:00:00`;
    isClearing = false;
    subtitlesDiv.style.height = 'auto';
    favoritesDiv.style.height = 'auto';
}

// 函数2: 处理导入的ZIP项目文件
async function processZipFile(zipFile) {
    try {
        const zip = await JSZip.loadAsync(zipFile);
        let videoFile, srtFile, favoritesFile, editedFile;

        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
        zip.forEach((relativePath, file) => {
            const lowerCaseName = relativePath.toLowerCase();
            if (videoExtensions.some(ext => lowerCaseName.endsWith(ext))) {
                videoFile = file;
                videoFilename = file.name;
            } else if (lowerCaseName.endsWith('.srt')) {
                srtFile = file;
                srtFilename = file.name;
            } else if (lowerCaseName.includes('favorites.json')) {
                favoritesFile = file;
            } else if (lowerCaseName.includes('edited_subtitles.json')) {
                editedFile = file;
            }
        });

        if (!videoFile || !srtFile) {
            throw new Error("ZIP项目中必须包含视频文件和SRT字幕文件。");
        }

        const videoBlob = await videoFile.async("blob");
        video.src = URL.createObjectURL(videoBlob);
        video.load();

        if (editedFile) {
            const editedContent = await editedFile.async("string");
            subtitles = JSON.parse(editedContent);
        } else {
            const srtContent = await srtFile.async("string");
            subtitles = parseSRT(srtContent);
        }
        displaySubtitles();

        if (favoritesFile) {
            const favoritesContent = await favoritesFile.async("string");
            favorites = JSON.parse(favoritesContent);
            displayFavorites();
        }
        
        commonFileLoadSetup();

    } catch (error) {
        console.error("处理ZIP文件失败:", error);
        alert(`处理ZIP文件失败: ${error.message}`);
    }
}

// 函数3: 处理直接选择的视频+SRT文件
async function processMediaAndSrtFiles(files) {
    const videoFile = files.find(f => f.type.startsWith('video/'));
    const srtFile = files.find(f => f.name.toLowerCase().endsWith('.srt'));

    if (!videoFile || !srtFile) {
        alert(translations[currentLanguage].alertMessage);
        return;
    }

    videoFilename = videoFile.name;
    srtFilename = srtFile.name;

    try {
        video.src = URL.createObjectURL(videoFile);
        video.load();

        const srtReader = new FileReader();
        srtReader.onload = (e) => {
            try {
                subtitles = parseSRT(e.target.result);
                displaySubtitles();
                commonFileLoadSetup();
            } catch (e) {
                console.error('解析SRT失败:', e);
                alert('无法解析SRT文件，请检查文件内容。');
            }
        };
        srtReader.onerror = () => alert('无法读取SRT文件。');
        srtReader.readAsText(srtFile);

    } catch (error) {
        console.error('加载文件失败:', error);
        alert('文件加载时发生错误。');
    }
}

// 函数4: 文件加载成功后的通用设置（启动计时器等）
function commonFileLoadSetup() {
    video.addEventListener('timeupdate', highlightSubtitle);
    startTime = performance.now();
    totalElapsed = 0;
    if (isPageVisible) {
        updateUsageTime();
        startTimer();
    }
    setTimeout(highlightSubtitle, 100);  // 延迟100ms调用，确保DOM渲染完成
}

//切换播放速度
function updatePlaybackSpeed(change) {
    playbackSpeed = Math.max(0.25, Math.min(4.0, playbackSpeed + change)); // 限制在 0.25x 到 4.0x
    document.getElementById('playback-speed-display').textContent = `${playbackSpeed.toFixed(2)}x`;
    video.playbackRate = playbackSpeed;
}
});

//导入zip文件后高亮导出时的句子
function jumpToHighlightIndex(index) {
    const subtitlesContainer = document.getElementById('subtitles');
    const subtitleElements = subtitlesContainer.querySelectorAll('.subtitle');
    if (!subtitleElements.length) return;

    // 先清除所有高亮
    subtitleElements.forEach(el => el.classList.remove('active'));

    if (index < 0 || index >= subtitleElements.length) return;

    const target = subtitleElements[index];
    target.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 同步更新 lastActiveSubtitle，方便后续 updateHighlight() 使用
    lastActiveSubtitle = subtitles[index];
}
