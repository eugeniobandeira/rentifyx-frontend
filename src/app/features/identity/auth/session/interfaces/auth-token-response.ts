import { iUserResponse } from '@features/identity/user/interfaces/user-response';

export interface iAuthTokenResponse {
  accessToken: string;
  user: iUserResponse;
}
