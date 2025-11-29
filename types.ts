export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  attendees: string[];
  source: 'local' | 'web';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  timestamp: number;
  events?: Event[]; // Events found in this turn
  webSources?: string[]; // URLs from grounding
}

export enum LoadingState {
  IDLE = 'idle',
  THINKING = 'thinking',
  EXECUTING_TOOL = 'executing_tool',
}
