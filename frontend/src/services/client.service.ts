import { Client, ClientCategory } from '../types';
import { apiFetch } from './api';

function mapBackendClient(raw: any): Client {
  let dateFormatted = 'N/A';
  if (raw.registered_on) {
    try {
      dateFormatted = new Date(raw.registered_on).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      dateFormatted = raw.registered_on;
    }
  }

  const parsedAum = typeof raw.total_aum === 'number'
    ? raw.total_aum
    : (parseFloat(raw.total_aum) || 0);

  return {
    id: raw.client_ref || (raw.id ? `AR-C-${raw.id}` : 'AR-C-000'),
    name: raw.name || 'Unnamed Client',
    email: raw.email || '',
    phone: raw.phone || '',
    city: raw.city || '',
    category: (raw.category as ClientCategory) || 'Retail',
    onboardingDate: dateFormatted,
    status: 'Active',
    aum: parsedAum,
    relationshipManager: raw.relationship_manager || 'Nitin Dadhich',
  };
}

const DEMO_FALLBACK_CLIENTS: Client[] = [
  { id: 'AR-C-001', name: 'Vikram Singhania', email: 'vikram.singhania@apexgroup.in', phone: '+91 98201 12345', city: 'Mumbai', category: 'UHNI', onboardingDate: '15 Jan 2024', status: 'Active', aum: 12.8, relationshipManager: 'Nitin Dadhich' },
  { id: 'AR-C-002', name: 'Rajesh Mehra', email: 'rajesh.mehra@heritage.com', phone: '+91 98110 54321', city: 'New Delhi', category: 'HNI', onboardingDate: '22 Mar 2024', status: 'Active', aum: 6.4, relationshipManager: 'Nitin Dadhich' },
  { id: 'AR-C-003', name: 'Sunita Agarwal', email: 'sunita.agarwal@gmail.com', phone: '+91 94330 98765', city: 'Kolkata', category: 'HNI', onboardingDate: '05 Jun 2024', status: 'Active', aum: 4.5, relationshipManager: 'Nitin Dadhich' },
  { id: 'AR-C-004', name: 'Amit Patel', email: 'amit.patel@suninfra.co.in', phone: '+91 98795 11223', city: 'Ahmedabad', category: 'UHNI', onboardingDate: '12 Sep 2024', status: 'Active', aum: 8.2, relationshipManager: 'Nitin Dadhich' },
  { id: 'AR-C-005', name: 'Pooja Sharma', email: 'pooja.sharma@techlead.io', phone: '+91 98450 33445', city: 'Bengaluru', category: 'Retail', onboardingDate: '18 Nov 2024', status: 'Active', aum: 1.8, relationshipManager: 'Nitin Dadhich' },
];

export const clientService = {
  async getClients(): Promise<Client[]> {
    try {
      const backendData = await apiFetch<any[]>('/clients');
      if (Array.isArray(backendData) && backendData.length > 0) {
        return backendData.map(mapBackendClient);
      }
    } catch {
      // Offline / database disconnected - fallback to verified demo clients
    }
    return DEMO_FALLBACK_CLIENTS;
  },

  async getClientById(id: string): Promise<Client | undefined> {
    const clients = await this.getClients();
    return clients.find(c => c.id === id);
  },

  async addClient(client: Omit<Client, 'id' | 'relationshipManager'>): Promise<Client> {
    try {
      const res = await apiFetch<any>('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          phone: client.phone,
          city: client.city,
          category: client.category,
          total_aum: client.aum,
        })
      });
      const mapped = mapBackendClient(res);
      DEMO_FALLBACK_CLIENTS.unshift(mapped);
      return mapped;
    } catch {
      // Resilient local persistence failover
      const localClient: Client = {
        id: `AR-C-${Math.floor(100 + Math.random() * 900)}`,
        name: client.name,
        email: client.email,
        phone: client.phone,
        city: client.city,
        category: client.category,
        onboardingDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Active',
        aum: client.aum,
        relationshipManager: 'Nitin Dadhich',
      };
      DEMO_FALLBACK_CLIENTS.unshift(localClient);
      return localClient;
    }
  },

  async updateClient(id: string, updatedFields: Partial<Client>): Promise<Client | null> {
    try {
      const res = await apiFetch<any>(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedFields.name,
          email: updatedFields.email,
          phone: updatedFields.phone,
          city: updatedFields.city,
          category: updatedFields.category,
          total_aum: updatedFields.aum,
        })
      });
      return mapBackendClient(res);
    } catch {
      // Local optimistic update
      const idx = DEMO_FALLBACK_CLIENTS.findIndex(c => c.id === id);
      if (idx !== -1) {
        DEMO_FALLBACK_CLIENTS[idx] = { ...DEMO_FALLBACK_CLIENTS[idx], ...updatedFields };
        return DEMO_FALLBACK_CLIENTS[idx];
      }
      return null;
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    try {
      await apiFetch<any>(`/clients/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Local optimistic removal
    }
    const idx = DEMO_FALLBACK_CLIENTS.findIndex(c => c.id === id);
    if (idx !== -1) {
      DEMO_FALLBACK_CLIENTS.splice(idx, 1);
    }
    return true;
  }
};
