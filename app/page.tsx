'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, CheckCircle, Save, X,
  MapPin, Search, Lock, TrendingUp, Building2, Pencil, ArrowUp, ArrowDown,
  FileText, Receipt,
} from 'lucide-react';
import { generateEstimatePDF, generateStatementPDF } from '@/lib/generate-pdf';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Building {
  id: string;
  name: string;
  address: string;
  password?: string;
}

interface Quote {
  id: string;
  building_id: string;
  room_number: string;
  work_date: string;
  description: string;
  amount: number;
  is_paid: boolean;
  remarks?: string;
}

const EMPTY_QUOTE = {
  room_number: '',
  work_date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  amount: 0,
  is_paid: false,
  remarks: '',
};

/* ── 인풋 스타일 ─────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '0 12px',
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: '#171717',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: '#171717',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  lineHeight: 1.6,
  resize: 'vertical',
  minHeight: 80,
  transition: 'border-color 0.15s',
};

const smallInputStyle: React.CSSProperties = {
  ...inputStyle,
  height: 30,
  fontSize: 12,
  borderRadius: 6,
};

/* ── 폼 라벨 ─────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
      {children}
    </p>
  );
}

/* ── 스켈레톤 ────────────────────────────────── */
function BuildingListSkeleton() {
  return (
    <div style={{ padding: '6px 8px' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ padding: '9px 10px', marginBottom: 2 }}>
          <div className="skeleton" style={{ height: 13, width: `${55 + (i % 3) * 15}%`, borderRadius: 4, marginBottom: 5 }} />
          <div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

function QuoteTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
          <TableCell style={{ padding: '14px 16px' }}>
            <div className="skeleton" style={{ height: 13, width: 36, borderRadius: 4 }} />
          </TableCell>
          <TableCell style={{ padding: '14px 16px' }}>
            <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 4 }} />
          </TableCell>
          <TableCell style={{ padding: '14px 16px' }}>
            <div className="skeleton" style={{ height: 13, width: `${120 + (i % 3) * 60}px`, borderRadius: 4, marginBottom: 5 }} />
            <div className="skeleton" style={{ height: 11, width: `${80 + (i % 2) * 40}px`, borderRadius: 4 }} />
          </TableCell>
          <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
            <div className="skeleton" style={{ height: 13, width: 70, borderRadius: 4, marginLeft: 'auto' }} />
          </TableCell>
          <TableCell style={{ padding: '14px 16px' }} />
          <TableCell style={{ padding: '14px 16px' }} />
        </TableRow>
      ))}
    </>
  );
}

