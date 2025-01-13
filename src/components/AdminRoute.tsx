import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdminLoggedIn } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAdminLoggedIn) {
    // Redirect to login page with the attempted URL
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
