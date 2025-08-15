export interface Draft {
  id?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  senderName?: string;
  html: string;
  attachments?: Attachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Attachment {
  filename: string;
  originalname: string;
  size?: number;
  mimetype?: string;
}
