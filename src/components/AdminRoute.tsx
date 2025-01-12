import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdminLoggedIn } = useAppSelector((state) => state.auth);

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