/* ── 시공 내역 공용 폼 패널 ───────────────────── */
function QuoteFormPanel({
  formData,
  setFormData,
  onSave,
  onCancel,
  title,
  saveLabel,
  accentBorder = '#c6f0de',
  accentBg = 'rgba(62,207,142,0.04)',
  descRef,
}: {
  formData: Partial<Quote>;
  setFormData: (v: Partial<Quote>) => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
  saveLabel: string;
  accentBorder?: string;
  accentBg?: string;
  descRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div
      style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 10, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      className="animate-in slide-in-from-top-2 duration-200"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#171717' }}>{title}</p>
        <button onClick={onCancel} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e0e0e0', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9a9a9a' }}>
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>
        <div>
          <Label>호실</Label>
          <input
            style={inputStyle}
            placeholder="예) 101호"
            value={formData.room_number ?? ''}
            onChange={e => setFormData({ ...formData, room_number: e.target.value })}
            onFocus={e => { e.target.style.borderColor = '#3ecf8e'; }}
            onBlur={e => { e.target.style.borderColor = '#e0e0e0'; }}
          />
        </div>
        <div>
          <Label>작업 날짜</Label>
          <input
            type="date"
            style={inputStyle}
            value={formData.work_date ?? ''}
            onChange={e => setFormData({ ...formData, work_date: e.target.value })}
            onFocus={e => { e.target.style.borderColor = '#3ecf8e'; }}
            onBlur={e => { e.target.style.borderColor = '#e0e0e0'; }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Label>시공 내용</Label>
        <textarea
          ref={descRef}
          style={textareaStyle}
          placeholder="시공 내용을 상세히 입력하세요. (여러 줄 작성 가능)"
          value={formData.description ?? ''}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          onFocus={e => { e.target.style.borderColor = '#3ecf8e'; }}
          onBlur={e => { e.target.style.borderColor = '#e0e0e0'; }}
        />
      </div>

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2" style={{ gap: 12, marginBottom: 16 }}>
        <div>
          <Label>금액 (원)</Label>
          <input
            type="number"
            style={{ ...inputStyle, textAlign: 'right' }}
            placeholder="0"
            value={formData.amount || ''}
            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
            onFocus={e => { e.target.style.borderColor = '#3ecf8e'; }}
            onBlur={e => { e.target.style.borderColor = '#e0e0e0'; }}
          />
        </div>
        <div>
          <Label>정산 여부</Label>
          <div style={{ display: 'flex', gap: 8, height: 36, alignItems: 'center' }}>
            <button
              onClick={() => setFormData({ ...formData, is_paid: false })}
              style={{
                flex: 1, height: 36, borderRadius: 8, border: '1px solid #e0e0e0',
                background: !formData.is_paid ? '#f5f5f5' : '#fff',
                fontSize: 13, fontWeight: 600, color: !formData.is_paid ? '#171717' : '#b2b2b2',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >미정산</button>
            <button
              onClick={() => setFormData({ ...formData, is_paid: true })}
              style={{
                flex: 1, height: 36, borderRadius: 8,
                border: formData.is_paid ? '1px solid #b6edce' : '1px solid #e0e0e0',
                background: formData.is_paid ? '#f0fdf8' : '#fff',
                fontSize: 13, fontWeight: 600, color: formData.is_paid ? '#24b47e' : '#b2b2b2',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >정산 완료</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} className="btn-ghost">취소</button>
        <button
          onClick={onSave}
          disabled={!formData.room_number || !formData.description}
          style={{ height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid #c6f0de', background: '#f0fdf8', color: '#24b47e', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', opacity: (!formData.room_number || !formData.description) ? 0.5 : 1 }}
          onMouseEnter={e => { if (!(!formData.room_number || !formData.description)) { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; } }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}
        >
          <Save size={13} />
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const queryClient = useQueryClient();

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [search, setSearch] = useState('');
  const [newQuote, setNewQuote] = useState<Partial<Quote>>(EMPTY_QUOTE);

  const [editBuildingId, setEditBuildingId] = useState<string | null>(null);
  const [editBuildingForm, setEditBuildingForm] = useState<Partial<Building>>({});
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editQuoteForm, setEditQuoteForm] = useState<Partial<Quote>>({});
  const [sortAsc, setSortAsc] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<'estimate' | 'statement' | null>(null);

  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAddingQuote) setTimeout(() => descRef.current?.focus(), 50);
  }, [isAddingQuote]);

  /* ── 쿼리 ──────────────────────────────────── */
  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buildings').select('*').order('name');
      if (error) throw error;
      return data as Building[];
    },
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes', selectedBuilding?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes').select('*').eq('building_id', selectedBuilding!.id)
        .order('work_date', { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!selectedBuilding,
  });

  /* ── 뮤테이션 ───────────────────────────────── */
  const updateBuildingMutation = useMutation({
    mutationFn: async (vars: { id: string; name: string; address: string; password: string }) => {
      const { error } = await supabase.from('buildings').update({ name: vars.name, address: vars.address, password: vars.password }).eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setEditBuildingId(null);
      if (selectedBuilding?.id === vars.id) {
        setSelectedBuilding(prev => prev ? { ...prev, ...vars } : null);
      }
    },
  });

  const addQuoteMutation = useMutation({
    mutationFn: async (vars: { quoteData: Partial<Quote>; buildingId: string }) => {
      const { error } = await supabase.from('quotes').insert([{ ...vars.quoteData, building_id: vars.buildingId }]);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', vars.buildingId] });
      setNewQuote(EMPTY_QUOTE);
      setIsAddingQuote(false);
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async (vars: { id: string; data: Partial<Quote>; buildingId: string }) => {
      const { error } = await supabase.from('quotes').update(vars.data).eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', vars.buildingId] });
      setEditingQuoteId(null);
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (vars: { id: string; buildingId: string }) => {
      const { error } = await supabase.from('quotes').delete().eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', vars.buildingId] });
    },
  });

  const togglePaidMutation = useMutation({
    mutationFn: async (vars: { id: string; isPaid: boolean; buildingId: string }) => {
      const { error } = await supabase.from('quotes').update({ is_paid: vars.isPaid }).eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', vars.buildingId] });
    },
  });

  /* ── 핸들러 ─────────────────────────────────── */
  function handleUpdateBuilding() {
    if (!editBuildingId || !editBuildingForm.name) return;
    updateBuildingMutation.mutate({
      id: editBuildingId,
      name: editBuildingForm.name,
      address: editBuildingForm.address ?? '',
      password: editBuildingForm.password ?? '',
    });
  }

  function handleAddQuote() {
    if (!selectedBuilding || !newQuote.room_number || !newQuote.description) return;
    addQuoteMutation.mutate({ quoteData: newQuote, buildingId: selectedBuilding.id });
  }

  function handleUpdateQuote() {
    if (!editingQuoteId || !editQuoteForm.room_number || !editQuoteForm.description || !selectedBuilding) return;
    updateQuoteMutation.mutate({
      id: editingQuoteId,
      data: {
        room_number: editQuoteForm.room_number,
        work_date: editQuoteForm.work_date,
        description: editQuoteForm.description,
        amount: editQuoteForm.amount ?? 0,
        is_paid: editQuoteForm.is_paid ?? false,
        remarks: editQuoteForm.remarks ?? '',
      },
      buildingId: selectedBuilding.id,
    });
  }

  function handleDeleteQuote(id: string) {
    if (!selectedBuilding || !confirm('이 견적 내역을 삭제하시겠습니까?')) return;
    deleteQuoteMutation.mutate({ id, buildingId: selectedBuilding.id });
  }

  function togglePaid(quote: Quote) {
    if (!selectedBuilding) return;
    togglePaidMutation.mutate({ id: quote.id, isPaid: !quote.is_paid, buildingId: selectedBuilding.id });
  }

  const filtered = buildings.filter(b =>
    b.name.includes(search) || b.address.includes(search)
  );
  const totalAmount = quotes.reduce((s, q) => s + (q.amount || 0), 0);
  const paidAmount = quotes.filter(q => q.is_paid).reduce((s, q) => s + (q.amount || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;
  const paidRatio = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const sortedQuotes = [...quotes].sort((a, b) =>
    sortAsc ? a.work_date.localeCompare(b.work_date) : b.work_date.localeCompare(a.work_date)
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', minWidth: 0 }}>

      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #e8e8e8' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#171717', letterSpacing: '-0.3px' }}>견적 관리</h1>
        <p style={{ fontSize: 13, fontWeight: 400, color: '#9a9a9a', marginTop: 4 }}>
          현장별 시공 내역과 정산 현황을 관리합니다.
        </p>
      </div>

      {/* 메인 2-컬럼 */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ overflow: 'hidden' }}>

        {/* ── 왼쪽: 건물 목록 패널 ───────────────── */}
        <div className="building-panel">
          {/* 패널 헤더 */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <Building2 size={13} style={{ color: '#3ecf8e' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>건물 목록</span>
              {buildings.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#3ecf8e', background: '#f0fdf8', border: '1px solid #c6f0de', borderRadius: 99, padding: '1px 6px' }}>
                  {buildings.length}
                </span>
              )}
            </div>
            {/* 검색 */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#b2b2b2', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="건물 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, height: 32, paddingLeft: 30, fontSize: 12 }}
              />
            </div>
          </div>

          {/* 목록 */}
          <ScrollArea className="flex-1">
            {buildingsLoading ? (
              <BuildingListSkeleton />
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#b2b2b2', fontWeight: 500 }}>
                  {search ? '검색 결과 없음' : '등록된 건물이 없습니다.'}
                </p>
              </div>
            ) : (
              <div style={{ padding: '6px 8px' }}>
                {filtered.map(b => {
                  const isActive = selectedBuilding?.id === b.id;

                  if (editBuildingId === b.id) {
                    return (
                      <div
                        key={b.id}
                        style={{ marginBottom: 4, border: '1px solid #b5d5f5', borderRadius: 7, background: '#f0f5ff', padding: '10px' }}
                      >
                        <input
                          autoFocus
                          style={{ ...smallInputStyle, marginBottom: 5 }}
                          placeholder="건물명"
                          value={editBuildingForm.name ?? ''}
                          onChange={e => setEditBuildingForm({ ...editBuildingForm, name: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateBuilding()}
                        />
                        <input
                          style={{ ...smallInputStyle, marginBottom: 5 }}
                          placeholder="주소"
                          value={editBuildingForm.address ?? ''}
                          onChange={e => setEditBuildingForm({ ...editBuildingForm, address: e.target.value })}
                        />
                        <input
                          style={{ ...smallInputStyle, marginBottom: 8 }}
                          placeholder="비밀번호 (선택)"
                          value={editBuildingForm.password ?? ''}
                          onChange={e => setEditBuildingForm({ ...editBuildingForm, password: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => setEditBuildingId(null)}
                            style={{ flex: 1, height: 30, fontSize: 12, borderRadius: 6, border: '1px solid #e0e0e0', background: '#f5f5f5', cursor: 'pointer', color: '#707070', fontWeight: 500, transition: 'all 0.15s' }}
                            onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#eaeaea'; el.style.color = '#404040'; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f5f5f5'; el.style.color = '#707070'; }}
                          >취소</button>
                          <button
                            onClick={handleUpdateBuilding}
                            style={{ flex: 1, height: 30, fontSize: 12, borderRadius: 6, border: '1px solid #c6f0de', background: '#f0fdf8', cursor: 'pointer', color: '#24b47e', fontWeight: 600, transition: 'all 0.15s' }}
                            onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}
                          >저장</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={b.id}
                      className="group"
                      onClick={() => { setSelectedBuilding(b); setIsAddingQuote(false); setEditingQuoteId(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 4,
                        padding: '9px 10px',
                        borderRadius: 7,
                        border: isActive ? '1px solid #c6f0de' : '1px solid transparent',
                        background: isActive ? '#f0fdf8' : 'transparent',
                        cursor: 'pointer',
                        marginBottom: 2,
                        transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f7f7f7'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#171717' : '#404040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.name}
                        </p>
                        {b.address && (
                          <p style={{ fontSize: 11, color: '#9a9a9a', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.address}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditBuildingId(b.id);
                          setEditBuildingForm({ name: b.name, address: b.address || '', password: b.password || '' });
                        }}
                        className=""
                        style={{ width: 24, height: 24, borderRadius: 5, background: '#f0fdf8', border: '1px solid #c6f0de', color: '#3ecf8e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── 오른쪽: 컨텐츠 영역 ─────────────────── */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {!selectedBuilding ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: '#fff', border: '1px dashed #ddd', borderRadius: 10, textAlign: 'center', minHeight: 300 }}>
              <div style={{ width: 48, height: 48, background: '#f7f7f7', border: '1px solid #e8e8e8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Building2 size={20} style={{ color: '#b2b2b2' }} strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#171717', marginBottom: 6 }}>건물을 선택하세요</p>
              <p style={{ fontSize: 13, color: '#9a9a9a', lineHeight: 1.6 }}>
                왼쪽 목록에서 건물을 선택하면<br />시공 내역과 정산 현황이 표시됩니다.
              </p>
            </div>
          ) : (
            <>
              {/* 현장 정보 + 통계 통합 카드 */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                {/* 현장 헤더 */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f0fdf8', border: '1px solid #c6f0de', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={18} style={{ color: '#3ecf8e' }} strokeWidth={1.5} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 17, fontWeight: 700, color: '#171717', letterSpacing: '-0.3px', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedBuilding.name}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center' }}>
                        {selectedBuilding.address && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9a9a9a', fontWeight: 500 }}>
                            <MapPin size={11} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                            {selectedBuilding.address}
                          </span>
                        )}
                        {selectedBuilding.password && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a9a9a' }}>
                            <Lock size={11} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                            <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#24b47e', background: '#f0fdf8', border: '1px solid #c6f0de', borderRadius: 4, padding: '1px 7px', letterSpacing: '0.1em' }}>
                              {selectedBuilding.password}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#171717', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{quotes.length}</p>
                    <p style={{ fontSize: 11, color: '#b2b2b2', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>건</p>
                  </div>
                </div>

                {/* 통계 행 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                  {/* 총 금액 */}
                  <div style={{ padding: 'clamp(10px,2vw,14px) clamp(10px,3vw,20px)', borderRight: '1px solid #f0f0f0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>총 금액</p>
                    <p style={{ fontSize: 'clamp(13px,3vw,18px)', fontWeight: 700, color: '#171717', fontVariantNumeric: 'tabular-nums', lineHeight: 1, wordBreak: 'break-all' }}>
                      {totalAmount.toLocaleString()}
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#c0c0c0', marginLeft: 2 }}>원</span>
                    </p>
                  </div>
                  {/* 정산 완료 */}
                  <div style={{ padding: 'clamp(10px,2vw,14px) clamp(10px,3vw,20px)', borderRight: '1px solid #f0f0f0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>정산 완료</p>
                    <p style={{ fontSize: 'clamp(13px,3vw,18px)', fontWeight: 700, color: '#24b47e', fontVariantNumeric: 'tabular-nums', lineHeight: 1, wordBreak: 'break-all' }}>
                      {paidAmount.toLocaleString()}
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#c0c0c0', marginLeft: 2 }}>원</span>
                    </p>
                    <div style={{ marginTop: 7, height: 3, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${paidRatio}%`, background: '#3ecf8e', borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#b2b2b2', marginTop: 3, fontWeight: 700 }}>{Math.round(paidRatio)}%</p>
                  </div>
                  {/* 미정산 */}
                  <div style={{ padding: 'clamp(10px,2vw,14px) clamp(10px,3vw,20px)', background: unpaidAmount > 0 ? '#fff9f7' : undefined }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>미정산</p>
                    <p style={{ fontSize: 'clamp(13px,3vw,18px)', fontWeight: 700, color: unpaidAmount > 0 ? '#d94f2a' : '#c0c0c0', fontVariantNumeric: 'tabular-nums', lineHeight: 1, wordBreak: 'break-all' }}>
                      {unpaidAmount.toLocaleString()}
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#c0c0c0', marginLeft: 2 }}>원</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 내역 추가 폼 */}
              {isAddingQuote && (
                <QuoteFormPanel
                  formData={newQuote}
                  setFormData={setNewQuote}
                  onSave={handleAddQuote}
                  onCancel={() => setIsAddingQuote(false)}
                  title="새 시공 내역 추가"
                  saveLabel="저장"
                  accentBorder="#c6f0de"
                  accentBg="rgba(62,207,142,0.04)"
                  descRef={descRef}
                />
              )}

              {/* 내역 수정 폼 */}
              {editingQuoteId && (
                <QuoteFormPanel
                  formData={editQuoteForm}
                  setFormData={setEditQuoteForm}
                  onSave={handleUpdateQuote}
                  onCancel={() => setEditingQuoteId(null)}
                  title="시공 내역 수정"
                  saveLabel="수정 저장"
                  accentBorder="#b5d5f5"
                  accentBg="#f0f5ff"
                />
              )}

              {/* 시공 내역 테이블 */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'clamp(280px, 57vh, 540px)' }}>
                {/* 테이블 헤더 */}
                <div style={{ padding: '11px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={14} style={{ color: '#3ecf8e' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#171717' }}>시공 내역</span>
                    {quotes.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#24b47e', background: '#f0fdf8', border: '1px solid #c6f0de', borderRadius: 99, padding: '1px 8px' }}>
                        {quotes.length}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                    {quotes.length > 0 && (
                      <>
                        <button
                          onClick={() => setSortAsc(p => !p)}
                          style={{ height: 30, padding: '0 8px', borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', color: '#707070', fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                          onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#f5f5f5'; el.style.borderColor = '#d0d0d0'; }}
                          onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#fff'; el.style.borderColor = '#e8e8e8'; }}
                        >
                          {sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                          <span className="hidden sm:inline">{sortAsc ? '오래된순' : '최신순'}</span>
                        </button>
                        <button
                          onClick={async () => {
                            setPdfLoading('estimate');
                            try { await generateEstimatePDF(sortedQuotes, selectedBuilding); }
                            catch (e) { console.error('견적서 PDF 오류:', e); alert('PDF 생성 중 오류가 발생했습니다.\n' + (e instanceof Error ? e.message : String(e))); }
                            finally { setPdfLoading(null); }
                          }}
                          disabled={pdfLoading !== null}
                          title="견적서 PDF"
                          style={{ height: 30, padding: '0 10px', borderRadius: 6, background: '#f0fdf8', border: '1px solid #c6f0de', color: '#24b47e', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: pdfLoading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s', opacity: pdfLoading ? 0.6 : 1 }}
                          onMouseEnter={e => { if (!pdfLoading) { const el = e.currentTarget as HTMLElement; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; } }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}
                        >
                          <FileText size={12} />
                          <span className="hidden sm:inline">{pdfLoading === 'estimate' ? '생성 중…' : '견적서'}</span>
                        </button>
                        <button
                          onClick={async () => {
                            setPdfLoading('statement');
                            try { await generateStatementPDF(sortedQuotes, selectedBuilding); }
                            catch (e) { console.error('명세표 PDF 오류:', e); alert('PDF 생성 중 오류가 발생했습니다.\n' + (e instanceof Error ? e.message : String(e))); }
                            finally { setPdfLoading(null); }
                          }}
                          disabled={pdfLoading !== null}
                          title="거래명세표 PDF"
                          style={{ height: 30, padding: '0 10px', borderRadius: 6, background: '#f0f5ff', border: '1px solid #b5d5f5', color: '#3a7fd4', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: pdfLoading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s', opacity: pdfLoading ? 0.6 : 1 }}
                          onMouseEnter={e => { if (!pdfLoading) { const el = e.currentTarget as HTMLElement; el.style.background = '#dbeafe'; el.style.borderColor = '#3a7fd4'; } }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0f5ff'; el.style.borderColor = '#b5d5f5'; }}
                        >
                          <Receipt size={12} />
<span className="hidden sm:inline">{pdfLoading === 'statement' ? '생성 중…' : '명세표'}</span>
                        </button>
                      </>
                    )}
                    {!isAddingQuote && !editingQuoteId && (
                      <button
                        onClick={() => setIsAddingQuote(true)}
                        style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid #c6f0de', background: '#f0fdf8', color: '#24b47e', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}
                      >
                        <Plus size={12} />내역 추가
                      </button>
                    )}
                  </div>
                </div>

                {/* 테이블 스크롤 영역 — 가로·세로 모두 네이티브 스크롤 */}
                <div className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                  <table className="caption-bottom text-sm" style={{ width: '100%', minWidth: 680 }}>
                    <TableHeader className="sticky top-0 z-10 bg-[#fafafa]">
                      <TableRow className="hover:bg-transparent" style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <TableHead style={{ padding: '0 16px', height: 36, fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.06em', width: 72, background: '#fafafa' }}>호실</TableHead>
                        <TableHead style={{ padding: '0 16px', height: 36, fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.06em', width: 104, background: '#fafafa' }}>날짜</TableHead>
                        <TableHead style={{ padding: '0 16px', height: 36, fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#fafafa' }}>시공 내용</TableHead>
                        <TableHead style={{ padding: '0 16px', height: 36, fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.06em', width: 120, textAlign: 'right', background: '#fafafa' }}>금액 (원)</TableHead>
                        <TableHead style={{ padding: '0 16px', height: 36, fontSize: 10, fontWeight: 700, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.06em', width: 72, textAlign: 'center', background: '#fafafa' }}>정산</TableHead>
                        <TableHead style={{ width: 72, background: '#fafafa' }} />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotesLoading ? (
                        <QuoteTableSkeleton />
                      ) : (
                        <>
                          {sortedQuotes.map((q) => (
                            <TableRow
                              key={q.id}
                              className="group"
                              style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.1s', background: editingQuoteId === q.id ? '#f0f5ff' : '' }}
                              onMouseEnter={e => { if (editingQuoteId !== q.id) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                              onMouseLeave={e => { if (editingQuoteId !== q.id) (e.currentTarget as HTMLElement).style.background = ''; }}
                            >
                              <TableCell style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#171717', verticalAlign: 'top' }}>
                                {q.room_number}
                              </TableCell>
                              <TableCell style={{ padding: '14px 16px', fontSize: 12, fontWeight: 500, color: '#9a9a9a', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                {q.work_date}
                              </TableCell>
                              <TableCell style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#171717', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65 }}>
                                  {q.description}
                                </p>
                                {q.remarks && (
                                  <p style={{ fontSize: 12, fontWeight: 400, color: '#9a9a9a', marginTop: 4, lineHeight: 1.5 }}>{q.remarks}</p>
                                )}
                              </TableCell>
                              <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#171717', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums' }}>
                                {q.amount.toLocaleString()}원
                              </TableCell>
                              <TableCell style={{ padding: '14px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                                <button
                                  onClick={() => togglePaid(q)}
                                  title={q.is_paid ? '정산 완료 — 클릭해서 취소' : '미정산 — 클릭해서 완료 처리'}
                                  style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    border: q.is_paid ? '1px solid #b6edce' : '1px solid #e0e0e0',
                                    background: q.is_paid ? '#f0fdf8' : '#fff',
                                    color: q.is_paid ? '#24b47e' : '#d0d0d0',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                  }}
                                >
                                  <CheckCircle size={15} />
                                </button>
                              </TableCell>
                              <TableCell style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', gap: 3 }}>
                                  {/* 수정 */}
                                  <button
                                    onClick={() => {
                                      setEditingQuoteId(q.id);
                                      setEditQuoteForm({
                                        room_number: q.room_number,
                                        work_date: q.work_date,
                                        description: q.description,
                                        amount: q.amount,
                                        is_paid: q.is_paid,
                                        remarks: q.remarks ?? '',
                                      });
                                      setIsAddingQuote(false);
                                    }}
                                    title="수정"
                                    style={{ width: 30, height: 28, borderRadius: 6, background: '#f7f7f7', border: '1px solid #e0e0e0', color: '#707070', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#eaeaea'; el.style.borderColor = '#bbb'; }}
                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f7f7f7'; el.style.borderColor = '#e0e0e0'; }}
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  {/* 삭제 */}
                                  <button
                                    onClick={() => handleDeleteQuote(q.id)}
                                    title="삭제"
                                    style={{ width: 30, height: 28, borderRadius: 6, background: '#fff1f0', border: '1px solid #fcd4cf', color: '#d94f2a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fdddd6'; el.style.borderColor = '#d94f2a'; }}
                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff1f0'; el.style.borderColor = '#fcd4cf'; }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}

                          {quotes.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} style={{ height: 110, textAlign: 'center' }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#9a9a9a', marginBottom: 8 }}>아직 시공 내역이 없습니다.</p>
                                <button onClick={() => setIsAddingQuote(true)} style={{ fontSize: 12, fontWeight: 600, color: '#3ecf8e', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  + 첫 내역을 추가하세요
                                </button>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </table>
                </div>

                {/* 테이블 푸터 */}
                {quotes.length > 0 && (
                  <div style={{ padding: '10px 18px', borderTop: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#9a9a9a' }}>
                      정산 완료 <span style={{ fontWeight: 700, color: '#24b47e' }}>{quotes.filter(q => q.is_paid).length}</span>건
                    </span>
                    <span style={{ width: 1, height: 12, background: '#e0e0e0' }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#9a9a9a' }}>
                      합계 <span style={{ fontWeight: 700, color: '#171717', fontVariantNumeric: 'tabular-nums' }}>{totalAmount.toLocaleString()}</span>원
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

