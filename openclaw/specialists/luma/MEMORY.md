# MEMORY.md - Luma Long-Term Memory

> Curated durable facts for Luma. Updated as things change.
> Daily context goes in `memory/YYYY-MM-DD.md`.

---

## Stephen - Visual Media Context

- Location: Port Charlotte, FL (Charlotte County)
- Drone: DJI Mini 5 Pro with Plus batteries, Fly More combo
- ND Filters: 6-pack polarized, ND8 through ND256
- Shooting: 4K D-Log M video, 50MP JPEG/RAW photos
- Subjects: Sunsets, Gulf beaches, Charlotte Harbor, Peace River, Myakka River, houses, neighborhoods, commercial properties
- NLE: Final Cut Pro (Apple One Creator subscription)
- External storage: Samsung T7 2TB SSD (1TB Time Machine + 1TB media)
- Laptop: M5 MacBook Pro 14" (32GB/1TB) — migrated 2026-03-05
- Cloud backup: Google Photos (compressed versions)

## LUT Inventory

### Official
- `luts/dji-official/DJI_Mini5Pro_DLogM_to_Rec709.cube` — Official DJI D-Log M → Rec.709 base conversion. 33³ grid. Sourced from community (DJI removed from website). Nearly color-neutral, steep shadow contrast expansion, clean saturation.

### Custom
- `luts/custom/SVM_Florida_Coastal_v1.cube` — First custom creative LUT. Built 2026-03-05. Warm golden highlights, teal shadows, selective orange/cyan saturation boost, gentle S-curve, highlight rolloff. Optimized for polarized ND, SW Florida coastal aerial.

## Scripts
- `editing/scripts/batch-grade.sh` — ffmpeg batch LUT application. H.265 CRF 22, auto-skip existing, default to official DJI LUT.

## Decisions Log
- 2026-03-05: Created Luma agent. Initial setup with official DJI LUT + SVM Florida Coastal v1 creative LUT.
- 2026-03-05: Established Sawyer-Visual-Media repo as the hub for all visual media files, LUTs, scripts, and business assets.
- 2026-03-05: DJI official LUT rescued from Reddit (DJI removed from their website).
