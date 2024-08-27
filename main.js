// main.js
import { initializeMap, filterMarkers } from './map.js';
import { displaySummary, displayChart, displayLatestChanges, displayRestaurants } from './statistics.js';
import { initializeDeals } from './deals.js';

let restaurants = [];

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
    initializeMap(restaurants);
    initializeDeals(restaurants);
}

// Tab switching logic
document.getElementById('statsTab').addEventListener('click', () => switchTab('stats'));
document.getElementById('mapTab').addEventListener('click', () => switchTab('map'));
document.getElementById('dealsTab').addEventListener('click', () => switchTab('deals'));
document.getElementById('searchTab').addEventListener('click', () => switchTab('search'));

function switchTab(tab) {
    const tabs = ['stats', 'map', 'deals', 'search'];
    tabs.forEach(t => {
        const content = document.getElementById(`${t}Content`);
        const tabElement = document.getElementById(`${t}Tab`);
        if (t === tab) {
            content.classList.remove('hidden');
            tabElement.classList.add('bg-blue-500', 'text-white');
            tabElement.classList.remove('bg-gray-300', 'text-gray-700');
            if (t === 'map') {
                setTimeout(() => {
                    initializeMap(restaurants);
                }, 0);
            }
        } else {
            content.classList.add('hidden');
            tabElement.classList.add('bg-gray-300', 'text-gray-700');
            tabElement.classList.remove('bg-blue-500', 'text-white');
        }
    });
}

displayData();