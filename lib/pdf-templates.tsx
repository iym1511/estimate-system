import React from 'react';
import { Document, Page, Text, View, Font } from '@react-pdf/renderer';
import type { QuoteForPDF, BuildingForPDF } from './generate-pdf';
import type { Style } from '@react-pdf/types';

Font.register({
  family: 'NanumGothic',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/nanum-gothic@5/files/nanum-gothic-korean-400-normal.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/nanum-gothic@5/files/nanum-gothic-korean-700-normal.woff2',
      fontWeight: 700,
    },
  ],
});

Font.registerHyphenationCallback(w => [w]);

const COMPANY = { name: '그린설비', representative: '문석권', phone: '010-5501-8361' };

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

const F = 'NanumGothic';

/* ── 셀 스타일 헬퍼 ── */
const bodyCell = (width?: number): Style => ({
  width,
  padding: '5px 7px',
  borderRight: '1px solid #bbb',
  borderBottom: '1px solid #bbb',
  fontSize: 10,
});
const headCell = (width?: number): Style => ({
  width,
  padding: '6px 6px',
  borderRight: '1px solid #888',
  borderBottom: '1px solid #888',
  backgroundColor: '#e8e8e8',
  fontSize: 9,
  fontWeight: 700,
  textAlign: 'center',
});

/* ════════════════════════════════════════
   견적서
   ════════════════════════════════════════ */
export function EstimateDocument({ quotes, building }: { quotes: QuoteForPDF[]; building: BuildingForPDF }) {
  const total = quotes.reduce((s, q) => s + q.amount, 0);
  const no = docNo();

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: F, fontSize: 10, padding: '42px 44px', color: '#111', backgroundColor: '#fff' }}>

        {/* 제목 */}
        <View style={{ borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 14 }}>
          <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 8 }}>견  적  서</Text>
        </View>

        {/* 문서번호/작성일 */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Text style={{ fontSize: 9, color: '#555' }}>문서번호: {no}    작성일: {todayStr()}</Text>
        </View>

        {/* 공급받는자 / 공급자 */}
        <View style={{ flexDirection: 'row', border: '1px solid #999', marginBottom: 14 }}>
          {/* 공급받는자 */}
          <View style={{ flex: 1, padding: '10px 12px', borderRight: '1px solid #999' }}>
            <View style={{ backgroundColor: '#333', padding: '2px 6px', marginBottom: 8, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>공급받는자</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 52, fontWeight: 700, color: '#444' }}>현장명</Text>
              <Text style={{ flex: 1 }}>{building.name}</Text>
            </View>
            {building.address ? (
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ width: 52, fontWeight: 700, color: '#444' }}>주소</Text>
                <Text style={{ flex: 1 }}>{building.address}</Text>
              </View>
            ) : null}
          </View>
          {/* 공급자 */}
          <View style={{ flex: 1, padding: '10px 12px' }}>
            <View style={{ backgroundColor: '#333', padding: '2px 6px', marginBottom: 8, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>공급자</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 52, fontWeight: 700, color: '#444' }}>상호</Text>
              <Text style={{ flex: 1 }}>{COMPANY.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ width: 52, fontWeight: 700, color: '#444' }}>대표자</Text>
              <Text style={{ flex: 1 }}>{COMPANY.representative}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: 52, fontWeight: 700, color: '#444' }}>연락처</Text>
              <Text style={{ flex: 1 }}>{COMPANY.phone}</Text>
            </View>
          </View>
        </View>

        {/* 견적금액 박스 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #111', padding: '10px 16px', marginBottom: 14, backgroundColor: '#fafafa' }}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>견  적  금  액</Text>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>₩ {fmt(total)} 원</Text>
        </View>

        {/* 테이블 헤더 */}
        <View style={{ flexDirection: 'row', borderTop: '1px solid #555', borderLeft: '1px solid #555', backgroundColor: '#333' }}>
          <Text style={{ ...headCell(48), color: '#fff', borderColor: '#555' }}>호실</Text>
          <Text style={{ ...headCell(82), color: '#fff', borderColor: '#555' }}>날짜</Text>
          <Text style={{ ...headCell(), flex: 1, color: '#fff', borderColor: '#555' }}>시공 내용</Text>
          <Text style={{ ...headCell(90), color: '#fff', borderColor: '#555', textAlign: 'right' }}>금액 (원)</Text>
        </View>

        {/* 테이블 바디 */}
        {quotes.map((q, i) => (
          <View key={i} style={{ flexDirection: 'row', borderLeft: '1px solid #bbb' }}>
            <Text style={{ ...bodyCell(48), textAlign: 'center' }}>{q.room_number}</Text>
            <Text style={{ ...bodyCell(82), textAlign: 'center' }}>{q.work_date}</Text>
            <View style={{ ...bodyCell(), flex: 1 }}>
              <Text>{q.description}</Text>
              {q.remarks ? <Text style={{ fontSize: 9, color: '#777' }}>※ {q.remarks}</Text> : null}
            </View>
            <Text style={{ ...bodyCell(90), textAlign: 'right' }}>{fmt(q.amount)}</Text>
          </View>
        ))}

        <Text style={{ fontSize: 9, color: '#555', marginTop: 10 }}>※ 본 견적서는 발행일로부터 30일간 유효합니다.</Text>
      </Page>
    </Document>
  );
}

