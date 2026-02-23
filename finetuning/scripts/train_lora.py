import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="LoRA training entrypoint placeholder.")
    parser.add_argument("--config", required=True, help="Path to YAML config")
    args = parser.parse_args()

    cfg = Path(args.config)
    if not cfg.exists():
        raise FileNotFoundError(f"config not found: {cfg}")

    print("train_lora.py placeholder")
    print(f"config: {cfg}")
    print("Implement training with your chosen stack (Transformers/PEFT or equivalent).")
    print("Expected output: adapter/checkpoint in finetuning/checkpoints/")


if __name__ == "__main__":
    main()
