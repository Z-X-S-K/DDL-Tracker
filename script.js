(() => {
  const DATA = window.APPLYOS_DATA;
  const KEY = 'applyos_checkins_v2';
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  const parse = s => new Date(s + 'T00:00:00');
  const fmt = s => new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',weekday:'short'}).format(parse(s));
  const uid = () => Math.random().toString(36).slice(2,10);
  let state = load();

  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2300); }
  function currentCycle(d=todayISO()){
    const dt = parse(d);
    return DATA.cycles.find(c => dt >= parse(c.start) && dt <= parse(c.end)) || DATA.cycles.find(c => dt < parse(c.start)) || DATA.cycles.at(-1);
  }
  function dayIndex(c, d){ return Math.floor((parse(d)-parse(c.start))/(86400000)); }
  function plannedDay(d){ const c=currentCycle(d); const idx=dayIndex(c,d); return {cycle:c, day:c.days[Math.max(0, Math.min(c.days.length-1, idx))], index:idx}; }
  function relevantFields(type){
    const base = [
      ['status','完成状态','select',['完成','部分完成','跳过','休息/不适用']],
      ['stress','压力 1–10','number'],
      ['sleep','睡眠小时','number'],
      ['cashDays','现金可支撑天数','number'],
      ['workHours','工作/兼职小时','number'],
    ];
    const map = {
      LSAT:[['lsatHours','LSAT学习小时','number'],['lsatMode','LSAT类型','select',['LR','RC','Drill','Review','Timed Set']],['wrongReview','错题复盘数量','number'],['accuracy','Timed Set正确率，可选','number']],
      PT:[['lsatHours','LSAT/PT总小时','number'],['ptScore','PT分数，可选','number'],['wrongReview','错题复盘数量','number'],['accuracy','分段正确率，可选','number']],
      Writing:[['docType','文档类型','select',['Personal Statement','SOP','Resume/CV','Why X','Diversity/Optional','Writing Sample','素材整理']],['writingStatus','文档进度','select',['大纲','初稿','修改','定稿','卡住']],['words','新增/修改字数，可选','number']],
      DeepWork:[['docType','深度块对象','select',['Writing Sample','Research Article','Personal Statement','SOP','Application Packet']],['writingStatus','进度','select',['大纲','初稿','修改','定稿','卡住']],['words','新增/修改字数，可选','number']],
      Application:[['appItem','申请阻塞项','select',['CAS/成绩单','推荐信','Fee Waiver','学校要求表','Why X','奖学金材料','提交检查']],['appDone','处理结果','select',['已解决','部分解决','发现新阻塞','延后']]],
      Kairesa:[['outreach','外联数量','number'],['kairesaAsset','资产/动作','select',['服务页','案例页','客户对接','报价/合同','内容发布','无']]],
      Cash:[['cashAction','现金流动作','select',['兼职/工作','找工','投递','小单交付','预算复盘','无']],['cashRisk','现金流风险','select',['安全','30天以下','14天以下','紧急']]],
      Planning:[['aTasks','本周期A类任务数量','number']],
      Close:[['closedATask','今天清掉的A类任务','text']],
      Review:[['cycleCompletion','本周期完成度%','number'],['recoveryNeeded','是否需要恢复日历','select',['不需要','需要轻度恢复','需要Recovery Cycle','需要Survival Mode']]],
      Rest:[['restQuality','是否真正休息','select',['是','部分','没有']],['energy','精力 1–10','number']]
    };
    return [...base, ...(map[type] || [])];
  }
  function inputFor([name,label,type,opts], value=''){
    if(type==='select') return `<div class="field"><label>${label}</label><select name="${name}">${opts.map(o=>`<option ${value===o?'selected':''}>${o}</option>`).join('')}</select></div>`;
    if(type==='text') return `<div class="field"><label>${label}</label><input name="${name}" value="${escapeHTML(value)}" /></div>`;
    return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" step="0.1" value="${escapeHTML(value)}" /></div>`;
  }
  function escapeHTML(s){ return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function renderHero(){
    const d=$('#selectedDate').value || todayISO(); const {cycle, day, index}=plannedDay(d);
    const daysLeft = Math.ceil((parse('2027-02-15') - parse(d))/86400000);
    $('#heroStatus').innerHTML = `<div class="heroStat"><div><p class="eyebrow">Current Cycle</p><div class="bigNumber">${cycle.id}</div><p>${cycle.title}</p></div><div><p class="eyebrow">Today Type</p><span class="taskType">${day.type}</span><p class="muted">Day ${index+1} · ${fmt(d)}</p></div><div><p class="eyebrow">Safety Line</p><strong>${Math.max(0,daysLeft)} days to 2027-02-15</strong></div></div>`;
  }
  function renderToday(){
    const d=$('#selectedDate').value || todayISO(); const {cycle, day, index}=plannedDay(d);
    $('#todayCard').innerHTML = `<div><span class="taskType">${day.type}</span><span class="taskType">${cycle.id} Day ${index+1}</span></div><h3 class="todayTitle">${day.label}</h3><p class="muted">${cycle.start} → ${cycle.end} · ${cycle.title} · ${day.time}</p><p><strong>最低可执行版：</strong>${day.minimum}</p><ul class="taskList">${day.tasks.map(t=>`<li>${t}</li>`).join('')}</ul>`;
    renderForm(); renderHero(); renderSummary();
  }
  function renderForm(){
    const d=$('#selectedDate').value || todayISO(); const {day,cycle}=plannedDay(d); const existing=state[d] || {}; const fields=relevantFields(day.type);
    $('#checkinForm').innerHTML = `<input type="hidden" name="date" value="${d}"><input type="hidden" name="cycle" value="${cycle.id}"><input type="hidden" name="taskType" value="${day.type}"><div class="formGrid">${fields.map(f=>inputFor(f, existing[f[0]])).join('')}<div class="field full"><label>今日备注 / 卡点</label><textarea name="note">${escapeHTML(existing.note||'')}</textarea></div></div><div class="actions"><button class="button" type="submit">保存今日打卡</button><span class="hint">数据只存在当前浏览器。</span></div>`;
  }
  function entriesForCycle(c){
    const s=parse(c.start), e=parse(c.end); return Object.entries(state).filter(([d])=>parse(d)>=s && parse(d)<=e).map(([date,data])=>({date,...data}));
  }
  function summarizeCycle(c=currentCycle($('#selectedDate').value || todayISO())){
    const entries=entriesForCycle(c);
    const done=entries.filter(e=>e.status==='完成').length;
    const partial=entries.filter(e=>e.status==='部分完成').length;
    const completion = Math.round(((done + partial*.5)/Math.max(1,c.days.length))*100);
    const nums = k => entries.map(e=>Number(e[k]||0)).filter(n=>!isNaN(n));
    const sum = k => nums(k).reduce((a,b)=>a+b,0);
    const avg = k => { const ns=nums(k).filter(n=>n>0); return ns.length ? ns.reduce((a,b)=>a+b,0)/ns.length : 0; };
    const minCash = nums('cashDays').filter(n=>n>0).sort((a,b)=>a-b)[0] || null;
    return {entries, done, partial, completion, lsatHours:sum('lsatHours'), wrongReview:sum('wrongReview'), workHours:sum('workHours'), avgStress:avg('stress'), minCash, writingWords:sum('words'), ptScores:entries.filter(e=>e.ptScore).map(e=>Number(e.ptScore))};
  }
  function recoveryMode(sum){
    if(sum.minCash !== null && sum.minCash < 14) return 'Survival Mode';
    if(sum.avgStress >= 8) return 'Emergency Week';
    if(sum.completion < 50) return 'Recovery Cycle';
    if(sum.completion < 80) return 'Light Recovery';
    return 'Normal';
  }
  function renderSummary(){
    const c=currentCycle($('#selectedDate').value || todayISO()); const s=summarizeCycle(c); const mode=recoveryMode(s);
    $('#summary').innerHTML = `<p><strong>${c.id} · ${c.title}</strong></p><div class="meter"><span style="width:${Math.min(100,s.completion)}%"></span></div><p class="muted">完成度 ${s.completion}% · 模式判断：<strong>${mode}</strong></p><div class="metricGrid"><div class="metric"><strong>${s.lsatHours.toFixed(1)}</strong><span>LSAT小时</span></div><div class="metric"><strong>${s.wrongReview}</strong><span>错题复盘</span></div><div class="metric"><strong>${s.workHours.toFixed(1)}</strong><span>工作小时</span></div><div class="metric"><strong>${s.avgStress.toFixed(1)}</strong><span>平均压力</span></div></div><p class="hint">第10天主日历会提醒你做总结；恢复日历只在需要时生成。</p>`;
  }
  function saveForm(e){
    e.preventDefault(); const fd=new FormData(e.target); const obj={}; for(const [k,v] of fd.entries()) obj[k]=v; state[obj.date]=obj; save(); toast('已保存今日打卡'); renderAll();
  }
  function renderCycles(filter='all'){
    const d=$('#selectedDate').value || todayISO(); const now=parse(d); const cur=currentCycle(d);
    const list=DATA.cycles.filter(c=> filter==='all' || (filter==='current' && c.id===cur.id) || (filter==='upcoming' && parse(c.end)>=now));
    $('#cycleList').innerHTML = list.map(c=>{
      const s=summarizeCycle(c); const open=c.id===cur.id;
      return `<article class="cycle ${open?'open':''}" data-cycle="${c.id}"><div class="cycleHead"><div class="cycleId">${c.id}</div><div><div class="cycleTitle">${c.title}</div><div class="cycleMeta">${c.start} → ${c.end} · ${c.focus}</div></div><div class="pill">${s.completion}%</div></div><div class="cycleBody"><p><strong>必须完成：</strong>${c.mustComplete.join('；')}</p><div class="dayGrid">${c.days.map(day=>`<div class="dayCard"><div class="dayNum">Day ${day.day} · ${fmt(day.date)}</div><h4>${day.label}</h4><p>${day.type} · ${day.time}</p></div>`).join('')}</div></div></article>`;
    }).join('');
    $$('.cycleHead').forEach(h=>h.addEventListener('click',()=>h.closest('.cycle').classList.toggle('open')));
  }
  function renderSchools(){
    $('#schoolTable').innerHTML = `<thead><tr><th>学校</th><th>开放</th><th>Regular</th><th>ED / 特殊</th><th>内部目标</th></tr></thead><tbody>${DATA.schools.map(s=>`<tr><td><strong>${s.school}</strong></td><td>${s.open}</td><td>${s.regular}</td><td>${s.special}</td><td>${s.internal}</td></tr>`).join('')}</tbody>`;
  }
  function renderTimeline(){
    const events=[...DATA.milestones, ...(DATA.schoolEvents||[]), ...DATA.lsat].sort((a,b)=>a.date.localeCompare(b.date));
    $('#timeline').innerHTML=events.map(e=>`<div class="timelineItem"><div class="timelineDate">${e.date}</div><div><div class="timelineLabel">${e.label}</div><span class="taskType">${e.type}</span></div></div>`).join('');
  }
  function updateCalendarLinks(){
    const href = new URL('plan.ics', window.location.href).href;
    $('#icsUrl').textContent = href;
    $('#icsLink').href = href;
    $('#webcalLink').href = href.replace(/^https?:\/\//,'webcal://');
  }
  function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');}
  function makeEvent(summary, date, description, time='193000', durationMinutes=90){
    const dt = date.replace(/-/g,'') + 'T' + time;
    const endDate = new Date(date+'T00:00:00');
    const hh=Number(time.slice(0,2)), mm=Number(time.slice(2,4));
    endDate.setHours(hh, mm + durationMinutes, 0, 0);
    const end = endDate.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    return ['BEGIN:VEVENT',`UID:${uid()}@applyos`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=America/Los_Angeles:${dt}`,`DTEND:${end}`,`SUMMARY:${icsEscape(summary)}`,`DESCRIPTION:${icsEscape(description)}`,'BEGIN:VALARM','TRIGGER:-PT12H','ACTION:DISPLAY',`DESCRIPTION:${icsEscape(summary)}`,'END:VALARM','END:VEVENT'].join('\r\n');
  }
  function generateRecoveryICS(){
    const d=$('#selectedDate').value || todayISO(); const c=currentCycle(d); const s=summarizeCycle(c); const mode=recoveryMode(s);
    const start = new Date(parse(d).getTime()+86400000); const events=[];
    const incomplete = c.days.filter(day => parse(day.date) <= parse(d) && !(state[day.date]?.status === '完成')).slice(0,5);
    for(let i=0;i<14;i++){
      const cur = new Date(start.getTime()+i*86400000); const iso = cur.toISOString().slice(0,10); const dow=cur.getDay();
      let title, desc, time='193000', dur=90;
      if(dow===0){ title='Recovery · 自由日保护'; desc='不补债。只做10分钟明日确认，保持睡眠。'; time='203000'; dur=30; }
      else if(i<2 && incomplete.length){ const task=incomplete[i%incomplete.length]; title=`Recovery · 补 ${task.label}`; desc=`来源：${c.id} 未完成任务。最低版：${task.minimum}\n任务：${task.tasks.join('；')}`; }
      else if(mode==='Survival Mode'){ title='Survival Mode · 现金流优先'; desc='现金流低于安全线。今天优先工作/找工/小单交付；LSAT只保留45–90分钟维护。'; time='100000'; dur=180; }
      else if(mode==='Emergency Week'){ title='Emergency Week · 低强度恢复'; desc='压力过高。只保留睡眠、吃饭、45分钟轻复盘，不做重大决定。'; dur=45; }
      else if(mode==='Recovery Cycle'){ title='Recovery Cycle · A类任务清账'; desc='完成度低于50%。只清JD/LSAT/现金流A类任务，暂停Kairesa和非必要PhD扩展。'; }
      else if(mode==='Light Recovery'){ title='Light Recovery · 前置补救块'; desc='完成度50–79%。用90分钟补一个A类缺口，然后恢复主计划。'; }
      else { title='ApplyOS · 正常推进块'; desc='状态正常。按主计划执行当天任务，不额外补债。'; }
      events.push(makeEvent(title, iso, desc, time, dur));
    }
    const cal = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ApplyOS//Recovery Calendar//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:ApplyOS Recovery','X-WR-TIMEZONE:America/Los_Angeles', ...events, 'END:VCALENDAR'].join('\r\n');
    downloadText(`applyos-recovery-${d}.ics`, cal, 'text/calendar;charset=utf-8');
    toast(`已生成恢复日历：${mode}`);
  }
  function recoveryNotes(){ const c=currentCycle($('#selectedDate').value||todayISO()); const s=summarizeCycle(c); const mode=recoveryMode(s); return `${c.id} ${c.title}\n完成度：${s.completion}%\n模式：${mode}\nLSAT小时：${s.lsatHours.toFixed(1)}\n工作小时：${s.workHours.toFixed(1)}\n平均压力：${s.avgStress.toFixed(1)}\n建议：${mode==='Normal'?'按主计划推进，不补债。':mode==='Light Recovery'?'下一周期前2天补A类任务。':mode==='Recovery Cycle'?'暂停Kairesa/非必要PhD，只保JD+LSAT+现金流。':mode==='Survival Mode'?'现金流优先14天，LSAT最低维护。':'降低强度，保护睡眠和恢复。'}`; }
  function downloadText(name, text, type='text/plain'){ const blob=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},100); }
  function exportJson(){ downloadText('applyos-checkins.json', JSON.stringify(state,null,2), 'application/json'); }
  function exportCsv(){
    const keys=[...new Set(Object.values(state).flatMap(o=>Object.keys(o)))]; const rows=[keys.join(',')].concat(Object.values(state).map(o=>keys.map(k=>`"${String(o[k]||'').replace(/"/g,'""')}"`).join(','))); downloadText('applyos-checkins.csv', rows.join('\n'), 'text/csv;charset=utf-8');
  }
  function renderAll(){ renderHero(); renderToday(); renderCycles($('.chip.active')?.dataset.filter || 'all'); renderSchools(); renderTimeline(); updateCalendarLinks(); }

  document.addEventListener('DOMContentLoaded',()=>{
    $('#selectedDate').value=todayISO(); renderAll();
    $('#selectedDate').addEventListener('change',renderToday);
    $('#checkinForm').addEventListener('submit',saveForm);
    $('#clearToday').addEventListener('click',()=>{ const d=$('#selectedDate').value; delete state[d]; save(); renderAll(); toast('已清空今天记录'); });
    $$('.chip').forEach(b=>b.addEventListener('click',()=>{ $$('.chip').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderCycles(b.dataset.filter); }));
    $('#makeRecovery').addEventListener('click',generateRecoveryICS);
    $('#copyRecoveryNotes').addEventListener('click',async()=>{ await navigator.clipboard.writeText(recoveryNotes()); toast('已复制恢复建议'); });
    $('#exportJson').addEventListener('click',exportJson); $('#exportCsv').addEventListener('click',exportCsv);
    $('#resetData').addEventListener('click',()=>{ if(confirm('确定清空本浏览器所有打卡数据？')){state={};save();renderAll();toast('已清空');} });
  });
})();
