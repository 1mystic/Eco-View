# EcoView: A Full-Day ML Teaching Guide

**Audience:** Someone who knows basic statistics and has heard of ML, but hasn't built or deployed a real model.  
**Duration:** 6–7 hours, using EcoView as the running example throughout.  
**Goal:** By the end, the intern understands not just what we built, but *why* — the math, the trade-offs, the alternatives, and how everything connects to the modern AI landscape.

---

## Schedule

| Time | Module | Topic |
|---|---|---|
| 09:00–10:00 | 1 | The problem, the data, and the real-world ML loop |
| 10:00–11:15 | 2 | Deep learning fundamentals — the math behind why it works |
| 11:15–12:15 | 3 | Training in practice — memory, precision, and stability |
| 12:15–13:00 | *Lunch* | |
| 13:00–14:15 | 4 | Knowledge distillation — teaching a small model using a big one |
| 14:15–15:15 | 5 | ONNX, quantization, and the path to production |
| 15:15–16:30 | 6 | LLMs, VLMs, and the modern AI stack |
| 16:30–17:00 | 7 | Architecture decisions — why we built EcoView this way |

---

## Module 1: The Problem, the Data, and the Real-World ML Loop

### 1.1 What problem are we solving?

EcoView lets citizens photograph pollution — a plastic pile, an open drain, industrial smoke. When someone submits a photo, we need to automatically classify what type of pollution it is and assess severity, so it can be routed to the right authorities without a human reviewing every single report.

This is a **classification** problem: given an input image, output one of N labels. Specifically, we classify waste into 6 categories: `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`.

Why classification and not something else?
- **Regression** outputs a continuous number (temperature, price). Not applicable here.
- **Object detection** (YOLO, DETR) finds bounding boxes. Useful if we need "where is the waste in the image" — but for routing and severity scoring, the category alone is sufficient.
- **Segmentation** labels every pixel. Total overkill for our use case.
- **Generation** (diffusion, GPT) creates new content. Not what we need.

Always start by asking: *what is the minimum output that solves the business problem?* Classification is it.

### 1.2 The dataset: TrashNet