/* ════════════════════════════════════════
   거래명세서
   ════════════════════════════════════════ */
export function StatementDocument({ quotes, building }: { quotes: QuoteForPDF[]; building: BuildingForPDF }) {
  const total = quotes.reduce((s, q) => s + q.amount, 0);
  const no = docNo();

  const lbl = { width: 58, padding: '5px 7px', backgroundColor: '#f2f2f2', fontWeight: 700, fontSize: 9, borderRight: '1px solid #ccc', borderTop: '1px solid #ccc' };
  const val = { flex: 1, padding: '5px 7px', fontSize: 10, borderTop: '1px solid #ccc' };

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: F, fontSize: 10, padding: '28px 36px', color: '#000', backgroundColor: '#fff' }}>

        {/* 제목 */}
        <View style={{ borderBottom: '2.5px solid #000', paddingBottom: 6, marginBottom: 4 }}>
          <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, letterSpacing: 8 }}>거 래 명 세 서</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Text style={{ fontSize: 8, color: '#555' }}>문서번호: {no}  |  발행일: {todayStr()}</Text>
        </View>

        {/* 헤더 2단 */}
        <View style={{ flexDirection: 'row', border: '1px solid #000' }}>
          {/* 공급받는자 */}
          <View style={{ flex: 1, borderRight: '1px solid #000' }}>
            <View style={{ backgroundColor: '#333', padding: '4px 0' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', letterSpacing: 3 }}>공  급  받  는  자</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={lbl}>발 행 일</Text>
              <Text style={val}>{todayStr()}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={lbl}>거래처명</Text>
              <Text style={{ ...val, fontWeight: 700, fontSize: 12 }}>{building.name}</Text>
            </View>
            {building.address ? (
              <View style={{ flexDirection: 'row' }}>
                <Text style={lbl}>주  소</Text>
                <Text style={val}>{building.address}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row' }}>
              <Text style={lbl}>인수담당</Text>
              <Text style={val}>귀  중</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ ...lbl, backgroundColor: '#e8e8e8' }}>합계금액</Text>
              <Text style={{ ...val, fontWeight: 700, fontSize: 13 }}>₩ {fmt(total)} 원</Text>
            </View>
          </View>

          {/* 공급자 */}
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#333', padding: '4px 0' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', letterSpacing: 3 }}>공    급    자</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={lbl}>상  호</Text>
              <Text style={val}>{COMPANY.name}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={lbl}>대 표 자</Text>
              <Text style={val}>{COMPANY.representative}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={lbl}>연 락 처</Text>
              <Text style={val}>{COMPANY.phone}</Text>
            </View>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <Text style={lbl}>입금계좌</Text>
              <Text style={{ ...val, fontSize: 9 }}>국민은행 122-21-0315-474{'\n'}예금주: 문석권</Text>
            </View>
          </View>
        </View>

        {/* 품목 테이블 헤더 */}
        <View style={{ flexDirection: 'row', borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '1px solid #888', backgroundColor: '#e8e8e8' }}>
          <Text style={headCell(28)}>No</Text>
          <Text style={{ ...headCell(), flex: 1 }}>품  명</Text>
          <Text style={headCell(52)}>호실</Text>
          <Text style={headCell(72)}>날짜</Text>
          <Text style={headCell(36)}>수량</Text>
          <Text style={headCell(80)}>단  가</Text>
          <Text style={{ ...headCell(88), borderRight: 'none' }}>공급가액</Text>
        </View>

        {/* 품목 바디 */}
        {quotes.map((q, i) => (
          <View key={i} style={{ flexDirection: 'row', borderLeft: '1px solid #000', borderRight: '1px solid #000' }}>
            <Text style={{ ...bodyCell(28), textAlign: 'center' }}>{i + 1}</Text>
            <View style={{ ...bodyCell(), flex: 1 }}>
              <Text>{q.description}</Text>
              {q.remarks ? <Text style={{ fontSize: 9, color: '#666' }}>※ {q.remarks}</Text> : null}
            </View>
            <Text style={{ ...bodyCell(52), textAlign: 'center' }}>{q.room_number}</Text>
            <Text style={{ ...bodyCell(72), textAlign: 'center', fontSize: 9 }}>{q.work_date}</Text>
            <Text style={{ ...bodyCell(36), textAlign: 'center' }}>1</Text>
            <Text style={{ ...bodyCell(80), textAlign: 'right' }}>{fmt(q.amount)}</Text>
            <Text style={{ ...bodyCell(88), textAlign: 'right', borderRight: 'none' }}>{fmt(q.amount)}</Text>
          </View>
        ))}

        {/* 합계 */}
        <View style={{ flexDirection: 'row', border: '1px solid #000', borderTop: '2px solid #000' }}>
          <Text style={{ flex: 1, padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontSize: 11, backgroundColor: '#e8e8e8', letterSpacing: 2 }}>합  계</Text>
          <Text style={{ width: 88, padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontSize: 11, backgroundColor: '#e8e8e8', borderLeft: '1px solid #bbb' }}>{fmt(total)}</Text>
        </View>

      </Page>
    </Document>
  );
}
