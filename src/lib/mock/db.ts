import { api, getToken, mediaUrl, uploadForm } from "../api/client";
import type {
  AppNotification,
  Category,
  Comment,
  CommunityUpload,
  Episode,
  Favorite,
  Progress,
  Role,
  Series,
  SeriesCard,
  SessionUser,
  AnalyticsReport,
  MonetizeKpis,
  Sponsorship,
  StarterBundle,
  SeriesUnlock,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  User,
  VideoJob,
} from "./types";

export type {
  Category,
  Series,
  Episode,
  Comment,
  User,
  Subscription,
  Role,
  SeriesCard,
  VideoJob,
  Progress,
  Favorite,
};

export type Store = {
  categories: Category[];
  series: Series[];
  episodes: Episode[];
  users: User[];
  subscriptions: Subscription[];
  comments: Comment[];
  communityUploads: CommunityUpload[];
  notifications: AppNotification[];
  progress: Progress[];
  favorites: Favorite[];
  videoJobs: VideoJob[];
  plans: Array<{ id: SubscriptionPlan; days: number; amountTzs: number; planNameSw: string; name: string }>;
  unlocks: SeriesUnlock[];
  allUnlocks: SeriesUnlock[];
  sponsorships: Sponsorship[];
  storyOfWeekId: string | null;
  starterBundle: StarterBundle | null;
  monetizeKpis: MonetizeKpis | null;
  analytics: AnalyticsReport | null;
  allProgress: Progress[];
};

export const DB_STORE_KEY = "qisas_api_store";

function nid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyStore(): Store {
  return {
    categories: [],
    series: [],
    episodes: [],
    users: [],
    subscriptions: [],
    comments: [],
    communityUploads: [],
    notifications: [],
    progress: [],
    favorites: [],
    videoJobs: [],
    plans: [],
    unlocks: [],
    allUnlocks: [],
    sponsorships: [],
    storyOfWeekId: null,
    starterBundle: null,
    monetizeKpis: null,
    analytics: null,
    allProgress: [],
  };
}

let store: Store = emptyStore();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function fire(path: string, init?: RequestInit) {
  void api(path, init).catch((err) => {
    console.warn("API mutation failed", path, err);
  });
}

