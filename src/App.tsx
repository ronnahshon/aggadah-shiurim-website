import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import Layout from "@/components/layout/Layout";

// Pages
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import SearchPage from "./pages/SearchPage";
import ShiurPage from "./pages/ShiurPage";
import SefarimPage from "./pages/SefarimPage";
import SeferPage from "./pages/SeferPage";
import MidrashHaaliyahPage from "./pages/MidrashHaaliyahPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/catalog" element={<Layout><CatalogPage /></Layout>} />
            <Route path="/search" element={<Layout><SearchPage /></Layout>} />
            <Route path="/shiur/:shiurId" element={<Layout><ShiurPage /></Layout>} />
            <Route path="/sefarim" element={<Layout><SefarimPage /></Layout>} />
            <Route path="/sefer/:seferId" element={<Layout><SeferPage /></Layout>} />
            <Route path="/sefer/midrash-haaliyah" element={<Layout><MidrashHaaliyahPage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
