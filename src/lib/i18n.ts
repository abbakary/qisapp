export type Lang = "sw" | "en";

export const DEFAULT_LANG: Lang = "sw";

type Dict = Record<string, { sw: string; en: string }>;

export const dict: Dict = {
  appName: { sw: "Qisas al-Anbiyaa", en: "Qisas al-Anbiyaa" },
  tagline: {
    sw: "Hadithi za Manabii · Stories of the Prophets",
    en: "Stories of the Prophets · Hadithi za Manabii",
  },
  getStarted: { sw: "Anza Sasa", en: "Get Started" },
  haveAccount: { sw: "Una akaunti tayari?", en: "Already have an account?" },
  noAccount: { sw: "Huna akaunti?", en: "Don't have an account?" },
  login: { sw: "Ingia", en: "Log In" },
  register: { sw: "Jisajili", en: "Register" },
  logout: { sw: "Toka", en: "Log out" },
  welcomeBack: { sw: "Karibu tena", en: "Welcome back" },
  createAccount: { sw: "Fungua akaunti", en: "Create your account" },
  name: { sw: "Jina", en: "Name" },
  email: { sw: "Barua pepe", en: "Email" },
  password: { sw: "Nywila", en: "Password" },
  continueStories: { sw: "Ingia ili kuendelea na hadithi zako.", en: "Sign in to continue your stories." },
  greeting: { sw: "Assalamu alaykum", en: "Assalamu alaykum" },
  search: { sw: "Tafuta hadithi...", en: "Search stories..." },
  popular: { sw: "Maarufu", en: "Popular" },
  new: { sw: "Mpya", en: "New" },
  categories: { sw: "Aina", en: "Categories" },
  continueWatching: { sw: "Endelea kutazama", en: "Continue watching" },
  popularThisWeek: { sw: "Maarufu wiki hii", en: "Popular this week" },
  seeAll: { sw: "Ona zote", en: "See all" },
  home: { sw: "Nyumbani", en: "Home" },
  saved: { sw: "Zilizohifadhiwa", en: "Saved" },
  profile: { sw: "Wasifu", en: "Profile" },
  chooseCategory: { sw: "Chagua Aina", en: "Choose a category" },
  storyGroups: { sw: "Vikundi vya Hadithi", en: "Story groups" },
  episodes: { sw: "Vipindi", en: "Episodes" },
  episode: { sw: "Kipindi", en: "Episode" },
  avgLength: { sw: "Wastani wa kipindi", en: "Avg. episode" },
  language: { sw: "Lugha", en: "Language" },
  play: { sw: "Cheza", en: "Play" },
  resume: { sw: "Endelea", en: "Resume" },
  upNext: { sw: "Vipindi vinavyofuata", en: "Up next" },
  about: { sw: "Maelezo", en: "About" },
  locked: { sw: "Imefungwa", en: "Locked" },
  completed: { sw: "Umeshamaliza", en: "Completed" },
  now: { sw: "Sasa", en: "Now" },
  notYet: { sw: "Bado", en: "Not yet" },
  save: { sw: "Hifadhi", en: "Save" },
  savedShort: { sw: "Imehifadhiwa", en: "Saved" },
  noFavorites: { sw: "Bado hujahifadhi hadithi yoyote.", en: "You haven't saved any stories yet." },
  member: { sw: "Mwanachama", en: "Member" },
  adminPanel: { sw: "Paneli ya Msimamizi", en: "Admin panel" },
  settings: { sw: "Mipangilio", en: "Settings" },
  newEpisodeAlerts: { sw: "Arifa za vipindi vipya", en: "New episode alerts" },
  minutes: { sw: "dakika", en: "min" },
  storyOfWeek: { sw: "Hadithi ya wiki", en: "Story of the week" },
  unlockForever: { sw: "Fungua milele", en: "Unlock forever" },
  firstEpisodeFree: { sw: "Vipindi 1–3 ni bure daima", en: "Episodes 1–3 are free forever" },
  ownedForever: { sw: "Umilikiwa milele", en: "Yours forever" },
  sponsorOthers: { sw: "Dhamini kwa wengine", en: "Sponsor this for others" },
  starterBundle: { sw: "Kifurushi cha kuanza", en: "Starter bundle" },
  streak: { sw: "Mfululizo", en: "Streak" },
};

export function t(key: keyof typeof dict, lang: Lang): string {
  return dict[key]?.[lang] ?? key;
}
