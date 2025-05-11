const hiddenVideos = new Set();

/**
 * @returns {void}
 */
function insertButtons() {
    const highlightsButtonId = 'yt-highlights-chip';
    const resetButtonId = 'yt-reset-highlights-chip';

    const divPrimary = document.querySelector('div#primary');
    const chipsContainer = divPrimary.querySelector('div#header ytd-feed-filter-chip-bar-renderer #chips');
    if (!chipsContainer) {
        console.log('Container not found');
        return;
    }

    if (document.getElementById(highlightsButtonId) || document.getElementById(resetButtonId)) {
        console.log('Buttons already inserted');
        return;
    }

    const templateChip = chipsContainer.querySelectorAll('yt-chip-cloud-chip-renderer')[1];
    if (!templateChip) {
        console.error('Template chip not found');
        return;
    }

    const chipBuilder = new ChipBuilder(chipsContainer, templateChip);
    chipBuilder.createChip(highlightsButtonId, 'Highlights', removeLowOutliers, '#fe3131', '#100f0f');
    chipBuilder.createChip(resetButtonId, 'Reset highlights', reset, '#703232', '#050505');
}

/**
 * @returns {void}
 */
function observePage() {
    const observer = new MutationObserver(() => {
        if (window.location.pathname.includes('/videos')) {
            insertButtons();
        }
    });

    observer.observe(document.body, {childList: true, subtree: true});
}

class ChipBuilder {
    #container;
    #templateChip;

    /**
     * @param {HTMLElement} templateChip
     * @param {HTMLElement} container
     */
    constructor(container, templateChip) {
        this.#container = container;
        this.#templateChip = templateChip;
    }

    /**
     * @param {string} id
     * @param {string} text
     * @param {Function} callback
     * @param {string|null} [bgColor=null]
     * @param {string|null} [fbColor=null]
     * @returns {void}
     */
    createChip(id, text, callback, bgColor = null, fbColor = null) {
        const chip = this.#templateChip.cloneNode(true);
        chip.id = id;

        if (bgColor !== null) {
            chip.querySelector('#chip-container').style.backgroundColor = bgColor;
        }

        if (fbColor !== null) {
            chip.querySelector('#chip-container').style.color = fbColor;
        }

        chip.addEventListener('click', callback);

        this.#container.appendChild(chip);

        const formattedString = chip.querySelector('yt-formatted-string');
        if (formattedString) {
            formattedString.textContent = text;
            formattedString.removeAttribute('is-empty');
        }
    }
}

/**
 * @returns {void}
 */
function reset() {
    let i = 0;
    for (const video of hiddenVideos) {
        video.style.display = '';
        i++;
    }

    hiddenVideos.clear();

    console.log(`Showed ${i} videos`);
}

/**
 * @returns {void}
 */
function removeLowOutliers() {
    /**
     * @type {Map<number, Set<HTMLElement>>}
     */
    const viewVideoMap = getViewsVideosMap();
    const outliers = filterOutHighOutliers(Array.from(viewVideoMap.keys()));

    let i = 0;
    for (const v of outliers) {
        const videoSet = viewVideoMap.get(v);
        if (videoSet === undefined) {
            console.error('Video set not found for views:', v);
            continue;
        }

        for (const video of videoSet) {
            video.style.display = 'none';
            hiddenVideos.add(video);
            i++;
        }
    }

    console.log(`Hid ${i} videos with low views`);
}

/**
 * @returns {Map<number, Set<HTMLElement>>}
 */
function getViewsVideosMap() {
    const allVideos = document.querySelectorAll('ytd-rich-item-renderer');

    const viewVideoMap = new Map();

    for (let i = 0; i < allVideos.length; i++) {
        const metadata = allVideos[i].querySelector('#metadata-line');

        if (!metadata) {
            console.warn('Metadata line not found for video:', allVideos[i]);
            continue;
        }

        const data = metadata.querySelectorAll('span.ytd-video-meta-block')
        const views = parseViews(data[0].textContent)

        let videoSet = viewVideoMap.get(views)
        if (videoSet === undefined) {
            videoSet = new Set()
            viewVideoMap.set(views, videoSet);
        }

        videoSet.add(allVideos[i]);
    }

    return viewVideoMap;
}

/**
 * @param {number[]} views
 * @returns {number[]}
 */
function filterOutHighOutliers(views) {
    if (views.length < 10) {
        return [];
    }

    const sorted = [...views].sort((a, b) => a - b);
    // remove 15% of the highest values
    const upperBound = Math.ceil(sorted.length * 0.85);
    const trimmed = sorted.slice(0, upperBound);

    const getPercentile = (vec, p) => {
        const index = (p / 100) * (vec.length - 1);

        const lower = Math.floor(index);
        const upper = Math.ceil(index);

        if (lower === upper) {
            return vec[lower];
        }

        return vec[lower] + (vec[upper] - vec[lower]) * (index - lower);
    };

    const q1 = getPercentile(trimmed, 30);
    const q3 = getPercentile(trimmed, 70);
    const iqr = q3 - q1;
    const threshold = q3 + 1.5 * iqr;

    console.log(`Q1: ${q1}, Q3: ${q3}, IQR: ${iqr}, Threshold: ${threshold}`);

    return views.filter(v => v < threshold);
}

/**
 * @param {string} views
 * @returns {number}
 */
function parseViews(views) {
    const viewData = views.match(/(\d+(\.\d+)?)([KMB]?)\s*views/);
    if (!viewData) {
        return 0;
    }

    let num = parseFloat(viewData[1]);
    const unit = viewData[3];

    if (unit === 'K') {
        num *= 1000;
    } else if (unit === 'M') {
        num *= 1000000;
    } else if (unit === 'B') {
        num *= 1000000000;
    }

    return num;
}

/**
 * @returns {void}
 */
function waitForChipsAndInsertButtons() {
    const maxRetries = 50;
    let retries = 0;

    const interval = setInterval(() => {
        const chipsContainer = document.querySelector('div#header ytd-feed-filter-chip-bar-renderer #chips');
        const templateChip = chipsContainer?.querySelectorAll('yt-chip-cloud-chip-renderer')[1];

        if (chipsContainer && templateChip) {
            if (window.location.pathname.includes('/videos')) {
                console.log('Chips and template found, inserting buttons');
                insertButtons();
            }

            clearInterval(interval);
        } else {
            retries++;
            if (retries > maxRetries) {
                console.warn('Chips not found after multiple retries');
                clearInterval(interval);
            }
        }
    }, 200);
}

window.addEventListener('yt-navigate-finish', () => {
    setTimeout(waitForChipsAndInsertButtons, 1000);
});

observePage();
