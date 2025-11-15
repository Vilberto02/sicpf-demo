import { createBrowserRouter } from "react-router-dom";

//Layout
import { MainPage } from "@/pages/MainPage";
import { LoginPage } from "@/pages/LoginPage";
import { PageNotFound } from "@/pages/PageNotFound";
import { TestDataTablePage } from "@/pages/TestDataTablePage";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/test-datatable",
    element: <TestDataTablePage />,
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);

export default routes;
