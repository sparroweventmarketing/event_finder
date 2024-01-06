function setupClickListener() {
    const calendarView = document.querySelector('.calendar-view');

    if (!calendarView) {
        return;
    }

    calendarView.addEventListener('click', function(event) {
        const closestTd = event.target.closest('td');

        if (closestTd && closestTd.dataset.date) {
            chrome.runtime.sendMessage({ type: "DATE_CLICKED", date: closestTd.dataset.date });
        }
    });
}

setupClickListener();