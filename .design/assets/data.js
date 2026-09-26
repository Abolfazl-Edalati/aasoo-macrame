/* گِرِه — catalog data (sample data: brand name, prices, stock, dimensions are placeholders for the shop owner to edit)
   Image w/h are MEASURED intrinsic pixel dimensions from assets/img/measured.json — containers take their real ratio. */
window.GEREH_DATA = (function () {
  var IMG = "assets/img/";

  function img(src, alt) {
    var dims = {
      "hanging-plants-porch.jpg": [1920, 1307],
      "macrame-hanger-set.jpg": [1920, 1371],
      "macrame-collar-detail-a.jpg": [1920, 2560],
      "macrame-collar-detail-b.jpg": [1920, 1440],
      "macrame-basic-knots.jpg": [1920, 1440],
      "macrame-materials.jpg": [1920, 1440],
      "macrame-goa-large.jpg": [1920, 3417],
      "macrame-textile-panel.jpg": [1920, 2560],
      "macrame-knots-diagram-a.jpg": [1920, 1440],
      "macrame-knots-diagram-b.jpg": [1920, 1440],
      "macrame-sisal-large.jpg": [1109, 2278],
      "macrame-owls.jpg": [741, 536],
      "woven-wall-hanging-met.jpg": [1920, 2605]
    };
    var d = dims[src] || [1920, 1440];
    return { src: IMG + src, w: d[0], h: d[1], alt: alt };
  }

  var collections = [
    { id: "wall", name: "تابلو دیواری", desc: "بافت‌های بزرگ برای مرکز دیوار" },
    { id: "plant", name: "گل‌آویز", desc: "آویز گلدان با گره‌های موج‌دار" },
    { id: "decor", name: "اکسسوری", desc: "قطعه‌های کوچک دکوری و گردن‌آویز" },
    { id: "textile", name: "منسوج دیواری", desc: "پنل‌های بافته‌شده برای فضا" }
  ];

  var products = [
    {
      id: "dideh-80", name: "دیده ۸۰", subtitle: "تابلو دیواری هشتاد سانتی با بدنه موجی",
      priceTomans: 2850000, compareAtTomans: 3400000, category: "wall", collection: "wall",
      sizes: [{ id: "s", label: "۶۰ سانتی", delta: -650000 }, { id: "m", label: "۸۰ سانتی", delta: 0 }, { id: "l", label: "۱۱۰ سانتی", delta: 980000 }],
      colors: [{ id: "cream", label: "کرم", hex: "#E8E0D2" }, { id: "sand", label: "شنی", hex: "#C9B493" }, { id: "olive", label: "زیتونی", hex: "#6E7B5E" }],
      stock: 6, materials: "نخ پنبه‌ای ۴ میلی‌متر، میچوب گردوی آب‌داده", care: "گردگیری خشک؛ شست‌وشو نکنید", weave: "گره‌های مربعی و نیم‌گره (Half / Square knots)",
      weightKg: 1.2, dimensions: "عرض ۸۰ × ارتفاع ۱۲۰ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: true,
      description: "بافت اصلی با ردیف‌های نیم‌گره شکل موجی می‌سازد و حاشیه با گره‌های مربعی فیکس شده. بدنه روی میچوی گردو کشیده شده و انتهایش منگوله‌های نامتقارن دارد.",
      story: "اولین بار این نقش را برای دیوار پشت میز کار خودم بافتم؛ شش هفته طول کشید تا موج‌ها هم‌تراز شوند.",
      rating: 4.8, reviews: 24,
      images: [img("macrame-goa-large.jpg", "تابلو دیواری مکرومه با منگوله‌های بلند"), img("macrame-textile-panel.jpg", "نمای نزدیک بافت مکرومه"), img("woven-wall-hanging-met.jpg", "بافت دیواری دستبافت")]
    },
    {
      id: "parvaneh", name: "پروانه", subtitle: "تابلو دیواری کوچک برای گوشه دنج",
      priceTomans: 1450000, compareAtTomans: 0, category: "wall", collection: "wall",
      sizes: [{ id: "s", label: "۴۵ سانتی", delta: 0 }, { id: "m", label: "۶۰ سانتی", delta: 420000 }],
      colors: [{ id: "cream", label: "کرم", hex: "#E8E0D2" }, { id: "clay", label: "رسی", hex: "#A65A38" }],
      stock: 11, materials: "نخ پنبه‌ای ۳ میلی‌متر، میچوی بامبو", care: "با دستمال خشک گردگیری کنید", weave: "گره‌های مارپیچ (Spiral knots)",
      weightKg: 0.5, dimensions: "عرض ۴۵ × ارتفاع ۷۰ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "سبک‌ترين تابلوی مجموعه؛ مناسب دیوار بالای میز مطالعه یا کنار آینه ورودی.",
      story: "نامش را از بال‌های نامتقارن انتهایی گرفته؛ هر بار که نصبش می‌کنید زاویه‌ی بال‌ها فرق می‌کند.",
      rating: 4.6, reviews: 17,
      images: [img("woven-wall-hanging-met.jpg", "تابلو دیواری دستبافت کوچک"), img("macrame-collar-detail-b.jpg", "جزئیات گره‌ها")]
    },
    {
      id: "sisal-110", name: "سی‌سال ۱۱۰", subtitle: "تابلو بزرگ با نخ کنفی خام",
      priceTomans: 3900000, compareAtTomans: 4500000, category: "wall", collection: "textile",
      sizes: [{ id: "m", label: "۹۰ سانتی", delta: -700000 }, { id: "l", label: "۱۱۰ سانتی", delta: 0 }],
      colors: [{ id: "natural", label: "طبیعی", hex: "#D6C6A8" }, { id: "walnut", label: "گردویی", hex: "#5C4632" }],
      stock: 3, materials: "نخ سی‌سال (کنف) ۵ میلی‌متر، شاخه گردو", care: "رطوبت مستقیم نرسانید", weave: "ترکیب گره‌های مربعی و تارنگریخت (Wrapping)",
      weightKg: 2.4, dimensions: "عرض ۱۱۰ × ارتفاع ۱۹۰ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "بافت درشت با نخ کنفی؛ برای دیوارهای بلند و فضاهای دوبلکس. هر گره برای تحمل وزن بافت دوبار محکم شده.",
      story: "از سفرم به شمال، جایی که کنف زیاد است، ایده‌ی ترکیب نخ‌های دو رنگ آمد.",
      rating: 4.9, reviews: 9,
      images: [img("macrame-sisal-large.jpg", "تابلو بلند مکرومه با نخ کنفی"), img("macrame-materials.jpg", "متریال نخ‌های مکرومه")]
    },
    {
      id: "golbar", name: "گلبار", subtitle: "گل‌آویز دو طبقه برای گلدان ۲۰",
      priceTomans: 980000, compareAtTomans: 0, category: "plant", collection: "plant",
      sizes: [{ id: "s", label: "تک‌طبقه", delta: -320000 }, { id: "m", label: "دو طبقه", delta: 0 }],
      colors: [{ id: "cream", label: "کرم", hex: "#E8E0D2" }, { id: "olive", label: "زیتونی", hex: "#6E7B5E" }, { id: "ink", label: "قهوه‌ای", hex: "#3B2F26" }],
      stock: 18, materials: "نخ پنبه‌ای ۴ میلی‌متر، حلقه فلزی رنگ‌کوره‌ای", care: "قابل شست‌وشوی ملایم با آب سرد", weave: "گره‌های کوله‌پشتی (Cowhide knots)",
      weightKg: 0.4, dimensions: "قد ۹۰ سانتی‌متر، مناسب گلدان ۲۰ تا ۲۴", madeIn: "تهران", handmade: true, isNew: true,
      description: "پایه بافته‌شده طوری است که گلدان سفالی داخلش می‌نشیند و لیز نمی‌خورد؛ دوخت داخلی ضدلغزش دارد.",
      story: "ساده‌ترین قطعه مجموعه، اما پرفروش‌ترین — چون هیچ‌وقت از مد نمی‌افتد.",
      rating: 4.7, reviews: 41,
      images: [img("hanging-plants-porch.jpg", "گل‌آویز مکرومه با گیاهان"), img("macrame-hanger-set.jpg", "ست گل‌آویزهای مکرومه")]
    },
    {
      id: "band-3", name: "بند ۳تایی", subtitle: "ست سه گل‌آویز با ارتفاع‌های مختلف",
      priceTomans: 2350000, compareAtTomans: 2700000, category: "plant", collection: "plant",
      sizes: [{ id: "m", label: "استاندارد", delta: 0 }, { id: "l", label: "بلند", delta: 550000 }],
      colors: [{ id: "cream", label: "کرم", hex: "#E8E0D2" }, { id: "sand", label: "شنی", hex: "#C9B493" }],
      stock: 7, materials: "نخ پنبه‌ای ۴ میلی‌متر، سه حلقه چوبی", care: "گردگیری خشک", weave: "گره‌های مربعی با منگوله‌ی انتهایی",
      weightKg: 1.0, dimensions: "ارتفاع ۶۰ / ۷۵ / ۹۰ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "سه آویز با قد مختلف کنار هم نصب می‌شوند و روی دیوار پله یا کنار پنجره حجم می‌سازند.",
      story: "برای مشتری‌ای بافته شد که یک پنجره شمالی بلند داشت و می‌خواست پتوس‌ها پایین بیایند.",
      rating: 4.8, reviews: 13,
      images: [img("macrame-hanger-set.jpg", "ست سه گل‌آویز مکرومه"), img("hanging-plants-porch.jpg", "گل‌آویزها روی ایوان")]
    },
    {
      id: "gardan-khak", name: "گردن‌بند خاک", subtitle: "گردن‌آویز بافت با قفل چوبی",
      priceTomans: 690000, compareAtTomans: 0, category: "decor", collection: "decor",
      sizes: [{ id: "s", label: "کوتاه ۴۰", delta: 0 }, { id: "m", label: "بلند ۶۵", delta: 130000 }],
      colors: [{ id: "clay", label: "رسی", hex: "#A65A38" }, { id: "olive", label: "زیتونی", hex: "#6E7B5E" }, { id: "cream", label: "کرم", hex: "#E8E0D2" }],
      stock: 22, materials: "نخ کتان خمیرشده، قفل چوب زیتون", care: "با عطر و مرطوبکننده تماس ندهید", weave: "بافت تخت (Flat braid) با گره‌های جمع",
      weightKg: 0.05, dimensions: "عرض ۳ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: true,
      description: "بافت محکم و تخت، لبه‌هایش کوک پنهان خورده که باز نشود. سبک، قابل شست‌وشو، مناسب استفاده روزمره.",
      story: "یادگاری از کلاس اول مکرومه‌ی خودم؛ همان گره‌ها، فقط منظم‌تر.",
      rating: 4.5, reviews: 33,
      images: [img("macrame-collar-detail-a.jpg", "گردن‌آویز بافت مکرومه"), img("macrame-collar-detail-b.jpg", "جزئیات قفل چوبی")]
    },
    {
      id: "gardan-dois", name: "گردن‌بند دویس", subtitle: "گردن‌آویز لایه‌ای با مهره‌های صدف",
      priceTomans: 820000, compareAtTomans: 950000, category: "decor", collection: "decor",
      sizes: [{ id: "s", label: "استاندارد", delta: 0 }],
      colors: [{ id: "cream", label: "کرم", hex: "#E8E0D2" }, { id: "walnut", label: "گردویی", hex: "#5C4632" }],
      stock: 14, materials: "نخ پنبه ۲ میلی‌متر، مهره صدف طبیعی", care: "مهره‌ها را خشک نگه دارید", weave: "گره‌های مارپیچ دور مهره",
      weightKg: 0.04, dimensions: "دو رشته ۴۵ و ۵۵ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "دو رشته روی هم حجم خوبی زیر یقه لباس ساده می‌سازد.",
      story: "صدف‌ها را از بازار ماهی‌فروشان انزلی جمع کردم؛ هر رشته مهره‌های کمی متفاوت دارد.",
      rating: 4.4, reviews: 21,
      images: [img("macrame-collar-detail-b.jpg", "گردن‌آویز مکرومه با مهره"), img("macrame-collar-detail-a.jpg", "نمای نزدیک بافت")]
    },
    {
      id: "jobaki", name: "جوجه‌کوکب", subtitle: "عروسک گرهی جغد، کار رومیزی",
      priceTomans: 540000, compareAtTomans: 0, category: "decor", collection: "decor",
      sizes: [{ id: "s", label: "کوچک ۱۵", delta: 0 }, { id: "m", label: "متوسط ۲۲", delta: 180000 }],
      colors: [{ id: "natural", label: "طبیعی", hex: "#D6C6A8" }, { id: "charcoal", label: "ذغالی", hex: "#3B3936" }],
      stock: 9, materials: "نخ پنبه، الیاف توپری", care: "با دستمال مرطوب سطحی تمیز کنید", weave: "بافت سه‌بعدی با گره‌های جغد (Owl knots)",
      weightKg: 0.15, dimensions: "ارتفاع ۱۵ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "هر جغد حدود چهار ساعت کار می‌برد؛ چشم‌ها با گره دوبل بسته می‌شوند که در نیایند.",
      story: "اولین عروسکم بد بود — همان را روی میز نگه داشته‌ام تا یادم نرود.",
      rating: 4.9, reviews: 28,
      images: [img("macrame-owls.jpg", "عروسک‌های جغد مکرومه"), img("macrame-basic-knots.jpg", "گره‌های پایه بافت")]
    },
    {
      id: "pannel-shomal", name: "پنل شمال", subtitle: "منسوج دیواری چهارضلعی با بافت ریب",
      priceTomans: 3200000, compareAtTomans: 0, category: "textile", collection: "textile",
      sizes: [{ id: "m", label: "۹۰×۹۰", delta: 0 }, { id: "l", label: "۱۲۰×۱۲۰", delta: 1300000 }],
      colors: [{ id: "olive", label: "زیتونی", hex: "#6E7B5E" }, { id: "cream", label: "کرم", hex: "#E8E0D2" }, { id: "walnut", label: "گردویی", hex: "#5C4632" }],
      stock: 4, materials: "نخ پنبه‌ای ۵ میلی‌متر، چارچوب چوبی", care: "رول نکنید؛ آویزان نگهداری شود", weave: "تار و پود بافته‌شده با دست (Weaving)",
      weightKg: 2.8, dimensions: "۹۰ × ۹۰ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "بافت ریب ضخیم، عایق صوتی ملایم برای اتاق و استودیو. هر پنل روی دار کوچک کشیده می‌شود.",
      story: "رنگ‌بندی‌اش از دشت‌های شمال در اواخر تابستان گرفته شده — زیتونی و گردویی.",
      rating: 4.7, reviews: 6,
      images: [img("macrame-textile-panel.jpg", "پنل منسوج دیواری بافته‌شده"), img("woven-wall-hanging-met.jpg", "بافت دیواری سنتی")]
    },
    {
      id: "rostam-hanger", name: "رستم", subtitle: "گل‌آویز قد بلند با پایه ایستاده",
      priceTomans: 1750000, compareAtTomans: 2100000, category: "plant", collection: "wall",
      sizes: [{ id: "m", label: "۱۴۰ سانتی", delta: 0 }, { id: "l", label: "۱۸۰ سانتی", delta: 480000 }],
      colors: [{ id: "natural", label: "طبیعی", hex: "#D6C6A8" }, { id: "ink", label: "قهوه‌ای", hex: "#3B2F26" }],
      stock: 8, materials: "نخ کنف و پنبه ترکیبی، سه‌پایه آهنی", care: "پایه آهنی را خشک نگه دارید", weave: "گره‌های در هم تنیده (Interlocking)",
      weightKg: 3.1, dimensions: "قد ۱۴۰ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "برای گوشه سالن؛ گیاه روی سه‌پایه قرار می‌گیرد و بافت دورش آویزان می‌شود. مونتاژ ساده، بدون پیچ‌گوشتی.",
      story: "اسمش را روی دوخت انتهایی‌اش گره زده‌ام؛ امضای کارهای بزرگ من است.",
      rating: 4.6, reviews: 11,
      images: [img("macrame-goa-large.jpg", "گل‌آویز بلند مکرومه"), img("hanging-plants-porch.jpg", "گیاهان آویزان در ایوان")]
    },
    {
      id: "set-khat", name: "ست استثنا", subtitle: "تابلو + دو گل‌آویز هم‌رنگ، ست کامل",
      priceTomans: 4700000, compareAtTomans: 5600000, category: "wall", collection: "plant",
      sizes: [{ id: "m", label: "استاندارد", delta: 0 }, { id: "l", label: "بزرگ", delta: 1100000 }],
      colors: [{ id: "cream", label: "کرم", hex: "#E8E0D2" }, { id: "clay", label: "رسی", hex: "#A65A38" }],
      stock: 2, materials: "نخ پنبه‌ای، میچوی گردو، حلقه چوبی", care: "گردگیری خشک", weave: "یکپارچه: موجی + کوله‌پشتی",
      weightKg: 2.0, dimensions: "تابلو ۸۰ سانتی + دو آویز ۶۰ و ۸۰", madeIn: "تهران", handmade: true, isNew: false,
      description: "اگر یک دیوار را می‌خواهید کامل بپوشانید؛ قطعه‌ها هم‌رنگ و هم‌نخ بافته می‌شوند تا ست واقعی باشند.",
      story: "ارزان‌تر از خرید تکی در می‌آید — چون نخ را یک‌جا رنگ می‌کنم.",
      rating: 5.0, reviews: 4,
      images: [img("hanging-plants-porch.jpg", "ست مکرومه روی ایوان"), img("macrame-hanger-set.jpg", "ست گل‌آویز"), img("macrame-goa-large.jpg", "تابلو بلند هم‌ست")]
    },
    {
      id: "safar-torbe", name: "سفر", subtitle: "توربچه گرهی با بند بلندی",
      priceTomans: 1150000, compareAtTomans: 0, category: "decor", collection: "decor",
      sizes: [{ id: "s", label: "کوچک", delta: 0 }, { id: "m", label: "استاندارد", delta: 240000 }],
      colors: [{ id: "natural", label: "طبیعی", hex: "#D6C6A8" }, { id: "olive", label: "زیتونی", hex: "#6E7B5E" }, { id: "walnut", label: "گردویی", hex: "#5C4632" }],
      stock: 0, materials: "نخ پنبه‌ای ۵ میلی‌متر، بندهی تنظیم", care: "شست‌وشوی دستی با آب سرد", weave: "بافت مشبک (Josephine knots)",
      weightKg: 0.3, dimensions: "۲۵ × ۳۰ سانتی‌متر", madeIn: "تهران", handmade: true, isNew: false,
      description: "کیف دوشی سبک برای بازار روز؛ بافت مشبک کش می‌آید و جا باز می‌کند. موقتاً ناموجود — دور بعدی بافندگی در راه است.",
      story: "وقتی مسافرت می‌روم همین را با خودم می‌برم؛ داخلش قیچی و نخ یدکی است.",
      rating: 4.3, reviews: 19,
      images: [img("macrame-collar-detail-a.jpg", "توربچه گرهی دستبافت"), img("macrame-materials.jpg", "نخ‌ها و ابزار بافت")]
    },
    {
      id: "talim-kit", name: "کیت آموزش", subtitle: "بسته شروع بافندگی + دسترسی به ویدیوها",
      priceTomans: 890000, compareAtTomans: 0, category: "decor", collection: "decor",
      sizes: [{ id: "basic", label: "پایه", delta: 0 }, { id: "plus", label: "پیشرفته", delta: 350000 }],
      colors: [{ id: "natural", label: "طبیعی", hex: "#D6C6A8" }],
      stock: 25, materials: "۲۰۰ متر نخ ۴ میلی‌متر، شانه، حلقه، جزوه گره‌ها", care: "—", weave: "هفت گره پایه: کوله‌پشتی، مربعی، مارپیچ، نیم‌گره…",
      weightKg: 0.8, dimensions: "جعبه ۲۵×۱۸ سانتی‌متر", madeIn: "تهران", handmade: false, isNew: true,
      description: "همان چیزی که کاش موقع شروع داشتم: نخ، ابزار، و نقشه گره‌ها به فارسی. ویدیوهای هفت گره پایه با کد داخل جعبه.",
      story: "نیمی از وقت کلاس‌های حضوری را با همین کیت در خانه می‌گذرانید.",
      rating: 4.8, reviews: 56,
      images: [img("macrame-materials.jpg", "متریال کیت آموزش مکرومه"), img("macrame-basic-knots.jpg", "گره‌های پایه مکرومه"), img("macrame-knots-diagram-a.jpg", "نقشه گره‌ها"), img("macrame-knots-diagram-b.jpg", "نقشه گره‌های ترکیبی")]
    }
  ];

  var articles = [
    { id: "knot-7", title: "هفت گره‌ای که همه‌چیز از آن‌ها شروع می‌شود", excerpt: "از کوله‌پشتی تا جوزفین؛ نقشه‌ی کامل گره‌های پایه با عکس و تعداد نخ.",
      date: "۱۴۰۳/۰۵/۲۱", readMin: 9, image: img("macrame-basic-knots.jpg", "نمای نزدیک گره‌های پایه مکرومه"), tag: "آموزش" },
    { id: "choose-thread", title: "نخ ۳ یا ۵ میلی؟ راهنمای انتخاب نخ", excerpt: "کدام نخ برای تابلو، کدام برای گل‌آویز و کدام برای گردن‌آویز مناسب است.",
      date: "۱۴۰۳/۰۶/۰۲", readMin: 6, image: img("macrame-materials.jpg", "کلاف‌های نخ مکرومه"), tag: "متریال" },
    { id: "wall-map", title: "قبل از بافت، دیوار را اندازه بگیرید", excerpt: "ارتفاع نصب، فاصله تا گیاه، و اینکه چرا تابلوی بلند کوتاه نمی‌خواند.",
      date: "۱۴۰۳/۰۶/۱۸", readMin: 5, image: img("macrame-knots-diagram-a.jpg", "نقشه‌ی گره‌ها روی کاغذ"), tag: "نصب" },
    { id: "wash-care", title: "مکرومه را چطور تمیز نگه داریم", excerpt: "گردگیری، هوای تازه، و تنها حالتی که آب مجاز است.",
      date: "۱۴۰۳/۰۷/۰۱", readMin: 4, image: img("hanging-plants-porch.jpg", "گل‌آویزها در نور ایوان"), tag: "نگهداری" }
  ];

  var site = {
    name: "گِرِه",
    tagline: "گره‌هایی که خانه را گرم می‌کنند",
    brandNote: "نام برند، قیمت‌ها، موجودی و ابعاد نمونه‌اند؛ از فایل assets/data.js قابل ویرایش.",
    phone: "۰۹۱۲ ۳۴۵ ۶۷۸۹",
    email: "hello@gereh.shop",
    address: "تهران، خیابان شریعتی، کوچه‌ی گلستان، پلاک ۱۲ — کارگاه و نشیگاه بازدید با هماهنگی",
    hours: "شنبه تا چهارشنبه، ۱۰ تا ۱۸",
    instagram: "gereh.makrame",
    shipping: { flatTomans: 90000, freeFromTomans: 300000 },
    promo: { code: "GEREH10", percent: 10, note: "نمونه: کد تخفیف صد در ده — در محیط واقعی به درگاه متصل می‌شود" },
    credits: [
      { file: "hanging-plants-porch.jpg", artist: "David E. Lucas", license: "Public domain" },
      { file: "macrame-goa-large.jpg", artist: "Fredericknoronha", license: "CC BY-SA 4.0" },
      { file: "macrame-sisal-large.jpg", artist: "Mojmir Churavy", license: "CC BY-SA 4.0" },
      { file: "macrame-collar-detail-a.jpg", artist: "Hy Hill", license: "CC BY 4.0" },
      { file: "macrame-collar-detail-b.jpg", artist: "Hy Hill", license: "CC BY 4.0" },
      { file: "macrame-basic-knots.jpg", artist: "Stilfehler", license: "CC BY-SA 4.0" },
      { file: "macrame-materials.jpg", artist: "Stilfehler", license: "CC BY-SA 4.0" },
      { file: "macrame-hanger-set.jpg", artist: "Wikimedia Commons", license: "CC BY-SA" },
      { file: "macrame-knots-diagram-a.jpg", artist: "Wikimedia Commons", license: "CC BY-SA" },
      { file: "macrame-knots-diagram-b.jpg", artist: "Wikimedia Commons", license: "CC BY-SA" },
      { file: "macrame-textile-panel.jpg", artist: "نامشخص", license: "CC BY 4.0" },
      { file: "macrame-owls.jpg", artist: "Monika86g", license: "Public domain" },
      { file: "woven-wall-hanging-met.jpg", artist: "متحف هنر", license: "CC0" }
    ]
  };

  return { products: products, collections: collections, articles: articles, site: site };
})();
