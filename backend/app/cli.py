"""
CLI for one-off admin operations (e.g. run on Hetzner prod).

Usage:
  python -m app.cli backfill-thumbnails [--limit N] [--dry-run]

Example on prod (Docker):
  docker compose exec backend python -m app.cli backfill-thumbnails
  docker compose run --rm backend python -m app.cli backfill-thumbnails --limit 100 --dry-run
"""

from __future__ import annotations

import argparse
import sys


def _cmd_backfill_thumbnails(args: argparse.Namespace) -> int:
    from app.bootstrap import get_container

    container = get_container()
    material_service = container.provide_material_service()

    candidates = material_service.list_materials_without_thumbnail()
    total = len(candidates)
    if args.limit is not None:
        candidates = candidates[: args.limit]

    if args.dry_run:
        print(f"[DRY RUN] Would process {len(candidates)} materials (total without thumbnail: {total})")
        for owner_id, material_id in candidates:
            print(f"  owner_id={owner_id} material_id={material_id}")
        return 0

    print(f"Processing {len(candidates)} materials without thumbnail (total: {total})...")
    ok = 0
    fail = 0
    for i, (owner_id, material_id) in enumerate(candidates, 1):
        try:
            if material_service.generate_thumbnail_for_material(
                owner_id=owner_id, material_id=material_id
            ):
                ok += 1
                print(f"  [{i}/{len(candidates)}] material_id={material_id} OK")
            else:
                fail += 1
                print(f"  [{i}/{len(candidates)}] material_id={material_id} skip (unsupported or error)")
        except Exception as e:
            fail += 1
            print(f"  [{i}/{len(candidates)}] material_id={material_id} error: {e}")
    print(f"Done. Generated: {ok}, skipped/failed: {fail}")
    return 0 if fail == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="InQUIZitor backend CLI (one-off jobs, e.g. backfill thumbnails on prod)."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    backfill = subparsers.add_parser("backfill-thumbnails", help="Generate thumbnails for materials that don't have one")
    backfill.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Process at most N materials (default: all)",
    )
    backfill.add_argument(
        "--dry-run",
        action="store_true",
        help="Only list materials that would be processed",
    )
    backfill.set_defaults(func=_cmd_backfill_thumbnails)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
