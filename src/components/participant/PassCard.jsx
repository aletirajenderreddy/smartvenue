/**
 * PassCard.jsx
 * Beautiful participant event pass — QR code, seat number, WiFi, helplines, admin contact.
 * Supports downloading as PNG via Canvas.
 */
import { useState } from 'react';
import { Download, Wifi, Phone, Shield, MapPin, Calendar, User, Hash } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SCHEDULE_TYPE_COLORS = {
  keynote: '#a78bfa',
  session: '#38bdf8',
  workshop: '#34d399',
  break: '#fbbf24',
  networking: '#f472b6',
};

function QRDisplay({ qrCodeData }) {
  if (qrCodeData) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300">
        <QRCodeSVG
          value={qrCodeData}
          size={160}
          bgColor={"#ffffff"}
          fgColor={"#0B1220"}
          level={"H"}
        />
      </div>
    );
  }
  return (
    <div className="w-40 h-40 rounded-xl bg-white/10 border-2 border-dashed border-white/30 flex flex-col items-center justify-center mx-auto gap-2">
      <div className="w-8 h-8 border-2 border-white/50 rounded-sm" />
      <p className="text-xs text-white/50">QR generating…</p>
    </div>
  );
}

export default function PassCard({ participant, event }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');

  const helplines = event?.helpline_numbers || [];
  const hasWifi = event?.wifi_ssid;

  async function handleDownload() {
    setDownloading(true);
    setDownloadMsg('');
    try {
      const qrUrl = participant?.qrSignedUrl || participant?.qr_data_url;
      if (qrUrl) {
        // Fetch as blob and trigger download
        const res = await fetch(qrUrl);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `smartvenuex-pass-seat-${participant?.seat_number || 'X'}.png`;
        link.click();
        URL.revokeObjectURL(objectUrl);
        setDownloadMsg('QR downloaded!');
      } else {
        setDownloadMsg('QR is not ready yet. Please refresh in a moment.');
      }
    } catch (err) {
      setDownloadMsg('Download failed. Try right-clicking the QR image and saving it.');
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadMsg(''), 4000);
    }
  }

  const startDate = event?.start_date
    ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="space-y-4">
      {/* The card itself */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-6 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        {/* Decorative glows */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400 mb-1">
              SmartVenueX · Event Pass
            </p>
            <h2 className="font-bold text-white text-lg leading-tight line-clamp-2">
              {event?.name || 'Event'}
            </h2>
            {startDate && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar size={11} className="text-white/50" />
                <p className="text-xs text-white/50">{startDate}</p>
              </div>
            )}
            {(event?.location?.venue || event?.location?.city) && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-white/50" />
                <p className="text-xs text-white/50">
                  {[event.location.venue, event.location.city].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>
          {/* Seat number badge */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30 px-3 py-2 min-w-[64px]">
            <Hash size={12} className="text-violet-400" />
            <p className="text-[10px] text-violet-300 font-semibold uppercase tracking-wide mt-0.5">Seat</p>
            <p className="font-black text-white text-2xl leading-none">
              {participant?.seat_number ?? '—'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-white/10" />
          <div className="h-2 w-2 rounded-full bg-violet-400" />
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* QR + Participant info */}
        <div className="relative flex flex-col items-center gap-4">
          <QRDisplay
            qrCodeData={participant?.qr_token || participant?.id || `GUEST-${Date.now()}`}
          />

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <User size={13} className="text-white/50" />
              <p className="text-sm font-semibold text-white">{participant?.full_name || '—'}</p>
            </div>
            <p className="text-xs text-white/50">{participant?.email}</p>
            {participant?.college_name && (
              <p className="text-xs text-white/40 mt-0.5">{participant.college_name}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-white/10" />
          <div className="h-2 w-2 rounded-full bg-blue-400" />
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* WiFi Section */}
        {hasWifi && (
          <div className="relative rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi size={15} className="text-blue-400" />
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Event WiFi</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Network</p>
                <p className="text-sm font-semibold text-white font-mono">{event.wifi_ssid}</p>
              </div>
              {event?.wifi_password && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">Password</p>
                  <p className="text-sm font-semibold text-white font-mono">{event.wifi_password}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Contact */}
        {(event?.contact_phone || event?.contact_email) && (
          <div className="relative rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={15} className="text-emerald-400" />
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Admin Contact</p>
            </div>
            <div className="space-y-1">
              {event.contact_phone && (
                <p className="text-sm text-white font-mono">{event.contact_phone}</p>
              )}
              {event.contact_email && (
                <p className="text-xs text-white/60">{event.contact_email}</p>
              )}
            </div>
          </div>
        )}

        {/* Helpline Numbers */}
        {helplines.length > 0 && (
          <div className="relative rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={15} className="text-amber-400" />
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Helpline Numbers</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {helplines.map((h, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-xs text-white/60">{h.label}</p>
                  <a
                    href={`tel:${h.number}`}
                    className="text-sm font-semibold text-amber-300 font-mono hover:text-amber-200 transition-colors"
                  >
                    {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="relative mt-4 text-center">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.3em]">
            Powered by SmartVenueX · Scan to verify
          </p>
        </div>
      </div>

      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-4 py-3 font-semibold text-white transition-all active:scale-95"
      >
        <Download size={16} />
        {downloading ? 'Downloading…' : 'Download QR Pass'}
      </button>
      {downloadMsg && (
        <p className="text-center text-xs text-white/60">{downloadMsg}</p>
      )}
    </div>
  );
}
