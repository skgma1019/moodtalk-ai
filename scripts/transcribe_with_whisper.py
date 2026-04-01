import argparse
import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--model", default="base")
    parser.add_argument("--language", default="ko")
    parser.add_argument("--cache-dir", required=True)
    return parser.parse_args()


def main():
    args = parse_args()

    audio_path = Path(args.audio)
    cache_dir = Path(args.cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type="int8",
        download_root=str(cache_dir),
    )

    segments, info = model.transcribe(
        str(audio_path),
        language=args.language,
        beam_size=5,
        vad_filter=True,
    )

    text = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()

    payload = {
        "text": text,
        "language": getattr(info, "language", args.language),
        "language_probability": getattr(info, "language_probability", None),
        "duration": getattr(info, "duration", None),
    }

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
