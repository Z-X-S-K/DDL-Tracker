const DATA = window.PLAN_DATA;
const store = {
  get(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
};
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const today = () => new Date();
const parseDate = (s) => new Date(`${s}T00:00:00`);
const fmt = (date) => new Intl.DateTimeFormat('zh-CN', { month:'short', day:'numeric', weekday:'short' }).format(date);
const daysUntil = (dateStr) => Math.ceil((parseDate(dateStr) - today()) / 86400000);
const ymd = (d) => d.toISOString().slice(0,10);
function datePlus(dateStr, n){ const d=parseDate(dateStr); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10).replaceAll('-',''); }
function toICSDate(dateStr){ return dateStr.replaceAll('-',''); }
function escapeICS(text){ return String(text).replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n'); }

function initTheme(){
  const saved = store.get('applyos-theme', 'dark');
  if(saved === 'light') document.documentElement.classList.add('light');
  $('#themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    store.set('applyos-theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });
}

function renderHero(){
  const future = DATA.milestones
    .map(m => ({...m, days: daysUntil(m.date)}))
    .filter(m => m.days >= 0)
    .sort((a,b) => a.days-b.days)[0] || DATA.milestones[DATA.milestones.length-1];
  $('#nextMilestoneTitle').textContent = future.title;
  $('#nextMilestoneDate').textContent = `${future.date} · 还有 ${Math.max(0,future.days)} 天`;
  const start = parseDate(DATA.startDate), end = parseDate(DATA.finalSafetyDate), now = today();
  const progress = Math.min(100, Math.max(0, ((now-start)/(end-start))*100));
  $('#overallProgressBar').style.width = `${progress.toFixed(1)}%`;
  $('#overallProgressText').textContent = `距离最终安全线 ${DATA.finalSafetyDate}，整体时间已走过 ${progress.toFixed(1)}%。`;
}

function renderStrategy(){
  $('#strategyCards').innerHTML = DATA.coreStrategy.map(item => `
    <article class="strategy-card">
      <b>${item.title}</b>
      <p><strong>${item.hours}</strong></p>
      <p>${item.body}</p>
    </article>`).join('');
}

