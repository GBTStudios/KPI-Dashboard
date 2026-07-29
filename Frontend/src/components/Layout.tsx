import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Layout.css";

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <div className="app-content">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}