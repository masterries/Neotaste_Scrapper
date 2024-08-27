import json
import os
from datetime import datetime

def process_thefork_data(folder_path):
    all_restaurants = []
    
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as file:
                data = json.load(file)
                
                # Extract restaurant list
                restaurants = data['pageProps']['searchPageResultsFetchResult']['list']
                
                for item in restaurants:
                    restaurant = item['restaurant']
                    marketing_offer = item.get('marketingOffer')
                    
                    restaurant_data = {
                        'id': restaurant['id'],
                        'name': restaurant['name'],
                        'address': {
                            'street': restaurant['address']['street'],
                            'zipCode': restaurant['address']['zipCode'],
                            'locality': restaurant['address']['locality'],
                            'country': restaurant['address']['country']
                        },
                        'geolocation': {
                            'latitude': restaurant['geolocation']['latitude'],
                            'longitude': restaurant['geolocation']['longitude']
                        },
                        'rating': restaurant['aggregateRatings']['thefork']['ratingValue'],
                        'reviewCount': restaurant['aggregateRatings']['thefork']['reviewCount'],
                        'priceRange': restaurant['priceRangeLevel'],
                        'averagePrice': restaurant['averagePrice'],
                        'cuisine': restaurant['servesCuisine'],
                        'mainPhotoUrl': restaurant['mainPhotoUrl'],
                        'photos': [photo['src'] for photo in restaurant['photos']],
                        'slug': restaurant['slug'],
                        'marketingOffer': {
                            'label': marketing_offer['label'] if marketing_offer else None,
                            'type': marketing_offer['type'] if marketing_offer else None,
                            'title': marketing_offer['title'] if marketing_offer else None,
                            'discountPercentage': marketing_offer['discountPercentage'] if marketing_offer else None
                        }
                    }
                    all_restaurants.append(restaurant_data)
    
    return all_restaurants

def save_processed_data(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    folder_path = 'thefork'  # Change this to the path of your folder containing TheFork JSON files
    processed_data = process_thefork_data(folder_path)
    
    today = datetime.now().strftime("%Y-%m-%d")
    filename = f'processed_thefork_data_{today}.json'
    save_processed_data(processed_data, filename)
    print(f"Processed data saved to {filename}")
    
    # Print some statistics
    print(f"Total restaurants processed: {len(processed_data)}")
    print(f"Restaurants with marketing offers: {sum(1 for r in processed_data if r['marketingOffer']['label'] is not None)}")

if __name__ == "__main__":
    main()