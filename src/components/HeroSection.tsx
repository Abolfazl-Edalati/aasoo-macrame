import heroBg from "../assets/images/hero.jpg";

const HeroSection = () => {
  return (
    <div
      className="hero min-h-screen relative"
      style={{
        backgroundImage: `url(${heroBg})`,
      }}
    >
      <div className="absolute bottom-0 inset-x-0 h-full bg-linear-to-t from-black/50 to-transparent"></div>
      <div className="hero-overlay"></div>
      <div className="hero-content text-neutral-content text-center">
        <div className="max-w-2xl">
          <div className="aura">
            <div className="aura text-primary">
              <div className="card bg-base-100 text-base-content">
                <div className="card-body">
                  <h1 className="mb-5 text-5xl text-nowrap font-bold text-primary">
                    جزئیاتی که خانه را زیباتر می‌کنند
                  </h1>{" "}
                </div>
              </div>
            </div>
          </div>
          <p className="mb-5 mt-2">
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
