export type Role = "USER" | "ADMIN";
export type MediaType = "AUDIO" | "VIDEO";
export type VideoJobStatus =
  | "DRAFT"
  | "QUEUED"
  | "GENERATING_SCENES"
  | "SYNTHESIZING_VOICE"
  | "RENDERING"
  | "READY"
  | "COMPLETED"
  | "PUBLISHED"
  | "FAILED";
export type VideoQuality = "auto" | "720p" | "1080p";
export type SeriesCoverGradient = "teal" | "forest" | "gold" | "deep" | "olive" | "emerald";
export type NotificationType =
  | "PAYMENT"
  | "NEW_EPISODE"
  | "SYSTEM"
  | "COMMUNITY"
  | "ANNOUNCEMENT"
  | "SUBSCRIPTION_EXPIRING";
export type TargetAudience = "ALL" | "VIP_ONLY" | "FREE_TIER_ONLY";

export type Category = {
  id: string;            // e.g. "cat-manabii"
  slug: string;          // unique URL key, lowercase kebab
  name: string;          // English
  nameSw: string;        // Kiswahili
  order: number;         // sort on viewer category rail
  image: string | null;  // HTTPS URL
  iconName?: string;
};

export type Series = {
  id: string;
  slug: string;                 // unique
  title: string;
  titleSw: string;
  description: string;
  descriptionSw: string;
  categoryId: string;           // FK Category
  coverGradient: string;        // "teal" | "forest" | "gold" | "deep" | "olive" | "emerald"
  image: string | null;
  backdropImage?: string | null;
  featured: boolean;            // home hero
  published: boolean;           // viewer only sees published
  views: number;
  likes?: number;
  likedByMe?: boolean;
  shareCount?: number;
  seasonsCount: number;
  rating?: number;
  tags?: string[];
  unlockPriceTzs?: number;
  isStoryOfWeek?: boolean;
  sponsoredPlays?: number;
  sponsorPool?: number;
  createdAt: string;            // ISO-8601
};

export type UnlockKind = "PURCHASE" | "BUNDLE" | "SPONSORED_GRANT";
export type MobileMoneyMethod = "M-Pesa" | "Tigo Pesa" | "Airtel Money";
export type PaymentMethod = MobileMoneyMethod | "Card" | "Sadaqah" | "Admin Grant";

export type SeriesUnlock = {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  seriesId: string;
  seriesTitle?: string;
  seriesTitleSw?: string;
  kind: UnlockKind;
  amountTzs: number;
  paymentMethod: string;
  referenceCode: string;
  status: "ACTIVE" | "PENDING";
  createdAt: string;
};

export type Sponsorship = {
  id: string;
  donorId?: string | null;
  donorName?: string | null;
  seriesId: string;
  seriesTitleSw?: string;
  amountTzs: number;
  paymentMethod: string;
  referenceCode: string;
  anonymous: boolean;
  targetLabel?: string | null;
  createdAt: string;
};

export type StarterBundle = {
  id: string;
  seriesCount: number;
  amountTzs: number;
  name: string;
  planNameSw: string;
};

export type MonetizeKpis = {
  weeklyActiveHint: number;
  freeUsers: number;
  unlocks: number;
  sponsorships: number;
  sponsoredPlays: number;
  sponsorPool: number;
  freeToUnlockRate: number;
  unlockToSponsorRate: number;
  revenueTzs: number;
  topConvertingSeries: [string, number][];
};

export type AnalyticsInsight = { tone: "good" | "watch" | "go"; title: string; detail: string };
export type AnalyticsDaily = {
  date: string;
  label: string;
  unlocks: number;
  sadaqah: number;
  revenueTzs: number;
  completions: number;
  newUsers: number;
};
export type AnalyticsSeriesRow = {
  id: string;
  slug: string;
  titleSw: string;
  title: string;
  views: number;
  likes: number;
  priceTzs: number;
  unlocks: number;
  revenueTzs: number;
  starters: number;
  completers: number;
  completionRate: number;
  convertHint: number;
  sponsoredPlays: number;
};
export type AnalyticsReport = {
  kpis: {
    wauHint: number;
    registered: number;
    freeUsers: number;
    buyers: number;
    starters: number;
    freeToUnlockRate: number;
    unlockToSponsorRate: number;
    unlocks: number;
    sponsoredGrants: number;
    sponsorships: number;
    revenueTzs: number;
    unlockRevenueTzs: number;
    sadaqahRevenueTzs: number;
    d7Retention: number | null;
    d30Retention: number | null;
    d7Cohort: number;
    d30Cohort: number;
    completionRate: number;
    avgStreak: number;
    events: number;
  };
  funnel: { step: string; stepSw: string; value: number }[];
  daily: AnalyticsDaily[];
  rails: { name: string; count: number; revenueTzs: number }[];
  priceBands: { band: string; unlocks: number; revenueTzs: number }[];
  series: AnalyticsSeriesRow[];
  insights: AnalyticsInsight[];
};

