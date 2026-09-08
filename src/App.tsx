import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { RequireAuth, RequireAdmin, RedirectRoot } from "./components/AuthGuards";
import OnboardingPage from "./pages/OnboardingPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const IdentifierCheckPage = lazy(() => import("./pages/IdentifierCheckPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const CategoryDetailPage = lazy(() => import("./pages/CategoryDetailPage"));
const SeriesDetailPage = lazy(() => import("./pages/SeriesDetailPage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SubscribePage = lazy(() => import("./pages/SubscribePage"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const CategoriesAdminPage = lazy(() => import("./pages/admin/CategoriesAdminPage"));
const NewCategoryPage = lazy(() => import("./pages/admin/NewCategoryPage"));
const SeriesAdminPage = lazy(() => import("./pages/admin/SeriesAdminPage"));
const NewSeriesPage = lazy(() => import("./pages/admin/NewSeriesPage"));
const ManageSeriesEpisodesPage = lazy(() => import("./pages/admin/ManageSeriesEpisodesPage"));
const EpisodesAdminPage = lazy(() => import("./pages/admin/EpisodesAdminPage"));
const NewEpisodePage = lazy(() => import("./pages/admin/NewEpisodePage"));
const ContentRulesAuditPage = lazy(() => import("./pages/admin/ContentRulesAuditPage"));
const AiContentGeneratorPage = lazy(() => import("./pages/admin/AiContentGeneratorPage"));
const VideosPage = lazy(() => import("./pages/admin/VideosPage"));
const NewVideoPage = lazy(() => import("./pages/admin/NewVideoPage"));
const VideoJobEditorPage = lazy(() => import("./pages/admin/VideoJobEditorPage"));
const CommunityAdminPage = lazy(() => import("./pages/admin/CommunityAdminPage"));
const CommentsAdminPage = lazy(() => import("./pages/admin/CommentsAdminPage"));
const UsersAdminPage = lazy(() => import("./pages/admin/UsersAdminPage"));
const SubscriptionsAdminPage = lazy(() => import("./pages/admin/SubscriptionsAdminPage"));
const NotificationsAdminPage = lazy(() => import("./pages/admin/NotificationsAdminPage"));
const SystemAdminPage = lazy(() => import("./pages/admin/SystemAdminPage"));
const MonetizeAdminPage = lazy(() => import("./pages/admin/MonetizeAdminPage"));

function RouteFallback() {
  return <div className="min-h-[100dvh] bg-deep-green" />;
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<RedirectRoot />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/identifier-check" element={<IdentifierCheckPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/player/:episodeId" element={<PlayerPage />} />

        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:slug" element={<CategoryDetailPage />} />
          <Route path="/series/:slug" element={<SeriesDetailPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route
            path="/saved"
            element={
              <RequireAuth>
                <SavedPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
        </Route>

        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/categories" element={<CategoriesAdminPage />} />
          <Route path="/admin/categories/new" element={<NewCategoryPage />} />
          <Route path="/admin/series" element={<SeriesAdminPage />} />
          <Route path="/admin/series/new" element={<NewSeriesPage />} />
          <Route path="/admin/series/:slug" element={<ManageSeriesEpisodesPage />} />
          <Route path="/admin/episodes" element={<EpisodesAdminPage />} />
          <Route path="/admin/episodes/new" element={<NewEpisodePage />} />
          <Route path="/admin/content-rules" element={<ContentRulesAuditPage />} />
          <Route path="/admin/ai-studio" element={<AiContentGeneratorPage />} />
          <Route path="/admin/videos" element={<VideosPage />} />
          <Route path="/admin/videos/new" element={<NewVideoPage />} />
          <Route path="/admin/videos/:id" element={<VideoJobEditorPage />} />
          <Route path="/admin/community" element={<CommunityAdminPage />} />
          <Route path="/admin/comments" element={<CommentsAdminPage />} />
          <Route path="/admin/users" element={<UsersAdminPage />} />
          <Route path="/admin/subscriptions" element={<SubscriptionsAdminPage />} />
          <Route path="/admin/monetize" element={<MonetizeAdminPage />} />
          <Route path="/admin/notifications" element={<NotificationsAdminPage />} />
          <Route path="/admin/system" element={<SystemAdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
