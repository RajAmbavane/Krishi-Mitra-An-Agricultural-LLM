import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Basic prediction file evaluator scaffold.")
    parser.add_argument("--predictions", required=True, help="JSONL with {'prediction': ..., 'reference': ...}")
    args = parser.parse_args()

    p = Path(args.predictions)
    if not p.exists():
        raise FileNotFoundError(f"predictions file not found: {p}")

    total = 0
    exact = 0
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            pred = str(rec.get("prediction", "")).strip()
            ref = str(rec.get("reference", "")).strip()
            total += 1
            if pred == ref and pred:
                exact += 1

    score = (exact / total) if total else 0.0
    print(f"rows={total} exact_match={score:.4f}")


if __name__ == "__main__":
    main()
