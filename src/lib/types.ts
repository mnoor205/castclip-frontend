export interface UserObject {
  id: string
  email: string
  image?: string | null | undefined
  credits: number
}

export interface AuthUserObject {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
  stripeCustomerId?: string | null | undefined
}