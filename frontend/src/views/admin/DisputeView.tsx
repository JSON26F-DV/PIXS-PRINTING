import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import SplitText from '../../components/animations/SplitText';
import workflowData from '../../data/workflow.json';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const ISSUE_TYPES = ['Defective Print', 'Missing Item', 'Wrong Design', 'Color Mismatch', 'Damaged Delivery', 'Other'] as const;
type IssueType = typeof ISSUE_TYPES[number];
type DisputeStatus = 'Pending' | 'Resolved' | 'Re-print' | 'Refunded';

interface Dispute {
  id: string;
  order_id: string;
  customer: string;
  issue_type: IssueType | string;
  description: string;
  photo_evidence: string;
  reported_at: string;
  status: DisputeStatus | string;
  resolution: string | null;
}

const DisputeView: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>(workflowData.disputes as Dispute[]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState<{
    order_id: string;
    customer: string;
    issue_type: IssueType;
    description: string;
    photo_evidence: string;
  }>({
    order_id: '',
    customer: '',
    issue_type: 'Defective Print',
    description: '',
    photo_evidence: ''
  });

  const handleStatusChange = (disputeId: string, newStatus: DisputeStatus) => {
    setDisputes(prev => prev.map(d => 
      d.id === disputeId ? { ...d, status: newStatus } : d
    ));
  };

  const handleCreateTicket = () => {
    if (!newTicket.order_id || !newTicket.description) return;
    
    const ticket: Dispute = {
      id: `DSP-${String(disputes.length + 1).padStart(3, '0')}`,
      ...newTicket,
      reported_at: new Date().toISOString(),
      status: 'Pending',
      resolution: null
    };
    
    setDisputes([ticket, ...disputes]);
    setShowNewTicket(false);
    setNewTicket({ order_id: '', customer: '', issue_type: 'Defective Print', description: '', photo_evidence: '' });
  };

  const pendingCount = disputes.filter(d => d.status === 'Pending').length;
  const resolvedCount = disputes.filter(d => d.status === 'Resolved').length;
  const reprintCount = disputes.filter(d => d.status === 'Re-print').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="flex items-center justify-between">
        <div>
          <SplitText text="DISPUTE_RESOLUTION_CENTER" className="text-2xl font-bold font-mono text-slate-900" />
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Complaint tracking & ticket management</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowNewTicket(true)}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            NEW_TICKET
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-6 fuzzy-overlay relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Complaints Open</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-rose-500">{pendingCount}</span>
            <span className="text-sm font-mono text-slate-400">tickets</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 fuzzy-overlay relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText className="w-12 h-12 text-amber-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Re-print Orders</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-amber-500">{reprintCount}</span>
            <span className="text-sm font-mono text-slate-400">tickets</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 fuzzy-overlay relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-emerald-500">{resolvedCount}</span>
            <span className="text-sm font-mono text-slate-400">tickets</span>
          </div>
        </div>
      </div>

      {showNewTicket && (
        <div className="bg-white border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create New Ticket</h3>
            <button onClick={() => setShowNewTicket(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Order ID</label>
                <input 
                  type="text"
                  value={newTicket.order_id}
                  onChange={(e) => setNewTicket({...newTicket, order_id: e.target.value})}
                  placeholder="ORD-XXXX"
                  className="w-full px-3 py-2 border border-slate-200 text-sm font-mono focus:outline-none focus:border-pixs-mint"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</label>
                <input 
                  type="text"
                  value={newTicket.customer}
                  onChange={(e) => setNewTicket({...newTicket, customer: e.target.value})}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:border-pixs-mint"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Type</label>
              <select 
                value={newTicket.issue_type}
                onChange={(e) => setNewTicket({...newTicket, issue_type: e.target.value as IssueType})}
                className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:border-pixs-mint"
              >
                {ISSUE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
              <textarea 
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                placeholder="Describe the issue in detail..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:border-pixs-mint resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Photo Evidence URL</label>
              <input 
                type="text"
                value={newTicket.photo_evidence}
                onChange={(e) => setNewTicket({...newTicket, photo_evidence: e.target.value})}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 text-sm font-mono focus:outline-none focus:border-pixs-mint"
              />
            </div>
            <button 
              onClick={handleCreateTicket}
              disabled={!newTicket.order_id || !newTicket.description}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CREATE_TICKET
            </button>
          </div>
        </div>
      )}

      <section className="bg-white border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <FileText className="w-4 h-4" />
              DISPUTE_TICKETS
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{disputes.length} total tickets</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="transition-colors">
              <div 
                className={cn(
                  "p-4 cursor-pointer hover:bg-slate-50/50 transition-colors",
                  dispute.status === 'Pending' && "bg-rose-50/20"
                )}
                onClick={() => setExpandedId(expandedId === dispute.id ? null : dispute.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold uppercase",
                      dispute.status === 'Pending' ? "bg-rose-500 text-white" :
                      dispute.status === 'Resolved' ? "bg-emerald-100 text-emerald-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {dispute.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">{dispute.id}</span>
                    <span className="font-mono text-xs font-bold text-slate-400">{dispute.order_id}</span>
                    <span className="text-sm font-bold text-slate-900">{dispute.customer}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold uppercase",
                      dispute.issue_type === 'Defective Print' ? "bg-purple-100 text-purple-700" :
                      dispute.issue_type === 'Missing Item' ? "bg-red-100 text-red-700" :
                      dispute.issue_type === 'Wrong Design' ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {dispute.issue_type}
                    </span>
                    {expandedId === dispute.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedId === dispute.id && (
                <div className="px-4 pb-4 bg-slate-50/30">
                  <div className="pl-4 border-l-2 border-slate-200 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm text-slate-700">{dispute.description}</p>
                    </div>
                    
                    {dispute.photo_evidence && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Photo Evidence</p>
                        <img 
                          src={dispute.photo_evidence} 
                          alt="Evidence" 
                          className="w-48 h-36 object-cover border border-slate-200"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Reported: {new Date(dispute.reported_at).toLocaleString()}
                    </div>

                    {dispute.resolution && (
                      <div className="bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Resolution</p>
                        <p className="text-sm text-emerald-700">{dispute.resolution}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Status:</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(dispute.id, 'Resolved'); }}
                        className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        RESOLVED
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(dispute.id, 'Re-print'); }}
                        className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                      >
                        RE-PRINT
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(dispute.id, 'Refunded'); }}
                        className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        REFUNDED
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {disputes.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-bold">No dispute tickets</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DisputeView;
