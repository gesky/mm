/* muscle-map.js
   Gera um "boneco" simplificado (frente ou costas) em SVG e destaca
   com glow vermelho o(s) grupo(s) muscular(es) do exercício.
   Isso é um placeholder funcional do esqueleto — quando a identidade
   visual do Muscle Memory estiver pronta, dá pra trocar por ilustrações reais. */

const MUSCLE_VIEW = {
  chest: 'front', shoulders: 'front', biceps: 'front', forearms: 'front',
  abdominals: 'front', quadriceps: 'front', adductors: 'front', abductors: 'front',
  neck: 'front', traps: 'back',
  triceps: 'back', lats: 'back', 'middle back': 'back', 'lower back': 'back',
  glutes: 'back', hamstrings: 'back', calves: 'back'
};

// posições aproximadas (cx, cy, r) das regiões em um viewBox 0 0 200 400
const FRONT_REGIONS = {
  neck:        {cx:100, cy:52,  rx:12, ry:14},
  shoulders:   {cx:100, cy:80,  rx:52, ry:16},
  chest:       {cx:100, cy:105, rx:34, ry:20},
  biceps:      {cx:100, cy:135, rx:56, ry:18},
  forearms:    {cx:100, cy:175, rx:60, ry:16},
  abdominals:  {cx:100, cy:150, rx:20, ry:26},
  adductors:   {cx:100, cy:225, rx:14, ry:20},
  abductors:   {cx:100, cy:225, rx:30, ry:20},
  quadriceps:  {cx:100, cy:265, rx:26, ry:38},
};

const BACK_REGIONS = {
  neck:        {cx:100, cy:52,  rx:12, ry:14},
  traps:       {cx:100, cy:75,  rx:36, ry:16},
  shoulders:   {cx:100, cy:85,  rx:56, ry:14},
  lats:        {cx:100, cy:120, rx:32, ry:26},
  'middle back':{cx:100, cy:118, rx:20, ry:24},
  'lower back':{cx:100, cy:155, rx:18, ry:16},
  triceps:     {cx:100, cy:140, rx:58, ry:18},
  glutes:      {cx:100, cy:185, rx:26, ry:18},
  hamstrings:  {cx:100, cy:230, rx:24, ry:32},
  calves:      {cx:100, cy:300, rx:16, ry:26},
};

function bodyOutlinePath(){
  // silhueta bem simples, só pra dar contexto de "boneco"
  return `<path d="M100 20 C112 20 120 30 120 42 C120 52 114 58 108 62
    L108 68 C130 72 140 90 140 105 L142 190
    C142 200 138 205 130 208 L128 260 C128 300 130 340 132 375
    L118 375 L114 260 L100 260 L86 260 L82 375 L68 375
    C70 340 72 300 72 260 L70 208 C62 205 58 200 58 190 L60 105
    C60 90 70 72 92 68 L92 62 C86 58 80 52 80 42 C80 30 88 20 100 20 Z"
    fill="var(--bg-input)" stroke="var(--border)" stroke-width="2"/>`;
}

function renderBody(view, highlightMuscles){
  const regions = view === 'back' ? BACK_REGIONS : FRONT_REGIONS;
  let blobs = '';
  for(const [muscle, r] of Object.entries(regions)){
    const active = highlightMuscles.includes(muscle);
    if(active){
      blobs += `<ellipse cx="${r.cx}" cy="${r.cy}" rx="${r.rx}" ry="${r.ry}"
        fill="#ff5a3c" opacity="0.85" filter="url(#glow)"/>`;
    }
  }
  return `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    ${bodyOutlinePath()}
    ${blobs}
  </svg>`;
}

/**
 * Retorna o HTML do boneco com a região muscular destacada.
 * @param {string[]} primaryMuscles - ex: ["chest", "triceps"]
 */
function getMuscleMapSVG(primaryMuscles){
  if(!primaryMuscles || primaryMuscles.length === 0){
    return renderBody('front', []);
  }
  // decide se mostra frente ou costas com base no primeiro músculo primário
  const view = MUSCLE_VIEW[primaryMuscles[0]] || 'front';
  return renderBody(view, primaryMuscles);
}
