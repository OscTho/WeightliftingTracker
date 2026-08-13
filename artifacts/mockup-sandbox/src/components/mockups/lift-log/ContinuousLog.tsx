import React, { useState, useMemo, useEffect, useRef } from 'react';
import './ContinuousLog.css';
import { format, addDays, subDays } from 'date-fns';

type SetStatus = 'empty' | 'done' | 'missed';

interface SetData {
  id: string;
  weight: number;
  reps: number;
  status: SetStatus;
}

interface LiftData {
  id: string;
  exercise: string;
  sets: SetData[];
}

interface DayData {
  date: Date;
  status: 'past' | 'today' | 'future';
  lifts: LiftData[];
}

const ATHLETE = {
  name: "J. DOE",
  id: "ATH-8849",
  bws: 84.5,
  maxes: {
    "SNATCH": 105,
    "C&J": 130,
    "BACK SQUAT": 165,
    "FRONT SQUAT": 140
  }
};

const generateMockData = (): DayData[] => {
  const today = new Date();
  
  const createSets = (count: number, weight: number, reps: number, forceStatus?: SetStatus): SetData[] => {
    return Array.from({ length: count }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      weight,
      reps,
      status: forceStatus ? forceStatus : 'empty'
    }));
  };

  return [
    {
      date: subDays(today, 2),
      status: 'past',
      lifts: [
        { id: '1', exercise: 'SNATCH', sets: createSets(4, 85, 2, 'done') },
        { id: '2', exercise: 'BACK SQUAT', sets: [...createSets(2, 130, 3, 'done'), { id: 'm1', weight: 140, reps: 3, status: 'missed' }] }
      ]
    },
    {
      date: subDays(today, 1),
      status: 'past',
      lifts: [] // Rest day
    },
    {
      date: today,
      status: 'today',
      lifts: [
        { id: '3', exercise: 'CLEAN & JERK', sets: createSets(5, 110, 1, 'empty') },
        { id: '4', exercise: 'FRONT SQUAT', sets: createSets(3, 120, 3, 'empty') }
      ]
    },
    {
      date: addDays(today, 1),
      status: 'future',
      lifts: [
        { id: '5', exercise: 'POWER SNATCH', sets: createSets(3, 75, 3, 'empty') }
      ]
    },
    {
      date: addDays(today, 2),
      status: 'future',
      lifts: []
    }
  ];
};

