import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = auth();
    
    // Validate authentication - optional depending on requirements
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { query } = await request.json();
    
    // Validate request
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid query required' },
        { status: 400 }
      );
    }
    
    // Call the API service
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/ai-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, userId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      response: data.response,
      data: data.data
    });
  } catch (error: any) {
    console.error('Error processing AI query:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process query' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = auth();
    
    // Validate authentication - optional depending on requirements
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Validate parameters
    if (isNaN(limit) || isNaN(offset) || limit < 1 || limit > 100 || offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Call the API service
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/ai-query/history?userId=${userId}&limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      queries: data.queries,
      pagination: data.pagination
    });
  } catch (error: any) {
    console.error('Error retrieving query history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to retrieve query history' 
      },
      { status: 500 }
    );
  }
} 