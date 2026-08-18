import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeRemaining({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 sm:px-6 py-3 sm:py-4 min-w-[60px] sm:min-w-[80px] shadow-lg border border-white/20 animate-pulse-ring">
        <span className="text-2xl sm:text-4xl font-bold text-white font-mono">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-xs sm:text-sm font-medium text-white/80 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-medium text-white/90 mb-4 uppercase tracking-wider">
        Conference Starts In
      </p>
      <div className="flex items-center gap-2 sm:gap-4">
        <TimeBlock value={timeRemaining.days} label="Days" />
        <span className="text-2xl sm:text-3xl font-bold text-white/60 mt-[-24px]">:</span>
        <TimeBlock value={timeRemaining.hours} label="Hours" />
        <span className="text-2xl sm:text-3xl font-bold text-white/60 mt-[-24px]">:</span>
        <TimeBlock value={timeRemaining.minutes} label="Minutes" />
        <span className="text-2xl sm:text-3xl font-bold text-white/60 mt-[-24px]">:</span>
        <TimeBlock value={timeRemaining.seconds} label="Seconds" />
      </div>
    </div>
  );
}
