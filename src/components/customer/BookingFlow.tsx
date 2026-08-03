import React, { useState } from 'react';
import { Service, Stylist, Appointment } from '../../types';
import { ChevronRight, Check, Clock, Calendar, User, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';

interface BookingFlowProps {
  services: Service[];
  stylists: Stylist[];
  initialCategory?: string;
  onBookingComplete: (newAppointment: Appointment) => void;
  onCancel: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  services,
  stylists,
  initialCategory,
  onBookingComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialCategory
      ? services.find((s) => s.category.toLowerCase().includes(initialCategory.toLowerCase())) || services[0]
      : services[0]
  );
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-07');
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(stylists[0]);
  const [clientNotes, setClientNotes] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const availableTimes = ['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

  const datesList = [
    { dayName: 'FRI', dayNum: '07', dateStr: '2026-08-07' },
    { dayName: 'SAT', dayNum: '08', dateStr: '2026-08-08' },
    { dayName: 'TUE', dayNum: '11', dateStr: '2026-08-11' },
    { dayName: 'WED', dayNum: '12', dateStr: '2026-08-12' },
    { dayName: 'THU', dayNum: '13', dateStr: '2026-08-13' },
    { dayName: 'FRI', dayNum: '14', dateStr: '2026-08-14' },
  ];

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedStylist) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      customerId: 'cust-1',
      customerName: 'Jasmine R.',
      customerPhone: '(555) 234-5678',
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      durationMinutes: selectedService.durationMinutes,
      date: selectedDate,
      time: selectedTime,
      status: 'upcoming',
      stylistId: selectedStylist.id,
      stylistName: selectedStylist.name,
      notes: clientNotes,
    };

    setIsConfirmed(true);
    setTimeout(() => {
      onBookingComplete(newApt);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* Header with back button */}
      <div className="flex items-center justify-between border-b border-[#B68A4C]/20 pb-4">
        <button
          onClick={step === 1 ? onCancel : handlePrevStep}
          className="flex items-center space-x-1 text-xs font-semibold text-[#8B5E34] hover:text-[#2D2D2D]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancel' : 'Back'}</span>
        </button>
        <h2 className="font-serif text-xl font-bold text-[#2D2D2D]">Book Appointment</h2>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between px-2 sm:px-6">
        {[
          { num: 1, label: 'Service' },
          { num: 2, label: 'Date & Time' },
          { num: 3, label: 'Details' },
          { num: 4, label: 'Confirm' },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step === s.num
                  ? 'bg-[#8B5E34] text-[#FAF8F5] ring-4 ring-[#8B5E34]/20'
                  : step > s.num
                  ? 'bg-[#B68A4C] text-[#FAF8F5]'
                  : 'bg-[#F4F1EC] text-[#2D2D2D]/50'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className="text-[10px] font-medium mt-1 text-[#2D2D2D]/70">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT SERVICE */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Select a Service</h3>
          <div className="space-y-3">
            {services.map((svc) => {
              const isSelected = selectedService?.id === svc.id;
              return (
                <div
                  key={svc.id}
                  onClick={() => setSelectedService(svc)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF8F5] border-[#8B5E34] ring-2 ring-[#8B5E34]/20 shadow-sm'
                      : 'bg-[#F4F1EC]/60 hover:bg-[#F4F1EC] border-[#B68A4C]/20'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={svc.imageUrl}
                      alt={svc.name}
                      className="w-16 h-16 rounded-lg object-cover border border-[#B68A4C]/20 shrink-0"
                    />
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#2D2D2D]">{svc.name}</h4>
                      <p className="text-xs text-[#2D2D2D]/70 line-clamp-1 mt-0.5">{svc.description}</p>
                      <div className="flex items-center space-x-3 mt-1 text-xs font-semibold text-[#8B5E34]">
                        <span>${svc.price}{svc.startingPrice ? '+' : ''}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-normal text-[#2D2D2D]/60">
                          <Clock className="w-3 h-3" /> {svc.durationMinutes} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <ChevronRight
                      className={`w-5 h-5 transition-colors ${
                        isSelected ? 'text-[#8B5E34]' : 'text-[#2D2D2D]/30'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleNextStep}
            disabled={!selectedService}
            className="w-full bg-[#8B5E34] hover:bg-[#7A5A3A] disabled:opacity-50 text-[#FAF8F5] font-semibold py-3.5 rounded-xl shadow-md transition-all mt-6"
          >
            Continue to Date & Time
          </button>
        </div>
      )}

      {/* STEP 2: SELECT DATE & TIME */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Select Date</h3>
            <p className="text-xs text-[#2D2D2D]/60 mb-3">Available schedule for August 2026</p>

            <div className="grid grid-cols-6 gap-2">
              {datesList.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`flex flex-col items-center py-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-[#8B5E34] text-[#FAF8F5] border-[#8B5E34] shadow-sm font-bold'
                        : 'bg-[#F4F1EC] text-[#2D2D2D] border-[#B68A4C]/20 hover:border-[#8B5E34]'
                    }`}
                  >
                    <span className="text-[10px] uppercase">{d.dayName}</span>
                    <span className="font-serif text-base">{d.dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Select Time</h3>
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {availableTimes.map((t) => {
                const isSelected = selectedTime === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#B68A4C] text-[#FAF8F5] border-[#B68A4C] shadow-sm'
                        : 'bg-[#F4F1EC] text-[#2D2D2D] border-[#B68A4C]/20 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleNextStep}
            className="w-full bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-semibold py-3.5 rounded-xl shadow-md transition-all mt-4"
          >
            Continue to Details
          </button>
        </div>
      )}

      {/* STEP 3: DETAILS & STYLIST */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#2D2D2D]">Select Stylist</h3>
            <div className="space-y-3 mt-3">
              {stylists.map((st) => {
                const isSelected = selectedStylist?.id === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStylist(st)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF8F5] border-[#8B5E34] ring-2 ring-[#8B5E34]/20'
                        : 'bg-[#F4F1EC]/60 border-[#B68A4C]/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-12 h-12 rounded-full object-cover border border-[#B68A4C]/30 shrink-0"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#2D2D2D]">{st.name}</h4>
                        <p className="text-xs text-[#8B5E34]">{st.roleTitle}</p>
                        <p className="text-[11px] text-[#2D2D2D]/60 mt-0.5">{st.specialties.join(', ')}</p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-[#8B5E34] border-[#8B5E34] text-white' : 'border-[#2D2D2D]/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2D2D2D] mb-1.5">
              Special Notes / Hair History (Optional)
            </label>
            <textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="E.g., Sensitivity to high heat, recent color treatment, or specific styling preferences..."
              rows={3}
              className="w-full bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-xl p-3 text-xs text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B5E34]"
            />
          </div>

          <button
            onClick={handleNextStep}
            className="w-full bg-[#8B5E34] hover:bg-[#7A5A3A] text-[#FAF8F5] font-semibold py-3.5 rounded-xl shadow-md transition-all"
          >
            Review & Confirm
          </button>
        </div>
      )}

      {/* STEP 4: CONFIRMATION SUMMARY */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-[#FAF8F5] border border-[#B68A4C]/30 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-[#2D2D2D] border-b border-[#B68A4C]/20 pb-3">
              Appointment Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#2D2D2D]/60">Service</span>
                <span className="font-serif font-bold text-[#2D2D2D]">{selectedService?.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#2D2D2D]/60">Stylist</span>
                <span className="font-semibold text-[#8B5E34]">{selectedStylist?.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#2D2D2D]/60">Date & Time</span>
                <span className="font-semibold text-[#2D2D2D]">
                  {selectedDate} at {selectedTime}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#2D2D2D]/60">Duration</span>
                <span className="text-[#2D2D2D]">{selectedService?.durationMinutes} mins</span>
              </div>

              <div className="flex justify-between border-t border-[#B68A4C]/20 pt-3 text-base">
                <span className="font-bold text-[#2D2D2D]">Total Estimated</span>
                <span className="font-serif font-bold text-[#8B5E34]">${selectedService?.price}</span>
              </div>
            </div>

            {/* Loyalty Points Teaser */}
            <div className="bg-[#F4F1EC] p-3 rounded-xl flex items-center space-x-2 text-xs text-[#8B5E34] font-medium border border-[#B68A4C]/20">
              <Sparkles className="w-4 h-4 text-[#B68A4C]" />
              <span>You will earn <strong>+{selectedService?.price} Loyalty Points</strong> on completion!</span>
            </div>
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={isConfirmed}
            className="w-full bg-[#B68A4C] hover:bg-[#8B5E34] text-[#FAF8F5] font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-base"
          >
            {isConfirmed ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 animate-bounce" /> Confirmed! Redirecting...
              </span>
            ) : (
              <span>Confirm & Request Booking</span>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
