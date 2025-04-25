function insertCustomSortButton() {
  const highlightsButtonId = 'yt-custom-chip';

  const chipsContainer = document.querySelector('ytd-feed-filter-chip-bar-renderer #chips');

  if (!chipsContainer || document.getElementById(highlightsButtonId)) {
    return;
  }

  const templateChip = chipsContainer.querySelector('yt-chip-cloud-chip-renderer');

  if (!templateChip) {
    return;
  }

  const highlightChip = templateChip.cloneNode(true);
  highlightChip.id = highlightsButtonId;
  highlightChip.querySelector('#chip-container').style.backgroundColor = '#fe3131';

  highlightChip.addEventListener('click', () => {
    const allVideos = document.querySelectorAll('ytd-rich-item-renderer');

    const viewVideoMap = new Map();

    for (let i = 0; i < allVideos.length; i++) {
      const metadata = allVideos[i].querySelector('#metadata-line');
      const data = metadata.querySelectorAll('span.ytd-video-meta-block')

      const viewsData = data[0].textContent.match(/\d+(\.\d+)?/)[0];
      const views = parseFloat(viewsData.replace(/\./g, '').replace(/,/g, ''));

      const timeData = data[1].textContent.match(/\d+/)[0];
      const time = parseInt(timeData.replace(/\./g, '').replace(/,/g, ''));

      viewVideoMap.set(views, allVideos[i]);
    }

    console.log('viewVideoMap', viewVideoMap);
    const outliers = findLowOutliers(Array.from(viewVideoMap.keys()));
    console.log('outliers', outliers);

    for (const v of outliers) {
      const video = viewVideoMap.get(v);
      video.style.display = 'none';
    }
  });

  chipsContainer.appendChild(highlightChip);

  const innerChild = highlightChip.querySelector('yt-formatted-string');
  if (innerChild) {
    innerChild.textContent = 'Highlights';
    innerChild.removeAttribute('is-empty');
  }

  console.log(innerChild);
}

function observePage() {
  const observer = new MutationObserver(() => {
    if (window.location.pathname.includes('/videos')) {
      insertCustomSortButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial run
  insertCustomSortButton();
}

window.addEventListener('yt-navigate-finish', () => {
  setTimeout(insertCustomSortButton, 700); // Give YouTube some time to load the chips
  console.log('yt-navigate-finish event detected');
});

function findLowOutliers(views) {
  if (views.length < 10) {
    return [];
  }

  const sorted = [...views].sort((a, b) => a - b);

  const getPercentile = (arr, p) => {
    const index = (p / 100) * (arr.length - 1);

    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return arr[lower];
    }

    return arr[lower] + (arr[upper] - arr[lower]) * (index - lower);
  };

  const q1 = getPercentile(sorted, 25);
  const q3 = getPercentile(sorted, 75);
  const iqr = q3 - q1;
  const threshold = q3 + 1.5 * iqr;

  console.log('threshold', threshold)

  return views.filter(v => {
    return v < threshold
  });
}

observePage();