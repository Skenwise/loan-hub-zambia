export default function Footer() {
  return (
    <footer className="bg-deep-blue text-white border-t-4 border-deep-blue shadow-lg mt-auto">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white font-paragraph text-sm font-semibold">
            © {new Date().getFullYear()} Lunar Management System. All rights reserved.
          </div>
          <div className="text-white font-paragraph text-sm font-semibold">
            Version 1.0.0 | IFRS 9 & BoZ Compliant
          </div>
        </div>
      </div>
    </footer>
  );
}
