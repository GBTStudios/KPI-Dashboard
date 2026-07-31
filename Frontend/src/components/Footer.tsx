import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      <p>© {new Date().getFullYear()} All rights reserved.</p>
    </footer>
  );
}