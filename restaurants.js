let neotasteRestaurants = [];
let theforkRestaurants = [];
let currentCity = 'vienna';

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('neotasteSource').addEventListener('change', fetchData);
    document.getElementById('theforkSource').addEventListener('change', fetchData);
    document.getElementById('citySelector').addEventListener('change', changeCity);
    document.getElementById('priceFilter').addEventListener('change', filterRestaurants);
    document.getElementById('zipCodeFilter').addEventListener('input', filterRestaurants);
    document.getElementById('tagFilter').addEventListener('change', filterRestaurants);

    fetchData();
});

function changeDataSource(event) {
    currentDataSource = event.target.value;
    fetchData();
}

function changeCity(event) {
    currentCity = event.target.value;
    if (currentCity) {
        fetchData();
    } else {
        clearRestaurants();
    }
}


async function fetchData() {
    const neotasteChecked = document.getElementById('neotasteSource').checked;
    const theforkChecked = document.getElementById('theforkSource').checked;

    try {
        if (neotasteChecked) {
            const neotasteResponse = await fetch(`./data/${currentCity}/latest_full_data.json`);
            neotasteRestaurants = await neotasteResponse.json();
        } else {
            neotasteRestaurants = [];
        }

        if (theforkChecked) {
            const theforkResponse = await fetch(`./data/${currentCity}/processed_thefork_data_2024-08-27.json`);
            theforkRestaurants = await theforkResponse.json();
        } else {
            theforkRestaurants = [];
        }

        initMap(currentCity);
        populateTagFilter();
        filterRestaurants();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTagFilter() {
    const tagFilter = document.getElementById('tagFilter');
    tagFilter.innerHTML = '<option value="">All Tags</option>';
    const allTags = [...new Set(neotasteRestaurants.flatMap(r => r.tags.map(t => t.name)))];
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

function filterRestaurants() {
    const priceFilter = document.getElementById('priceFilter').value;
    const zipCodeFilter = document.getElementById('zipCodeFilter').value;
    const tagFilter = document.getElementById('tagFilter').value;

    let filteredNeotaste = neotasteRestaurants;
    let filteredThefork = theforkRestaurants;

    if (priceFilter) {
        filteredNeotaste = filteredNeotaste.filter(r => r.priceRange === parseInt(priceFilter));
        filteredThefork = filteredThefork.filter(r => Math.ceil(r.averagePrice / 25) === parseInt(priceFilter));
    }

    if (zipCodeFilter) {
        filteredNeotaste = filteredNeotaste.filter(r => r.zipCode.startsWith(zipCodeFilter));
        filteredThefork = filteredThefork.filter(r => r.address.zipCode.startsWith(zipCodeFilter));
    }

    if (tagFilter) {
        filteredNeotaste = filteredNeotaste.filter(r => r.tags.some(t => t.name === tagFilter));
        // TheFork doesn't have tags, so we don't filter it
    }

    const mergedRestaurants = mergeRestaurants(filteredNeotaste, filteredThefork);
    updateMap(mergedRestaurants);
    updateRestaurantCards(mergedRestaurants);
}

function mergeRestaurants(neotasteRestaurants, theforkRestaurants) {
    const mergedRestaurants = [...neotasteRestaurants];

    theforkRestaurants.forEach(theforkRestaurant => {
        const existingRestaurant = mergedRestaurants.find(r => 
            r.name.toLowerCase() === theforkRestaurant.name.toLowerCase() &&
            r.address.toLowerCase().includes(theforkRestaurant.address.street.toLowerCase())
        );

        if (existingRestaurant) {
            // Merge data for overlapping restaurants
            existingRestaurant.theforkData = theforkRestaurant;
            existingRestaurant.inBothDatasets = true;
        } else {
            // Add TheFork restaurant to the merged list
            mergedRestaurants.push({
                ...theforkRestaurant,
                source: 'thefork'
            });
        }
    });

    return mergedRestaurants;
}

function createDealsSection(restaurant) {
    let dealsContent = '';

    if (restaurant.deals) {
        dealsContent += restaurant.deals
            .sort((a, b) => b.value - a.value)
            .map(deal => createDealCard(deal, 'Neotaste'))
            .join('');
    }

    if (restaurant.marketingOffer) {
        dealsContent += createTheForkDealCard(restaurant.marketingOffer, restaurant.averagePrice, 'TheFork');
    }

    if (restaurant.theforkData && restaurant.theforkData.marketingOffer) {
        dealsContent += createTheForkDealCard(restaurant.theforkData.marketingOffer, restaurant.theforkData.averagePrice, 'TheFork (Additional)');
    }

    return dealsContent || '<p>No deals available</p>';
}


function updateRestaurantCards(filteredRestaurants) {
    const restaurantCards = document.getElementById('restaurantCards');
    restaurantCards.innerHTML = '';

    filteredRestaurants
        .sort((a, b) => {
            const aValue = getMaxDealValue(a);
            const bValue = getMaxDealValue(b);
            return bValue - aValue;
        })
        .forEach(restaurant => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md overflow-hidden mb-6';
            card.innerHTML = createRestaurantCard(restaurant);
            restaurantCards.appendChild(card);
        });

    document.querySelectorAll('.restaurant-image').forEach(img => {
        img.addEventListener('click', openImageModal);
    });
}


function createNeotasteCard(restaurant) {
    return `
        <div class="p-4">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-xl font-semibold">${restaurant.name}</h2>
                <span class="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">${'$'.repeat(restaurant.priceRange)}</span>
            </div>
            <div class="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span>${restaurant.avgRating.toFixed(1)} (${restaurant.ratingsCount} ratings)</span>
            </div>
            <div class="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                <span>${restaurant.address}, ${restaurant.zipCode}</span>
            </div>
            <div class="mb-4">
                <img src="${restaurant.images[0] || '/api/placeholder/400/200'}" alt="${restaurant.name}" class="w-full h-80 object-cover rounded cursor-pointer restaurant-image" data-restaurant="${restaurant.uuid}">
            </div>
            <h3 class="font-semibold text-lg mb-2">Deals:</h3>
            ${restaurant.deals.map(deal => `
                <a href="https://neotaste.app/invite/Patrick3632" target="_blank" class="block bg-yellow-50 p-3 rounded mb-3 hover:bg-yellow-100 transition duration-300">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-medium text-lg">${deal.name}</h4>
                        <span class="font-bold text-green-600">Value: €${deal.value}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${formatConditions(deal.conditions)}</p>
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Location: ${deal.locationCondition}</span
                        <span>Location: ${deal.locationCondition}</span>
                        <span>Reset: ${deal.daysToReset} days</span>
                        <span class="capitalize">${deal.status}</span>
                    </div>
                </a>
            `).join('')}
        </div>
    `;
}



function calculateEstimatedSavings(restaurantData) {
    const discountPercentage = restaurantData.marketingOffer.discountPercentage;
    const averagePrice = restaurantData.averagePrice;
    return (averagePrice * discountPercentage / 100);
}


function createTheForkDealCard(marketingOffer, averagePrice, source) {
    const estimatedSavings = calculateEstimatedSavings({ marketingOffer, averagePrice });
    return `
        <div class="block bg-green-50 p-3 rounded mb-3 hover:bg-green-100 transition duration-300">
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-medium text-lg">${marketingOffer.label}</h4>
                <span class="font-bold text-green-600">Discount: ${marketingOffer.discountPercentage}%</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">${marketingOffer.title}</p>
            <div class="flex justify-between text-xs text-gray-500">
                <span>Estimated Savings: €${estimatedSavings.toFixed(2)}</span>
                <span>Source: ${source}</span>
            </div>
        </div>
    `;
}

function getMaxDealValue(restaurant) {
    let maxValue = 0;

    // Check Neotaste deals
    if (restaurant.deals && restaurant.deals.length > 0) {
        maxValue = Math.max(...restaurant.deals.map(d => d.value), maxValue);
    }

    // Check TheFork deal (if it's a TheFork restaurant or has TheFork data)
    if (restaurant.marketingOffer || (restaurant.theforkData && restaurant.theforkData.marketingOffer)) {
        const theforkData = restaurant.marketingOffer ? restaurant : restaurant.theforkData;
        const estimatedSavings = calculateEstimatedSavings(theforkData);
        maxValue = Math.max(estimatedSavings, maxValue);
    }

    return maxValue;
}


function createRestaurantCard(restaurant) {
    let cardContent = `
        <div class="p-4">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-xl font-semibold">${restaurant.name}</h2>
                <span class="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">
                    ${restaurant.priceRange ? '$'.repeat(restaurant.priceRange) : `€${restaurant.averagePrice}`}
                </span>
            </div>
            <div class="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span>${restaurant.avgRating ? restaurant.avgRating.toFixed(1) : restaurant.rating} (${restaurant.ratingsCount || restaurant.reviewCount} ratings)</span>
            </div>
            <div class="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                <span>${restaurant.address || `${restaurant.address.street}, ${restaurant.address.zipCode} ${restaurant.address.locality}`}</span>
            </div>
            <div class="mb-4">
                <img src="${restaurant.images ? restaurant.images[0] : restaurant.photos[0] || '/api/placeholder/400/200'}" alt="${restaurant.name}" class="w-full h-80 object-cover rounded cursor-pointer restaurant-image" data-restaurant="${restaurant.uuid || restaurant.id}">
            </div>
            <h3 class="font-semibold text-lg mb-2">Deals:</h3>
            ${createDealsSection(restaurant)}
        </div>
    `;

    return cardContent;
}

function createDealCard(deal, source) {
    return `
        <div class="block bg-yellow-50 p-3 rounded mb-3 hover:bg-yellow-100 transition duration-300">
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-medium text-lg">${deal.name}</h4>
                <span class="font-bold text-green-600">Value: €${deal.value.toFixed(2)}</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">${formatConditions(deal.conditions)}</p>
            <div class="flex justify-between text-xs text-gray-500">
                <span>Location: ${deal.locationCondition}</span>
                <span>Reset: ${deal.daysToReset} days</span>
                <span class="capitalize">${deal.status}</span>
                <span>Source: ${source}</span>
            </div>
        </div>
    `;
}

function formatConditions(conditions) {
    return conditions
        .replace(/🍜/g, '<span class="text-xl">🍜</span>')
        .replace(/€(\d+)/g, '<span class="font-semibold text-green-600">€$1</span>')
        .split('. ')
        .map(sentence => `<p class="mb-1">${sentence}${sentence.endsWith('.') ? '' : '.'}</p>`)
        .join('');
}

function clearRestaurants() {
    if (map) {
        map.remove();
    }
    document.getElementById('restaurantCards').innerHTML = '';
}