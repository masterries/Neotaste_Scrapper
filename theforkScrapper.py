import json
from datetime import datetime
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def fetch_restaurant_data(url):
    all_restaurants = []
    page = 1
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        current_url = f"{url}?p={page}"
        driver.get(current_url)
        
        # Wait for the content to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Extract the page source
        page_source = driver.page_source
        
        # Print the first 1000 characters of the page source for debugging
        print("First 1000 characters of the page source:")
        print(page_source[:1000])
        
        # Try to find and extract JSON data
        try:
            json_element = driver.find_element(By.TAG_NAME, "pre")
            json_text = json_element.text
            data = json.loads(json_text)
            print("JSON data successfully extracted and parsed.")
        except Exception as json_error:
            print(f"Error extracting or parsing JSON: {json_error}")
            data = None
        
        if data and 'pageProps' in data:
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
                    'slug': restaurant['slug'],
                    'marketingOffer': {
                        'label': marketing_offer['label'] if marketing_offer else None,
                        'type': marketing_offer['type'] if marketing_offer else None,
                        'title': marketing_offer['title'] if marketing_offer else None,
                        'discountPercentage': marketing_offer['discountPercentage'] if marketing_offer else None
                    }
                }
                all_restaurants.append(restaurant_data)
            
            print(f"Fetched page {page}: {len(restaurants)} restaurants")
        else:
            print("No restaurant data found in the response.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        driver.quit()
    
    return all_restaurants

def save_data(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    url = "https://www.thefork.at/_next/data/xBoaAKbMFghBPiwAqYov8/de-AT/search/cityTag/wien/597321/promotions.json"
    
    restaurants = fetch_restaurant_data(url)
    
    today = datetime.now().strftime("%Y-%m-%d")
    filename = f'thefork_restaurant_data_{today}.json'
    save_data(restaurants, filename)
    print(f"Data saved to {filename}")

if __name__ == "__main__":
    main()