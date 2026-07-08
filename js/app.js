/* app.js — Muscle Memory
   Esqueleto funcional: treinos flexíveis (A/B/C/D escolhidos na hora),
   checklist do dia, busca de exercícios na base pública, metas de carga.
   Vanilla JS + Firestore (mesmo padrão do Finn / Plane Aviation). */

// ---------- STATE ----------
let treinos = [];              // [{id, nome, exercicios:[...]}]
let todaySession = { treinoId: null, checks: {} }; // checks[itemId] = {feito, peso}
let editingTreinoId = null;    // treino sendo editado na view detail
let pendingExercise = null;    // exercício selecionado no picker, aguardando confirmação

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ---------- INIT ----------
async function init(){
  await currentUserReady;
  loadExerciseDB(); // não precisa esperar pra desenhar a tela
  await loadTreinos();
  await loadTodaySession();
  renderHome();
  renderTreinosView();
  renderMetas();
  setupNav();
  setupModals();
}

async function loadTreinos(){
  const snap = await db.collection('treinos').orderBy('criadoEm', 'asc').get();
  treinos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function loadTodaySession(){
  const doc = await db.collection('sessions').doc(todayKey()).get();
  if(doc.exists){
    todaySession = doc.data();
  } else {
    todaySession = { treinoId: null, checks: {} };
  }
}

async function saveTodaySession(){
  await db.collection('sessions').doc(todayKey()).set(todaySession);
}

function getTreino(id){
  return treinos.find(t => t.id === id);
}

// ---------- NAV ----------
function setupNav(){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => goToView(btn.dataset.view));
  });
}

function goToView(view){
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  if(view === 'home'){
    document.getElementById('view-home').classList.remove('hidden');
  } else if(view === 'treinos'){
    document.getElementById('view-treinos').classList.remove('hidden');
    renderTreinosView();
  } else if(view === 'metas'){
    document.getElementById('view-metas').classList.remove('hidden');
    renderMetas();
  } else if(view === 'treino-detail'){
    document.getElementById('view-treino-detail').classList.remove('hidden');
  }

  const navBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
  if(navBtn) navBtn.classList.add('active');
}

