import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import {
  Download,
  ShieldCheck,
  Smartphone,
  Monitor,
  Info,

  Clock,
  Calendar,
  Cpu,
  File,
  Layers,
  Wrench,
  ChevronRight,
 } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { cn } from '@/lib/utils';

const windowsDownloadUrl = '/windows/homechit_0.1.0_x64-setup.exe';
const androidDownloadUrl = '/apk/homechit.apk';

function triggerDownload(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


type WhatNewFeature = { title: string; description?: string };
type VersionNote = { version: string; releaseDate: string; downloadUrl: string };

type Platform = 'windows' | 'android';

function useDevicePlatformDetect() {
  const [platform, setPlatform] = useState<Platform>('windows');

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);

    if (isAndroid) setPlatform('android');
    else if (isMobile) {
      // Default to windows for unknown mobile
      setPlatform('windows');
    }
  }, []);

  return platform;
}

function formatFileSize(size: string) {
  return size;
}

// Note: Windows icon was replaced with Monitor because lucide-react
// does not export a Windows icon in this project.


const FAQ = [
  {
    q: 'Is HomeChit free?',
    a: 'HomeChit offers a free download for both Windows and Android. Some advanced features may require sign-in depending on your deployment.',
  },
  {
    q: 'How to install APK?',
    a: 'Before installing, enable “Install from Unknown Sources” on your Android device. Then open the APK file and follow the installation prompts.',
  },
  {
    q: 'How to update software?',
    a: 'Download the latest release from this page. On Windows, re-run the .EXE installer. On Android, install the updated APK over the existing app.',
  },
  {
    q: 'Is my data secure?',
    a: 'HomeChit uses secure authentication and encrypted connections for data transfer. Always download from official URLs to avoid tampered files.',
  },
] as const;

