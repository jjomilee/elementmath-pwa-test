(() => {
  'use strict';
  const KEY = 'elementmath-records-v1';
  const mode = decodeURIComponent(location.pathname).split('/').pop().replace(/\.html$/, '') || 'index';
  let storageFailed = false;
  function read() {
    try { const data = JSON.parse(localStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; }
    catch { storageFailed = true; return {}; }
  }
  function save(kind, data) {
    if (!data.total) return;
    try {
      const records = read();
      records[mode] = {kind, title:document.title, date:new Date().toISOString(), ...data};
      localStorage.setItem(KEY, JSON.stringify(records));
    } catch { storageFailed = true; }
    renderRecords();
  }
  window.MathApp = {
    savePractice: data => save('practice', data),
    saveTest: data => save('test', data),
    loadPractice: () => {
      const item = read()[mode];
      if (!item || item.kind !== 'practice' || !Array.isArray(item.wrongProblems)) return null;
      if (![item.total,item.correct,item.wrong].every(Number.isSafeInteger)) return null;
      return item;
    }
  };
  let panel, status, list;
  function renderRecords() {
    if (!list) return;
    list.replaceChildren();
    const entries = Object.values(read()).sort((a,b) => b.date.localeCompare(a.date));
    const note = document.createElement('p');
    note.textContent = storageFailed ? '기기 저장 공간을 사용할 수 없어 기록을 저장하지 못할 수 있어요.' : '이 기기에만 저장됩니다. 연습은 누적 기록, 시간 측정은 최근 결과를 표시합니다. 진행 중인 시간 측정은 복원하지 않습니다.';
    list.append(note);
    if (!entries.length) { const empty = document.createElement('p'); empty.textContent = '아직 저장된 학습 기록이 없습니다.'; list.append(empty); }
    for (const entry of entries) {
      const row = document.createElement('div'); row.className = 'record';
      const title = document.createElement('strong'); title.textContent = entry.title;
      const result = document.createElement('p');
      result.textContent = `${entry.total}문제 · 정답 ${entry.correct} · 오답 ${entry.wrong}${entry.elapsed ? ' · 시간 '+entry.elapsed : ''}`;
      const date = document.createElement('small'); date.textContent = new Date(entry.date).toLocaleString('ko-KR');
      row.append(title,result,date);
      const mistakes = entry.wrongProblems || entry.mistakes || [];
      if (mistakes.length) {
        const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = '오답 보기'; details.append(summary);
        for (const item of mistakes) {
          const p = document.createElement('p');
          p.textContent = `${item.problem || item.text} → 내 답: ${item.userQ !== undefined ? '몫 '+item.userQ+', 나머지 '+item.userR : item.user}, 정답: ${item.q !== undefined ? '몫 '+item.q+', 나머지 '+item.r : (item.correct ?? item.ans)}`;
          details.append(p);
        }
        row.append(details);
      }
      list.append(row);
    }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    panel = document.createElement('section'); panel.className = 'math-app-panel'; panel.setAttribute('aria-label','설치 및 학습 기록');
    status = document.createElement('p'); status.setAttribute('role','status'); status.textContent = '오프라인 사용 준비 중… 처음에는 인터넷에 연결해 주세요.';
    const install = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = '아이폰·아이패드에 설치하기';
    const help = document.createElement('p'); help.textContent = 'Safari에서 공유 → 홈 화면에 추가를 선택하세요. 웹 앱으로 열기 항목이 있으면 켜세요. 아래에 오프라인 준비 완료가 표시된 뒤 인터넷 없이 사용할 수 있어요. 기기에서 사이트 데이터를 삭제하면 다시 온라인으로 열어야 합니다.';
    install.append(summary,help);
    const history = document.createElement('details'); const hs = document.createElement('summary'); hs.textContent = '저장된 학습 기록'; list = document.createElement('div'); history.append(hs,list);
    const home = document.createElement('a'); home.href='index.html'; home.textContent='🏠 처음 화면';
    panel.append(status,install,history,home); document.body.append(panel); renderRecords();
    if (!('serviceWorker' in navigator)) { status.textContent='이 브라우저에서는 오프라인 저장을 지원하지 않습니다. Safari로 열어주세요.'; return; }
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'OFFLINE_STATUS') status.textContent = event.data.ready ? '✓ 오프라인 준비 완료 · 모든 연산 메뉴를 인터넷 없이 사용할 수 있어요.' : '오프라인 파일이 부족합니다. 인터넷에 연결한 뒤 다시 열어주세요.';
    });
    const check = () => navigator.serviceWorker.controller?.postMessage('OFFLINE_STATUS');
    navigator.serviceWorker.addEventListener('controllerchange', check);
    window.addEventListener('online',check); window.addEventListener('offline',check);
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'redundant') status.textContent='오프라인 저장에 실패했습니다. 인터넷 연결을 확인하고 다시 열어주세요.';
          if (worker.state === 'installed' && reg.waiting) status.textContent='새 버전이 준비되었습니다. 이 사이트의 창을 모두 닫고 다시 열면 적용됩니다.';
        });
      });
      if (reg.waiting) status.textContent='새 버전이 준비되었습니다. 이 사이트의 창을 모두 닫고 다시 열면 적용됩니다.';
      check();
    } catch { status.textContent='오프라인 저장에 실패했습니다. 인터넷 연결을 확인하고 다시 열어주세요.'; }
  });
})();
