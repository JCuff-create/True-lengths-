import React, { useState, useMemo } from 'react';
import { Appointment, Stylist, Service } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bell,
  CheckCircle2,
  X,
  Phone,
  Scissors,
  DollarSign,
  Sparkles,
  CalendarDays,
  Send,
  AlertCircle,
  Tag,
  Grid,
  List,
  Eye,
  ChevronDown,
  Trash2
} from 'lucide-react';

interface OwnerCalendarProps {
  appointments: Appointment[];
  stylists: Stylist[];
  services?: Service[];
  onAddAppointment?: (newApt: Appointment) => void;
  onUpdateStatus?: (id: string, status: 'upcoming' | 'in_progress' | 'completed') => void;
  onSendReminder?: (apt: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
}

export const OwnerCalendar: React.FC<OwnerCalendarProps> = ({
  appointments,
  stylists,
  services = [],
  onAddAppointment,
  onUpdateStatus,
  onSendReminder,
  onDeleteAppointment,
}) => {
  // Date State (Day, Month, Year)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  
  // Default viewMode to 'month' for a realistic full-calendar layout!
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  // Filters
  const [selectedStylistFilter, setSelectedStylistFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // New Appointment Modal & Date prefill
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [modalTargetDate, setModalTargetDate] = useState<string>('');
  const [newAptForm, setNewAptForm] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: services[0]?.id || 's1',
    stylistId: stylists[0]?.id || 'st1',
    time: '10:00 AM',
    notes: '',
  });

  // Selected Appointment Detail Modal / Drawer
  const [selectedAptDetail, setSelectedAptDetail] = useState<Appointment | null>(null);

  // Toast Banner for 1-Day Reminder confirmation
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Month Names
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const YEARS = [2024, 2025, 2026, 2027, 2028];

  // Helper formatting YYYY-MM-DD
  const formatYMD = (year: number, monthIndex: number, dayNum: number) => {
    const y = year;
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = useMemo(() => {
    return formatYMD(selectedYear, selectedMonth, selectedDay);
  }, [selectedYear, selectedMonth, selectedDay]);

  const todayStr = useMemo(() => {
    return formatYMD(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  const formattedSelectedDateDisplay = useMemo(() => {
    const dt = new Date(selectedYear, selectedMonth, selectedDay);
    return dt.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth, selectedDay]);

  // Navigate Month
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Navigate Days
  const handlePrevDay = () => {
    const dt = new Date(selectedYear, selectedMonth, selectedDay - 1);
    setSelectedYear(dt.getFullYear());
    setSelectedMonth(dt.getMonth());
    setSelectedDay(dt.getDate());
  };

  const handleNextDay = () => {
    const dt = new Date(selectedYear, selectedMonth, selectedDay + 1);
    setSelectedYear(dt.getFullYear());
    setSelectedMonth(dt.getMonth());
    setSelectedDay(dt.getDate());
  };

  const handleSetToday = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setSelectedDay(now.getDate());
  };

  // Direct Date Input Change Handler (YYYY-MM-DD)
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const parts = e.target.value.split('-');
    if (parts.length === 3) {
      setSelectedYear(parseInt(parts[0], 10));
      setSelectedMonth(parseInt(parts[1], 10) - 1);
      setSelectedDay(parseInt(parts[2], 10));
    }
  };

  // FULL MONTH CALENDAR GRID (Including padding days from previous and next months)
  const fullMonthGrid = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay(); // 0-Sun to 6-Sat
    const daysInCurrentMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const cells: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding days
    const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateStr = formatYMD(prevYear, prevMonthIdx, d);
      cells.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = formatYMD(selectedYear, selectedMonth, d);
      cells.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding days to complete grid to multiple of 7 (35 or 42 cells)
    const nextMonthIdx = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    const remainingSlots = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remainingSlots; d++) {
      const dateStr = formatYMD(nextYear, nextMonthIdx, d);
      cells.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, todayStr]);

