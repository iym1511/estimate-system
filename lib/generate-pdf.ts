const COMPANY = {
  name: '그린설비',
  representative: '문석권',
  phone: '010-5501-8361',
};

export interface QuoteForPDF {
  room_number: string;
  work_date: string;
  description: string;
  amount: number;
  remarks?: string;
}

export interface BuildingForPDF {
  name: string;
  address?: string;
}

function esc(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR');
}

function docNo() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayStr() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function openAndPrint(html: string) {
  const win = window.open('', '_blank', 'width=850,height=980');
  if (!win) {
    alert('팝업이 차단되어 있습니다. 이 사이트의 팝업을 허용해 주세요.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 700);
}

/* ── 견적서 ─────────────────────────────────────────────────── */
export function generateEstimatePDF(quote: QuoteForPDF, building: BuildingForPDF) {
  const no = docNo();

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>견적서</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;font-size:12px;color:#111;padding:52px 56px}
    h1{text-align:center;font-size:30px;font-weight:700;letter-spacing:10px;margin-bottom:28px;padding-bottom:12px;border-bottom:2px solid #111}
    .meta{display:flex;justify-content:flex-end;gap:20px;font-size:11px;color:#555;margin-bottom:20px}
    .parties{display:grid;grid-template-columns:1fr 1fr;border:1px solid #999;margin-bottom:18px}
    .party{padding:14px 16px}
    .party+.party{border-left:1px solid #999}
    .party-title{font-size:10px;font-weight:700;color:#fff;background:#333;padding:3px 8px;border-radius:2px;display:inline-block;margin-bottom:10px}
    .party-row{display:flex;margin-bottom:5px;font-size:12px}
    .party-label{width:68px;font-weight:600;color:#444;flex-shrink:0}
    .amount-box{border:2px solid #111;padding:12px 20px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;background:#fafafa}
    .amount-box .label{font-size:13px;font-weight:600}
    .amount-box .value{font-size:22px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    thead tr{background:#333;color:#fff}
    th{padding:9px 12px;font-size:11px;font-weight:600;border:1px solid #555;text-align:center}
    td{padding:10px 12px;border:1px solid #bbb;vertical-align:top}
    .c{text-align:center}.r{text-align:right}
    .foot-row td{background:#f4f4f4;font-weight:700;border-top:2px solid #555}
    .note{font-size:11px;color:#555;margin-bottom:8px}
    @media print{body{padding:20px 24px}@page{size:A4;margin:18mm}}
  </style>
</head>
<body>
  <h1>견 적 서</h1>
  <div class="meta">
    <span>문서번호: ${no}</span>
    <span>작성일: ${todayStr()}</span>
  </div>

  <div class="parties">
    <div class="party">
      <span class="party-title">공급받는자</span>
      <div class="party-row"><span class="party-label">현장명</span><span>${esc(building.name)}</span></div>
      ${building.address ? `<div class="party-row"><span class="party-label">주소</span><span>${esc(building.address)}</span></div>` : ''}
      <div class="party-row"><span class="party-label">호실</span><span>${esc(quote.room_number)}</span></div>
      <div class="party-row"><span class="party-label">작업일</span><span>${quote.work_date}</span></div>
    </div>
    <div class="party">
      <span class="party-title">공급자</span>
      <div class="party-row"><span class="party-label">상호</span><span>${esc(COMPANY.name)}</span></div>
      <div class="party-row"><span class="party-label">대표자</span><span>${esc(COMPANY.representative)}</span></div>
      <div class="party-row"><span class="party-label">연락처</span><span>${COMPANY.phone}</span></div>
    </div>
  </div>

  <div class="amount-box">
    <span class="label">견&nbsp;&nbsp;적&nbsp;&nbsp;금&nbsp;&nbsp;액</span>
    <span class="value">₩&nbsp;${fmt(quote.amount)}&nbsp;원</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:58px">호실</th>
        <th style="width:100px">날짜</th>
        <th>시공 내용</th>
        <th style="width:120px">금액 (원)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="c">${esc(quote.room_number)}</td>
        <td class="c">${quote.work_date}</td>
        <td>${esc(quote.description)}</td>
        <td class="r">${fmt(quote.amount)}</td>
      </tr>
    </tbody>
  </table>

  ${quote.remarks ? `<p class="note">※ 비고: ${esc(quote.remarks)}</p>` : ''}
  <p class="note">※ 본 견적서는 발행일로부터 30일간 유효합니다.</p>
</body>
</html>`;

  openAndPrint(html);
}

/* ── 거래명세표 ──────────────────────────────────────────────── */
export function generateStatementPDF(quote: QuoteForPDF, building: BuildingForPDF) {
  const no = docNo();

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>거래명세표</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;font-size:12px;color:#111;padding:52px 56px}
    h1{text-align:center;font-size:28px;font-weight:700;letter-spacing:8px;margin-bottom:6px;padding-bottom:10px;border-bottom:2px solid #111}
    .doc-meta{text-align:center;font-size:11px;color:#666;margin-bottom:24px}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
    .party{border:1px solid #999}
    .party-title{font-size:11px;font-weight:700;background:#111;color:#fff;padding:5px 14px}
    .party-body{padding:12px 14px}
    .party-row{display:flex;margin-bottom:5px;font-size:12px}
    .party-label{width:68px;font-weight:600;color:#444;flex-shrink:0}
    .amount-box{border:2px solid #111;padding:12px 20px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;background:#fafafa}
    .amount-box .label{font-size:13px;font-weight:600}
    .amount-box .value{font-size:22px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    thead tr{background:#111;color:#fff}
    th{padding:9px 12px;font-size:11px;font-weight:600;border:1px solid #333;text-align:center}
    td{padding:10px 12px;border:1px solid #bbb;vertical-align:top}
    .c{text-align:center}.r{text-align:right}
    .foot-row td{background:#f0f0f0;font-weight:700}
    .foot-row.final td{background:#111;color:#fff;font-size:13px;border-color:#333}
    .note{font-size:11px;color:#555;margin-bottom:8px}
    @media print{body{padding:20px 24px}@page{size:A4;margin:18mm}}
  </style>
</head>
<body>
  <h1>거 래 명 세 표</h1>
  <div class="doc-meta">문서번호: ${no}&nbsp;&nbsp;|&nbsp;&nbsp;발행일: ${todayStr()}</div>

  <div class="parties">
    <div class="party">
      <div class="party-title">공급받는자</div>
      <div class="party-body">
        <div class="party-row"><span class="party-label">현장명</span><span>${esc(building.name)}</span></div>
        ${building.address ? `<div class="party-row"><span class="party-label">주소</span><span>${esc(building.address)}</span></div>` : ''}
        <div class="party-row"><span class="party-label">호실</span><span>${esc(quote.room_number)}</span></div>
        <div class="party-row"><span class="party-label">작업일</span><span>${quote.work_date}</span></div>
      </div>
    </div>
    <div class="party">
      <div class="party-title">공급자</div>
      <div class="party-body">
        <div class="party-row"><span class="party-label">상호</span><span>${esc(COMPANY.name)}</span></div>
        <div class="party-row"><span class="party-label">대표자</span><span>${esc(COMPANY.representative)}</span></div>
        <div class="party-row"><span class="party-label">연락처</span><span>${COMPANY.phone}</span></div>
        <div class="party-row"><span class="party-label">입금계좌</span><span>국민은행 122-21-0315-474 문석권</span></div>
      </div>
    </div>
  </div>

  <div class="amount-box">
    <span class="label">거&nbsp;&nbsp;래&nbsp;&nbsp;금&nbsp;&nbsp;액</span>
    <span class="value">₩&nbsp;${fmt(quote.amount)}&nbsp;원</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:58px">호실</th>
        <th style="width:100px">날짜</th>
        <th>시공 내용</th>
        <th style="width:120px">금액 (원)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="c">${esc(quote.room_number)}</td>
        <td class="c">${quote.work_date}</td>
        <td>${esc(quote.description)}</td>
        <td class="r">${fmt(quote.amount)}</td>
      </tr>
    </tbody>
  </table>

  ${quote.remarks ? `<p class="note">※ 비고: ${esc(quote.remarks)}</p>` : ''}
  <p class="note">※ 위와 같이 거래명세를 통보합니다.</p>
</body>
</html>`;

  openAndPrint(html);
}
