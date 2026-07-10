export type HttpErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'rate-limit'
  | 'conflict'
  | 'bad-request'
  | 'not-found'
  | 'network'
  | 'server';
