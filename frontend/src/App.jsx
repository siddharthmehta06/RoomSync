import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { MatchesPage } from './pages/MatchesPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { OwnerVerificationPage } from './pages/OwnerVerificationPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { SavedRoomsPage } from './pages/SavedRoomsPage';
import { ProfilePage } from './pages/ProfilePage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { BookingsPage } from './pages/BookingsPage';
import { ReviewsComplaintsPage } from './pages/ReviewsComplaintsPage';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* 1. Home */}
              <Route index element={<HomePage />} />
              
              {/* 2. Explore Rooms */}
              <Route path="explore" element={<ExplorePage />} />
              
              {/* 3. Room Details */}
              <Route path="rooms/:id" element={<RoomDetailsPage />} />
              
              {/* 4. Login */}
              <Route path="login" element={<LoginPage />} />
              
              {/* 4b. Password Reset & Verification */}
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              
              {/* 5. Signup */}
              <Route path="signup" element={<SignupPage />} />
              
              {/* 6. Preference Onboarding */}
              <Route path="onboarding" element={<OnboardingPage />} />
              
              {/* 7. Compatibility Matches */}
              <Route path="matches" element={<MatchesPage />} />
              
              {/* 8. Owner Verification */}
              <Route 
                path="owner/verify" 
                element={
                  <ProtectedRoute>
                    <OwnerVerificationPage />
                  </ProtectedRoute>
                } 
              />

              {/* 8b. Owner Dashboard (Protected - Owner only) */}
              <Route 
                path="owner/dashboard" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerDashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 9. Create / Edit Listing (Protected - Owner only) */}
              <Route 
                path="owner/listings/new" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <CreateListingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="owner/listings/:id/edit" 
                element={
                  <ProtectedRoute requiredRole="owner">
                    <CreateListingPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 10. Saved Rooms (Protected) */}
              <Route 
                path="saved" 
                element={
                  <ProtectedRoute>
                    <SavedRoomsPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 11. Profile & Settings (Protected) */}
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 12. Enquiries & Chat */}
              <Route path="messages" element={<EnquiriesPage />} />
              
              {/* 13. Booking & Agreements */}
              <Route path="bookings" element={<BookingsPage />} />
              
              {/* 14. Reviews & Complaints */}
              <Route path="reviews-complaints" element={<ReviewsComplaintsPage />} />
              
              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
