// deals.js
export function initializeDeals(restaurants) {
    const dealsListElement = document.getElementById('dealsList');
    const dealSearchInput = document.getElementById('dealSearchInput');
    const dealZipcodeFilter = document.getElementById('dealZipcodeFilter');
    const dealTagsFilter = document.getElementById('dealTagsFilter');

    function renderDeals(filteredDeals) {
        dealsListElement.innerHTML = filteredDeals.map(deal => `
            <div class="bg-white p-4 rounded shadow">
                <h3 class="font-bold">${deal.restaurant.name}</h3>
                <p>Deal: ${deal.description}</p>
                <p>Value: ${deal.value}</p>
                <p>Zipcode: ${deal.restaurant.zipcode}</p>
                <p>Tags: ${deal.restaurant.tags.map(tag => tag.name).join(', ')}</p>
            </div>
        `).join('');
    }

    const allDeals = restaurants.flatMap(restaurant => 
        (restaurant.deals || []).map(deal => ({...deal, restaurant}))
    ).sort((a, b) => b.value - a.value);

    renderDeals(allDeals);

    // Populate zipcode filter
    const zipcodes = [...new Set(restaurants.map(r => r.zipcode))].sort();
    zipcodes.forEach(zipcode => {
        const option = document.createElement('option');
        option.value = zipcode;
        option.textContent = zipcode;
        dealZipcodeFilter.appendChild(option);
    });

    // Populate tags filter
    const tags = [...new Set(restaurants.flatMap(r => r.tags.map(t => t.name)))].sort();
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        dealTagsFilter.appendChild(option);
    });

    function filterDeals() {
        const searchTerm = dealSearchInput.value.toLowerCase();
        const selectedZipcode = dealZipcodeFilter.value;
        const selectedTags = Array.from(dealTagsFilter.selectedOptions).map(option => option.value);

        const filteredDeals = allDeals.filter(deal => 
            (deal.description.toLowerCase().includes(searchTerm) || deal.restaurant.name.toLowerCase().includes(searchTerm)) &&
            (selectedZipcode === '' || deal.restaurant.zipcode === selectedZipcode) &&
            (selectedTags.length === 0 || selectedTags.every(tag => deal.restaurant.tags.some(t => t.name === tag)))
        );

        renderDeals(filteredDeals);
    }

    dealSearchInput.addEventListener('input', filterDeals);
    dealZipcodeFilter.addEventListener('change', filterDeals);
    dealTagsFilter.addEventListener('change', filterDeals);
}