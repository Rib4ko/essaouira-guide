import { Event } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Configuration ---
const SUPABASE_URL = 'https://anwnqsrwoymlyrbfnbeo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFud25xc3J3b3ltbHlyYmZuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDE5NDYsImV4cCI6MjA3OTgxNzk0Nn0.zG53ZJa3dUrd-Wa0wTrE64x_3UW1w380D-U2izksmzg';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[EventService] Connected to Supabase');
  } catch (err) {
    console.warn('[EventService] Failed to initialize Supabase, using mock data.', err);
  }
}

// --- Mock Data Fallback ---
const LOCAL_EVENTS_DB: Event[] = [
  {
    id: 'evt_001',
    name: 'Gnaoua Music Workshop',
    date: '2023-11-15',
    location: 'Dar Souiri',
    description: 'An introductory workshop to Gnaoua rhythms. Contact: info@dar-souiri.ma | Price: 200.00 MAD',
    attendees: [],
    source: 'local'
  }
];

export class EventService {
  /**
   * Search for events in Supabase (EVENEMENT table) or Local Mock.
   */
  static async searchEvents(query: string): Promise<Event[]> {
    console.log(`[EventService] Searching for: ${query}`);
    
    // 1. Try Supabase
    if (supabase) {
      try {
        // We assume standard SQL behavior where unquoted names are lowercased: 
        // EVENEMENT -> evenement, NAME -> name, etc.
        const { data, error } = await supabase
          .from('evenement')
          .select('*')
          .ilike('name', `%${query}%`);
        
        if (error) {
            console.error('[EventService] Supabase search error:', error);
            throw error;
        }
        
        return (data || []).map((row: any) => ({
          id: row.id.toString(),
          name: row.name,
          date: row.date ? new Date(row.date).toLocaleDateString() : 'TBA',
          location: 'Essaouira', 
          description: `Contact: ${row.contact || 'N/A'} | Price: ${row.price ? row.price + ' MAD' : 'Free'}`,
          attendees: [], 
          source: 'local'
        }));
      } catch (err) {
        console.error('[EventService] Supabase search failed, falling back to mock.', err);
      }
    }

    // 2. Fallback to Mock
    await new Promise(resolve => setTimeout(resolve, 800));
    const lowerQuery = query.toLowerCase();
    return LOCAL_EVENTS_DB.filter(evt => 
      evt.name.toLowerCase().includes(lowerQuery) || 
      evt.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Add an attendee to an event.
   * Handles: evenement -> participant -> event_participant
   */
  static async addAttendee(eventNameOrId: string, attendeeName: string): Promise<string> {
    console.log(`[EventService] Adding ${attendeeName} to ${eventNameOrId}`);
    
    // 1. Try Supabase
    if (supabase) {
      try {
        // A. Find the Event
        const { data: events, error: searchError } = await supabase
          .from('evenement')
          .select('*')
          .ilike('name', `%${eventNameOrId}%`)
          .limit(1);

        if (searchError || !events || events.length === 0) {
          throw new Error(`Event "${eventNameOrId}" not found in database.`);
        }
        const event = events[0];

        // B. Create/Prepare Participant
        // Split name into First/Last
        const nameParts = attendeeName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        // Generate a random ID (INT) within PostgreSQL integer range
        const participantId = Math.floor(Math.random() * 2147483647); 

        // Insert into PARTICIPANT table
        // Note: matching schema columns: id, firstName, LastName, payed (mixed case in SQL creates lowercase in Postgres unless quoted)
        // We will try lowercase first as per standard.
        const { error: participantError } = await supabase
          .from('participant')
          .insert([
            { 
              id: participantId,
              firstname: firstName, 
              lastname: lastName,
              payed: false 
            }
          ]);
        
        if (participantError) throw new Error(`Failed to create participant: ${participantError.message}`);

        // C. Link in Junction Table (EVENT_PARTICIPANT)
        const { error: linkError } = await supabase
          .from('event_participant')
          .insert([
            {
              event_id: event.id,
              participant_id: participantId
            }
          ]);

        if (linkError) throw new Error(`Failed to link participant to event: ${linkError.message}`);

        return `Successfully registered ${firstName} ${lastName} for "${event.name}" (Database Updated).`;

      } catch (err: any) {
         console.error('[EventService] Supabase update failed:', err);
         return `Error updating database: ${err.message}`;
      }
    }

    // 2. Fallback to Mock
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `[Mock] Added ${attendeeName} to ${eventNameOrId}. (Supabase not active)`;
  }
}