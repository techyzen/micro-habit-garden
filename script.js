// Core functionality: add, render, water, remove, edit (no persistence yet)
const $ = sel => document.querySelector(sel);
const gardenEl = $('#garden');
const addForm = $('#addForm');
const nameInput = $('#habitName');
const goalInput = $('#habitGoal');
const toneSelect = $('#habitTone');
const clearAllBtn = $('#clearAll');
const exportBtn = $('#exportBtn');
const importBtn = $('#importBtn');
const importFile = $('#importFile');

let habits = []; // {id, name, goal, progress, tone, createdAt}

const toneToColor = {
  green: ['#8ae6bd','#2a8f6d'],
  teal: ['#8de1e1','#0f7a77'],
  rose: ['#ffc2d6','#b44a6c'],
  amber: ['#ffd8a8','#b36b00']
};

function uid(prefix='id') {
  return `${prefix}_${Math.random().toString(36).slice(2,9)}`;
}

function createHabit({name,goal,tone}){
  return {
    id: uid('h'),
    name: name.trim(),
    goal: Math.max(1, Number(goal) || 7),
    progress: 0,
    tone: tone || 'green',
    createdAt: Date.now()
  };
}

function renderGarden(){
  gardenEl.innerHTML = '';
  if(!habits.length){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No habits yet — plant one to start your garden 🌿';
    gardenEl.appendChild(empty);
    return;
  }

  habits.forEach(h => {
    const plant = document.createElement('div');
    plant.className = 'plant card';
    plant.style.minHeight = '140px';
    // plant inner
    plant.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div class="meta" style="font-weight:600">${escapeHtml(h.name)}</div>
        <div class="meta">${h.progress} / ${h.goal}</div>
      </div>
      <div style="height:64px;display:flex;align-items:flex-end;flex-direction:column;gap:6px;justify-content:center">
        <div style="display:flex;align-items:center;gap:6px;flex-direction:column">
          <div class="stem" style="height:${ calcStemHeight(h) }px"></div>
          <div class="pot"></div>
        </div>
      </div>
      <div class="controls" style="margin-top:6px">
        <button class="small" data-action="water" data-id="${h.id}">Water 💧</button>
        <button class="small" data-action="edit" data-id="${h.id}">Edit ✏️</button>
        <button class="small" data-action="remove" data-id="${h.id}" style="background:#fee2e2;color:#7a1a1a">Remove</button>
      </div>
    `;

    // apply color tone to stem and leaves
    const [bg, fg] = toneToColor[h.tone] || toneToColor.green;
    const stem = plant.querySelector('.stem');
    if(stem) stem.style.background = `linear-gradient(${fg}, ${bg})`;

    // attach events
    plant.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', e => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if(action === 'water') waterHabit(id);
        if(action === 'remove') removeHabit(id);
        if(action === 'edit') editHabitUI(id);
      });
    });

    gardenEl.appendChild(plant);
  });
}

function calcStemHeight(h){
  const max = 80; // px for fully grown
  const ratio = Math.min(1, h.progress / h.goal);
  return Math.round(ratio * max) + 8; // minimum
}

function addHabitFromForm(e){
  e.preventDefault();
  const name = nameInput.value;
  const goal = goalInput.value;
  const tone = toneSelect.value;
  if(!name.trim()) return;
  const h = createHabit({name,goal,tone});
  habits.push(h);
  nameInput.value = '';
  goalInput.value = '7';
  renderGarden();
}

function waterHabit(id){
  const h = habits.find(x => x.id === id);
  if(!h) return;
  if(h.progress < h.goal) h.progress += 1;
  renderGarden();
}

function removeHabit(id){
  habits = habits.filter(x => x.id !== id);
  renderGarden();
}

function editHabitUI(id){
  const h = habits.find(x => x.id === id);
  if(!h) return;
  const newName = prompt('Edit habit name', h.name);
  if(newName === null) return;
  h.name = newName.trim() || h.name;
  renderGarden();
}

addForm.addEventListener('submit', addHabitFromForm);
clearAllBtn.addEventListener('click', () => {
  if(confirm('Clear all habits?')) { habits = []; renderGarden(); }
});

exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(habits, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'micro-habit-garden.json'; a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if(!f) return;
  try {
    const text = await f.text();
    const parsed = JSON.parse(text);
    if(Array.isArray(parsed)) {
      habits = parsed.map(p => ({ ...p, id: p.id || uid('h') }));
      renderGarden();
    } else alert('Invalid file');
  } catch (err) { alert('Import failed'); }
});

// small helper
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

renderGarden();
