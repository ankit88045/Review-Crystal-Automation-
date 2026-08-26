export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface Review {
  name: string;
  reviewId: string;
  reviewer: { 
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'FIVE' | 'FOUR' | 'THREE' | 'TWO' | 'ONE' | string;
  comment: string;
  createTime: string;
  sentiment?: SentimentType;
  detectedService?: string;
  reviewReply?: { 
    comment: string; 
    updateTime: string;
  };
  draftReply?: string;
  locationId?: string;
}

export interface Location {
  id: string;
  name: string;
  reviewLink: string;
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface PlaceholderConfig {
  salonName: string;
  serviceName: string;
  ownerName: string;
  contactInfo: string;
}

export interface AISettings {
  autoMonitor: boolean;
  autoDraft: boolean;
  autoPublishPositive: boolean;
  syncInterval: number; // in seconds
  responseTone: 'hinglish' | 'english' | 'concierge' | 'brief';
  positiveDirective: string;
  neutralDirective: string;
  negativeDirective: string;
  placeholders: PlaceholderConfig;
}
