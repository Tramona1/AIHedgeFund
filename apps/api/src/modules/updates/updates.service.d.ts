export interface Update {
  id: string;
  title: string;
  content?: string;
  timestamp: string;
  type: string;
  is_read: boolean;
  user_id?: string;
}

export interface UpdatesService {
  /**
   * Get recent updates
   */
  getRecentUpdates(
    userId?: string | null, 
    limit?: number
  ): Promise<Update[]>;

  /**
   * Mark an update as read
   */
  markAsRead(id: string): Promise<Update>;

  /**
   * Create a new update
   */
  createUpdate(data: {
    title: string;
    content?: string;
    type: string;
    user_id?: string;
  }): Promise<Update>;
}

export const updatesService: UpdatesService; 