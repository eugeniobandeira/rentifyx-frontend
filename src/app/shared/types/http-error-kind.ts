export type HttpErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'rate-limit'
  | 'conflict'
  | 'bad-request'
  | 'not-found'
  | 'network'
  | 'server';
