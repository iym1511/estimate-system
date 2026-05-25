'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, X, Briefcase, Users, ChevronRight, UserPlus, Building, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Vendor { id: string; company_name: string; }
interface Employee { id: string; vendor_id: string; name: string; phone_number: string; }
interface BuildingData { id: string; vendor_id: string; employee_id: string | null; name: string; address: string; password?: string; created_at?: string; }

function ColHeader({
  icon: Icon, title, count, onAdd, isAddOpen, onSort, sortAsc,
}: {
  icon: React.ElementType; title: string; count?: number; onAdd?: () => void; isAddOpen?: boolean;
  onSort?: () => void; sortAsc?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}
    >
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color: '#3ecf8e' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
        {count !== undefined && count > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3ecf8e', background: '#f0fdf8', border: '1px solid #c6f0de', borderRadius: 99, padding: '1px 6px' }}>
            {count}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {onSort && (
          <button
            onClick={onSort}
            style={{
              height: 24, padding: '0 8px', borderRadius: 6,
              background: '#fff', border: '1px solid #e8e8e8',
              color: '#9a9a9a', fontSize: 10, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 3,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#f5f5f5'; el.style.borderColor = '#d0d0d0'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#fff'; el.style.borderColor = '#e8e8e8'; }}
          >
            {sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {sortAsc ? '오래된순' : '최신순'}
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: isAddOpen ? '#f5f5f5' : '#f0fdf8',
              border: isAddOpen ? '1px solid #e0e0e0' : '1px solid #c6f0de',
              color: isAddOpen ? '#9a9a9a' : '#24b47e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {isAddOpen ? <X size={12} /> : <Plus size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function ColEmpty({ icon: Icon, lines }: { icon: React.ElementType; lines: string[] }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 text-center"
      style={{ padding: '0 20px', minHeight: 220 }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f7f7f7', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color: '#c0c0c0' }} strokeWidth={1.5} />
      </div>
      <div>
        {lines.map((line, i) => (
          <p key={i} style={{ fontSize: 11, color: '#9a9a9a', fontWeight: 500, lineHeight: 1.6 }}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function AddForm({ children, onSave, saveLabel }: { children: React.ReactNode; onSave: () => void; saveLabel: string }) {
  return (
    <div style={{ padding: 14, borderBottom: '1px solid #f0f0f0', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
      <button
        onClick={onSave}
        style={{ width: '100%', justifyContent: 'center', height: 30, fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid #c6f0de', background: '#f0fdf8', color: '#24b47e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}
      >
        {saveLabel}
      </button>
    </div>
  );
}

/* ── 스켈레톤 ────────────────────────────────── */
function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: '8px 8px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '10px 12px', marginBottom: 2 }}>
          <div className="skeleton" style={{ height: 13, width: `${50 + (i % 3) * 20}%`, borderRadius: 4, marginBottom: 5 }} />
          <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
          <TableCell style={{ padding: '12px 20px' }}>
            <div className="skeleton" style={{ height: 13, width: `${60 + (i % 3) * 20}px`, borderRadius: 4 }} />
          </TableCell>
          <TableCell style={{ padding: '12px 20px' }}>
            <div className="skeleton" style={{ height: 11, width: `${80 + (i % 2) * 40}px`, borderRadius: 4 }} />
          </TableCell>
          <TableCell style={{ padding: '12px 20px' }}>
            <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 5 }} />
          </TableCell>
          <TableCell style={{ padding: '12px 20px' }} />
        </TableRow>
      ))}
    </>
  );
}

export default function VendorsPage() {
  const queryClient = useQueryClient();

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const [newVendor, setNewVendor] = useState({ company_name: '' });
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '', password: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', phone_number: '' });

  const [addingVendor, setAddingVendor] = useState(false);
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [addingEmployee, setAddingEmployee] = useState(false);

  const [editVendorId, setEditVendorId] = useState<string | null>(null);
  const [editVendorName, setEditVendorName] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
  const [editEmployeeForm, setEditEmployeeForm] = useState({ name: '', phone_number: '' });
  const [editVendorBuildingId, setEditVendorBuildingId] = useState<string | null>(null);
  const [editVendorBuildingForm, setEditVendorBuildingForm] = useState({ name: '', address: '', password: '' });
  const [sortBuildingsAsc, setSortBuildingsAsc] = useState(false);

  useEffect(() => {
    setSelectedEmployeeId(null);
    setAddingEmployee(false);
  }, [selectedVendorId]);

  /* ── 쿼리 ──────────────────────────────────── */
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vendors').select('id, company_name').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Vendor[];
    },
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', selectedVendorId],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('vendor_id', selectedVendorId!).order('name');
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!selectedVendorId,
  });

  const { data: buildings = [], isLoading: buildingsLoading } = useQuery({
    queryKey: ['vendor-buildings', selectedEmployeeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('buildings').select('*').eq('employee_id', selectedEmployeeId!).order('name');
      if (error) throw error;
      return data as BuildingData[];
    },
    enabled: !!selectedEmployeeId,
  });

  /* ── 뮤테이션: 업체 ─────────────────────────── */
  const addVendorMutation = useMutation({
    mutationFn: async (company_name: string) => {
      const { error } = await supabase.from('vendors').insert([{ company_name }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setNewVendor({ company_name: '' });
      setAddingVendor(false);
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (vars: { id: string; company_name: string }) => {
      const { error } = await supabase.from('vendors').update({ company_name: vars.company_name }).eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setEditVendorId(null);
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      if (selectedVendorId === id) setSelectedVendorId(null);
    },
  });

  /* ── 뮤테이션: 직원 ─────────────────────────── */
  const addEmployeeMutation = useMutation({
    mutationFn: async (vars: { name: string; phone_number: string; vendorId: string }) => {
      const { error } = await supabase.from('employees').insert([{ name: vars.name, phone_number: vars.phone_number, vendor_id: vars.vendorId }]);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['employees', vars.vendorId] });
      setNewEmployee({ name: '', phone_number: '' });
      setAddingEmployee(false);
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (vars: { id: string; name: string; phone_number: string; vendorId: string }) => {
      const { error } = await supabase.from('employees').update({ name: vars.name, phone_number: vars.phone_number }).eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['employees', vars.vendorId] });
      setEditEmployeeId(null);
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (vars: { id: string; vendorId: string }) => {
      const { error } = await supabase.from('employees').delete().eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['employees', vars.vendorId] });
      if (selectedEmployeeId === vars.id) setSelectedEmployeeId(null);
    },
  });

  /* ── 뮤테이션: 건물 ─────────────────────────── */
  const addBuildingMutation = useMutation({
    mutationFn: async (vars: { name: string; address: string; password: string; vendorId: string; employeeId: string }) => {
      const { error } = await supabase.from('buildings').insert([{ name: vars.name, address: vars.address, password: vars.password, vendor_id: vars.vendorId, employee_id: vars.employeeId }]);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-buildings', vars.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setNewBuilding({ name: '', address: '', password: '' });
      setAddingBuilding(false);
    },
  });

  const updateBuildingMutation = useMutation({
    mutationFn: async (vars: { id: string; name: string; address: string; password: string; employeeId: string }) => {
      const { error } = await supabase.from('buildings').update({ name: vars.name, address: vars.address, password: vars.password }).eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-buildings', vars.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setEditVendorBuildingId(null);
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: async (vars: { id: string; employeeId: string }) => {
      const { error } = await supabase.from('buildings').delete().eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-buildings', vars.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });

  /* ── 핸들러 ─────────────────────────────────── */
  function handleDeleteVendor(id: string) {
    if (!confirm('업체를 삭제하시겠습니까? 관련 모든 정보가 삭제됩니다.')) return;
    deleteVendorMutation.mutate(id);
  }

  function handleDeleteEmployee(id: string) {
    if (!selectedVendorId || !confirm('직원을 삭제하시겠습니까?')) return;
    deleteEmployeeMutation.mutate({ id, vendorId: selectedVendorId });
  }

  function handleDeleteBuilding(id: string) {
    if (!selectedEmployeeId || !confirm('건물을 삭제하시겠습니까?')) return;
    deleteBuildingMutation.mutate({ id, employeeId: selectedEmployeeId });
  }

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const sortedBuildings = [...buildings].sort((a, b) => {
    const da = a.created_at ?? '';
    const db = b.created_at ?? '';
    return sortBuildingsAsc ? da.localeCompare(db) : db.localeCompare(da);
  });

  const rowSelected = { background: '#f0fdf8', border: '1px solid #c6f0de', borderRadius: 7, color: '#171717' };
  const rowDefault = { border: '1px solid transparent', borderRadius: 7, color: '#707070', cursor: 'pointer' };

  const pencilBtn: React.CSSProperties = { background: '#f0fdf8', border: '1px solid #c6f0de', padding: 0, width: 26, height: 26, cursor: 'pointer', color: '#3ecf8e', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  const deleteBtn: React.CSSProperties = { background: '#fff1f0', border: '1px solid #fcd4cf', padding: 0, width: 26, height: 26, cursor: 'pointer', color: '#d94f2a', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* 페이지 헤더 */}
      <div style={{ paddingBottom: 24, borderBottom: '1px solid #e8e8e8' }}>
        <h1 className="heading-lg" style={{ color: '#171717' }}>업체 및 인력 관리</h1>
        <p style={{ fontSize: 13, color: '#9a9a9a', marginTop: 4 }}>업체, 담당 직원, 현장을 순차적으로 선택해 관리합니다.</p>
      </div>

      {/* 3-컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ overflow: 'hidden' }}>

        {/* 업체 */}
        <div className="col-panel lg:col-span-3 flex flex-col overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10 }}>
          <ColHeader icon={Briefcase} title="업체" count={vendors.length} onAdd={() => setAddingVendor(!addingVendor)} isAddOpen={addingVendor} />
          {addingVendor && (
            <AddForm onSave={() => { if (newVendor.company_name) addVendorMutation.mutate(newVendor.company_name); }} saveLabel="업체 등록">
              <Input className="h-8 text-sm border-[#e0e0e0] rounded-md" placeholder="업체명을 입력하세요" value={newVendor.company_name} onChange={(e) => setNewVendor({ company_name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && newVendor.company_name && addVendorMutation.mutate(newVendor.company_name)} />
            </AddForm>
          )}
          <ScrollArea className="flex-1">
            {vendorsLoading ? (
              <ListSkeleton rows={6} />
            ) : vendors.length === 0 ? (
              <ColEmpty icon={Briefcase} lines={['등록된 업체가 없습니다.']} />
            ) : (
              <div style={{ padding: '8px 8px' }}>
                {vendors.map((v) => {
                  const isActive = selectedVendorId === v.id;

                  if (editVendorId === v.id) {
                    return (
                      <div key={v.id} style={{ padding: '10px 12px', marginBottom: 2, border: '1px solid #b5d5f5', borderRadius: 7, background: '#f0f5ff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Input
                          autoFocus
                          className="h-7 text-sm border-[#e0e0e0] rounded-md"
                          value={editVendorName}
                          onChange={e => setEditVendorName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') updateVendorMutation.mutate({ id: v.id, company_name: editVendorName });
                            if (e.key === 'Escape') setEditVendorId(null);
                          }}
                        />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setEditVendorId(null)} style={{ flex: 1, height: 30, fontSize: 12, borderRadius: 6, border: '1px solid #e0e0e0', background: '#f5f5f5', cursor: 'pointer', color: '#707070', fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#eaeaea'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f5f5f5'; }}>취소</button>
                          <button onClick={() => updateVendorMutation.mutate({ id: v.id, company_name: editVendorName })} style={{ flex: 1, height: 30, fontSize: 12, borderRadius: 6, border: '1px solid #c6f0de', background: '#f0fdf8', cursor: 'pointer', color: '#24b47e', fontWeight: 600, transition: 'all 0.15s' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}>저장</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVendorId(v.id)}
                      className="group flex items-center justify-between"
                      style={{ padding: '10px 12px', marginBottom: 2, ...(isActive ? rowSelected : rowDefault), transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f7f7f7'; }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.company_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditVendorId(v.id); setEditVendorName(v.company_name); }}
                            className=""
                            style={pencilBtn}
                            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; el.style.color = '#3ecf8e'; }}
                            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; el.style.color = '#3ecf8e'; }}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteVendor(v.id); }}
                            className=""
                            style={deleteBtn}
                            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fdddd6'; el.style.borderColor = '#d94f2a'; el.style.color = '#d94f2a'; }}
                            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff1f0'; el.style.borderColor = '#fcd4cf'; el.style.color = '#d94f2a'; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {isActive && <ChevronRight size={14} style={{ color: '#3ecf8e' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* 직원 */}
        <div className="col-panel lg:col-span-3 flex flex-col overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10 }}>
          <ColHeader icon={Users} title="직원" count={employees.length} onAdd={selectedVendorId ? () => setAddingEmployee(!addingEmployee) : undefined} isAddOpen={addingEmployee} />
          {!selectedVendorId ? (
            <ColEmpty icon={Briefcase} lines={['업체를 먼저', '선택해주세요']} />
          ) : (
            <>
              {addingEmployee && (
                <AddForm onSave={() => {
                  if (!selectedVendorId || !newEmployee.name) return;
                  addEmployeeMutation.mutate({ ...newEmployee, vendorId: selectedVendorId });
                }} saveLabel="직원 추가">
                  <Input className="h-8 text-sm border-[#e0e0e0] rounded-md" placeholder="이름" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
                  <Input className="h-8 text-sm border-[#e0e0e0] rounded-md" placeholder="연락처 (010-xxxx-xxxx)" value={newEmployee.phone_number} onChange={(e) => setNewEmployee({ ...newEmployee, phone_number: e.target.value })} />
                </AddForm>
              )}
              <ScrollArea className="flex-1">
                {employeesLoading ? (
                  <ListSkeleton rows={5} />
                ) : employees.length === 0 ? (
                  <ColEmpty icon={UserPlus} lines={['등록된 직원이 없습니다.', '+ 버튼으로 추가하세요']} />
                ) : (
                  <div style={{ padding: '8px 8px' }}>
                    {employees.map((emp) => {
                      const isActive = selectedEmployeeId === emp.id;

                      if (editEmployeeId === emp.id) {
                        return (
                          <div key={emp.id} style={{ padding: '10px 12px', marginBottom: 2, border: '1px solid #b5d5f5', borderRadius: 7, background: '#f0f5ff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Input
                              autoFocus
                              className="h-7 text-sm border-[#e0e0e0] rounded-md"
                              placeholder="이름"
                              value={editEmployeeForm.name}
                              onChange={e => setEditEmployeeForm({ ...editEmployeeForm, name: e.target.value })}
                            />
                            <Input
                              className="h-7 text-sm border-[#e0e0e0] rounded-md"
                              placeholder="연락처"
                              value={editEmployeeForm.phone_number}
                              onChange={e => setEditEmployeeForm({ ...editEmployeeForm, phone_number: e.target.value })}
                            />
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => setEditEmployeeId(null)} style={{ flex: 1, height: 30, fontSize: 12, borderRadius: 6, border: '1px solid #e0e0e0', background: '#f5f5f5', cursor: 'pointer', color: '#707070', fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#eaeaea'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f5f5f5'; }}>취소</button>
                              <button onClick={() => {
                                if (!selectedVendorId) return;
                                updateEmployeeMutation.mutate({ id: emp.id, name: editEmployeeForm.name, phone_number: editEmployeeForm.phone_number, vendorId: selectedVendorId });
                              }} style={{ flex: 1, height: 30, fontSize: 12, borderRadius: 6, border: '1px solid #c6f0de', background: '#f0fdf8', cursor: 'pointer', color: '#24b47e', fontWeight: 600, transition: 'all 0.15s' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}>저장</button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={emp.id}
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className="group flex items-center justify-between"
                          style={{ padding: '10px 12px', marginBottom: 2, ...(isActive ? rowSelected : rowDefault), transition: 'background 0.1s' }}
                          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f7f7f7'; }}
                          onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                          <div style={{ overflow: 'hidden', minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</p>
                            <p style={{ fontSize: 11, color: '#9a9a9a', marginTop: 2 }}>{emp.phone_number || '연락처 없음'}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditEmployeeId(emp.id); setEditEmployeeForm({ name: emp.name ?? '', phone_number: emp.phone_number ?? '' }); }}
                                className=""
                                style={pencilBtn}
                                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; el.style.color = '#3ecf8e'; }}
                                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; el.style.color = '#3ecf8e'; }}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id); }}
                                className=""
                                style={deleteBtn}
                                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fdddd6'; el.style.borderColor = '#d94f2a'; el.style.color = '#d94f2a'; }}
                                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff1f0'; el.style.borderColor = '#fcd4cf'; el.style.color = '#d94f2a'; }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            {isActive && <ChevronRight size={14} style={{ color: '#3ecf8e' }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        {/* 담당 현장 */}
        <div className="col-panel lg:col-span-6 flex flex-col overflow-hidden" style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10 }}>
          <ColHeader icon={Building} title="담당 현장" count={buildings.length} onAdd={selectedEmployeeId ? () => setAddingBuilding(!addingBuilding) : undefined} isAddOpen={addingBuilding} onSort={buildings.length > 0 ? () => setSortBuildingsAsc(p => !p) : undefined} sortAsc={sortBuildingsAsc} />
          {!selectedEmployeeId ? (
            <ColEmpty icon={Users} lines={['직원을 선택하면', '담당 현장이 표시됩니다']} />
          ) : (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {selectedEmployee && (
                <div className="flex items-center gap-2 shrink-0" style={{ padding: '10px 20px', background: '#f7f7f7', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 99, background: '#3ecf8e', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{selectedEmployee.name}</span>
                  <span style={{ fontSize: 12, color: '#9a9a9a' }}>님 담당 현장</span>
                </div>
              )}
              <ScrollArea className="flex-1">
                <table className="w-full caption-bottom text-sm">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent" style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      {['현장명', '주소', '비밀번호', ''].map((h, i) => (
                        <TableHead key={i} style={{ padding: '0 20px', height: 36, fontSize: 10, fontWeight: 600, color: '#b2b2b2', textTransform: 'uppercase', letterSpacing: '0.06em', width: i === 3 ? 80 : undefined, background: '#fafafa' }}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addingBuilding && (
                      <TableRow style={{ background: '#f0fdf8', borderBottom: '1px solid #c6f0de' }}>
                        <TableCell style={{ padding: '8px 20px' }}><Input className="h-8 text-sm border-[#e0e0e0] rounded-md" placeholder="현장명" value={newBuilding.name} onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })} /></TableCell>
                        <TableCell style={{ padding: '8px 20px' }}><Input className="h-8 text-sm border-[#e0e0e0] rounded-md" placeholder="주소" value={newBuilding.address} onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })} /></TableCell>
                        <TableCell style={{ padding: '8px 20px' }}><Input className="h-8 text-sm border-[#e0e0e0] rounded-md font-mono" placeholder="비번" value={newBuilding.password} onChange={(e) => setNewBuilding({ ...newBuilding, password: e.target.value })} /></TableCell>
                        <TableCell style={{ padding: '8px 20px', textAlign: 'right' }}>
                          <button onClick={() => {
                            if (!selectedEmployeeId || !selectedVendorId || !newBuilding.name) return;
                            addBuildingMutation.mutate({ ...newBuilding, vendorId: selectedVendorId, employeeId: selectedEmployeeId });
                          }} style={{ width: 30, height: 30, borderRadius: 6, background: '#f0fdf8', border: '1px solid #c6f0de', color: '#24b47e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}>
                            <Save size={13} />
                          </button>
                        </TableCell>
                      </TableRow>
                    )}
                    {buildingsLoading ? (
                      <TableSkeleton rows={4} />
                    ) : (
                      <>
                        {sortedBuildings.map((b) => {
                          if (editVendorBuildingId === b.id) {
                            return (
                              <TableRow key={b.id} style={{ background: '#f0f5ff', borderBottom: '1px solid #b5d5f5' }}>
                                <TableCell style={{ padding: '8px 20px' }}><Input autoFocus className="h-8 text-sm border-[#e0e0e0] rounded-md" value={editVendorBuildingForm.name} onChange={(e) => setEditVendorBuildingForm({ ...editVendorBuildingForm, name: e.target.value })} /></TableCell>
                                <TableCell style={{ padding: '8px 20px' }}><Input className="h-8 text-sm border-[#e0e0e0] rounded-md" value={editVendorBuildingForm.address} onChange={(e) => setEditVendorBuildingForm({ ...editVendorBuildingForm, address: e.target.value })} /></TableCell>
                                <TableCell style={{ padding: '8px 20px' }}><Input className="h-8 text-sm border-[#e0e0e0] rounded-md font-mono" value={editVendorBuildingForm.password} onChange={(e) => setEditVendorBuildingForm({ ...editVendorBuildingForm, password: e.target.value })} /></TableCell>
                                <TableCell style={{ padding: '8px 20px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setEditVendorBuildingId(null)} style={{ width: 30, height: 30, borderRadius: 6, background: '#f5f5f5', border: '1px solid #e0e0e0', color: '#707070', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#eaeaea'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f5f5f5'; }}>
                                      <X size={13} />
                                    </button>
                                    <button onClick={() => {
                                      if (!selectedEmployeeId) return;
                                      updateBuildingMutation.mutate({ id: b.id, ...editVendorBuildingForm, employeeId: selectedEmployeeId });
                                    }} style={{ width: 30, height: 30, borderRadius: 6, background: '#f0fdf8', border: '1px solid #c6f0de', color: '#24b47e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}>
                                      <Save size={13} />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return (
                            <TableRow key={b.id} className="group" style={{ borderBottom: '1px solid #f5f5f5' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                              <TableCell style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#171717' }}>{b.name}</TableCell>
                              <TableCell style={{ padding: '12px 20px', fontSize: 12, color: '#9a9a9a', maxWidth: 160 }}>
                                <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address}</p>
                              </TableCell>
                              <TableCell style={{ padding: '12px 20px' }}>
                                <span className="font-mono" style={{ fontSize: 11, color: '#24b47e', background: '#f0fdf8', border: '1px solid #c6f0de', borderRadius: 5, padding: '2px 8px', letterSpacing: '0.1em' }}>
                                  {b.password || '----'}
                                </span>
                              </TableCell>
                              <TableCell style={{ padding: '12px 20px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                                  <button
                                    onClick={() => { setEditVendorBuildingId(b.id); setEditVendorBuildingForm({ name: b.name, address: b.address || '', password: b.password || '' }); }}
                                    className=""
                                    style={{ width: 30, height: 30, borderRadius: 6, background: '#f0fdf8', border: '1px solid #c6f0de', color: '#3ecf8e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#d4f7eb'; el.style.borderColor = '#3ecf8e'; }}
                                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0fdf8'; el.style.borderColor = '#c6f0de'; }}
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBuilding(b.id)}
                                    className=""
                                    style={{ width: 30, height: 30, borderRadius: 6, background: '#fff1f0', border: '1px solid #fcd4cf', color: '#d94f2a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fdddd6'; el.style.borderColor = '#d94f2a'; }}
                                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff1f0'; el.style.borderColor = '#fcd4cf'; }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {buildings.length === 0 && !addingBuilding && (
                          <TableRow>
                            <TableCell colSpan={4} style={{ height: 100, textAlign: 'center', fontSize: 12, color: '#9a9a9a' }}>담당 현장이 없습니다.</TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </table>
              </ScrollArea>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
