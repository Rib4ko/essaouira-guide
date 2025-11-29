import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { EventService } from "./mockSpreadsheet"; // We are reusing the file location but with the new class

const API_KEY = process.env.API_KEY || '';

// Define the tools
const searchLocalEventsTool: FunctionDeclaration = {
  name: 'searchLocalEvents',
  description: 'Search the local Essaouira community spreadsheet/database for events. Use this when the user asks for "community", "local", or "spreadsheet" events, or if web search fails.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Keywords to search for in the event database (e.g., "yoga", "music", "workshop").'
      }
    },
    required: ['query']
  }
};

const addAttendeeTool: FunctionDeclaration = {
  name: 'addAttendee',
  description: 'Add a person to the attendee list of a specific local event in the spreadsheet/database.',
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

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: any;

  constructor() {
    if (!API_KEY) {
      console.error("API_KEY is missing");
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async startChat() {
    const tools: Tool[] = [
      { functionDeclarations: [searchLocalEventsTool, addAttendeeTool] },
      { googleSearch: {} } // Enable Google Search grounding
    ];

    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are 'Mogador Guide', a warm and knowledgeable local guide for Essaouira, Morocco.
        
        **Language Capabilities:**
        - You speak **French**, **Moroccan Darija**, and **English** fluently.
        - **IMPORTANT:** Always detect the language of the user's last message and respond in the SAME language.
        - If the user speaks Darija, reply in Darija (using Latin script 'Arabizi' or Arabic script as appropriate, but Latin is preferred for casual chat unless they use Arabic script).
        
        Your capabilities:
        1. Search the web for public events (concerts, festivals, weather) using Google Search.
        2. Access a private 'local database' for community workshops and small gatherings using the 'searchLocalEvents' tool.
        3. Register users for local events using the 'addAttendee' tool (you must have the user's name and event name).

        Protocol:
        - When asked for events, first try to answer with general knowledge or Google Search.
        - If the user specifically mentions "local", "community", "database" (or French/Darija equivalents like "jdwel", "base de données") or if web results are sparse, check the local database using 'searchLocalEvents'.
        - If you find local events, mention their Price and Contact info if available.
        - If a user wants to join a local event, ask for their name (if not known) and use 'addAttendee'.
        - Be polite, use Moroccan hospitality phrasing (e.g., "Marhba", "Allah ybarek fik") appropriate to the language context.
        - Always format dates clearly.
        `,
        tools: tools,
      }
    });
  }

  async sendMessage(message: string, onToolStatusUpdate?: (status: string) => void) {
    if (!this.chatSession) await this.startChat();

    // Send the user message
    let response = await this.chatSession.sendMessage({ message });

    // Handle Function Calling Loop
    // The model might decide to call a tool. We need to execute it and send the result back.
    while (response.functionCalls && response.functionCalls.length > 0) {
      const functionCalls = response.functionCalls;
      const responseParts = [];

      for (const call of functionCalls) {
        const { name, args, id } = call;
        let result: any;

        try {
            if (onToolStatusUpdate) onToolStatusUpdate(`Checking ${name}...`);
            
            if (name === 'searchLocalEvents') {
                result = await EventService.searchEvents(args.query as string);
            } else if (name === 'addAttendee') {
                result = await EventService.addAttendee(args.eventName as string, args.personName as string);
            } else {
                result = { error: 'Unknown function' };
            }
        } catch (e: any) {
            result = { error: e.message };
        }

        // Construct the function response part
        responseParts.push({
          functionResponse: {
            name: name,
            response: { result: result },
            id: id // Include the ID to ensure the model matches response to call
          } 
        });
      }

      // Send the tool results back to the model
      // We must use 'message' property with the array of parts
      response = await this.chatSession.sendMessage({
         message: responseParts
      });
    }

    return response;
  }
}

export const geminiService = new GeminiService();