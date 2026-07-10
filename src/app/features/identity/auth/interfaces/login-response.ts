import { iUserResponse } from '@features/identity/user/interfaces/user-response';

export interface iLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: iUserResponse;
}
