import React from 'react';
import { Bell, Mail, Smartphone, ChevronDown, ChevronRight } from 'lucide-react';

const EVENTS = [
  { key: 'onEnter', label: 'On Enter' },
  { key: 'onExit', label: 'On Exit' },
  { key: 'onTimeout', label: 'On Timeout' },
];

const EDGE_EVENTS = [
  { key: 'onTrigger', label: 'On Trigger' },
];

const CHANNELS = ['email', 'sms'];
const RECIPIENTS = ['owner', 'assignee', 'admin', 'custom'];

export default function NotificationConfig({ notifications = {}, onChange, events }) {
  const eventList = events || EVENTS;

  const updateEvent = (eventKey, updates) => {
    const updated = {
      ...notifications,
      [eventKey]: {
        ...(notifications[eventKey] || { enabled: false, channels: ['email'], template: '', recipient: 'owner' }),
        ...updates,
      },
    };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Bell className="w-3.5 h-3.5 text-synthia-400" />
        <span className="text-xs font-semibold text-slate-300">Notifications</span>
      </div>

      {eventList.map(evt => {
        const config = notifications[evt.key] || { enabled: false, channels: ['email'], template: '', recipient: 'owner' };
        return (
          <NotificationEventConfig
            key={evt.key}
            label={evt.label}
            config={config}
            onChange={(updates) => updateEvent(evt.key, updates)}
          />
        );
      })}

      {/* FXNotification Integration (display-only) */}
      <div className="mt-3 p-2 bg-slate-900/50 rounded border border-slate-700/50">
        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mb-1">
          FXNotification Integration (v2)
        </p>
        <div className="space-y-1.5">
          <input
            readOnly
            placeholder="API Endpoint URL"
            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-500 cursor-not-allowed"
          />
          <input
            readOnly
            placeholder="Task Code"
            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-500 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

function NotificationEventConfig({ label, config, onChange }) {
  const [expanded, setExpanded] = React.useState(config.enabled);

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <button
        className="flex items-center justify-between w-full px-2.5 py-2 text-left hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          <span className="text-[11px] font-medium text-slate-300">{label}</span>
        </div>
        <label className="flex items-center" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => onChange({ enabled: e.target.checked })}
            className="w-3 h-3 rounded border-slate-600 text-synthia-500 focus:ring-synthia-500 bg-slate-700"
          />
        </label>
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2">
          {/* Channels */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Channels</label>
            <div className="flex gap-2">
              {CHANNELS.map(ch => (
                <label key={ch} className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(config.channels || []).includes(ch)}
                    onChange={e => {
                      const channels = e.target.checked
                        ? [...(config.channels || []), ch]
                        : (config.channels || []).filter(c => c !== ch);
                      onChange({ channels });
                    }}
                    className="w-2.5 h-2.5 rounded border-slate-600 text-synthia-500 focus:ring-synthia-500 bg-slate-700"
                  />
                  {ch === 'email' ? <Mail className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Recipient</label>
            <select
              value={config.recipient || 'owner'}
              onChange={e => onChange({ recipient: e.target.value })}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500"
            >
              {RECIPIENTS.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Template */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">
              Template <span className="text-slate-500">({'{objectName}'}, {'{fromStatus}'}, {'{toStatus}'}, {'{action}'})</span>
            </label>
            <textarea
              value={config.template || ''}
              onChange={e => onChange({ template: e.target.value })}
              rows={2}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-synthia-500 resize-none"
              placeholder="Enter notification template..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { EDGE_EVENTS };
