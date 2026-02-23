# Dataset Schema

Expected training format is JSONL:

```json
{"instruction":"...", "input":"...", "output":"..."}
```

## Fields
- `instruction` (string, required): Task instruction.
- `input` (string, optional): Extra context/user query.
- `output` (string, required): Target answer.

## Example
```json
{"instruction":"Suggest action for cotton leaf curl symptoms", "input":"Region: Vidarbha, stage: vegetative", "output":"Inspect whitefly pressure, remove infected leaves, apply ..."}
```

## Validation Rules
- No empty `instruction` or `output`
- UTF-8 encoding
- One JSON object per line
- No PII or secrets
