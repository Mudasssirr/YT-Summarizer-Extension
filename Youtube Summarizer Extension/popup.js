// Event listener for the "summarizeButton" click event
document.getElementById("summarizeButton").addEventListener("click", () => {
    const summarizeButton = document.getElementById("summarizeButton");

    // Change button text to "Summarizing..." while the process is ongoing
    summarizeButton.textContent = "Summarizing...";

    // Query for the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]; // Get the first tab from the tabs array (active tab)
        console.log("Active Tab:", activeTab); // Log the active tab details

        // Inject content.js into the active tab
        chrome.scripting.executeScript(
            {
                target: { tabId: activeTab.id },
                files: ["content.js"], // The content script to be injected
            },
            () => {
                // Check for errors in script injection
                if (chrome.runtime.lastError) {
                    console.error("Error injecting script:", chrome.runtime.lastError);
                    alert("Failed to inject content script.");
                    return;
                }

                // Send a message to the content script to get the current URL
                chrome.tabs.sendMessage(
                    activeTab.id,
                    { action: "getURL" }, // Action to get the URL of the active tab
                    async (response) => {
                        // Check for errors in communication with the content script
                        if (chrome.runtime.lastError) {
                            console.error("Error:", chrome.runtime.lastError);
                            alert("Failed to communicate with the content script. Please try again.");
                            return;
                        }
                        console.log("Response from content.js:", response);

                        // Check if the URL is successfully retrieved
                        if (response && response.url) {
                            const videoId = extractVideoId(response.url); // Extract video ID from the URL
                            if (videoId) {
                                // Fetch video details using the video ID
                                const videoDetails = await fetchVideoDetails(videoId);
                                if (videoDetails) {
                                    // Get the summary of the video using its title and description
                                    const summary = await getSummary(
                                        videoDetails.title,
                                        videoDetails.description
                                    );
                                    renderSummary(summary); // Render the summary in bullet points
                                } else {
                                    alert("Failed to fetch video details."); // Handle video details fetch failure
                                }
                            } else {
                                alert("Invalid YouTube URL!"); // Handle invalid YouTube URL
                            }
                        } else {
                            alert("Failed to get the video URL!"); // Handle failure in getting the URL
                        }
                    }
                );
            }
        );
    });
});

// Function to extract the video ID from the YouTube URL
function extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/); // Regex to find the video ID in the URL
    return match ? match[1] : null; // Return the video ID if found, else null
}

// Function to fetch the video details (title and description) using YouTube Data API
async function fetchVideoDetails(videoId) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=YOUTUBE_DATA_API`;

    try {
        const response = await fetch(apiUrl); // Make the API request
        const data = await response.json(); // Parse the response JSON
        if (data.items && data.items.length > 0) {
            const snippet = data.items[0].snippet; // Get the snippet (title and description) from the response
            return {
                title: snippet.title, // Return title
                description: snippet.description, // Return description
            };
        } else {
            return null; // Return null if no video details are found
        }
    } catch (error) {
        console.error("Error fetching video details:", error); // Log any errors that occur
        return null; // Return null in case of error
    }
}

// Function to get a summarized version of the video description using Gemini API
async function getSummary(title, description) {
    const apiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=GEMINI_API_KEY";

    try {
        const response = await fetch(apiUrl, {
            method: "POST", // POST request to Gemini API
            headers: {
                "Content-Type": "application/json", // Set content type to JSON
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Summarize the following YouTube video in bullet points:\nTitle: ${title}\nDescription: ${description}`,
                            },
                        ],
                    },
                ],
            }),
        });

        const data = await response.json(); // Parse the response JSON
        console.log("API Response:", data);
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text; // Get the summary from the response
        return summary || "No summary available."; // Return the summary or a default message
    } catch (error) {
        console.error("Error fetching summary:", error); // Log any errors
        return "An error occurred."; // Return a default error message in case of failure
    }
}

// Function to render the summary in the UI as bullet points
function renderSummary(summary) {
    const summarizeButton = document.getElementById("summarizeButton");
    const output = document.getElementById("summaryOutput");

    // Change the button text back to "Summarize Video"
    summarizeButton.textContent = "Summarize Video";

    // Clear the existing content in the summary output area
    output.innerHTML = ""; // This removes all previous <li> elements

    // Split the summary into bullet points and filter out empty lines
    const points = summary.split("\n").filter((point) => point.trim() !== "");

    // Add each bullet point as a new list item
    points.forEach((point) => {
        const li = document.createElement("li"); // Create a new list item for each bullet point
        li.textContent = point; // Set the text content of the list item
        output.appendChild(li); // Append the list item to the output element
    });
}