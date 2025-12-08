export interface Contact {
  id: string;
  from: string;
  photo?: string;
  subject?: string;
  chat?: Message[];
}

export interface Message {
  type: 'odd' | 'even';
  msg: string;
  date: Date;
}