import os
import argparse

def generate_dummy_onnx(output_path="student_model.onnx", quantized_path="student_model_quantized.onnx"):
    try:
        import torch
        import torch.nn as nn
    except ImportError:
        print("[!] PyTorch is required to run this script. Please install it, or run this script in Kaggle.")
        return

    print("[*] Generating dummy student model using PyTorch...")
    
    # Define a simple network matching our expected input (3, 224, 224) and output (6 classes)
    class DummyClassifier(nn.Module):
        def __init__(self):
            super().__init__()
            # Simulates visual feature extraction + classification head
            self.features = nn.Sequential(
                nn.Conv2d(3, 16, kernel_size=3, stride=2, padding=1), # 112x112
                nn.ReLU(),
                nn.AdaptiveAvgPool2d((1, 1))
            )
            self.classifier = nn.Linear(16, 6)
            
        def forward(self, x):
            x = self.features(x)
            x = torch.flatten(x, 1)
            x = self.classifier(x)
            return x

    model = DummyClassifier()
    model.eval()

    # Create dummy input (batch_size=1, channels=3, height=224, width=224)
    dummy_input = torch.randn(1, 3, 224, 224)
    
    # Export to ONNX
    print(f"[*] Exporting model to ONNX: {output_path}")
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    
    # Quantize the model to INT8
    print("[*] Quantizing model to INT8 precision...")
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        quantize_dynamic(
            model_input=output_path,
            model_output=quantized_path,
            weight_type=QuantType.QUInt8
        )
        print(f"[+] Successfully quantized model saved at: {quantized_path}")
    except ImportError:
        print("[!] onnxruntime-quantization package not found. Skipping INT8 quantization step.")
        print(f"[+] Saved FP32 model at: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a dummy ONNX model for testing.")
    parser.add_argument("--output", default="student_model.onnx", help="FP32 ONNX output path")
    parser.add_argument("--quantized", default="student_model_quantized.onnx", help="INT8 quantized ONNX output path")
    args = parser.parse_args()
    
    generate_dummy_onnx(args.output, args.quantized)
