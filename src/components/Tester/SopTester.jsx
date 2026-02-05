import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit3, Circle, CheckCircle, Trash2 } from 'lucide-react';
import { fetchSOP } from '../../utils/api';
import { createTestObject, transition, getNodeById } from '../../utils/sopEngine';
import { generateNotificationPreviews } from '../../utils/notifications';
import useSopStore from '../../store/sopStore';
import ObjectTracker from './ObjectTracker';
import ActionPanel from './ActionPanel';
import AuditLog from './AuditLog';

const OBJECT_COLORS = ['#8B5CF6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function SopTester() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useSopStore(s => s.addToast);
  const [sop, setSop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testObjects, setTestObjects] = useState([]);
  const [activeObjectId, setActiveObjectId] = useState(null);
  const [showNewObject, setShowNewObject] = useState(false);
  const [newObjName, setNewObjName] = useState('');
  const [bottomTab, setBottomTab] = useState('actions');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSOP(id);
        if (cancelled) return;
        // Transform the API response to match the format sopEngine expects
        const def = data.definition || {};
        setSop({
          id: data.id,
          name: data.name,
          description: data.description,
          nodes: def.nodes || [],
          edges: def.edges || [],
          objectSchema: def.objectSchema || { properties: [] },
        });
      } catch {
        if (!cancelled) addToast({ type: 'error', message: 'Failed to load SOP' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-400 mb-4">SOP not found</p>
          <Link to="/" className="text-synthia-400 hover:text-synthia-300">← Back to My SOPs</Link>
        </div>
      </div>
    );
  }

  const activeObject = testObjects.find(o => o.id === activeObjectId);

  const handleNewObject = () => {
    const name = newObjName.trim() || `Object ${testObjects.length + 1}`;
    const color = OBJECT_COLORS[testObjects.length % OBJECT_COLORS.length];
    try {
      const obj = createTestObject(sop, name, color);
      setTestObjects(prev => [...prev, obj]);
      setActiveObjectId(obj.id);
      setShowNewObject(false);
      setNewObjName('');
      addToast({ type: 'success', message: `Created "${name}" at Start` });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleTransition = (edgeId, fieldValues) => {
    if (!activeObject) return;
    try {
      const { updatedObject, auditEntry, notifications } = transition(sop, activeObject, edgeId, fieldValues);
      setTestObjects(prev => prev.map(o => o.id === updatedObject.id ? updatedObject : o));

      if (notifications.length > 0) {
        const previews = generateNotificationPreviews(notifications, updatedObject.name);
        for (const preview of previews) {
          addToast({
            type: 'notification',
            title: `${preview.icon} ${preview.channel} to [${preview.recipient}]`,
            message: preview.body,
            duration: 6000,
          });
        }
      }

      const toNode = getNodeById(sop, updatedObject.currentNodeId);
      addToast({
        type: 'info',
        message: `${updatedObject.name} → ${toNode?.data?.label || 'Unknown'}${updatedObject.isComplete ? ' (Complete!)' : ''}`,
      });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteObject = (objId) => {
    setTestObjects(prev => prev.filter(o => o.id !== objId));
    if (activeObjectId === objId) {
      setActiveObjectId(testObjects.find(o => o.id !== objId)?.id || null);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar - Object List */}
      <div className="w-56 bg-slate-800/50 border-r border-slate-700 flex flex-col flex-shrink-0">
        <div className="px-3 py-2.5 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="text-sm font-medium text-white truncate flex-1">{sop.name}</h2>
            <button onClick={() => navigate(`/designer/${id}`)} className="text-slate-400 hover:text-synthia-400 transition-colors" title="Edit SOP">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => setShowNewObject(true)}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-synthia-600 hover:bg-synthia-700 rounded-md transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Object
          </button>
        </div>

        {showNewObject && (
          <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/80">
            <input
              type="text" value={newObjName} onChange={e => setNewObjName(e.target.value)}
              placeholder="Object name..." autoFocus
              onKeyDown={e => e.key === 'Enter' && handleNewObject()}
              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-synthia-500 mb-1.5"
            />
            <div className="flex gap-1">
              <button onClick={handleNewObject} className="flex-1 px-2 py-1 text-[10px] font-medium text-white bg-synthia-600 rounded transition-colors">Create</button>
              <button onClick={() => { setShowNewObject(false); setNewObjName(''); }} className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {testObjects.length === 0 ? (
            <div className="text-center py-8 px-3">
              <p className="text-xs text-slate-500">No test objects yet.</p>
              <p className="text-[10px] text-slate-600 mt-1">Create one to start testing.</p>
            </div>
          ) : (
            <div className="py-1">
              {testObjects.map(obj => {
                const node = getNodeById(sop, obj.currentNodeId);
                const isActive = obj.id === activeObjectId;
                return (
                  <div
                    key={obj.id}
                    onClick={() => setActiveObjectId(obj.id)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                      isActive ? 'bg-synthia-500/10 border-r-2 border-synthia-500' : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: obj.color }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{obj.name}</p>
                      <div className="flex items-center gap-1">
                        {obj.isComplete ? (
                          <CheckCircle className="w-2.5 h-2.5 text-green-400" />
                        ) : (
                          <Circle className="w-2.5 h-2.5" style={{ color: node?.data?.color || '#8B5CF6' }} />
                        )}
                        <span className="text-[10px] text-slate-500 truncate">{node?.data?.label || 'Unknown'}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteObject(obj.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center - Flow Tracker */}
      <div className="flex-1 flex flex-col">
        <ObjectTracker sop={sop} testObjects={testObjects} activeObjectId={activeObjectId} />
      </div>

      {/* Right sidebar - Actions + Audit */}
      <div className="w-80 bg-slate-800/50 border-l border-slate-700 flex flex-col flex-shrink-0">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setBottomTab('actions')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              bottomTab === 'actions'
                ? 'text-synthia-400 border-b-2 border-synthia-500 bg-synthia-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setBottomTab('audit')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              bottomTab === 'audit'
                ? 'text-synthia-400 border-b-2 border-synthia-500 bg-synthia-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Trail
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {bottomTab === 'actions' ? (
            <div className="h-full overflow-y-auto">
              <ActionPanel sop={sop} testObject={activeObject} onTransition={handleTransition} />
            </div>
          ) : (
            <AuditLog testObjects={testObjects} sopName={sop.name} />
          )}
        </div>
      </div>
    </div>
  );
}
