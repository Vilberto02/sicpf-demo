import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layout
import { RequireAuth } from "./RequireAuth";
import { MainPage } from "@/pages/MainPage";

const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const PageNotFound = lazy(() =>
  import("@/pages/PageNotFound").then((m) => ({ default: m.PageNotFound }))
);

const OverviewSection = lazy(() =>
  import("@/components/sections/OverviewSection").then((m) => ({
    default: m.OverviewSection,
  }))
);
const InventorySection = lazy(() =>
  import("@/components/sections/InventorySection").then((m) => ({
    default: m.InventorySection,
  }))
);
const ProductSection = lazy(() =>
  import("@/components/sections/ProductSection").then((m) => ({
    default: m.ProductSection,
  }))
);
const SaleSection = lazy(() =>
  import("@/components/sections/SaleSection").then((m) => ({
    default: m.SaleSection,
  }))
);
const NewSaleSection = lazy(() =>
  import("@/components/sections/NewSaleSection").then((m) => ({
    default: m.NewSaleSection,
  }))
);
const AlertSection = lazy(() =>
  import("@/components/sections/AlertSection").then((m) => ({
    default: m.AlertSection,
  }))
);
const ProfileSection = lazy(() =>
  import("@/components/sections/ProfileSection").then((m) => ({
    default: m.ProfileSection,
  }))
);
const UsersSection = lazy(() =>
  import("@/components/sections/UsersSection").then((m) => ({
    default: m.UsersSection,
  }))
);

const routes = createBrowserRouter([
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <MainPage />,
        children: [
          { index: true, element: <Navigate to="/general" replace /> },
          { path: "general", element: <OverviewSection /> },
          { path: "inventario", element: <InventorySection /> },
          { path: "productos", element: <ProductSection /> },
          { path: "ventas", element: <SaleSection /> },
          { path: "ventas/nueva", element: <NewSaleSection /> },
          { path: "alertas", element: <AlertSection /> },
          { path: "perfil", element: <ProfileSection /> },
          { path: "usuarios", element: <UsersSection /> },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);

export default routes;