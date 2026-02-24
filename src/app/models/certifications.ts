export interface Certification {
    id: number;
    issuer: string;
    date: Date | string;
    expiration_date?: Date | string | null;
    credential_id?: string | null;
    name: string;
    description?: string | null;
    url?: string | null;
    attachment_url?: string | null;
    application_id?: number | null;
    user_id?: number | null;
}