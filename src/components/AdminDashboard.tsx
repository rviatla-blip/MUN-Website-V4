import { useState, useEffect } from 'react';
import { Users, Settings, RefreshCw, Search, Edit, X, Check, Download, Building2 } from 'lucide-react';
import { supabase, type Delegate, type MatrixSlot } from '../lib/supabase';
import { committeeNames, countries } from '../lib/data';

export function AdminDashboard() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [matrixSlots, setMatrixSlots] = useState<MatrixSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDelegate, setEditingDelegate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ committee: '', country: '' });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [delegatesRes, matrixRes] = await Promise.all([
      supabase.from('delegates').select('*').order('created_at', { ascending: false }),
      supabase.from('matrix').select('*').order('committee').order('country'),
    ]);

    if (delegatesRes.data) setDelegates(delegatesRes.data as Delegate[]);
    if (matrixRes.data) setMatrixSlots(matrixRes.data as MatrixSlot[]);
    setLoading(false);
  };

  const filteredDelegates = delegates.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.school.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.registration_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: delegates.length,
    confirmed: delegates.filter(d => d.registration_status === 'confirmed').length,
    pending: delegates.filter(d => d.registration_status === 'pending').length,
    firstPref: delegates.filter(d => d.allocation_type === '1st Preference').length,
    secondPref: delegates.filter(d => d.allocation_type === '2nd Preference').length,
    thirdPref: delegates.filter(d => d.allocation_type === '3rd Preference').length,
    random: delegates.filter(d => d.allocation_type === 'Random').length,
    slotsAssigned: matrixSlots.filter(s => s.is_assigned).length,
    slotsAvailable: matrixSlots.filter(s => !s.is_assigned).length,
  };

  const handleEdit = (delegate: Delegate) => {
    setEditingDelegate(delegate.id);
    setEditForm({
      committee: delegate.assigned_committee || '',
      country: delegate.assigned_country || '',
    });
  };

  const handleSaveEdit = async (delegate: Delegate) => {
    // Find the new matrix slot
    const newSlot = matrixSlots.find(
      s => s.committee === editForm.committee && s.country === editForm.country && !s.is_assigned
    );

    // Release old slot if exists
    if (delegate.assigned_matrix_id) {
      await supabase
        .from('matrix')
        .update({ is_assigned: false })
        .eq('id', delegate.assigned_matrix_id);
    }

    // Update delegate
    const updateData: Partial<Delegate> = {
      assigned_committee: editForm.committee,
      assigned_country: editForm.country,
      allocation_type: 'Manual Override',
      registration_status: 'confirmed',
    };

    if (newSlot) {
      await supabase
        .from('matrix')
        .update({ is_assigned: true })
        .eq('id', newSlot.id);
      updateData.assigned_matrix_id = newSlot.id;
    } else {
      updateData.assigned_matrix_id = null;
    }

    await supabase
      .from('delegates')
      .update(updateData)
      .eq('id', delegate.id);

    setEditingDelegate(null);
    fetchData();
  };

  const handleCancelEdit = () => {
    setEditingDelegate(null);
    setEditForm({ committee: '', country: '' });
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'School', 'Phone', 'P1 Committee', 'P1 Country', 'P2 Committee', 'P2 Country', 'P3 Committee', 'P3 Country', 'Assigned Committee', 'Assigned Country', 'Allocation Type', 'Status'];
    const rows = delegates.map(d => [
      d.name, d.email, d.school, d.phone,
      d.preference_1_committee, d.preference_1_country,
      d.preference_2_committee, d.preference_2_country,
      d.preference_3_committee, d.preference_3_country,
      d.assigned_committee || '', d.assigned_country || '', d.allocation_type || '', d.registration_status
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'awsmun_delegates.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAllocationTypeColor = (type: string | null) => {
    switch (type) {
      case '1st Preference':
        return 'bg-green-100 text-green-700 border-green-200';
      case '2nd Preference':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case '3rd Preference':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Random':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Manual Override':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-corporate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Building2 className="w-7 h-7 text-corporate-950" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-corporate-200">AWSMUN Delegate Management</p>
              </div>
            </div>
            <button onClick={fetchData} className="btn-secondary border-white text-white hover:bg-white hover:text-corporate-950 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-corporate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="bg-corporate-950 rounded-xl p-4 text-center border border-corporate-800">
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-corporate-300">Total Registrations</div>
            </div>
            <div className="bg-corporate-950 rounded-xl p-4 text-center border border-corporate-800">
              <div className="text-3xl font-bold text-green-400">{stats.confirmed}</div>
              <div className="text-sm text-corporate-300">Confirmed</div>
            </div>
            <div className="bg-corporate-950 rounded-xl p-4 text-center border border-corporate-800">
              <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-corporate-300">Pending</div>
            </div>
            <div className="bg-corporate-950 rounded-xl p-4 text-center border border-corporate-800">
              <div className="text-3xl font-bold text-white">{stats.slotsAssigned}</div>
              <div className="text-sm text-corporate-300">Slots Assigned</div>
            </div>
            <div className="bg-corporate-950 rounded-xl p-4 text-center border border-corporate-800">
              <div className="text-3xl font-bold text-corporate-300">{stats.slotsAvailable}</div>
              <div className="text-sm text-corporate-300">Slots Available</div>
            </div>
          </div>

          {/* Allocation breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-900/30 rounded-lg p-3 text-center border border-green-800">
              <div className="text-xl font-bold text-green-400">{stats.firstPref}</div>
              <div className="text-xs text-green-300">1st Preference</div>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-3 text-center border border-blue-800">
              <div className="text-xl font-bold text-blue-400">{stats.secondPref}</div>
              <div className="text-xs text-blue-300">2nd Preference</div>
            </div>
            <div className="bg-purple-900/30 rounded-lg p-3 text-center border border-purple-800">
              <div className="text-xl font-bold text-purple-400">{stats.thirdPref}</div>
              <div className="text-xs text-purple-300">3rd Preference</div>
            </div>
            <div className="bg-orange-900/30 rounded-lg p-3 text-center border border-orange-800">
              <div className="text-xl font-bold text-orange-400">{stats.random}</div>
              <div className="text-xs text-orange-300">Random</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="py-4 bg-white border-b border-corporate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-corporate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or school..."
                className="input-field pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
            </select>

            {/* Export */}
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 justify-center">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Delegates Table */}
      <section className="py-8 bg-corporate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-corporate-400 animate-spin mx-auto" />
              <p className="text-corporate-600 mt-4">Loading delegates...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <thead className="bg-corporate-950 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Delegate</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold hidden lg:table-cell">School</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Preferences</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Assignment</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-corporate-100">
                  {filteredDelegates.map(delegate => (
                    <tr key={delegate.id} className="hover:bg-corporate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-corporate-950">{delegate.name}</div>
                        <div className="text-sm text-corporate-500">{delegate.email}</div>
                      </td>
                      <td className="px-4 py-3 text-corporate-600 hidden lg:table-cell">{delegate.school}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="bg-corporate-100 text-corporate-700 px-2 py-0.5 rounded font-medium">1st</span>
                            <span className="text-corporate-600">{delegate.preference_1_committee} - {delegate.preference_1_country}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">2nd</span>
                            <span className="text-corporate-600">{delegate.preference_2_committee} - {delegate.preference_2_country}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">3rd</span>
                            <span className="text-corporate-600">{delegate.preference_3_committee} - {delegate.preference_3_country}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingDelegate === delegate.id ? (
                          <div className="space-y-2">
                            <select
                              value={editForm.committee}
                              onChange={e => setEditForm(prev => ({ ...prev, committee: e.target.value }))}
                              className="input-field text-sm py-1"
                            >
                              <option value="">Select Committee</option>
                              {committeeNames.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select
                              value={editForm.country}
                              onChange={e => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                              className="input-field text-sm py-1"
                            >
                              <option value="">Select Country</option>
                              {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(delegate)}
                                className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : delegate.assigned_committee ? (
                          <div>
                            <div className="font-medium text-corporate-950">{delegate.assigned_country}</div>
                            <div className="text-sm text-corporate-500">{delegate.assigned_committee}</div>
                          </div>
                        ) : (
                          <span className="text-corporate-400 text-sm italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {delegate.allocation_type ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getAllocationTypeColor(delegate.allocation_type)}`}>
                            {delegate.allocation_type}
                          </span>
                        ) : (
                          <span className="text-corporate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEdit(delegate)}
                          disabled={editingDelegate === delegate.id}
                          className="p-2 hover:bg-corporate-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4 text-corporate-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDelegates.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Users className="w-12 h-12 text-corporate-300 mx-auto mb-4" />
                  <p className="text-corporate-600">No delegates found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Matrix Overview */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-corporate-950 mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-corporate-600" />
            Committee Matrix
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {committeeNames.map(committee => {
              const slots = matrixSlots.filter(s => s.committee === committee);
              const assigned = slots.filter(s => s.is_assigned).length;
              const total = slots.length;

              return (
                <div key={committee} className="rounded-lg border border-corporate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-corporate-950">{committee}</h3>
                    <span className="text-sm text-corporate-500">{assigned}/{total} filled</span>
                  </div>
                  <div className="w-full bg-corporate-100 rounded-full h-2 mb-3">
                    <div
                      className="bg-corporate-950 h-2 rounded-full transition-all"
                      style={{ width: `${total > 0 ? (assigned / total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {slots.slice(0, 8).map(slot => (
                      <span
                        key={slot.id}
                        className={`text-xs px-2 py-1 rounded ${
                          slot.is_assigned
                            ? 'bg-corporate-100 text-corporate-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                        title={slot.country}
                      >
                        {slot.country.slice(0, 3)}
                      </span>
                    ))}
                    {slots.length > 8 && (
                      <span className="text-xs px-2 py-1 text-corporate-400">
                        +{slots.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
