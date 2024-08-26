import requests
import json
from datetime import datetime
import os

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

            all_restaurants.extend(data['data'])
            total_pages += 1

            print(f"Fetched page {params['page']}: {len(data['data'])} restaurants")

            if data['meta']['isLastPage']:
                break

            params['page'] += 1

        except requests.exceptions.RequestException as e:
            print(f"An error occurred while fetching page {params['page']}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Status code: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            break

    print(f"\nTotal restaurants fetched: {len(all_restaurants)}")
    print(f"Total pages: {total_pages}")

    return all_restaurants

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

    # Compute and save daily changes
    new_restaurants = [r for r in data if r['uuid'] not in [pr['uuid'] for pr in previous_data]]
    removed_restaurants = [r for r in previous_data if r['uuid'] not in [nr['uuid'] for nr in data]]
    
    daily_changes = {
        'date': today,
        'new_restaurants': [r['name'] for r in new_restaurants],
        'removed_restaurants': [r['name'] for r in removed_restaurants],
        'total_restaurants': len(data)
    }

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
        'removed_restaurants': len(removed_restaurants)
    })
    summary['last_updated'] = today

    with open('data/summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"Data updated for {today}")
    print(f"Total restaurants: {len(data)}")
    print(f"New restaurants: {len(new_restaurants)}")
    print(f"Removed restaurants: {len(removed_restaurants)}")

if __name__ == "__main__":
    restaurants = fetch_neotaste_data()
    save_structured_data(restaurants)