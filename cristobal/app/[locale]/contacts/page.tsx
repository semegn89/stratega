'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import FloatingInput from '@/components/FloatingInput';

export default function ContactsPage() {
  const t = useTranslations('contacts');
  const locale = useLocale();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    // Here you would typically send the form data to your backend/API
    // For now, we'll simulate a successful submission
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', company: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-20 md:py-28">
        <AnimatedSection>
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-16 text-primary-darkest text-center">
            {t('title')}
          </h1>
        </AnimatedSection>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <AnimatedSection delay={0.1}>
          <div className="space-y-8">
            <section className="bg-gradient-card p-6 rounded-2xl shadow-soft border border-gray-100">
              <h2 className="text-2xl font-display font-semibold mb-4 text-primary-darkest">
                {t('address')}
              </h2>
              <p className="text-secondary-dark text-lg">
                {t('addressValue')}
              </p>
            </section>

            <section className="bg-gradient-card p-6 rounded-2xl shadow-soft border border-gray-100">
              <h2 className="text-2xl font-display font-semibold mb-4 text-primary-darkest">
                {t('phone')}
              </h2>
              <p className="text-secondary-dark text-lg">
                <a href="tel:+359892054451" className="hover:text-primary transition-colors font-medium">
                  {t('phoneValue')}
                </a>
              </p>
            </section>

            <section className="bg-gradient-card p-6 rounded-2xl shadow-soft border border-gray-100">
              <h2 className="text-2xl font-display font-semibold mb-4 text-primary-darkest">
                {t('email')}
              </h2>
              <p className="text-secondary-dark text-lg">
                <a href="mailto:cristobal.eood@gmail.com" className="hover:text-primary transition-colors font-medium">
                  cristobal.eood@gmail.com
                </a>
              </p>
            </section>

          <section className="bg-gradient-card p-6 rounded-2xl shadow-soft border border-gray-100">
            <h2 className="text-2xl font-display font-semibold mb-4 text-primary-darkest">
              Локация
            </h2>
            <div className="rounded-xl overflow-hidden shadow-md" style={{ height: '300px' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2933.5!2d24.3333!3d42.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDEyJzAwLjAiTiAyNMKwMjAnNTkuOSJF!5e0!3m2!1sen!2sbg!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="bg-gradient-card p-8 rounded-2xl shadow-soft border border-gray-100">
            <h2 className="text-3xl font-display font-semibold mb-8 text-primary-darkest">
              {t('form.title')}
            </h2>
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
            <FloatingInput
              id="name"
              name="name"
              type="text"
              label={t('form.name')}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <FloatingInput
              id="company"
              name="company"
              type="text"
              label={t('form.company')}
              value={formData.company}
              onChange={handleChange}
            />

            <FloatingInput
              id="email"
              name="email"
              type="email"
              label={t('form.email')}
              value={formData.email}
              onChange={handleChange}
              required
            />

            <FloatingInput
              id="message"
              name="message"
              label={t('form.message')}
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
            />

            <motion.button
              type="submit"
              disabled={status === 'sending'}
              whileHover={{ scale: status !== 'sending' ? 1.02 : 1 }}
              whileTap={{ scale: status !== 'sending' ? 0.98 : 1 }}
              className="w-full bg-gradient-button text-white px-8 py-4 rounded-xl font-display font-semibold shadow-glow hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ⏳
                  </motion.span>
                  {t('form.sending')}
                </span>
              ) : (
                t('form.send')
              )}
            </motion.button>

            <AnimatePresence>
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-success text-success p-4 rounded-xl font-medium"
                >
                  ✓ {t('form.success')}
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-error text-error p-4 rounded-xl font-medium"
                >
                  ✗ {t('form.error')}
                </motion.div>
              )}
            </AnimatePresence>
            </motion.form>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

