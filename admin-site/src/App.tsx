import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import Login from "./Pages/Auth/Login/Login";
import Layout from "./Layout/Layout";
import Home from "./Pages/Home/Home";
import Accounts from "./Pages/Accounts/Accounts";
import Competition from "./Pages/Competition/Competition";

const App = (): JSX.Element => {
  const router = createBrowserRouter([
    {
      path: "/auth/login",
      element: <Login />,
    },
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "",
          element: <Home />,
        },
        {
          path: "accounts",
          element: <Accounts />,
        },
        {
          path: "competition",
          element: <Competition />,
        }
      ]
    }
  ]);

  return (
    <ChakraProvider>
      <RouterProvider router={router}></RouterProvider>
    </ChakraProvider>
  );
};

export default App;
