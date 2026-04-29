import React, { useState, useEffect } from 'react';

const CURRENCY_OPTIONS: Record<string, { name: string; symbol: string; rate: number }> = {
  'JPY': { name: '日圓', symbol: '¥', rate: 4.8 },
  'KRW': { name: '韓元', symbol: '₩', rate: 42.0 },
  'EUR': { name: '歐元', symbol: '€', rate: 0.029 },
  'USD': { name: '美金', symbol: '$', rate: 0.031 },
  'THB': { name: '泰銖', symbol: '฿', rate: 1.1 }
};

const INITIAL_DATA = {
  settings: {
    targetCurrency: 'JPY',
    exchangeRate: 4.8,
    tripTitle: '東京春季賞櫻之旅'
  },
  days: [{ date: '04/15' }, { date: '04/16' }, { date: '04/17' }, { date: '04/18' }, { date: '04/19' }],
  schedule: [
    [
      { type: '交通', time: '08:30', title: '桃園機場 第一航廈', note: '搭乘 CI104 航班' },
      { type: '美食', time: '13:00', title: '成田機場 壽司店', note: '抵達第一餐！' },
      { type: '景點', time: '15:30', title: '淺草寺雷門', note: '大燈籠拍照' }
    ],
    [{ type: '景點', time: '09:00', title: '東京迪士尼樂園', note: '整天都在這！' }],
    [], [], []
  ],
  bookings: [
    { title: '成田機場接送', status: '已確認', date: '04/15 14:30', icon: '🚗' },
    { title: '淺草和服預約', status: '已確認', date: '04/15 16:00', icon: '👘' },
    { title: '迪士尼電子門票', status: '待處理', date: '04/16 09:00', icon: '🎟️' }
  ],
  packing: [
    { id: 1, title: '護照 & 簽證', checked: true, category: 'pack' },
    { id: 2, title: '日幣現金', checked: true, category: 'pack' },
    { id: 3, title: '行動電源', checked: false, category: 'pack' },
    { id: 4, title: '合味道杯麵', checked: false, category: 'buy' },
    { id: 5, title: '伴手禮清單', checked: false, category: 'buy' }
  ],
  expenses: [
    { id: 1, title: '機票', amount: 15800, currency: 'NTD', type: 'transport', date: '04/15', icon: '✈️' },
    { id: 2, title: '住宿', amount: 8500, currency: 'NTD', type: 'hotel', date: '04/15', icon: '🏨' },
    { id: 3, title: '壽司午餐', amount: 3500, currency: 'JPY', type: 'food', date: '04/15', icon: '🍣' }
  ]
};

const TABS = [
  { id: 'schedule', icon: '📅', label: '行程' },
  { id: 'bookings', icon: '📄', label: '憑證' },
  { id: 'packing', icon: '🎒', label: '清單' },
  { id: 'expense', icon: '💰', label: '記帳' }
];

export default function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('trip_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [planType, setPlanType] = useState<'pack' | 'buy'>('pack');
  const [modal, setModal] = useState<any>({ show: false, type: '', title: '', form: {} });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    localStorage.setItem('trip_data', JSON.stringify(data));
  }, [data]);

  const formatNumber = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const getCurrencySymbol = () => {
    return CURRENCY_OPTIONS[data.settings.targetCurrency]?.symbol || '$';
  };

  const getCategoryColor = (type: string) => {
    const map: Record<string, string> = { '交通': '#60A5FA', '美食': '#F97316', '景點': '#10B981', '住宿': '#A855F7', '購物': '#EC4899' };
    return map[type] || '#8D775F';
  };

  const getTotalExpense = () => {
    return data.expenses.reduce((sum: number, ex: any) => {
      const amount = ex.currency === 'NTD' ? ex.amount / data.settings.exchangeRate : ex.amount;
      return sum + amount;
    }, 0);
  };

  const handleAddSchedule = (dayIndex: number) => {
    openAddModal('schedule', null, 0, dayIndex);
  };

  const deleteScheduleItem = (dayIndex: number, itemIndex: number) => {
    setConfirmDialog({
      show: true,
      message: '確定要刪除這筆行程嗎？',
      onConfirm: () => {
        const newSchedule = [...data.schedule];
        newSchedule[dayIndex].splice(itemIndex, 1);
        setData({ ...data, schedule: newSchedule });
        setConfirmDialog({ show: false, message: '', onConfirm: () => {} });
      }
    });
  };

  const deleteExpenseItem = (id: number) => {
    setConfirmDialog({
      show: true,
      message: '確定要刪除這筆花費嗎？',
      onConfirm: () => {
