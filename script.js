const openCageApiKey = 'e2688b68005e48bd8b06d5f9c9aef288'; // Your OpenCage API key
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const restaurantList = document.getElementById('restaurantList');
const savedRestaurantsList = document.getElementById('savedRestaurants');

searchBtn.addEventListener('click', fetchRestaurants);
document.addEventListener('DOMContentLoaded', loadSavedRestaurants);

async function fetchRestaurants() {
    const city = cityInput.value.trim();
    if (city === '') return;

    try {
        // Step 1: Convert City to Coordinates (Using OpenCage API)
        const geoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${openCageApiKey}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();
        
        if (!geoData.results.length) {
            alert('City not found!');
            return;
        }

        const { lat, lng } = geoData.results[0].geometry;
        console.log(`Coordinates for ${city}: ${lat}, ${lng}`);

        // Step 2: Fetch Restaurants from OpenStreetMap Overpass API
        const overpassQuery = `[out:json];node(around:5000,${lat},${lng})[amenity=restaurant];out;`;
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        const overpassResponse = await fetch(overpassUrl);
        const overpassData = await overpassResponse.json();
        
        if (!overpassData.elements.length) {
            restaurantList.innerHTML = "<p>No restaurants found.</p>";
            return;
        }

        displayRestaurants(overpassData.elements);
    } catch (error) {
        console.error(error);
        alert('API error!');
    }
}

function displayRestaurants(restaurants) {
    restaurantList.innerHTML = restaurants.map(restaurant => `
        <div class="restaurant-card">
            <h2>${restaurant.tags.name || "Unnamed Restaurant"}</h2>
            <p>Type: ${restaurant.tags.cuisine || "Not specified"}</p>
            <p>Address: ${restaurant.tags["addr:street"] || "Unknown"}</p>
            <button onclick="saveRestaurant('${restaurant.tags.name || "Unnamed Restaurant"}')">Save</button>
        </div>
    `).join('');
}

function saveRestaurant(name) {
    let savedRestaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    if (!savedRestaurants.includes(name)) {
        savedRestaurants.push(name);
        localStorage.setItem('restaurants', JSON.stringify(savedRestaurants));
        displaySavedRestaurants();
    }
}

function loadSavedRestaurants() {
    displaySavedRestaurants();
}

function displaySavedRestaurants() {
    let savedRestaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    savedRestaurantsList.innerHTML = savedRestaurants.map(name => `
        <li onclick="fetchSavedRestaurant('${name}')">${name} <span onclick="removeRestaurant(event, '${name}')">❌</span></li>
    `).join('');
}

function fetchSavedRestaurant(name) {
    alert(`Fetching details for ${name}...`);
}

function removeRestaurant(event, name) {
    event.stopPropagation();
    let savedRestaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    savedRestaurants = savedRestaurants.filter(r => r !== name);
    localStorage.setItem('restaurants', JSON.stringify(savedRestaurants));
    displaySavedRestaurants();
}
