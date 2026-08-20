import c1 from "../assets/images/collections-1.jpg";
import c2 from "../assets/images/collections-2.jpg";
import c3 from "../assets/images/collections-3.jpg";

const Collections = () => {
  return (
    <div className="flex p-20 gap-3">
      <div className="relative flex-4 max-w-2/3">
        <img src={c1} alt="macrame collections 1" className="h-full" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 to-transparent" />
        <div className="absolute right-2 text-right bottom-2 text-white">
          <h4>دکور دیواری</h4>
          <p className="text-xs ">هنر گره بر روی دیوار</p>
        </div>
      </div>
      <div className="flex gap-3 flex-col flex-3 max-w-1/3">
        <div className="relative">
          <img src={c2} alt="macrame collections 1" className="w-full" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute right-2 text-right bottom-2 text-white">
            <h4>اکسسوری میز</h4>
            <p className="text-xs ">جزئیات ظریف</p>
          </div>
        </div>
        <div className="relative">
          <img src={c3} alt="macrame collections 1" className="w-full" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute right-2 text-right bottom-2 text-white">
            <h4>دکور اتاق</h4>
            <p className="text-xs mt-1">آرامش در فضای استراحت</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collections;
