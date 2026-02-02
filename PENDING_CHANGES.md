# Pending Changes

**Session Started:** February 1, 2026 - Dungeon Aesthetic Overhaul Session

---

## Files Created
- [x] `client/public/textures/board-frame.png` - Gameboard frame
- [x] `client/public/textures/brick-wall.png` - Wall texture for horizontal walls
- [x] `client/public/textures/brick-wall-v.png` - Rotated brick wall texture for vertical walls
- [x] `client/public/textures/floor-tile.png` - Dungeon floor tile texture
- [x] `client/public/textures/panel-frame.png` - UI element frame
- [x] `client/public/textures/stone-bg.png` - Main page background

---

## Files Modified
- [x] `client/src/index.css` - Added dungeon-panel and dungeon-content CSS classes for ornate frame styling
- [x] `client/src/components/Menu.tsx` - Landing page styling with dungeon-panel frames, centered content container
- [x] `client/src/components/HelpSidebar.tsx` - Applied dungeon-panel frames, fixed scroll and toggle animation
- [x] `client/src/components/RightSidebar.tsx` - Applied dungeon-panel frames, limited Sound Preview height
- [x] `client/src/components/Board.tsx` - Adjusted grid padding and inner board area for frame border
- [x] `client/src/components/Chamber.tsx` - Fixed Waystone tiles, wall textures, removed duplicate walls

---

## Files Deleted
- [ ] None

---

## Features Added
- [x] Dungeon panel frame system using CSS border-image with `panel-frame.png`
- [x] Semi-transparent content backgrounds for improved readability (`.dungeon-content` class)
- [x] Proper wall texture tiling - horizontal walls repeat-x, vertical walls repeat-y
- [x] Separate vertical wall texture (`brick-wall-v.png`) for proper orientation

---

## Bugs Fixed
- [x] Fixed panel-frame.png distortion on containers by using border-image CSS
- [x] Fixed content overlapping frame corners on landing page by using centered auto-width container
- [x] Fixed Waystone tiles showing transparent/black background instead of floor texture
- [x] Fixed duplicate wall rendering (walls were drawn twice by adjacent chambers)
  - Removed North and West wall rendering, keeping only South and East
  - Same fix applied to Level 2 door wall segments
- [x] Fixed Help Tips toggle being covered by Legend when collapsed (adjusted animation from -58vh to -45vh)
- [x] Fixed Sound Preview dropdown causing viewport scrollbar (reduced max-h-96 to max-h-48)
- [x] Fixed middle Help Content container not scrolling (added flex-1 min-h-0 and overflow-y-auto)

---

## Improvements Made
- [x] Landing page menu panel now uses `max-w-lg` with centered auto-width content
- [x] Content containers have `rounded-lg` border radius and proper padding
- [x] Board grid padding increased to 6% to account for ornate frame border
- [x] Inner board area adjusted to 5% inset for proper alignment
- [x] Wall textures now tile properly in their respective directions
- [x] Cleaner wall rendering with no visual artifacts from overlapping elements

---

## CSS Classes Added
```css
.dungeon-panel {
  background: transparent;
  border: 40px solid transparent;
  border-image: url('/textures/panel-frame.png') 80 fill / 40px / 0 stretch;
}

.dungeon-content {
  background: rgba(10, 8, 6, 0.6);
  border-radius: 12px;
  padding: 20px;
}
```

---

## Notes/Reminders
- `panel-frame.png` has an opaque interior, so frame cannot overlay content
- Vertical walls use `brick-wall-v.png`, horizontal walls use `brick-wall.png`
- Only South and East walls/doors are rendered to prevent duplication
- Landing page uses different layout (centered auto-width) than sidebars

---

## Commit Message (Draft)
```
Complete dungeon aesthetic overhaul with ornate panel frames

- Add dungeon-panel CSS class using border-image for ornate gold frames
- Add dungeon-content class for semi-transparent content backgrounds
- Fix panel-frame distortion by using proper border-image slicing
- Fix Waystone tiles to show floor texture with colored overlay
- Fix duplicate wall rendering by only drawing South/East walls
- Add brick-wall-v.png for properly oriented vertical wall textures
- Adjust board grid padding to account for frame borders
- Fix HelpSidebar scroll and Legend toggle animation overlap
- Fix Sound Preview dropdown viewport overflow
- Update landing page with centered auto-width content container
```

---

**Last Updated:** February 1, 2026
