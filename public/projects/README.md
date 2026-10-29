# Project media

One folder per residence, named after its slug:

```
public/projects/<slug>/
  terrain/     real photographs of the plot (JPG/WebP, ≥ 2400px wide)
  renders/     architectural renders (keep the original aspect ratio)
  videos/      films: <name>.mp4 (H.264), <name>.webm, <name>-720.mp4, <name>-poster.jpg
  models/      residence.glb (Draco/Meshopt compressed) or viewer/index.html
  panoramas/   equirectangular 2:1 panoramas (≥ 6000×3000) — never flat photos
  plans/       floor plans (SVG preferred, or high-resolution PNG)
```

`_demo/` holds the generated demonstration maquette plates. Once real files are in
place, point the residence JSON to them and set `"demo": false` on each item.
