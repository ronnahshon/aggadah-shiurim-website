import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import Layout from "@/components/layout/Layout";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { CanonicalUrl } from "@/components/CanonicalUrl";

// Pages - using lazy loading for better performance
import HomePage from "./pages/HomePage"; // Keep home page eager loading
const CatalogPage = React.lazy(() => import("./pages/CatalogPage"));
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const ShiurPage = React.lazy(() => import("./pages/ShiurPage"));
const SefarimPage = React.lazy(() => import("./pages/SefarimPage"));
const SeferPage = React.lazy(() => import("./pages/SeferPage"));
const MidrashHaaliyahPage = React.lazy(() => import("./pages/MidrashHaaliyahPage"));
const EinYaakovCommentaryPage = React.lazy(() => import("./pages/EinYaakovCommentaryPage"));
const DaroshDarashMoshePage = React.lazy(() => import("./pages/DaroshDarashMoshePage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BreadcrumbSchema />
          <CanonicalUrl />
          <SidebarProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-biblical-brown">Loading...</div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Layout><HomePage /></Layout>} />
                <Route path="/catalog" element={<Layout><CatalogPage /></Layout>} />
                <Route path="/search" element={<Layout><SearchPage /></Layout>} />
                <Route path="/shiur/:shiurId" element={<Layout><ShiurPage /></Layout>} />
                <Route path="/sefarim" element={<Layout><SefarimPage /></Layout>} />
                <Route path="/sefer/:seferId" element={<Layout><SeferPage /></Layout>} />
                <Route path="/sefer/midrash-haaliyah" element={<Layout><MidrashHaaliyahPage /></Layout>} />
                <Route path="/sefer/ein-yaakov-commentary" element={<Layout><EinYaakovCommentaryPage /></Layout>} />
                <Route path="/sefer/darosh-darash-moshe" element={<DaroshDarashMoshePage />} />
                <Route path="/about" element={<Layout><AboutPage /></Layout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
