import argparse
import json
from pathlib import Path


def validate_record(rec: dict) -> bool:
    return bool(str(rec.get("instruction", "")).strip()) and bool(str(rec.get("output", "")).strip())


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate and normalize finetuning JSONL dataset.")
    parser.add_argument("--input", required=True, help="Input JSONL path")
    parser.add_argument("--output", required=True, help="Output JSONL path")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    kept = 0
    skipped = 0
    with input_path.open("r", encoding="utf-8") as fin, output_path.open("w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            if not validate_record(rec):
                skipped += 1
                continue
            norm = {
                "instruction": str(rec.get("instruction", "")).strip(),
                "input": str(rec.get("input", "")).strip(),
                "output": str(rec.get("output", "")).strip(),
            }
            fout.write(json.dumps(norm, ensure_ascii=False) + "\n")
            kept += 1

    print(f"done: kept={kept} skipped={skipped} output={output_path}")


if __name__ == "__main__":
    main()
