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

async function downloadPDF(html: string, filename: string): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  // iframe에 HTML 전체 문서를 렌더링
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument!;
  iDoc.open();
  iDoc.write(html);
  iDoc.close();

  // 폰트/스타일 로딩 대기
  await new Promise(r => setTimeout(r, 700));

  try {
    const canvas = await html2canvas(iDoc.body, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      logging: false,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const pageHpx = Math.floor(canvas.width * (pageH / pageW));

    let srcY = 0;
    let page = 0;

    while (srcY < canvas.height) {
      const sliceH = Math.min(pageHpx, canvas.height - srcY);
      const pc = document.createElement('canvas');
      pc.width = canvas.width;
      pc.height = sliceH;
      const ctx = pc.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pc.width, pc.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      if (page > 0) pdf.addPage();
      pdf.addImage(pc.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, (sliceH / canvas.width) * pageW);

      srcY += pageHpx;
      page++;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}

/* ── 견적서 ─────────────────────────────────────────────────── */
export async function generateEstimatePDF(quotes: QuoteForPDF[], building: BuildingForPDF): Promise<void> {
  const no = docNo();
  const total = quotes.reduce((s, q) => s + q.amount, 0);

  const rows = quotes.map(q => `
    <tr>
      <td class="c">${esc(q.room_number)}</td>
      <td class="c">${q.work_date}</td>
      <td>${esc(q.description)}${q.remarks ? `<br><span style="font-size:11px;color:#777">※ ${esc(q.remarks)}</span>` : ''}</td>
      <td class="r">${fmt(q.amount)}</td>
    </tr>`).join('');

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
    <span class="value">₩&nbsp;${fmt(total)}&nbsp;원</span>
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
      ${rows}
    </tbody>
  </table>

  <p class="note">※ 본 견적서는 발행일로부터 30일간 유효합니다.</p>
</body>
</html>`;

  await downloadPDF(html, `견적서_${building.name}.pdf`);
}

/* ── 거래명세서 (엑셀 양식 기반) ────────────────────────────── */
export async function generateStatementPDF(quotes: QuoteForPDF[], building: BuildingForPDF): Promise<void> {
  const no = docNo();
  const total = quotes.reduce((s, q) => s + q.amount, 0);

  const rows = quotes.map((q, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td>${esc(q.description)}${q.remarks ? `<br><span style="font-size:10px;color:#666">※ ${esc(q.remarks)}</span>` : ''}</td>
      <td class="c">${esc(q.room_number)}</td>
      <td class="c">${q.work_date}</td>
      <td class="c">1</td>
      <td class="r">${fmt(q.amount)}</td>
      <td class="r">${fmt(q.amount)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>거래명세서</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;font-size:11px;color:#000;padding:32px 40px}

    /* ── 제목 ── */
    h1{text-align:center;font-size:26px;font-weight:700;letter-spacing:12px;border-bottom:2.5px solid #000;padding-bottom:8px;margin-bottom:4px}
    .docno{text-align:right;font-size:10px;color:#555;margin-bottom:10px}

    /* ── 헤더 (거래처 + 공급자 2열) ── */
    .hdr{display:grid;grid-template-columns:1fr 1fr;border:1px solid #000;margin-bottom:0}
    .hdr-col{display:flex;flex-direction:column}
    .hdr-col+.hdr-col{border-left:1px solid #000}
    .hdr-band{background:#333;color:#fff;font-size:10px;font-weight:700;letter-spacing:4px;text-align:center;padding:4px 0}
    .hdr-row{display:flex;border-top:1px solid #ccc;min-height:28px}
    .hdr-lbl{background:#f2f2f2;font-weight:700;font-size:10px;padding:5px 8px;width:72px;flex-shrink:0;border-right:1px solid #ccc;display:flex;align-items:center;letter-spacing:1px}
    .hdr-val{padding:5px 8px;font-size:11px;flex:1;display:flex;align-items:center;word-break:break-all}
    /* 합계금액 행 강조 */
    .hdr-total .hdr-lbl{background:#e8e8e8}
    .hdr-total .hdr-val{font-size:15px;font-weight:700}

    /* ── 품목 테이블 ── */
    table{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none;margin-bottom:0}
    th{background:#e8e8e8;font-size:10px;font-weight:700;text-align:center;padding:6px 6px;border:1px solid #888;letter-spacing:1px;white-space:nowrap}
    td{padding:6px 7px;border:1px solid #bbb;vertical-align:middle;font-size:11px}
    .c{text-align:center}.r{text-align:right;font-variant-numeric:tabular-nums}

    /* 합계 행 */
    tr.sum-row td{background:#e8e8e8;font-weight:700;font-size:12px;border-top:2px solid #000}

    @media print{body{padding:14px 18px}@page{size:A4;margin:10mm}}
  </style>
</head>
<body>
  <h1>거 래 명 세 서</h1>
  <div class="docno">문서번호: ${no}&nbsp;&nbsp;|&nbsp;&nbsp;발행일: ${todayStr()}</div>

  <!-- 헤더: 공급받는자 / 공급자 -->
  <div class="hdr">
    <div class="hdr-col">
      <div class="hdr-band">공 &nbsp; 급 &nbsp; 받 &nbsp; 는 &nbsp; 자</div>
      <div class="hdr-row">
        <div class="hdr-lbl">발 행 일</div>
        <div class="hdr-val">${todayStr()}</div>
      </div>
      <div class="hdr-row" style="min-height:36px">
        <div class="hdr-lbl">거래처명</div>
        <div class="hdr-val" style="font-size:13px;font-weight:700">${esc(building.name)}</div>
      </div>
      ${building.address ? `
      <div class="hdr-row">
        <div class="hdr-lbl">주 &nbsp;&nbsp; 소</div>
        <div class="hdr-val">${esc(building.address)}</div>
      </div>` : ''}
      <div class="hdr-row">
        <div class="hdr-lbl">인수담당</div>
        <div class="hdr-val">귀&nbsp;&nbsp;중</div>
      </div>
      <div class="hdr-row hdr-total">
        <div class="hdr-lbl">합계금액</div>
        <div class="hdr-val">₩&nbsp;${fmt(total)}&nbsp;원</div>
      </div>
    </div>
    <div class="hdr-col">
      <div class="hdr-band">공 &nbsp;&nbsp;&nbsp; 급 &nbsp;&nbsp;&nbsp; 자</div>
      <div class="hdr-row">
        <div class="hdr-lbl">상 &nbsp;&nbsp; 호</div>
        <div class="hdr-val">${esc(COMPANY.name)}</div>
      </div>
      <div class="hdr-row">
        <div class="hdr-lbl">대 표 자</div>
        <div class="hdr-val">${esc(COMPANY.representative)}</div>
      </div>
      <div class="hdr-row">
        <div class="hdr-lbl">연 락 처</div>
        <div class="hdr-val">${COMPANY.phone}</div>
      </div>
      <div class="hdr-row" style="flex:1">
        <div class="hdr-lbl">입금계좌</div>
        <div class="hdr-val" style="font-size:10.5px">국민은행 122-21-0315-474<br>예금주: 문석권</div>
      </div>
    </div>
  </div>

  <!-- 품목 테이블 -->
  <table>
    <thead>
      <tr>
        <th style="width:34px">No</th>
        <th>품&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명</th>
        <th style="width:64px">호실</th>
        <th style="width:90px">날짜</th>
        <th style="width:44px">수&nbsp;량</th>
        <th style="width:100px">단&nbsp;&nbsp;가</th>
        <th style="width:110px">공 급 가 액</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="sum-row">
        <td colspan="6" class="r" style="letter-spacing:2px">합 &nbsp; 계</td>
        <td class="r">${fmt(total)}</td>
      </tr>
    </tfoot>
  </table>

</body>
</html>`;

  await downloadPDF(html, `거래명세서_${building.name}.pdf`);
}
