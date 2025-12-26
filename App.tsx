
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Trophy, Navigation, RotateCcw, Info, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';
import MapComponent from './components/Map';
import { getRandomRug } from './services/museumApi';
import { GameState, LatLng, RugObject } from './types';

const MAX_ROUNDS = 5;

const calculateScore = (distance: number): number => {
  // Max score 5000, drops off with distance
  // 5000 points if < 25km, 0 points if > 15000km
  const score = Math.max(0, Math.round(5000 * Math.exp(-distance / 2000)));
  return score;
};

const getDistance = (p1: LatLng, p2: LatLng): number => {
  const R = 6371; // km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    currentRound: 1,
    maxRounds: MAX_ROUNDS,
    score: 0,
    isRoundActive: true,
    selectedPos: null,
    currentRug: null,
    lastRoundResults: null,
    status: 'loading',
  });

  const nextRound = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading', isRoundActive: true, selectedPos: null, lastRoundResults: null }));
    try {
      const rug = await getRandomRug();
      setState(prev => ({
        ...prev,
        currentRug: rug,
        status: 'playing',
      }));
    } catch (err) {
      console.error(err);
      // Retry
      setTimeout(nextRound, 1000);
    }
  }, []);

  useEffect(() => {
    nextRound();
  }, []);

  const handleSelectPos = (pos: LatLng) => {
    if (!state.isRoundActive) return;
    setState(prev => ({ ...prev, selectedPos: pos }));
  };

  const handleConfirm = () => {
    if (!state.selectedPos || !state.currentRug) return;
    
    const distance = getDistance(state.selectedPos, state.currentRug.coordinates);
    const points = calculateScore(distance);

    setState(prev => ({
      ...prev,
      isRoundActive: false,
      score: prev.score + points,
      lastRoundResults: { distance, points },
      status: 'result'
    }));
  };

  const handleNext = () => {
    if (state.currentRound === state.maxRounds) {
      setState(prev => ({ ...prev, status: 'finished' }));
    } else {
      setState(prev => ({ ...prev, currentRound: prev.currentRound + 1 }));
      nextRound();
    }
  };

  const restartGame = () => {
    setState({
      currentRound: 1,
      maxRounds: MAX_ROUNDS,
      score: 0,
      isRoundActive: true,
      selectedPos: null,
      currentRug: null,
      lastRoundResults: null,
      status: 'loading',
    });
    nextRound();
  };

  if (state.status === 'finished') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-amber-100 rounded-full">
              <Trophy className="w-12 h-12 text-amber-600" />
            </div>
          </div>
          <h1 className="text-3xl font-serif text-slate-900">Quest Complete!</h1>
          <p className="text-slate-600">You've traversed the global textile maps and discovered masterworks from across history.</p>
          <div className="py-6 border-y border-slate-100">
            <div className="text-sm uppercase tracking-widest text-slate-400 mb-1">Total Score</div>
            <div className="text-5xl font-bold text-slate-900">{state.score.toLocaleString()}</div>
          </div>
          <button
            onClick={restartGame}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-5 h-5" /> Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-100">
      {/* Map Layer */}
      <MapComponent
        onSelect={handleSelectPos}
        selectedPos={state.selectedPos}
        correctPos={state.status === 'result' ? state.currentRug?.coordinates : null}
        showResult={state.status === 'result'}
      />

      {/* Floating Header UI */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-[1000]">
        <div className="flex gap-4 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white/20">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Round</div>
            <div className="text-xl font-bold text-slate-900">{state.currentRound} / {state.maxRounds}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white/20">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Total Score</div>
            <div className="text-xl font-bold text-slate-900">{state.score.toLocaleString()}</div>
          </div>
        </div>

        <div className="pointer-events-auto">
           <h1 className="text-3xl font-serif text-slate-900 drop-shadow-sm px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl">RugGuesser</h1>
        </div>
      </div>

      {/* Rug Viewport - Center Stage */}
      {state.currentRug && (
        <div 
          className={`absolute left-6 bottom-32 w-[320px] md:w-[400px] z-[1000] transition-all duration-500 transform ${state.status === 'loading' ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="relative aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
               {/* Loader for image */}
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-white animate-spin opacity-20" />
               </div>
               <img 
                 src={state.currentRug.imageUrl} 
                 alt={state.currentRug.title}
                 className="relative z-10 w-full h-full object-contain cursor-zoom-in hover:scale-110 transition-transform duration-500"
                 onClick={() => window.open(state.currentRug!.imageUrl, '_blank')}
               />
               <div className="absolute top-3 right-3 z-20">
                 <button 
                   onClick={() => window.open(state.currentRug!.sourceUrl, '_blank')}
                   className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                   title="View museum record"
                 >
                   <ExternalLink className="w-4 h-4" />
                 </button>
               </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-bold uppercase tracking-widest">{state.currentRug.museum}</span>
              </div>
              <h2 className="text-lg font-serif leading-tight text-slate-800 mb-1">{state.currentRug.title}</h2>
              <p className="text-sm text-slate-500 italic mb-3">{state.currentRug.date || 'Historical Period'}</p>
              
              {state.status === 'result' && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Origin Found</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">SPECIFIC</span>
                  </div>
                  <div className="text-xl font-bold text-indigo-950 mb-1">{state.currentRug.locationName}</div>
                  <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {state.currentRug.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result Backdrop */}
      {state.status === 'result' && state.lastRoundResults && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl px-12 py-8 rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] text-center animate-in zoom-in-95 duration-500 border border-white/20">
             <div className="text-sm uppercase tracking-[0.3em] font-bold text-indigo-400 mb-2">Distance</div>
             <div className="text-4xl font-black text-indigo-950 mb-6">{Math.round(state.lastRoundResults.distance).toLocaleString()} km</div>
             
             <div className="flex flex-col items-center">
               <div className="text-[80px] font-black leading-none text-indigo-600 mb-2">+{state.lastRoundResults.points}</div>
               <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Points Earned</div>
             </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center z-[2000] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl px-10 py-5 rounded-3xl shadow-2xl border border-white/20 flex gap-6 items-center pointer-events-auto">
          {!state.selectedPos && state.status === 'playing' ? (
             <div className="flex items-center gap-3 text-slate-400">
               <MapPin className="w-5 h-5" />
               <span className="font-medium">Click the map to guess the origin</span>
             </div>
          ) : state.status === 'playing' ? (
            <button
              onClick={handleConfirm}
              className="px-10 py-3.5 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-3 group"
            >
              CONFIRM GUESS
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : state.status === 'result' ? (
            <button
              onClick={handleNext}
              className="px-10 py-3.5 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center gap-3 group"
            >
              {state.currentRound === state.maxRounds ? 'VIEW RESULTS' : 'NEXT ROUND'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex items-center gap-3 text-slate-600 font-bold">
               <Loader2 className="w-5 h-5 animate-spin" />
               Locating masterpiece...
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {state.status === 'loading' && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-[5000] flex flex-col items-center justify-center space-y-4">
           <div className="w-16 h-16 relative">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
           <div className="text-center">
             <h3 className="text-2xl font-serif text-slate-800">Scouring Museums</h3>
             <p className="text-slate-500 animate-pulse">Filtering for specific provenance...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
