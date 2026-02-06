 Plan to implement                                                                                                                                                        │
│                                                                                                                                                                          │
│ Golf Game: game.html + Shared Module Extraction (Updated)                                                                                                                │
│                                                                                                                                                                          │
│ Overview                                                                                                                                                                 │
│                                                                                                                                                                          │
│ Phase 0 first: Integrate ball physics into existing hole1_viewer.html to test/tune scale, then extract shared rendering, then build game.html using real physics,        │
│ gesture-based swing input, and HUD ported from golfswingtrainer/ (adapted from React/Zustand/R3F to vanilla JS/DOM/Three.js).                                            │
│                                                                                                                                                                          │
│ Source Reference: golfswingtrainer/                                                                                                                                      │
│                                                                                                                                                                          │
│ Key files to port (React → vanilla JS):                                                                                                                                  │
│ - src/utils/ballPhysics.ts (643 lines) → Full flight physics, bounce, rolling                                                                                            │
│ - src/components/SwingButton.tsx (540 lines) → Pull-down/swing-up gesture input                                                                                          │
│ - src/components/PowerArc.tsx (285 lines) → Power timing bar                                                                                                             │
│ - src/components/GameHUD.tsx (163 lines) → Stroke counter, shot result popup                                                                                             │
│ - src/config/clubs.ts (27 lines) → Club configs with launch angles + velocity scales                                                                                     │
│ - src/stores/gameStore.ts (526 lines) → SwingPhase FSM, ball state, landing logic                                                                                        │
│                                                                                                                                                                          │
│ NOT porting: Topgolf mode, character/video system, terrain renderer, splat rendering, BroadcastChannel, audio, spin bumps (all either unnecessary or we have our own).   │
│                                                                                                                                                                          │
│ Scale: 1 world unit = 1 meter                                                                                                                                            │
│                                                                                                                                                                          │
│ - Terrain: 512m × 512m (config.terrainSize)                                                                                                                              │
│ - Height: 0-15m (heightScale=15 from saved config)                                                                                                                       │
│ - Tee→Hole: ~366m ≈ 400 yards (par 4)                                                                                                                                    │
│ - Driver max: ~274m (300 yards) — needs 2+ shots                                                                                                                         │
│                                                                                                                                                                          │
│ forest_data.json — Two Copies                                                                                                                                            │
│                                                                                                                                                                          │
│ - Authoritative: public/assets/hole1/forest_data.json — has tee/hole/config, 693 trees, timestamp=1770330067493                                                          │
│ - Legacy/stale: src/tools/output/forest_data.json — no tee/hole/config, 702 trees, older timestamp                                                                       │
│ - Phase 0 will delete the stale one. Going forward only public/assets/hole1/ is used.                                                                                    │
│                                                                                                                                                                          │
│ Files                                                                                                                                                                    │
│                                                                                                                                                                          │
│ New Files                                                                                                                                                                │
│                                                                                                                                                                          │
│ - src/tools/public/js/hole1_viewer.js — shared ES module (GolfCourseRenderer)                                                                                            │
│ - src/tools/public/game.html — the golf game                                                                                                                             │
│                                                                                                                                                                          │
│ Modified Files                                                                                                                                                           │
│                                                                                                                                                                          │
│ - src/tools/public/hole1_viewer.html — Phase 0 adds physics test, then Phase 2 refactors to import shared module                                                         │
│ - src/tools/start.sh — add game.html link to banner                                                                                                                      │
│                                                                                                                                                                          │
│ Deleted Files                                                                                                                                                            │
│                                                                                                                                                                          │
│ - src/tools/output/forest_data.json — stale duplicate (keep only public/assets/hole1/)                                                                                   │
│                                                                                                                                                                          │
│ ---                                                                                                                                                                      │
│ Phase 0: Physics Integration Pre-step (in hole1_viewer.html)                                                                                                             │
│                                                                                                                                                                          │
│ Goal: Add ball physics directly into the existing viewer so we can visually test and tune scale before extracting anything.                                              │
│                                                                                                                                                                          │
│ 0A. Add surface.png pixel data loading (alongside height.png)                                                                                                            │
│                                                                                                                                                                          │
│ let surfaceData = null, surfaceWidth = 0, surfaceHeight = 0;                                                                                                             │
│ function loadSurfaceData() {                                                                                                                                             │
│   return new Promise(resolve => {                                                                                                                                        │
│     const img = new Image();                                                                                                                                             │
│     img.crossOrigin = 'anonymous';                                                                                                                                       │
│     img.onload = () => {                                                                                                                                                 │
│       const canvas = document.createElement('canvas');                                                                                                                   │
│       canvas.width = img.width; canvas.height = img.height;                                                                                                              │
│       surfaceWidth = img.width; surfaceHeight = img.height;                                                                                                              │
│       const ctx = canvas.getContext('2d');                                                                                                                               │
│       ctx.drawImage(img, 0, 0);                                                                                                                                          │
│       surfaceData = ctx.getImageData(0, 0, img.width, img.height).data;                                                                                                  │
│       resolve();                                                                                                                                                         │
│     };                                                                                                                                                                   │
│     img.src = `${ASSETS_PATH}/surface.png`;                                                                                                                              │
│   });                                                                                                                                                                    │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ Call loadSurfaceData() alongside loadHeightData() inside loadForestData().                                                                                               │
│                                                                                                                                                                          │
│ 0B. getSurfaceAt(x, z) function                                                                                                                                          │
│                                                                                                                                                                          │
│ function getSurfaceAt(x, z) {                                                                                                                                            │
│   if (!surfaceData) return 'rough';                                                                                                                                      │
│   const u = x / config.terrainSize + 0.5;                                                                                                                                │
│   const v = z / config.terrainSize + 0.5;                                                                                                                                │
│   const px = Math.floor(u * surfaceWidth);                                                                                                                               │
│   const py = Math.floor(v * surfaceHeight);                                                                                                                              │
│   if (px < 0 || px >= surfaceWidth || py < 0 || py >= surfaceHeight) return 'rough';                                                                                     │
│   const idx = (py * surfaceWidth + px) * 4;                                                                                                                              │
│   const r = surfaceData[idx]/255, g = surfaceData[idx+1]/255, b = surfaceData[idx+2]/255;                                                                                │
│   const close = (a,b) => Math.abs(a-b) < 0.2;                                                                                                                            │
│   if (close(r,1) && close(g,1) && close(b,0)) return 'fairway';                                                                                                          │
│   if (close(r,.5) && close(g,.5) && close(b,.5)) return 'rough';                                                                                                         │
│   if (close(r,0) && close(g,1) && close(b,1)) return 'green';                                                                                                            │
│   if (close(r,0) && close(g,0) && close(b,1)) return 'sand';                                                                                                             │
│   if (close(r,1) && close(g,0) && close(b,1)) return 'fairway'; // tee=fairway                                                                                           │
│   return 'rough';                                                                                                                                                        │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ 0C. Port ball physics (inline in viewer)                                                                                                                                 │
│                                                                                                                                                                          │
│ Port from golfswingtrainer/src/utils/ballPhysics.ts to vanilla JS at the top of the module:                                                                              │
│ - All constants (GRAVITY, BALL_MASS, etc.)                                                                                                                               │
│ - SURFACE_PHYSICS map                                                                                                                                                    │
│ - calculateInitialVelocity()                                                                                                                                             │
│ - calculateAerodynamicForces() (private)                                                                                                                                 │
│ - calculateTerrainNormal() (private)                                                                                                                                     │
│ - reflectVelocity() (private)                                                                                                                                            │
│ - findCollisionPoint() (private)                                                                                                                                         │
│ - updateFlightPosition()                                                                                                                                                 │
│ - createInitialFlightState()                                                                                                                                             │
│                                                                                                                                                                          │
│ 0D. Club configs (inline)                                                                                                                                                │
│                                                                                                                                                                          │
│ const CLUBS = [                                                                                                                                                          │
│   { id:'driver', name:'Driver', shortName:'DR', minAngle:12, maxAngle:25, maxRange:300, velScale:1.046 },                                                                │
│   { id:'7i', name:'7 Iron', shortName:'7i', minAngle:26, maxAngle:39, maxRange:160, velScale:0.567 },                                                                    │
│   { id:'pw', name:'Pitch Wedge', shortName:'PW', minAngle:42, maxAngle:55, maxRange:90, velScale:0.371 },                                                                │
│ ];                                                                                                                                                                       │
│ const CLUB_MAP = Object.fromEntries(CLUBS.map(c => [c.id, c]));                                                                                                          │
│                                                                                                                                                                          │
│ 0E. Test Shot UI (add to config panel)                                                                                                                                   │
│                                                                                                                                                                          │
│ Add a "Test Shot" section to the #config panel:                                                                                                                          │
│ <hr>                                                                                                                                                                     │
│ <h4>Test Shot</h4>                                                                                                                                                       │
│ <label>Club <span class="value" id="val-club">DR</span></label>                                                                                                          │
│ <select id="clubSelect">                                                                                                                                                 │
│   <option value="driver">Driver</option>                                                                                                                                 │
│   <option value="7i">7 Iron</option>                                                                                                                                     │
│   <option value="pw">PW</option>                                                                                                                                         │
│ </select>                                                                                                                                                                │
│ <label>Power <span class="value" id="val-power">80</span></label>                                                                                                        │
│ <input type="range" id="shotPower" min="10" max="100" step="5" value="80">                                                                                               │
│ <label>Aim Offset (deg) <span class="value" id="val-aim">0</span></label>                                                                                                │
│ <input type="range" id="shotAim" min="-30" max="30" step="1" value="0">                                                                                                  │
│ <button id="fireBtn">Fire!</button>                                                                                                                                      │
│ <div id="shotStatus" style="color:#4CAF50;margin-top:5px;font-size:11px;"></div>                                                                                         │
│                                                                                                                                                                          │
│ 0F. Ball mesh + flight loop                                                                                                                                              │
│                                                                                                                                                                          │
│ After forest data loads, create a visible ball mesh:                                                                                                                     │
│ const gameBall = new THREE.Mesh(                                                                                                                                         │
│   new THREE.SphereGeometry(0.8, 16, 16),                                                                                                                                 │
│   new THREE.MeshBasicMaterial({ color: 0xff4444 }) // red for visibility during testing                                                                                  │
│ );                                                                                                                                                                       │
│ gameBall.visible = false;                                                                                                                                                │
│ scene.add(gameBall);                                                                                                                                                     │
│                                                                                                                                                                          │
│ Fire button handler:                                                                                                                                                     │
│ let flightState = null;                                                                                                                                                  │
│ document.getElementById('fireBtn').addEventListener('click', () => {                                                                                                     │
│   const teePos = [teeWorldPos.x, teeWorldPos.y, teeWorldPos.z];                                                                                                          │
│   const club = CLUB_MAP[document.getElementById('clubSelect').value];                                                                                                    │
│   const power = parseInt(document.getElementById('shotPower').value);                                                                                                    │
│   const aimDeg = parseInt(document.getElementById('shotAim').value);                                                                                                     │
│                                                                                                                                                                          │
│   // Compute aim direction: tee→hole rotated by aimDeg                                                                                                                   │
│   const dx = holeWorldPos.x - teeWorldPos.x;                                                                                                                             │
│   const dz = holeWorldPos.z - teeWorldPos.z;                                                                                                                             │
│   const baseAngle = Math.atan2(dx, dz);                                                                                                                                  │
│   const aimAngle = baseAngle + (aimDeg * Math.PI / 180);                                                                                                                 │
│                                                                                                                                                                          │
│   const velocity = calculateInitialVelocity(                                                                                                                             │
│     power, 90, 0, aimAngle,                                                                                                                                              │
│     club.minAngle, club.maxAngle, club.velScale                                                                                                                          │
│   );                                                                                                                                                                     │
│   flightState = createInitialFlightState(teePos, velocity, 0);                                                                                                           │
│   gameBall.visible = true;                                                                                                                                               │
│   gameBall.position.set(...teePos);                                                                                                                                      │
│   document.getElementById('shotStatus').textContent = 'Ball in flight...';                                                                                               │
│ });                                                                                                                                                                      │
│                                                                                                                                                                          │
│ In animate loop, add physics tick:                                                                                                                                       │
│ if (flightState && flightState.phase !== 'stopped') {                                                                                                                    │
│   const delta = clock.getDelta(); // need THREE.Clock                                                                                                                    │
│   flightState = updateFlightPosition(flightState, delta, getHeightAt, getSurfaceAt);                                                                                     │
│   gameBall.position.set(...flightState.position);                                                                                                                        │
│   if (flightState.phase === 'stopped') {                                                                                                                                 │
│     const surface = getSurfaceAt(flightState.position[0], flightState.position[2]);                                                                                      │
│     const distToHole = Math.sqrt(                                                                                                                                        │
│       (flightState.position[0]-holeWorldPos.x)**2 +                                                                                                                      │
│       (flightState.position[2]-holeWorldPos.z)**2                                                                                                                        │
│     );                                                                                                                                                                   │
│     document.getElementById('shotStatus').textContent =                                                                                                                  │
│       `Landed on ${surface} | ${Math.round(distToHole)}m to hole (${Math.round(distToHole*1.094)}yds)`;                                                                  │
│   }                                                                                                                                                                      │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ 0G. Compute + expose teeWorldPos / holeWorldPos                                                                                                                          │
│                                                                                                                                                                          │
│ After forest data loads, compute and store:                                                                                                                              │
│ let teeWorldPos = new THREE.Vector3();                                                                                                                                   │
│ let holeWorldPos = new THREE.Vector3();                                                                                                                                  │
│ // In loadForestData, after rebuildTrees():                                                                                                                              │
│ if (forestData.tee) {                                                                                                                                                    │
│   const cx = -forestData.width / 2;                                                                                                                                      │
│   const cz = -forestData.height / 2;                                                                                                                                     │
│   const tx = forestData.tee.x + cx, tz = forestData.tee.y + cz;                                                                                                          │
│   teeWorldPos.set(tx, getHeightAt(tx, tz) + 1.5, tz);                                                                                                                    │
│   const hx = forestData.hole.x + cx, hz = forestData.hole.y + cz;                                                                                                        │
│   holeWorldPos.set(hx, getHeightAt(hx, hz), hz);                                                                                                                         │
│   console.log(`Tee: ${teeWorldPos.toArray()}, Hole: ${holeWorldPos.toArray()}`);                                                                                         │
│   console.log(`Distance: ${teeWorldPos.distanceTo(holeWorldPos).toFixed(0)}m (${(teeWorldPos.distanceTo(holeWorldPos)*1.094).toFixed(0)}yds)`);                          │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ 0H. Delete stale forest_data.json                                                                                                                                        │
│                                                                                                                                                                          │
│ Remove src/tools/output/forest_data.json (the stale one with no tee/hole/config).                                                                                        │
│                                                                                                                                                                          │
│ 0I. Verification                                                                                                                                                         │
│                                                                                                                                                                          │
│ 1. cd src/tools && node server.js                                                                                                                                        │
│ 2. Open http://localhost:3000/hole1_viewer.html                                                                                                                          │
│ 3. Press ~ to show config panel → scroll to "Test Shot" section                                                                                                          │
│ 4. Select club, set power, set aim offset → click "Fire!"                                                                                                                │
│ 5. Watch red ball arc through the air, bounce on terrain, roll to stop                                                                                                   │
│ 6. Status shows landing surface + distance to hole                                                                                                                       │
│ 7. Orbit camera around to inspect ball trajectory from different angles                                                                                                  │
│ 8. Tweak heightScale / terrainSize and re-fire to tune scale                                                                                                             │
│ 9. If scale is off: adjust physics or terrain config, Save to persist                                                                                                    │
│                                                                                                                                                                          │
│ ---                                                                                                                                                                      │
│ Phase 1: Extract js/hole1_viewer.js                                                                                                                                      │
│                                                                                                                                                                          │
│ Same as before, plus getSurfaceAt(worldX, worldZ) for physics integration.                                                                                               │
│                                                                                                                                                                          │
│ Exports                                                                                                                                                                  │
│                                                                                                                                                                          │
│ GolfCourseRenderer, DEFAULT_CONFIG, ASSETS_PATH, CUBEMAP_PATH                                                                                                            │
│                                                                                                                                                                          │
│ GolfCourseRenderer API                                                                                                                                                   │
│                                                                                                                                                                          │
│ class GolfCourseRenderer {                                                                                                                                               │
│   constructor(container, configOverrides = {})                                                                                                                           │
│                                                                                                                                                                          │
│   // Public properties                                                                                                                                                   │
│   scene, camera, renderer, config                                                                                                                                        │
│   forestGroup, forestData, terrain                                                                                                                                       │
│   terrainMaterial, skyboxMaterial                                                                                                                                        │
│   teeWorldPos   // THREE.Vector3                                                                                                                                         │
│   holeWorldPos  // THREE.Vector3                                                                                                                                         │
│                                                                                                                                                                          │
│   async init()                    // Load everything, build scene                                                                                                        │
│   getHeightAt(x, z)              // World-space height lookup (meters)                                                                                                   │
│   sampleHeight(u, v)             // UV height lookup (0-1)                                                                                                               │
│   getSurfaceAt(x, z)             // → 'Fairway'|'Rough'|'Green'|'Sand'|'Tee'                                                                                             │
│   applyConfig(newConfig)         // Rebuild terrain/trees/uniforms                                                                                                       │
│   updateBillboards(cam)          // Billboard trees toward given camera                                                                                                  │
│   handleResize()                 // Update camera aspect + renderer size                                                                                                 │
│   render()                       // renderer.render(scene, camera)                                                                                                       │
│   pixelToWorld(px, py)           // forest_data coords → world {x, z}                                                                                                    │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ New: getSurfaceAt(x, z)                                                                                                                                                  │
│                                                                                                                                                                          │
│ Load surface.png as pixel data (alongside height.png). Map world coords → UV → pixel → surface type:                                                                     │
│ // Color mapping (from terrain shader):                                                                                                                                  │
│ // Yellow (1,1,0) → 'Fairway', Gray (0.5,0.5,0.5) → 'Rough'                                                                                                              │
│ // Cyan (0,1,1) → 'Green', Magenta (1,0,1) → 'Tee' (→ 'fairway' for physics)                                                                                             │
│ // Blue (0,0,1) → 'Sand', Default → 'Rough'                                                                                                                              │
│ getSurfaceAt(x, z) {                                                                                                                                                     │
│   const u = x / config.terrainSize + 0.5;                                                                                                                                │
│   const v = z / config.terrainSize + 0.5;                                                                                                                                │
│   const px = Math.floor(u * surfaceWidth);                                                                                                                               │
│   const py = Math.floor(v * surfaceHeight);                                                                                                                              │
│   const idx = (py * surfaceWidth + px) * 4;                                                                                                                              │
│   const r = surfaceData[idx]/255, g = surfaceData[idx+1]/255, b = surfaceData[idx+2]/255;                                                                                │
│   // Color-match to surface type (same tolerance as shader)                                                                                                              │
│   if (close(r,1,g,1,b,0)) return 'fairway';                                                                                                                              │
│   if (close(r,.5,g,.5,b,.5)) return 'rough';                                                                                                                             │
│   if (close(r,0,g,1,b,1)) return 'green';                                                                                                                                │
│   if (close(r,0,g,0,b,1)) return 'sand';                                                                                                                                 │
│   if (close(r,1,g,0,b,1)) return 'fairway'; // tee = fairway physics                                                                                                     │
│   return 'rough';                                                                                                                                                        │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ What moves into the class                                                                                                                                                │
│                                                                                                                                                                          │
│ Same as original plan (shaders, scene setup, skybox, textures, height, terrain, forest, trees, billboard, resize). Tag tee ball with userData.isTeeBall = true. Add      │
│ surfaceData loading alongside heightData.                                                                                                                                │
│                                                                                                                                                                          │
│ teeWorldPos / holeWorldPos                                                                                                                                               │
│                                                                                                                                                                          │
│ // forest_data: tee={x:268,y:52}, hole={x:248,y:417}, width=512, height=512                                                                                              │
│ teeWorldPos  = new Vector3(12, getHeightAt(12,-204)+1.5, -204)                                                                                                           │
│ holeWorldPos = new Vector3(-8, getHeightAt(-8,161),       161)                                                                                                           │
│                                                                                                                                                                          │
│ onConfigLoaded callback                                                                                                                                                  │
│                                                                                                                                                                          │
│ init() accepts optional onConfigLoaded(config) callback. Viewer uses it for sliders, game ignores it.                                                                    │
│                                                                                                                                                                          │
│ ---                                                                                                                                                                      │
│ Phase 2: Refactor hole1_viewer.html                                                                                                                                      │
│                                                                                                                                                                          │
│ Shrinks to ~200 lines. Same as original plan — imports GolfCourseRenderer + OrbitControls, wires sliders.                                                                │
│                                                                                                                                                                          │
│ ---                                                                                                                                                                      │
│ Phase 3: Build game.html                                                                                                                                                 │
│                                                                                                                                                                          │
│ All inline in a single <script type="module">. HTML structure is: canvas (full-screen) + HUD overlays.                                                                   │
│                                                                                                                                                                          │
│ 3A. State Machine (ported from gameStore.ts SwingPhase)                                                                                                                  │
│                                                                                                                                                                          │
│ SwingPhase: 'ready' | 'pulling' | 'swinging' | 'finished'                                                                                                                │
│                                                                                                                                                                          │
│ ready → pulling     (touch/mousedown on swing area)                                                                                                                      │
│ pulling → swinging  (successful release: pull ≥ 30px, swing ≥ 30px, released above halfway)                                                                              │
│ pulling → ready     (failed gesture — didn't pull/swing enough)                                                                                                          │
│ swinging → finished (ball stops: phase='stopped' in physics)                                                                                                             │
│ finished → ready    (player clicks "next shot")                                                                                                                          │
│ finished → complete (ball landed on green → game over screen)                                                                                                            │
│                                                                                                                                                                          │
│ State object (plain JS, no Zustand):                                                                                                                                     │
│ const state = {                                                                                                                                                          │
│   phase: 'ready',        // SwingPhase                                                                                                                                   │
│   currentShot: 1,                                                                                                                                                        │
│   aimAngle: 0,           // radians offset from baseDir                                                                                                                  │
│   pullProgress: 0,       // 0-1                                                                                                                                          │
│   arcPower: 0,           // 0-100 from PowerArc timing                                                                                                                   │
│   swingResult: null,     // { power, accuracy, direction, sidespin, shotType }                                                                                           │
│   ballPos: [...teeWorldPos],                                                                                                                                             │
│   ballStartPos: [...teeWorldPos],                                                                                                                                        │
│   ballFlying: false,                                                                                                                                                     │
│   gameComplete: false,                                                                                                                                                   │
│   selectedClub: 'driver',                                                                                                                                                │
│   distanceTraveled: 0,                                                                                                                                                   │
│ };                                                                                                                                                                       │
│                                                                                                                                                                          │
│ 3B. Ball Physics (ported from ballPhysics.ts — FULL, not stubbed)                                                                                                        │
│                                                                                                                                                                          │
│ Port these functions verbatim from TypeScript to vanilla JS:                                                                                                             │
│ - calculateInitialVelocity(power, accuracy, direction, baseAngle, minAngle, maxAngle, velocityScale)                                                                     │
│ - calculateAerodynamicForces(velocity, sidespin, flightTime) — drag + Magnus lift + sidespin curve                                                                       │
│ - calculateTerrainNormal(getHeight, x, z) — finite differences                                                                                                           │
│ - reflectVelocity(velocity, normal, restitution) — bounce off terrain                                                                                                    │
│ - findCollisionPoint(startPos, endPos, getHeight) — binary search anti-tunneling                                                                                         │
│ - updateFlightPosition(flightState, delta, getHeight, getSurface) — full flight/bounce/rolling loop                                                                      │
│ - createInitialFlightState(startPos, velocity, sidespin)                                                                                                                 │
│                                                                                                                                                                          │
│ Constants (from ballPhysics.ts):                                                                                                                                         │
│ GRAVITY=9.81, BALL_MASS=0.0459, BALL_RADIUS=0.02135                                                                                                                      │
│ AIR_DENSITY=1.225, DRAG_COEFFICIENT=0.25, LIFT_COEFFICIENT=0.15                                                                                                          │
│ MIN_VELOCITY=15, MAX_VELOCITY=70                                                                                                                                         │
│ BOUNCE_COEFFICIENT=0.38, ROLLING_FRICTION=6.0                                                                                                                            │
│ MIN_BOUNCE_VELOCITY=1.5, MIN_ROLLING_SPEED=0.1                                                                                                                           │
│ SIDESPIN_COEFFICIENT=0.10, SIDESPIN_DECAY_RATE=0.3                                                                                                                       │
│                                                                                                                                                                          │
│ Surface physics (from ballPhysics.ts):                                                                                                                                   │
│ SURFACE_PHYSICS = {                                                                                                                                                      │
│   fairway: { bounce: 0.38, friction: 4.0,  sticks: false },                                                                                                              │
│   rough:   { bounce: 0.22, friction: 12.0, sticks: false },                                                                                                              │
│   green:   { bounce: 0.30, friction: 3.0,  sticks: false },                                                                                                              │
│   sand:    { bounce: 0.05, friction: 25.0, sticks: true  },                                                                                                              │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ 3C. Club System (ported from clubs.ts)                                                                                                                                   │
│                                                                                                                                                                          │
│ const CLUBS = [                                                                                                                                                          │
│   { id:'driver', name:'Driver',    shortName:'DR', minAngle:12, maxAngle:25, maxRange:300, velScale:1.046 },                                                             │
│   { id:'3w',     name:'3 Wood',    shortName:'3W', minAngle:15, maxAngle:28, maxRange:250, velScale:0.869 },                                                             │
│   { id:'5i',     name:'5 Iron',    shortName:'5i', minAngle:20, maxAngle:33, maxRange:200, velScale:0.698 },                                                             │
│   { id:'7i',     name:'7 Iron',    shortName:'7i', minAngle:26, maxAngle:39, maxRange:160, velScale:0.567 },                                                             │
│   { id:'9i',     name:'9 Iron',    shortName:'9i', minAngle:35, maxAngle:48, maxRange:120, velScale:0.449 },                                                             │
│   { id:'pw',     name:'Pitch Wedge',shortName:'PW', minAngle:42, maxAngle:55, maxRange:90,  velScale:0.371 },                                                            │
│   { id:'sw',     name:'Sand Wedge', shortName:'SW', minAngle:50, maxAngle:63, maxRange:70,  velScale:0.327 },                                                            │
│ ];                                                                                                                                                                       │
│                                                                                                                                                                          │
│ Auto-select on nextShot: pick highest maxRange that doesn't exceed distance-to-hole in yards.                                                                            │
│                                                                                                                                                                          │
│ 3D. Swing Input (ported from SwingButton.tsx + PowerArc.tsx)                                                                                                             │
│                                                                                                                                                                          │
│ Swing Area — plain HTML div (132×160px), bottom-center of screen:                                                                                                        │
│ - 3 lane dividers (white lines at 44px intervals)                                                                                                                        │
│ - Draggable dot (24px circle)                                                                                                                                            │
│ - SVG trail overlay                                                                                                                                                      │
│ - "Pull down" / "Swing up!" instruction text                                                                                                                             │
│                                                                                                                                                                          │
│ Gesture flow (port from SwingButton handleStart/handleMove/handleEnd):                                                                                                   │
│ 1. Touch/mousedown → record startY, startX, begin tracking                                                                                                               │
│ 2. Drag down → track maxPullDistance, compute pullProgress = min(1, dist/80)                                                                                             │
│ 3. When pullProgress ≥ 0.95 → PowerArc bar starts animating                                                                                                              │
│ 4. Detect upswing (clientY < pullEndY - 5) → record curve samples for sidespin                                                                                           │
│ 5. Release → compute: power (from arc), accuracy (jitter), sidespin (weighted-deviation), direction, shotType                                                            │
│                                                                                                                                                                          │
│ PowerArc Bar — plain HTML div (20×200px), right side, vertically centered:                                                                                               │
│ - Gray zone (0-70%): power = progress/0.70 × 85                                                                                                                          │
│ - White zone (70-90%): power = 100 (sweet spot)                                                                                                                          │
│ - Red zone (90-100%): power = 100 - overshoot × 30                                                                                                                       │
│ - Pointer moves bottom→top over 1200ms                                                                                                                                   │
│ - Appears when pullProgress ≥ 0.95                                                                                                                                       │
│                                                                                                                                                                          │
│ Sidespin computation (port from SwingButton computeContinuousSidespin):                                                                                                  │
│ // Weighted-deviation integral: baseline from first→last sample                                                                                                          │
│ // Bell curve weight peaking at yProgress=0.5                                                                                                                            │
│ // Result clamped to [-1, 1], negative=draw, positive=fade                                                                                                               │
│                                                                                                                                                                          │
│ Shot type classification (port from classifyShotType):                                                                                                                   │
│ |spin|<0.15 && |dir|≥0.3 → push/pull                                                                                                                                     │
│ |spin|<0.15 → straight                                                                                                                                                   │
│ |spin|<0.5 → draw/fade                                                                                                                                                   │
│ else → big_draw/big_fade                                                                                                                                                 │
│                                                                                                                                                                          │
│ 3E. Aim Control (keyboard — NOT from golfswingtrainer)                                                                                                                   │
│                                                                                                                                                                          │
│ Keep original plan's A/D keyboard aim since we don't have orbit controls in game mode:                                                                                   │
│ - A/D or Left/Right arrows rotate aimAngle at 1.5 rad/s                                                                                                                  │
│ - Visible aim arrow (thin cylinder or line) extends from ball in aim direction                                                                                           │
│ - Aim arrow only visible in 'ready' phase                                                                                                                                │
│ - baseDir = normalize(holePos - ballPos) on XZ plane                                                                                                                     │
│ - aimDir = rotate baseDir by aimAngle                                                                                                                                    │
│                                                                                                                                                                          │
│ 3F. Ball Launch Integration                                                                                                                                              │
│                                                                                                                                                                          │
│ On successful swing release:                                                                                                                                             │
│ const club = CLUB_MAP[state.selectedClub];                                                                                                                               │
│ // baseAngle = atan2(aimDir.x, aimDir.z) — world-space direction from aim                                                                                                │
│ const velocity = calculateInitialVelocity(                                                                                                                               │
│   swingResult.power, swingResult.accuracy, swingResult.direction,                                                                                                        │
│   baseAngle, club.minAngle, club.maxAngle, club.velScale                                                                                                                 │
│ );                                                                                                                                                                       │
│ flightState = createInitialFlightState(state.ballPos, velocity, swingResult.sidespin);                                                                                   │
│                                                                                                                                                                          │
│ Each frame during flight:                                                                                                                                                │
│ flightState = updateFlightPosition(flightState, delta, course.getHeightAt, course.getSurfaceAt);                                                                         │
│ // Update ball mesh position from flightState.position                                                                                                                   │
│ // When flightState.phase === 'stopped' → transition to 'finished'                                                                                                       │
│                                                                                                                                                                          │
│ 3G. Camera Director (3 rigs — enhanced from original plan)                                                                                                               │
│                                                                                                                                                                          │
│ Single THREE.PerspectiveCamera (game creates its own, not course.camera). Smooth transitions.                                                                            │
│ ┌──────────┬────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ─┐                                                                                                                                                                       │
│ │   Rig    │        When        │                                                                Behavior                                                                │
│  │                                                                                                                                                                       │
│ ├──────────┼────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ─┤                                                                                                                                                                       │
│ │ Tee Rig  │ ready, pulling     │ Behind ball, rotates with aim. pos = ball - aimDir*20 + up*10, lookAt ball + aimDir*50                                                 │
│  │                                                                                                                                                                       │
│ ├──────────┼────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ─┤                                                                                                                                                                       │
│ │ Flight   │ swinging (ball     │ Chase cam: height-based offset (from CameraController). offset = lerp(close[0,3,-3], far[0,30,-30], heightRatio). Smoothed ball        │
│  │                                                                                                                                                                       │
│ │ Rig      │ flying)            │ tracking (lerp speed 8), camera movement (lerp speed 3)                                                                                │
│  │                                                                                                                                                                       │
│ ├──────────┼────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ─┤                                                                                                                                                                       │
│ │ Result   │ finished, complete │ Hold at stopped ball position for 1s, then slow orbit (0.3 rad/s) around ball, radius 25, height 12                                    │
│  │                                                                                                                                                                       │
│ │ Rig      │                    │                                                                                                                                        │
│  │                                                                                                                                                                       │
│ └──────────┴────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ─┘                                                                                                                                                                       │
│ Rig transitions: lerp position + lookTarget over 0.5s.                                                                                                                   │
│                                                                                                                                                                          │
│ Height-based offset (ported from CameraController):                                                                                                                      │
│ const heightRatio = clamp01((ballY - 2) / (15 - 2));                                                                                                                     │
│ const offset = lerpVec3(OFFSET_CLOSE, OFFSET_FAR, heightRatio);                                                                                                          │
│                                                                                                                                                                          │
│ 3H. Game Objects                                                                                                                                                         │
│                                                                                                                                                                          │
│ - Game ball: white sphere, radius 0.8 (visual only — larger than physics BALL_RADIUS for visibility)                                                                     │
│ - Aim arrow: thin cylinder or line, 30 units long, from ball in aimDir, green color, visible only in 'ready'                                                             │
│ - Static tee ball: hide (userData.isTeeBall) mesh after first shot by setting visible=false                                                                              │
│ - Club display: show selected club name near swing area                                                                                                                  │
│                                                                                                                                                                          │
│ 3I. HUD (ported from GameHUD.tsx — plain HTML/CSS)                                                                                                                       │
│                                                                                                                                                                          │
│ All positioned absolutely over the canvas. Monospace font, semi-transparent dark backgrounds.                                                                            │
│                                                                                                                                                                          │
│ Top-left scoreboard (always visible):                                                                                                                                    │
│ STROKE: {currentShot}                                                                                                                                                    │
│ To Pin: {distToHoleYards} yds     (visible in ready/pulling)                                                                                                             │
│ Club: {clubShortName}                                                                                                                                                    │
│                                                                                                                                                                          │
│ Live flight tracker (during swinging when ball flying):                                                                                                                  │
│ {distanceYards} yds    (large, updating in real-time)                                                                                                                    │
│                                                                                                                                                                          │
│ Shot result popup (on 'finished', not game complete):                                                                                                                    │
│ ┌─ STROKE {n} ─── [STRAIGHT] ─┐                                                                                                                                          │
│ │ Distance:     {yards} yds    │                                                                                                                                         │
│ │ To Pin:       {yards} yds    │                                                                                                                                         │
│ │ Surface:      {type}         │                                                                                                                                         │
│ │ ─────────────────────────── │                                                                                                                                          │
│ │ Power:    {%}  [GREAT]       │                                                                                                                                         │
│ │ Accuracy: {%}                │                                                                                                                                         │
│ │ Curve:    ◀ {%}              │                                                                                                                                         │
│ │                              │                                                                                                                                         │
│ │ [    TAP TO CONTINUE     ]   │                                                                                                                                         │
│ └──────────────────────────────┘                                                                                                                                         │
│                                                                                                                                                                          │
│ Power labels: ≥95 PERFECT, ≥80 GREAT, ≥60 GOOD, ≥40 WEAK, <40 DUFF                                                                                                       │
│                                                                                                                                                                          │
│ Game complete overlay (when ball on green):                                                                                                                              │
│ HOLE COMPLETE!                                                                                                                                                           │
│ Score: {currentShot} strokes                                                                                                                                             │
│ [PLAY AGAIN]                                                                                                                                                             │
│                                                                                                                                                                          │
│ 3J. Landing Logic (ported from gameStore.ts landBall)                                                                                                                    │
│                                                                                                                                                                          │
│ function landBall(distance) {                                                                                                                                            │
│   const surface = course.getSurfaceAt(ballPos[0], ballPos[2]);                                                                                                           │
│   const onGreen = (surface === 'green');                                                                                                                                 │
│   const distToHole = xzDistance(ballPos, holeWorldPos);                                                                                                                  │
│                                                                                                                                                                          │
│   state.swingResult.distanceToHole = distToHole;                                                                                                                         │
│   state.swingResult.surface = surface;                                                                                                                                   │
│   state.distanceTraveled = distance;                                                                                                                                     │
│   state.ballStartPos = [...ballPos]; // next shot starts here                                                                                                            │
│   state.phase = 'finished';                                                                                                                                              │
│   state.ballFlying = false;                                                                                                                                              │
│   state.gameComplete = onGreen;                                                                                                                                          │
│                                                                                                                                                                          │
│   // Auto-select club for next shot                                                                                                                                      │
│   const yds = distToHole * 1.09361;                                                                                                                                      │
│   state.selectedClub = autoSelectClub(yds);                                                                                                                              │
│ }                                                                                                                                                                        │
│                                                                                                                                                                          │
│ ---                                                                                                                                                                      │
│ Implementation Order                                                                                                                                                     │
│                                                                                                                                                                          │
│ Phase 0 — Physics pre-step (in hole1_viewer.html)                                                                                                                        │
│ 0. Delete stale src/tools/output/forest_data.json                                                                                                                        │
│ 1. Add surface.png data loading — loadSurfaceData() + getSurfaceAt()                                                                                                     │
│ 2. Port ball physics — ballPhysics.ts functions to vanilla JS inline                                                                                                     │
│ 3. Add test shot UI — Club/power/aim sliders + Fire button in config panel                                                                                               │
│ 4. Add ball mesh + flight loop — Red test ball, physics tick in animate loop                                                                                             │
│ 5. Compute teeWorldPos/holeWorldPos — After forest data loads                                                                                                            │
│ 6. Test & tune — Fire test shots, verify scale, adjust if needed, Save config                                                                                            │
│                                                                                                                                                                          │
│ Phase 1 — Extract shared module                                                                                                                                          │
│ 7. Create js/hole1_viewer.js — GolfCourseRenderer class (includes getSurfaceAt, physics stays out)                                                                       │
│ 8. Refactor hole1_viewer.html — import shared module, re-verify physics test still works                                                                                 │
│                                                                                                                                                                          │
│ Phase 2 — Build game.html                                                                                                                                                │
│ 9. Create game.html skeleton — import module, render course, ball at tee                                                                                                 │
│ 10. Add state machine + aim controls — A/D rotation, aim arrow                                                                                                           │
│ 11. Add swing input — SwingArea + PowerArc DOM elements, gesture tracking                                                                                                │
│ 12. Add ball physics integration — Launch on swing, full flight loop                                                                                                     │
│ 13. Add camera director — 3 rigs with smooth transitions                                                                                                                 │
│ 14. Add HUD — Scoreboard, flight tracker, shot result, game complete                                                                                                     │
│ 15. Add club system — Auto-select, display in HUD                                                                                                                        │
│ 16. Update start.sh — add game URL to banner                                                                                                                             │
│                                                                                                                                                                          │
│ ---                                                                                                                                                                      │
│ Verification                                                                                                                                                             │
│                                                                                                                                                                          │
│ Phase 0 checks                                                                                                                                                           │
│                                                                                                                                                                          │
│ 1. cd src/tools && node server.js                                                                                                                                        │
│ 2. http://localhost:3000/hole1_viewer.html → press ~ → "Test Shot" section visible                                                                                       │
│ 3. Fire driver at 80% power → ball arcs, bounces, rolls to stop                                                                                                          │
│ 4. Status shows surface type + distance to hole in meters/yards                                                                                                          │
│ 5. Orbit camera to inspect trajectory from all angles                                                                                                                    │
│ 6. Fire sand wedge → shorter, higher arc                                                                                                                                 │
│ 7. Ball in sand → sticks immediately; ball on rough → rolls slowly                                                                                                       │
│                                                                                                                                                                          │
│ Phase 1 checks                                                                                                                                                           │
│                                                                                                                                                                          │
│ 8. Viewer still renders identically after refactor                                                                                                                       │
│ 9. Physics test still works with shared module                                                                                                                           │
│                                                                                                                                                                          │
│ Phase 2 checks                                                                                                                                                           │
│                                                                                                                                                                          │
│ 10. http://localhost:3000/game.html → game loads, course renders, ball at tee                                                                                            │
│ 11. A/D aim rotation works, arrow visible                                                                                                                                │
│ 12. Swing gesture: pull down → power bar → swing up → ball launches                                                                                                      │
│ 13. Full physics: arc, bounce, roll, surface-aware                                                                                                                       │
│ 14. Camera transitions: tee rig → flight rig → result rig                                                                                                                │
│ 15. HUD: stroke count, live distance, shot result popup                                                                                                                  │
│ 16. Multi-shot: land → next shot from landing spot → auto-select club                                                                                                    │
│ 17. Ball on green → "HOLE COMPLETE" → Play Again resets                                                                                                                  │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

● I'll start by reading the key source files to understand the current codebase before implementing this large plan.

● I see I'm in plan mode. The user has provided a very detailed implementation plan already. Let me explore the codebase to understand the current state, then write the    
  plan file and exit plan mode.                      
  ⎿  Interrupted · What should Claude do instead?                                                                                                                           
                                                                                                                                                                            
  1 tasks (0 done, 1 open) · ctrl+t to hide tasks                                                                                                                           
  ◻ Phase 0: Add ball physics to hole1_viewer.html      