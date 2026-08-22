import { ChevronLeftIcon } from "lucide-react";
import story from "../assets/images/story.webp";
import product1 from "../assets/images/product-1.webp";
import product2 from "../assets/images/product-2.webp";

const Story = () => {
  return (
    <div className="flex text-right items-center justify-between gap-10 p-20">
      <div className="flex flex-col gap-5 max-w-lg text-right">
        <h4 className="font-medium text-3xl">لوکس مدرن، گرمای در دسترس</h4>
        <p>
          تار و پود تنها یک برند دکوراسیون نیست؛ دعوتی است به زندگی آرام و
          آگاهانه. هر گره با دقت و عشق بافته می‌شود تا حسی از هنر دست و طبیعت را
          به فضای داخلی شما بیاورد. ما به زیبایی‌شناسی مینیمال و در عین حال غنی
          باور داریم.
        </p>
        <a
          href="#"
          className="flex self-end items-center text-sm font-semibold border-b w-fit text-primary"
        >
          داستان مارا بخوانید
          <ChevronLeftIcon />
        </a>
      </div>
      <div className="relative h-107.5 w-92.5 shrink-0">
        {/* Small - left */}
        <div
          className="absolute left-8 top-9 z-20 h-40 w-40 rounded-xl border border-base-300 bg-base-100 p-3 animate-float"
          style={{ animationDelay: "0s" }}
        >
          <img
            src={story}
            alt="داستان"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Middle - back */}
        <div
          className="absolute right-2 top-16 z-10 h-50 w-50 rounded-xl border border-base-300 bg-base-100 p-3 animate-float"
          style={{ animationDelay: "-2s" }}
        >
          <img
            src={product1}
            alt="محصول"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Large - front */}
        <div
          className="absolute bottom-0 right-10 z-30 h-65 w-65 rounded-xl border border-base-300 bg-base-100 p-4 animate-float"
          style={{ animationDelay: "-4s" }}
        >
          <img
            src={product2}
            alt="محصول"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Story;
