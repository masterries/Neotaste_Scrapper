// statistics.js
export function displaySummary(summary) {
    document.getElementById('lastUpdated').textContent = `Last Updated: ${summary.last_updated}`;
    document.getElementById('totalRestaurants').textContent = `Total Restaurants: ${summary.daily_counts[summary.daily_counts.length - 1].total_restaurants}`;
}

export function displayChart(summary) {
    const ctx = document.getElementById('restaurantChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: summary.daily_counts.map(d => d.date),
            datasets: [{
                label: 'Total Restaurants',
                data: summary.daily_counts.map(d => d.total_restaurants),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

export function displayLatestChanges(changes) {
    const changesElement = document.getElementById('latestChanges');
    changesElement.innerHTML = `
        <p>New Restaurants: ${changes.new_restaurants.join(', ') || 'None'}</p>
        <p>Removed Restaurants: ${changes.removed_restaurants.join(', ') || 'None'}</p>
    `;
}

export function displayRestaurants(restaurants) {
    const listElement = document.getElementById('restaurantList');
    const searchInput = document.getElementById('searchInput');

    function renderRestaurants(filteredRestaurants) {
        listElement.innerHTML = filteredRestaurants.map(restaurant => `
            <div class="bg-white p-4 rounded shadow">
                <h3 class="font-bold">${restaurant.name}</h3>
                <p>Rating: ${restaurant.avgRating || 'N/A'}</p>
                <p>Price Range: ${'€'.repeat(restaurant.priceRange)}</p>
                <p>Categories: ${restaurant.tags.map(tag => tag.name).join(', ')}</p>
            </div>
        `).join('');
    }

    renderRestaurants(restaurants);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredRestaurants = restaurants.filter(restaurant => 
            restaurant.name.toLowerCase().includes(searchTerm) ||
            restaurant.tags.some(tag => tag.name.toLowerCase().includes(searchTerm))
        );
        renderRestaurants(filteredRestaurants);
    });
}