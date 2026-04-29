/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

const CURRENCY_OPTIONS: Record<string, { name: string; symbol: string; rate: number }> = {
  JPY: { name: '日圓', symbol: '¥', rate: 0.21 },
  KRW: { name: '韓元', symbol: '₩', rate: 0.024 },
  USD: { name: '美金', symbol: '$', rate: 32.5 },
  EUR: { name: '歐元', symbol: '€', rate: 35.2 },
  HKD: { name: '港幣', symbol: 'HK$', rate: 4.15 },
  NTD: { name: '台幣', symbol: 'NT$', rate: 1 }
};

const DEFAULT_DATA = {
  settings: { targetCurrency: 'JPY', exchangeRate: 0.21 },
  days: [{ date: '04/15' }, { date: '04/16' }, { date: '04/17' }, { date: '04/18' }, { date: '04/19' }],
  schedule: [
    [
      { type: '交通', time: '08:30', title: '桃園機場 第一航廈', note: '搭乘 CI104 航班', category: 'transport' },
      { type: '美食', time: '13:00', title: '成田機場 壽司店', note: '抵達第一餐！', category: 'food' },
      { type: '景點', time: '15:30', title: '淺草寺雷門', note: '大燈籠拍照', category: 'spot' }
    ],
    [{ type: '景點', time: '09:00', title: '東京迪士尼樂園', note: '整天都在這！', category: 'spot' }],
    [], [], []
  ],
  bookings: [
    { id: 1, type: 'flight', code: 'CI 104', gate: 'A7', from: 'TPE', fromDate: '15 APR 08:30', to: 'NRT', toDate: '15 APR 12:45', boarding: '07:50', datetime: '2026-04-15T08:30' },
    { id: 2, type: 'hotel', icon: '🏨', title: '新宿格拉斯麗飯店', sub: '入住: 15:00 / 退房: 11:00', price: '¥ 45,000', datetime: '2026-04-15T15:00' }
  ],
  expenses: [
    { id: 1, icon: '🍜', title: '一蘭拉麵', amount: 1200, date: '04/15', payer: '小明', split: '全體' },
    { id: 2, icon: '🛍️', title: '藥妝買買買', amount: 8500, date: '04/15', payer: 'Gemini', split: '個人' }
  ],
  plans: {
    pack: [
      { text: '行動電源', done: false },
      { text: '護照', done: true }
    ],
    buy: [
      { store: '松本清', item: '合利他命 EX', budget: 5400, link: 'https://www.matsukiyococokara-online.com/', done: false },
      { store: 'Donki', item: '一蘭拉麵包', budget: 2000, link: '', done: false },
      { store: '松本清', item: '蒸氣眼罩', budget: 1200, link: '', done: true }
    ]
  }
};

const TABS = [
  { id: 'schedule', icon: '📅', label: '行程' },
  { id: 'bookings', icon: '🎫', label: '預訂' },
  { id: 'expense', icon: '💰', label: '記帳' },
  { id: 'planning', icon: '📝', label: '準備' },
  { id: 'settings', icon: '⚙️', label: '設定' }
];

