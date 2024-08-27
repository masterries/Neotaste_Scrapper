let map;
let markers = [];

function initMap(city) {
    if (map) {
        map.remove();
    }
    
    const cityCoordinates = {
        'vienna': [48.2082, 16.3738],
        'karlsruhe': [49.0069, 8.4037],
        'freiburg': [47.9961, 7.8494],
        'mannheim': [49.4875, 8.4660],
        'frankfurt': [50.1109, 8.6821],
        'mainz': [50.0028, 8.2590],
        'heidelberg': [49.3988, 8.6724],
    };
    
    map = L.map('map').setView(cityCoordinates[city] || cityCoordinates['vienna'], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function updateMap(restaurants) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    restaurants.forEach(restaurant => {
        const lat = restaurant.latitude || (restaurant.geolocation ? restaurant.geolocation.latitude : null);
        const lng = restaurant.longitude || (restaurant.geolocation ? restaurant.geolocation.longitude : null);

        if (lat && lng) {
            const marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(createPopupContent(restaurant));
            markers.push(marker);
        }
    });
}

function createPopupContent(restaurant) {
    let content = `<b>${restaurant.name}</b><br>`;
    content += `${restaurant.address || (restaurant.address ? restaurant.address.street : '')}<br>`;

    if (restaurant.source === 'thefork' || restaurant.theforkData) {
        const theforkData = restaurant.source === 'thefork' ? restaurant : restaurant.theforkData;
        content += `TheFork Rating: ${theforkData.rating} (${theforkData.reviewCount} ratings)<br>`;
        content += `TheFork Deal: ${theforkData.marketingOffer.label} (${theforkData.marketingOffer.discountPercentage}% off)<br>`;
    }

    if (restaurant.source !== 'thefork') {
        content += `Neotaste Rating: ${restaurant.avgRating.toFixed(1)} (${restaurant.ratingsCount} ratings)<br>`;
        if (restaurant.deals.length > 0) {
            content += `Top Neotaste deal: ${restaurant.deals[0].name} (€${restaurant.deals[0].value})`;
        } else {
            content += 'No Neotaste deals available';
        }
    }

    return content;
}