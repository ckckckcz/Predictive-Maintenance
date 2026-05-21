import Link from "next/link";

export default function NotFound() {
    return (
        <main className="fixed inset-0 z-[9999] flex flex-col items-center w-full min-h-screen overflow-hidden font-sans tracking-tight bg-[#fdfdfd]">
            <div className="absolute top-[0%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#388E3C]/20 blur-[140px] opacity-70 pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#388E3C]/30 blur-[140px] opacity-70 pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#388E3C]/10 blur-[140px] opacity-60 pointer-events-none" />

            {/* SVG Noise Overlay for grainy texture */}
            <div
                className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none z-0"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            ></div>

            {/* Content Container */}
            <div className="relative w-full h-full flex flex-col justify-center items-center z-20 px-4">
                {/* Top Content */}
                <div className="relative flex flex-col items-center text-center mt-[-10vh]">
                    <h1 className="text-[36px] md:text-[44px] font-bold text-green-700 mb-4 tracking-tighter">
                        oops
                    </h1>
                    <p className="text-[15px] md:text-[17px] font-medium text-green-700/90 mb-1 tracking-tight relative z-10">
                        this page doesn't exist.
                    </p>
                    <p className="text-[15px] md:text-[17px] font-medium text-green-700/90 mb-8 tracking-tight relative z-10">
                        let's go back to the home page
                    </p>

                    <Link href="/">
                        <div className="relative cursor-pointer group">
                            <button className="relative z-10 h-[40px] px-6 rounded-md bg-white border border-green-50 text-green-700 text-[13px] font-bold tracking-wide hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-md">
                                Go to home
                            </button>

                            {/* Hand-drawn annotation */}
                            <div className="absolute -left-24 -bottom-10 pointer-events-none flex-col items-end z-20 hidden md:flex">
                                <svg width="42" height="42" viewBox="0 0 100 100" className="mr-8 -mb-1 transform rotate-12" fill="none" stroke="#388E3C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20,100 Q15,40 80,20" />
                                    <path d="M50,15 L80,20 L65,50" />
                                </svg>
                                <span className="text-green-700 font-serif italic text-[16px] -rotate-6 whitespace-nowrap font-medium pr-1">
                                    Please Back Bro
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Bottom Giant Texts Container */}
            <div className="absolute bottom-0 w-full flex justify-center items-end overflow-hidden pb-4 md:pb-0 pointer-events-none h-[60vh] z-0">
                <h2 className="absolute bottom-[-1vh] md:bottom-[-2vh] left-1/2 -translate-x-1/2 text-[35vw] md:text-[27vw] font-serif font-bold leading-[0.8] tracking-tighter text-green-700 opacity-90 whitespace-nowrap mix-blend-overlay">
                    404
                </h2>
            </div>
        </main> 
    );
}
