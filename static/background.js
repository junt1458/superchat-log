chrome.action.onClicked.addListener(function(tab) {
    openTab();
});

function openTab() {
    chrome.tabs.create({"url": "main.html" });
}
