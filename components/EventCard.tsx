import React from 'react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-l-4 border-teal-500 shadow-md rounded-r-lg p-4 my-2 max-w-md w-full animate-fade-in hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-slate-800">{event.name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${event.source === 'local' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
          {event.source === 'local' ? 'Spreadsheet' : 'Web'}
        </span>
      </div>
      
      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{event.description}</p>
      
      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-teal-600" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span>{event.location}</span>
        </div>
        {event.attendees && event.attendees.length > 0 && (
           <div className="flex items-center gap-2">
           <Users className="w-4 h-4 text-teal-600" />
           <span>{event.attendees.length} attending</span>
         </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;