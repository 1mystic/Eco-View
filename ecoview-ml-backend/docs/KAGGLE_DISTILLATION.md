# EcoView ML Edge Distillation & Kaggle Training Guide

This guide explains how to gather training data using the automated data flywheel, run the student model distillation on Kaggle's free GPU, and deploy the optimized model back to production.

---

## 1. How the Data Flywheel Works

The EcoView ML Backend uses a **Teacher-Student architecture** to gather training data and improve edge models over time without human annotation:

```
[Report Received] ──> [Fast Student ONNX Inference] ──> [Confidence >= 85%] ──> Return Results
                                  │
                          (Confidence < 85%)
                                  ▼
                     [VLM Gemini Teacher REST API]
                                  │
                        (VLM confirms hazard)
                                  ▼
               [Logged to data/flywheel/ (Image + JSON)]
```

When an image classification has confidence < 85%, it escalates to the **Gemini 2.5 Flash VLM Teacher**. If the teacher verifies the hazard with high confidence, it writes:
- The raw image: `data/flywheel/<hash>.jpg` (or `.png`)
- The structured metadata label: `data/flywheel/<hash>.json`

This creates a continuous, self-labeled dataset ready for model retraining.

---

## 2. Preparing and Exporting the Flywheel Dataset

Once you have accumulated enough labeled images (recommended: **50+ per category**), package them for training:

1. Locate the flywheel folder at `ecoview-ml-backend/data/flywheel/`.
2. Compress the contents of this folder into a zip file:
   - On Windows: Right-click `flywheel` -> `Send to` -> `Compressed (zipped) folder` (name it `flywheel_dataset.zip`).
   - On Linux/macOS: `zip -r flywheel_dataset.zip data/flywheel/`

---

## 3. Running Distillation on Kaggle (Free GPU)

Kaggle provides free access to NVIDIA T4 and P100 GPUs, which are ideal for training the student model.

### Step 1: Create a Kaggle Dataset
1. Log in to [Kaggle](https://www.kaggle.com/).
2. Click **Create** -> **New Dataset**.
3. Drag and drop your `flywheel_dataset.zip` file, name it `ecoview-flywheel-dataset`, and click **Create**.

### Step 2: Create a Kaggle Notebook
1. Click **Create** -> **New Notebook**.
2. In the right panel under **Settings**, ensure the following:
   - **Accelerator**: Select **GPU T4 x2** or **GPU P100**.
   - **Internet on**: Enabled (required for downloading the pre-trained MobileNetV2 backbone weights).
3. Add your dataset: In the right panel, click **Add Input** -> **Your Datasets** -> select `ecoview-flywheel-dataset`.

### Step 3: Run the Training Code
Upload or paste the contents of [train_distillation.py](file:///d:/synced-pc/1_Work/projects/Ecoview/EcoView/ecoview-ml-backend/core/train_distillation.py) into a notebook cell, or run it directly.

Here is the Kaggle notebook workflow:

```python
# 1. Install necessary edge runtime & quantization dependencies
!pip install onnxruntime-quantization pillow numpy torch torchvision

# 2. Verify that the dataset has loaded correctly
import os
print("Dataset contents:", os.listdir("/kaggle/input/ecoview-flywheel-dataset"))

# 3. Create the training script file in the workspace
# (Or use the uploaded file)
```

Run the training script pointing to the Kaggle dataset mount:
```bash
!python train_distillation.py \
    --data_dir /kaggle/input/ecoview-flywheel-dataset \
    --epochs 15 \
    --batch_size 8 \
    --output_onnx student_model.onnx \
    --quantized_onnx student_model_quantized.onnx
```

### What happens during training:
- **Feature Extraction**: The script initializes a pre-trained **MobileNetV2** backbone and freezes its feature extraction layers (90% of the weights), preserving features and avoiding overfitting on small datasets.
- **Transfer Learning**: It trains a custom dropout-regularized classification head matching EcoView's 6 target environmental hazard categories.
- **ONNX Export**: The trained PyTorch model is exported to standard **ONNX Format** (FP32).
- **Dynamic INT8 Quantization**: It quantizes model weights to 8-bit integers, reducing file size by **75%** (~14MB to **~3.5MB**) and speeding up CPU inference on target server devices.

---

## 4. Deploying the Model to Production

After the training script completes:
1. In the right panel under **Output**, download the generated `student_model_quantized.onnx` file.
2. Move this file to the root of your ML backend directory:
   `ecoview-ml-backend/student_model_quantized.onnx`
3. Restart the ML microservice.

### Verification of Deployment
When the service restarts, you will see this log:
```
[+] Loaded ONNX student model from: /app/student_model_quantized.onnx
```
The classifier will now execute **real-time 8-bit quantized ONNX inference** on CPU within **5-15 milliseconds**, bypassing the simulator fallback automatically!
