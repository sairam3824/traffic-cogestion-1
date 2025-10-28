"""
Training script for traffic prediction models.
Loads data from Supabase and trains all three models.
"""

import os
import json
import numpy as np
from datetime import datetime
from ml_models import TrafficPredictionPipeline, ModelEvaluator
from data_generator import DataGenerator, FeatureEngineer, DataPreprocessor


def load_training_data(num_segments: int = 50, days: int = 30) -> np.ndarray:
    """Load and prepare training data."""
    print("Generating training data...")
    
    generator = DataGenerator(num_segments=num_segments, days=days)
    observations = generator.generate_traffic_observations()
    
    # Extract speed data for training
    speeds = np.array([obs['speed_kmh'] for obs in observations])
    
    # Reshape for multi-segment training
    # Group by segment and create feature matrix
    segment_data = {}
    for obs in observations:
        seg_id = obs['segment_id']
        if seg_id not in segment_data:
            segment_data[seg_id] = []
        segment_data[seg_id].append([
            obs['speed_kmh'],
            obs['volume_vehicles'],
            obs['occupancy_percent'],
            1 if obs['congestion_level'] == 'free' else 0,  # Encoded
            1 if obs['congestion_level'] == 'severe' else 0
        ])
    
    # Convert to numpy array (use first segment for training)
    first_segment = list(segment_data.values())[0]
    data = np.array(first_segment)
    
    print(f"Data shape: {data.shape}")
    return data


def train_and_evaluate():
    """Main training and evaluation function."""
    print("=" * 60)
    print("Traffic Prediction Model Training Pipeline")
    print("=" * 60)
    
    # Load data
    data = load_training_data(num_segments=50, days=30)
    
    # Create pipeline
    pipeline = TrafficPredictionPipeline(seq_length=24, num_features=5)
    
    # Prepare data
    (X_train, y_train), (X_test, y_test) = pipeline.prepare_data(data, train_ratio=0.8)
    
    print(f"\nData Preparation:")
    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples: {len(X_test)}")
    print(f"  Sequence length: 24 hours")
    print(f"  Features: 5 (speed, volume, occupancy, free, severe)")
    
    # Train models
    print(f"\nTraining Models (50 epochs)...")
    histories = pipeline.train_all_models(X_train, y_train, epochs=50)
    
    # Evaluate models
    print(f"\nEvaluating Models...")
    results = pipeline.evaluate_all_models(X_test, y_test)
    
    # Display results
    print("\n" + "=" * 60)
    print("MODEL COMPARISON RESULTS")
    print("=" * 60)
    
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result['model'].upper()}")
        print(f"   RMSE (Root Mean Squared Error): {result['rmse']:.4f}")
        print(f"   MAE  (Mean Absolute Error):     {result['mae']:.4f}")
        print(f"   MAPE (Mean Absolute % Error):   {result['mape']:.2f}%")
    
    # Save results
    results_file = "scripts/model_results.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to {results_file}")
    
    return results


if __name__ == "__main__":
    results = train_and_evaluate()
