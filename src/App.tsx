import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import FolderDetails from "./pages/FolderDetails";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

// Create a root route component to handle the default routing logic
const RootRoute = () => {
  const isAdminLoggedIn = store.getState().auth.isAdminLoggedIn;
  return (
    <Navigate
      to={isAdminLoggedIn ? "/admin/dashboard" : "/admin/login"}
      replace
    />
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root route will redirect based on auth status */}
            <Route path="/" element={<RootRoute />} />

            {/* Interview route */}
            <Route path="/interview" element={<Index />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Navigate to="/admin/dashboard" replace />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/folders/:folderId"
              element={
                <AdminRoute>
                  <FolderDetails />
                </AdminRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<RootRoute />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
