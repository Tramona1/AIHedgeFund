export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface UsersService {
  /**
   * Get user by ID
   */
  getUserById(id: string): Promise<User | null>;

  /**
   * Get user by email
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * Create a new user
   */
  createUser(data: { email: string; name?: string }): Promise<User>;

  /**
   * Update a user
   */
  updateUser(id: string, data: { name?: string }): Promise<User>;
}

export const usersService: UsersService; 