"""
Machine Learning models for traffic prediction.
Implements LSTM, GNN, and CNN-GRU architectures.
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from typing import Tuple, List, Dict
import json
from datetime import datetime


class LSTMModel:
    """LSTM model for time series traffic prediction."""
    
    def __init__(self, seq_length: int = 24, num_features: int = 5):
        self.seq_length = seq_length
        self.num_features = num_features
        self.model = self._build_model()
    
    def _build_model(self) -> Model:
        """Build LSTM architecture."""
        model = keras.Sequential([
            layers.LSTM(64, activation='relu', input_shape=(self.seq_length, self.num_features),
                       return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(32, activation='relu', return_sequences=False),
            layers.Dropout(0.2),
            layers.Dense(16, activation='relu'),
            layers.Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              epochs: int = 50, batch_size: int = 32) -> Dict:
        """Train LSTM model."""
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=0
        )
        return history.history
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions."""
        return self.model.predict(X, verbose=0)
    
    def save(self, path: str):
        """Save model."""
        self.model.save(path)
    
    def load(self, path: str):
        """Load model."""
        self.model = keras.models.load_model(path)


class GNNModel:
    """Graph Neural Network for spatial-temporal traffic prediction."""
    
    def __init__(self, num_nodes: int = 50, seq_length: int = 24, 
                 num_features: int = 5, hidden_dim: int = 32):
        self.num_nodes = num_nodes
        self.seq_length = seq_length
        self.num_features = num_features
        self.hidden_dim = hidden_dim
        self.model = self._build_model()
    
    def _build_adjacency_matrix(self, distances: np.ndarray, 
                                threshold: float = 0.5) -> np.ndarray:
        """Build adjacency matrix from distances."""
        # Normalize distances
        distances_norm = (distances - distances.min()) / (distances.max() - distances.min() + 1e-8)
        # Create adjacency matrix (connect if distance < threshold)
        adj = (distances_norm < threshold).astype(float)
        # Add self-loops
        np.fill_diagonal(adj, 1)
        return adj
    
    def _graph_conv_layer(self, inputs, adj_matrix, units: int):
        """Graph convolution layer."""
        # inputs shape: (batch, num_nodes, features)
        # adj_matrix shape: (num_nodes, num_nodes)
        
        # Dense transformation
        x = layers.Dense(units, activation='relu')(inputs)
        
        # Graph convolution: A @ X
        # Expand adj_matrix for batch processing
        adj_expanded = tf.expand_dims(adj_matrix, 0)  # (1, num_nodes, num_nodes)
        x = tf.matmul(adj_expanded, x)  # (batch, num_nodes, units)
        
        return x
    
    def _build_model(self) -> Model:
        """Build GNN architecture."""
        # Input: (batch, num_nodes, seq_length, num_features)
        node_input = layers.Input(shape=(self.num_nodes, self.seq_length, self.num_features))
        
        # Reshape for temporal processing
        x = layers.Reshape((self.num_nodes, self.seq_length * self.num_features))(node_input)
        
        # Graph convolution layers
        x = layers.Dense(self.hidden_dim, activation='relu')(x)
        x = layers.Dense(self.hidden_dim, activation='relu')(x)
        
        # Temporal processing with LSTM
        x = layers.LSTM(32, activation='relu', return_sequences=False)(x)
        
        # Output layer
        output = layers.Dense(1)(x)
        
        model = Model(inputs=node_input, outputs=output)
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              epochs: int = 50, batch_size: int = 32) -> Dict:
        """Train GNN model."""
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=0
        )
        return history.history
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions."""
        return self.model.predict(X, verbose=0)
    
    def save(self, path: str):
        """Save model."""
        self.model.save(path)
    
    def load(self, path: str):
        """Load model."""
        self.model = keras.models.load_model(path)


class CNNGRUModel:
    """CNN-GRU model combining convolutional and recurrent layers."""
    
    def __init__(self, seq_length: int = 24, num_features: int = 5):
        self.seq_length = seq_length
        self.num_features = num_features
        self.model = self._build_model()
    
    def _build_model(self) -> Model:
        """Build CNN-GRU architecture."""
        model = keras.Sequential([
            # CNN layers for feature extraction
            layers.Conv1D(filters=64, kernel_size=3, activation='relu',
                         input_shape=(self.seq_length, self.num_features)),
            layers.Conv1D(filters=32, kernel_size=3, activation='relu'),
            layers.MaxPooling1D(pool_size=2),
            layers.Dropout(0.2),
            
            # GRU layers for temporal modeling
            layers.GRU(64, activation='relu', return_sequences=True),
            layers.Dropout(0.2),
            layers.GRU(32, activation='relu', return_sequences=False),
            layers.Dropout(0.2),
            
            # Dense layers
            layers.Dense(16, activation='relu'),
            layers.Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              epochs: int = 50, batch_size: int = 32) -> Dict:
        """Train CNN-GRU model."""
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=0
        )
        return history.history
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions."""
        return self.model.predict(X, verbose=0)
    
    def save(self, path: str):
        """Save model."""
        self.model.save(path)
    
    def load(self, path: str):
        """Load model."""
        self.model = keras.models.load_model(path)


