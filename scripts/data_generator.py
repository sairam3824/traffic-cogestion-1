"""
Data generation and preprocessing utilities for traffic prediction system.
Generates synthetic traffic data for model training and testing.
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

class TrafficDataGenerator:
    """Generate synthetic traffic data for training ML models."""
    
    def __init__(self, num_segments: int = 50, days: int = 30):
        self.num_segments = num_segments
        self.days = days
        self.segments = self._generate_segments()
    
    def _generate_segments(self) -> List[Dict]:
        """Generate traffic segments with coordinates."""
        segments = []
        for i in range(self.num_segments):
            lat = 40.7128 + random.uniform(-0.1, 0.1)  # NYC area
            lon = -74.0060 + random.uniform(-0.1, 0.1)
            segments.append({
                'id': f'segment_{i}',
                'name': f'Road Segment {i}',
                'latitude': lat,
                'longitude': lon,
                'road_type': random.choice(['highway', 'arterial', 'local']),
                'length_km': random.uniform(1, 10),
                'speed_limit': random.choice([30, 50, 70, 90])
            })
        return segments
    
    def generate_traffic_observations(self) -> List[Dict]:
        """Generate historical traffic observations."""
        observations = []
        base_time = datetime.now() - timedelta(days=self.days)
        
        for segment in self.segments:
            for day in range(self.days):
                for hour in range(24):
                    timestamp = base_time + timedelta(days=day, hours=hour)
                    
                    # Simulate traffic patterns (peak hours: 7-9am, 5-7pm)
                    is_peak = hour in [7, 8, 17, 18]
                    base_speed = segment['speed_limit'] * (0.4 if is_peak else 0.8)
                    
                    speed = base_speed + random.gauss(0, 5)
                    speed = max(10, min(segment['speed_limit'], speed))
                    
                    volume = (500 if is_peak else 200) + random.gauss(0, 50)
                    volume = max(0, int(volume))
                    
                    occupancy = (speed / segment['speed_limit']) * 100
                    
                    # Determine congestion level
                    if speed > segment['speed_limit'] * 0.7:
                        congestion = 'free'
                    elif speed > segment['speed_limit'] * 0.5:
                        congestion = 'moderate'
                    elif speed > segment['speed_limit'] * 0.3:
                        congestion = 'heavy'
                    else:
                        congestion = 'severe'
                    
                    observations.append({
                        'segment_id': segment['id'],
                        'timestamp': timestamp.isoformat(),
                        'speed_kmh': round(speed, 2),
                        'volume_vehicles': volume,
                        'occupancy_percent': round(occupancy, 2),
                        'congestion_level': congestion
                    })
        
        return observations
    
    def generate_weather_data(self) -> List[Dict]:
        """Generate weather data."""
        weather_data = []
        base_time = datetime.now() - timedelta(days=self.days)
        
        for day in range(self.days):
            for hour in range(24):
                timestamp = base_time + timedelta(days=day, hours=hour)
                
                weather_data.append({
                    'timestamp': timestamp.isoformat(),
                    'temperature_celsius': round(15 + random.gauss(0, 8), 2),
                    'precipitation_mm': round(random.expovariate(0.5), 2),
                    'visibility_km': round(random.uniform(5, 20), 2),
                    'wind_speed_kmh': round(random.gauss(10, 5), 2),
                    'weather_condition': random.choice(['clear', 'rainy', 'foggy', 'snowy'])
                })
        
        return weather_data
    
    def generate_events(self) -> List[Dict]:
        """Generate traffic events (accidents, construction, etc.)."""
        events = []
        base_time = datetime.now() - timedelta(days=self.days)
        
        for _ in range(int(self.num_segments * self.days * 0.1)):  # ~10% of segments have events
            segment = random.choice(self.segments)
            start_day = random.randint(0, self.days - 1)
            start_hour = random.randint(0, 23)
            duration_hours = random.randint(1, 8)
            
            start_time = base_time + timedelta(days=start_day, hours=start_hour)
            end_time = start_time + timedelta(hours=duration_hours)
            
            events.append({
                'segment_id': segment['id'],
                'event_type': random.choice(['accident', 'construction', 'event', 'incident']),
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'severity': random.choice(['low', 'medium', 'high']),
                'description': 'Traffic incident'
            })
        
        return events


class FeatureEngineer:
    """Feature engineering for ML models."""
    
    @staticmethod
    def create_temporal_features(timestamp: datetime) -> Dict:
        """Create temporal features from timestamp."""
        return {
            'hour': timestamp.hour,
            'day_of_week': timestamp.weekday(),
            'day_of_month': timestamp.day,
            'month': timestamp.month,
            'is_weekend': 1 if timestamp.weekday() >= 5 else 0,
            'is_peak_hour': 1 if timestamp.hour in [7, 8, 17, 18] else 0
        }
    
    @staticmethod
    def create_spatial_features(lat: float, lon: float, 
                               all_segments: List[Dict]) -> Dict:
        """Create spatial features based on segment location."""
        # Calculate distances to nearby segments
        distances = []
        for segment in all_segments:
            dist = math.sqrt(
                (lat - segment['latitude'])**2 + 
                (lon - segment['longitude'])**2
            )
            distances.append(dist)
        
        distances.sort()
        return {
            'nearest_segment_distance': distances[1] if len(distances) > 1 else 0,
            'avg_nearby_distance': sum(distances[:5]) / 5 if len(distances) >= 5 else 0
        }
    
    @staticmethod
    def normalize_features(features: List[Dict]) -> Tuple[List[Dict], Dict]:
        """Normalize features to [0, 1] range."""
        if not features:
            return [], {}
        
        # Calculate min/max for each feature
        stats = {}
        for key in features[0].keys():
            values = [f[key] for f in features if isinstance(f[key], (int, float))]
            if values:
                stats[key] = {
                    'min': min(values),
                    'max': max(values),
                    'range': max(values) - min(values)
                }
        
        # Normalize
        normalized = []
        for feature in features:
            norm_feature = {}
            for key, value in feature.items():
                if key in stats and stats[key]['range'] > 0:
                    norm_feature[key] = (value - stats[key]['min']) / stats[key]['range']
                else:
                    norm_feature[key] = value
            normalized.append(norm_feature)
        
        return normalized, stats


class DataPreprocessor:
    """Data preprocessing utilities."""
    
    @staticmethod
    def handle_missing_values(data: List[Dict], method: str = 'forward_fill') -> List[Dict]:
        """Handle missing values in time series data."""
        if method == 'forward_fill':
            for i in range(1, len(data)):
                for key in data[i]:
                    if data[i][key] is None:
                        data[i][key] = data[i-1][key]
        return data
    
    @staticmethod
    def create_sequences(data: List[float], seq_length: int = 24) -> Tuple[List, List]:
        """Create sequences for time series models."""
        X, y = [], []
        for i in range(len(data) - seq_length):
            X.append(data[i:i + seq_length])
            y.append(data[i + seq_length])
        return X, y
    
    @staticmethod
    def split_train_test(data: List, train_ratio: float = 0.8) -> Tuple[List, List]:
        """Split data into train and test sets."""
        split_idx = int(len(data) * train_ratio)
        return data[:split_idx], data[split_idx:]


# Example usage
if __name__ == "__main__":
    print("Generating synthetic traffic data...")
    generator = TrafficDataGenerator(num_segments=50, days=30)
    
    observations = generator.generate_traffic_observations()
    weather = generator.generate_weather_data()
    events = generator.generate_events()
    
    print(f"Generated {len(observations)} traffic observations")
    print(f"Generated {len(weather)} weather records")
    print(f"Generated {len(events)} events")
    
    # Example feature engineering
    engineer = FeatureEngineer()
    sample_obs = observations[0]
    temporal_features = engineer.create_temporal_features(
        datetime.fromisoformat(sample_obs['timestamp'])
    )
    print(f"Temporal features: {temporal_features}")