  // WEEK GRID DAYS (7 days starting from Sunday of selected day's week)
  const weekDays = useMemo(() => {
    const currDate = new Date(selectedYear, selectedMonth, selectedDay);
    const dayOfWeek = currDate.getDay(); // 0-6
    const sundayDate = new Date(selectedYear, selectedMonth, selectedDay - dayOfWeek);

    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sundayDate);
      d.setDate(sundayDate.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const num = d.getDate();
      const dateStr = formatYMD(y, m, num);
      days.push({
        dateStr,
        dayName: DAY_NAMES[i],
        dayNum: num,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [selectedYear, selectedMonth, selectedDay, todayStr]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Stylist filter
      if (selectedStylistFilter !== 'all' && apt.stylistId !== selectedStylistFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && apt.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [appointments, selectedStylistFilter, selectedStatusFilter]);

  // Appointments for Selected Day
  const appointmentsForSelectedDay = useMemo(() => {
    return filteredAppointments.filter((apt) => apt.date === selectedDateStr);
  }, [filteredAppointments, selectedDateStr]);

  // Daily revenue for selected day
  const dailyRevenue = useMemo(() => {
    return appointmentsForSelectedDay
      .filter((a) => a.status !== 'canceled')
      .reduce((sum, a) => sum + a.price, 0);
  }, [appointmentsForSelectedDay]);

  // Tomorrow's date string for 1-day reminder checks
  const tomorrowDateStr = useMemo(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return formatYMD(tm.getFullYear(), tm.getMonth(), tm.getDate());
  }, []);

  const tomorrowAppointmentsCount = useMemo(() => {
    return appointments.filter((a) => a.date === tomorrowDateStr && a.status !== 'canceled').length;
  }, [appointments, tomorrowDateStr]);

  // Send 1-Day Before Reminder Push for an appointment
  const handleTriggerSingleReminder = (apt: Appointment) => {
    if (onSendReminder) {
      onSendReminder(apt);
    }
    setReminderToast(`Push notification reminder sent to ${apt.customerName} & ${apt.stylistName}!`);
    setTimeout(() => setReminderToast(null), 4000);
  };

  // Send 1-Day Before Reminder Push for ALL tomorrow appointments
  const handleTriggerAllTomorrowReminders = () => {
    const tomorrowApts = appointments.filter((a) => a.date === tomorrowDateStr && a.status !== 'canceled');
    if (tomorrowApts.length === 0) {
      appointmentsForSelectedDay.forEach((apt) => {
        if (onSendReminder) onSendReminder(apt);
      });
      setReminderToast(`Push 1-day reminders sent to ${appointmentsForSelectedDay.length} client(s) on ${selectedDateStr}!`);
    } else {
      tomorrowApts.forEach((apt) => {
        if (onSendReminder) onSendReminder(apt);
      });
      setReminderToast(`Push 1-day reminders sent for ${tomorrowApts.length} appointment(s) tomorrow (${tomorrowDateStr})!`);
    }
    setTimeout(() => setReminderToast(null), 4500);
  };

  // Open Add Appointment Modal for a specific target date
  const handleOpenAddModalForDate = (dateString?: string) => {
    setModalTargetDate(dateString || selectedDateStr);
    setIsAddModalOpen(true);
  };

  // Submit New Appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const selService = services.find((s) => s.id === newAptForm.serviceId) || services[0] || {
      id: 's1',
      name: 'Silk Press & Treatment',
      price: 75,
      durationMinutes: 90,
    };

    const selStylist = stylists.find((st) => st.id === newAptForm.stylistId) || stylists[0] || {
      id: 'st1',
      name: 'Carolyn R.',
    };

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      customerId: `cust-${Date.now()}`,
      customerName: newAptForm.customerName.trim() || 'Walk-in Client',
      customerPhone: newAptForm.customerPhone.trim() || '(555) 000-1234',
      serviceId: selService.id,
      serviceName: selService.name,
      price: selService.price,
      durationMinutes: selService.durationMinutes,
      date: modalTargetDate || selectedDateStr,
      time: newAptForm.time,
      status: 'upcoming',
      stylistId: selStylist.id,
      stylistName: selStylist.name,
      notes: newAptForm.notes,
    };

    if (onAddAppointment) {
      onAddAppointment(newApt);
    }

    setIsAddModalOpen(false);
    setNewAptForm({
      customerName: '',
      customerPhone: '',
      serviceId: services[0]?.id || 's1',
      stylistId: stylists[0]?.id || 'st1',
      time: '10:00 AM',
      notes: '',
    });

    setReminderToast(`Appointment scheduled! Push notifications emitted to Owner & ${selStylist.name}.`);
    setTimeout(() => setReminderToast(null), 4000);
  };

  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-[#B68A4C] text-[#FAF8F5] border-[#FAF8F5]/40';
      case 'completed':
        return 'bg-emerald-600/80 text-white border-emerald-400/40';
      case 'canceled':
        return 'bg-red-900/60 text-red-200 border-red-500/40 opacity-50 line-through';
      default:
        return 'bg-[#8B5E34] text-[#FAF8F5] border-[#B68A4C]/50';
    }
  };

  // Hourly timeline hours (08:00 AM to 07:00 PM)
  const HOURLY_SLOTS = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 bg-[#2D2D2D] text-[#FAF8F5] p-4 sm:p-7 rounded-3xl border border-[#B68A4C]/30 shadow-2xl relative">
      
      {/* Toast Alert Banner */}
      {reminderToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#8B5E34] text-[#FAF8F5] border-2 border-[#B68A4C] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-md w-full">
          <Bell className="w-5 h-5 text-[#B68A4C] shrink-0 animate-bounce" />
          <p className="text-xs font-bold leading-snug flex-1">{reminderToast}</p>
          <button onClick={() => setReminderToast(null)} className="p-1 hover:bg-[#FAF8F5]/10 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CALENDAR HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#B68A4C]/25 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B68A4C] mb-1">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Executive Operating System • Master Calendar
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Automated 1-Day Push Active
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-3xl font-bold text-[#FAF8F5] flex items-center gap-2">
            Salon Calendar
          </h2>
          <p className="text-xs text-[#FAF8F5]/70 mt-0.5 leading-snug">
            Interactive schedule grid, client bookings synchronization, and automated 1-day push notifications.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            onClick={handleTriggerAllTomorrowReminders}
            className="flex-1 sm:flex-initial bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#B68A4C] hover:text-[#FAF8F5] border border-[#B68A4C]/40 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="Send 24-hour reminder push notifications to clients with appointments tomorrow"
          >
            <Bell className="w-3.5 h-3.5 text-[#B68A4C] shrink-0" />
            <span className="whitespace-nowrap">Send 1-Day Push ({tomorrowAppointmentsCount})</span>
          </button>

          <button
            onClick={() => handleOpenAddModalForDate(selectedDateStr)}
            className="flex-1 sm:flex-initial bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold px-3 sm:px-4 py-2 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      {/* TOP CALENDAR CONTROL BAR (Month/Year Navigation & View Mode Selector) */}
      <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 p-2.5 sm:p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Date Stepper & Selectors */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-[#2D2D2D] hover:bg-[#4D4D4D] text-[#B68A4C] hover:text-[#FAF8F5] transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-serif font-bold text-base sm:text-lg text-[#FAF8F5] min-w-[120px] sm:min-w-[170px] text-center">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-[#2D2D2D] hover:bg-[#4D4D4D] text-[#B68A4C] hover:text-[#FAF8F5] transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Today Quick Switch & Dropdowns */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSetToday}
                className="bg-[#B68A4C]/20 hover:bg-[#B68A4C]/40 text-[#B68A4C] hover:text-[#FAF8F5] text-xs font-bold px-2 py-1.5 rounded-lg border border-[#B68A4C]/30 transition-all cursor-pointer"
              >
                Today
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-[#2D2D2D] text-[#FAF8F5] text-xs font-bold px-1.5 py-1.5 rounded-lg border border-[#B68A4C]/40 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>{name.substring(0, 3)}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-[#2D2D2D] text-[#FAF8F5] text-xs font-bold px-1.5 py-1.5 rounded-lg border border-[#B68A4C]/40 focus:outline-none cursor-pointer"
              >
                {YEARS.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: View Mode Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-[#2D2D2D] p-1 rounded-xl border border-[#B68A4C]/20 w-full md:w-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                viewMode === 'month' ? 'bg-[#B68A4C] text-[#FAF8F5]' : 'text-[#FAF8F5]/70 hover:text-[#FAF8F5]'
              }`}
            >
              <Grid className="w-3.5 h-3.5 shrink-0 hidden sm:inline" /> <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                viewMode === 'week' ? 'bg-[#B68A4C] text-[#FAF8F5]' : 'text-[#FAF8F5]/70 hover:text-[#FAF8F5]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0 hidden sm:inline" /> <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                viewMode === 'day' ? 'bg-[#B68A4C] text-[#FAF8F5]' : 'text-[#FAF8F5]/70 hover:text-[#FAF8F5]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0 hidden sm:inline" /> <span>Day</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                viewMode === 'agenda' ? 'bg-[#B68A4C] text-[#FAF8F5]' : 'text-[#FAF8F5]/70 hover:text-[#FAF8F5]'
              }`}
            >
              <List className="w-3.5 h-3.5 shrink-0 hidden sm:inline" /> <span className="truncate">Directory</span>
            </button>
          </div>

        </div>

        {/* Selected Date Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-[#B68A4C]/20 pt-2.5 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#B68A4C] font-bold shrink-0">Selected Date:</span>
            <span className="font-serif font-bold text-xs sm:text-sm text-[#FAF8F5]">{formattedSelectedDateDisplay}</span>
          </div>
          <div className="flex items-center gap-2 text-[#FAF8F5]/80 text-[11px] sm:text-xs">
            <span className="bg-[#2D2D2D] px-2 py-0.5 rounded-md border border-[#B68A4C]/20">{appointmentsForSelectedDay.length} Bookings</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold bg-[#2D2D2D] px-2 py-0.5 rounded-md border border-emerald-500/30">${dailyRevenue} Scheduled</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#3D3D3D]/60 p-3 rounded-2xl border border-[#B68A4C]/20 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#B68A4C]" />
          <span className="font-bold text-[#FAF8F5]">Filter Calendar:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-[#FAF8F5]/70 uppercase font-bold">Stylist:</span>
            <select
              value={selectedStylistFilter}
              onChange={(e) => setSelectedStylistFilter(e.target.value)}
              className="bg-[#2D2D2D] text-[#FAF8F5] text-xs px-2.5 py-1 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
            >
              <option value="all">All Stylists ({stylists.length})</option>
              {stylists.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-[#FAF8F5]/70 uppercase font-bold">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#2D2D2D] text-[#FAF8F5] text-xs px-2.5 py-1 rounded-xl border border-[#B68A4C]/30 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================== 1. FULL MONTH CALENDAR GRID VIEW ==================== */}
      {viewMode === 'month' && (
        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-2 sm:p-5 space-y-2 shadow-xl overflow-hidden">
          
          {/* Day of Week Columns Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-1.5 border-b border-[#B68A4C]/20">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <div key={d} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#B68A4C] py-0.5">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d.substring(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* 35 or 42 Cell Month Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {fullMonthGrid.map((cell) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const dayApts = filteredAppointments.filter((a) => a.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    // Update date selection
                    const parts = cell.dateStr.split('-');
                    setSelectedYear(parseInt(parts[0], 10));
                    setSelectedMonth(parseInt(parts[1], 10) - 1);
                    setSelectedDay(parseInt(parts[2], 10));
                  }}
                  className={`min-h-[56px] sm:min-h-[120px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group relative ${
                    cell.isCurrentMonth
                      ? isSelected
                        ? 'bg-[#2D2D2D] border-[#B68A4C] ring-2 ring-[#B68A4C]'
                        : cell.isToday
                        ? 'bg-[#2D2D2D] border-amber-400/80'
                        : 'bg-[#2D2D2D]/80 border-white/5 hover:border-[#B68A4C]/60 hover:bg-[#2D2D2D]'
                      : 'bg-[#252525]/40 border-transparent opacity-40 hover:opacity-70'
                  }`}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-bold inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                        cell.isToday
                          ? 'bg-[#B68A4C] text-[#FAF8F5] ring-2 ring-[#B68A4C]/50'
                          : isSelected
                          ? 'bg-[#FAF8F5]/20 text-[#FAF8F5]'
                          : 'text-[#FAF8F5]/90'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick Add Appointment Button on Hover */}
                    {cell.isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddModalForDate(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-[#B68A4C] text-[#B68A4C] hover:text-[#FAF8F5] hidden sm:block"
                        title={`Add appointment for ${cell.dateStr}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Mobile Compact Appointment Snippets */}
                  {dayApts.length > 0 && (
                    <div className="sm:hidden mt-0.5 space-y-0.5">
                      {dayApts.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAptDetail(apt);
                          }}
                          className="text-[8px] leading-tight font-bold text-[#B68A4C] bg-[#B68A4C]/20 border border-[#B68A4C]/30 px-1 py-0.5 rounded truncate flex items-center justify-between"
                          title={`${apt.time} - ${apt.customerName}`}
                        >
                          <span className="truncate">{apt.time.split(' ')[0]} {apt.customerName.split(' ')[0]}</span>
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <span className="text-[7px] text-[#B68A4C] block text-center font-bold">
                          +{dayApts.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Desktop Full Appointments List inside Calendar Cell */}
                  <div className="hidden sm:block space-y-1 my-1 flex-1 overflow-hidden">
                    {dayApts.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAptDetail(apt);
                        }}
                        className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-semibold truncate transition-all flex items-center justify-between cursor-pointer hover:scale-102 ${getStatusBadge(
                          apt.status
                        )}`}
                        title={`${apt.time} - ${apt.customerName} (${apt.serviceName})`}
                      >
                        <span className="truncate">
                          <span className="font-bold opacity-80 mr-1">{apt.time}</span>
                          <span className="font-bold">{apt.customerName}</span>
                        </span>
                        {apt.reminderSent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0 ml-0.5" title="Push sent" />
                        )}
                      </div>
                    ))}

                    {dayApts.length > 3 && (
                      <span className="text-[9px] font-bold text-[#B68A4C] block px-1">
                        +{dayApts.length - 3} more booking{dayApts.length - 3 > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Cell Footer Summary (Desktop) */}
                  {dayApts.length > 0 && (
                    <div className="hidden sm:flex items-center justify-between text-[9px] text-[#B68A4C] font-bold border-t border-white/5 pt-0.5">
                      <span>{dayApts.length} apt{dayApts.length > 1 ? 's' : ''}</span>
                      <span className="text-emerald-400">
                        ${dayApts.filter((a) => a.status !== 'canceled').reduce((s, a) => s + a.price, 0)}
                      </span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Dedicated Selected Date Bookings Detail Panel for Month View */}
          <div className="mt-4 pt-4 border-t border-[#B68A4C]/25 bg-[#2D2D2D] p-3.5 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4C]">Day Schedule Inspection</span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#FAF8F5]">
                  Bookings for {formattedSelectedDateDisplay}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                  {appointmentsForSelectedDay.length} Scheduled
                </span>
                <button
                  onClick={() => handleOpenAddModalForDate(selectedDateStr)}
                  className="bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] text-xs font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add</span>
                </button>
              </div>
            </div>

            {appointmentsForSelectedDay.length === 0 ? (
              <div className="text-center py-6 bg-[#3D3D3D]/50 rounded-xl border border-white/5 text-xs text-[#FAF8F5]/60 italic">
                No client bookings scheduled for {formattedSelectedDateDisplay}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {appointmentsForSelectedDay.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAptDetail(apt)}
                    className="p-3 rounded-xl bg-[#3D3D3D] border border-[#B68A4C]/30 hover:border-[#B68A4C] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* TIME BADGE */}
                        <span className="font-bold text-xs bg-[#B68A4C] text-[#FAF8F5] px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {apt.time}
                        </span>
                        {/* CLIENT NAME */}
                        <span className="font-serif font-bold text-sm text-[#FAF8F5] truncate">
                          {apt.customerName}
                        </span>
                      </div>

                      <div className="text-xs text-[#FAF8F5]/80 flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-[#B68A4C]">{apt.serviceName}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">${apt.price}</span>
                      </div>

                      <p className="text-[11px] text-[#FAF8F5]/60 truncate">
                        Stylist: {apt.stylistName} ({apt.durationMinutes}m) • {apt.customerPhone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerSingleReminder(apt);
                        }}
                        className="p-2 rounded-xl bg-[#2D2D2D] hover:bg-[#8B5E34] text-[#B68A4C] hover:text-[#FAF8F5] border border-[#B68A4C]/30 transition-all cursor-pointer"
                        title="Trigger 1-Day Push Notification"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================== 2. WEEK CALENDAR GRID VIEW ==================== */}
      {viewMode === 'week' && (
        <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#B68A4C]/20 pb-3">
            <h3 className="font-serif font-bold text-lg text-[#FAF8F5]">Week View Schedule</h3>
            <p className="text-xs text-[#FAF8F5]/70">Displaying 7 days surrounding {formattedSelectedDateDisplay}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            {weekDays.map((wDay) => {
              const dayApts = filteredAppointments.filter((a) => a.date === wDay.dateStr);
              const isSelected = wDay.dateStr === selectedDateStr;

              return (
                <div
                  key={wDay.dateStr}
                  onClick={() => {
                    const parts = wDay.dateStr.split('-');
                    setSelectedYear(parseInt(parts[0], 10));
                    setSelectedMonth(parseInt(parts[1], 10) - 1);
                    setSelectedDay(parseInt(parts[2], 10));
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-[#2D2D2D] border-[#B68A4C] ring-2 ring-[#B68A4C]'
                      : 'bg-[#2D2D2D]/70 border-white/5 hover:border-[#B68A4C]/50'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#B68A4C] block">{wDay.dayName}</span>
                      <span className="font-serif font-bold text-base text-[#FAF8F5]">{wDay.dayNum}</span>
                    </div>
                    {wDay.isToday && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#B68A4C] text-[#FAF8F5]">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-h-[140px]">
                    {dayApts.length === 0 ? (
                      <p className="text-[10px] text-[#FAF8F5]/40 italic py-2">No bookings</p>
                    ) : (
                      dayApts.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAptDetail(apt);
                          }}
                          className={`p-2 rounded-xl border text-xs space-y-0.5 transition-all cursor-pointer hover:scale-102 ${getStatusBadge(
                            apt.status
                          )}`}
                        >
                          <div className="flex items-center justify-between font-bold text-[10px]">
                            <span>{apt.time}</span>
                            <span>${apt.price}</span>
                          </div>
                          <p className="font-bold truncate">{apt.customerName}</p>
                          <p className="text-[9px] opacity-80 truncate">{apt.serviceName}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAddModalForDate(wDay.dateStr);
                    }}
                    className="w-full py-1.5 rounded-xl bg-[#3D3D3D] hover:bg-[#B68A4C] text-[#B68A4C] hover:text-[#FAF8F5] text-[10px] font-bold transition-all flex items-center justify-center gap-1 border border-[#B68A4C]/30"
                  >
                    <Plus className="w-3 h-3" /> Add Booking
                  </button>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 3. DAY HOURLY TIMELINE SCHEDULE VIEW ==================== */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          
          {/* Day Header Banner */}
          <div className="flex items-center justify-between bg-[#3D3D3D] p-4 rounded-2xl border border-[#B68A4C]/30">
            <div className="flex items-center gap-3">
              <button onClick={handlePrevDay} className="p-2 rounded-xl bg-[#2D2D2D] hover:bg-[#4D4D4D] text-[#B68A4C]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#B68A4C]">Day Schedule Timeline</span>
                <h3 className="font-serif font-bold text-xl text-[#FAF8F5]">{formattedSelectedDateDisplay}</h3>
              </div>
              <button onClick={handleNextDay} className="p-2 rounded-xl bg-[#2D2D2D] hover:bg-[#4D4D4D] text-[#B68A4C]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => handleOpenAddModalForDate(selectedDateStr)}
              className="bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule Slot
            </button>
          </div>

          {/* Hourly Timeline Slots */}
          <div className="bg-[#3D3D3D] border border-[#B68A4C]/30 rounded-2xl p-4 sm:p-6 divide-y divide-white/5 space-y-2">
            {HOURLY_SLOTS.map((hourLabel) => {
              // Match appointments starting at or near this hour
              const slotApts = appointmentsForSelectedDay.filter((a) => {
                const aptHour = a.time.split(':')[0].padStart(2, '0');
                const slotHour = hourLabel.split(':')[0].padStart(2, '0');
                const aptAmpm = a.time.includes('PM') ? 'PM' : 'AM';
                const slotAmpm = hourLabel.includes('PM') ? 'PM' : 'AM';
                return aptHour === slotHour && aptAmpm === slotAmpm;
              });

              return (
                <div key={hourLabel} className="pt-2 flex flex-col sm:flex-row items-start gap-4">
                  {/* Time Label */}
                  <div className="w-24 shrink-0 font-serif font-bold text-xs text-[#B68A4C] pt-1">
                    {hourLabel}
                  </div>

                  {/* Time Slot Content Box */}
                  <div className="flex-1 w-full min-h-12 bg-[#2D2D2D]/60 border border-white/5 rounded-2xl p-2 flex flex-wrap items-center gap-3">
                    {slotApts.length === 0 ? (
                      <span className="text-[11px] text-[#FAF8F5]/30 italic px-2">No bookings scheduled</span>
                    ) : (
                      slotApts.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => setSelectedAptDetail(apt)}
                          className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 flex-1 min-w-[260px] cursor-pointer hover:scale-101 transition-all ${getStatusBadge(
                            apt.status
                          )}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{apt.serviceName}</span>
                              <span className="text-[10px] font-bold opacity-80 uppercase">({apt.status})</span>
                            </div>
                            <p className="text-xs opacity-90">Client: {apt.customerName} ({apt.customerPhone})</p>
                            <p className="text-[11px] opacity-75">Stylist: {apt.stylistName} • {apt.durationMinutes}m</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm">${apt.price}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerSingleReminder(apt);
                              }}
                              className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-[#FAF8F5] transition-all"
                              title="Send 1-Day Push Reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ==================== 4. AGENDA / DIRECTORY LIST VIEW ==================== */}
      {viewMode === 'agenda' && (
        <div className="space-y-3 bg-[#3D3D3D] border border-[#B68A4C]/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between border-b border-[#B68A4C]/20 pb-3">
            <h3 className="font-serif font-bold text-lg text-[#FAF8F5]">Master Directory Bookings</h3>
            <span className="text-xs font-bold text-[#B68A4C]">{filteredAppointments.length} Total</span>
          </div>

          <div className="space-y-2.5">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setSelectedAptDetail(apt)}
                className="p-4 rounded-2xl bg-[#2D2D2D] border border-[#B68A4C]/20 hover:border-[#B68A4C] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-[#FAF8F5]">{apt.serviceName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                    {apt.reminderSent && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        1-Day Push Sent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#FAF8F5]/80">
                    Client: <span className="font-bold text-[#FAF8F5]">{apt.customerName}</span> ({apt.customerPhone})
                  </p>
                  <p className="text-xs text-[#B68A4C]">
                    Date: {apt.date} at {apt.time} • Stylist: {apt.stylistName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-serif font-bold text-lg text-emerald-400">${apt.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerSingleReminder(apt);
                    }}
                    className="bg-[#3D3D3D] hover:bg-[#8B5E34] text-[#FAF8F5] border border-[#B68A4C]/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Push
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAIL DIALOG MODAL */}
      {selectedAptDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#2D2D2D] text-[#FAF8F5] border border-[#B68A4C]/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#B68A4C]/30 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#B68A4C]">Appointment Inspection</span>
                <h3 className="font-serif text-xl font-bold text-[#FAF8F5]">{selectedAptDetail.serviceName}</h3>
              </div>
              <button
                onClick={() => setSelectedAptDetail(null)}
                className="p-1.5 rounded-full text-[#FAF8F5]/60 hover:text-[#FAF8F5] hover:bg-[#3D3D3D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#3D3D3D] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <p className="flex justify-between"><span className="text-[#B68A4C]">Client:</span> <span className="font-bold">{selectedAptDetail.customerName}</span></p>
                <p className="flex justify-between"><span className="text-[#B68A4C]">Phone:</span> <span>{selectedAptDetail.customerPhone}</span></p>
                <p className="flex justify-between"><span className="text-[#B68A4C]">Date & Time:</span> <span className="font-bold">{selectedAptDetail.date} at {selectedAptDetail.time}</span></p>
                <p className="flex justify-between"><span className="text-[#B68A4C]">Assigned Stylist:</span> <span>{selectedAptDetail.stylistName}</span></p>
                <p className="flex justify-between"><span className="text-[#B68A4C]">Total Price:</span> <span className="font-serif font-bold text-emerald-400 text-sm">${selectedAptDetail.price}</span></p>
              </div>

              {selectedAptDetail.notes && (
                <div className="bg-[#3D3D3D]/50 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold uppercase text-[#B68A4C]">Notes:</span>
                  <p className="text-xs italic text-[#FAF8F5]/90 mt-0.5">"{selectedAptDetail.notes}"</p>
                </div>
              )}

              {/* Status Update Actions */}
              {onUpdateStatus && selectedAptDetail.status !== 'completed' && selectedAptDetail.status !== 'canceled' && (
                <div className="flex items-center gap-2 pt-2">
                  {selectedAptDetail.status === 'upcoming' && (
                    <button
                      onClick={() => {
                        onUpdateStatus(selectedAptDetail.id, 'in_progress');
                        setSelectedAptDetail(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold text-xs"
                    >
                      Start Service
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onUpdateStatus(selectedAptDetail.id, 'completed');
                      setSelectedAptDetail(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Mark Completed
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  handleTriggerSingleReminder(selectedAptDetail);
                  setSelectedAptDetail(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#B68A4C] border border-[#B68A4C]/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" /> Trigger 1-Day Push Notification
              </button>

              <button
                onClick={() => {
                  if (onDeleteAppointment) {
                    onDeleteAppointment(selectedAptDetail.id);
                  }
                  setSelectedAptDetail(null);
                  setReminderToast(`Appointment for ${selectedAptDetail.customerName} deleted from calendar.`);
                  setTimeout(() => setReminderToast(null), 3500);
                }}
                className="w-full py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-red-400" /> Delete Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER ADD APPOINTMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#2D2D2D] text-[#FAF8F5] border border-[#B68A4C]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#B68A4C]/25 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B68A4C]">Owner Operating System</span>
                <h3 className="font-serif text-xl font-bold text-[#FAF8F5]">New Client Booking</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full text-[#FAF8F5]/60 hover:text-[#FAF8F5] hover:bg-[#3D3D3D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#FAF8F5] mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newAptForm.customerName}
                  onChange={(e) => setNewAptForm({ ...newAptForm, customerName: e.target.value })}
                  placeholder="e.g. Jasmine Roberts"
                  className="w-full h-11 bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] box-border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#FAF8F5] mb-1">Client Phone Number</label>
                <input
                  type="tel"
                  value={newAptForm.customerPhone}
                  onChange={(e) => setNewAptForm({ ...newAptForm, customerPhone: e.target.value })}
                  placeholder="(555) 234-5678"
                  className="w-full h-11 bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] box-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#FAF8F5] mb-1">Service</label>
                  <select
                    value={newAptForm.serviceId}
                    onChange={(e) => setNewAptForm({ ...newAptForm, serviceId: e.target.value })}
                    className="w-full h-11 bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] cursor-pointer [color-scheme:dark] box-border"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#2D2D2D] text-[#FAF8F5] py-2">{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#FAF8F5] mb-1">Stylist</label>
                  <select
                    value={newAptForm.stylistId}
                    onChange={(e) => setNewAptForm({ ...newAptForm, stylistId: e.target.value })}
                    className="w-full h-11 bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] cursor-pointer [color-scheme:dark] box-border"
                  >
                    {stylists.map((st) => (
                      <option key={st.id} value={st.id} className="bg-[#2D2D2D] text-[#FAF8F5] py-2">{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#FAF8F5] mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={modalTargetDate}
                    onChange={(e) => setModalTargetDate(e.target.value)}
                    className="w-full h-11 bg-[#3D3D3D] text-[#FAF8F5] text-xs font-bold px-3.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] [color-scheme:dark] box-border"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#FAF8F5] mb-1">Time Slot</label>
                  <select
                    value={newAptForm.time}
                    onChange={(e) => setNewAptForm({ ...newAptForm, time: e.target.value })}
                    className="w-full h-11 bg-[#3D3D3D] text-[#FAF8F5] text-xs px-3.5 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] cursor-pointer [color-scheme:dark] box-border"
                  >
                    {['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'].map((t) => (
                      <option key={t} value={t} className="bg-[#2D2D2D] text-[#FAF8F5] py-2">{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#FAF8F5] mb-1">Notes / Preferences</label>
                <textarea
                  rows={2}
                  value={newAptForm.notes}
                  onChange={(e) => setNewAptForm({ ...newAptForm, notes: e.target.value })}
                  placeholder="e.g. Requires steam treatment prior to silk press"
                  className="w-full bg-[#3D3D3D] text-[#FAF8F5] text-xs p-3 rounded-xl border border-[#B68A4C]/30 focus:outline-none focus:border-[#B68A4C] box-border"
                />
              </div>

              <div className="bg-[#B68A4C]/15 border border-[#B68A4C]/30 p-3 rounded-xl flex items-start gap-2 text-[11px] text-[#FAF8F5]/90">
                <Bell className="w-4 h-4 text-[#B68A4C] shrink-0 mt-0.5" />
                <span>
                  Creating this appointment will automatically trigger push notifications for both the Owner and assigned Stylist!
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#3D3D3D] text-[#FAF8F5] text-xs font-bold hover:bg-[#4D4D4D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Schedule</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
