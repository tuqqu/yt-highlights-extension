# ![icon](src/icons/icon-48.png) YouTube Highlights Extension

**YouTube Highlights** is a browser extension that adds two custom buttons to YouTube channel's `/videos` tab:
-  **Highlights** – hides videos with relatively low view counts (based on statistical filtering).
-  **Reset Highlights** – restores all hidden videos.


## Features

- Uses **interquartile range (IQR)** to detect and hide low-performing videos.
- Fully dynamic: reacts to YouTube navigation changes (`yt-navigate-finish`).
- Includes a reset button to bring hidden content back.


## Installation

1. Clone or download this repo.
2. Go to `chrome://extensions/` in Chrome.
3. Enable **Developer Mode**.
4. Click **Load unpacked**.
5. Select the folder containing this extension.
6. Navigate to a YouTube `/videos` channel page to see it in action.


## FAQ

**Q:** Why don’t the buttons show up sometimes?  
**A:** YouTube is a dynamic SPA. This extension waits for the chip bar to load using `MutationObserver` and a retry interval. If the UI structure changes, button injection may fail.

**Q:** Can I change how filtering works?  
**A:** Yes – modify `filterOutHighOutliers()` to adjust thresholds or the IQR method.
