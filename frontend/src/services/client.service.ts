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

export const clientService = {
  async getClients(): Promise<Client[]> {
    try {
      const backendData = await apiFetch<any[]>('/clients');
      if (Array.isArray(backendData)) {
        return backendData.map(mapBackendClient);
      }
    } catch {
      // Offline / database disconnected
    }
    return [];
  },

  async getClientById(id: string): Promise<Client | undefined> {
    const clients = await this.getClients();
    return clients.find(c => c.id === id);
  },

  async addClient(client: Omit<Client, 'id' | 'relationshipManager'>): Promise<Client> {
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
    return mapBackendClient(res);
  },

  async updateClient(id: string, updatedFields: Partial<Client>): Promise<Client | null> {
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
  },

  async deleteClient(id: string): Promise<boolean> {
    await apiFetch(`/clients/${id}`, {
      method: 'DELETE'
    });
    return true;
  }
};
