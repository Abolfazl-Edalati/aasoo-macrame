import giftImg from "./../assets/images/Product-7.png";

const Gift = () => {
  return (
    <div className="mx-20">
      <div className="flex flex-col md:flex-row gap-10 items-center justify-center">
        <img
          src={giftImg}
          alt="Gift"
          className="max-w-96 max-h-96 rounded-sm"
        />
        <div className="flex flex-col gap-4 max-w-xl">
          <span className="w-fit border px-2 rounded-2xl text-primary border-primary text-sm">
            پیشنهاد ویژه
          </span>
          <h2 className="font-semibold text-3xl">برای کسی که دوستش دارید</h2>
          <p className="text-gray-600 text-sm">
            هنر دست، هدیه ای است که جنس زمان و توجه. پک های هدیه ما با بسته بندی
            اختصاصی و امکان افزودن پیام شخصی، آماده اند تا لحظات خاص شما را
            ماندگارتر کنند.
          </p>
          <button className="btn btn-primary mt-2 w-fit">
            مشاهده پک های هدیه
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gift;
