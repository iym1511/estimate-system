import React from 'react';
import { Document, Page, Text, View, Font } from '@react-pdf/renderer';
import type { QuoteForPDF, BuildingForPDF } from './generate-pdf';
import type { Style } from '@react-pdf/types';

let _fontsRegistered = false;
function ensureFonts() {
  if (_fontsRegistered) return;
  _fontsRegistered = true;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  Font.register({
    family: 'NanumGothic',
    fonts: [
      { src: `${base}/fonts/NanumGothic-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/fonts/NanumGothic-Bold.ttf`, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback(w => [w]);
}

const COMPANY = { name: '그린설비', representative: '문석권', phone: '010-5501-8361' };

function fmt(n: number) { return n.toLocaleString('ko-KR'); }
function br(text: string) { return text.replace(/,(?!\s)/g, ', '); }
function docNo() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}
function todayStr() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const F = 'NanumGothic';

/* ── 보더 토큰 ── */
const OUTER = '1px solid #333' as const;
const INNER = '0.5px solid #bbb' as const;

/* ── 공통 패딩 ── */
const CP = '6px 9px' as const;

/* ── 셀 크기 헬퍼 ── */
function fw(w: number): Style { return { width: w, flexShrink: 0, overflow: 'hidden' }; }
function fc(): Style           { return { flex: 1, flexShrink: 1, overflow: 'hidden' }; }

/* ════════════════════════════════════════
   셀 베이스
   align:
     'center' — 가로·세로 모두 중앙 (No, 호실, 날짜, 수량 등 단일행 셀)
     'left'   — 좌측 상단 정렬 (품명/시공내용 등 멀티라인 셀)
     'right'  — 세로 중앙 + 텍스트 우측 정렬 (금액, 단가, 공급가액)
   ════════════════════════════════════════ */
type CellAlign = 'center' | 'left' | 'right';
type CellOpts = {
  w?: number | null;
  isLastCol?: boolean;
  isLastRow?: boolean;
  bg?: string;
  align?: CellAlign;
};

function cellBase({ w, isLastCol, isLastRow, bg, align = 'left' }: CellOpts): Style {
  return {
    ...(w != null ? fw(w) : fc()),
    padding: CP,
    borderRight: isLastCol ? undefined : INNER,
    borderBottom: isLastRow ? undefined : INNER,
    backgroundColor: bg,
    // 'center': 세로·가로 모두 중앙 / 'right'·'left': 세로 중앙, 텍스트는 Text에서 처리
    justifyContent: 'center',
    alignItems: align === 'center' ? 'center' : 'stretch',
  };
}

/* ════════════════════════════════════════
   견적서
   ════════════════════════════════════════ */
export function EstimateDocument({ quotes, building }: { quotes: QuoteForPDF[]; building: BuildingForPDF }) {
  ensureFonts();
  const total = quotes.reduce((s, q) => s + q.amount, 0);

  const eHead = (w?: number | null, isLastCol = false): Style => ({
    ...cellBase({ w, isLastCol, bg: '#333', align: 'center' }),
  });
  const eHeadTxt: Style = { fontSize: 9, fontWeight: 700, color: '#fff' };

  const eBody = (w?: number | null, isLastCol = false, isLastRow = false, align: CellAlign = 'left'): Style => ({
    ...cellBase({ w, isLastCol, isLastRow, align }),
    fontSize: 9,
  });

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: F, fontSize: 10, padding: '28px 44px', color: '#111', backgroundColor: '#fff' }}>

        {/* 제목 */}
        <View style={{ borderBottom: '2px solid #333', paddingBottom: 5, marginBottom: 8 }}>
          <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: 700 }}>견적서</Text>
        </View>

        {/* 문서번호/작성일 */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 7 }}>
          <Text style={{ fontSize: 9, color: '#666' }}>문서번호: {docNo()}　작성일: {todayStr()}</Text>
        </View>

        {/* 공급받는자 / 공급자 */}
        <View style={{ flexDirection: 'row', border: OUTER, marginBottom: 8 }}>
          <View style={{ flex: 1, overflow: 'hidden', borderRight: OUTER }}>
            <View style={{ backgroundColor: '#333', padding: CP }}>
              <Text style={{ fontSize: 9, fontWeight: 700, color: '#fff', textAlign: 'center' }}>공급받는자</Text>
            </View>
            <View style={{ padding: '6px 10px' }}>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <View style={{ width: 48, flexShrink: 0 }}>
                  <Text style={{ fontWeight: 700, color: '#555', fontSize: 9 }}>현장명</Text>
                </View>
                <View style={{ flex: 1, overflow: 'hidden' }}>
                  <Text style={{ fontSize: 9 }}>{building.name}</Text>
                </View>
              </View>
              {building.address ? (
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 48, flexShrink: 0 }}>
                    <Text style={{ fontWeight: 700, color: '#555', fontSize: 9 }}>주소</Text>
                  </View>
                  <View style={{ flex: 1, overflow: 'hidden' }}>
                    <Text style={{ fontSize: 9 }}>{building.address}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#333', padding: CP }}>
              <Text style={{ fontSize: 9, fontWeight: 700, color: '#fff', textAlign: 'center' }}>공급자</Text>
            </View>
            <View style={{ padding: '6px 10px' }}>
              {[
                { label: '상호',   value: COMPANY.name },
                { label: '대표자', value: COMPANY.representative },
                { label: '연락처', value: COMPANY.phone },
              ].map(({ label, value }) => (
                <View key={label} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <View style={{ width: 48, flexShrink: 0 }}>
                    <Text style={{ fontWeight: 700, color: '#555', fontSize: 9 }}>{label}</Text>
                  </View>
                  <View style={{ flex: 1, overflow: 'hidden' }}>
                    <Text style={{ fontSize: 9 }}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 견적금액 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', border: OUTER, padding: '7px 14px', marginBottom: 8, backgroundColor: '#fafafa' }}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>견적 금액</Text>
          <Text style={{ fontSize: 17, fontWeight: 700 }}>₩ {fmt(total)} 원</Text>
        </View>

        {/* 테이블 */}
        <View style={{ border: OUTER }}>
          {/* 헤더 */}
          <View style={{ flexDirection: 'row', borderBottom: OUTER }}>
            <View style={eHead(60)}><Text style={eHeadTxt}>호실</Text></View>
            <View style={eHead(82)}><Text style={eHeadTxt}>날짜</Text></View>
            <View style={eHead()}><Text style={eHeadTxt}>시공 내용</Text></View>
            <View style={eHead(92, true)}><Text style={eHeadTxt}>금액 (원)</Text></View>
          </View>

          {/* 바디 */}
          {quotes.map((q, i) => {
            const isLastRow = i === quotes.length - 1;
            return (
              <View key={i} style={{ flexDirection: 'row' }}>
                {/* 호실: 세로·가로 중앙 */}
                <View style={eBody(60, false, isLastRow, 'center')}>
                  <Text>{q.room_number}</Text>
                </View>
                {/* 날짜: 세로·가로 중앙 */}
                <View style={eBody(82, false, isLastRow, 'center')}>
                  <Text>{q.work_date}</Text>
                </View>
                {/* 시공내용: 좌측 상단 정렬 (멀티라인) */}
                <View style={eBody(null, false, isLastRow, 'left')}>
                  <Text style={{ lineHeight: 0.5 }}>{br(q.description)}</Text>
                  {q.remarks ? <Text style={{ fontSize: 8, color: '#888', marginTop: 3, lineHeight: 0.5 }}>※ {q.remarks}</Text> : null}
                </View>
                {/* 금액: 세로 중앙 + 우측 정렬 */}
                <View style={eBody(92, true, isLastRow, 'right')}>
                  <Text style={{ textAlign: 'right' }}>{fmt(q.amount)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={{ fontSize: 9, color: '#666', marginTop: 10 }}>
          ※ 본 견적서는 발행일로부터 30일간 유효합니다.
        </Text>
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════
   거래명세서
   ════════════════════════════════════════ */
export function StatementDocument({ quotes, building }: { quotes: QuoteForPDF[]; building: BuildingForPDF }) {
  ensureFonts();
  const total = quotes.reduce((s, q) => s + q.amount, 0);

  const infoLbl = (isFirstRow = false, extra?: Style): Style => ({
    width: 60, flexShrink: 0, overflow: 'hidden',
    padding: CP, backgroundColor: '#f0f0f0',
    borderRight: INNER,
    borderTop: isFirstRow ? undefined : INNER,
    justifyContent: 'center',
    ...extra,
  });
  const infoVal = (isFirstRow = false, extra?: Style): Style => ({
    flex: 1, flexShrink: 1, overflow: 'hidden',
    padding: CP,
    borderTop: isFirstRow ? undefined : INNER,
    justifyContent: 'center',
    ...extra,
  });

  const sHead = (w?: number | null, isLastCol = false): Style => ({
    ...cellBase({ w, isLastCol, bg: '#e0e0e0', align: 'center' }),
  });
  const sHeadTxt: Style = { fontSize: 9, fontWeight: 700, color: '#111' };

  const sBody = (w?: number | null, isLastCol = false, isLastRow = false, align: CellAlign = 'left'): Style => ({
    ...cellBase({ w, isLastCol, isLastRow, align }),
    fontSize: 9,
  });

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: F, fontSize: 10, padding: '20px 36px', color: '#000', backgroundColor: '#fff' }}>

        {/* 제목 */}
        <View style={{ borderBottom: '2px solid #333', paddingBottom: 3, marginBottom: 2 }}>
          <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}>거래명세서</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
          <Text style={{ fontSize: 8, color: '#666' }}>문서번호: {docNo()}  |  발행일: {todayStr()}</Text>
        </View>

        {/* 헤더 2단 */}
        <View style={{ flexDirection: 'row', border: OUTER, marginBottom: 6 }}>
          {/* 공급받는자 */}
          <View style={{ flex: 1, borderRight: OUTER, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#333', padding: CP }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center' }}>공급받는자</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={infoLbl(true)}><Text style={{ fontSize: 9, fontWeight: 700 }}>발행일</Text></View>
              <View style={infoVal(true)}><Text style={{ fontSize: 9 }}>{todayStr()}</Text></View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={infoLbl()}><Text style={{ fontSize: 9, fontWeight: 700 }}>거래처명</Text></View>
              <View style={infoVal()}><Text style={{ fontSize: 11, fontWeight: 700 }}>{building.name}</Text></View>
            </View>
            {building.address ? (
              <View style={{ flexDirection: 'row' }}>
                <View style={infoLbl()}><Text style={{ fontSize: 9, fontWeight: 700 }}>주소</Text></View>
                <View style={infoVal()}><Text style={{ fontSize: 9 }}>{building.address}</Text></View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row' }}>
              <View style={infoLbl()}><Text style={{ fontSize: 9, fontWeight: 700 }}>인수담당</Text></View>
              <View style={infoVal()}><Text style={{ fontSize: 9 }}>귀중</Text></View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={infoLbl(false, { backgroundColor: '#e0e0e0' })}><Text style={{ fontSize: 9, fontWeight: 700 }}>합계금액</Text></View>
              <View style={infoVal()}><Text style={{ fontSize: 12, fontWeight: 700 }}>₩ {fmt(total)} 원</Text></View>
            </View>
          </View>

          {/* 공급자 */}
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#333', padding: CP }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center' }}>공급자</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={infoLbl(true)}><Text style={{ fontSize: 9, fontWeight: 700 }}>상호</Text></View>
              <View style={infoVal(true)}><Text style={{ fontSize: 9 }}>{COMPANY.name}</Text></View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={infoLbl()}><Text style={{ fontSize: 9, fontWeight: 700 }}>대표자</Text></View>
              <View style={infoVal()}><Text style={{ fontSize: 9 }}>{COMPANY.representative}</Text></View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={infoLbl()}><Text style={{ fontSize: 9, fontWeight: 700 }}>연락처</Text></View>
              <View style={infoVal()}><Text style={{ fontSize: 9 }}>{COMPANY.phone}</Text></View>
            </View>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <View style={infoLbl()}><Text style={{ fontSize: 9, fontWeight: 700 }}>입금계좌</Text></View>
              <View style={infoVal()}>
                <Text style={{ fontSize: 9 }}>국민은행 122-21-0315-474</Text>
                <Text style={{ fontSize: 9, marginTop: 4 }}>예금주: 문석권</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 품목 테이블 */}
        <View style={{ border: OUTER }}>
          {/* 헤더 */}
          <View style={{ flexDirection: 'row', borderBottom: OUTER }}>
            <View style={sHead(32)}><Text style={sHeadTxt}>No</Text></View>
            <View style={sHead()}><Text style={sHeadTxt}>품명</Text></View>
            <View style={sHead(60)}><Text style={sHeadTxt}>호실</Text></View>
            <View style={sHead(72)}><Text style={sHeadTxt}>날짜</Text></View>
            <View style={sHead(36)}><Text style={sHeadTxt}>수량</Text></View>
            <View style={sHead(72)}><Text style={sHeadTxt}>단가</Text></View>
            <View style={sHead(80, true)}><Text style={sHeadTxt}>공급가액</Text></View>
          </View>

          {/* 바디 */}
          {quotes.map((q, i) => {
            const isLastRow = i === quotes.length - 1;
            return (
              <View key={i} style={{ flexDirection: 'row' }}>
                {/* No: 중앙 */}
                <View style={sBody(32, false, isLastRow, 'center')}>
                  <Text>{i + 1}</Text>
                </View>
                {/* 품명: 좌측 상단 (멀티라인) */}
                <View style={sBody(null, false, isLastRow, 'left')}>
                  <Text style={{ lineHeight: 0.5 }}>{br(q.description)}</Text>
                  {q.remarks ? <Text style={{ fontSize: 8, color: '#777', marginTop: 2, lineHeight: 0.5 }}>※ {q.remarks}</Text> : null}
                </View>
                {/* 호실: 중앙 */}
                <View style={sBody(60, false, isLastRow, 'center')}>
                  <Text>{q.room_number}</Text>
                </View>
                {/* 날짜: 중앙 */}
                <View style={sBody(72, false, isLastRow, 'center')}>
                  <Text>{q.work_date}</Text>
                </View>
                {/* 수량: 중앙 */}
                <View style={sBody(36, false, isLastRow, 'center')}>
                  <Text>1</Text>
                </View>
                {/* 단가: 우측 */}
                <View style={sBody(72, false, isLastRow, 'right')}>
                  <Text style={{ textAlign: 'right' }}>{fmt(q.amount)}</Text>
                </View>
                {/* 공급가액: 우측 */}
                <View style={sBody(80, true, isLastRow, 'right')}>
                  <Text style={{ textAlign: 'right' }}>{fmt(q.amount)}</Text>
                </View>
              </View>
            );
          })}

          {/* 합계 */}
          <View style={{ flexDirection: 'row', borderTop: OUTER, backgroundColor: '#e0e0e0' }}>
            <View style={{ flex: 1, padding: CP, borderRight: INNER, overflow: 'hidden', justifyContent: 'center', alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: 700, fontSize: 10 }}>합계</Text>
            </View>
            <View style={{ width: 80, flexShrink: 0, padding: CP, overflow: 'hidden', justifyContent: 'center', alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: 700, fontSize: 10 }}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
}
