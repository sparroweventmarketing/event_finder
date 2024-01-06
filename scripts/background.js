// Global variable to store the clicked date
let clickedDate = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    // Handle storing the clicked date from the calendar view
    if (request.type === "DATE_CLICKED") {
        clickedDate = request.date;
    } else if (request.type === "GET_CLICKED_DATE") {
        // Provide the clicked date to the popup
        sendResponse({ date: clickedDate });
    }

    // Handle event fetching
    if (request.city && request.startDate) {
        // Make sure to pass the page parameter to fetchEvents
        fetchEvents(request.city, request.startDate, request.endDate, request.page)
            .then(data => sendResponse({ data }))
            .catch(error => sendResponse({ error: error.message }));

        return true; // Indicates an asynchronous response is expected
    }

    return false; // No asynchronous response expected for other cases
});


// Update the extension icon based on the current URL
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url && tab.url.includes('app.prism.fm/calendar')) {
        chrome.action.setIcon({
            path: {
                "16": "images/16-green.png",  
                "48": "images/48-green.png",  
                "128": "images/128-green.png"
            },
            tabId: tabId
        });
    } else {
        chrome.action.setIcon({
            path: {
                "16": "images/16.png",  
                "48": "images/48.png",  
                "128": "images/128.png"
            },
            tabId: tabId
        });
    }
});

// Function to fetch events from the API
async function fetchEvents(city, startDate, endDate, page = 1) {
    const url = new URL('https://concerts-artists-events-tracker.p.rapidapi.com/location');
    url.search = new URLSearchParams({
        name: city,
        minDate: startDate,
        maxDate: endDate || startDate,
        page: page.toString() // Ensure page is converted to a string
    });

    const headers = {
        'X-RapidAPI-Key': '31d464434emsh7623135442dbb59p1d3240jsnd81e91d83dd7',
        'X-RapidAPI-Host': 'concerts-artists-events-tracker.p.rapidapi.com'
    };

    try {
        const response = await fetch(url, { method: 'GET', headers: headers });
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error('Failed to fetch events');
    }
}
