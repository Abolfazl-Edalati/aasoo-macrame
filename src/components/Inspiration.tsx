import img from "./../assets/images/inspiration.png";

const Inspiration = () => {
  return (
    <div className="flex justify-center flex-col items-center m-20 gap-4">
      <h3 className="text-2xl font-bold">الهام بگیرید</h3>
      <p className="text-center mb-2">نحوه چیدمان محصولات آسوو در فضای واقعی</p>
      <img src={img} className="rounded-sm" alt="Inspiration" />
    </div>
  );
};

export default Inspiration;
