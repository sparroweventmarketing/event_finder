document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('form');
    const defaultCityInput = document.getElementById('defaultCity');

    // Load saved city
    chrome.storage.sync.get('defaultCity', function(data) {
        defaultCityInput.value = data.defaultCity || '';
    });

    // Save the city on form submission
    settingsForm.addEventListener('submit', function(event) {
        event.preventDefault();
        chrome.storage.sync.set({'defaultCity': defaultCityInput.value}, function() {
            console.log('Default city saved');
            window.location.href = chrome.runtime.getURL('popup.html');
        });
    });
});
