import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Confetti from 'react-confetti';

type CelebrationConfettiProps = {
  active: boolean;
  burstKey: number;
};

const CONFETTI_COLORS = ['#bfd1ab', '#d9c79d', '#8ba394', '#f1efe5', '#7f9b71', '#f3a86e', '#ff8ea3', '#6ec5b8', '#f5dd6b'];

export function CelebrationConfetti({ active, burstKey }: CelebrationConfettiProps) {
  const [{ width, height }, setWindowSize] = useState(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight
  }));

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);

    return () => {
      window.removeEventListener('resize', updateWindowSize);
    };
  }, []);

  if (!active || !width || !height || typeof document === 'undefined') {
    return null;
  }

  const isDesktop = width >= 1024;

  return createPortal(
    <div key={burstKey} className="pointer-events-none fixed inset-0 z-[160]" aria-hidden="true">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={isDesktop ? 520 : 420}
        gravity={isDesktop ? 0.14 : 0.22}
        initialVelocityX={isDesktop ? 11 : 9}
        initialVelocityY={isDesktop ? 36 : 24}
        tweenDuration={isDesktop ? 180 : 120}
        colors={CONFETTI_COLORS}
        confettiSource={{
          x: width / 2 - (isDesktop ? 18 : 8),
          y: height + (isDesktop ? 18 : 8),
          w: isDesktop ? 36 : 16,
          h: 0
        }}
      />
    </div>,
    document.body
  );
}
