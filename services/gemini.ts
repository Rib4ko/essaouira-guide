import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { EventService } from "./mockSpreadsheet";
import { Event } from "../types";

const API_KEY = process.env.API_KEY || '';

// --- Tool Definitions ---
const searchLocalEventsTool: FunctionDeclaration = {
  name: 'searchLocalEvents',
  description: 'Search the local Essaouira community database for events. Use this for "local", "community", "database" queries or when specific local info is needed.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Keywords to search for (e.g., "music", "workshop", "yoga").'
      }
    },
    required: ['query']
  }
};

const addAttendeeTool: FunctionDeclaration = {
  name: 'addAttendee',
  description: 'Add a person to the attendee list of a specific local event in the database.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      eventName: {
        type: Type.STRING,
        description: 'The name or ID of the event.'
      },
      personName: {
        type: Type.STRING,
        description: 'The name of the person attending.'
      }
    },
    required: ['eventName', 'personName']
  }
};

export interface ChatResponse {
  text: string;
  events: Event[];
  webSources: string[];
}

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: any;

  constructor() {
    // Note: For local development without a bundler, you might need to hardcode the key here 
    // if process.env is not available in your environment.
    if (!API_KEY) {
      console.warn("Gemini API_KEY is missing. Please configure it in your environment.");
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async startChat() {
    const tools: Tool[] = [
      { functionDeclarations: [searchLocalEventsTool, addAttendeeTool] },
      { googleSearch: {} }
    ];

    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are 'Mogador Guide', a warm, local guide for Essaouira, Morocco.
        
        **Languages:**
        - You speak **French**, **Moroccan Darija**, and **English**.
        - **Rule:** Detect the user's language and reply in the SAME language.
        
        **Capabilities:**
        1. **Web Search:** For public events, weather, news.
        2. **Local DB:** For community workshops/events (use 'searchLocalEvents').
        3. **Registration:** Add users to events (use 'addAttendee').

        **Behavior:**
        - If finding local events, the system will show cards automatically. You should briefly summarize them in text.
        - Be friendly and hospitable ("Marhba").
        `,
        tools: tools,
      }
    });
  }

  async sendMessage(message: string, onToolStatusUpdate?: (status: string) => void): Promise<ChatResponse> {
    if (!this.chatSession) await this.startChat();

    // Track events found during this turn
    let foundEvents: Event[] = [];

    // Send the user message
    let response = await this.chatSession.sendMessage({ message });

    // Handle Tool Execution Loop
    while (response.functionCalls && response.functionCalls.length > 0) {
      const functionCalls = response.functionCalls;
      const responseParts = [];

      for (const call of functionCalls) {
        const { name, args, id } = call;
        let result: any;

        try {
            if (onToolStatusUpdate) onToolStatusUpdate(`Executing: ${name}...`);
            
            if (name === 'searchLocalEvents') {
                const events = await EventService.searchEvents(args.query as string);
                result = events;
                // Capture events to display in UI
                if (Array.isArray(events)) {
                  foundEvents = [...foundEvents, ...events];
                }
            } else if (name === 'addAttendee') {
                result = await EventService.addAttendee(args.eventName as string, args.personName as string);
            } else {
                result = { error: 'Unknown function' };
            }
        } catch (e: any) {
            result = { error: e.message };
        }

        responseParts.push({
          functionResponse: {
            name: name,
            response: { result: result },
            id: id
          } 
        });
      }

      // Send tool outputs back to model
      response = await this.chatSession.sendMessage({
         message: responseParts
      });
    }

    // Extract Text
    const text = response.text || "";

    // Extract Grounding (Web Sources)
    const sources: string[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) sources.push(chunk.web.uri);
      });
    }
    const uniqueSources = [...new Set(sources)];

    return {
      text,
      events: foundEvents,
      webSources: uniqueSources
    };
  }
}

export const geminiService = new GeminiService();
