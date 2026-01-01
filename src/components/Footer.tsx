export default function Footer() {
  return (
    <footer className="bg-primary border-t border-primary-foreground/10 mt-auto">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-primary-foreground/60 font-paragraph text-sm">
            © {new Date().getFullYear()} ZamLoan Management System. All rights reserved.
          </div>
          <div className="text-primary-foreground/60 font-paragraph text-sm">
            Version 1.0.0 | IFRS 9 & BoZ Compliant
          </div>
        </div>
      </div>
    </footer>
  );
}