// ---------- HOME ----------
function renderHome(){
  const picker = document.getElementById('treinoPicker');
  const emptyState = document.getElementById('homeEmptyState');
  const activeBlock = document.getElementById('activeTreinoBlock');

  if(treinos.length === 0){
    picker.innerHTML = '';
    emptyState.classList.remove('hidden');
    activeBlock.classList.add('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  picker.innerHTML = treinos.map(t => `
    <button class="treino-chip ${todaySession.treinoId === t.id ? 'selected' : ''}" data-id="${t.id}">
      ${escapeHtml(t.nome || 'Sem nome')}
      <span class="sub">${(t.exercicios||[]).length} exercício${(t.exercicios||[]).length === 1 ? '' : 's'}</span>
    </button>
  `).join('');

  picker.querySelectorAll('.treino-chip').forEach(chip => {
    chip.addEventListener('click', () => selectTreinoForToday(chip.dataset.id));
  });

  if(todaySession.treinoId && getTreino(todaySession.treinoId)){
    renderExerciseChecklist();
    activeBlock.classList.remove('hidden');
  } else {
    activeBlock.classList.add('hidden');
  }
}

async function selectTreinoForToday(id){
  todaySession.treinoId = id;
  todaySession.checks = todaySession.checks || {};
  await saveTodaySession();
  renderHome();
}

function renderExerciseChecklist(){
  const treino = getTreino(todaySession.treinoId);
  const label = document.getElementById('activeTreinoLabel');
  const list = document.getElementById('exerciseChecklist');
  label.textContent = treino.nome || 'Treino';

  list.innerHTML = (treino.exercicios || []).map(ex => {
    const check = todaySession.checks[ex.itemId] || {};
    const peso = check.peso !== undefined ? check.peso : ex.pesoAtual;
    return `
    <div class="exercise-check-item ${check.feito ? 'done' : ''}" data-item="${ex.itemId}">
      <div class="check-circle ${check.feito ? 'checked' : ''}" data-action="toggle">${check.feito ? '✓' : ''}</div>
      <img src="${ex.imagem || ''}" alt="" onerror="this.style.opacity=0">
      <div class="info">
        <div class="name ${check.feito ? 'done' : ''}">${escapeHtml(ex.nome)}</div>
        <div class="meta">${ex.series || '?'}x${escapeHtml(ex.reps || '?')}</div>
      </div>
      <input class="weight-input" type="number" step="0.5" value="${peso ?? ''}" placeholder="kg" data-action="weight">
    </div>`;
  }).join('');

  list.querySelectorAll('.exercise-check-item').forEach(item => {
    const itemId = item.dataset.item;
    item.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleCheck(itemId));
    item.querySelector('[data-action="weight"]').addEventListener('change', (e) => updateWeight(itemId, e.target.value));
  });
}

async function toggleCheck(itemId){
  const current = todaySession.checks[itemId] || {};
  todaySession.checks[itemId] = { ...current, feito: !current.feito };
  await saveTodaySession();
  renderExerciseChecklist();
}

async function updateWeight(itemId, value){
  const current = todaySession.checks[itemId] || {};
  const peso = parseFloat(value) || 0;
  todaySession.checks[itemId] = { ...current, peso };
  await saveTodaySession();

  // também atualiza o "peso atual" oficial do exercício no treino
  const treino = getTreino(todaySession.treinoId);
  const ex = treino.exercicios.find(e => e.itemId === itemId);
  if(ex){
    ex.pesoAtual = peso;
    await db.collection('treinos').doc(treino.id).update({ exercicios: treino.exercicios });
    renderMetas();
  }
}

// ---------- TREINOS (gerenciar lista) ----------
function renderTreinosView(){
  const list = document.getElementById('treinoList');
  list.innerHTML = treinos.map(t => `
    <div class="treino-list-item" data-id="${t.id}">
      <div>
        <div class="name">${escapeHtml(t.nome || 'Sem nome')}</div>
        <div class="count">${(t.exercicios||[]).length} exercício${(t.exercicios||[]).length === 1 ? '' : 's'}</div>
      </div>
      <div class="chevron">›</div>
    </div>
  `).join('');

  list.querySelectorAll('.treino-list-item').forEach(item => {
    item.addEventListener('click', () => openTreinoDetail(item.dataset.id));
  });

  document.getElementById('btnNovoTreino').onclick = createNovoTreino;
}

async function createNovoTreino(){
  const letras = ['A','B','C','D','E','F'];
  const letra = letras[treinos.length] || (treinos.length + 1);
  const docRef = await db.collection('treinos').add({
    nome: `Treino ${letra}`,
    exercicios: [],
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });
  treinos.push({ id: docRef.id, nome: `Treino ${letra}`, exercicios: [] });
  openTreinoDetail(docRef.id);
}

function openTreinoDetail(id){
  editingTreinoId = id;
  const treino = getTreino(id);
  document.getElementById('treinoNameInput').value = treino.nome || '';
  renderExerciseEditList();
  goToView('treino-detail');
}

function renderExerciseEditList(){
  const treino = getTreino(editingTreinoId);
  const list = document.getElementById('exerciseEditList');
  list.innerHTML = (treino.exercicios || []).map(ex => `
    <div class="exercise-edit-item" data-item="${ex.itemId}">
      <img src="${ex.imagem || ''}" alt="" onerror="this.style.opacity=0">
      <div class="info">
        <div class="name">${escapeHtml(ex.nome)}</div>
        <div class="meta">${ex.series || '?'}x${escapeHtml(ex.reps || '?')} · atual ${ex.pesoAtual ?? 0}kg${ex.pesoMeta ? ' · meta ' + ex.pesoMeta + 'kg' : ''}</div>
      </div>
      <button class="btn-remove" data-action="remove">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.exercise-edit-item').forEach(item => {
    item.querySelector('[data-action="remove"]').addEventListener('click', () => removeExercicio(item.dataset.item));
  });
}

async function saveTreinoNome(){
  const treino = getTreino(editingTreinoId);
  const nome = document.getElementById('treinoNameInput').value.trim();
  treino.nome = nome;
  await db.collection('treinos').doc(treino.id).update({ nome });
  renderTreinosView();
  renderHome();
}

async function removeExercicio(itemId){
  const treino = getTreino(editingTreinoId);
  treino.exercicios = treino.exercicios.filter(e => e.itemId !== itemId);
  await db.collection('treinos').doc(treino.id).update({ exercicios: treino.exercicios });
  renderExerciseEditList();
  renderTreinosView();
  renderMetas();
}

async function deleteTreino(){
  const treino = getTreino(editingTreinoId);
  if(!confirm(`Excluir "${treino.nome}"? Essa ação não pode ser desfeita.`)) return;
  await db.collection('treinos').doc(treino.id).delete();
  treinos = treinos.filter(t => t.id !== treino.id);
  if(todaySession.treinoId === treino.id){
    todaySession.treinoId = null;
    await saveTodaySession();
  }
  goToView('treinos');
  renderTreinosView();
  renderHome();
}

// ---------- MODAIS: buscar / adicionar exercício ----------
function setupModals(){
  document.getElementById('btnBackToTreinos').addEventListener('click', () => goToView('treinos'));
  document.getElementById('treinoNameInput').addEventListener('blur', saveTreinoNome);
  document.getElementById('btnDeleteTreino').addEventListener('click', deleteTreino);

  document.getElementById('btnAddExercicio').addEventListener('click', openExercisePicker);
  document.getElementById('btnCloseExercisePicker').addEventListener('click', closeExercisePicker);

  document.getElementById('btnCloseConfirmModal').addEventListener('click', closeConfirmModal);
  document.getElementById('btnConfirmAddExercicio').addEventListener('click', confirmAddExercicio);

  let debounceTimer;
  document.getElementById('exerciseSearchInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderSearchResults(e.target.value), 200);
  });
}

