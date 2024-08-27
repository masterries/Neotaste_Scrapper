import requests
from bs4 import BeautifulSoup
import re
import json
import html

def get_soup(url):
    response = requests.get(url)
    return BeautifulSoup(response.text, 'html.parser')

def extract_marker_data(soup):
    map_div = soup.find('div', id='map')
    if map_div and 'data-markers' in map_div.attrs:
        markers_data = html.unescape(map_div['data-markers'])
        return json.loads(markers_data)
    return []

def extract_restaurant_info(marker, base_url):
    info = {
        'name': marker['title'],
        'url': marker['url'],
        'latitude': marker['pos']['lat'],
        'longitude': marker['pos']['lng'],
        'state': marker['data']['state'],
        'type': marker['data']['type'],
        'category': marker['data']['category']
    }
    
    # Fetch additional details from the restaurant's page
    soup = get_soup(info['url'])
    main_content = soup.find('div', class_='text-gray-900 sm:w-10/12 mx-auto leading-normal')
    
    if main_content:
        description_div = main_content.find('div', class_='font-thin mb-8 text-justify')
        if description_div:
            info['description'] = description_div.text.strip()
        info['euro_amounts'] = re.findall(r'(?:€|EUR)\s*(\d+(?:,\d+)?)', main_content.text)
        
        contact_div = soup.find('div', class_='text-gray-800 mt-12 sm:w-10/12 mx-auto mb-8')
        if contact_div:
            address_div = contact_div.find('div', recursive=False)
            if address_div:
                info['address'] = ' '.join(address_div.stripped_strings)
            
            phone_link = contact_div.find('a', href=lambda href: href and href.startswith('tel:'))
            if phone_link:
                info['phone'] = phone_link.text.strip()
            
            email_link = contact_div.find('a', href=lambda href: href and href.startswith('mailto:'))
            if email_link:
                info['email'] = email_link.text.strip()
            
            website_link = contact_div.find('a', href=lambda href: href and not (href.startswith('tel:') or href.startswith('mailto:')))
            if website_link:
                info['website'] = website_link.text.strip()
        
        image_div = soup.find('div', class_='js-gallery-item gallery-item mb-4')
        if image_div:
            img_tag = image_div.find('img')
            if img_tag and 'src' in img_tag.attrs:
                info['images'] = [img_tag['src']]

    return info

def main():
    base_url = 'https://signature.at'
    main_page_url = f'{base_url}/2-for-1-gourmet-gutscheinbuch'
    
    soup = get_soup(main_page_url)
    markers = extract_marker_data(soup)
    
    results = []
    
    for marker in markers:
        restaurant_info = extract_restaurant_info(marker, base_url)
        if restaurant_info:
            results.append(restaurant_info)
    
    # Save results to a JSON file
    with open('restaurant_info.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Scraped information for {len(results)} restaurants. Results saved to restaurant_info.json")

if __name__ == "__main__":
    main()