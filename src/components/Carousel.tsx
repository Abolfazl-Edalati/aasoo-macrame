// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

import p3 from "./../assets/images/Product-3.png";
import p4 from "./../assets/images/Product-4.png";
import p5 from "./../assets/images/Product-5.png";
import p6 from "./../assets/images/Product-6.jpg";
import p7 from "./../assets/images/Product-7.png";
import p8 from "./../assets/images/Product-8.jpg";

// import required modules
import { Pagination } from "swiper/modules";
import { StarIcon } from "lucide-react";

const Carousel = () => {
  return (
    <div className="swiper-container p-20">
      <Swiper
        slidesPerView={4}
        spaceBetween={30}
        pagination={{
          clickable: true,
        }}
        modules={[Pagination]}
        className="mySwiper"
      >
        <SwiperSlide>
          <div className="relative">
            <div className="badge badge-warning absolute top-2 right-2 flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5" />
              جدید
            </div>
            <div className="h-96 w-full overflow-hidden">
              <img src={p3} alt="Macrame Product 3" />
            </div>

            <div className="mt-3 flex flex-col items-end gap-1">
              <h3>ست زیرلیوانی کویر</h3>
              <p>480.000 تومن</p>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="relative">
            <div className="badge badge-success absolute top-2 right-2 flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5" />
              پر فروش
            </div>
            <div className="h-96 w-full overflow-hidden">
              <img src={p4} alt="Macrame Product 4" />
            </div>
            <div className="mt-3 flex flex-col items-end gap-1">
              <h3>ست زیرلیوانی کویر</h3>
              <p>480.000 تومن</p>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div>
            <div className="h-96 w-full overflow-hidden">
              <img src={p5} alt="Macrame Product 5" />
            </div>
            <div className="mt-3 flex flex-col items-end gap-1">
              <h3>ست زیرلیوانی کویر</h3>
              <p>480.000 تومن</p>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div>
            <div className="h-96 w-full overflow-hidden">
              <img src={p6} alt="Macrame Product 6" />
            </div>
            <div className="mt-3 flex flex-col items-end gap-1">
              <h3>ست زیرلیوانی کویر</h3>
              <p>480.000 تومن</p>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div>
            <div className="h-96 w-full overflow-hidden">
              <img src={p7} alt="Macrame Product 7" />
            </div>
            <div className="mt-3 flex flex-col items-end gap-1">
              <h3>ست زیرلیوانی کویر</h3>
              <p>480.000 تومن</p>
            </div>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div>
            <div className="h-96 w-full overflow-hidden">
              <img src={p8} alt="Macrame Product 8" />
            </div>
            <div className="mt-3 flex flex-col items-end gap-1">
              <h3>ست زیرلیوانی کویر</h3>
              <p>480.000 تومن</p>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default Carousel;
