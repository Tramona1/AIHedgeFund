import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini-service';

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await geminiService.sendMessage(message, context);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 