'use client';

import { useState, useEffect } from 'react';

export function SidebarClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = dayNames[time.getDay()];
  const month = monthNames[time.getMonth()];
  const date = time.getDate();
  const year = time.getFullYear();

  // Clock hand angles
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
  const hourAngle = ((displayHours + minutes / 60) / 12) * 360;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Clock
      </h3>

      <div className="flex flex-col items-center">
        {/* Analog Clock */}
        <div className="relative w-36 h-36 mb-3">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Clock face */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-200 dark:text-gray-700" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-gray-800" />

            {/* Hour markers */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 100 + 78 * Math.cos(angle);
              const y1 = 100 + 78 * Math.sin(angle);
              const x2 = 100 + 88 * Math.cos(angle);
              const y2 = 100 + 88 * Math.sin(angle);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={i % 3 === 0 ? "3" : "1.5"} strokeLinecap="round" className="text-gray-400 dark:text-gray-500" />
              );
            })}

            {/* Hour numbers */}
            {[12, 3, 6, 9].map((num) => {
              const angle = ((num * 30) - 90) * (Math.PI / 180);
              const x = 100 + 68 * Math.cos(angle);
              const y = 100 + 68 * Math.sin(angle);
              return (
                <text key={num} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-gray-600 dark:fill-gray-400" fontSize="14" fontWeight="bold">
                  {num}
                </text>
              );
            })}

            {/* Hour hand */}
            <line
              x1="100" y1="100"
              x2={100 + 50 * Math.cos((hourAngle - 90) * Math.PI / 180)}
              y2={100 + 50 * Math.sin((hourAngle - 90) * Math.PI / 180)}
              stroke="currentColor" strokeWidth="4" strokeLinecap="round"
              className="text-gray-800 dark:text-gray-200"
            />

            {/* Minute hand */}
            <line
              x1="100" y1="100"
              x2={100 + 65 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
              y2={100 + 65 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
              stroke="currentColor" strokeWidth="3" strokeLinecap="round"
              className="text-gray-700 dark:text-gray-300"
            />

            {/* Second hand */}
            <line
              x1="100" y1="100"
              x2={100 + 72 * Math.cos((secondAngle - 90) * Math.PI / 180)}
              y2={100 + 72 * Math.sin((secondAngle - 90) * Math.PI / 180)}
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              className="text-blue-500"
            />

            {/* Center dot */}
            <circle cx="100" cy="100" r="4" className="fill-blue-500" />
          </svg>
        </div>

        {/* Digital Time */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono tracking-wider">
            {String(displayHours).padStart(2, '0')}
            <span className="animate-pulse">:</span>
            {String(minutes).padStart(2, '0')}
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">
              {String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-blue-500 ml-1.5 font-semibold">
              {isPM ? 'PM' : 'AM'}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {dayName}, {month} {date}, {year}
          </div>
        </div>
      </div>
    </div>
  );
}