function getCurrentCycle(){
  const now = today();
  return DATA.cycles.find(c => parseDate(c.start) <= now && now <= parseDate(c.end)) ||
    DATA.cycles.find(c => parseDate(c.start) > now) || DATA.cycles[DATA.cycles.length-1];
}
function renderCurrentCycle(){
  const c = getCurrentCycle();
  const total = c.tasks.length;
  const progress = getCycleProgress(c.id, total);
  $('#currentCycleBox').innerHTML = `
    <span class="badge">${c.id}</span>
    <h4>${c.title}</h4>
    <p>${c.start} – ${c.end}</p>
    <p>${c.focus}</p>
    <div class="cycle-progress"><span style="width:${progress}%"></span></div>
    <p>${progress}% 已勾选 · 距周期截止 ${Math.max(0,daysUntil(c.end))} 天</p>`;
}
function recommendMode(){
  const cash = Number($('#cashDays').value || 0);
  const pt = Number($('#ptScore').value || 0);
  const stress = Number($('#stressScore').value || 0);
  const work = Number($('#workHours').value || 0);
  const firstBatchDays = daysUntil('2026-10-15');
  let title = 'Normal Mode：稳态推进';
  let bullets = ['LSAT每天2–4小时，继续按10天周期走。', 'Kairesa保持每周4小时，只做真实外联与案例沉淀。', '周日完整留空，不补债。'];
  if (stress >= 8) {
    title = 'Emergency Week：先恢复系统';
    bullets = ['暂停Kairesa 7天。', 'LSAT改为每天45–90分钟轻量复盘。', '睡眠、吃饭、低难度工作任务优先。'];
  } else if (cash < 30) {
    title = 'Survival Mode：现金流优先14天';
    bullets = ['工作/找工提高到每周40小时。', 'LSAT每天保底90分钟，只做错题和计时题组。', 'PhD只保留每周2小时；Kairesa只做能立刻带来收入的外联。'];
  } else if (pt < 160) {
    title = 'LSAT Rescue Mode：先救分数';
    bullets = ['每日LSAT提高到3小时以上，优先LR错题类型。', '暂时压缩PhD项目数量和Kairesa细节。', '若9月前仍低于160，主考延后到Nov/Jan。'];
  } else if (firstBatchDays <= 30 && firstBatchDays >= 0) {
    title = 'Application Sprint：第一批提交冲刺';
    bullets = ['Personal Statement、Resume、推荐信状态优先。', 'Kairesa暂停非收入任务。', 'Oct 15–Nov 1完成第一批rolling申请。'];
  } else if (work > 38) {
    title = 'Work-heavy Mode：工作过载保护';
    bullets = ['每天只保留一个LSAT深度块。', '写作改为隔天90分钟。', '不要牺牲11pm–7am睡眠。'];
  }
  $('#modeResult').innerHTML = `<strong>${title}</strong><ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
}

function renderSchools(filter='all'){
  const rows = DATA.lawSchools.filter(s => {
    if(filter === 'ed') return !s.ed.startsWith('无');
    if(filter === 'feb15') return s.regularLabel.includes('Feb 15') || s.regularLabel.includes('Feb 16');
    if(filter === 'later') return s.regularLabel.includes('Feb 28') || s.regularLabel.includes('Mar 1');
    return true;
  }).map(s => {
    const regularDate = s.regular.split('T')[0];
    const days = Math.max(0, daysUntil(regularDate));
    return `<tr>
      <td><strong>${s.rank}</strong></td>
      <td><strong>${s.school}</strong><br><span class="date-pill">Regular还有 ${days} 天</span></td>
      <td>${s.open}</td>
      <td>${s.regularLabel}</td>
      <td>${s.ed}</td>
      <td><strong>${s.internal}</strong><br><small>${s.internal === '2026-12-31' ? 'Yale可按12/31内部线' : 'Rolling第一批目标'}</small></td>
    </tr>`;
  }).join('');
  $('#schoolTable tbody').innerHTML = rows;
}
function setupSchoolFilters(){
  $$('.chip').forEach(btn => btn.addEventListener('click', () => {
    $$('.chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSchools(btn.dataset.schoolFilter);
  }));
}
function renderMilestones(){
  $('#milestoneGrid').innerHTML = DATA.milestones.map(m => {
    const d = daysUntil(m.date);
    const label = d >= 0 ? `还有 ${d} 天` : `已过 ${Math.abs(d)} 天`;
    return `<article class="milestone-card ${m.priority}">
      <div class="date">${m.date} · ${m.type}</div>
      <h3>${m.title}</h3>
      <p>${m.detail}</p>
      <span class="date-pill">${label}</span>
    </article>`;
  }).join('');
}
function renderWeekly(){
  const w = DATA.weeklyTemplate;
  $('#weeklyTemplate').innerHTML = `
    <article class="weekly-card"><h3>睡眠</h3><p>${w.sleep}</p></article>
    <article class="weekly-card"><h3>周一到周五</h3><ul>${w.weekday.map(x=>`<li>${x}</li>`).join('')}</ul></article>
    <article class="weekly-card"><h3>周六</h3><ul>${w.saturday.map(x=>`<li>${x}</li>`).join('')}</ul></article>
    <article class="weekly-card"><h3>周日</h3><p>${w.sunday}</p></article>`;
}
function renderLSAT(){
  $('#lsatGrid').innerHTML = DATA.lsatDates.map(l => `
    <article class="lsat-card">
      <h3>${l.name}</h3>
      <dl>
        <dt>考试窗口</dt><dd>${l.test}</dd>
        <dt>Writing开放</dt><dd>${l.writing}</dd>
        <dt>注册截止</dt><dd>${l.registration}</dd>
        <dt>Scheduling开放</dt><dd>${l.scheduling}</dd>
        <dt>出分</dt><dd>${l.score}</dd>
      </dl>
    </article>`).join('');
}
function getProgressState(){ return store.get('applyos-cycle-progress', {}); }
function getCycleProgress(id, total){
  const state = getProgressState();
  const done = Object.entries(state).filter(([key,val]) => key.startsWith(`${id}::`) && val).length;
  return Math.round(done / total * 100);
}
function renderCycles(search=''){
  const current = getCurrentCycle().id;
  const state = getProgressState();
  const q = search.trim().toLowerCase();
  const filtered = DATA.cycles.filter(c => JSON.stringify(c).toLowerCase().includes(q));
  $('#cycleList').innerHTML = filtered.map(c => {
    const progress = getCycleProgress(c.id, c.tasks.length);
    const tasks = c.tasks.map((t,i) => {
      const key = `${c.id}::${i}`;
      return `<label class="task-check"><input type="checkbox" data-task-key="${key}" ${state[key] ? 'checked' : ''}> <span>${t}</span></label>`;
    }).join('');
    return `<article class="cycle-card ${c.id === current ? 'current' : ''}">
      <div class="cycle-head"><div><h3>${c.id} · ${c.title}</h3><div class="cycle-date">${c.start} → ${c.end}</div></div><span class="date-pill">${progress}%</span></div>
      <p>${c.focus}</p>
      <div class="task-list">${tasks}</div>
      <div class="cycle-progress"><span style="width:${progress}%"></span></div>
    </article>`;
  }).join('');
  $$('[data-task-key]').forEach(box => box.addEventListener('change', e => {
    const state = getProgressState();
    state[e.target.dataset.taskKey] = e.target.checked;
    store.set('applyos-cycle-progress', state);
    renderCycles($('#cycleSearch').value);
    renderCurrentCycle();
  }));
}
function setupCycles(){
  $('#cycleSearch').addEventListener('input', e => renderCycles(e.target.value));
  $('#resetProgress').addEventListener('click', () => {
    if(confirm('确定清空所有周期勾选吗？')) { localStorage.removeItem('applyos-cycle-progress'); renderCycles($('#cycleSearch').value); renderCurrentCycle(); }
  });
}
function renderRules(){
  $('#rulesGrid').innerHTML = DATA.emergencyRules.map(r => `
    <article class="rule-card"><h3>${r.title}</h3><ul>${r.rules.map(x=>`<li>${x}</li>`).join('')}</ul></article>`).join('');
}
function renderSourceNotes(){
  $('#sourceNotes').innerHTML = DATA.sourceNotes.map(n => `<li>${n}</li>`).join('');
}
function getLogs(){ return store.get('applyos-daily-logs', []); }
function renderLogs(){
  const logs = getLogs().sort((a,b)=>b.date.localeCompare(a.date));
  const total = logs.length;
  const sum = (field) => logs.reduce((acc,l)=>acc+Number(l[field]||0),0);
  $('#logSummary').innerHTML = `
    <div><span>记录天数</span><strong>${total}</strong></div>
    <div><span>LSAT总小时</span><strong>${sum('lsat').toFixed(1)}</strong></div>
    <div><span>工作总小时</span><strong>${sum('work').toFixed(1)}</strong></div>
    <div><span>写作总字数</span><strong>${sum('words')}</strong></div>`;
  $('#logList').innerHTML = logs.slice(0,8).map(l => `
    <div class="log-item"><strong>${l.date}</strong> · LSAT ${l.lsat}h · Work ${l.work}h · Stress ${l.stress}/10
      <p>${l.score ? `分数/正确率：${l.score} · ` : ''}现金${l.cash}天 · 写作${l.words}字 · 外联${l.outreach}个</p>
      ${l.note ? `<p>${l.note}</p>` : ''}
    </div>`).join('') || '<p class="fineprint">还没有打卡记录。</p>';
}
function setupTracker(){
  $('#logDate').value = ymd(today());
  $('#dailyForm').addEventListener('submit', e => {
    e.preventDefault();
    const entry = {
      date: $('#logDate').value,
      lsat: Number($('#logLsat').value||0),
      score: $('#logScore').value.trim(),
      work: Number($('#logWork').value||0),
      cash: Number($('#logCash').value||0),
      words: Number($('#logWords').value||0),
      outreach: Number($('#logOutreach').value||0),
      stress: Number($('#logStress').value||0),
      note: $('#logNote').value.trim()
    };
    const logs = getLogs().filter(l => l.date !== entry.date);
    logs.push(entry);
    store.set('applyos-daily-logs', logs);
    renderLogs();
    $('#logNote').value = '';
  });
  $('#exportCsv').addEventListener('click', () => {
    const logs = getLogs().sort((a,b)=>a.date.localeCompare(b.date));
    const header = ['date','lsat_hours','score_or_accuracy','work_hours','cash_days','writing_words','kairesa_outreach','stress','note'];
    const rows = logs.map(l => [l.date,l.lsat,l.score,l.work,l.cash,l.words,l.outreach,l.stress,l.note].map(v => `"${String(v??'').replaceAll('"','""')}"`).join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'applyos-daily-log.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });
}
function generateICS(){
  const events = [];
  DATA.milestones.forEach(m => events.push({date:m.date, title:`${m.type}: ${m.title}`, detail:m.detail}));
  DATA.cycles.forEach(c => events.push({date:c.end, title:`${c.id} 截止：${c.title}`, detail:`${c.focus}\n${c.tasks.join('\n')}`}));
  DATA.lawSchools.forEach(s => events.push({date:s.internal, title:`JD内部线：${s.school}`, detail:`目标内部提交线。Regular: ${s.regularLabel}. ED/特殊: ${s.ed}`}));
  const body = events.map((e, idx) => `BEGIN:VEVENT\nUID:applyos-${idx}-${toICSDate(e.date)}@kairesa\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nDTSTART;VALUE=DATE:${toICSDate(e.date)}\nDTEND;VALUE=DATE:${datePlus(e.date,1)}\nSUMMARY:${escapeICS(e.title)}\nDESCRIPTION:${escapeICS(e.detail)}\nBEGIN:VALARM\nTRIGGER:-P1D\nACTION:DISPLAY\nDESCRIPTION:${escapeICS('明天截止：' + e.title)}\nEND:VALARM\nEND:VEVENT`).join('\n');
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Kairesa//ApplyOS//ZH\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${body}\nEND:VCALENDAR`;
}
function setupICS(){
  $('#downloadIcsBtn').addEventListener('click', () => {
    const blob = new Blob([generateICS()], {type:'text/calendar;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'applyos-key-milestones.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  });
}
function boot(){
  initTheme(); renderHero(); renderStrategy(); renderCurrentCycle(); recommendMode(); renderSchools(); setupSchoolFilters(); renderMilestones(); renderWeekly(); renderLSAT(); renderCycles(); setupCycles(); renderRules(); renderSourceNotes(); setupTracker(); renderLogs(); setupICS();
  ['cashDays','ptScore','stressScore','workHours'].forEach(id => $('#'+id).addEventListener('input', recommendMode));
}
boot();
