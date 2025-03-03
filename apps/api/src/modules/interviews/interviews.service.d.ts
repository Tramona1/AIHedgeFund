export interface Interview {
  id: string;
  video_id: string;
  video_url: string;
  title?: string;
  speaker?: string;
  timestamp: string;
  summary?: string;
  highlights?: Record<string, any>;
  transcript_url?: string;
  processed_at: string;
}

export interface InterviewsService {
  /**
   * Get recent interviews
   */
  getRecentInterviews(
    limit?: number, 
    speaker?: string | null
  ): Promise<Interview[]>;

  /**
   * Get available speakers
   */
  getSpeakers(): Promise<string[]>;
}

export const interviewsService: InterviewsService; 