import React, { useState } from 'react';
import { X, Scan, Zap, Radio, Search, CheckCircle2 } from 'lucide-react';

interface SimulatedScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (equipmentId: string) => void;
  title?: string;
}

const SAMPLE_TAGS = [
  { id: 'EXQ1001', type: 'Excavator', status: 'Due Soon' },
  { id: 'EXQ1003', type: 'Bulldozer', status: 'Overdue (4d)' },
  { id: 'EXQ1004', type: 'Grader', status: 'Available' },
  { id: 'EXQ1007', type: 'Excavator', status: 'Under-utilized' },
  { id: 'EXQ1005', type: 'Loader', status: 'Rented' },
];

export const SimulatedScannerModal: React.FC<SimulatedScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'QR & RFID Equipment Scanner',
}) => {
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedId, setScannedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (id: string) => {
    setScanning(true);
    setScannedId(id);
    setTimeout(() => {
      setScanning(false);
      onScan(id);
      onClose();
    }, 600);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    const cleanId = manualId.trim().toUpperCase();
    handleSimulateScan(cleanId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{title}</h3>
              <p className="text-xs text-gray-400">Hardware-free RFID / QR simulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6">
          <div className="relative h-44 bg-gray-950 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden">
            {/* Corner crosshairs */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400"></div>

            {/* Scanning Laser Beam */}
            {scanning ? (
              <div className="absolute inset-x-0 h-1 bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,1)] animate-bounce"></div>
            ) : (
              <div className="flex flex-col items-center text-center p-4">
                <Radio className="w-8 h-8 text-amber-400/80 mb-2 animate-pulse" />
                <span className="text-xs text-gray-400">
                  Ready to scan equipment tag or enter ID below
                </span>
              </div>
            )}

            {scanning && scannedId && (
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/40 text-xs font-mono font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                TAG DETECTED: {scannedId}
              </div>
            )}
          </div>

          {/* Quick Select Sample RFID Tags */}
          <div className="mt-5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Simulated RFID / QR Tags:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSimulateScan(tag.id)}
                  disabled={scanning}
                  className="flex flex-col items-start p-2 rounded-lg bg-gray-800/70 hover:bg-gray-800 border border-gray-700/80 hover:border-amber-500/50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold text-amber-400 group-hover:text-amber-300">
                      {tag.id}
                    </span>
                    <Zap className="w-3 h-3 text-gray-500 group-hover:text-amber-400" />
                  </div>
                  <span className="text-[11px] text-gray-300">{tag.type}</span>
                  <span className="text-[10px] text-gray-400 truncate w-full">{tag.status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="mt-5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Or Manual Equipment ID Entry
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. EXQ1001"
                  className="w-full pl-9 pr-3 py-2 bg-gray-800/90 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={!manualId.trim() || scanning}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors"
              >
                Scan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
