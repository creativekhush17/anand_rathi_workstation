import React, { useEffect, useState } from 'react';
import { Search, UserPlus, Filter, Landmark, Mail, Phone, MapPin, Calendar, ArrowRight, X, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { clientService } from '../../services/client.service';
import { Client } from '../../types';

interface ClientsViewProps {
  onSelectClient: (clientId: string) => void;
  searchQuery?: string;
  userRole?: string;
}

export default function ClientsView({ onSelectClient, searchQuery = '', userRole }: ClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('aum-desc');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Add Client Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCity, setNewClientCity] = useState('Mumbai');
  const [newClientAum, setNewClientAum] = useState('1.5');
  const [newClientCategory, setNewClientCategory] = useState<'HNI' | 'UHNI' | 'Retail'>('HNI');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Edit Client Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('Mumbai');
  const [editAum, setEditAum] = useState('1.5');
  const [editCategory, setEditCategory] = useState<'HNI' | 'UHNI' | 'Retail'>('HNI');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Delete Client Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  // Role Permissions
  const allowedWriteRoles = ['Super Admin', 'Branch Head', 'Relationship Manager'];
  const canCreateClient = allowedWriteRoles.includes(userRole || '');
  const canEditClient = allowedWriteRoles.includes(userRole || '');
  const canDeleteClient = allowedWriteRoles.includes(userRole || '');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [clients, selectedCategory, selectedCity, sortBy, localSearch]);

  const fetchClients = async () => {
    const data = await clientService.getClients();
    setClients(data);
  };

  const applyFilters = () => {
    let result = [...clients];

    // Search filter
    if (localSearch.trim() !== '') {
      const q = localSearch.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) || 
        c.city.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // City filter
    if (selectedCity !== 'All') {
      result = result.filter(c => c.city === selectedCity);
    }

    // Sorting
    if (sortBy === 'aum-desc') {
      result.sort((a, b) => b.aum - a.aum);
    } else if (sortBy === 'aum-asc') {
      result.sort((a, b) => a.aum - b.aum);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.onboardingDate).getTime() - new Date(a.onboardingDate).getTime());
    }

    setFilteredClients(result);
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    try {
      await clientService.addClient({
        name: newClientName,
        city: newClientCity,
        aum: parseFloat(newClientAum) || 0,
        category: newClientCategory,
        email: newClientEmail,
        phone: newClientPhone || '+91 99999 88888',
        status: 'Active',
        onboardingDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      });

      // Reset Form
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientAum('1.5');
      setShowAddModal(false);

      // Refresh client list
      await fetchClients();
    } catch (err: any) {
      console.warn('Fallback client registration:', err);
      setShowAddModal(false);
      await fetchClients();
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditCity(client.city);
    setEditAum(client.aum.toString());
    setEditCategory(client.category);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setShowEditModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editName || !editEmail) return;

    try {
      await clientService.updateClient(editingClient.id, {
        name: editName,
        city: editCity,
        aum: parseFloat(editAum) || 0,
        category: editCategory,
        email: editEmail,
        phone: editPhone
      });

      setShowEditModal(false);
      setEditingClient(null);
      await fetchClients();
    } catch (err: any) {
      alert(`Error updating client: ${err.message || 'Server error'}`);
    }
  };

  const openDeleteModal = (client: Client) => {
    setDeletingClient(client);
    setShowDeleteModal(true);
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;

    try {
      await clientService.deleteClient(deletingClient.id);
      setShowDeleteModal(false);
      setDeletingClient(null);
      await fetchClients();
    } catch (err: any) {
      alert(`Error deleting client: ${err.message || 'Server error'}`);
    }
  };

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(clients.map(c => c.city)));

  return (
    <div className="space-y-6">
      {/* Title Bar & Search actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card-bg border border-brand-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-lg">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider">Client Directory</h2>
            <p className="text-[10px] text-brand-text-muted mt-0.5">Manage and monitor {clients.length} private wealth relationships.</p>
          </div>
        </div>

        {canCreateClient && (
          <button 
            id="btn-register-new-client"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors self-end sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Client</span>
          </button>
        )}
      </div>

      {/* Filter and sorting bar */}
      <div className="bg-brand-card-bg border border-brand-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Left side: local search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-brand-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search directory..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-primary-bg border border-brand-border rounded-lg focus:outline-none focus:border-brand-gold text-brand-text font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-brand-text-muted uppercase font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-brand-gold" /> Filter
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold border border-brand-border rounded-lg bg-brand-primary-bg px-2 py-1.5 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="UHNI">UHNI (₹5+ Cr)</option>
              <option value="HNI">HNI (₹1 - 5 Cr)</option>
              <option value="Retail">Retail (&lt; ₹1 Cr)</option>
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-xs font-semibold border border-brand-border rounded-lg bg-brand-primary-bg px-2 py-1.5 focus:outline-none"
            >
              <option value="All">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Sorting */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-brand-border/60">
          <span className="text-[10px] text-brand-text-muted uppercase font-bold">Sort By</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold border border-brand-border rounded-lg bg-brand-primary-bg px-2.5 py-1.5 focus:outline-none focus:border-brand-gold"
          >
            <option value="aum-desc">AUM: High to Low</option>
            <option value="aum-asc">AUM: Low to High</option>
            <option value="name-asc">Alphabetical: A to Z</option>
            <option value="date-desc">Onboarding: Newest First</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              id={`client-card-${client.id}`}
              className="bg-brand-card-bg border border-brand-border hover:border-brand-gold/60 hover:shadow-md transition-all rounded-xl p-5 flex flex-col justify-between"
            >
              {/* Card top */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold font-bold text-sm flex items-center justify-center uppercase shadow-inner border border-brand-gold/20">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                        {client.name}
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                          client.category === 'UHNI' 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : client.category === 'HNI' 
                              ? 'bg-[#B68A2F]/10 text-brand-gold border border-brand-gold/20' 
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {client.category}
                        </span>
                      </h3>
                      <p className="text-[10px] text-brand-text-muted mt-0.5">Client Ref: {client.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canEditClient && (
                      <button
                        id={`btn-edit-client-${client.id}`}
                        onClick={() => openEditModal(client)}
                        title="Edit Client"
                        className="p-1.5 text-brand-text-muted hover:text-brand-gold hover:bg-brand-gold/10 rounded-md transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDeleteClient && (
                      <button
                        id={`btn-delete-client-${client.id}`}
                        onClick={() => openDeleteModal(client)}
                        title="Delete Client"
                        className="p-1.5 text-brand-text-muted hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-[9px] font-bold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded-full border border-brand-success/20">
                      Active
                    </span>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-brand-border/40 my-4"></div>

                {/* Info lines */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-[11px] text-brand-text-muted">
                    <Mail className="w-3.5 h-3.5 text-brand-gold/70" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-brand-text-muted">
                    <Phone className="w-3.5 h-3.5 text-brand-gold/70" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-brand-text-muted">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold/70" />
                    <span>{client.city}, India</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-brand-text-muted">
                    <Calendar className="w-3.5 h-3.5 text-brand-gold/70" />
                    <span>Registered: {client.onboardingDate}</span>
                  </div>
                </div>
              </div>

              {/* Card bottom */}
              <div className="mt-5 pt-3 border-t border-brand-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-brand-text-muted uppercase tracking-wider font-semibold">Total AUM</span>
                  <p className="text-sm font-display font-black text-brand-gold">₹ {client.aum} Cr</p>
                </div>

                <button
                  id={`btn-view-portfolio-${client.id}`}
                  onClick={() => onSelectClient(client.id)}
                  className="flex items-center gap-1 text-xs font-bold text-brand-gold hover:text-brand-gold-accent group transition-all"
                >
                  <span>Portfolio Review</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-brand-card-bg border border-brand-border rounded-xl p-16 text-center shadow-sm">
          <p className="text-xs font-bold text-brand-text-muted">No clients matched the current query or filter selections.</p>
          <button 
            onClick={() => { setSelectedCategory('All'); setSelectedCity('All'); setLocalSearch(''); }}
            className="text-xs font-bold text-brand-gold mt-3 underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Modal - Register Client */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <form onSubmit={handleRegisterClient} className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-gold" /> Add Wealth Client Record
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-brand-text-muted hover:text-brand-gold">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-left">
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Full Name *</label>
                <input 
                  type="text" required value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">City</label>
                  <select 
                    value={newClientCity} onChange={(e) => setNewClientCity(e.target.value)}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Jaipur">Jaipur</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Category</label>
                  <select 
                    value={newClientCategory} onChange={(e) => setNewClientCategory(e.target.value as any)}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                  >
                    <option value="HNI">HNI (₹1 - 5 Cr)</option>
                    <option value="UHNI">UHNI (₹5+ Cr)</option>
                    <option value="Retail">Retail (&lt; ₹1 Cr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">AUM Estimate (₹ Crores) *</label>
                <input 
                  type="number" step="0.01" required value={newClientAum} onChange={(e) => setNewClientAum(e.target.value)}
                  placeholder="e.g. 2.50"
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Email Address *</label>
                <input 
                  type="email" required value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="e.g. rahul@sharmagroup.com"
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Contact Number</label>
                <input 
                  type="text" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="e.g. +91 98200 XXXXX"
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-brand-border flex gap-3">
              <button 
                type="button" onClick={() => setShowAddModal(false)}
                className="flex-1 bg-brand-secondary-bg hover:bg-brand-border/40 text-brand-text-muted font-bold py-2 rounded-lg text-xs transition-colors border border-brand-border"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Create Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal - Edit Client */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <form onSubmit={handleUpdateClient} className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
                <Edit className="w-4 h-4 text-brand-gold" /> Edit Client Record ({editingClient.id})
              </h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-brand-text-muted hover:text-brand-gold">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-left">
              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Full Name *</label>
                <input 
                  type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">City</label>
                  <select 
                    value={editCity} onChange={(e) => setEditCity(e.target.value)}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Jaipur">Jaipur</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-brand-text-muted uppercase font-bold">Category</label>
                  <select 
                    value={editCategory} onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                  >
                    <option value="HNI">HNI (₹1 - 5 Cr)</option>
                    <option value="UHNI">UHNI (₹5+ Cr)</option>
                    <option value="Retail">Retail (&lt; ₹1 Cr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">AUM Estimate (₹ Crores) *</label>
                <input 
                  type="number" step="0.01" required value={editAum} onChange={(e) => setEditAum(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Email Address *</label>
                <input 
                  type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="text-[10px] text-brand-text-muted uppercase font-bold">Contact Number</label>
                <input 
                  type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs bg-brand-primary-bg border border-brand-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-brand-border flex gap-3">
              <button 
                type="button" onClick={() => setShowEditModal(false)}
                className="flex-1 bg-brand-secondary-bg hover:bg-brand-border/40 text-brand-text-muted font-bold py-2 rounded-lg text-xs transition-colors border border-brand-border"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-brand-gold hover:bg-brand-gold-accent text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal - Delete Confirmation */}
      {showDeleteModal && deletingClient && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-brand-card-bg border border-brand-border rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-up text-left">
            <div className="flex items-center gap-3 text-red-600 border-b border-brand-border pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Confirm Delete Record</h3>
            </div>
            
            <p className="text-xs text-brand-text mt-4 leading-relaxed">
              Are you sure you want to permanently delete client record <strong className="text-brand-gold">{deletingClient.name}</strong> ({deletingClient.id})?
            </p>
            <p className="text-[10px] text-brand-text-muted mt-1 font-mono">
              This action will remove the record from persistent database storage.
            </p>

            <div className="mt-6 pt-3 border-t border-brand-border flex gap-3">
              <button 
                type="button" onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-brand-secondary-bg hover:bg-brand-border/40 text-brand-text-muted font-bold py-2 rounded-lg text-xs transition-colors border border-brand-border"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteClient}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
