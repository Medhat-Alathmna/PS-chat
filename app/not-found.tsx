import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-sky-300 via-sky-200 to-cyan-50">
      <div className="text-center bg-white/90 rounded-3xl p-8 shadow-xl max-w-sm mx-4">
        <div className="text-7xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">الصفحة مش موجودة!</h1>
        <p className="text-gray-500 mb-6">يبدو إنك ضعت... مدحت بساعدك ترجع!</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#6C5CE7] text-white rounded-2xl font-bold hover:bg-[#5A4BD1] transition-colors"
        >
          رجوع للرئيسية 🏠
        </Link>
      </div>
    </div>
  );
}