We use [TrashNet](https://www.kaggle.com/datasets/fedesoriano/trashnet) — 2,527 photographs of single waste items against a plain white background.

**Class distribution:**
```
plastic    ~500 images  (most)
paper      ~500
glass      ~500
cardboard  ~400
metal      ~400
trash      ~137         (least — "mixed/other")
```

This is a **class imbalance**: we have 3.6× more plastic images than trash. In practice this means:
- The model sees plastic more during training, so it learns plastic better
- A naive model could achieve ~20% accuracy just by always predicting "plastic"
- Evaluation: **per-class accuracy** matters more than overall accuracy

How did we handle it? We relied on **data augmentation** (more varied views of minority classes — same image, different crop and color) and **early stopping** (stop before the model starts memorizing the majority class). We didn't use class weights or oversampling here because the imbalance is modest. With a more severe imbalance (10:1 or worse) you'd want `WeightedRandomSampler` or class-weighted loss.

### 1.3 Data organization and the train/val split

The first rule of machine learning: **you cannot evaluate a model on data it trained on**. If you do, you'll think it's great and be surprised when it fails in the real world. This is called *data leakage*.

We split 80% for training, 20% for validation:
```python
cut = int(len(paths) * (1 - 0.2))  # 80% train
train_samples = paths[:cut]
val_samples   = paths[cut:]
```

**What we used** — a simple per-class random split.  
**What's better** — `StratifiedShuffleSplit` from sklearn, which guarantees the same class ratios in both splits. For a small, imbalanced dataset, this matters.  
**Why we skipped it** — pragmatic: with 2,500 images, random shuffle is close enough, and the notebook stays self-contained without sklearn.

**No test set?** Strictly speaking, you should have three splits: train (learn from), val (tune hyperparameters), test (final unbiased evaluation, never touched during development). We treat the val set as our test set here because:
- We're not grid-searching many hyperparameters
- The Kaggle environment gives us confidence the model generalizes (clean data, held-out class structure)

In production, you'd never release without a proper hold-out test set.

### 1.4 The real-world ML loop

ML projects don't follow a linear path. The real loop looks like:

```
Define problem
     ↓
Collect/clean data  ←─────────────────────┐
     ↓                                    │
Build baseline (simple model)             │
     ↓                                    │
Evaluate: is performance good enough?     │
     ↓ NO                                 │
Diagnose:                                 │
  High bias (underfit) → bigger model, more features, less regularization
  High variance (overfit) → more data, stronger augmentation, regularization ─┘
     ↓ YES
Ship, monitor, retrain when distribution shifts
```

In EcoView we went through this:
1. Baseline: just ConvNeXt fine-tuned directly (teacher training)
2. Found: accuracy was good but model too big for a free CPU server
3. Tried knowledge distillation to compress it
4. Found: student fit the latency target, accuracy acceptable
5. Deployed; added Gemini fallback for low-confidence cases

---

## Module 2: Deep Learning Fundamentals

### 2.1 Images as tensors

A digital image is just a 3D array of numbers. A 224×224 color image is shape `(224, 224, 3)` — 224 rows, 224 columns, 3 channels (red, green, blue). Each value is 0–255 (uint8).

After normalization (subtract mean, divide by std), values become roughly in [-2, 2]. We use ImageNet mean/std because both teacher and student started with ImageNet-pretrained weights:
```
mean = [0.485, 0.456, 0.406]   # per-channel mean of 14M ImageNet images
std  = [0.229, 0.224, 0.225]
normalized = (pixel/255 - mean) / std
```

This keeps the input in the same range the pretrained model was trained on. Using random or wrong normalization would require much more data to converge.

### 2.2 Why deep learning beats classical CV here

Before deep learning, image classification used hand-engineered features:
- HOG (Histogram of Oriented Gradients): count edge directions in cells
- SIFT (Scale-Invariant Feature Transform): keypoint descriptors
- Color histograms

These work for rigid, well-defined objects. They fail when:
- The object is crumpled, partially hidden, or in an unusual orientation
- Lighting varies strongly
- You need to distinguish subtle texture differences (metal vs plastic sheen)

A CNN learns its own feature detectors from data. The key insight: **features useful for classification emerge automatically from the training signal**. You don't have to specify "look for cylindrical shapes with metallic reflections" — the gradient descent figures it out.

### 2.3 The convolution operation

A convolution layer slides a small filter (kernel) over the input image, computing a dot product at each position.

Example: a 3×3 filter for detecting vertical edges:
```
Filter:     Input patch:      Output value:
[-1, 0, 1]  [100, 100, 200]
[-2, 0, 2]  [100, 100, 200]   sum of elementwise products
[-1, 0, 1]  [100, 100, 200]   = high value (strong vertical edge)
```

**Parameters:**
- `F`: filter size (3×3, 5×5, 7×7)
- `C_in`: input channels
- `C_out`: number of filters (= output channels)
- Total parameters in one conv layer: `F × F × C_in × C_out`

**Output spatial size:** `(W - F + 2P) / S + 1` where W = input width, P = padding, S = stride.

In deep nets, the filters are not hand-crafted — they start random and are learned via backpropagation. Early layers learn low-level patterns (edges, colors), later layers combine those into higher-level concepts.

**Parameter sharing**: every spatial location uses the same filter. This is why CNNs are efficient — a filter for detecting "vertical edge" works everywhere in the image.

### 2.4 Why ConvNeXt Base as teacher

ConvNeXt (2022) took a standard ResNet-50 and systematically modernized it by borrowing ideas from Vision Transformers, without adding attention:
- Larger kernels: 7×7 instead of 3×3 (bigger receptive field)
- Depthwise convolution: fewer params, similar quality
- Fewer activations: only one per block, GELU instead of ReLU
- LayerNorm instead of BatchNorm

The result is a CNN that matches ViT-B accuracy on ImageNet, at faster inference speed on smaller datasets. We chose it because:
- `timm` provides weights pretrained on ImageNet-22k (14M images) — richer than ImageNet-1k
- Excellent transfer learning: 6-class waste classification is close enough to ImageNet objects
- State-of-the-art accuracy is what we want in the teacher, so the student learns the best possible representations

### 2.5 Why MobileNetV3 Large as student

MobileNetV3 (2019, Howard et al.) was designed for mobile deployment. Its key innovations:

**Depthwise separable convolution:**
Standard conv: `F×F × C_in × C_out` parameters  
Depthwise: `F×F × C_in` (one filter per channel)  
Pointwise (1×1): `C_in × C_out` (mix channels)  
Total: `F×F × C_in + C_in × C_out`

Concrete numbers: 3×3 conv, 256 in → 256 out  
Standard: 9 × 256 × 256 = **589,824** params  
Depthwise+pointwise: 9×256 + 256×256 = **67,840** params → **8.7× fewer**

**Inverted residuals**: expand channels → depthwise → project. The "inverted" means wide in the middle (unlike standard bottleneck which is narrow in the middle).

**Squeeze-and-Excitation (SE):** A small sub-network that learns "which channels are important for this input" and scales them. Essentially learned channel attention, cheap but effective.

**Why not EfficientNet?** We considered it. EfficientNet-Lite would give similar results. We chose MobileNetV3 because:
- `timm` pretrained weights are high quality
- Well-tested with onnxruntime for CPU inference
- Marginally simpler graph structure for ONNX export

**Why not a tiny model (SqueezeNet, MobileNetV1)?** Those are older and less accurate. The student's job is to get as close to the teacher as possible — using a weak student wastes the distillation advantage.

### 2.6 Transfer learning: why pretrained weights work

Both teacher and student start with ImageNet weights, not random initialization. This works because neural networks learn **universal visual features**:
- Layer 1: Gabor-like edge detectors (same in trained nets and visual cortex)
- Layer 2: color patches, curved edges
- Layer 3+: textures, parts
- Deep layers: semantic concepts

When you fine-tune on waste classification, you're telling the network: "you already know about edges, textures, and shapes — now learn to combine those to distinguish cardboard from plastic." Starting from scratch would require 10× more data.

The general principle: **pretraining on large diverse data + fine-tuning on small specific data** is the dominant paradigm in modern ML. It applies to images (ImageNet pretraining), text (LLM pretraining), audio (Wav2Vec pretraining), and mixed modalities.

---

## Module 3: Training in Practice

### 3.1 The training loop (conceptually)

```
for each epoch:
    for each batch of images:
        1. Forward pass: compute predictions
        2. Compute loss: how wrong are we?
        3. Backward pass: compute gradients (how does each weight affect the loss?)
        4. Update weights: move weights in the direction that reduces loss
    evaluate on validation set
    save if improved
```

This is **stochastic gradient descent** at a high level. "Stochastic" because we use a random mini-batch rather than the full dataset (full-batch gradient descent is too slow and has worse generalization).

### 3.2 Cross-entropy loss (the math)

For a 6-class problem, the model outputs a vector of 6 raw scores (logits). We convert to probabilities with **softmax**:

```
softmax(x)_i = exp(x_i) / Σ exp(x_j)
```

Then cross-entropy loss:
```
L = -log(p_correct_class)
```

Example: true class is "plastic" (index 4).
- If model predicts p_plastic = 0.9: loss = -log(0.9) = 0.105 (low, good)
- If model predicts p_plastic = 0.1: loss = -log(0.1) = 2.303 (high, bad)

The gradient of this loss pushes the model to increase `p_correct_class` and decrease the others. The softmax structure ensures all probabilities sum to 1.

**Label smoothing (ε = 0.1):**  
Instead of target `[0, 0, 0, 0, 1, 0]`, use `[0.02, 0.02, 0.02, 0.02, 0.9, 0.02]`.

Formula: `smooth_target = (1 - ε) × one_hot + ε / K`  
With ε=0.1, K=6: `smooth_target_wrong = 0.1/6 ≈ 0.017`, `smooth_target_correct = 0.9 + 0.017 = 0.917`

Why this helps:
- Prevents the model from becoming overconfident (predicting 0.999 when it should be 0.9)
- Acts as regularization — the model can never fully "satisfy" the loss
- Especially useful when labels might have noise (a photo labeled "plastic" might contain cardboard too)

We use label smoothing only for the teacher (which has the harder job of learning from scratch). The student uses plain CE on top of the distillation loss.

### 3.3 AdamW: the optimizer

**Gradient descent** in its simplest form:
```
θ ← θ - α × ∇L(θ)
```
where α is the learning rate. Problem: the gradient for some parameters may be very noisy (high variance), requiring small α that slows all parameters down.

**Adam** (Adaptive Moment Estimation):
```
m ← β₁ × m + (1 - β₁) × g        # running mean of gradients
v ← β₂ × v + (1 - β₂) × g²       # running mean of squared gradients
θ ← θ - α × m̂ / (√v̂ + ε)        # adaptive update (m̂, v̂ = bias-corrected)
```
Default: β₁=0.9, β₂=0.999. Parameters with high gradient variance get smaller effective LR (√v is large), parameters with stable gradients get larger effective LR.

**The problem with Adam + L2 regularization:**  
L2 reg adds `λ||θ||²` to the loss, which puts `λθ` into the gradient. In Adam, this regularization term goes through the adaptive scaling, which decouples the regularization effect from the weight magnitude — it doesn't actually constrain large weights the way you'd expect.

**AdamW** (Loshchilov & Hutter, 2018):  
Apply weight decay directly to the weights, not through the gradient:
```
θ ← θ × (1 - α × λ) - α × m̂ / (√v̂ + ε)
```
This decouples regularization from the adaptive mechanism and produces better generalization. Every modern LLM trainer uses AdamW.

**CosineAnnealingLR:**  
```
LR(t) = η_min + ½(η_max - η_min)(1 + cos(π × t / T_max))
```
The LR smoothly decreases from η_max to η_min following a cosine curve. Benefits:
- No abrupt drops (unlike step decay: lr × 0.1 at epoch 10)
- The gradual decrease helps the optimizer settle into a flat minimum (better generalization)
- Warm restarts variant: restart from η_max periodically — helps escape sharp local minima

### 3.4 The GPU memory problem (why BATCH_SIZE=16)

Every tensor in the forward pass lives in GPU VRAM. For ConvNeXt Base:

| Component | Size |
|---|---|
| Model weights | ~89M × 4 bytes = 356 MB |
| Optimizer state (Adam: m + v) | 2 × 356 MB = 712 MB |
| Activations (batch=64) | ~12 GB |
| **Total** | ~13+ GB — exceeds T4's 14.56 GB |

Activations are the tensors from each layer during the forward pass. They must be kept alive until the backward pass computes gradients through them. The formula is roughly:

```
activation_memory ≈ batch_size × feature_map_sizes_across_all_layers
```

For deep models with many layers and large feature maps, activations dominate.

**Solutions:**
1. **Reduce batch size** (16 → activations ≈ 3 GB): simplest fix, slightly noisier gradients
2. **Gradient checkpointing**: re-compute activations during backward instead of storing them. Halves memory, 20-30% slower.
3. **AMP** (what we used): FP16 activations use half the memory

We used both 1 and 3. With BATCH_SIZE=16 + AMP, the teacher training uses ~4 GB peak VRAM — comfortable on T4.

### 3.5 Automatic Mixed Precision (AMP)

FP32 (single precision): 4 bytes per value, range ±3.4×10³⁸  
FP16 (half precision): 2 bytes per value, range ±65,504

In AMP:
- Model **weights**: kept in FP32 (precision matters for convergence)
- **Forward pass**: computed in FP16 (faster tensor cores, half the activation memory)
- **Backward pass**: gradients computed in FP32 (avoids precision loss in gradient accumulation)

**The GradScaler problem:** FP16 underflows for small values (anything below ~6×10⁻⁵ becomes exactly 0). Small gradients — which are common, especially early in training — would vanish.

**GradScaler solution:**
```python
scaler = torch.amp.GradScaler('cuda')

# Each batch:
with torch.amp.autocast('cuda'):
    loss = model(inputs)          # computed in FP16

scaler.scale(loss).backward()     # scale up loss before backward
scaler.step(optimizer)            # unscale gradients, skip step if NaN/Inf detected
scaler.update()                   # adjust scale factor for next iteration
```

The scale factor starts large (~65536) and halves whenever an Inf/NaN gradient is detected, and slowly grows back when training is stable. This keeps gradients in FP16's representable range without you having to tune anything.

---

## Module 4: Knowledge Distillation

### 4.1 The core insight (Hinton, Vinyals, Dean — 2015)

When you train on hard one-hot labels, the model only learns "plastic is plastic." But a trained teacher model knows more:

```
Hard label for "plastic bag":   [0,    0,    0,    0,    1,    0   ]
                                  card  glass metal paper plastic trash

Teacher soft output (T=1):      [0.01, 0.06, 0.02, 0.03, 0.84, 0.04]
```

The teacher is telling you: "this looks a bit like glass (0.06) and a bit like trash (0.04), much less like cardboard (0.01)." This inter-class similarity information is *completely lost* in the hard label.

A student trained on these soft labels learns the underlying structure of the feature space — which classes look alike, which are truly different. This is the key reason distillation works beyond just "using more labels."

### 4.2 Temperature scaling

Raw logits before softmax might be: `[0.1, 1.2, 0.3, 0.5, 4.8, 0.7]` (plastic dominant).

Softmax at T=1: `[0.01, 0.03, 0.01, 0.02, 0.86, 0.02]` — very peaked, little information in the small values.

Softmax at T=4 (divide logits by T before softmax):
```
logits/4 = [0.025, 0.3, 0.075, 0.125, 1.2, 0.175]
softmax  = [0.06,  0.08, 0.06,  0.07,  0.46, 0.07]
```

Now the distribution is much softer. The student can actually learn something from the ratio between glass (0.08) and cardboard (0.06). At T=1, both were essentially 0.

Why T=4 specifically? It's empirically the sweet spot for most classification distillation tasks. Too low (T→1): same as hard labels, no benefit. Too high (T→∞): uniform distribution, no class signal.

### 4.3 KL Divergence (the math)

KL divergence measures how different one probability distribution is from another:

```
KL(P || Q) = Σᵢ P(i) × log(P(i) / Q(i))
```

- P = teacher's soft distribution (what we want the student to match)
- Q = student's soft distribution (what the student currently predicts)
- KL ≥ 0 always, equals 0 iff P = Q exactly
- Asymmetric: KL(P||Q) ≠ KL(Q||P). We use teacher as P (the "truth" we're approximating).

In code: `F.kl_div(log_softmax(student/T), softmax(teacher/T), reduction='batchmean')`

Why `log_softmax` for student? PyTorch's `kl_div` expects log-probabilities for the first argument (numerically stable).

### 4.4 The distillation loss formula

```
L_total = (1 - α) × CE(student_logits, true_labels)
        + α × T² × KL(softmax(student/T) || softmax(teacher/T))
```

**Why T²?**  
When you scale logits by 1/T before softmax, the softmax function's gradient gets scaled by 1/T as well. So gradients from the KL term are T× smaller than they should be. Multiplying the loss by T² compensates for this, keeping the KL gradients at the same scale as the CE gradients regardless of T.

**α = 0.3:**  
30% of the learning signal comes from teacher guidance, 70% from ground truth labels. This ratio works well empirically because:
- Too high α: the student learns to mimic teacher mistakes
- Too low α: distillation benefit is negligible
- Values 0.3–0.5 consistently work across tasks

**Our result:** Student at ~91% accuracy vs teacher at ~95% — 4 pp gap for 21× compression. That's a good trade-off in practice.

### 4.5 Alternative compression approaches

| Method | How it works | Trade-offs vs KD |
|---|---|---|
| **Pruning** | Zero out weights below a magnitude threshold | Hard to speed up on real hardware (sparse ops are slow unless structured). Structured pruning (whole channels) speeds up inference but hurts accuracy more. |
| **Quantization-aware training (QAT)** | Simulate INT8 rounding during training | Better accuracy than post-training quantization, but more complex setup. KD + post-training quantization is simpler and close in accuracy. |
| **Neural Architecture Search (NAS)** | Let an algorithm find the optimal small architecture | Extremely expensive (EfficientNet took ~450 TPU-hours to find). EfficientNet and MobileNetV3 were found via NAS — so we get the results for free by using them. |
| **Low-rank factorization** | W ≈ AB, rank(AB) << rank(W) | Works well for transformer attention layers (LoRA). Less applicable to conv layers. |
| **Smaller architecture from scratch** | Just train a small model directly | Often underperforms KD because the small model lacks the "knowledge" the teacher accumulated. |

KD is the right choice here because:
- We already have a strong teacher
- We need deployment-ready accuracy, not just theoretical compression
- Simple to implement and reason about

---

## Module 5: ONNX, Quantization, and the Path to Production

### 5.1 Why not just ship the PyTorch model?

A PyTorch model requires:
- PyTorch runtime: ~1.5 GB on disk + startup
- Python interpreter
- Specific GPU drivers if using CUDA

ONNX (Open Neural Network Exchange) is a standard graph format:
- Runtime-agnostic: onnxruntime (CPU/GPU), TensorRT (NVIDIA), CoreML (Apple), WebNN (browser)
- Smaller runtime: onnxruntime is ~50 MB vs PyTorch's ~1.5 GB
- Potentially faster: graph-level optimizations that PyTorch doesn't do at Python level
- Works anywhere: C++, Java, C#, JavaScript

Think of ONNX like a PDF: both Word and Pages can save to PDF, and any PDF reader can open it. ONNX is the PDF of neural networks.

### 5.2 TorchScript vs Dynamo exporter

**TorchScript (what we use, `dynamo=False`):**
- Traces or scripts the model's Python execution into a static graph
- Stable, well-tested, works reliably with timm models
- Requires `export_params=True` to bake weights into the graph

**Dynamo-based exporter (PyTorch 2.x default):**
- Analyzes Python bytecode to understand the computation
- More powerful — handles dynamic control flow better
- Requires `onnxscript` package; newer and less stable
- On Windows, its success message prints a ✅ emoji that crashes cp1252 terminals

We hit both issues (missing onnxscript, terminal crash) during development. `dynamo=False` takes 2 seconds vs 30 seconds with dynamo, and produces an identical model. Always default to the stable path unless you need dynamo's specific capabilities.

### 5.3 onnxsim: graph simplification

After export, the raw ONNX graph has redundant operations that existed for Python-level reasons but aren't needed in the static graph. onnxsim runs several passes:

- **Constant folding**: if both inputs to an Add node are constants, compute the result once and replace the node with a Constant
- **Dead code elimination**: remove nodes whose outputs are never used
- **Node fusion**: Conv + BatchNorm + ReLU can often be merged into a single fused op (e.g., in onnxruntime's graph optimizer)
- **Shape inference**: compute tensor shapes statically, enables further optimizations

Result: ~150 ops → ~100 ops. The model is functionally identical but smaller and faster.

### 5.4 INT8 dynamic quantization (the math)

A float32 weight is 4 bytes. We want to represent it as int8 (1 byte), covering [-128, 127].

**Quantization formula:**
```
x_int8 = round(x_float32 / scale) + zero_point
scale   = (x_max - x_min) / 255
```

**Dequantization (at inference time):**
```
x_approx = (x_int8 - zero_point) × scale
```

The approximation error (quantization noise) is ±0.5 × scale. For weights that span a small range, this error is tiny. For weights that span a large range, there's more loss — but well-trained models have relatively bounded weight distributions.

**Dynamic vs static quantization:**

| | Dynamic | Static |
|---|---|---|
| What's quantized | Weights only | Weights + activations |
| Calibration needed | No | Yes (run sample data through) |
| Speed gain | Moderate (~1.4×) | High (~2-4×) |
| Accuracy loss | Very small (<0.5%) | Small (<1%) |
| Implementation | `quantize_dynamic(model)` | Multi-step calibration |

We used dynamic because:
- Activations are small (224×224 input, 6 output classes) — not a memory bottleneck
- No calibration data management
- Sufficient speed gain for our 55ms target

**Observed result:** 16 MB FP32 → 4.4 MB INT8, 74% reduction.

### 5.5 The full inference path in production

```
HTTP POST /inference/classify { image_base64: "data:image/jpeg;base64,..." }
  │
  ▼
1. Decode base64 → bytes → PIL Image
2. Resize to 256×256 → CenterCrop to 224×224
3. Normalize with ImageNet mean/std
4. np.expand_dims → shape (1, 3, 224, 224), dtype float32
  │
  ▼
5. ort.InferenceSession.run(None, {'input': tensor})
     → shape (1, 6) logits
  │
  ▼
6. softmax → probabilities
7. argmax → class index
8. LABELS[class_index] → "plastic"
  │
  ▼
9. confidence ≥ 0.85?
   YES → return result
   NO  → escalate to Gemini VLM (see Module 6)
```

The `ONNXStudentClassifier` class encapsulates all of this. It loads the model once at startup (30ms) and runs inference per request (55ms). Stateless design means the FastAPI app scales horizontally — multiple workers, each with their own loaded session, handling requests in parallel.

---

## Module 6: LLMs, VLMs, and the Modern AI Stack

### 6.1 What is a language model?

A language model learns the probability distribution: P(next word | all previous words).

"The Eiffel Tower is in ___" — a language model trained on Wikipedia assigns high probability to "Paris" and low probability to "cardboard."

This sounds simple, but training on 1 trillion tokens of internet text produces something surprising: the model learns to *reason* about the world implicitly through its learned statistical structure. That's the core of GPT, Claude, Gemini, etc.

At inference: you sample tokens one by one from P(next | previous), producing coherent text.

### 6.2 The Transformer architecture

Before Transformers (2017), language models used RNNs/LSTMs. They processed tokens sequentially, accumulating a "hidden state" that was supposed to carry all relevant context. Problem: long-range dependencies get lost (the hidden state gets overwritten by recent tokens).

Transformers replaced this with **attention**:

```
Attention(Q, K, V) = softmax(Q × Kᵀ / √d_k) × V
```

- Q (Query): "what am I looking for?"
- K (Key): "what does each token offer?"
- V (Value): "what information does each token contain?"

`Q × Kᵀ` produces a matrix of similarity scores between all pairs of tokens. Softmax normalizes these into attention weights (how much to "attend" to each token). The output is a weighted sum of values.

**Intuition:** When processing the word "it" in "The cat ate the fish because it was hungry," the attention mechanism can look back at both "cat" and "fish" and learn that "it" refers to "cat" (by seeing similar patterns in training data about subjects being hungry).

**Multi-head attention:** Run this process H times in parallel with different learned projections. Each head can specialize — one might capture syntactic structure, another semantic relationships.

**Why better than RNNs?**
1. Parallel: all tokens processed simultaneously (vs sequential in RNNs)
2. Direct long-range connections: "it" can directly attend to "cat" 20 tokens back
3. Scales better: more parameters → better, predictably

**The O(n²) problem:** Self-attention scales quadratically with sequence length (every token attends to every other token). For long documents (thousands of tokens), this becomes slow. Much of current research is on making attention more efficient (sparse attention, linear attention, Mamba/SSMs).

### 6.3 Vision Language Models (VLMs)

VLMs extend LLMs to understand images. The key innovation: treat image patches as tokens alongside text tokens.

**CLIP (Contrastive Language-Image Pretraining, OpenAI 2021):**
- Train an image encoder and text encoder together on 400M (image, caption) pairs
- Loss: maximize cosine similarity between matched image-text pairs, minimize for mismatched
- Result: both encoders produce representations in the same space — you can compare images and text directly

**Gemini / GPT-4V architecture:**
- Divide image into 14×14 = 196 patches (for 224×224 input)
- Each patch → embedding via a vision encoder
- Concatenate patch embeddings with text token embeddings
- Full transformer processes everything together
- Pretrained on billions of (image, text) pairs from the web

This is why Gemini can zero-shot classify photos: it has seen millions of photos of trash, pollution, waste on the internet during pretraining.

### 6.4 How EcoView uses Gemini Flash-Lite

```python
# Structured output prompt
prompt = """Is this image showing environmental pollution or waste?
Classify into exactly one of: garbage_dump | plastic_waste | industrial_smoke |
water_contamination | deforestation | oil_spill | none.
Respond as JSON matching the schema."""

# API call with JSON schema enforcement
response = client.generate_content(
    contents=[prompt + base64_image],
    generation_config=GenerationConfig(
        response_mime_type="application/json",
        response_schema={
            "is_pollution": bool,
            "category": str,  # one of the above
            "confidence": float,
            "reason": str
        }
    )
)
```

`response_mime_type: "application/json"` forces the model to produce syntactically valid JSON. The `response_schema` further constrains the output to exactly the fields and types we need.

This is **zero-shot structured output** — no examples given, no fine-tuning, just a description of what we want. It works because:
- Gemini was pretrained on enormous amounts of JSON
- It has seen many examples of classification tasks described in natural language
- The schema provides enough constraint to avoid hallucination of field names

**Economics:** Gemini 1.5 Flash-Lite is Gemini's most efficient model — 1,500 requests/day free on Google AI Studio. For a civic reporting platform with a few dozen daily reports, this is more than enough.

### 6.5 The dual-mode inference architecture

```
ONNX student model
  ├── Fast (55ms), free, no API calls
  ├── Handles easy cases confidently
  └── confidence ≥ 0.85 → return result ──────────────────────┐
                                                                │
  confidence < 0.85 → escalate to Gemini VLM                  │
       ├── Slower (~1s), uses API quota                        │
       ├── Better on unusual/ambiguous inputs                   │
       └── confidence ≥ 0.85 → log to flywheel ───────────────┘
                                                        │
                                               Return result to user
```

This cascade pattern is used in production systems broadly. Vercel's AI SDK calls it "AI routing." You can have:
- Tier 1: small local model (fast, free)
- Tier 2: medium cloud API (slower, cheap)
- Tier 3: large cloud API (slowest, expensive) — only when truly needed

For EcoView, ~70% of classifications should be handled by ONNX (unambiguous plastic bags, clear cardboard boxes). The remaining 30% escalate to Gemini.

### 6.6 The data flywheel

When Gemini classifies with confidence ≥ 0.85, we save the image + label to `data/flywheel/`. Over time:
- Month 1: 500 flywheel samples (all Gemini-classified)
- Month 6: 3,000 samples — enough to retrain the student
- Month 12: 8,000 samples — student trained on real in-distribution data, accuracy improves

This is how production ML systems improve without manual labeling. The teacher (Gemini) labels data for the student (ONNX), the student gets better, needs fewer escalations, and the system becomes cheaper to operate. This is called a **data flywheel** or **teacher-student self-training loop**.

### 6.7 The broader modern AI landscape

**PEFT and LoRA:**  
Fine-tuning a 7B-parameter LLM updates all 7B params — expensive. Low-Rank Adaptation (LoRA) adds small trainable matrices A and B to each attention layer:
```
W_new = W_pretrained + A × B    (A ∈ R^{d×r}, B ∈ R^{r×k}, r=8)
```
Instead of 7B params, you train only ~10M. After training, you can merge the LoRA weights into W_pretrained (zero inference overhead) or keep them separate (easy to swap styles/tasks).

**RAG (Retrieval-Augmented Generation):**  
LLMs have a knowledge cutoff and can't access private data. RAG solves this:
1. Embed documents (reports, knowledge base) as vectors
2. At query time, retrieve the K most similar documents
3. Inject them into the LLM's context as additional information
4. LLM generates an answer grounded in retrieved facts

**Agents:**  
LLMs that can use tools: web search, code execution, function calling. The model decides when to call a tool, processes the result, and continues generating. GPT-4 function calling, Claude's tool use, Gemini function calling all implement this pattern.

**Diffusion models:**  
Image generation works by learning to reverse a Markov process that progressively adds Gaussian noise. Given a noisy image at timestep t, the model predicts the noise component:
```
x_{t-1} = (x_t - ε_θ(x_t, t)) / √ᾱ + √(1-ᾱ)ε
```
By iteratively denoising, you go from pure noise to a realistic image. Stable Diffusion, DALL-E 3, and Midjourney all use variants of this.

**State Space Models (Mamba):**  
An alternative to attention with O(n) complexity:
```
h_t = A × h_{t-1} + B × x_t    (state update)
y_t = C × h_t                   (output)
```
Structured State Spaces make this efficient with selective state updates. Performance comparable to Transformers on many tasks, dramatically faster for long sequences. Still early but watched closely.

---

## Module 7: Architecture Decisions — Why We Built EcoView This Way

### 7.1 The zero-cost constraint

The guiding constraint for EcoView: **$0/month**. This single decision drove most architecture choices.

| Decision | Reason | What we'd do with money |
|---|---|---|
| Firestore instead of PostgreSQL | Firestore is free, no server to manage | PostgreSQL on Cloud Run or RDS, proper relational queries |
| HF CPU Space instead of GPU | GPU spaces cost money | GPU T4 instance, 10ms inference vs 55ms |
| base64 in Firestore instead of Firebase Storage | Storage requires Blaze (paid) plan | Firebase Storage, proper CDN-delivered images |
| Gemini Flash-Lite instead of GPT-4V | Free tier 1500/day | GPT-4V for better accuracy on edge cases |
| Vercel instead of custom server | Free tier handles the SPA | CloudFront + S3 or Cloudflare Pages |

### 7.2 Why Firestore causes problems (and how we solve them)

Firestore is a NoSQL document database. Every Firestore document is essentially a JSON object. The query capabilities are limited compared to SQL:

**Problem 1: Composite index requirement**  
`WHERE status = 'pending' ORDER BY created_at DESC` requires a composite index in Firestore (must be created manually in Firebase Console). We got "failed to load campaigns" in production because of this.

**Solution:** Drop `orderBy` from the Firestore query, fetch all matching docs, sort client-side:
```js
const docs = await getDocs(query(collection(db, 'campaigns'), where('status', '==', 'active')))
const sorted = docs.sort((a, b) => b.created_at - a.created_at)  // client-side sort
```
Trade-off: inefficient for large collections (you fetch more than you need), but fine for civic reporting scale (~hundreds of campaigns, not millions).

**Problem 2: No aggregate queries**  
SQL: `SELECT COUNT(*) WHERE status = 'pending'` is one query.  
Firestore: you must fetch all matching docs and count them client-side (billing per read).

**Solution:** Denormalize — maintain `stats` fields at document or collection level that you increment/decrement on each write:
```js
// When creating report:
updateDoc(statsRef, { pending_count: increment(1) })
// When resolving report:
updateDoc(statsRef, { pending_count: increment(-1), resolved_count: increment(1) })
```

**Problem 3: base64 images bloat Firestore reads**  
Every incident query that loads 200 incidents also loads 200 × ~80KB = 16MB of image data. Firestore bills per byte read.

**Solution:** At some scale, move images to Firebase Storage (if on Blaze) and store only a URL in Firestore. For now, the Canvas-compressed images (~50-120KB) stay within Firestore's 1MB document limit and our free tier budget.

### 7.3 Why no traditional backend (FastAPI + PostgreSQL)

The original plan had a FastAPI backend with PostgreSQL, Redis, and Cloudflare R2. We removed it because:
- A server that runs 24/7 costs money
- DevOps complexity: deploy, monitor, scale, patch
- Firebase already handles auth, CRUD, and real-time sync — adding a proxy layer adds latency without adding value

The HuggingFace Space is not a "backend" in the traditional sense — it's a stateless inference endpoint that does only two things: ML classification and spatial analysis. It holds no data. It can go down without losing any user data (Firestore is the source of truth).

**When would you add a traditional backend?**
- When you need database transactions (Firestore has limited transaction support)
- When you need complex joins or aggregations
- When you need a job queue (background processing, scheduled tasks)
- When you need websockets (Firestore real-time listeners cover this for most cases)
- When your data model outgrows NoSQL (highly relational data)

### 7.4 Why React SPA instead of Next.js

Next.js adds server-side rendering (SSR) and static site generation (SSG). Useful for:
- SEO (search engines need to see content in the initial HTML)
- First-contentful paint on slow connections (server sends pre-rendered HTML)

EcoView doesn't need SSR because:
- The content is behind a login (search engines can't index it anyway)
- The map data loads via Firestore in real-time (can't pre-render)
- React SPA deploys as a single `dist/` folder — simpler than Next.js's Node server

If EcoView had a public landing page that needed SEO, we'd use Next.js for that page and keep the app as a client-side SPA.

### 7.5 The ML model choice: why this specific compression ratio?

We targeted: *fits in a free HuggingFace Space CPU container, <100ms latency, >88% accuracy*.

| Model candidate | Params | Expected acc | Size INT8 |
|---|---|---|---|
| SqueezeNet 1.1 | 1.2M | ~82% | ~1.2 MB |
| MobileNetV2 | 3.4M | ~88% | ~3.5 MB |
| **MobileNetV3 Large** | **4.2M** | **~91%** | **~4.4 MB** |
| EfficientNet-B0 | 5.3M | ~92% | ~5.5 MB |
| ResNet-18 | 11.7M | ~88% | ~12 MB |

MobileNetV3 Large hits our accuracy target (>88%) at the smallest acceptable size and has excellent onnxruntime support. EfficientNet-B0 would give +1% accuracy at +25% model size — a reasonable trade-off we might take in a future version.

The 21× compression (89M → 4.2M) is aggressive. Knowledge distillation enables this because the student is trained with much richer supervision than it would get from hard labels alone.

---

## Quick Reference: Key Formulas

| Concept | Formula |
|---|---|
| Softmax | σ(x)_i = exp(x_i) / Σⱼ exp(x_j) |
| Cross-entropy | L = -log(p_correct) |
| Label smoothing | p_smooth = (1-ε)×one_hot + ε/K |
| AdamW update | θ ← θ(1-αλ) - α×m̂/(√v̂+ε) |
| Cosine LR | LR(t) = η_min + ½(η_max-η_min)(1+cos(πt/T)) |
| Conv output size | (W - F + 2P)/S + 1 |
| Depthwise params | F²×C_in + C_in×C_out (vs F²×C_in×C_out) |
| Distillation loss | (1-α)CE + α×T²×KL(student_soft\|\|teacher_soft) |
| INT8 quant | x_int8 = round(x_float / scale) + zero_point |
| Attention | softmax(QKᵀ/√d_k) × V |

---

## Reading List (ordered by accessibility)

1. **"Deep Learning" Ch 6–9** (Goodfellow, Bengio, Courville) — MLPs, CNNs, optimization — the rigorous foundations
2. **"Attention Is All You Need"** (Vaswani et al., 2017) — the original Transformer paper — surprisingly readable
3. **"Distilling the Knowledge in a Neural Network"** (Hinton et al., 2015) — 8 pages, the paper behind Module 4
4. **"MobileNetV3"** (Howard et al., 2019) — how the student architecture was designed
5. **"A ConvNet for the 2020s"** (Liu et al., 2022) — the ConvNeXt paper, explains what ConvNeXt changed and why
6. **fast.ai Practical Deep Learning** — hands-on, code-first, free — good for building intuition
7. **Andrej Karpathy's "Zero to Hero"** (YouTube) — builds GPT from scratch, best transformer intuition available
8. **"The Illustrated Transformer"** (Jay Alammar, blog) — best visual explanation of attention

---

*EcoView · [github.com/1mystic/EcoView](https://github.com/1mystic/EcoView)*