export default function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('mori_travel_v2');
    if (saved) return JSON.parse(saved);
    return DEFAULT_DATA;
  });

  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [planType, setPlanType] = useState<'pack' | 'buy'>('pack');
  const [pin, setPin] = useState({ show: false, input: '' });
  const [modal, setModal] = useState<any>({ show: false, type: '', title: '', form: {} });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    localStorage.setItem('mori_travel_v2', JSON.stringify(data));
  }, [data]);

  const clearAllData = () => {
    setConfirmDialog({
      show: true,
      message: '確定要清除所有資料嗎？這個動作無法復原！',
      onConfirm: () => {
        setData({
          settings: { targetCurrency: 'JPY', exchangeRate: 0.21 },
          days: [{ date: '新日期' }],
          schedule: [[]],
          bookings: [],
          expenses: [],
          plans: {
            pack: [],
            buy: []
          }
        });
        setActiveTab('schedule');
        setConfirmDialog(prev => ({ ...prev, show: false }));
      }
    });
  };

  const saveToPDF = () => {
    if (window.self !== window.top) {
      setConfirmDialog({
        show: true,
        message: '因為預覽模式的限制，請先在新分頁開啟應用程式。開啟後，再次點擊「儲存成 PDF」即可順利匯出！',
        onConfirm: () => {
          window.open(window.location.href, '_blank');
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      });
    } else {
      window.print();
    }
  };

  const getCategoryColor = (type: string) => {
    const map: Record<string, string> = { '交通': '#60A5FA', '美食': '#F97316', '景點': '#10B981', '住宿': '#A855F7', '購物': '#EC4899' };
    return map[type] || '#8D775F';
  };

  const getTotalExpense = () => data.expenses.reduce((sum: number, item: any) => {
    const amt = Number(item.amount) || 0;
    if (item.currency === 'NTD') {
      return sum + (amt / (data.settings.exchangeRate || 1));
    }
    return sum + amt;
  }, 0);
  const formatNumber = (num: number | string) => Number(num || 0).toLocaleString();
  const getCurrencySymbol = () => CURRENCY_OPTIONS[data.settings.targetCurrency]?.symbol || '';

  const getSortedBuyList = () => {
    return [...data.plans.buy].sort((a, b) => {
      const storeA = a.store || '其他';
      const storeB = b.store || '其他';
      return storeA.localeCompare(storeB, 'zh-TW');
    });
  };

  const togglePlanItem = (type: 'pack', idx: number) => {
    setData((prev: any) => {
      const next = { ...prev };
      const newList = [...next.plans[type]];
      newList[idx] = { ...newList[idx], done: !newList[idx].done };
      next.plans = { ...next.plans, [type]: newList };
      return next;
    });
  };

  const toggleBuyItem = (itemReference: any) => {
    setData((prev: any) => {
      const next = { ...prev };
      let isNowDone = false;
      let newExpenseId: number | undefined;

      next.plans = {
        ...next.plans,
        buy: next.plans.buy.map((i: any) => {
          if (i === itemReference) {
            isNowDone = !i.done;
            if (isNowDone) {
              newExpenseId = Date.now();
              return { ...i, done: true, expenseId: newExpenseId };
            } else {
              return { ...i, done: false };
            }
          }
          return i;
        })
      };

      if (isNowDone && newExpenseId) {
        const dateStr = next.days[0]?.date || '';
        const newExpense = {
          id: newExpenseId,
          icon: itemReference.icon || '🛍️',
          title: itemReference.item,
          amount: itemReference.budget || 0,
          currency: itemReference.currency || 'TARGET',
          date: dateStr,
          payer: '購物清單',
          split: '個人',
          expenseId: newExpenseId
        };
        next.expenses = [newExpense, ...next.expenses];
      } else if (!isNowDone && itemReference.expenseId) {
        next.expenses = next.expenses.filter((ex: any) => ex.id !== itemReference.expenseId);
      }
      return next;
    });
  };

  const deleteExpense = (id: number) => {
    setConfirmDialog({
      show: true,
      message: '確定要刪除這筆花費嗎？',
      onConfirm: () => {
        setData((prev: any) => ({
          ...prev,
          expenses: prev.expenses.filter((ex: any) => ex.id !== id)
        }));
        setConfirmDialog(prev => ({ ...prev, show: false }));
      }
    });
  };

  const changeTargetCurrency = (code: string) => {
    setData((prev: any) => ({
      ...prev,
      settings: { ...prev.settings, targetCurrency: code, exchangeRate: CURRENCY_OPTIONS[code].rate }
    }));
  };

  const handlePinInput = (n: number) => {
    if (pin.input.length < 3) {
      const newInput = pin.input + n;
      if (newInput.length === 3) {
        if (newInput === '007') {
          setPin({ show: false, input: '' });
          // execute callback if needed
        } else {
          setPin({ show: true, input: '' });
        }
      } else {
        setPin({ ...pin, input: newInput });
      }
    }
  };

  const openAddModal = (type: string, itemToEdit?: any, index?: number, originalDayIndex?: number) => {
    if (type === 'expense') {
      const today = new Date().toISOString().split('T')[0];
      setModal({ show: true, type, title: '花費', form: { icon: '🍜', title: '', amount: '', currency: 'TARGET', date: today, payer: '自己', split: '全體' } });
    } else if (type === 'schedule') {
      const isEditing = !!itemToEdit;
      setModal({ show: true, type, title: '行程項目', isEditing, editIndex: index, originalDayIndex, form: isEditing ? { ...itemToEdit, dayIndex: originalDayIndex } : { type: '景點', time: '12:00', title: '', note: '', dayIndex: selectedDayIndex } });
    } else if (type === 'buy') {
      setModal({ show: true, type, title: '清單項目', form: { icon: '🛍️', store: '', item: '', budget: '', currency: 'TARGET', link: '', done: false } });
    } else if (type === 'booking') {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const currentDatetime = now.toISOString().slice(0, 16);
      setModal({ show: true, type, title: '預訂資料', form: { type: 'hotel', icon: '🏨', title: '', sub: '', price: '', currency: 'TARGET', datetime: currentDatetime } });
    } else if (type === 'pack') {
      setModal({ show: true, type, title: '行李', form: { text: '', done: false } });
    }
  };

  const deleteScheduleItem = () => {
    if (modal.type === 'schedule' && modal.isEditing) {
      setData((prev: any) => {
        const next = { ...prev };
        const newSchedule = [...next.schedule];
        const dayIndex = modal.originalDayIndex;
        const daySchedule = [...newSchedule[dayIndex]];
        daySchedule.splice(modal.editIndex, 1);
        newSchedule[dayIndex] = daySchedule;
        next.schedule = newSchedule;
        return next;
      });
      setModal((prev: any) => ({ ...prev, show: false }));
    }
  };

  const updateForm = (key: string, val: any) => setModal((prev: any) => ({ ...prev, form: { ...prev.form, [key]: val } }));

  const saveModalData = () => {
    setData((prev: any) => {
      const next = { ...prev };
      if (modal.type === 'expense') {
        next.expenses = [{ ...modal.form, id: Date.now() }, ...next.expenses];
      } else if (modal.type === 'schedule') {
        const newSchedule = [...next.schedule];
        const targetDayIndex = modal.form.dayIndex !== undefined ? Number(modal.form.dayIndex) : selectedDayIndex;
        
        if (modal.isEditing) {
          const originalDayIndex = modal.originalDayIndex;
          if (originalDayIndex === targetDayIndex) {
            const daySchedule = [...newSchedule[targetDayIndex]];
            daySchedule[modal.editIndex] = { ...modal.form };
            newSchedule[targetDayIndex] = daySchedule;
          } else {
            const origSchedule = [...newSchedule[originalDayIndex]];
            origSchedule.splice(modal.editIndex, 1);
            newSchedule[originalDayIndex] = origSchedule;
            
            const tgtSchedule = [...newSchedule[targetDayIndex]];
            tgtSchedule.push({ ...modal.form });
            newSchedule[targetDayIndex] = tgtSchedule;
          }
        } else {
          const daySchedule = [...newSchedule[targetDayIndex]];
          daySchedule.push({ ...modal.form });
          newSchedule[targetDayIndex] = daySchedule;
        }
        
         newSchedule[targetDayIndex].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        next.schedule = newSchedule;
      } else if (modal.type === 'buy') {
        next.plans = { ...next.plans, buy: [...next.plans.buy, { ...modal.form }] };
      } else if (modal.type === 'booking') {
        const newBookingId = Date.now();
        next.bookings = [...next.bookings, { ...modal.form, id: newBookingId }];
        if (modal.form.price) {
          next.expenses = [{
            id: newBookingId + 1,
            icon: modal.form.icon || '🎫',
            title: modal.form.title || modal.form.code || '預訂項目',
            amount: Number(modal.form.price) || 0,
            currency: modal.form.currency || 'TARGET',
            date: next.days[0]?.date || '',
            payer: '預訂',
            split: '全體',
            bookingId: newBookingId
          }, ...next.expenses];
        }
      } else if (modal.type === 'pack') {
        next.plans = { ...next.plans, [modal.type]: [...next.plans[modal.type], { ...modal.form }] };
      }
      return next;
    });
    setModal((prev: any) => ({ ...prev, show: false }));
  };

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
      {/* 頂部狀態列 */}
      <header className="p-6 pb-2 sticky top-0 z-40 bg-[#F7F4EB]/80 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold handwriting text-[#5C8D50] flex items-center">🌲 森之小旅</h1>
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Our Adventure Journal</p>
          </div>
        </div>
      </header>

      {/* 主內容區 */}
      <main className="px-4 pb-32">
        {/* 1. 行程 (Schedule) */}
        {activeTab === 'schedule' && (
          <section className="animate-slide-up">
            <div className="flex space-x-3 overflow-x-auto no-scrollbar mb-6 py-2 px-1">
              {data.days.map((day: any, index: number) => (
                <div
                  key={index}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`relative ac-card flex-shrink-0 w-20 h-20 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedDayIndex === index ? 'bg-[#789262] text-white border-[#5C6E4B] scale-105 z-10' : 'bg-white'
                  }`}
                >
                  {selectedDayIndex === index && data.days.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDialog({
                          show: true,
                          message: '確定要刪除這天嗎？',
                          onConfirm: () => {
                            setData((prev: any) => {
                              const newDays = prev.days.filter((_: any, i: number) => i !== index);
                              const newSchedule = prev.schedule.filter((_: any, i: number) => i !== index);
                              setSelectedDayIndex(Math.min(index, Math.max(0, newDays.length - 1)));
                              return { ...prev, days: newDays, schedule: newSchedule };
                            });
                            setConfirmDialog(prev => ({ ...prev, show: false }));
                          }
                        });
                      }}
                      className="absolute -top-2 -right-2 bg-red-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold leading-none shadow-sm"
                    >
                      ✕
                    </button>
                  )}
                  <span className="text-[10px] font-bold mb-1">DAY {index + 1}</span>
                  <input
                    type="text"
                    value={day.date}
                    onClick={(e) => { if (selectedDayIndex === index) e.stopPropagation(); }}
                    onChange={(e) => {
                      const newDays = [...data.days];
                      newDays[index] = { ...newDays[index], date: e.target.value };
                      setData((prev: any) => ({ ...prev, days: newDays }));
                    }}
                    className="w-full text-center bg-transparent outline-none text-sm font-bold handwriting"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  setData((prev: any) => ({
                    ...prev,
                    days: [...prev.days, { date: '新日期' }],
                    schedule: [...prev.schedule, []]
                  }));
                }}
                className="ac-card flex-shrink-0 w-12 h-20 flex items-center justify-center bg-white text-[#789262] transition-all hover:bg-gray-50"
              >
                <span className="text-2xl font-bold">+</span>
              </button>
            </div>
            <div className="relative ml-4 border-l-2 border-dashed border-[#789262]/30 pl-8 space-y-6">
              {(data.schedule[selectedDayIndex] || []).map((item: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[41px] top-4 w-5 h-5 rounded-full bg-white border-4 border-[#789262] z-10" />
                  <div className="ac-card p-4 relative active:scale-[0.98] transition-transform cursor-pointer" onClick={() => openAddModal('schedule', item, idx, selectedDayIndex)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: getCategoryColor(item.type) }}>
                        {item.type}
                      </span>
                      <span className="text-xs font-mono font-bold opacity-60">{item.time}</span>
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1${idx > 0 ? `&origin=${encodeURIComponent(data.schedule[selectedDayIndex][idx - 1].title)}` : ''}&destination=${encodeURIComponent(item.title)}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-full font-bold shadow-sm whitespace-nowrap ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {idx > 0 ? '🗺️ 路線' : '🗺️ 地圖'}
                      </a>
                    </div>
                    <p className="text-sm opacity-70">{item.note}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => openAddModal('schedule')}
                className="w-full py-4 border-2 border-dashed border-[#789262] rounded-3xl text-[#789262] font-bold handwriting text-lg"
              >
                + 新增行程小碎片
              </button>
            </div>
          </section>
        )}

        {/* 2. 預訂 (Bookings) */}
        {activeTab === 'bookings' && (
          <section className="animate-slide-up">
            <h2 className="text-xl font-bold handwriting mb-4">🎫 票券與憑證</h2>
            <div className="space-y-6">
              {[...data.bookings].sort((a: any, b: any) => (a.datetime || a.fromDate || '').localeCompare(b.datetime || b.fromDate || '')).map((b: any) => (
                <div key={b.id} className="relative">
                  {b.type === 'flight' ? (
                    <div className="ac-card bg-[#F87171] text-white p-0 overflow-hidden relative shadow-[4px_4px_0px_#B91C1C]">
                      <div className="p-4 border-b border-dashed border-white/40 flex justify-between items-center">
                        <div>
                          <p className="text-[8px] uppercase opacity-80">Flight No.</p>
                          <p className="text-xl font-black font-mono">{b.code || b.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase opacity-80">Gate</p>
                          <p className="text-xl font-black font-mono">{b.gate || '--'}</p>
                        </div>
                      </div>
                      <div className="pt-6 px-6 flex justify-between items-center">
                        <div className="text-center"><p className="text-3xl font-black handwriting">{b.from || '---'}</p></div>
                        <div className="flex-1 px-4 flex flex-col items-center">✈️</div>
                        <div className="text-center"><p className="text-3xl font-black handwriting">{b.to || '---'}</p></div>
                      </div>
                      {b.datetime && (
                         <div className="px-6 pb-4 text-center mt-2">
                             <p className="text-sm font-bold opacity-90">{b.datetime.replace('T', ' ')}</p>
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="ac-card p-4 flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#E0E5D5] flex items-center justify-center text-3xl">{b.icon || '🎟️'}</div>
                      <div className="flex-1">
                        <h3 className="font-bold">{b.title}</h3>
                        {b.datetime && <p className="text-[10px] font-bold text-[#789262]">{b.datetime.replace('T', ' ')}</p>}
                        <p className="text-xs opacity-60">{b.sub}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => openAddModal('booking')}
              className="mt-6 w-full py-4 border-2 border-dashed border-[#789262] rounded-3xl text-[#789262] font-bold handwriting text-lg"
            >
              + 新增預訂資料
            </button>
          </section>
        )}

        {/* 3. 記帳 (Expense) */}
        {activeTab === 'expense' && (
          <section className="animate-slide-up">
            <div className="ac-card p-4 mb-6 bg-gray-50 flex items-center justify-between border-dashed">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">目的地幣別</span>
                <select
                  value={data.settings.targetCurrency}
                  onChange={(e) => changeTargetCurrency(e.target.value)}
                  className="bg-transparent font-bold text-lg outline-none"
                >
                  {Object.entries(CURRENCY_OPTIONS).map(([code, info]) => (
                    <option key={code} value={code}>{code} ({info.name})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">當前匯率 (對台幣)</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold">1 : </span>
                  <input
                    type="number"
                    step="0.001"
                    value={data.settings.exchangeRate}
                    onChange={(e) => setData({ ...data, settings: { ...data.settings, exchangeRate: Number(e.target.value) || 0 } })}
                    className="w-16 bg-white border-b-2 border-[#789262] text-right font-mono font-bold text-sm px-1"
                  />
                </div>
              </div>
            </div>

            <div className="ac-card p-6 bg-[#A2D2FF] mb-6 text-center shadow-[4px_4px_0px_#73A9D9]">
              <p className="text-xs font-black text-blue-800/60 uppercase mb-1">旅行總支出</p>
              <div className="flex justify-center items-end space-x-2">
                <span className="text-sm font-bold text-blue-800/80">{data.settings.targetCurrency}</span>
                <h2 className="text-4xl font-black text-blue-900 handwriting">{formatNumber(Math.round(getTotalExpense()))}</h2>
              </div>
              <div className="mt-2 text-xs font-bold text-blue-800/40">
                約 NT$ <span>{formatNumber(Math.round(getTotalExpense() * data.settings.exchangeRate))}</span>
              </div>
            </div>

            <div className="space-y-3">
              {data.expenses.map((ex: any) => (
                <div key={ex.id} className="relative ac-card p-4 flex justify-between items-center group">
                  <button 
                    onClick={() => deleteExpense(ex.id)}
                    className="absolute -top-2 -right-2 bg-red-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                  >
                    ✕
                  </button>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">{ex.icon}</div>
                    <div>
                      <p className="font-bold text-sm">{ex.title}</p>
                      <p className="text-[10px] opacity-40">{ex.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {ex.currency === 'NTD' ? (
                      <>
                        <p className="font-black text-red-500">NT$ {formatNumber(ex.amount)}</p>
                        <p className="text-[8px] font-bold opacity-30">{getCurrencySymbol()} {formatNumber(Math.round(ex.amount / (data.settings.exchangeRate || 1)))}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-black text-red-500">{getCurrencySymbol()} {formatNumber(ex.amount)}</p>
                        <p className="text-[8px] font-bold opacity-30">NT$ {formatNumber(Math.round(ex.amount * data.settings.exchangeRate))}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => openAddModal('expense')} className="fixed bottom-24 right-6 w-14 h-14 ac-btn-primary rounded-full text-2xl z-40">＋</button>
          </section>
        )}

        {/* 5. 準備 (Planning) */}
        {activeTab === 'planning' && (
          <section className="animate-slide-up">
            <div className="flex space-x-2 mb-6">
              {(['pack', 'buy'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanType(p)}
                  className={`ac-card flex-1 py-3 text-sm font-bold transition-all ${
                    planType === p ? 'bg-[#789262] text-white shadow-[0px_4px_0px_#5C6E4B]' : 'bg-white'
                  }`}
                >
                  {p === 'pack' ? '行李' : '清單'}
                </button>
              ))}
            </div>

            {planType !== 'buy' && (
              <div className="space-y-3">
                <div className="flex justify-end px-1">
                  <button onClick={() => openAddModal(planType)} className="text-xs bg-[#789262] text-white px-3 py-1 rounded-full font-bold shadow-sm">
                    ＋ 新增項目
                  </button>
                </div>
                {data.plans[planType].map((item: any, idx: number) => (
                  <label key={idx} className="ac-card p-4 flex items-center space-x-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => togglePlanItem(planType, idx)}
                      className="w-6 h-6 rounded-lg border-2 border-[#789262] accent-[#789262]"
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`font-bold text-sm ${item.done ? 'line-through opacity-30' : ''}`}>{item.text}</span>
                      {item.assignee && (
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold whitespace-nowrap ml-2">
                          {item.assignee}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {planType === 'buy' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">幣別: {data.settings.targetCurrency}</p>
                  <button onClick={() => openAddModal('buy')} className="text-xs bg-[#789262] text-white px-3 py-1 rounded-full font-bold shadow-sm">
                    ＋ 新增商品
                  </button>
                </div>

                {getSortedBuyList().map((item: any, idx: number) => (
                  <div key={idx} className={`ac-card p-4 flex flex-col space-y-3 relative overflow-hidden ${item.done ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleBuyItem(item)}
                          className="w-5 h-5 rounded border-2 border-[#789262] accent-[#789262] cursor-pointer"
                        />
                        <div>
                          <span className="text-[10px] font-bold bg-[#E0E5D5] px-2 py-0.5 rounded text-[#5C6E4B]">{item.store || '未分類店家'}</span>
                          <h4 className={`font-bold text-base mt-1 flex items-center space-x-1 ${item.done ? 'line-through' : ''}`}>
                            {item.icon && <span>{item.icon}</span>}
                            <span>{item.item}</span>
                          </h4>
                        </div>
                      </div>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-sm">
                          🔗
                        </a>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold opacity-40 uppercase">預算估計</p>
                        <p className="font-mono font-bold text-sm">
                          {item.currency === 'NTD' ? (
                            <><span className="text-[#789262]">NT$</span> <span>{formatNumber(item.budget)}</span></>
                          ) : (
                            <><span className="text-[#789262]">{getCurrencySymbol()}</span> <span>{formatNumber(item.budget)}</span></>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold opacity-40 uppercase">{item.currency === 'NTD' ? `約 ${data.settings.targetCurrency}` : '約台幣'}</p>
                        <p className="font-mono font-bold text-sm text-amber-600">
                          {item.currency === 'NTD' ? getCurrencySymbol() : 'NT$'} <span>{formatNumber(Math.round(item.currency === 'NTD' ? item.budget / (data.settings.exchangeRate || 1) : item.budget * data.settings.exchangeRate))}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 6. 設定 (Settings) */}
        {activeTab === 'settings' && (
          <section className="animate-slide-up space-y-6">
            <h2 className="text-xl font-bold handwriting mb-4 text-center">⚙️ 設定與管理</h2>
            
            <div className="space-y-4">
              <div className="ac-card p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer active:scale-95 transition-transform" onClick={saveToPDF}>
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-2xl font-bold mb-2 shadow-sm">
                  📄
                </div>
                <div>
                  <h3 className="font-bold text-lg">儲存成 PDF</h3>
                  <p className="text-xs text-gray-500 mt-1">列印或將行程存為 PDF，方便離線查看</p>
                </div>
              </div>

              <div className="ac-card p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer active:scale-95 transition-transform" onClick={clearAllData}>
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-2xl font-bold mb-2 shadow-sm">
                  🗑️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-red-500">清除所有資料</h3>
                  <p className="text-xs text-gray-500 mt-1">此動作無法復原，請謹慎操作</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 底部導航 */}
      <nav className="bottom-nav fixed bottom-0 w-full h-20 flex items-center justify-around px-2 z-50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 transition-all ${
              activeTab === tab.id ? 'text-[#789262] -translate-y-1' : 'text-gray-400 opacity-60'
            }`}
          >
            <div className="text-2xl mb-1">{tab.icon}</div>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
      </div>

      {/* 列印專用 (PDF 排版) */}
      <div className="hidden print:block bg-white text-black p-8 min-h-screen">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold handwriting text-[#5C8D50]">🌲 森之小旅</h1>
          <p className="text-sm opacity-60 font-bold uppercase tracking-widest mt-1">Our Adventure Journal</p>
        </div>

        {/* 行程表 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-gray-200 handwriting flex items-center">
            <span className="text-3xl mr-2">📅</span> 行程總覽
          </h2>
          <div className="space-y-8">
            {data.days.map((day: any, index: number) => (
              <div key={index} className="break-inside-avoid relative">
                <h3 className="font-bold text-lg bg-[#E0E5D5] inline-block px-4 py-1.5 rounded-lg mb-4 text-[#5C6E4B]">
                  DAY {index + 1} <span className="ml-2 font-normal text-sm">{day.date}</span>
                </h3>
                <div className="pl-4 border-l-2 border-[#789262] space-y-5">
                  {(data.schedule[index] || []).length > 0 ? (
                    data.schedule[index].map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col mb-4">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: getCategoryColor(item.type) }}>
                            {item.type}
                          </span>
                          <span className="text-sm font-mono font-bold text-gray-500 w-12">{item.time}</span>
                          <span className="font-bold text-base text-gray-800">{item.title}</span>
                        </div>
                        {item.note && <p className="text-sm text-gray-500 pl-[92px]">{item.note}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">無行程</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 記帳紀錄 */}
        <div className="break-before-page pt-4">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-gray-200 handwriting flex items-center">
            <span className="text-3xl mr-2">💰</span> 記帳紀錄
          </h2>
          
          <div className="bg-gray-50 p-6 rounded-xl mb-6 text-center border-2 border-dashed border-gray-200">
            <span className="text-sm font-bold text-gray-500">旅行總支出</span>
            <div className="text-3xl font-black mt-2 text-[#5C6E4B] handwriting">
              <span className="text-lg">{data.settings.targetCurrency}</span> {formatNumber(Math.round(getTotalExpense()))}
            </div>
            <div className="text-sm font-bold text-gray-400 mt-1">
              約 NT$ {formatNumber(Math.round(getTotalExpense() * data.settings.exchangeRate))}
            </div>
          </div>

          <table className="w-full text-left border-collapse mt-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="p-3 font-bold text-sm text-gray-600">日期</th>
                <th className="p-3 font-bold text-sm text-gray-600">項目</th>
                <th className="p-3 font-bold text-sm text-right text-gray-600">花費 ({data.settings.targetCurrency})</th>
                <th className="p-3 font-bold text-sm text-right text-gray-600">折合台幣</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.map((ex: any) => (
                <tr key={ex.id} className="border-b border-gray-200">
                  <td className="p-3 text-sm text-gray-600">{ex.date}</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                       <span className="w-6 text-center">{ex.icon}</span>
                       <span className="font-bold text-sm text-gray-800">{ex.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-right font-mono font-bold text-gray-700">
                    {ex.currency !== 'NTD' ? `${getCurrencySymbol()} ${formatNumber(ex.amount)}` : '-'}
                  </td>
                  <td className="p-3 text-sm text-right font-mono font-bold text-gray-500">
                    NT$ {formatNumber(Math.round(ex.currency === 'NTD' ? ex.amount : ex.amount * data.settings.exchangeRate))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIN 碼彈窗 */}
      {pin.show && (
        <div className="print:hidden fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="ac-card p-8 w-full max-w-xs text-center">
            <h3 className="font-bold text-xl mb-6 handwriting">🔒 秘密保護</h3>
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-16 border-b-4 border-[#789262] text-3xl font-black flex items-center justify-center handwriting">
                  {pin.input.length >= i ? '●' : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button key={n} onClick={() => handlePinInput(n)} className="ac-card p-4 font-bold text-xl active:bg-gray-100">{n}</button>
              ))}
              <div />
              <button onClick={() => handlePinInput(0)} className="ac-card p-4 font-bold text-xl active:bg-gray-100">0</button>
              <button onClick={() => setPin({ show: false, input: '' })} className="ac-card p-4 font-bold text-sm bg-red-50 text-red-500">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 通用 Confirm Dialog */}
      {confirmDialog.show && (
        <div className="print:hidden fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))} />
          <div className="ac-card w-full max-w-sm bg-white p-6 rounded-[30px] z-10 animate-slide-up text-center">
            <h3 className="text-xl font-bold mb-4">{confirmDialog.message}</h3>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))} className="flex-1 py-3 bg-gray-100 rounded-full font-bold">取消</button>
              <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 bg-red-50 text-red-500 rounded-full font-bold">確認</button>
            </div>
          </div>
        </div>
      )}

      {/* 通用新增 Modal */}
      {modal.show && (
        <div className="print:hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal({ ...modal, show: false })} />
          <div className="ac-card w-full max-w-lg bg-white p-6 rounded-t-[40px] sm:rounded-[40px] z-10 animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-6 handwriting">新增{modal.title}</h3>
            
            <div className="space-y-4 mb-8">
              {modal.type === 'expense' && (
                 <div className="space-y-4">
                   <div className="flex space-x-2">
                     <select value={modal.form.currency || 'TARGET'} onChange={e => updateForm('currency', e.target.value)} className="bg-gray-50 rounded-2xl border-2 border-[#E0E5D5] font-bold px-2 outline-none">
                       <option value="TARGET">{data.settings.targetCurrency}</option>
                       <option value="NTD">NTD (台幣)</option>
                     </select>
                     <input type="number" placeholder="金額" value={modal.form.amount || ''} onChange={e => updateForm('amount', e.target.value)} className="flex-1 ac-card px-4 py-3 text-2xl font-black" />
                   </div>
                   <input type="date" value={modal.form.date || ''} onChange={e => updateForm('date', e.target.value)} className="w-full ac-card px-4 py-3" />
                   <input type="text" placeholder="項目名稱" value={modal.form.title || ''} onChange={e => updateForm('title', e.target.value)} className="w-full ac-card px-4 py-3" />
                   <div className="flex items-center space-x-2 px-2 overflow-x-auto no-scrollbar py-1">
                      <span className="text-sm font-bold opacity-60 flex-shrink-0">圖示：</span>
                      {['🏨', '🚆', '🍽️', '🎡', '✈️', '🚌', '🚗', '🛍️', '🍜', '🎫'].map(icon => (
                        <button key={icon} onClick={() => updateForm('icon', icon)} className={`text-xl p-2 rounded-full transition-all flex-shrink-0 ${modal.form.icon === icon ? 'bg-[#789262] text-white scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>{icon}</button>
                      ))}
                   </div>
                 </div>
              )}
              {modal.type === 'schedule' && (
                 <div className="space-y-4">
                   <select value={modal.form.dayIndex !== undefined ? modal.form.dayIndex : selectedDayIndex} onChange={e => updateForm('dayIndex', Number(e.target.value))} className="w-full ac-card px-4 py-3">
                     {data.days.map((d: any, idx: number) => (
                       <option key={idx} value={idx}>DAY {idx + 1} ({d.date})</option>
                     ))}
                   </select>
                   <input type="time" value={modal.form.time || ''} onChange={e => updateForm('time', e.target.value)} className="w-full ac-card px-4 py-3" />
                   <input type="text" placeholder="去哪裡？" value={modal.form.title || ''} onChange={e => updateForm('title', e.target.value)} className="w-full ac-card px-4 py-3" />
                   <input type="text" placeholder="備註 (選填)" value={modal.form.note || ''} onChange={e => updateForm('note', e.target.value)} className="w-full ac-card px-4 py-3" />
                   <select value={modal.form.type || ''} onChange={e => updateForm('type', e.target.value)} className="w-full ac-card px-4 py-3">
                     <option value="景點">景點</option>
                     <option value="交通">交通</option>
                     <option value="美食">美食</option>
                     <option value="住宿">住宿</option>
                     <option value="購物">購物</option>
                   </select>
                 </div>
              )}
              {modal.type === 'buy' && (
                 <div className="space-y-4">
                   <input type="text" placeholder="店家名稱" value={modal.form.store || ''} onChange={e => updateForm('store', e.target.value)} className="w-full ac-card px-4 py-3 font-bold" />
                   <input type="text" placeholder="商品名稱" value={modal.form.item || ''} onChange={e => updateForm('item', e.target.value)} className="w-full ac-card px-4 py-3" />
                   <div className="flex space-x-2">
                     <select value={modal.form.currency || 'TARGET'} onChange={e => updateForm('currency', e.target.value)} className="bg-gray-50 rounded-2xl border-2 border-[#E0E5D5] font-bold px-2 outline-none">
                       <option value="TARGET">{data.settings.targetCurrency}</option>
                       <option value="NTD">NTD (台幣)</option>
                     </select>
                     <input type="number" placeholder="預算金額" value={modal.form.budget || ''} onChange={e => updateForm('budget', e.target.value)} className="flex-1 ac-card px-4 py-3" />
                   </div>
                   <input type="url" placeholder="商品連結 (選填)" value={modal.form.link || ''} onChange={e => updateForm('link', e.target.value)} className="w-full ac-card px-4 py-3 text-sm" />
                   <div className="flex items-center space-x-2 px-2 overflow-x-auto no-scrollbar py-1">
                      <span className="text-sm font-bold opacity-60 flex-shrink-0">圖示：</span>
                      {['🏨', '🚆', '🍽️', '🎡', '✈️', '🚌', '🚗', '🛍️', '🍜', '🎫'].map(icon => (
                        <button key={icon} onClick={() => updateForm('icon', icon)} className={`text-xl p-2 rounded-full transition-all flex-shrink-0 ${modal.form.icon === icon ? 'bg-[#789262] text-white scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>{icon}</button>
                      ))}
                   </div>
                 </div>
              )}
              {modal.type === 'booking' && (
                 <div className="space-y-4">
                   <select value={modal.form.type || ''} onChange={e => updateForm('type', e.target.value)} className="w-full ac-card px-4 py-3 font-bold outline-none border-0">
                     <option value="hotel">🏨 住宿</option>
                     <option value="transport">🚆 交通</option>
                     <option value="restaurant">🍽️ 餐廳</option>
                     <option value="spot">🎡 景點票券</option>
                     <option value="flight">✈️ 航班</option>
                   </select>
                   <input type="datetime-local" value={modal.form.datetime || ''} onChange={e => updateForm('datetime', e.target.value)} className="w-full ac-card px-4 py-3" />
                   <input type="text" placeholder={modal.form.type === 'flight' ? "航班號碼 (如 CI 104)" : "名稱"} value={modal.form.title || modal.form.code || ''} onChange={e => modal.form.type === 'flight' ? updateForm('code', e.target.value) : updateForm('title', e.target.value)} className="w-full ac-card px-4 py-3" />
                   {modal.form.type === 'flight' ? (
                     <>
                       <div className="flex space-x-2">
                         <input type="text" placeholder="出發地 (如 TPE)" value={modal.form.from || ''} onChange={e => updateForm('from', e.target.value)} className="flex-1 ac-card px-4 py-3 uppercase" />
                         <input type="text" placeholder="目的地 (如 NRT)" value={modal.form.to || ''} onChange={e => updateForm('to', e.target.value)} className="flex-1 ac-card px-4 py-3 uppercase" />
                       </div>
                       <input type="text" placeholder="登機門 (如 A7)" value={modal.form.gate || ''} onChange={e => updateForm('gate', e.target.value)} className="w-full ac-card px-4 py-3" />
                     </>
                   ) : (
                     <>
                       <input type="text" placeholder="詳細資訊 / 時間" value={modal.form.sub || ''} onChange={e => updateForm('sub', e.target.value)} className="w-full ac-card px-4 py-3" />
                       <div className="flex items-center space-x-2 px-2 overflow-x-auto no-scrollbar py-1">
                          <span className="text-sm font-bold opacity-60 flex-shrink-0">圖示：</span>
                          {['🏨', '🚆', '🍽️', '🎡', '✈️', '🚌', '🚗', '🛍️', '🍜', '🎫'].map(icon => (
                            <button key={icon} onClick={() => updateForm('icon', icon)} className={`text-xl p-2 rounded-full transition-all flex-shrink-0 ${modal.form.icon === icon ? 'bg-[#789262] text-white scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>{icon}</button>
                          ))}
                       </div>
                     </>
                   )}
                   <div className="flex space-x-2">
                     <select value={modal.form.currency || 'TARGET'} onChange={e => updateForm('currency', e.target.value)} className="bg-gray-50 rounded-2xl border-2 border-[#E0E5D5] font-bold px-2 outline-none">
                       <option value="TARGET">{data.settings.targetCurrency}</option>
                       <option value="NTD">NTD (台幣)</option>
                     </select>
                     <input type="number" placeholder="金額 (選填，將記錄至記帳)" value={modal.form.price || ''} onChange={e => updateForm('price', e.target.value)} className="flex-1 ac-card px-4 py-3" />
                   </div>
                 </div>
              )}
              {modal.type === 'pack' && (
                 <div className="space-y-4">
                   <input type="text" placeholder="行李項目" value={modal.form.text || ''} onChange={e => updateForm('text', e.target.value)} className="w-full ac-card px-4 py-3" />
                 </div>
              )}
            </div>
            {modal.type === 'schedule' && modal.isEditing ? (
              <div className="flex space-x-3">
                <button onClick={deleteScheduleItem} className="w-1/3 py-4 bg-red-50 text-red-500 rounded-full font-bold text-lg">刪除</button>
                <button onClick={saveModalData} className="w-2/3 py-4 ac-btn-primary rounded-full font-bold text-lg">確定儲存！</button>
              </div>
            ) : (
              <button onClick={saveModalData} className="w-full py-4 ac-btn-primary rounded-full font-bold text-lg">確定儲存！</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
