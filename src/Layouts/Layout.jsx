import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Sidebar/Sidebar";
import TopBar from "../Components/Sidebar/TopBar";

function Layout() {
  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 md:px-6 md:pb-6">
          <div className="h-full overflow-auto p-1 md:p-2">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Layout;
