#!/usr/bin/env python3
import json
import re

def parse_time_to_seconds(time_str):
    """Convert MM:SS format to total seconds"""
    if not time_str or time_str.strip() == "":
        return 0
    
    # Handle formats like "43:46" or "1:23:45" (if any have hours)
    parts = time_str.split(':')
    
    if len(parts) == 2:  # MM:SS format
        minutes, seconds = int(parts[0]), int(parts[1])
        return minutes * 60 + seconds
    elif len(parts) == 3:  # HH:MM:SS format
        hours, minutes, seconds = int(parts[0]), int(parts[1]), int(parts[2])
        return hours * 3600 + minutes * 60 + seconds
    else:
        return 0

def seconds_to_readable(total_seconds):
    """Convert total seconds to readable format"""
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    
    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    else:
        return f"{minutes}m {seconds}s"

def calculate_total_time():
    # Read the shiurim data
    with open('../src/data/shiurim_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loading {len(data)} shiurim entries...")
    
    total_seconds = 0
    entries_with_length = 0
    entries_without_length = 0
    
    print("\nProcessing lengths:")
    for i, entry in enumerate(data):
        length = entry.get('length', '')
        if length and length.strip():
            seconds = parse_time_to_seconds(length)
            total_seconds += seconds
            entries_with_length += 1
            
            # Show first few examples
            if i < 10:
                print(f"  Entry {entry['global_id']}: {length} = {seconds} seconds")
                
        else:
            entries_without_length += 1
            if entries_without_length <= 3:  # Show first few missing
                print(f"  Entry {entry['global_id']}: NO LENGTH - {entry['english_title'][:50]}...")
    
    print(f"\n=== SUMMARY ===")
    print(f"Total entries: {len(data)}")
    print(f"Entries with length: {entries_with_length}")
    print(f"Entries without length: {entries_without_length}")
    print(f"\nTotal seconds: {total_seconds:,}")
    print(f"Total time: {seconds_to_readable(total_seconds)}")
    
    # Additional breakdowns
    total_minutes = total_seconds / 60
    total_hours = total_seconds / 3600
    total_days = total_hours / 24
    
    print(f"\nBreakdown:")
    print(f"  {total_minutes:.1f} minutes")
    print(f"  {total_hours:.1f} hours")
    print(f"  {total_days:.1f} days")
    
    if entries_with_length > 0:
        avg_seconds = total_seconds / entries_with_length
        print(f"\nAverage shiur length: {seconds_to_readable(int(avg_seconds))}")

if __name__ == "__main__":
    calculate_total_time() 