export default function ContinuousLog() {
  const [days, setDays] = useState<DayData[]>([]);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDays(generateMockData());
  }, []);

  useEffect(() => {
    // Scroll to today on mount
    if (days.length > 0 && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [days.length]);

  const toggleSet = (dayIndex: number, liftIndex: number, setIndex: number) => {
    setDays(prev => {
      const next = [...prev];
      const s = next[dayIndex].lifts[liftIndex].sets[setIndex];
      if (s.status === 'empty') s.status = 'done';
      else if (s.status === 'done') s.status = 'missed';
      else s.status = 'empty';
      return next;
    });
  };

  const addLift = (dayIndex: number) => {
    setDays(prev => {
      const next = [...prev];
      next[dayIndex].lifts.push({
        id: Math.random().toString(),
        exercise: 'NEW LIFT',
        sets: [{ id: Math.random().toString(), weight: 0, reps: 0, status: 'empty' }]
      });
      return next;
    });
  };

  return (
    <div className="continuous-log flex flex-col md:flex-row w-full h-[100dvh] overflow-hidden">
      <div className="noise-overlay" />
      
      {/* Left Column: Dossier / Athlete Card */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r-2 border-[var(--border)] bg-[var(--paper)] shrink-0 flex flex-col p-6 relative z-10 md:h-[100dvh]">
        <div className="flex justify-between items-start mb-6 md:mb-12">
          <div>
            <h1 className="continuous-log-display text-4xl font-extrabold uppercase leading-none mb-2">LOFTE<br/>LOG</h1>
            <p className="text-xs font-bold tracking-widest text-[var(--muted)]">SYSTEM V.2.0</p>
          </div>
          <div className="flex gap-2">
            <div className="punch-hole" />
            <div className="punch-hole" />
          </div>
        </div>

        <div className="border-2 border-[var(--border)] p-4 relative bg-[var(--bg)] shadow-[4px_4px_0_var(--border)] mb-6 md:mb-0">
          <div className="absolute -top-3 -left-3 bg-[var(--accent)] text-[var(--paper)] text-[10px] font-bold px-2 py-1 uppercase tracking-widest border-2 border-[var(--border)]">
            ATHLETE DATA
          </div>
          <div className="mb-4 md:mb-6 mt-2 flex justify-between items-end md:block">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">IDENTIFIER</p>
              <p className="continuous-log-display text-2xl font-bold uppercase">{ATHLETE.name}</p>
            </div>
            <p className="text-sm mt-1">{ATHLETE.id} // BW: {ATHLETE.bws}KG</p>
          </div>

          <div className="space-y-3 border-t-2 border-[var(--border)] pt-4 hidden md:block">
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">REFERENCE LIFTS (1RM)</p>
            {Object.entries(ATHLETE.maxes).map(([lift, weight]) => (
              <div key={lift} className="flex justify-between items-end border-b border-dashed border-[var(--muted)] pb-1">
                <span className="text-sm font-bold">{lift}</span>
                <span className="continuous-log-display text-lg font-bold">{weight} <span className="text-[10px] font-mono font-normal">KG</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8 hidden md:block">
           <div className="bg-[var(--ink)] text-[var(--paper)] p-4 text-xs">
             <p className="font-bold mb-2 uppercase">Interaction Legend</p>
             <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 border border-[var(--paper)]"></div> <span>[ ] PENDING</span></div>
             <div className="flex items-center gap-2 mb-1"><div className="w-4 h-4 bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center font-bold" style={{fontSize: '10px'}}>✕</div> <span>[X] COMPLETED</span></div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[var(--accent)] border-none text-[var(--paper)] flex items-center justify-center font-bold" style={{fontSize: '10px'}}>−</div> <span>[-] MISSED</span></div>
           </div>
        </div>
      </div>

      {/* Right Column: Infinite Scroll Timeline */}
      <div className="flex-1 overflow-y-auto relative h-full bg-[var(--bg)]">
        {/* The central spine */}
        <div className="absolute left-10 md:left-24 top-0 bottom-0 w-1 bg-[var(--border)]" />

        <div className="py-24 px-4 md:px-12 max-w-3xl">
          {days.map((day, dIdx) => {
            const isTodayCard = day.status === 'today';
            
            let dayLabel = format(day.date, 'EEE, MMM do').toUpperCase();
            if (isTodayCard) dayLabel = "TODAY // " + dayLabel;
            
            return (
              <div 
                key={day.date.toISOString()} 
                ref={isTodayCard ? todayRef : null}
                className={`relative mb-16 pl-12 md:pl-24 transition-opacity duration-500 ${day.status === 'past' ? 'opacity-60 hover:opacity-100' : ''}`}
              >
                {/* Node on the spine */}
                <div className={`absolute left-8 md:left-[5.3rem] top-6 w-5 h-5 rounded-full border-4 border-[var(--border)] -translate-x-1/2 bg-[var(--bg)] z-10 ${isTodayCard ? 'bg-[var(--accent)] border-[var(--border)]' : ''}`} />
                
                {/* Date Label */}
                <div className="absolute left-12 md:left-28 top-0 -mt-2">
                   <span className={`px-3 py-1 text-xs font-bold border-2 border-[var(--border)] ${isTodayCard ? 'bg-[var(--accent)] text-[var(--paper)]' : 'bg-[var(--paper)]'}`}>
                     {dayLabel}
                   </span>
                </div>

                {/* Card */}
                <div className={`mt-6 border-2 border-[var(--border)] bg-[var(--paper)] p-6 md:p-8 shadow-[6px_6px_0_var(--border)] ${isTodayCard ? 'ring-4 ring-[var(--accent-faded)] ring-offset-4 ring-offset-[var(--bg)]' : ''}`}>
                  {day.lifts.length === 0 ? (
                    <div className="text-[var(--muted)] font-bold uppercase text-sm border-2 border-dashed border-[var(--muted)] p-4 text-center">
                      REST DAY // NO ACTIVITY LOGGED
                      <button onClick={() => addLift(dIdx)} className="block mx-auto mt-4 px-4 py-2 border-2 border-[var(--border)] text-[var(--ink)] bg-[var(--bg)] hover:bg-[var(--border)] hover:text-[var(--paper)] text-xs font-bold transition-colors">
                        + ADD WORK
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {day.lifts.map((lift, lIdx) => (
                        <div key={lift.id} className="group">
                          <div className="flex justify-between items-end mb-4 border-b-2 border-[var(--border)] pb-2">
                            <input 
                              type="text" 
                              value={lift.exercise} 
                              onChange={(e) => {
                                const next = [...days];
                                next[dIdx].lifts[lIdx].exercise = e.target.value.toUpperCase();
                                setDays(next);
                              }}
                              className="continuous-log-display text-2xl md:text-3xl font-bold uppercase bg-transparent outline-none w-full"
                            />
                            <div className="text-[10px] uppercase font-bold text-[var(--muted)] shrink-0 ml-4 hidden md:block">
                              {lift.sets.length} SETS
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-4">
                            {lift.sets.map((set, sIdx) => (
                              <div key={set.id} className="flex items-center gap-3">
                                <button 
                                  onClick={() => toggleSet(dIdx, lIdx, sIdx)}
                                  className={`checkbox-custom ${set.status === 'missed' ? 'missed' : ''}`}
                                  data-checked={set.status === 'done'}
                                  // we use standard checked prop for styling if done
                                  {...(set.status === 'done' ? { checked: true } : {})}
                                  aria-label={`Toggle set status: currently ${set.status}`}
                                />
                                <div className="flex items-baseline gap-1">
                                  <input 
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) => {
                                      const next = [...days];
                                      next[dIdx].lifts[lIdx].sets[sIdx].weight = Number(e.target.value);
                                      setDays(next);
                                    }}
                                    className="w-12 bg-transparent border-b border-dashed border-[var(--muted)] text-lg font-bold text-center outline-none focus:border-[var(--border)]"
                                  />
                                  <span className="text-[10px] text-[var(--muted)] uppercase mr-1">KG</span>
                                  <span className="text-sm font-bold mx-1">×</span>
                                  <input 
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) => {
                                      const next = [...days];
                                      next[dIdx].lifts[lIdx].sets[sIdx].reps = Number(e.target.value);
                                      setDays(next);
                                    }}
                                    className="w-8 bg-transparent border-b border-dashed border-[var(--muted)] text-lg font-bold text-center outline-none focus:border-[var(--border)]"
                                  />
                                </div>
                              </div>
                            ))}
                            <button 
                              onClick={() => {
                                const next = [...days];
                                const lastSet = lift.sets[lift.sets.length - 1];
                                next[dIdx].lifts[lIdx].sets.push({
                                  id: Math.random().toString(),
                                  weight: lastSet ? lastSet.weight : 0,
                                  reps: lastSet ? lastSet.reps : 0,
                                  status: 'empty'
                                });
                                setDays(next);
                              }}
                              className="w-6 h-6 rounded-full border border-dashed border-[var(--muted)] text-[var(--muted)] hover:border-[var(--border)] hover:text-[var(--ink)] flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 flex justify-center">
                        <button onClick={() => addLift(dIdx)} className="opacity-30 hover:opacity-100 px-4 py-2 border-2 border-[var(--border)] text-[var(--ink)] bg-[var(--paper)] hover:bg-[var(--border)] hover:text-[var(--paper)] text-xs font-bold transition-all">
                          + ADD LIFT TO DAY
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="text-center pt-8 pb-24">
             <div className="w-1 h-16 bg-gradient-to-b from-[var(--border)] to-transparent mx-auto mb-4" />
             <p className="text-xs font-bold tracking-widest text-[var(--muted)]">END OF TAPE</p>
          </div>
        </div>
      </div>
    </div>
  );
}