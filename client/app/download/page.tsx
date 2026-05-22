import { Smartphone, Zap, ShieldCheck, Download, ArrowRight } from "lucide-react";

export default function DownloadPage() {
  return (
    <main className="relative min-h-screen bg-white overflow-hidden font-sans tracking-tight">

      {/* Artboard frame — same container as Footer so lines align */}
      <div className="absolute inset-0 pointer-events-none z-0 flex justify-center">
        <div className="relative w-[90%] max-w-7xl h-full">
          {/* Vertical left line */}
          <div className="absolute top-[-100vh] bottom-[-100vh] left-0 w-[1px] bg-green-700 opacity-40" />
          {/* Vertical right line */}
          <div className="absolute top-[-100vh] bottom-[-100vh] right-0 w-[1px] bg-green-700 opacity-40" />
          {/* Horizontal top line */}
          <div className="absolute top-[20%] left-[-100vw] right-[-100vw] h-[1px] bg-green-700 opacity-30" />
          {/* Horizontal bottom line */}
          <div className="absolute bottom-[15%] left-[-100vw] right-[-100vw] h-[1px] bg-green-700 opacity-30" />
          {/* Corner markers */}
          <div className="absolute top-[20%] left-0 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-green-700 -translate-x-px -translate-y-px" />
          <div className="absolute top-[20%] right-0 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-green-700 translate-x-px -translate-y-px" />
          <div className="absolute bottom-[15%] left-0 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-green-700 -translate-x-px translate-y-px" />
          <div className="absolute bottom-[15%] right-0 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-green-700 translate-x-px translate-y-px" />
        </div>
      </div>

      {/* Left content — constrained to max-w-7xl */}


      <div className="relative z-20 flex items-center min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-lg">
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#1a1a1a] mb-5">
              Kerja Di Lapangan,{" "}
              <span className="italic font-serif font-medium tracking-normal text-green-700">
                Lebih Efisien.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-sm md:text-base text-[#666666] leading-relaxed max-w-sm mb-8">
              Pantau kondisi mesin, kirim laporan insiden, dan akses monitoring sistem langsung melalui aplikasi mobile secara real-time
            </p>

            {/* Feature list */}
            <ul className="flex flex-col gap-4 mb-10">
              {[
                {
                  icon: <Smartphone size={16} className="text-green-700" strokeWidth={1.75} />,
                  title: "Monitoring Real-Time",
                  desc: "Pantau kondisi mesin dan aktivitas operasional langsung dari area produksi.",
                },
                {
                  icon: <Zap size={16} className="text-green-700" strokeWidth={1.75} />,
                  title: "Laporan Insiden Lebih Cepat",
                  desc: "Catat anomali dan kirim incident report langsung dari lapangan secara real-time.",
                },
                {
                  icon: <ShieldCheck size={16} className="text-green-700" strokeWidth={1.75} />,
                  title: "Akses Operator & Mekanik",
                  desc: "Dirancang khusus untuk operator, teknisi, dan tim maintenance di area produksi.",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-green-700/8 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a1a] leading-snug mb-0.5">{item.title}</p>
                    <p className="text-xs text-[#666666]">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
              <a
                href="#"
                className="group flex items-center gap-2 rounded-full bg-green-700 px-6 py-3 text-sm font-medium text-white shadow-md hover:bg-green-800 transition-all duration-200 hover:shadow-lg"
              >
                <Download size={14} strokeWidth={2.5} />
                Download Aplikasi
              </a>
            </div>

            {/* Trust note */}
            <p className="text-xs text-[#999] font-medium">
              Khusus Tim Operasional PT. Greenfields Indonesia
            </p>

          </div>
        </div>
      </div>

      {/* Phone Image — large, pinned to bottom-right corner */}
      <div className="absolute bottom-0 right-0 z-10 w-[70vw] md:w-[55vw] lg:w-[48vw] xl:w-[42vw] pointer-events-none select-none">
        <img
          src="/mobile-m.png"
          alt="Aplikasi MBG di iPhone"
          className="w-full h-auto object-contain object-bottom drop-shadow-[0_-20px_60px_rgba(37,99,235,0.12)]"
        />
      </div>

    </main>
  );
}
