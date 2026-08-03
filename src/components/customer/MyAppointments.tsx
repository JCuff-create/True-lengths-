import React, { useState } from 'react';
import { Appointment } from '../../types';
import { Calendar as CalendarIcon, Clock, User, AlertCircle, X, RefreshCw } from 'lucide-react';

interface MyAppointmentsProps {
  appointments: Appointment[];
  onBookNew: () => void;
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (appointment: Appointment) => void;
}

export const MyAppointments: React.FC<MyAppointmentsProps> = ({
  appointments,
  onBookNew,
  onCancelAppointment,
  onRescheduleAppointment,
}) => {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'canceled'>('upcoming');

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'upcoming') return apt.status === 'upcoming' || apt.status === 'in_progress';
    if (filter === 'past') return apt.status === 'completed';
    if (filter === 'canceled') return apt.status === 'canceled';
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Screen Title */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B68A4C]">Manage Schedule</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2D2D]">My Appointments</h2>
        </div>
        <button
          onClick={onBookNew}
          className="bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all"
        >
          + Book New
        </button>
      </div>

      {/* Filter Tabs (Upcoming, Past, Canceled) */}
      <div className="flex p-1 bg-[#F4F1EC] rounded-xl border border-[#B68A4C]/20">
        {(['upcoming', 'past', 'canceled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
              filter === tab
                ? 'bg-[#8B5E34] text-[#FAF8F5] shadow-xs'
                : 'text-[#2D2D2D]/70 hover:text-[#2D2D2D]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-[#B68A4C]/20 rounded-2xl p-12 text-center space-y-3">
            <CalendarIcon className="w-10 h-10 text-[#B68A4C] mx-auto opacity-60" />
            <h3 className="font-serif font-bold text-[#2D2D2D] text-lg">No {filter} appointments found</h3>
            <p className="text-xs text-[#2D2D2D]/60 max-w-sm mx-auto">
              Ready for your next hair care session? Book an appointment with Carolyn, Tina, or Maria today.
            </p>
            <button
              onClick={onBookNew}
              className="bg-[#B68A4C] text-[#FAF8F5] text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all"
            >
              Book Now
            </button>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const dateObj = new Date(apt.date);
            const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const dayNum = dateObj.getDate();
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

            return (
              <div
                key={apt.id}
                className="bg-[#FAF8F5] border border-[#B68A4C]/25 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#B68A4C]/50"
              >
                <div className="flex items-start space-x-4">
                  {/* Date Pill */}
                  <div className="w-16 h-16 rounded-xl bg-[#F4F1EC] border border-[#B68A4C]/30 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#B68A4C] uppercase">{monthStr}</span>
                    <span className="font-serif font-bold text-lg text-[#2D2D2D] leading-none">{dayNum}</span>
                    <span className="text-[9px] font-semibold text-[#8B5E34] mt-0.5">{dayName}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-serif font-bold text-base text-[#2D2D2D]">{apt.serviceName}</span>
                      <span className="text-xs font-bold text-[#8B5E34]">${apt.price}</span>
                    </div>

                    <p className="text-xs text-[#8B5E34] font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> with {apt.stylistName}
                    </p>

                    <p className="text-xs text-[#2D2D2D]/60 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#B68A4C]" /> {apt.time} ({apt.durationMinutes} mins)
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {filter === 'upcoming' && (
                  <div className="flex items-center space-x-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-[#B68A4C]/15">
                    <button
                      onClick={() => onRescheduleAppointment(apt)}
                      className="flex-1 sm:flex-none text-xs font-semibold text-[#8B5E34] border border-[#8B5E34]/30 bg-[#F4F1EC] hover:bg-[#FAF8F5] px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>

                    <button
                      onClick={() => onCancelAppointment(apt.id)}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 bg-rose-50 px-3 py-2 rounded-xl transition-all"
                      title="Cancel Appointment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reassurance Banner */}
      <div className="bg-[#F4F1EC] border border-[#B68A4C]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-serif font-bold text-sm text-[#2D2D2D]">Need to make a custom change?</h4>
          <p className="text-xs text-[#2D2D2D]/70 mt-0.5">
            Cancel or reschedule up to 24 hours prior to your scheduled service without fee.
          </p>
        </div>
        <button
          onClick={onBookNew}
          className="shrink-0 bg-[#8B5E34] text-[#FAF8F5] font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:bg-[#7A5A3A] transition-all"
        >
          Book Another Service
        </button>
      </div>

    </div>
  );
};
