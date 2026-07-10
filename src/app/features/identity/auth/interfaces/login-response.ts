import { UserResponse } from '@features/identity/user/interfaces/user-response';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}
