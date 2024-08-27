# Neotaste Scrapper and Restaurant Deal Analyzer

This project scrapes restaurant deal data from Neotaste and TheFork, and provides tools for analyzing and comparing the deals across these platforms.

## Live Demo

Check out the live demo of the deal comparison tool:
[https://masterries.github.io/Neotaste_Scrapper/](https://masterries.github.io/Neotaste_Scrapper/)

## Frontend Contents

- `index.html`: Main page for viewing and filtering restaurant deals
- `deal_statistics.html`: Page for comparing deal statistics between Neotaste and TheFork
- `restaurants.js`: JavaScript file handling restaurant data fetching and processing
- `map.js`: JavaScript file for map initialization and updates
- `styles.css`: CSS styles for the project


## Data Collection Contents

..

## Features

- View restaurant deals from Neotaste and TheFork
- Filter deals by city, price range, and tags
- Interactive map showing restaurant locations
- Detailed statistics comparing deals from both platforms
- Data export functionality for further analysis

## Data Structure

The project expects data files in the following structure:
```
data/
  └── [city name]/
      ├── latest_full_data.json (Neotaste data)
      └── processed_thefork_data_2024-08-27.json (TheFork data)
```