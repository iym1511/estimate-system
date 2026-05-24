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

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;height:5000px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument!;
  iDoc.open();
  iDoc.write(html);
  iDoc.close();

  await new Promise(r => setTimeout(r, 1200));

  try {
    const bodyH = iDoc.body.scrollHeight;

    const canvas = await html2canvas(iDoc.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: bodyH,
      windowWidth: 794,
      windowHeight: bodyH,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const pxPerMm = canvas.width / pageW;
    const pageHpx = Math.floor(pageH * pxPerMm);

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
      pdf.addImage(pc.toDataURL('image/png'), 'PNG', 0, 0, pageW, sliceH / pxPerMm);

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
      <td style="text-align:center;padding:9px 10px;border:1px solid #bbb;vertical-align:top">${esc(q.room_number)}</td>
      <td style="text-align:center;padding:9px 10px;border:1px solid #bbb;vertical-align:top;white-space:nowrap">${q.work_date}</td>
      <td style="padding:9px 10px;border:1px solid #bbb;vertical-align:top">${esc(q.description)}${q.remarks ? `<br><span style="font-size:11px;color:#777">※ ${esc(q.remarks)}</span>` : ''}</td>
      <td style="text-align:right;padding:9px 10px;border:1px solid #bbb;vertical-align:top;white-space:nowrap">${fmt(q.amount)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>견적서</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;font-size:12px;color:#111;padding:52px 56px;background:#fff}
  </style>
</head>
<body>
  <!-- 제목 -->
  <div style="text-align:center;font-size:30px;font-weight:700;letter-spacing:10px;margin-bottom:28px;padding-bottom:12px;border-bottom:2px solid #111">견 적 서</div>

  <!-- 문서번호/작성일 -->
  <div style="text-align:right;font-size:11px;color:#555;margin-bottom:20px">
    문서번호: ${no}&nbsp;&nbsp;&nbsp;작성일: ${todayStr()}
  </div>

  <!-- 공급받는자 / 공급자 -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #999;margin-bottom:18px">
    <tr>
      <td style="width:50%;vertical-align:top;padding:14px 16px;border-right:1px solid #999">
        <div style="font-size:10px;font-weight:700;color:#fff;background:#333;padding:3px 8px;border-radius:2px;display:inline-block;margin-bottom:10px">공급받는자</div>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="width:68px;font-weight:600;color:#444;padding:4px 0;vertical-align:top;font-size:12px">현장명</td>
            <td style="padding:4px 0;font-size:12px">${esc(building.name)}</td>
          </tr>
          ${building.address ? `<tr><td style="width:68px;font-weight:600;color:#444;padding:4px 0;vertical-align:top;font-size:12px">주소</td><td style="padding:4px 0;font-size:12px">${esc(building.address)}</td></tr>` : ''}
        </table>
      </td>
      <td style="width:50%;vertical-align:top;padding:14px 16px">
        <div style="font-size:10px;font-weight:700;color:#fff;background:#333;padding:3px 8px;border-radius:2px;display:inline-block;margin-bottom:10px">공급자</div>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="width:68px;font-weight:600;color:#444;padding:4px 0;font-size:12px">상호</td>
            <td style="padding:4px 0;font-size:12px">${esc(COMPANY.name)}</td>
          </tr>
          <tr>
            <td style="width:68px;font-weight:600;color:#444;padding:4px 0;font-size:12px">대표자</td>
            <td style="padding:4px 0;font-size:12px">${esc(COMPANY.representative)}</td>
          </tr>
          <tr>
            <td style="width:68px;font-weight:600;color:#444;padding:4px 0;font-size:12px">연락처</td>
            <td style="padding:4px 0;font-size:12px">${COMPANY.phone}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- 견적금액 -->
  <table style="width:100%;border-collapse:collapse;border:2px solid #111;margin-bottom:18px;background:#fafafa">
    <tr>
      <td style="padding:12px 20px;font-size:13px;font-weight:600">견&nbsp;&nbsp;적&nbsp;&nbsp;금&nbsp;&nbsp;액</td>
      <td style="padding:12px 20px;font-size:22px;font-weight:700;text-align:right">₩&nbsp;${fmt(total)}&nbsp;원</td>
    </tr>
  </table>

  <!-- 품목 테이블 -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
    <thead>
      <tr style="background:#333;color:#fff">
        <th style="width:58px;padding:9px 10px;border:1px solid #555;text-align:center;font-size:11px;font-weight:600">호실</th>
        <th style="width:100px;padding:9px 10px;border:1px solid #555;text-align:center;font-size:11px;font-weight:600">날짜</th>
        <th style="padding:9px 10px;border:1px solid #555;text-align:center;font-size:11px;font-weight:600">시공 내용</th>
        <th style="width:120px;padding:9px 10px;border:1px solid #555;text-align:center;font-size:11px;font-weight:600">금액 (원)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <p style="font-size:11px;color:#555">※ 본 견적서는 발행일로부터 30일간 유효합니다.</p>
</body>
</html>`;

  await downloadPDF(html, `견적서_${building.name}.pdf`);
}

/* ── 거래명세서 ──────────────────────────────────────────────── */
export async function generateStatementPDF(quotes: QuoteForPDF[], building: BuildingForPDF): Promise<void> {
  const no = docNo();
  const total = quotes.reduce((s, q) => s + q.amount, 0);

  const rows = quotes.map((q, i) => `
    <tr>
      <td style="text-align:center;padding:6px 7px;border:1px solid #bbb;font-size:11px">${i + 1}</td>
      <td style="padding:6px 7px;border:1px solid #bbb;font-size:11px">${esc(q.description)}${q.remarks ? `<br><span style="font-size:10px;color:#666">※ ${esc(q.remarks)}</span>` : ''}</td>
      <td style="text-align:center;padding:6px 7px;border:1px solid #bbb;font-size:11px">${esc(q.room_number)}</td>
      <td style="text-align:center;padding:6px 7px;border:1px solid #bbb;font-size:11px;white-space:nowrap">${q.work_date}</td>
      <td style="text-align:center;padding:6px 7px;border:1px solid #bbb;font-size:11px">1</td>
      <td style="text-align:right;padding:6px 7px;border:1px solid #bbb;font-size:11px;white-space:nowrap">${fmt(q.amount)}</td>
      <td style="text-align:right;padding:6px 7px;border:1px solid #bbb;font-size:11px;white-space:nowrap">${fmt(q.amount)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>거래명세서</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif;font-size:11px;color:#000;padding:32px 40px;background:#fff}
  </style>
</head>
<body>
  <!-- 제목 -->
  <div style="text-align:center;font-size:26px;font-weight:700;letter-spacing:12px;border-bottom:2.5px solid #000;padding-bottom:8px;margin-bottom:4px">거 래 명 세 서</div>
  <div style="text-align:right;font-size:10px;color:#555;margin-bottom:10px">문서번호: ${no}&nbsp;&nbsp;|&nbsp;&nbsp;발행일: ${todayStr()}</div>

  <!-- 헤더: 공급받는자 / 공급자 -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #000;margin-bottom:0">
    <tr>
      <!-- 공급받는자 -->
      <td style="width:50%;vertical-align:top;padding:0;border-right:1px solid #000">
        <div style="background:#333;color:#fff;font-size:10px;font-weight:700;letter-spacing:4px;text-align:center;padding:5px 0">공 &nbsp; 급 &nbsp; 받 &nbsp; 는 &nbsp; 자</div>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">발 행 일</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:11px">${todayStr()}</td>
          </tr>
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">거래처명</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:13px;font-weight:700">${esc(building.name)}</td>
          </tr>
          ${building.address ? `
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">주 &nbsp;&nbsp; 소</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:11px">${esc(building.address)}</td>
          </tr>` : ''}
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">인수담당</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:11px">귀&nbsp;&nbsp;중</td>
          </tr>
          <tr>
            <td style="background:#e8e8e8;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">합계금액</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:15px;font-weight:700">₩&nbsp;${fmt(total)}&nbsp;원</td>
          </tr>
        </table>
      </td>
      <!-- 공급자 -->
      <td style="width:50%;vertical-align:top;padding:0">
        <div style="background:#333;color:#fff;font-size:10px;font-weight:700;letter-spacing:4px;text-align:center;padding:5px 0">공 &nbsp;&nbsp;&nbsp; 급 &nbsp;&nbsp;&nbsp; 자</div>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">상 &nbsp;&nbsp; 호</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:11px">${esc(COMPANY.name)}</td>
          </tr>
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">대 표 자</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:11px">${esc(COMPANY.representative)}</td>
          </tr>
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">연 락 처</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:11px">${COMPANY.phone}</td>
          </tr>
          <tr>
            <td style="background:#f2f2f2;font-weight:700;font-size:10px;padding:6px 8px;width:72px;border-right:1px solid #ccc;border-top:1px solid #ccc;letter-spacing:1px;white-space:nowrap">입금계좌</td>
            <td style="padding:6px 8px;border-top:1px solid #ccc;font-size:10px">국민은행 122-21-0315-474<br>예금주: 문석권</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- 품목 테이블 -->
  <table style="width:100%;border-collapse:collapse;border:1px solid #000;border-top:none">
    <thead>
      <tr style="background:#e8e8e8">
        <th style="width:34px;padding:6px;border:1px solid #888;font-size:10px;font-weight:700;text-align:center;letter-spacing:1px;white-space:nowrap">No</th>
        <th style="padding:6px;border:1px solid #888;font-size:10px;font-weight:700;text-align:center;letter-spacing:1px">품&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명</th>
        <th style="width:64px;padding:6px;border:1px solid #888;font-size:10px;font-weight:700;text-align:center;letter-spacing:1px;white-space:nowrap">호실</th>
        <th style="width:90px;padding:6px;border:1px solid #888;font-size:10px;font-weight:700;text-align:center;letter-spacing:1px;white-space:nowrap">날짜</th>
        <th style="width:44px;padding:6px;border:1px solid #888;font-size:10px;font-weight:700;text-align:center;letter-spacing:1px;white-space:nowrap">수&nbsp;량</th>
        <th style="width:100px;padding:6px;border:1px solid #888;font-size:10px;font-weight:700;text-align:center;letter-spacing:1px;white-space:nowrap">단&nbsp;&nbsp;가</th>
        <th style="width:110px;padding:6px;border:1px solid #888;font-size:10px;font-weight:700;text-align:center;letter-spacing:1px;white-space:nowrap">공 급 가 액</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6" style="text-align:right;padding:7px 10px;border:1px solid #bbb;background:#e8e8e8;font-weight:700;font-size:12px;letter-spacing:2px;border-top:2px solid #000">합 &nbsp; 계</td>
        <td style="text-align:right;padding:7px 10px;border:1px solid #bbb;background:#e8e8e8;font-weight:700;font-size:12px;border-top:2px solid #000;white-space:nowrap">${fmt(total)}</td>
      </tr>
    </tfoot>
  </table>

</body>
</html>`;

  await downloadPDF(html, `거래명세서_${building.name}.pdf`);
}
