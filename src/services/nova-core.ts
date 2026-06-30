import axios from 'axios';
import { config } from '../config.js';
import { prisma } from '../db.js';

export interface NovaMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NovaContext {
  hotel_id: string;
  language: string;
  guest_phone?: string;
}

export interface NovaTool {
  type: string;
  payload?: any;
}

export interface NovaResponse {
  text: string;
  audio_url?: string;
  actions?: NovaTool[];
}

class NovaCore {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async chat(params: {
    messages: NovaMessage[];
    context: NovaContext;
    tools: string[];
  }): Promise<NovaResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/chat`, {
        messages: params.messages,
        context: params.context,
        tools: params.tools,
      });

      return response.data as NovaResponse;
    } catch (error) {
      console.error('Error calling nova-core:', error);
      throw error;
    }
  }

  async executeReservation(conversationId: string): Promise<any> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        booking: true,
      },
    });

    if (!conversation || !conversation.booking) {
      throw new Error('No booking found for this conversation');
    }

    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: conversation.booking.id },
      data: { status: 'confirmed' },
    });

    return booking;
  }

  // Helper for generating payment link
  async generatePaymentLink(bookingId: string): Promise<string> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // This will be implemented in payment service
    return `https://payment.example.com/${bookingId}`;
  }
}

export const novaCore = new NovaCore(config.novaCore.url);
