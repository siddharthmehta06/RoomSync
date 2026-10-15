import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { MatchesPage } from './pages/MatchesPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { SavedRoomsPage } from './pages/SavedRoomsPage';
import { ProfilePage } from './pages/ProfilePage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { BookingsPage } from './pages/BookingsPage';
import { ReviewsComplaintsPage } from './pages/ReviewsComplaintsPage';

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
            
            {/* 5. Signup */}
            <Route path="signup" element={<SignupPage />} />
            
            {/* 6. Preference Onboarding */}
            <Route path="onboarding" element={<OnboardingPage />} />
            
            {/* 7. Compatibility Matches */}
            <Route path="matches" element={<MatchesPage />} />
            
            {/* 8. Owner Dashboard */}
            <Route path="owner/dashboard" element={<OwnerDashboardPage />} />
            
            {/* 9. Create / Edit Listing */}
            <Route path="owner/listings/new" element={<CreateListingPage />} />
            <Route path="owner/listings/:id/edit" element={<CreateListingPage />} />
            
            {/* 10. Saved Rooms */}
            <Route path="saved" element={<SavedRoomsPage />} />
            
            {/* 11. Profile & Settings */}
            <Route path="profile" element={<ProfilePage />} />
            
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
    </QueryClientProvider>
  );
}

export default App;
