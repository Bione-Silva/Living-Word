import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { Mic, ArrowRight } from 'lucide-react';
import podiumImg from '@/assets/podium-mode-promo.png';

type L = 'PT' | 'EN' | 'ES';

const copy = {
  tag: { PT: 'MODO PÓDIO', EN: 'PODIUM MODE', ES: 'MODO PODIO' },
  h2: { PT: 'Pregue sem distrações', EN: 'Preach without distractions', ES: 'Predica sin distracciones' },
  sub: {
    PT: 'Esqueça a bagunça das anotações em papel — o Modo Pódio transforma seu tablet no teleprompter inteligente perfeito. Transmita sua mensagem de forma impecável, com total clareza à sua frente.',
    EN: 'Forget messy paper notes — Podium Mode transforms your tablet into the perfect smart teleprompter. Deliver your message flawlessly, with total clarity in front of you.',
    ES: 'Olvida el desorden de las notas en papel — el Modo Podio transforma tu tablet en el teleprompter inteligente perfecto. Transmite tu mensaje de forma impecable, con total claridad frente a ti.',
  },
  cta: { PT: 'Desbloquear Modo Pódio', EN: 'Unlock Podium Mode', ES: 'Desbloquear Modo Podio' },
  link: { PT: 'Saiba Mais Sobre O Modo Pódio', EN: 'Learn More About Podium Mode', ES: 'Más Sobre El Modo Podio' },
};

export function PodiumModePromoBlock({ lang }: { lang: L }) {
  const { ref: leftRef, isVisible: leftVisible } = useScrollReveal<HTMLDivElement>(0.15);
  const { ref: rightRef, isVisible: rightVisible } = useScrollReveal<HTMLDivElement>(0.15);

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-8 overflow-hidden" style={{ background: '#FAFAFA' }}>
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Left — Image */}
        <div
          ref={leftRef}
          className="flex-1 w-full max-w-xl lg:max-w-none"
          style={{
            opacity: leftVisible ? 1 : 0,
            transform: leftVisible ? 'translateX(0)' : 'translateX(-40px)',
            transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
          }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ boxShadow: '0 25px 60px -12px rgba(61,43,31,0.18)' }}>
            <img
              src={podiumImg}
              alt="Modo Pódio — teleprompter inteligente para pregadores"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right — Text */}
        <div
          ref={rightRef}
          className="flex-1 max-w-lg"
          style={{
            opacity: rightVisible ? 1 : 0,
            transform: rightVisible ? 'translateX(0)' : 'translateX(40px)',
            transition: 'opacity 0.7s ease-out 0.15s, transform 0.7s ease-out 0.15s',
          }}
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: '#EDD9C8' }}>
            <Mic className="h-5 w-5" style={{ color: '#6B4F3A' }} />
          </div>

          {/* Tag */}
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: '#5B7FD4' }}>
            {copy.tag[lang]}
          </p>

          {/* Heading */}
          <h2 className="font-display text-[28px] sm:text-[40px] font-bold leading-[1.15] mb-5" style={{ color: '#1A1A1A' }}>
            {copy.h2[lang]}
          </h2>

          {/* Subtitle */}
          <p className="text-[15px] sm:text-[16px] leading-[1.7] mb-8" style={{ color: '#555555' }}>
            {copy.sub[lang]}
          </p>

          {/* CTA Button */}
          <Link
            to="/upgrade"
            className="inline-flex items-center gap-2.5 font-semibold text-[14px] px-7 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #C4956A 0%, #D4A87A 100%)',
              color: '#1E1510',
              boxShadow: '0 4px 20px rgba(196,149,106,0.35)',
            }}
          >
            {copy.cta[lang]}
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Text link */}
          <div className="mt-5">
            <Link
              to="/upgrade"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors hover:opacity-80"
              style={{ color: '#5B7FD4' }}
            >
              {copy.link[lang]}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
