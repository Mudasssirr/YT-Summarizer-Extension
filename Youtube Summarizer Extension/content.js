// Listener to handle messages sent from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Log the message received to the console for debugging purposes
    console.log("Message received in content.js:", message);

    // Check if the received message has an action property with the value "getURL"
    if (message.action === "getURL") {
        // Retrieve the current URL of the active web page
        const currentUrl = window.location.href;

        // Log the URL to the console for debugging purposes
        console.log("Sending URL from content.js:", currentUrl);

        // Send the URL back as a response to the sender
        sendResponse({ url: currentUrl });
    }
});
