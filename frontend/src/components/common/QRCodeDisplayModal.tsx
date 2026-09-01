import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Copy, Check } from 'lucide-react';
import { Equipment } from '../../types';
import { StatusBadge } from './StatusBadge';

interface QRCodeDisplayModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({
  equipment,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !equipment) return null;

  const qrPayload = JSON.stringify({
    system: "CATERPILLAR-SMART-RENTAL",
    equipment_id: equipment.equipment_id,
    equipment_type: equipment.equipment_type,
    status: equipment.status,
    customer_id: equipment.customer_id,
    site_id: equipment.site_id,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(equipment.equipment_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Equipment Asset QR Tag</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="bg-white p-4 rounded-xl shadow-md border-4 border-amber-500/30 mb-4">
            <QRCodeSVG
              value={qrPayload}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-black text-amber-400 tracking-wider">
                {equipment.equipment_id}
              </span>
              <button
                onClick={handleCopy}
                title="Copy ID"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-sm font-medium text-gray-300">{equipment.equipment_type}</p>
            <div className="flex justify-center pt-1">
              <StatusBadge status={equipment.status} size="sm" />
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 w-full text-xs text-gray-400 text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <span className="font-mono text-gray-300">{equipment.customer_id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Site ID:</span>
              <span className="font-mono text-gray-300">{equipment.site_id || '—'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-950/60 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
