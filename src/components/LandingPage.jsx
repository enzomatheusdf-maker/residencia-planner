import React, { useEffect } from "react";
import { MotionConfig } from "framer-motion";

import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";
import ChaosSection from "./landing/ChaosSection";
import BeforeAfter from "./landing/BeforeAfter";
import HowItThinks from "./landing/HowItThinks";
import FeatureShowcase from "./landing/FeatureShowcase";
import Method from "./landing/Method";
import BetaSection from "./landing/BetaSection";
import Audience from "./landing/Audience";
import Transparency from "./landing/Transparency";
import Faq from "./landing/Faq";
import FinalCta from "./landing/FinalCta";
import Footer from "./landing/Footer";

export default function LandingPage({ onLogin, onSignup }) {
  useEffect(() => {
    document.title = "MedRev — Sistema operacional de estudos para Medicina";
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-hidden bg-[#05070d] text-white">
        <Navbar onLogin={onLogin} onSignup={onSignup} />
        <main id="topo">
          <Hero onLogin={onLogin} onSignup={onSignup} />
          <ChaosSection />
          <BeforeAfter />
          <HowItThinks />
          <FeatureShowcase />
          <Method />
          <BetaSection onSignup={onSignup} />
          <Audience />
          <Transparency />
          <Faq />
          <FinalCta onSignup={onSignup} />
        </main>
        <Footer onLogin={onLogin} onSignup={onSignup} />
      </div>
    </MotionConfig>
  );
}
