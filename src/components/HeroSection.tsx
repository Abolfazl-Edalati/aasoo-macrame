import heroBg from "../assets/images/hero.webp";

const HeroSection = () => {
  return (
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage: `url(${heroBg})`,
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content text-neutral-content text-center">
        <div className="max-w-2xl">
          <h1 className="mb-5 text-6xl font-bold text-primary">
            جزئیاتی که خانه را زیباتر می‌کنند
          </h1>
          <p className="mb-5">
            هنر دستبافته‌های مکرومه با الهام از سادگی و طبیعت. گرمای یک خانه
            مدرن با اصالت ایرانی.
          </p>
          <div className="flex justify-center gap-4">
            <button className="btn btn-primary">کشف مجموعه ها</button>
            <button className="btn btn-secondary">مشاهده محصولات</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
