'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function CookieBanner() {
  const t = useTranslations('legal.cookies');
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, было ли уже дано согласие
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Показываем баннер через небольшую задержку для лучшего UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-2xl border-t-2 border-primary/20"
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary-dark mb-2">
                  {t('banner.title')}
                </h3>
                <p className="text-sm text-secondary-dark mb-2">
                  {t('banner.description')}
                </p>
                <Link
                  href={`/${locale}/legal`}
                  className="text-sm text-primary hover:underline"
                >
                  {t('banner.learnMore')}
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={declineCookies}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 text-sm font-display font-semibold text-secondary-dark border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  {t('banner.decline')}
                </motion.button>
                <motion.button
                  onClick={acceptCookies}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 text-sm font-display font-semibold text-white bg-gradient-button rounded-xl shadow-glow hover:shadow-glow-lg transition-all"
                >
                  {t('banner.accept')}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

