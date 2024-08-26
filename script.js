let map;
let markers = [];
let restaurants = [];
let mapInitialized = false;

async function fetchData(url) {
    const response = await fetch(url);
    return response.json();
}

async function displayData() {

    const basePath = '/Neotaste_Scrapper';
    const summary = await fetchData(`${basePath}/data/summary.json`);
    restaurants = await fetchData(`${basePath}/data/latest_full_data.json`);
    const latestChanges = await fetchData(`${basePath}/data/daily_changes/${summary.last_updated}.json`);

    displaySummary(summary);
    displayChart(summary);
    displayLatestChanges(latestChanges);
    displayRestaurants(restaurants);
    populateFilters();
}


function displaySummary(summary) {
    document.getElementById('lastUpdated').textContent = `Last Updated: ${summary.last_updated}`;
    document.getElementById('totalRestaurants').textContent = `Total Restaurants: ${summary.daily_counts[summary.daily_counts.length - 1].total_restaurants}`;
}

function displayChart(summary) {
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

function displayLatestChanges(changes) {
    const changesElement = document.getElementById('latestChanges');
    changesElement.innerHTML = `
        <p>New Restaurants: ${changes.new_restaurants.join(', ') || 'None'}</p>
        <p>Removed Restaurants: ${changes.removed_restaurants.join(', ') || 'None'}</p>
    `;
}

function displayRestaurants(restaurants) {
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

function initializeMap() {
    if (mapInitialized) return;

    map = L.map('map').setView([48.2082, 16.3738], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    restaurants.forEach(restaurant => {
        const marker = L.marker([restaurant.latitude, restaurant.longitude])
            .bindPopup(`
                <b>${restaurant.name}</b><br>
                Rating: ${restaurant.avgRating || 'N/A'}<br>
                Price: ${'€'.repeat(restaurant.priceRange)}<br>
                Tags: ${restaurant.tags.map(tag => tag.name).join(', ')}
            `);
        markers.push(marker);
    });

    const markerGroup = L.layerGroup(markers).addTo(map);
    mapInitialized = true;
}

function populateFilters() {
    const priceFilter = document.getElementById('priceFilter');
    const tagFilter = document.getElementById('tagFilter');

    const tags = new Set();
    restaurants.forEach(restaurant => {
        restaurant.tags.forEach(tag => tags.add(tag.name));
    });

    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });

    priceFilter.addEventListener('change', filterMarkers);
    tagFilter.addEventListener('change', filterMarkers);
}

function filterMarkers() {
    const selectedPrice = document.getElementById('priceFilter').value;
    const selectedTag = document.getElementById('tagFilter').value;

    markers.forEach((marker, index) => {
        const restaurant = restaurants[index];
        const priceMatch = selectedPrice === '' || restaurant.priceRange === parseInt(selectedPrice);
        const tagMatch = selectedTag === '' || restaurant.tags.some(tag => tag.name === selectedTag);

        if (priceMatch && tagMatch) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
}

// Tab switching logic
document.getElementById('statsTab').addEventListener('click', () => switchTab('stats'));
document.getElementById('mapTab').addEventListener('click', () => switchTab('map'));

function switchTab(tab) {
    const statsContent = document.getElementById('statsContent');
    const mapContent = document.getElementById('mapContent');
    const statsTab = document.getElementById('statsTab');
    const mapTab = document.getElementById('mapTab');

    if (tab === 'stats') {
        statsContent.classList.remove('hidden');
        mapContent.classList.add('hidden');
        statsTab.classList.add('bg-blue-500', 'text-white');
        statsTab.classList.remove('bg-gray-300', 'text-gray-700');
        mapTab.classList.add('bg-gray-300', 'text-gray-700');
        mapTab.classList.remove('bg-blue-500', 'text-white');
    } else {
        statsContent.classList.add('hidden');
        mapContent.classList.remove('hidden');
        mapTab.classList.add('bg-blue-500', 'text-white');
        mapTab.classList.remove('bg-gray-300', 'text-gray-700');
        statsTab.classList.add('bg-gray-300', 'text-gray-700');
        statsTab.classList.remove('bg-blue-500', 'text-white');
        
        // Initialize map when the map tab is shown
        setTimeout(() => {
            initializeMap();
            map.invalidateSize();
        }, 0);
    }
}

displayData();