export function DownloadCenterPage() {
  const platform = useDevicePlatformDetect();

  const latestStableVersion = 'v0.1.0';
  const latestBuildDate = useMemo(() => {
    // Mock build date (keep deterministic for UI)
    return '2026-05-15';
  }, []);

  const windows = useMemo(
    () => ({
      title: 'HomeChit for Windows',
      version: latestStableVersion,
      architecture: '64-bit',
      installerType: '.EXE Setup',
      fileSize: '42.7 MB',
      releaseDate: latestBuildDate,
      supported: 'Windows 10/11 supported',
      icon: Monitor,
      downloadUrl: windowsDownloadUrl,
    }),
    [latestStableVersion, latestBuildDate],
  );

  const android = useMemo(
    () => ({
      title: 'HomeChit Android App',
      version: latestStableVersion,
      apkSize: '28.3 MB',
      releaseDate: latestBuildDate,
      supported: 'Android 9+ supported',
      icon: Smartphone,
      downloadUrl: androidDownloadUrl,
    }),
    [latestStableVersion, latestBuildDate],
  );

  const orderedCards = useMemo(() => {
    return platform === 'android' ? [android, windows] : [windows, android];
  }, [platform, android, windows]);

  const whatsNew = useMemo(() => {
    const features: WhatNewFeature[] = [
      { title: 'Google authentication improvements' },
      { title: 'Faster dashboard loading' },
      { title: 'UI performance improvements' },
      { title: 'Bug fixes & stability updates' },
    ];
    return {
      heading: `What's New in ${latestStableVersion}`,
      buildDate: latestBuildDate,
      features,
    };
  }, [latestBuildDate, latestStableVersion]);

  const previousVersions = useMemo<VersionNote[]>(
    () => [
      {
        version: 'v0.0.9',
        releaseDate: '2026-04-11',
        downloadUrl: '/windows/homechit_0.0.9_x64-setup.exe',
      },
      {
        version: 'v0.0.8',
        releaseDate: '2026-03-22',
        downloadUrl: '/windows/homechit_0.0.8_x64-setup.exe',
      },
      {
        version: 'v0.0.7',
        releaseDate: '2026-02-28',
        downloadUrl: '/windows/homechit_0.0.7_x64-setup.exe',
      },
    ],
    [],
  );

  const systemRequirements = useMemo(
    () => ({
      windows: [
        { label: 'Windows', value: 'Windows 10/11' },
        { label: 'Processor', value: '64-bit processor' },
        { label: 'Memory', value: '4GB RAM recommended' },
        { label: 'Connectivity', value: 'Internet connection required' },
      ],
      android: [
        { label: 'OS', value: 'Android 9+' },
        { label: 'Storage', value: 'Minimum storage requirements (install size + cache)' },
        { label: 'Security', value: 'Enable “Install from Unknown Sources” before APK install' },
      ],
    }),
    [],
  );

  return (
    <div className="relative min-h-screen bg-[#060812] text-slate-100 overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-[420px] -left-28 h-[420px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-220px] h-[520px] w-[720px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="pt-20 sm:pt-24 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]" />
                Lightweight Software
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Verified Secure Download
              </span>
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
              Download <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">HomeChit</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
              Download the latest version of HomeChit for Windows and Android.
              Fast, secure, lightweight, and optimized for business management.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-500/15 border border-blue-400/20 p-2">
                    <Calendar className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-semibold">Latest Stable Version</p>
                    <p className="text-lg font-black">{latestStableVersion}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-500/15 border border-indigo-400/20 p-2">
                    <Clock className="h-5 w-5 text-indigo-200" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-semibold">Build date</p>
                    <p className="text-lg font-black">{latestBuildDate}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/20 p-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-semibold">Verified Secure Download</p>
                    <p className="text-lg font-black">Trusted release</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="mt-10">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-4 sm:px-6 py-5 shadow-[0_30px_90px_rgba(2,6,23,0.5)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-2xl bg-white/5 border border-white/10 p-2">
                    <Info className="h-5 w-5 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Auto Device Detect</p>
                    <p className="text-sm text-slate-300">
                      {platform === 'android'
                        ? 'You’re on Android — the APK card is highlighted first.'
                        : 'You’re on a Windows-like device — the EXE card is highlighted first.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                    <div className="h-2 w-2 rounded-full bg-sky-400" />
                    <span className="text-xs font-semibold text-slate-200">Premium glass UI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('download-section');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-100 shadow-[0_18px_40px_rgba(2,6,23,0.35)] hover:bg-white/15 transition active:scale-[0.99]"
                  >
                    <Download className="h-4 w-4" />
                    Jump to Downloads
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DOWNLOAD CARDS */}
        <section id="download-section" className="pb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orderedCards.map((card, idx) => {
                const isAndroid = 'apkSize' in card;
                const isPrimary =
                  (platform === 'android' && isAndroid) || (platform === 'windows' && !isAndroid);

                const Icon = card.icon;

                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: idx * 0.05 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-[0_40px_120px_rgba(2,6,23,0.45)]',
                      isPrimary &&
                        'border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-white/5 to-emerald-500/10'
                    )}
                  >
                    <div className="absolute inset-0 -z-10">
                      <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
                      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <Icon className="h-7 w-7 text-slate-100" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black tracking-tight">{card.title}</h3>
                          <p className="mt-1 text-sm text-slate-300">Latest release: {card.version}</p>
                        </div>
                      </div>
                      {isPrimary && (
                        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100">
                          Recommended
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                          <Layers className="h-4 w-4 text-sky-200" />
                          <p className="text-xs font-semibold text-slate-200">Latest version</p>
                        </div>
                        <p className="mt-2 text-sm font-black text-slate-100">{card.version}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                          <File className="h-4 w-4 text-emerald-200" />
                          <p className="text-xs font-semibold text-slate-200">
                            {isAndroid ? 'APK size' : 'Installer size'}
                          </p>
                        </div>
                        <p className="mt-2 text-sm font-black text-slate-100">
                          {isAndroid ? formatFileSize((card as any).apkSize) : formatFileSize((card as any).fileSize)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-indigo-200" />
                          <p className="text-xs font-semibold text-slate-200">Release date</p>
                        </div>
                        <p className="mt-2 text-sm font-black text-slate-100">{card.releaseDate}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-3">
                          <Cpu className="h-4 w-4 text-slate-200" />
                          <p className="text-xs font-semibold text-slate-200">
                            {isAndroid ? 'Supported' : 'Architecture'}
                          </p>
                        </div>
                        <p className="mt-2 text-sm font-black text-slate-100">
                          {isAndroid ? (card as any).supported : (card as any).architecture}
                        </p>
                      </div>

                      {!isAndroid && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                          <div className="flex items-center gap-3">
                            <Wrench className="h-4 w-4 text-slate-200" />
                            <p className="text-xs font-semibold text-slate-200">Installer type</p>
                          </div>
                          <p className="mt-2 text-sm font-black text-slate-100">
                            {(card as any).installerType}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <button
                        type="button"
                        className={cn(
                          'w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-[0_24px_60px_rgba(2,6,23,0.35)] transition active:scale-[0.99]',
                          isAndroid
                            ? 'bg-emerald-500/90 hover:bg-emerald-500 text-black'
                            : 'bg-sky-400/90 hover:bg-sky-400 text-black'
                        )}
                        onClick={() => {
                          triggerDownload((card as any).downloadUrl);
                        }}

                      >
                        <Download className="h-4 w-4" />
                        {isAndroid ? 'Download APK' : 'Download for Windows'}
                      </button>

                      {!isAndroid ? (
                        <p className="mt-3 text-xs text-slate-300">
                          {(card as any).supported}
                        </p>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center">
                              <Info className="h-4 w-4 text-amber-200" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-amber-200">Install warning</p>
                              <p className="mt-1 text-xs text-amber-100/90 leading-relaxed">
                                Enable “Install from Unknown Sources” before installing APK.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* WHATS NEW */}
        <section className="pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 shadow-[0_40px_120px_rgba(2,6,23,0.35)]">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    <SparkleIcon />
                    Release notes
                  </div>
                  <h2 className="mt-4 text-2xl md:text-3xl font-black">{whatsNew.heading}</h2>
                  <p className="mt-2 text-slate-300">Built on {whatsNew.buildDate}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {whatsNew.features.map((f) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-blue-200" />
                      </div>
                      <div>
                        <p className="text-sm font-black">{f.title}</p>
                        {f.description ? (
                          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                            {f.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* PREVIOUS VERSIONS */}
        <section className="pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-[0_40px_120px_rgba(2,6,23,0.35)] sticky top-24">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    <Info className="h-3.5 w-3.5" />
                    Legacy releases
                  </div>
                  <h2 className="mt-4 text-2xl font-black">Previous Versions</h2>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Prefer an older build? Download from the list below.
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-slate-200">Tip</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Use the latest stable version for the best performance and security.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {previousVersions.map((v, idx) => (
                  <motion.div
                    key={v.version}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.35, delay: idx * 0.03 }}
                    className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-[0_20px_60px_rgba(2,6,23,0.25)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Version</p>
                        <p className="mt-1 text-xl font-black">{v.version}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-200">
                        {v.releaseDate}
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-slate-300">Choose your build</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-100">
                        <Download className="h-4 w-4 text-sky-200" />
                        Download
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm font-black text-slate-100 hover:bg-white/15 transition active:scale-[0.99]"
                      onClick={() => {
                        triggerDownload(v.downloadUrl);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* SYSTEM REQUIREMENTS */}
        <section className="pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 shadow-[0_40px_120px_rgba(2,6,23,0.35)]"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black">System Requirements</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Ensure a smooth installation and optimal business performance.
                </p>
              </div>
              <div className="mt-2 md:mt-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Verified builds
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <Monitor className="h-6 w-6 text-sky-200" />

                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">Windows</p>
                    <p className="text-xs text-slate-300">Recommended setup</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {systemRequirements.windows.map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold text-slate-300">{r.label}</p>
                      <p className="text-sm font-black text-slate-100 text-right">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <Smartphone className="h-6 w-6 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">Android</p>
                    <p className="text-xs text-slate-300">Smooth installation</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {systemRequirements.android.map((r) => (
                    <div key={r.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold text-slate-300">{r.label}</p>
                      <p className="text-sm font-black text-slate-100 text-right">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* NEED HELP INSTALLING */}
        <section className="pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 shadow-[0_40px_120px_rgba(2,6,23,0.35)]"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black">Need Help Installing?</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Step-by-step guidance for a hassle-free setup.
                </p>
              </div>
              <div className="mt-2 md:mt-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-200">
                <Wrench className="h-3.5 w-3.5 text-slate-200" />
                Quick guides
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <p className="text-sm font-bold text-slate-100">How to install APK</p>
                <ol className="mt-3 space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-300/20 text-emerald-200 text-xs font-black">1</span>
                    <span>Download the APK from this page.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-300/20 text-emerald-200 text-xs font-black">2</span>
                    <span>Enable “Install from Unknown Sources” on your device settings.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-300/20 text-emerald-200 text-xs font-black">3</span>
                    <span>Open the APK and tap Install. Grant permissions if prompted.</span>
                  </li>
                </ol>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <p className="text-sm font-bold text-slate-100">How to install Windows EXE</p>
                <ol className="mt-3 space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 border border-sky-300/20 text-sky-200 text-xs font-black">1</span>
                    <span>Download the latest .EXE installer from the Windows card.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 border border-sky-300/20 text-sky-200 text-xs font-black">2</span>
                    <span>Run the installer and follow the on-screen prompts.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 border border-sky-300/20 text-sky-200 text-xs font-black">3</span>
                    <span>Complete setup and launch HomeChit for the first time.</span>
                  </li>
                </ol>
              </div>

              <div className="md:col-span-2 rounded-3xl border border-white/10 bg-black/15 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-100">Update software</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Always install updates from official URLs for improved security and stability.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                      <p className="text-xs text-slate-300">Latest</p>
                      <p className="text-sm font-black">{latestStableVersion}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('download-section');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-black text-slate-100 hover:bg-white/15 transition active:scale-[0.99]"
                    >
                      <Download className="h-4 w-4" />
                      Download Updates
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section className="pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 shadow-[0_40px_120px_rgba(2,6,23,0.35)]">
              <div>
                <h2 className="text-2xl md:text-3xl font-black">FAQ</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Everything you need to know about downloads and installation.
                </p>
              </div>

              <div className="mt-6">
                <Accordion type="single" collapsible className="w-full">
                  {FAQ.map((item, idx) => (
                    <motion.div
                      key={item.q}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.35, delay: idx * 0.03 }}
                    >
                      <AccordionItem
                        value={`faq-${idx}`}
                        className="border-white/10"
                      >
                        <AccordionTrigger className="text-slate-100 hover:text-slate-50">
                          <span className="font-bold">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-300">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </div>
            </div>
          </motion.div>
        </section>

        <footer className="pb-10">
          <div className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} HomeChit — Premium Download Center
          </div>
        </footer>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 0.833333L9.05333 4.28L12.5 5.33333L9.05333 6.38667L8 9.83333L6.94667 6.38667L3.5 5.33333L6.94667 4.28L8 0.833333Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12.1667 9.16667L12.7317 10.95L14.5 11.5L12.7317 12.05L12.1667 13.8333L11.6017 12.05L9.83337 11.5L11.6017 10.95L12.1667 9.16667Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}

