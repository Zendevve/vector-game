import React from 'react';
import { X, Volume2, Smartphone, Check } from 'lucide-react';
import { Button } from '../components/Button';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    volume: number;
    onVolumeChange: (v: number) => void;
    soundEnabled: boolean;
    onSoundEnabledChange: (v: boolean) => void;
    hapticsEnabled: boolean;
    onHapticsEnabledChange: (v: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onClose,
    volume,
    onVolumeChange,
    soundEnabled,
    onSoundEnabledChange,
    hapticsEnabled,
    onHapticsEnabledChange
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 relative shadow-2xl">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">Settings</h2>

                {/* Volume Control */}
                <div className="mb-8">
                     <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                            <Volume2 size={14} /> Master Volume
                        </label>
                        <span className="text-xs font-mono text-white">{Math.round(volume * 100)}%</span>
                     </div>
                     <div className="relative h-6 flex items-center">
                        <input 
                            type="range" 
                            min="0" max="1" step="0.05"
                            value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="w-full appearance-none bg-neutral-800 h-1 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                        />
                     </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                        <span className="text-sm font-bold text-white">Sound Effects</span>
                        <Toggle value={soundEnabled} onChange={onSoundEnabledChange} />
                    </div>
                     <div className="flex items-center justify-between p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                            <Smartphone size={16} /> Haptics
                        </span>
                        <Toggle value={hapticsEnabled} onChange={onHapticsEnabledChange} />
                    </div>
                </div>

                <Button fullWidth variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </div>
    );
}

const Toggle = ({value, onChange}: {value: boolean, onChange: (v: boolean) => void}) => (
    <button 
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition-colors focus:outline-none ${value ? 'bg-white' : 'bg-neutral-800'}`}
        aria-pressed={value}
    >
        <div className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-200 shadow-sm ${value ? 'left-6 bg-black' : 'left-1 bg-neutral-500'}`} />
    </button>
);