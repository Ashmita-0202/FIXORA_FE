export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <p className="font-display footer__brand">Fixora</p>
          <p className="footer__tag">Appliance repair, booked in minutes.</p>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} Fixora. All rights reserved.</p>
      </div>
    </footer>
  );
}
