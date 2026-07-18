import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Sidebar/Sidebar";
import TopBar from "../Components/Sidebar/TopBar";

function Layout() {
  return (
    <div className="app-shell flex h-screen overflow-hidden bg-[var(--aa-bg)]">
      <Sidebar />
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6">
          <div className="h-full overflow-auto rounded-[var(--aa-radius-xl)] p-0.5 sm:p-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Layout;
