export interface JwtUser {
  sub: number;
  email: string;
  role: string;
  accessGranted: boolean;
}