export type Episode = {
  id: string;
  seriesId: string;
  seasonNumber: number;         // default 1
  order: number;                // unique per (seriesId, seasonNumber)
  title: string;
  titleSw: string;
  description?: string;
  descriptionSw?: string;
  durationSec: number;
  mediaUrl: string;             // playable HTTPS URL
  mediaType: MediaType;
  posterUrl?: string | null;
  isFree: boolean;              // false = VIP locked in player
  views: number;
  likes?: number;
  likedByMe?: boolean;
  shareCount?: number;
  published: boolean;
  authorName?: string;
  authorPhone?: string;
  createdAt: string;
  fromVideoJob?: boolean;
};

export type User = {
  id: string;
  name: string;
  phone: string;                // unique, primary login
  email: string;                // unique
  password: string;             // hash in production
  role: Role;
  language: string;             // default "sw"
  avatar?: string;
  dataSaverEnabled?: boolean;
  preferredQuality?: VideoQuality;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "FREE_TIER";
  createdAt: string;
};

export type SubscriptionPlan = "WEEKLY" | "MONTHLY" | "ANNUAL" | "VIP_LIFETIME";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "PENDING" | "CANCELLED";

export type Subscription = {
  id: string;
  userId: string;
  userName: string;             // denormalized for admin tables
  userPhone: string;
  plan: SubscriptionPlan;
  planNameSw: string;
  amountTzs: number;
  paymentMethod: "M-Pesa" | "Tigo Pesa" | "Airtel Money" | "Admin Grant";
  referenceCode: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  seriesId: string;
  episodeId?: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userAvatar?: string;
  text: string;
  likes: number;
  likedByMe?: boolean;
  createdAt: string;
  hidden?: boolean;
  parentId?: string;
};

export type CommunityUpload = {
  id: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  uploaderName?: string;
  uploaderPhone?: string;
  authorName?: string;
  authorPhone?: string;
  verifiedSpeaker?: boolean;    // true if uploader.role === ADMIN
  title: string;
  titleSw: string;
  category: string;             // free-text today, NOT categoryId
  description: string;
  descriptionSw?: string;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  durationSec?: number;
  references?: string;
  likes: number;
  views?: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  moderationNotes?: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  targetUserId?: string | "ALL";
  targetPhone?: string;
  targetAudience?: TargetAudience;
  title: string;
  titleSw: string;
  message: string;
  messageSw: string;
  type: NotificationType;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
};

export type Notification = AppNotification;

export type Progress = {
  id: string;
  userId: string;
  episodeId: string;
  positionSec: number;
  completed: boolean;
  updatedAt: string;
};

export type Favorite = {
  id: string;
  userId: string;
  seriesId: string;
  createdAt: string;
};

export type Motif = "desert" | "stars" | "light" | "water" | "geometric" | "dusk";

export type Scene = {
  id: string;
  narrationSw: string;
  narrationEn: string;
  motif: Motif;
  headline?: string;
  seconds: number;
};

export type VideoJob = {
  id: string;
  seriesId: string;
  episodeId: string | null;     // set on publish
  episodeTitle?: string;
  format?: "VERTICAL_9_16" | "LANDSCAPE_16_9";
  engine?: string;
  progress?: number;
  currentStep?: string;
  status: VideoJobStatus;
  brief: string;
  titleSw: string;
  titleEn: string;
  storyboard: Scene[];
  scriptProvider: string;
  ttsProvider: string;
  voice: string;
  outputUrl: string | null;
  posterUrl: string | null;
  durationSec: number | null;
  logs: string;
  error: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  language: string;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "FREE_TIER";
  plan?: SubscriptionPlan;
  subscriptionEndDate?: string;
  subscriptionPlanNameSw?: string;
  streakDays?: number;
  badges?: string[];
};

export type SeriesCard = {
  slug: string;
  title: string;
  titleSw: string;
  description: string;
  descriptionSw: string;
  coverGradient: string;
  image: string | null;
  featured: boolean;
  episodeCount: number;
  favoriteCount: number;
  categoryName: string;
  categoryNameSw: string;
  categorySlug: string;
  views?: number;
  likes?: number;
  unlockPriceTzs?: number;
  isStoryOfWeek?: boolean;
  owned?: boolean;
  sponsoredPlays?: number;
};
