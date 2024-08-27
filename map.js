// map.js
let map;
let markers = [];
let mapInitialized = false;

export function initializeMap(restaurants) {
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
                Tags: ${restaurant.tags.map(tag => tag.name).join(', ')}<br>
                Deals: ${restaurant.deals ? restaurant.deals.map(deal => deal.description).join(', ') : 'None'}
            `);
        markers.push(marker);
    });

    const markerGroup = L.layerGroup(markers).addTo(map);
    mapInitialized = true;

    populateFilters(restaurants);
}

function populateFilters(restaurants) {
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

    priceFilter.addEventListener('change', () => filterMarkers(restaurants));
    tagFilter.addEventListener('change', () => filterMarkers(restaurants));
}

export function filterMarkers(restaurants) {
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