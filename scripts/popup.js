document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const toggleDateButton = document.getElementById('toggleDate');
    const searchButton = document.getElementById('search');
    const startDateLabel = document.getElementById('startDateLabel');
    const endDateLabel = document.getElementById('endDateLabel');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const resultsDiv = document.getElementById('results');
    const loadMoreButton = document.createElement('button');
    const cityInput = document.getElementById('city');

    // Load saved city
    chrome.storage.sync.get('defaultCity', function(data) {
        if (data.defaultCity) {
            cityInput.value = data.defaultCity;
        }
    });

    toggleDateButton?.addEventListener('click', toggleEndDate);
    searchButton?.addEventListener('click', () => searchEvents(true));
    loadMoreButton.addEventListener('click', () => searchEvents(false));
    
    const today = new Date().toISOString().split('T')[0];
    startDate.setAttribute('min', today);
    endDate.setAttribute('min', today);
    
    chrome.runtime.sendMessage({ type: "GET_CLICKED_DATE" }, function(response) {
        if (response && response.date) {
            startDate.value = response.date;
        }
    });

    function toggleEndDate() {
        const isEndDateHidden = endDate.style.display === 'none';
        endDate.style.display = isEndDateHidden ? 'block' : 'none';
        endDateLabel.style.display = startDateLabel.style.display = isEndDateHidden ? 'block' : 'none';
        toggleDateButton.textContent = isEndDateHidden ? 'Remove End Date »' : 'Add End Date »';
        endDate.value = isEndDateHidden ? startDate.value : '';
    }

    function searchEvents(isNewSearch) {
        
        if (isNewSearch) {
            currentPage = 1;
            resultsDiv.innerHTML = '';
        } else {
            currentPage++;  // Increment the page number
            removeElementsByClass('warning-message');
            removeElementById('downloadCsv');
        }
        
        setLoading(true);
        const cityValue = document.getElementById('city').value;

        chrome.runtime.sendMessage({ city: cityValue, startDate: startDate.value, endDate: endDate.value, page: currentPage }, function(response) {
            if (response.error) {
                console.error('Error:', response.error);
                displayError(response.error);
            } else {
                displayEvents(response.data, isNewSearch);
                displayWarningMessage();
                createDownloadButton();
            }
         setLoading(false);
        });
    }

    function setLoading(isLoading) {
        const existingLoadingAnimation = document.getElementById('loading');

        if (isLoading) {
            if (!existingLoadingAnimation) {
                const loadingAnimation = document.createElement('div');
                loadingAnimation.className = 'loading-spinner';
                loadingAnimation.id = 'loading';
                resultsDiv.appendChild(loadingAnimation);
            }
            loadMoreButton.textContent = 'Loading...'; // Change text to "Loading..."
        } else {
            if (existingLoadingAnimation) {
                existingLoadingAnimation.remove();
            }
            loadMoreButton.textContent = 'Load More'; // Change back to "Load More"
        }
    }

    function displayEvents(data, isNewSearch) {
        // Clear results only if it's a new search
        if (isNewSearch) {
            resultsDiv.innerHTML = '';
        }

        // Check if there are events to display
        if (!data.data || data.data.length === 0) {
            if (isNewSearch) {
                resultsDiv.innerHTML = '<p>No events found.</p>';
            }
            return;
        }

        // Append new events
        data.data.forEach(event => {
            const eventElement = createEventElement(event);
            resultsDiv.appendChild(eventElement);
        });

        // Manage "Load More" button
        manageLoadMoreButton(data);
    }

    function manageLoadMoreButton(data) {
        if (data.data.length >= 50) { // Assuming each page has 50 items
            loadMoreButton.textContent = 'Load More';
            resultsDiv.appendChild(loadMoreButton);
        } else {
            loadMoreButton.remove();
        }
    }

    function createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event';
        eventElement.appendChild(createElement('h3', event.name));
        eventElement.appendChild(createImageElement(event.image, event.name));
        eventElement.appendChild(createElement('p', `Venue: ${event.location.name}`));
        eventElement.appendChild(createDateElement(event.startDate));
        return eventElement; // Just return the element
    }

    function createElement(tag, text) {
        const element = document.createElement(tag);
        element.textContent = text;
        return element;
    }

    function createImageElement(src, alt) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.className = 'event-image';
        return img;
    }

    function createDateElement(dateStr) {
        console.log(dateStr);
        const dateElement = createElement('p', '');
        dateElement.className = 'event-date';
        const isoDate = formatToIsoDate(dateStr);
        console.log("ISO Date: " + isoDate)
        dateElement.setAttribute('data-iso-date', isoDate);
        dateElement.textContent = formatDate(isoDate);
        return dateElement;
    }

    function formatDate(isoDate) {
        const [yyyy, mm, dd] = isoDate.split('-');
        return `${mm}/${dd}`;
    }

    function displayError(message) {
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${message}</p>`;
    }

    function handleRuntimeMessage(request) {
        if (request.date) startDate.value = request.date;
    }

    function displayWarningMessage() {
        const warningMsg = createElement('p', 'Event list may be inaccurate or incomplete.');
        warningMsg.className = 'warning-message';
        resultsDiv.insertBefore(warningMsg, resultsDiv.firstChild);
    }

    function createDownloadButton() {
        const button = createElement('button', 'Download all to CSV');
        button.id = 'downloadCsv';
        button.className = 'download-csv-link';
        button.addEventListener('click', () => downloadTableToCSV('events.csv'));
        resultsDiv.appendChild(button);
    }
function downloadTableToCSV(filename) {
    var csv = [];
    var rows = document.querySelectorAll(".event");

    // Add column headers
    csv.push("Name,Venue,Date");

    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll("h3, p");

        // Extract and format data for each column
        var name = cols[0].innerText.replace(/,/g, ""); // Name
        var venue = cols[1].innerText.replace(/,/g, "").replace("Venue: ", ""); // Venue
        var date = new Date(cols[2].getAttribute('data-iso-date')); // Assuming the date is stored in data-iso-date attribute
        var formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`; // Date formatted as mm/dd/yyyy

        row.push(name, venue, formattedDate);        
        csv.push(row.join(","));        
    }

    // Download CSV
    var csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    var downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

    function removeElementsByClass(className) {
        const elements = document.getElementsByClassName(className);
        while (elements.length > 0) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    }

    // Helper function to remove an element by ID
    function removeElementById(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.parentNode.removeChild(element);
        }
    }

    function formatToIsoDate(input) {
        let date;

        if (input.includes('T')) {
            date = new Date(input.split('T')[0]);
        } else {
            date = new Date(input);
        }
        return date.toISOString().split('T')[0];
    }

});