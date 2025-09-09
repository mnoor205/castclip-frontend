import { NextRequest, NextResponse } from 'next/server';
import { prismaDB } from '@/lib/prisma';
import { getUserData } from '@/actions/user';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
) {
  try {
    // Get user authentication
    const user = await getUserData();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clipId } = await params;
    const body = await request.json();
    const { transcript, hook } = body;

    // Validate input
    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: 'Invalid transcript data' },
        { status: 400 }
      );
    }

    if (typeof hook !== 'string') {
      return NextResponse.json(
        { error: 'Invalid hook data' },
        { status: 400 }
      );
    }

    // Validate transcript structure
    const isValidTranscript = transcript.every(item =>
      typeof item === 'object' &&
      typeof item.word === 'string' &&
      typeof item.start === 'number' &&
      typeof item.end === 'number'
    );

    if (!isValidTranscript) {
      return NextResponse.json(
        { error: 'Invalid transcript format' },
        { status: 400 }
      );
    }

    // Verify clip ownership
    const existingClip = await prismaDB.clip.findFirst({
      where: {
        id: clipId,
        userId: user.id
      },
      include: {
        project: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!existingClip) {
      return NextResponse.json(
        { error: 'Clip not found or access denied' },
        { status: 404 }
      );
    }

    // Update the clip with new transcript and hook
    const updatedClip = await prismaDB.clip.update({
      where: {
        id: clipId
      },
      data: {
        transcript: transcript,
        hook: hook.trim() || null,
        updatedAt: new Date()
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      clip: {
        id: updatedClip.id,
        transcript: updatedClip.transcript,
        hook: updatedClip.hook,
        updatedAt: updatedClip.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating clip:', error);
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Clip not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
) {
  try {
    // Get user authentication
    const user = await getUserData();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clipId } = await params;

    // Get clip data
    const clip = await prismaDB.clip.findFirst({
      where: {
        id: clipId,
        userId: user.id
      },
      select: {
        id: true,
        transcript: true,
        hook: true,
        rawClipUrl: true,
        s3Key: true,
        updatedAt: true
      }
    });

    if (!clip) {
      return NextResponse.json(
        { error: 'Clip not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      clip
    });

  } catch (error) {
    console.error('Error fetching clip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