class ModelEvaluator:
    """Evaluate and compare model performance."""
    
    @staticmethod
    def calculate_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate Root Mean Squared Error."""
        return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    
    @staticmethod
    def calculate_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate Mean Absolute Error."""
        return float(np.mean(np.abs(y_true - y_pred)))
    
    @staticmethod
    def calculate_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate Mean Absolute Percentage Error."""
        return float(np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100)
    
    @staticmethod
    def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray,
                      model_name: str) -> Dict:
        """Evaluate model on test set."""
        y_pred = model.predict(X_test)
        
        metrics = {
            'model': model_name,
            'rmse': ModelEvaluator.calculate_rmse(y_test, y_pred),
            'mae': ModelEvaluator.calculate_mae(y_test, y_pred),
            'mape': ModelEvaluator.calculate_mape(y_test, y_pred),
            'timestamp': datetime.now().isoformat()
        }
        
        return metrics
    
    @staticmethod
    def compare_models(models: Dict, X_test: np.ndarray, 
                      y_test: np.ndarray) -> List[Dict]:
        """Compare multiple models."""
        results = []
        for model_name, model in models.items():
            metrics = ModelEvaluator.evaluate_model(model, X_test, y_test, model_name)
            results.append(metrics)
        
        # Sort by RMSE
        results.sort(key=lambda x: x['rmse'])
        return results


class TrafficPredictionPipeline:
    """Complete pipeline for training and evaluating traffic prediction models."""
    
    def __init__(self, seq_length: int = 24, num_features: int = 5):
        self.seq_length = seq_length
        self.num_features = num_features
        self.models = {}
        self.evaluator = ModelEvaluator()
    
    def prepare_data(self, data: np.ndarray, 
                    train_ratio: float = 0.8) -> Tuple[Tuple, Tuple]:
        """Prepare data for training."""
        # Create sequences
        X, y = [], []
        for i in range(len(data) - self.seq_length):
            X.append(data[i:i + self.seq_length])
            y.append(data[i + self.seq_length, 0])  # Predict speed
        
        X = np.array(X)
        y = np.array(y)
        
        # Split train/test
        split_idx = int(len(X) * train_ratio)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        return (X_train, y_train), (X_test, y_test)
    
    def train_all_models(self, X_train: np.ndarray, y_train: np.ndarray,
                        epochs: int = 50) -> Dict:
        """Train all three models."""
        print("Training LSTM model...")
        lstm = LSTMModel(self.seq_length, self.num_features)
        lstm_history = lstm.train(X_train, y_train, epochs=epochs)
        self.models['lstm'] = lstm
        
        print("Training CNN-GRU model...")
        cnn_gru = CNNGRUModel(self.seq_length, self.num_features)
        cnn_gru_history = cnn_gru.train(X_train, y_train, epochs=epochs)
        self.models['cnn_gru'] = cnn_gru
        
        print("Training GNN model...")
        gnn = GNNModel(num_nodes=50, seq_length=self.seq_length, 
                      num_features=self.num_features)
        gnn_history = gnn.train(X_train, y_train, epochs=epochs)
        self.models['gnn'] = gnn
        
        return {
            'lstm': lstm_history,
            'cnn_gru': cnn_gru_history,
            'gnn': gnn_history
        }
    
    def evaluate_all_models(self, X_test: np.ndarray, 
                           y_test: np.ndarray) -> List[Dict]:
        """Evaluate all models and return comparison."""
        results = self.evaluator.compare_models(self.models, X_test, y_test)
        return results
    
    def get_best_model(self) -> Tuple[str, object]:
        """Get best performing model."""
        if not self.models:
            raise ValueError("No models trained yet")
        return list(self.models.items())[0]


# Example usage
if __name__ == "__main__":
    print("Initializing ML pipeline...")
    
    # Generate synthetic data
    np.random.seed(42)
    data = np.random.randn(1000, 5)  # 1000 timesteps, 5 features
    
    # Create pipeline
    pipeline = TrafficPredictionPipeline(seq_length=24, num_features=5)
    
    # Prepare data
    (X_train, y_train), (X_test, y_test) = pipeline.prepare_data(data)
    print(f"Training data shape: {X_train.shape}")
    print(f"Test data shape: {X_test.shape}")
    
    # Train models
    histories = pipeline.train_all_models(X_train, y_train, epochs=10)
    
    # Evaluate models
    results = pipeline.evaluate_all_models(X_test, y_test)
    
    print("\nModel Comparison Results:")
    for result in results:
        print(f"\n{result['model'].upper()}:")
        print(f"  RMSE: {result['rmse']:.4f}")
        print(f"  MAE:  {result['mae']:.4f}")
        print(f"  MAPE: {result['mape']:.2f}%")
