import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthPage from "@/components/AuthPage";
import ProfilePage from "@/components/ProfilePage";
import AdminDashboard from "@/components/AdminDashboard";
import SubscriptionManager from "@/components/SubscriptionManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

function AuthRoute() {
  const navigate = useNavigate();
  return <AuthPage onAuthSuccess={() => navigate("/profile")} />;
}

function ProfileRoute() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) navigate("/auth");
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return null;
  return <ProfilePage onBack={() => navigate("/")} />;
}

function AdminRoute() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        toast({ title: "Login required", description: "Please sign in to access admin." });
        navigate("/auth");
      }
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return null;
  return <AdminDashboard onBack={() => navigate("/")} />;
}

function MembershipRoute() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <SubscriptionManager />
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/profile" element={<ProfileRoute />} />
            <Route path="/membership" element={<MembershipRoute />} />
            <Route path="/admin" element={<AdminRoute />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
