import requests
import json
from datetime import datetime
import os
import time

def fetch_neotaste_data():
    base_url = "https://api.neotaste.com/cities/vienna/restaurants/"
    params = {"citySlug": "vienna", "page": 1}
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
                    'deals': [],  # This will be populated later
                    'tags': []    # This will be populated later
                })

            total_pages += 1

            print(f"Fetched page {params['page']}: {len(data['data'])} restaurants")

            if data['meta']['isLastPage']:
                break

            params['page'] += 1
            time.sleep(1)  # Add a small delay to avoid overwhelming the server

        except requests.exceptions.RequestException as e:
            print(f"An error occurred while fetching page {params['page']}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Status code: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            break

    print(f"\nTotal restaurants fetched: {len(all_restaurants)}")
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
        
        # Extract relevant information
        details = {
            'deals': data['data'].get('deals', []),
            'tags': data['data'].get('tags', []),
            # Update address information in case it's more detailed here
            'address': data['data'].get('address', ''),
            'addressOptional': data['data'].get('addressOptional', ''),
            'zipCode': data['data'].get('zipCode', ''),
            'latitude': data['data'].get('latitude'),
            'longitude': data['data'].get('longitude'),
        }
        
        return details
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching details for {slug}: {e}")
        return None

def save_structured_data(data):
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Save latest full data
    with open('data/latest_full_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Load previous data to compare changes
    if os.path.exists('data/latest_full_data.json'):
        with open('data/latest_full_data.json', 'r', encoding='utf-8') as f:
            previous_data = json.load(f)
    else:
        previous_data = []

    # Compute changes
    new_restaurants = [r for r in data if r['uuid'] not in [pr['uuid'] for pr in previous_data]]
    removed_restaurants = [r for r in previous_data if r['uuid'] not in [nr['uuid'] for nr in data]]
    existing_restaurants = [r for r in data if r['uuid'] in [pr['uuid'] for pr in previous_data]]

    # Prepare daily changes with comprehensive deal information and address
    daily_changes = {
        'date': today,
        'new_restaurants': [{
            'name': r['name'],
            'uuid': r['uuid'],
            'deals': r.get('deals', []),
            'address': r.get('address', ''),
            'zipCode': r.get('zipCode', ''),
            'latitude': r.get('latitude', None),
            'longitude': r.get('longitude', None)
        } for r in new_restaurants],
        'removed_restaurants': [{
            'name': r['name'],
            'uuid': r['uuid'],
            'deals': r.get('deals', []),
            'address': r.get('address', ''),
            'zipCode': r.get('zipCode', ''),
            'latitude': r.get('latitude', None),
            'longitude': r.get('longitude', None)
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
            
            if new_deals or removed_deals:
                daily_changes['existing_restaurants'].append({
                    'name': current['name'],
                    'uuid': current['uuid'],
                    'new_deals': new_deals,
                    'removed_deals': removed_deals,
                    'current_deals': current.get('deals', []),
                    'address': current.get('address', ''),
                    'zipCode': current.get('zipCode', ''),
                    'latitude': current.get('latitude', None),
                    'longitude': current.get('longitude', None)
                })

    # Save daily changes
    os.makedirs('data/daily_changes', exist_ok=True)
    with open(f'data/daily_changes/{today}.json', 'w', encoding='utf-8') as f:
        json.dump(daily_changes, f, ensure_ascii=False, indent=2)

    # Update summary file
    if os.path.exists('data/summary.json'):
        with open('data/summary.json', 'r', encoding='utf-8') as f:
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

    # Add full restaurant data including address to summary
    summary['restaurants'] = [{
        'name': r['name'],
        'uuid': r['uuid'],
        'deals': r.get('deals', []),
        'address': r.get('address', ''),
        'zipCode': r.get('zipCode', ''),
        'latitude': r.get('latitude', None),
        'longitude': r.get('longitude', None)
    } for r in data]

    with open('data/summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"Data updated for {today}")
    print(f"Total restaurants: {len(data)}")
    print(f"New restaurants: {len(new_restaurants)}")
    print(f"Removed restaurants: {len(removed_restaurants)}")
    print(f"Restaurants with deal changes: {len(daily_changes['existing_restaurants'])}")
    print(f"Total deals: {sum(len(r.get('deals', [])) for r in data)}")

if __name__ == "__main__":
    restaurants = fetch_neotaste_data()
    
    for restaurant in restaurants:
        print(f"Fetching details for {restaurant['name']}...")
        details = fetch_restaurant_details(restaurant['slug'])
        if details:
            restaurant.update(details)

    save_structured_data(restaurants)