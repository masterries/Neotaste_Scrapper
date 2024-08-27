import requests
import json
from datetime import datetime
import os
import time

def fetch_neotaste_data(city):
    base_url = f"https://api.neotaste.com/cities/{city}/restaurants/"
    params = {"citySlug": city, "page": 1}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://neotaste.com/',
        'Origin': 'https://neotaste.com'
    }

    all_restaurants = []
    total_pages = 0

    while True:
        try:
            response = requests.get(base_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

            for restaurant in data['data']:
                all_restaurants.append({
                    'uuid': restaurant['uuid'],
                    'name': restaurant['name'],
                    'slug': restaurant['slug'],
                    'address': restaurant.get('address', ''),
                    'addressOptional': restaurant.get('addressOptional', ''),
                    'zipCode': restaurant.get('zipCode', ''),
                    'latitude': restaurant.get('latitude'),
                    'longitude': restaurant.get('longitude'),
                    'deals': [],
                    'tags': [],
                    'avgRating': restaurant.get('avgRating'),
                    'ratingsCount': restaurant.get('ratingsCount'),
                    'reviewsCount': restaurant.get('reviewsCount'),
                    'images': [],
                    'priceRange': restaurant.get('priceRange')
                })

            total_pages += 1

            print(f"Fetched page {params['page']} for {city}: {len(data['data'])} restaurants")

            if data['meta']['isLastPage']:
                break

            params['page'] += 1
            time.sleep(1)

        except requests.exceptions.RequestException as e:
            print(f"An error occurred while fetching page {params['page']} for {city}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Status code: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            break

    print(f"\nTotal restaurants fetched for {city}: {len(all_restaurants)}")
    print(f"Total pages: {total_pages}")

    return all_restaurants

def fetch_restaurant_details(slug):
    url = f"https://api.neotaste.com/restaurants/{slug}/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://neotaste.com/',
        'Origin': 'https://neotaste.com'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        details = {
            'deals': data['data'].get('deals', []),
            'tags': data['data'].get('tags', []),
            'address': data['data'].get('address', ''),
            'addressOptional': data['data'].get('addressOptional', ''),
            'zipCode': data['data'].get('zipCode', ''),
            'latitude': data['data'].get('latitude'),
            'longitude': data['data'].get('longitude'),
            'avgRating': data['data'].get('avgRating'),
            'ratingsCount': data['data'].get('ratingsCount'),
            'reviewsCount': data['data'].get('reviewsCount'),
            'images': [img['url'] for img in data['data'].get('images', [])],
            'priceRange': data['data'].get('priceRange')
        }
        
        return details
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching details for {slug}: {e}")
        return None

def save_structured_data(data, city):
    today = datetime.now().strftime("%Y-%m-%d")
    city_data_dir = f'data/{city}'
    os.makedirs(city_data_dir, exist_ok=True)
    
    # Save latest full data
    with open(f'{city_data_dir}/latest_full_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Load previous data to compare changes
    if os.path.exists(f'{city_data_dir}/latest_full_data.json'):
        with open(f'{city_data_dir}/latest_full_data.json', 'r', encoding='utf-8') as f:
            previous_data = json.load(f)
    else:
        previous_data = []

    # Compute changes
    new_restaurants = [r for r in data if r['uuid'] not in [pr['uuid'] for pr in previous_data]]
    removed_restaurants = [r for r in previous_data if r['uuid'] not in [nr['uuid'] for nr in data]]
    existing_restaurants = [r for r in data if r['uuid'] in [pr['uuid'] for pr in previous_data]]

    # Prepare daily changes
    daily_changes = {
        'date': today,
        'new_restaurants': [{
            'name': r['name'],
            'uuid': r['uuid'],
            'deals': r.get('deals', []),
            'address': r.get('address', ''),
            'zipCode': r.get('zipCode', ''),
            'latitude': r.get('latitude', None),
            'longitude': r.get('longitude', None),
            'avgRating': r.get('avgRating'),
            'ratingsCount': r.get('ratingsCount'),
            'reviewsCount': r.get('reviewsCount'),
            'images': r.get('images', []),
            'priceRange': r.get('priceRange')
        } for r in new_restaurants],
        'removed_restaurants': [{
            'name': r['name'],
            'uuid': r['uuid'],
            'deals': r.get('deals', []),
            'address': r.get('address', ''),
            'zipCode': r.get('zipCode', ''),
            'latitude': r.get('latitude', None),
            'longitude': r.get('longitude', None),
            'avgRating': r.get('avgRating'),
            'ratingsCount': r.get('ratingsCount'),
            'reviewsCount': r.get('reviewsCount'),
            'images': r.get('images', []),
            'priceRange': r.get('priceRange')
        } for r in removed_restaurants],
        'existing_restaurants': [],
        'total_restaurants': len(data)
    }

    # Process existing restaurants for deal changes
    for current in existing_restaurants:
        previous = next((r for r in previous_data if r['uuid'] == current['uuid']), None)
        if previous:
            current_deals = set(json.dumps(d) for d in current.get('deals', []))
            previous_deals = set(json.dumps(d) for d in previous.get('deals', []))
            
            new_deals = [json.loads(d) for d in current_deals - previous_deals]
            removed_deals = [json.loads(d) for d in previous_deals - current_deals]
            
            if (new_deals or removed_deals or 
                current['avgRating'] != previous['avgRating'] or
                current['priceRange'] != previous['priceRange']):
                daily_changes['existing_restaurants'].append({
                    'name': current['name'],
                    'uuid': current['uuid'],
                    'new_deals': new_deals,
                    'removed_deals': removed_deals,
                    'current_deals': current.get('deals', []),
                    'address': current.get('address', ''),
                    'zipCode': current.get('zipCode', ''),
                    'latitude': current.get('latitude', None),
                    'longitude': current.get('longitude', None),
                    'avgRating': current.get('avgRating'),
                    'ratingsCount': current.get('ratingsCount'),
                    'reviewsCount': current.get('reviewsCount'),
                    'images': current.get('images', []),
                    'priceRange': current.get('priceRange')
                })

    # Save daily changes
    os.makedirs(f'{city_data_dir}/daily_changes', exist_ok=True)
    with open(f'{city_data_dir}/daily_changes/{today}.json', 'w', encoding='utf-8') as f:
        json.dump(daily_changes, f, ensure_ascii=False, indent=2)

    # Update summary file
    if os.path.exists(f'{city_data_dir}/summary.json'):
        with open(f'{city_data_dir}/summary.json', 'r', encoding='utf-8') as f:
            summary = json.load(f)
    else:
        summary = {'daily_counts': []}

    summary['daily_counts'].append({
        'date': today,
        'total_restaurants': len(data),
        'new_restaurants': len(new_restaurants),
        'removed_restaurants': len(removed_restaurants),
        'restaurants_with_deal_changes': len(daily_changes['existing_restaurants']),
        'total_deals': sum(len(r.get('deals', [])) for r in data)
    })
    summary['last_updated'] = today

    summary['restaurants'] = [{
        'name': r['name'],
        'uuid': r['uuid'],
        'deals': r.get('deals', []),
        'address': r.get('address', ''),
        'zipCode': r.get('zipCode', ''),
        'latitude': r.get('latitude', None),
        'longitude': r.get('longitude', None),
        'avgRating': r.get('avgRating'),
        'ratingsCount': r.get('ratingsCount'),
        'reviewsCount': r.get('reviewsCount'),
        'images': r.get('images', []),
        'priceRange': r.get('priceRange')
    } for r in data]

    with open(f'{city_data_dir}/summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"Data updated for {city} on {today}")
    print(f"Total restaurants: {len(data)}")
    print(f"New restaurants: {len(new_restaurants)}")
    print(f"Removed restaurants: {len(removed_restaurants)}")
    print(f"Restaurants with deal changes: {len(daily_changes['existing_restaurants'])}")
    print(f"Total deals: {sum(len(r.get('deals', [])) for r in data)}")

def process_city(city):
    print(f"Processing data for {city}...")
    restaurants = fetch_neotaste_data(city)
    
    for restaurant in restaurants:
        print(f"Fetching details for {restaurant['name']} in {city}...")
        details = fetch_restaurant_details(restaurant['slug'])
        if details:
            restaurant.update(details)

    save_structured_data(restaurants, city)

if __name__ == "__main__":
    cities = ["freiburg"]  # Add more cities as needed
    for city in cities:
        process_city(city)