function openExercisePicker(){
  document.getElementById('exercisePickerModal').classList.remove('hidden');
  document.getElementById('exerciseSearchInput').value = '';
  document.getElementById('exerciseSearchResults').innerHTML = '<div class="search-hint">Digite para buscar entre mais de 800 exercícios.</div>';
  document.getElementById('exerciseSearchInput').focus();
}

function closeExercisePicker(){
  document.getElementById('exercisePickerModal').classList.add('hidden');
}

function renderSearchResults(query){
  const container = document.getElementById('exerciseSearchResults');
  const results = searchExercises(query);
  if(query.trim().length === 0){
    container.innerHTML = '<div class="search-hint">Digite para buscar entre mais de 800 exercícios.</div>';
    return;
  }
  if(results.length === 0){
    container.innerHTML = '<div class="search-hint">Nenhum exercício encontrado.</div>';
    return;
  }
  container.innerHTML = results.map((ex, i) => `
    <div class="exercise-result-item" data-idx="${i}">
      <img src="${exerciseImageUrl(ex)}" alt="" onerror="this.style.opacity=0">
      <div class="info">
        <div class="name">${escapeHtml(ex.name)}</div>
        <div class="muscle">${(ex.primaryMuscles||[]).join(', ')}</div>
        <div class="equip">${escapeHtml(ex.equipment || '')}</div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.exercise-result-item').forEach(item => {
    item.addEventListener('click', () => openConfirmModal(results[item.dataset.idx]));
  });
}

function openConfirmModal(exercise){
  pendingExercise = exercise;
  document.getElementById('confirmExerciseName').textContent = exercise.name;
  document.getElementById('confirmExerciseImg').src = exerciseImageUrl(exercise);
  document.getElementById('confirmMuscleMap').innerHTML = getMuscleMapSVG(exercise.primaryMuscles);
  document.getElementById('confirmSeries').value = 3;
  document.getElementById('confirmReps').value = '10-12';
  document.getElementById('confirmPeso').value = '';
  document.getElementById('confirmMeta').value = '';
  document.getElementById('exerciseConfirmModal').classList.remove('hidden');
}

function closeConfirmModal(){
  document.getElementById('exerciseConfirmModal').classList.add('hidden');
  pendingExercise = null;
}

async function confirmAddExercicio(){
  if(!pendingExercise) return;
  const treino = getTreino(editingTreinoId);
  const item = {
    itemId: 'ex_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    exercicioDbId: pendingExercise.id,
    nome: pendingExercise.name,
    imagem: exerciseImageUrl(pendingExercise),
    primaryMuscles: pendingExercise.primaryMuscles || [],
    series: parseInt(document.getElementById('confirmSeries').value) || 3,
    reps: document.getElementById('confirmReps').value || '',
    pesoAtual: parseFloat(document.getElementById('confirmPeso').value) || 0,
    pesoMeta: parseFloat(document.getElementById('confirmMeta').value) || null,
  };
  treino.exercicios = treino.exercicios || [];
  treino.exercicios.push(item);
  await db.collection('treinos').doc(treino.id).update({ exercicios: treino.exercicios });

  closeConfirmModal();
  closeExercisePicker();
  renderExerciseEditList();
  renderTreinosView();
  renderMetas();
}

// ---------- METAS ----------
function renderMetas(){
  const list = document.getElementById('metasList');
  const emptyState = document.getElementById('metasEmptyState');

  const todosExercicios = treinos.flatMap(t => (t.exercicios || []).map(ex => ({ ...ex, treinoNome: t.nome })));
  const comMeta = todosExercicios.filter(ex => ex.pesoMeta);

  if(todosExercicios.length === 0){
    list.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  if(comMeta.length === 0){
    list.innerHTML = '<div class="empty-state"><p>Nenhum exercício com meta definida ainda. Edite um exercício no treino e defina uma meta de peso.</p></div>';
    return;
  }

  list.innerHTML = comMeta.map(ex => {
    const pct = Math.min(100, Math.round((ex.pesoAtual / ex.pesoMeta) * 100));
    return `
    <div class="meta-item">
      <div class="name">${escapeHtml(ex.nome)} <span style="color:var(--text-faint); font-weight:400;">· ${escapeHtml(ex.treinoNome)}</span></div>
      <div class="meta-progress-track"><div class="meta-progress-fill" style="width:${pct}%"></div></div>
      <div class="nums"><span>${ex.pesoAtual}kg atual</span><span>${pct}%</span><span>meta ${ex.pesoMeta}kg</span></div>
    </div>`;
  }).join('');
}

// ---------- UTIL ----------
function escapeHtml(str){
  if(str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

init();
