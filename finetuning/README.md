# Fine-Tuning Guide

This folder contains a reproducible template for fine-tuning Krishi Mitra models.

## Structure
```text
finetuning/
|-- configs/
|   `-- train_config.example.yaml
|-- data/
|   |-- sample_dataset.jsonl
|   `-- DATASET_SCHEMA.md
|-- scripts/
|   |-- prepare_dataset.py
|   |-- train_lora.py
|   `-- evaluate.py
`-- README.md
```

## What to Commit
- Training and evaluation code
- Dataset prep scripts
- Dataset schema and sample rows
- Config files and exact commands

## What Not to Commit
- Large raw datasets
- Checkpoints / adapters / merged models
- GGUF binaries
- Secrets

## 1. Prepare Data
Input format should be JSONL with one record per line:
```json
{"instruction":"...", "input":"...", "output":"..."}
```

Run:
```bash
python finetuning/scripts/prepare_dataset.py ^
  --input finetuning/data/sample_dataset.jsonl ^
  --output finetuning/data/processed_train.jsonl
```

## 2. Train (LoRA/PEFT placeholder)
```bash
python finetuning/scripts/train_lora.py ^
  --config finetuning/configs/train_config.example.yaml
```

Replace the placeholder internals with your preferred stack (Transformers + PEFT, Axolotl, Unsloth, etc.).

## 3. Evaluate
```bash
python finetuning/scripts/evaluate.py ^
  --predictions finetuning/data/predictions.jsonl
```

## 4. Export for This Backend
The runtime backend expects one GGUF file (`LLAMA_MODEL_PATH`).
1. Merge adapter into base model.
2. Convert merged model to GGUF.
3. Quantize GGUF as needed.
4. Point `LLAMA_MODEL_PATH` to final GGUF.

## Recommended Repro Metadata
- Base model name and revision
- Dataset source links + checksums
- Prompt template used for training
- Hyperparameters (lr, epochs, batch, seq length, LoRA rank/alpha)
- Hardware (GPU/VRAM), training duration, final eval metrics
