"""
EcoView Student Model Distillation & Optimization Pipeline.
Designed to be run on Kaggle (free GPU) or locally.

Steps executed by this script:
1. Load dataset auto-labeled by the Gemini VLM Teacher from the data flywheel.
2. Fine-tune a lightweight MobileNetV2/MobileNetV4 backbone.
3. Export the fine-tuned PyTorch weights into ONNX format.
4. Apply dynamic INT8 quantization to achieve 75% size reduction and CPU execution speedup.
"""

import os
import json
import argparse
import glob
from typing import List, Tuple
import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    import torchvision.transforms as transforms
    import torchvision.models as models
except ImportError:
    # Allow file compilation/checks without torch installed
    pass

LABELS = [
    "garbage_dump",
    "plastic_waste",
    "industrial_smoke",
    "water_contamination",
    "deforestation",
    "oil_spill",
]

class EcoDataset(Dataset):
    def __init__(self, image_paths: List[str], label_indices: List[int], transform=None):
        self.image_paths = image_paths
        self.label_indices = label_indices
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert("RGB")
        label = self.label_indices[idx]
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

def load_flywheel_dataset(data_dir: str) -> Tuple[List[str], List[int]]:
    """Scans the flywheel directory, reading image paths and corresponding JSON labels."""
    image_paths = []
    label_indices = []
    
    # Search for JSON files
    json_pattern = os.path.join(data_dir, "*.json")
    json_files = glob.glob(json_pattern)
    
    for json_file in json_files:
        with open(json_file, 'r') as f:
            data = json.load(f)
            
        # Extract classification
        category = data.get("category")
        if category in LABELS:
            label_idx = LABELS.index(category)
            
            # Find corresponding image (could be .jpg or .png)
            base_path = os.path.splitext(json_file)[0]
            img_path = None
            for ext in [".jpg", ".png", ".jpeg"]:
                test_path = base_path + ext
                if os.path.exists(test_path):
                    img_path = test_path
                    break
                    
            if img_path:
                image_paths.append(img_path)
                label_indices.append(label_idx)
                
    return image_paths, label_indices

def train_and_export(data_dir: str, epochs: int, batch_size: int, output_onnx: str, quantized_onnx: str):
    print("[*] Starting EcoView Distillation Training Pipeline")
    
    # 1. Load data
    image_paths, label_indices = load_flywheel_dataset(data_dir)
    num_samples = len(image_paths)
    print(f"[+] Loaded {num_samples} samples from the data flywheel.")
    
    if num_samples < 6:
        print("[!] Dataset is too small to train a real model (need at least 6 samples). Generating synthetic dataset...")
        # Create a tiny mock dataset folder for compilation check
        os.makedirs(data_dir, exist_ok=True)
        image_paths, label_indices = generate_synthetic_data(data_dir)
        num_samples = len(image_paths)
        print(f"[+] Generated {num_samples} synthetic samples for testing.")

    # 2. Transforms & DataLoaders
    # Structural augmentations only (avoiding color augmentations that destroy pollution color metrics)
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
    dataset = EcoDataset(image_paths, label_indices, transform=train_transform)
    dataloader = DataLoader(dataset, batch_size=min(batch_size, num_samples), shuffle=True)

    # 3. Model Definition (MobileNetV2 Transfer Learning)
    print("[*] Initializing pre-trained MobileNetV2 backbone...")
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    
    # Freeze backbone (90% of layers) to train rapidly on small dataset
    for param in model.features.parameters():
        param.requires_grad = False
        
    # Replace classification head
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, len(LABELS))
    )
    
    # 4. Training loop
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=1e-3)
    
    print(f"[*] Training on device: {device} for {epochs} epochs...")
    model.train()
    for epoch in range(epochs):
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
        epoch_loss = running_loss / total
        epoch_acc = correct / total
        print(f"Epoch {epoch+1}/{epochs} - Loss: {epoch_loss:.4f} - Accuracy: {epoch_acc:.4f}")

    # 5. Export to ONNX
    print("[*] Exporting model to ONNX format...")
    model.eval()
    dummy_input = torch.randn(1, 3, 224, 224).to(device)
    
    torch.onnx.export(
        model.to("cpu"),
        dummy_input.to("cpu"),
        output_onnx,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"[+] FP32 ONNX model saved at: {output_onnx}")

    # 6. ONNX INT8 Quantization
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        print("[*] Applying Dynamic INT8 Quantization...")
        quantize_dynamic(
            model_input=output_onnx,
            model_output=quantized_onnx,
            weight_type=QuantType.QUInt8
        )
        print(f"[+] Quantized INT8 ONNX model saved at: {quantized_onnx}")
        # Report size reductions
        fp32_size = os.path.getsize(output_onnx) / (1024 * 1024)
        int8_size = os.path.getsize(quantized_onnx) / (1024 * 1024)
        print(f"[+] FP32 Size: {fp32_size:.2f} MB | INT8 Size: {int8_size:.2f} MB")
        print(f"[+] Compression ratio: {(1 - int8_size/fp32_size)*100:.1f}% reduction!")
    except Exception as e:
        print(f"[!] Quantization failed or skipped: {e}")

def generate_synthetic_data(data_dir: str) -> Tuple[List[str], List[int]]:
    """Generates synthetic image and JSON pairs to test the compilation script."""
    image_paths = []
    label_indices = []
    
    for idx, label in enumerate(LABELS):
        # Create a mock image
        img = Image.fromarray(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))
        img_path = os.path.join(data_dir, f"synth_{label}.jpg")
        img.save(img_path)
        
        # Create corresponding JSON metadata
        json_data = {
            "is_pollution": True,
            "category": label,
            "confidence": 0.95,
            "reason": f"Synthetic generator sample for {label}."
        }
        json_path = os.path.join(data_dir, f"synth_{label}.json")
        with open(json_path, 'w') as f:
            json.dump(json_data, f)
            
        image_paths.append(img_path)
        label_indices.append(idx)
        
    return image_paths, label_indices

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EcoView Student Model Distillation Trainer")
    parser.add_argument("--data_dir", default="data/flywheel", help="Path to teacher labeled data")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=4, help="Batch size")
    parser.add_argument("--output_onnx", default="student_model.onnx", help="Output path for FP32 ONNX model")
    parser.add_argument("--quantized_onnx", default="student_model_quantized.onnx", help="Output path for INT8 quantized ONNX model")
    
    args = parser.parse_args()
    
    # Resolve relative paths relative to this script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    
    data_path = os.path.join(project_dir, args.data_dir)
    output_onnx_path = os.path.join(project_dir, args.output_onnx)
    quantized_onnx_path = os.path.join(project_dir, args.quantized_onnx)
    
    train_and_export(data_path, args.epochs, args.batch_size, output_onnx_path, quantized_onnx_path)
