export type UserRole = 'buyer' | 'seller';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  profilePicture?: string;
  createdAt: Date;
}

export interface AuctionBid {
  id: string;
  bidderId: string;
  amount: number;
  createdAt: Date;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startingPrice: number;
  currentPrice: number;
  sellerId: string;
  bids: AuctionBid[];
  endsAt: Date;
  createdAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}
