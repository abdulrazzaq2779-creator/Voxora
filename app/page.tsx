import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Showcase } from "@/components/landing/showcase";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductPreview } from "@/components/landing/product-preview";
import { AiTrust } from "@/components/landing/ai-trust";
import { FinalCta } from "@/components/landing/final-cta";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <TrustStrip />
        <Showcase />
        <Features />
        <div id="for-recruiters" className="scroll-mt-20" />
        <ProductPreview />
        <HowItWorks />
        <AiTrust />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
