// Live search
let searchTimeout;

function liveSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = document.querySelector('#search-input').value;
        if (query.length >= 2) {
            fetch(`/api/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    updateSearchResults(data);
                });
        }
    }, 300);
}

function updateSearchResults(results) {
    const container = document.querySelector('#search-results');
    if (container) {
        container.innerHTML = results.map(item => `
            <div class="search-result">
                <a href="/listing/${item.id}">${item.title}</a>
                <span>ETB ${item.price}</span>
            </div>
        `).join('');
    }
}