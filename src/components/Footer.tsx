import telegram from "./../assets/svg/telegram.svg";
import instagram from "./../assets/svg/instagram.svg";

const Footer = () => {
  return (
    <footer className="footer footer-horizontal footer-center bg-base-200 mt-20 text-base-content rounded p-10">
      <nav className="grid grid-flow-col gap-4">
        <a className="link link-hover">درباره ما</a>
        <a className="link link-hover">تماس با ما</a>
      </nav>
      <nav>
        <div className="grid grid-flow-col gap-4">
          <a className="link link-hover">
            <img src={telegram} alt="Telegram" className="w-6 h-6" />
          </a>
          <a className="link link-hover">
            <img src={instagram} alt="Instagram" className="w-6 h-6" />
          </a>
          <a></a>
        </div>
      </nav>
      <aside>
        <p>
          Copyright © {new Date().getFullYear()} - تمامی حقوق برای این سایت
          محفوظ است.
        </p>
      </aside>
    </footer>
  );
};

export default Footer;
