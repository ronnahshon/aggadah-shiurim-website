#!/usr/bin/env python3
import json
import os
import random

# Path to the JSON file (relative to project root)
DATA_FILE_PATH = 'public/data/shiurim_data.json'

# Sample durations for specific IDs we've defined
SAMPLE_DURATIONS = {
    'ein-yaakov-seder_nezikin-bava_kamma-1': '35:42',
    'ein-yaakov-seder_nezikin-bava_kamma-2': '41:15',
    'ein-yaakov-seder_nezikin-bava_kamma-3': '38:27',
    'ein-yaakov-seder_nezikin-bava_kamma-4': '42:19',
    'ein-yaakov-seder_nezikin-bava_kamma-5': '39:56',
    'ein-yaakov-seder_nezikin-bava_kamma-6': '44:10',
}

def generate_random_duration():
    """Generate a random duration between 30 and 55 minutes"""
    minutes = random.randint(30, 55)
    seconds = random.randint(0, 59)
    return f"{minutes}:{seconds:02d}"

def main():
    print(f"Reading data from {DATA_FILE_PATH}...")
    
    # Read the JSON data
    with open(DATA_FILE_PATH, 'r') as file:
        data = json.load(file)
    
    # Print stats before
    print(f"Found {len(data)} shiurim in the data file")
    existing_lengths = sum(1 for item in data if 'length' in item)
    print(f"Currently {existing_lengths} shiurim have a length field")
    
    # Add length field to each item
    for item in data:
        # Skip if length is already set
        if 'length' in item:
            continue
            
        # Use predefined lengths for some items, generate random ones for others
        if item['id'] in SAMPLE_DURATIONS:
            item['length'] = SAMPLE_DURATIONS[item['id']]
        else:
            item['length'] = generate_random_duration()
    
    # Write the updated data back to the file
    with open(DATA_FILE_PATH, 'w') as file:
        json.dump(data, file, indent=2)
    
    print(f"Successfully updated all {len(data)} shiurim with length field")
    print("Note: Most lengths are randomly generated between 30-55 minutes for demo purposes")
    print("In a production environment, you'd use actual durations from the audio files")

if __name__ == "__main__":
    main() 