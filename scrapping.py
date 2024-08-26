import requests
import json
from datetime import datetime

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

def save_data(data):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"restaurant_data_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nData saved to {filename}")

if __name__ == "__main__":
    restaurants = fetch_neotaste_data()
    save_data(restaurants)