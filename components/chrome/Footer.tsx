export default function Footer() {
  return (
    <footer>
      <div className="wrap foot-inner">
        <div className="foot-links">
          <a href="mailto:pabhinav2006@gmail.com">email</a>
          <a href="https://github.com/AbhinavPabbaraju" target="_blank" rel="noopener noreferrer">github ↗</a>
          <a href="https://www.linkedin.com/in/abhinav-pabbaraju" target="_blank" rel="noopener noreferrer">linkedin ↗</a>
        </div>
        <div className="foot-meta">© {new Date().getFullYear()} Abhinav Pabbaraju · abhinavpabbaraju.com</div>
      </div>
    </footer>
  );
}
