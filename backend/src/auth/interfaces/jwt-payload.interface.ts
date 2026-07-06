export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
