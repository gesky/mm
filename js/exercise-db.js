/* exercise-db.js
   Carrega a base pública free-exercise-db (yuhonas/free-exercise-db),
   guarda em cache no localStorage (~800 exercícios, não muda com frequência)
   e expõe uma função de busca simples. */

const EXERCISE_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const EXERCISE_IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const CACHE_KEY = 'mm_exercise_db_v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 dias

let exerciseDB = [];

async function loadExerciseDB(){
  try{
    const cached = localStorage.getItem(CACHE_KEY);
    if(cached){
      const parsed = JSON.parse(cached);
      if(Date.now() - parsed.timestamp < CACHE_TTL_MS){
        exerciseDB = parsed.data;
        return exerciseDB;
      }
    }
  }catch(e){ /* cache corrompido, ignora e busca de novo */ }

  const res = await fetch(EXERCISE_DB_URL);
  const data = await res.json();
  exerciseDB = data;
  try{
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  }catch(e){ /* localStorage cheio, tudo bem, segue sem cache */ }
  return exerciseDB;
}

function exerciseImageUrl(exercise){
  if(!exercise.images || exercise.images.length === 0) return '';
  return EXERCISE_IMG_BASE + exercise.images[0];
}

function searchExercises(query, limit = 30){
  if(!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();
  return exerciseDB
    .filter(ex => ex.name.toLowerCase().includes(q) ||
                  (ex.primaryMuscles || []).some(m => m.toLowerCase().includes(q)) ||
                  (ex.equipment || '').toLowerCase().includes(q))
    .slice(0, limit);
}
