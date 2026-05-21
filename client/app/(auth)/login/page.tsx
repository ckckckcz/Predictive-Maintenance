import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
    return (
        <div className="w-full min-h-screen grid lg:grid-cols-2">
            <LoginForm />
            <div className="hidden bg-muted lg:block relative overflow-hidden h-full min-h-screen">
                <div className="absolute inset-0 bg-green-900">
                    <Image
                        src="/factory.png"
                        alt="Image"
                        width={1920}
                        height={1080}
                        className="h-full w-full object-cover opacity-60 mix-blend-overlay grayscale contrast-125"
                        style={{ objectPosition: "center" }}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="absolute bottom-12 left-12 right-12 text-white z-20">
                    <div className="flex -space-x-3 mb-2">
                        {["aidan", "caleb", "avery", "brian"].map((seed) => (
                            <div key={seed} className="w-10 h-10 rounded-full border-2 border-green-900 bg-gray-200 overflow-hidden relative">
                                <Image
                                    src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`}
                                    alt={`Avatar ${seed}`}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ))}
                        <div className="h-10 px-3 rounded-full border-2 border-green-900 bg-white/10 backdrop-blur-sm flex items-center text-xs font-semibold">
                            Dipercaya oleh 10rb+
                        </div>
                    </div>
                    <h2 className="text-5xl font-medium tracking-tight mb-2 leading-tight">
                        Dari Lahan ke Meja,<br /> Berbasis Data.
                    </h2>
                    <p className="text-gray-300 font-medium text-md max-w-lg">
                        Jelajahi wawasan operasional Greenfields Indonesia. Data real-time untuk keputusan yang tepat.
                    </p>
                </div>
            </div>
        </div>
    )
}