export function subscribeDb(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function hydrate() {
  const data = await api<any>("/api/bootstrap");
  store.categories = (data.categories || []).map((c: Category) => ({
    ...c,
    image: c.image ? mediaUrl(c.image) : c.image,
  }));
  store.series = (data.series || []).map((s: Series) => ({
    ...s,
    image: s.image ? mediaUrl(s.image) : s.image,
    backdropImage: s.backdropImage ? mediaUrl(s.backdropImage) : s.backdropImage,
  }));
  store.episodes = (data.episodes || []).map((e: Episode) => ({
    ...e,
    mediaUrl: e.mediaUrl ? mediaUrl(e.mediaUrl) : e.mediaUrl,
    posterUrl: e.posterUrl ? mediaUrl(e.posterUrl) : e.posterUrl,
  }));
  if (Array.isArray(data.comments)) {
    store.comments = data.comments;
  }
  store.plans = data.plans || [];
  store.favorites = data.favorites || [];
  store.progress = data.progress || [];
  store.communityUploads = data.communityUploads || [];
  store.videoJobs = data.videoJobs || [];
  store.notifications = data.allNotifications || data.notifications || [];
  store.subscriptions = data.subscriptions || data.mySubscriptions || [];
  store.users = data.users || [];
  store.unlocks = data.unlocks || [];
  if (Array.isArray(data.allUnlocks)) {
    store.allUnlocks = data.allUnlocks;
  } else {
    const byId = new Map(store.allUnlocks.map((u) => [u.id, u]));
    for (const u of store.unlocks) byId.set(u.id, u);
    store.allUnlocks = Array.from(byId.values());
  }
  if (Array.isArray(data.sponsorships)) {
    store.sponsorships = data.sponsorships;
  }
  if (data.monetizeKpis) {
    store.monetizeKpis = data.monetizeKpis;
  }
  if (data.analytics) {
    store.analytics = data.analytics;
  }
  if (Array.isArray(data.allProgress)) {
    store.allProgress = data.allProgress;
  }
  store.storyOfWeekId = data.storyOfWeekId || null;
  store.starterBundle = data.starterBundle || store.starterBundle || {
    id: "STARTER_BUNDLE",
    seriesCount: 3,
    amountTzs: 2000,
    name: "Starter bundle",
    planNameSw: "Kifurushi cha kuanza — 3 hadithi kwa bei ya 2",
  };
  if (data.me && !store.users.some((u) => u.id === data.me.id)) {
    store.users.push({
      id: data.me.id,
      name: data.me.name,
      phone: data.me.phone || "",
      email: data.me.email,
      password: "",
      role: data.me.role,
      language: data.me.language,
      subscriptionStatus: data.me.subscriptionStatus,
      createdAt: nowIso(),
    });
  }
  notify();
  return store;
}

export async function initDb() {
  try {
    await hydrate();
  } catch (err) {
    console.warn("API bootstrap failed, UI will retry after login", err);
    store = emptyStore();
    notify();
  }
}

export async function resetStoreToSeed() {
  await api("/api/system/reset", { method: "POST" });
  await hydrate();
  return store;
}

function categoryOf(s: Series) {
  return store.categories.find((c) => c.id === s.categoryId) || store.categories[0];
}

export function toSeriesCard(s: Series): SeriesCard {
  const category = categoryOf(s);
  return {
    slug: s.slug,
    title: s.title,
    titleSw: s.titleSw,
    description: s.description,
    descriptionSw: s.descriptionSw,
    coverGradient: s.coverGradient,
    image: s.image || category?.image || null,
    featured: s.featured,
    episodeCount: store.episodes.filter((e) => e.seriesId === s.id).length,
    favoriteCount: store.favorites.filter((f) => f.seriesId === s.id).length,
    categoryName: category?.name ?? "General",
    categoryNameSw: category?.nameSw ?? "Jumla",
    categorySlug: category?.slug ?? "general",
    views: s.views,
    likes: s.likes,
    unlockPriceTzs: s.unlockPriceTzs,
    isStoryOfWeek: Boolean(store.storyOfWeekId && s.id === store.storyOfWeekId),
    owned: store.unlocks.some((u) => u.seriesId === s.id && u.status === "ACTIVE"),
    sponsoredPlays: s.sponsoredPlays,
  };
}

export function normalizePhone(raw: string): string {
  const clean = raw.trim();
  const digits = clean.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+255${digits.slice(1)}`;
  if (digits.length === 9) return `+255${digits}`;
  if (clean.startsWith("+")) return clean;
  return clean;
}

export function matchPhone(storedPhone?: string, queryPhone?: string): boolean {
  if (!storedPhone || !queryPhone) return false;
  const sDigits = storedPhone.replace(/\D/g, "");
  const qDigits = queryPhone.replace(/\D/g, "");
  if (!sDigits || !qDigits) return false;
  if (sDigits === qDigits) return true;
  if (sDigits.length >= 9 && qDigits.length >= 9) return sDigits.slice(-9) === qDigits.slice(-9);
  return false;
}

export const db = {
  get store() {
    return store;
  },

  categories: {
    findMany() {
      return [...store.categories].sort((a, b) => a.order - b.order || a.nameSw.localeCompare(b.nameSw));
    },
    findById(id: string) {
      return store.categories.find((c) => c.id === id) ?? null;
    },
    findBySlug(slug: string) {
      return store.categories.find((c) => c.slug === slug) ?? null;
    },
    count() {
      return store.categories.length;
    },
    create(data: Omit<Category, "id">) {
      const row: Category = { ...data, id: nid("cat") };
      store.categories.push(row);
      notify();
      fire("/api/categories", { method: "POST", body: JSON.stringify(row) });
      return row;
    },
    updateBySlug(slug: string, data: Partial<Category>) {
      const row = store.categories.find((c) => c.slug === slug);
      if (row) {
        Object.assign(row, data);
        notify();
        fire(`/api/categories/${row.id}`, { method: "PATCH", body: JSON.stringify(data) });
      }
      return row ?? null;
    },
    delete(id: string) {
      const idx = store.categories.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      const [deleted] = store.categories.splice(idx, 1);
      notify();
      fire(`/api/categories/${id}`, { method: "DELETE" });
      return deleted;
    },
    seriesCount(id: string) {
      return store.series.filter((s) => s.categoryId === id && s.published).length;
    },
  },

  series: {
    findMany(opts?: {
      published?: boolean;
      categorySlug?: string;
      featured?: boolean;
      q?: string;
      tab?: string;
      take?: number;
    }) {
      let rows = [...store.series];
      if (opts?.published) rows = rows.filter((s) => s.published);
      if (opts?.categorySlug) {
        const cat = store.categories.find((c) => c.slug === opts.categorySlug);
        rows = cat ? rows.filter((s) => s.categoryId === cat.id) : [];
      }
      if (opts?.featured) rows = rows.filter((s) => s.featured);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.titleSw.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.descriptionSw.toLowerCase().includes(q),
        );
      }
      if (opts?.tab === "new") {
        rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      } else {
        rows.sort((a, b) => {
          const fav = (id: string) => store.favorites.filter((f) => f.seriesId === id).length;
          return fav(b.id) - fav(a.id) || Number(b.featured) - Number(a.featured) || +new Date(b.createdAt) - +new Date(a.createdAt);
        });
      }
      if (opts?.take) rows = rows.slice(0, opts.take);
      return rows;
    },
    findById(id: string) {
      return store.series.find((s) => s.id === id) ?? null;
    },
    findBySlug(slug: string) {
      return store.series.find((s) => s.slug === slug) ?? null;
    },
    create(
      data: Omit<Series, "id" | "createdAt" | "views" | "seasonsCount"> &
        Partial<Pick<Series, "views" | "seasonsCount" | "createdAt">>
    ) {
      const row: Series = {
        ...data,
        id: nid("ser"),
        views: data.views ?? 0,
        likes: data.likes ?? 0,
        seasonsCount: data.seasonsCount ?? 1,
        createdAt: data.createdAt ?? nowIso(),
      };
      store.series.push(row);
      notify();
      fire("/api/series", { method: "POST", body: JSON.stringify(row) });
      return row;
    },
    updateBySlug(slug: string, data: Partial<Series>) {
      const row = store.series.find((s) => s.slug === slug);
      if (row) {
        Object.assign(row, data);
        notify();
        fire(`/api/series/${row.id}`, { method: "PATCH", body: JSON.stringify(data) });
      }
      return row ?? null;
    },
    toggleFeatured(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (row) {
        row.featured = !row.featured;
        notify();
        fire(`/api/series/${id}/toggle-featured`, { method: "POST" });
        return row.featured;
      }
      return false;
    },
    togglePublished(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (row) {
        row.published = !row.published;
        notify();
        fire(`/api/series/${id}/toggle-published`, { method: "POST" });
        return row.published;
      }
      return false;
    },
    incrementViews(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (row) {
        row.views = (row.views || 0) + 1;
        notify();
        fire(`/api/series/${id}/view`, { method: "POST" });
      }
    },
    delete(id: string) {
      const idx = store.series.findIndex((s) => s.id === id);
      if (idx < 0) return null;
      const [deleted] = store.series.splice(idx, 1);
      const epIds = store.episodes.filter((e) => e.seriesId === id).map((e) => e.id);
      store.episodes = store.episodes.filter((e) => e.seriesId !== id);
      store.progress = store.progress.filter((p) => !epIds.includes(p.episodeId));
      store.favorites = store.favorites.filter((f) => f.seriesId !== id);
      store.comments = store.comments.filter((c) => c.seriesId !== id);
      store.videoJobs = store.videoJobs.filter((j) => j.seriesId !== id);
      notify();
      fire(`/api/series/${id}`, { method: "DELETE" });
      return deleted;
    },
    async toggleLike(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (!row) return { likes: 0, liked: false };
      const prevLikes = row.likes || 0;
      const prevLiked = !!row.likedByMe;
      const liked = !prevLiked;
      row.likedByMe = liked;
      row.likes = Math.max(0, prevLikes + (liked ? 1 : -1));
      notify();
      if (!getToken()) return { likes: row.likes, liked };
      try {
        const res = await api<{ liked: boolean; likes: number }>(`/api/series/${id}/like`, { method: "POST" });
        row.likes = res.likes ?? row.likes;
        row.likedByMe = res.liked ?? liked;
        notify();
        return { likes: row.likes, liked: !!row.likedByMe };
      } catch (err) {
        row.likes = prevLikes;
        row.likedByMe = prevLiked;
        notify();
        throw err;
      }
    },
    episodeCount(id: string) {
      return store.episodes.filter((e) => e.seriesId === id).length;
    },
  },

  episodes: {
    findMany(opts?: { seriesId?: string; isFree?: boolean; q?: string }) {
      let rows = [...store.episodes];
      if (opts?.seriesId) rows = rows.filter((e) => e.seriesId === opts.seriesId);
      if (typeof opts?.isFree === "boolean") rows = rows.filter((e) => e.isFree === opts.isFree);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.titleSw.toLowerCase().includes(q) ||
            (e.authorName && e.authorName.toLowerCase().includes(q)),
        );
      }
      return rows.sort((a, b) => a.order - b.order);
    },
    findById(id: string) {
      return store.episodes.find((e) => e.id === id) ?? null;
    },
    findBySeries(seriesId: string) {
      return store.episodes.filter((e) => e.seriesId === seriesId).sort((a, b) => a.order - b.order);
    },
    findBySeriesOrder(seriesId: string, order: number) {
      return store.episodes.find((e) => e.seriesId === seriesId && e.order === order) ?? null;
    },
    count() {
      return store.episodes.length;
    },
    create(
      data: Omit<Episode, "id" | "createdAt" | "views" | "seasonNumber" | "isFree"> &
        Partial<Pick<Episode, "views" | "seasonNumber" | "isFree" | "createdAt">>
    ) {
      const row: Episode = {
        ...data,
        id: nid("ep"),
        views: data.views ?? 0,
        seasonNumber: data.seasonNumber ?? 1,
        isFree: typeof data.isFree === "boolean" ? data.isFree : true,
        createdAt: data.createdAt ?? nowIso(),
      };
      store.episodes.push(row);
      notify();
      fire("/api/episodes", { method: "POST", body: JSON.stringify(row) });
      return row;
    },
    async createFromSource(data: {
      seriesId: string;
      order: number;
      title: string;
      titleSw: string;
      mediaType: "AUDIO" | "VIDEO";
      durationSec: number;
      isFree?: boolean;
      published?: boolean;
      description?: string;
      descriptionSw?: string;
      file?: File | null;
      poster?: File | null;
      mediaUrl?: string;
      onProgress?: (pct: number) => void;
    }) {
      const form = new FormData();
      form.append("seriesId", data.seriesId);
      form.append("order", String(data.order));
      form.append("title", data.title);
      form.append("titleSw", data.titleSw);
      form.append("mediaType", data.mediaType);
      form.append("durationSec", String(data.durationSec));
      form.append("isFree", String(data.isFree ?? data.order <= 3));
      form.append("published", String(data.published ?? true));
      form.append("description", data.description || "");
      form.append("descriptionSw", data.descriptionSw || "");
      form.append("mediaUrl", data.mediaUrl || "");
      if (data.file) form.append("file", data.file);
      if (data.poster) form.append("poster", data.poster);
      const created = await uploadForm<Episode>("/api/episodes/upload", form, data.onProgress);
      store.episodes.push({
        ...created,
        mediaUrl: created.mediaUrl ? mediaUrl(created.mediaUrl) : created.mediaUrl,
        posterUrl: created.posterUrl ? mediaUrl(created.posterUrl) : created.posterUrl,
      });
      notify();
      return created;
    },
    update(id: string, data: Partial<Episode>) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        Object.assign(row, data);
        notify();
        fire(`/api/episodes/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      }
      return row ?? null;
    },
    toggleFree(id: string) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        row.isFree = !row.isFree;
        notify();
        fire(`/api/episodes/${id}/toggle-free`, { method: "POST" });
        return row.isFree;
      }
      return false;
    },
    togglePublished(id: string) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        row.published = !row.published;
        notify();
        fire(`/api/episodes/${id}/toggle-published`, { method: "POST" });
        return row.published;
      }
      return false;
    },
    incrementViews(id: string) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        row.views = (row.views || 0) + 1;
        notify();
        fire(`/api/episodes/${id}/view`, { method: "POST" });
      }
    },
    toggleLike(id: string) {
      const row = store.episodes.find((e) => e.id === id);
      if (!row) return { likes: 0, liked: false };
      const liked = !row.likedByMe;
      row.likedByMe = liked;
      row.likes = Math.max(0, (row.likes || 0) + (liked ? 1 : -1));
      notify();
      fire(`/api/episodes/${id}/like`, { method: "POST" });
      return { likes: row.likes || 0, liked };
    },
    delete(id: string) {
      const idx = store.episodes.findIndex((e) => e.id === id);
      if (idx < 0) return null;
      const [row] = store.episodes.splice(idx, 1);
      store.progress = store.progress.filter((p) => p.episodeId !== id);
      store.comments = store.comments.filter((c) => c.episodeId !== id);
      notify();
      fire(`/api/episodes/${id}`, { method: "DELETE" });
      return row;
    },
  },

  users: {
    findMany(opts?: { q?: string; role?: Role; subscriptionStatus?: string }) {
      let rows = [...store.users];
      if (opts?.role) rows = rows.filter((u) => u.role === opts.role);
      if (opts?.subscriptionStatus) rows = rows.filter((u) => u.subscriptionStatus === opts.subscriptionStatus);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q)),
        );
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findById(id: string) {
      return store.users.find((u) => u.id === id) ?? null;
    },
    findByEmail(email: string) {
      return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) ?? null;
    },
    findByPhone(phone: string) {
      return store.users.find((u) => matchPhone(u.phone, phone.trim())) ?? null;
    },
    count() {
      return store.users.length;
    },
    create(
      data: Omit<User, "id" | "createdAt" | "phone" | "language"> & {
        phone?: string;
        language?: string;
        createdAt?: string;
      }
    ) {
      const row: User = {
        ...data,
        id: nid("user"),
        email: data.email.toLowerCase().trim(),
        phone: (data.phone ?? "+255700000000").trim(),
        role: data.role || "USER",
        language: data.language || "sw",
        subscriptionStatus: data.subscriptionStatus || "FREE_TIER",
        createdAt: data.createdAt ?? nowIso(),
      };
      store.users.push(row);
      notify();
      fire("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: row.name,
          phone: row.phone,
          email: row.email,
          password: data.password,
          role: row.role,
          language: row.language,
        }),
      });
      return row;
    },
    update(id: string, data: Partial<User>) {
      const user = store.users.find((u) => u.id === id);
      if (user) {
        Object.assign(user, data);
        notify();
        fire(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      }
      return user ?? null;
    },
    updateRole(id: string, role: Role) {
      const user = store.users.find((u) => u.id === id);
      if (user) {
        user.role = role;
        notify();
        fire(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
      }
      return user ?? null;
    },
    delete(id: string) {
      const idx = store.users.findIndex((u) => u.id === id);
      if (idx < 0) return null;
      const [row] = store.users.splice(idx, 1);
      store.subscriptions = store.subscriptions.filter((s) => s.userId !== id);
      store.progress = store.progress.filter((p) => p.userId !== id);
      store.favorites = store.favorites.filter((f) => f.userId !== id);
      notify();
      fire(`/api/users/${id}`, { method: "DELETE" });
      return row;
    },
  },

  subscriptions: {
    findMany(opts?: { status?: SubscriptionStatus; plan?: SubscriptionPlan; q?: string }) {
      let rows = [...store.subscriptions];
      if (opts?.status) rows = rows.filter((s) => s.status === opts.status);
      if (opts?.plan) rows = rows.filter((s) => s.plan === opts.plan);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (s) =>
            s.userName.toLowerCase().includes(q) ||
            s.userPhone.includes(q) ||
            s.referenceCode.toLowerCase().includes(q),
        );
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findById(id: string) {
      return store.subscriptions.find((s) => s.id === id) ?? null;
    },
    findForUser(userId: string) {
      return store.subscriptions.filter((s) => s.userId === userId);
    },
    plans() {
      return store.plans;
    },
    grantVIP(userId: string, plan: SubscriptionPlan) {
      const user = store.users.find((u) => u.id === userId);
      const cfg = store.plans.find((p) => p.id === plan) || {
        days: 30,
        amountTzs: 3500,
        planNameSw: "Kifurushi cha Mwezi",
      };
      const start = new Date();
      const end = new Date(start.getTime() + cfg.days * 86_400_000);
      const sub: Subscription = {
        id: nid("sub"),
        userId,
        userName: user?.name || "",
        userPhone: user?.phone || "",
        plan,
        planNameSw: cfg.planNameSw,
        amountTzs: cfg.amountTzs,
        paymentMethod: "Admin Grant",
        referenceCode: `GRANT-${Date.now().toString(36).toUpperCase()}`,
        status: "ACTIVE",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        createdAt: start.toISOString(),
      };
      store.subscriptions.unshift(sub);
      if (user) user.subscriptionStatus = "ACTIVE";
      notify();
      fire("/api/subscriptions/grant", { method: "POST", body: JSON.stringify({ userId, plan }) });
      return sub;
    },
    request(plan: SubscriptionPlan, paymentMethod: Subscription["paymentMethod"] = "M-Pesa") {
      void api("/api/subscriptions/me", {
        method: "POST",
        body: JSON.stringify({ plan, paymentMethod }),
      }).then(() => hydrate());
    },
    updateStatus(id: string, status: SubscriptionStatus) {
      const sub = store.subscriptions.find((s) => s.id === id);
      if (sub) {
        sub.status = status;
        const user = store.users.find((u) => u.id === sub.userId);
        if (user) {
          if (status === "ACTIVE") user.subscriptionStatus = "ACTIVE";
          else if (status === "CANCELLED" || status === "EXPIRED") {
            const hasOtherActive = store.subscriptions.some(
              (o) => o.userId === user.id && o.id !== id && o.status === "ACTIVE",
            );
            if (!hasOtherActive) user.subscriptionStatus = status === "EXPIRED" ? "EXPIRED" : "FREE_TIER";
          }
        }
        notify();
        fire(`/api/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      }
      return sub ?? null;
    },
    delete(id: string) {
      const idx = store.subscriptions.findIndex((s) => s.id === id);
      if (idx < 0) return null;
      const [deleted] = store.subscriptions.splice(idx, 1);
      notify();
      fire(`/api/subscriptions/${id}`, { method: "DELETE" });
      return deleted;
    },
    totalRevenue() {
      const unlockRev = store.allUnlocks
        .filter((u) => u.kind !== "SPONSORED_GRANT")
        .reduce((sum, u) => sum + (u.amountTzs || 0), 0);
      const sadaqah = store.sponsorships.reduce((sum, s) => sum + (s.amountTzs || 0), 0);
      return store.subscriptions.reduce((sum, s) => sum + (s.amountTzs || 0), 0) + unlockRev + sadaqah;
    },
    activeCount() {
      return store.subscriptions.filter((s) => s.status === "ACTIVE").length;
    },
  },

  unlocks: {
    mine() {
      return [...store.unlocks];
    },
    all() {
      return [...store.allUnlocks].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    owns(seriesId: string) {
      return store.unlocks.some((u) => u.seriesId === seriesId && u.status === "ACTIVE");
    },
    purchaseCount(seriesId: string) {
      return store.allUnlocks.filter((u) => u.seriesId === seriesId && u.kind !== "SPONSORED_GRANT").length;
    },
    async request(body: {
      seriesId?: string;
      kind?: "PURCHASE" | "BUNDLE";
      paymentMethod?: string;
      phone?: string;
    }) {
      const res = await api<{
        unlocks: SeriesUnlock[];
        amountTzs: number;
        sponsored?: boolean;
        token?: string;
        user?: SessionUser;
      }>("/api/unlocks", {
        method: "POST",
        body: JSON.stringify(body),
      });
      for (const row of res.unlocks || []) {
        if (!store.unlocks.some((u) => u.id === row.id)) store.unlocks.unshift(row);
        const idx = store.allUnlocks.findIndex((u) => u.id === row.id);
        if (idx >= 0) store.allUnlocks[idx] = row;
        else store.allUnlocks.unshift(row);
      }
      notify();
      await hydrate();
      return res;
    },
  },

  sponsorships: {
    findMany() {
      return [...store.sponsorships].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    async create(body: {
      seriesId: string;
      paymentMethod?: string;
      anonymous?: boolean;
      targetLabel?: string;
    }) {
      const res = await api<Sponsorship>("/api/sponsorships", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await hydrate();
      return res;
    },
  },

  monetize: {
    storyOfWeekId() {
      return store.storyOfWeekId;
    },
    storyOfWeek() {
      if (!store.storyOfWeekId) return null;
      return store.series.find((s) => s.id === store.storyOfWeekId) || null;
    },
    starterBundle() {
      return store.starterBundle;
    },
    kpis() {
      return store.monetizeKpis;
    },
    analytics() {
      return store.analytics;
    },
    async refreshAdmin() {
      if (!getToken()) return;
      const [unlocks, gifts, kpis, analytics] = await Promise.allSettled([
        api<SeriesUnlock[]>("/api/unlocks"),
        api<Sponsorship[]>("/api/sponsorships"),
        api<MonetizeKpis>("/api/monetize/kpis"),
        api<AnalyticsReport>("/api/monetize/analytics"),
      ]);
      if (unlocks.status === "fulfilled") store.allUnlocks = unlocks.value || [];
      if (gifts.status === "fulfilled") store.sponsorships = gifts.value || [];
      if (kpis.status === "fulfilled") store.monetizeKpis = kpis.value || store.monetizeKpis;
      if (analytics.status === "fulfilled") store.analytics = analytics.value || store.analytics;
      notify();
    },
  },

  comments: {
    async loadForSeries(seriesId: string) {
      const rows = await api<Comment[]>(`/api/comments?seriesId=${encodeURIComponent(seriesId)}`);
      const keep = store.comments.filter((c) => c.seriesId !== seriesId);
      store.comments = [...rows, ...keep];
      notify();
      return rows;
    },
    findMany(opts?: { seriesId?: string; episodeId?: string; parentId?: string | null; q?: string; includeHidden?: boolean }) {
      let rows = [...store.comments];
      if (opts?.seriesId) rows = rows.filter((c) => c.seriesId === opts.seriesId);
      if (opts?.episodeId) rows = rows.filter((c) => c.episodeId === opts.episodeId);
      if (opts?.parentId !== undefined) {
        if (opts.parentId === null) rows = rows.filter((c) => !c.parentId);
        else rows = rows.filter((c) => c.parentId === opts.parentId);
      }
      if (!opts?.includeHidden) rows = rows.filter((c) => !c.hidden);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter((c) => c.text.toLowerCase().includes(q) || c.userName.toLowerCase().includes(q));
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    async create(data: Omit<Comment, "id" | "createdAt">) {
      const row: Comment = { ...data, id: nid("cmt"), likes: data.likes ?? 0, createdAt: nowIso() };
      store.comments.unshift(row);
      notify();
      try {
        const saved = await api<Comment>("/api/comments", {
          method: "POST",
          body: JSON.stringify({
            id: row.id,
            seriesId: row.seriesId,
            episodeId: row.episodeId,
            text: row.text,
            parentId: row.parentId,
          }),
        });
        Object.assign(row, saved);
        notify();
        return row;
      } catch (err) {
        store.comments = store.comments.filter((c) => c.id !== row.id);
        notify();
        throw err;
      }
    },
    async toggleLike(id: string) {
      const c = store.comments.find((item) => item.id === id);
      if (!c) return { likes: 0, liked: false };
      const prevLikes = c.likes || 0;
      const prevLiked = !!c.likedByMe;
      const liked = !prevLiked;
      c.likedByMe = liked;
      c.likes = Math.max(0, prevLikes + (liked ? 1 : -1));
      notify();
      if (!getToken()) return { likes: c.likes, liked };
      try {
        const res = await api<{ liked: boolean; likes: number }>(`/api/comments/${id}/like`, { method: "POST" });
        c.likes = res.likes ?? c.likes;
        c.likedByMe = res.liked ?? liked;
        notify();
        return { likes: c.likes, liked: !!c.likedByMe };
      } catch (err) {
        c.likes = prevLikes;
        c.likedByMe = prevLiked;
        notify();
        throw err;
      }
    },
    toggleHide(id: string) {
      const c = store.comments.find((item) => item.id === id);
      if (c) {
        c.hidden = !c.hidden;
        notify();
        fire(`/api/comments/${id}/hide`, { method: "POST" });
        return c.hidden;
      }
      return false;
    },
    delete(id: string) {
      const idx = store.comments.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      const [deleted] = store.comments.splice(idx, 1);
      notify();
      fire(`/api/comments/${id}`, { method: "DELETE" });
      return deleted;
    },
  },

  shares: {
    track(data: { seriesId?: string; episodeId?: string; channel: string }) {
      if (data.seriesId) {
        const s = store.series.find((row) => row.id === data.seriesId);
        if (s) s.shareCount = (s.shareCount || 0) + 1;
      }
      if (data.episodeId) {
        const e = store.episodes.find((row) => row.id === data.episodeId);
        if (e) e.shareCount = (e.shareCount || 0) + 1;
      }
      notify();
      fire("/api/shares", { method: "POST", body: JSON.stringify(data) });
    },
  },

  communityUploads: {
    findMany(opts?: { status?: "APPROVED" | "PENDING" | "REJECTED"; q?: string }) {
      let rows = [...store.communityUploads];
      if (opts?.status) rows = rows.filter((c) => c.status === opts.status);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.titleSw.toLowerCase().includes(q) ||
            (c.uploaderName && c.uploaderName.toLowerCase().includes(q)),
        );
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findById(id: string) {
      return store.communityUploads.find((c) => c.id === id) ?? null;
    },
    create(data: Omit<CommunityUpload, "id" | "createdAt" | "likes">) {
      const row: CommunityUpload = { ...data, id: nid("cu"), likes: 0, views: 0, status: data.status || "PENDING", createdAt: nowIso() };
      store.communityUploads.unshift(row);
      notify();
      return row;
    },
    updateStatus(id: string, status: "APPROVED" | "PENDING" | "REJECTED", notes?: string) {
      const cu = store.communityUploads.find((c) => c.id === id);
      if (cu) {
        cu.status = status;
        if (notes) cu.moderationNotes = notes;
        notify();
        fire(`/api/community/${id}`, { method: "PATCH", body: JSON.stringify({ status, moderationNotes: notes }) });
      }
      return cu ?? null;
    },
    delete(id: string) {
      const idx = store.communityUploads.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      const [deleted] = store.communityUploads.splice(idx, 1);
      notify();
      fire(`/api/community/${id}`, { method: "DELETE" });
      return deleted;
    },
  },

  notifications: {
    findMany() {
      return [...store.notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findForUser(userId?: string, userPhone?: string) {
      return store.notifications
        .filter((n) => {
          if (n.targetUserId === "ALL" || !n.targetUserId) return true;
          if (userId && n.targetUserId === userId) return true;
          if (userPhone && n.targetPhone === userPhone) return true;
          return false;
        })
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    unreadCount(userId?: string, userPhone?: string) {
      return db.notifications.findForUser(userId, userPhone).filter((n) => !n.read).length;
    },
    create(data: Omit<AppNotification, "id" | "createdAt" | "read">) {
      const row: AppNotification = { ...data, id: nid("notif"), read: false, createdAt: nowIso() };
      store.notifications.unshift(row);
      notify();
      fire("/api/notifications", { method: "POST", body: JSON.stringify(row) });
      return row;
    },
    blast(data: {
      title: string;
      titleSw: string;
      message: string;
      messageSw: string;
      type: AppNotification["type"];
      targetUserId?: string | "ALL";
      targetPhone?: string;
      actionUrl?: string;
    }) {
      return db.notifications.create({ ...data, targetUserId: data.targetUserId || "ALL" });
    },
    markAsRead(id: string) {
      const n = store.notifications.find((item) => item.id === id);
      if (n) {
        n.read = true;
        notify();
        fire(`/api/notifications/${id}/read`, { method: "POST" });
      }
      return n ?? null;
    },
    markAllAsRead(userId?: string) {
      store.notifications.forEach((n) => {
        if (n.targetUserId === "ALL" || (userId && n.targetUserId === userId)) n.read = true;
      });
      notify();
    },
    delete(id: string) {
      const idx = store.notifications.findIndex((n) => n.id === id);
      if (idx < 0) return null;
      const [deleted] = store.notifications.splice(idx, 1);
      notify();
      fire(`/api/notifications/${id}`, { method: "DELETE" });
      return deleted;
    },
  },

  progress: {
    find(userId: string, episodeId: string) {
      return store.progress.find((p) => p.userId === userId && p.episodeId === episodeId) ?? null;
    },
    findMany(userId: string, opts?: { completed?: boolean; seriesId?: string }) {
      let rows = store.progress.filter((p) => p.userId === userId);
      if (typeof opts?.completed === "boolean") rows = rows.filter((p) => p.completed === opts.completed);
      if (opts?.seriesId) {
        const ids = new Set(store.episodes.filter((e) => e.seriesId === opts.seriesId).map((e) => e.id));
        rows = rows.filter((p) => ids.has(p.episodeId));
      }
      return rows.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    },
    countCompleted(userId: string) {
      return store.progress.filter((p) => p.userId === userId && p.completed).length;
    },
    countForEpisode(episodeId: string) {
      return store.progress.filter((p) => p.episodeId === episodeId).length;
    },
    upsert(userId: string, episodeId: string, positionSec: number, completed: boolean) {
      const existing = store.progress.find((p) => p.userId === userId && p.episodeId === episodeId);
      const persist = () => {
        if (!getToken()) return;
        fire("/api/progress", { method: "POST", body: JSON.stringify({ episodeId, positionSec, completed }) });
      };
      if (existing) {
        existing.positionSec = positionSec;
        existing.completed = completed;
        existing.updatedAt = nowIso();
        notify();
        persist();
        return existing;
      }
      const row: Progress = { id: nid("prog"), userId, episodeId, positionSec, completed, updatedAt: nowIso() };
      store.progress.push(row);
      notify();
      persist();
      return row;
    },
    resumeTarget(userId: string, seriesId: string): {
      episodeId: string;
      order: number;
      positionSec: number;
      durationSec: number;
      title: string;
      titleSw: string;
    } | null {
      const siblings = store.episodes
        .filter((e) => e.seriesId === seriesId && e.published)
        .sort((a, b) => a.order - b.order);
      if (siblings.length === 0) return null;
      const rows = store.progress
        .filter((p) => p.userId === userId && siblings.some((e) => e.id === p.episodeId))
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
      if (rows.length === 0) {
        const first = siblings[0];
        return {
          episodeId: first.id,
          order: first.order,
          positionSec: 0,
          durationSec: first.durationSec,
          title: first.title,
          titleSw: first.titleSw,
        };
      }
      const latest = rows[0];
      const episode = siblings.find((e) => e.id === latest.episodeId);
      if (!episode) return null;
      const dur = episode.durationSec || 0;
      const finished = latest.completed || (dur > 0 && latest.positionSec >= Math.max(dur - 3, 1));
      if (finished) {
        const next = siblings.find((e) => e.order > episode.order);
        if (!next) return null;
        const nextProg = rows.find((p) => p.episodeId === next.id);
        return {
          episodeId: next.id,
          order: next.order,
          positionSec: nextProg && !nextProg.completed ? nextProg.positionSec : 0,
          durationSec: next.durationSec,
          title: next.title,
          titleSw: next.titleSw,
        };
      }
      return {
        episodeId: episode.id,
        order: episode.order,
        positionSec: latest.positionSec,
        durationSec: episode.durationSec,
        title: episode.title,
        titleSw: episode.titleSw,
      };
    },
    continueWatching(userId: string, take = 8): Array<SeriesCard & {
      resumeEpisodeId: string;
      resumeEpisodeOrder: number;
      resumePositionSec: number;
      resumeDurationSec: number;
    }> {
      const rows = [...store.progress]
        .filter((p) => p.userId === userId)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
      const items: Array<SeriesCard & {
        resumeEpisodeId: string;
        resumeEpisodeOrder: number;
        resumePositionSec: number;
        resumeDurationSec: number;
      }> = [];
      const seen = new Set<string>();
      for (const p of rows) {
        const episode = store.episodes.find((e) => e.id === p.episodeId);
        if (!episode) continue;
        const series = store.series.find((s) => s.id === episode.seriesId && s.published);
        if (!series || seen.has(series.id)) continue;
        const resume = db.progress.resumeTarget(userId, series.id);
        if (!resume) continue;
        const started = resume.positionSec >= 5 || p.completed || p.episodeId !== resume.episodeId;
        if (!started) continue;
        seen.add(series.id);
        items.push({
          ...toSeriesCard(series),
          resumeEpisodeId: resume.episodeId,
          resumeEpisodeOrder: resume.order,
          resumePositionSec: resume.positionSec,
          resumeDurationSec: resume.durationSec,
        });
        if (items.length >= take) break;
      }
      return items;
    },
  },

  favorites: {
    find(userId: string, seriesId: string) {
      return store.favorites.find((f) => f.userId === userId && f.seriesId === seriesId) ?? null;
    },
    findMany(userId: string) {
      return store.favorites
        .filter((f) => f.userId === userId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    count(userId: string) {
      return store.favorites.filter((f) => f.userId === userId).length;
    },
    toggle(userId: string, seriesId: string) {
      const existing = store.favorites.find((f) => f.userId === userId && f.seriesId === seriesId);
      if (existing) {
        store.favorites = store.favorites.filter((f) => f.id !== existing.id);
        notify();
        if (getToken()) fire(`/api/favorites/${seriesId}/toggle`, { method: "POST" });
        return false;
      }
      store.favorites.push({ id: nid("fav"), userId, seriesId, createdAt: nowIso() });
      notify();
      if (getToken()) fire(`/api/favorites/${seriesId}/toggle`, { method: "POST" });
      return true;
    },
  },

  videoJobs: {
    findMany() {
      return [...store.videoJobs].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    },
    findById(id: string) {
      return store.videoJobs.find((j) => j.id === id) ?? null;
    },
    findByEpisodeId(episodeId: string) {
      return store.videoJobs.find((j) => j.episodeId === episodeId) ?? null;
    },
    create(
      data: Partial<VideoJob> & {
        episodeId?: string | null;
        episodeTitle?: string;
        seriesId?: string;
        titleSw?: string;
        titleEn?: string;
      }
    ) {
      const ts = nowIso();
      const row: VideoJob = {
        id: data.id ?? nid("job"),
        seriesId: data.seriesId ?? "",
        episodeId: data.episodeId ?? null,
        episodeTitle: data.episodeTitle ?? "Untitled Episode",
        format: data.format ?? "VERTICAL_9_16",
        engine: data.engine ?? "qisas-ai",
        progress: data.progress ?? 0,
        currentStep: data.currentStep ?? "Queued",
        status: data.status ?? "QUEUED",
        brief: data.brief ?? "",
        titleSw: data.titleSw ?? data.episodeTitle ?? "Video Render",
        titleEn: data.titleEn ?? "Video Render",
        storyboard: data.storyboard ?? [],
        scriptProvider: data.scriptProvider ?? "gemini-flash",
        ttsProvider: data.ttsProvider ?? "elevenlabs",
        voice: data.voice ?? "sw-TZ-standard",
        outputUrl: data.outputUrl ?? null,
        posterUrl: data.posterUrl ?? null,
        durationSec: data.durationSec ?? 120,
        logs: data.logs ?? "",
        error: data.error ?? null,
        createdById: data.createdById ?? null,
        createdAt: ts,
        updatedAt: ts,
      };
      store.videoJobs.push(row);
      notify();
      fire("/api/video-jobs", { method: "POST", body: JSON.stringify(row) });
      return row;
    },
    updateProgress(id: string, progress: number, status?: VideoJob["status"], currentStep?: string, outputUrl?: string) {
      const row = store.videoJobs.find((j) => j.id === id);
      if (!row) return null;
      if (status) row.status = status;
      row.progress = progress;
      if (currentStep) row.currentStep = currentStep;
      if (outputUrl) row.outputUrl = outputUrl;
      row.updatedAt = nowIso();
      notify();
      fire(`/api/video-jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ progress, status, currentStep, outputUrl }),
      });
      return row;
    },
    update(id: string, data: Partial<VideoJob>) {
      const row = store.videoJobs.find((j) => j.id === id);
      if (!row) return null;
      Object.assign(row, data, { updatedAt: nowIso() });
      notify();
      fire(`/api/video-jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      return row;
    },
    delete(id: string) {
      const idx = store.videoJobs.findIndex((j) => j.id === id);
      if (idx < 0) return null;
      const [row] = store.videoJobs.splice(idx, 1);
      notify();
      fire(`/api/video-jobs/${id}`, { method: "DELETE" });
      return row;
    },
  },

  ai: {
    generateStory(payload: { prompt: string; categorySlug: string; targetDurationSec: number; tone: string }) {
      return api("/api/ai/generate-story", { method: "POST", body: JSON.stringify(payload) });
    },
    generateStoryboard(payload: { brief: string; targetDurationSec: number }) {
      return api("/api/ai/generate-storyboard", { method: "POST", body: JSON.stringify(payload) });
    },
    publishStory(story: any, mediaUrl?: string) {
      return api("/api/ai/publish-story", { method: "POST", body: JSON.stringify({ story, mediaUrl, isFree: true }) });
    },
  },
};

export type MeSession = SessionUser;
