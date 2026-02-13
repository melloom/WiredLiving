'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface MusicPlayerData {
  enabled: boolean;
  src: string;
  title?: string;
  artist?: string;
}

interface MusicPlayerContextType {
  musicPlayer: MusicPlayerData | null;
  setMusicPlayer: (player: MusicPlayerData | null) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ 
  children, 
  initialMusicPlayer 
}: { 
  children: ReactNode;
  initialMusicPlayer?: MusicPlayerData | null;
}) {
  const [musicPlayer, setMusicPlayer] = useState(initialMusicPlayer || null);

  return (
    <MusicPlayerContext.Provider value={{ musicPlayer, setMusicPlayer }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
