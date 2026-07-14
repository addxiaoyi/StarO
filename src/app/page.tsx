"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo - 星芒旋转入场
      gsap.from(".logo-outer", { scale: 0, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from(".logo-txt", { opacity: 0, x: -10, duration: 0.4, delay: 0.3 });

      // Nav
      gsap.from(".nav-item", { y: -12, opacity: 0, duration: 0.4, stagger: 0.06, delay: 0.6 });

      // Hero
      gsap.from(".badge", { y: 15, opacity: 0, duration: 0.5, delay: 0.8 });
      gsap.from(".line1", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.9 });
      gsap.from(".line2", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", delay: 1.0 });
      gsap.from(".grad-text", { backgroundPosition: "200% 50%", duration: 1.2, delay: 1.1 });
      gsap.from(".desc", { y: 20, opacity: 0, duration: 0.5, delay: 1.2 });
      gsap.from(".cta-group", { y: 15, opacity: 0, duration: 0.4, delay: 1.3 });

      // Ambient
      gsap.to(".glow-1", { scale: 1.1, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".glow-2", { x: 30, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2 });
      gsap.to(".scroll-dot", { y: 8, opacity: 0.5, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut" });

      // Sections
      gsap.from(".section-label", { x: -20, opacity: 0, duration: 0.4, scrollTrigger: { trigger: ".features", start: "top 80%" } });
      gsap.from(".section-title", { y: 30, opacity: 0, duration: 0.6, scrollTrigger: { trigger: ".features", start: "top 80%" } });
      gsap.from(".card", { y: 40, opacity: 0, duration: 0.5, stagger: 0.08, scrollTrigger: { trigger: ".features", start: "top 75%" } });

      gsap.from(".oauth-visual", { x: -50, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ".oauth-section", start: "top 75%" } });
      gsap.from(".oauth-content", { x: 50, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ".oauth-section", start: "top 75%" } });

      gsap.from(".stat-item", { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, scrollTrigger: { trigger: ".stats", start: "top 75%" } });

      gsap.from(".feature-row", { x: 50, opacity: 0, duration: 0.4, stagger: 0.06, scrollTrigger: { trigger: ".feature-list", start: "top 75%" } });

      gsap.from(".cta-logo-wrap", { scale: 0, duration: 0.8, ease: "elastic.out(1, 0.5)", scrollTrigger: { trigger: ".cta-section", start: "top 80%" } });
      gsap.from(".cta-h1", { y: 40, opacity: 0, duration: 0.6, scrollTrigger: { trigger: ".cta-section", start: "top 80%" } });
      gsap.from(".cta-h2", { y: 40, opacity: 0, duration: 0.6, scrollTrigger: { trigger: ".cta-section", start: "top 80%" } });
      gsap.from(".cta-body", { y: 20, opacity: 0, duration: 0.4, scrollTrigger: { trigger: ".cta-section", start: "top 80%" } });

      gsap.from(".footer-content", { y: 8, opacity: 0, duration: 0.3, scrollTrigger: { trigger: "footer", start: "top 95%" } });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020208] text-[#e0e0e8] overflow-x-hidden">

      {/* ========== 背景层 ========== */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#020208] via-[#050510] to-[#020208]" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[700px]">
        <div className="glow-1 w-full h-full bg-gradient-to-b from-blue-600/15 via-indigo-600/8 to-transparent rounded-full blur-[160px]" />
      </div>
      <div className="fixed top-1/3 right-1/4 w-[500px] h-[500px]">
        <div className="glow-2 w-full h-full bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[120px]" />
      </div>
      <div className="fixed inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(96,165,250,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.4) 1px, transparent 1px)', backgroundSize: '80px 80px' }}
      />

      {/* ========== 导航 ========== */}
      <header className="relative z-50 fixed top-0 w-full px-5 py-4 sm:px-16 sm:py-6">
        <nav className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Logo - 抽象 X */}
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              {/* 渐变背景圆 */}
              <circle cx="16" cy="16" r="14" fill="url(#nav-bg)"/>
              {/* 抽象 X - 两条渐变线条 */}
              <path
                className="logo-outer"
                d="M10 10L22 22M22 10L10 22"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="nav-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="50%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-txt text-[15px] font-semibold tracking-[0.06em] text-white">StarX</span>
          </div>

          {/* 链接 */}
          <div className="flex items-center gap-4 text-[12px] sm:gap-10 sm:text-[13px]">
            <Link href="/dashboard" className="nav-item text-[#686878] hover:text-white transition-colors duration-200">账号</Link>
            <Link href="/admin" className="nav-item text-[#686878] hover:text-white transition-colors duration-200">管理</Link>
            <Link href="/applications" className="nav-item text-[#686878] hover:text-white transition-colors duration-200">接入</Link>
            <Link href="/sign-in" className="nav-item px-4 py-2.5 bg-white text-[#020208] rounded-full font-medium hover:bg-[#f5f5fa] transition-all duration-200 sm:ml-4 sm:px-5">
              登录
            </Link>
          </div>
        </nav>
      </header>

      {/* ========== Hero ========== */}
      <section className="relative min-h-[78svh] flex flex-col justify-end px-6 pb-10 pt-24 sm:min-h-screen sm:px-16 sm:pb-36 sm:pt-0">
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#020208] via-[#020208]/50 to-transparent" />

        <div className="relative max-w-4xl">
          {/* Badge */}
          <div className="badge mb-6 inline-flex items-center gap-3 rounded-full border border-[#1a1a2a] bg-[#0c0c18]/90 px-5 py-2.5 backdrop-blur-xl sm:mb-14">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-[#585870] tracking-[0.12em] uppercase">安全认证</span>
            <span className="text-[#252538] mx-2">|</span>
            <span className="text-[10px] text-[#585870] tracking-[0.12em] uppercase">开源免费</span>
          </div>

          {/* 标题 */}
          <h1 className="mb-6 text-[54px] font-semibold leading-[0.9] tracking-[0] sm:mb-12 sm:text-[clamp(64px,12vw,150px)]">
            <span className="line1 block text-white">你的账号</span>
            <span className="line2 grad-text block bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-300 bg-[length:200%_auto] bg-clip-text text-transparent">安全中心</span>
          </h1>

          {/* 描述 */}
          <p className="desc mb-7 max-w-lg text-[15px] leading-[1.7] text-[#505065] sm:mb-14 sm:text-[17px] sm:leading-[1.85]">
            统一身份认证，集中授权管理。
            <br />为每一个应用保驾护航。
          </p>

          {/* CTA */}
          <div className="cta-group flex items-center gap-4 sm:gap-8">
            <Link href="/sign-up" className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-[#020208] rounded-full text-[14px] font-medium hover:bg-[#f5f5fa] transition-all duration-200">
              开始使用
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </Link>
            <Link href="/sign-in" className="text-[14px] text-[#505065] hover:text-white transition-colors duration-200">
              已有账号，登录
            </Link>
          </div>
        </div>

        {/* 滚动指示 */}
        <div className="absolute bottom-16 right-20 hidden flex-col items-center gap-3 sm:flex">
          <span className="text-[8px] tracking-[0.3em] text-[#252535] uppercase">Scroll</span>
          <div className="relative w-px h-14 bg-gradient-to-b from-[#1e1e2e] to-transparent">
            <div className="scroll-dot absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* ========== Section 2: 功能 ========== */}
      <section className="features relative border-t border-[#0c0c18] px-6 py-16 sm:px-16 sm:py-40">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-12 gap-20 items-start">
            {/* 左侧 */}
            <div className="col-span-4">
              <p className="section-label text-[9px] tracking-[0.3em] text-[#383848] uppercase mb-6">01 / 认证</p>
              <h2 className="section-title text-[42px] font-medium tracking-tight text-white leading-[1.1] mb-5">多重验证</h2>
              <p className="text-[14px] text-[#484858] leading-[1.8]">支持多种认证方式，为你的账号构建多层防护体系。</p>
            </div>

            {/* 右侧卡片 */}
            <div className="col-span-8 grid grid-cols-2 gap-5">
              {[
                { num: "01", name: "邮箱登录", desc: "密码与邮箱验证码双重确认机制" },
                { num: "02", name: "验证器应用", desc: "每次登录都能多一步确认" },
                { num: "03", name: "Passkey", desc: "WebAuthn 标准，硬件级安全保障" },
                { num: "04", name: "OAuth", desc: "支持主流第三方平台联合登录" },
              ].map(({ num, name, desc }) => (
                <div key={name} className="card group p-7 rounded-xl bg-gradient-to-b from-[#0e0e1a] to-[#08080f] border border-[#181828] hover:border-[#282848] transition-all duration-300 cursor-pointer">
                  <p className="text-[9px] tracking-[0.2em] text-[#303040] mb-4">{num}</p>
                  <h3 className="text-[16px] font-medium text-white mb-2 group-hover:translate-x-1 transition-transform duration-200">{name}</h3>
                  <p className="text-[12px] text-[#505060] leading-[1.6]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== Section 3: OAuth ========== */}
      <section className="oauth-section relative px-16 py-40 border-t border-[#0c0c18]">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-blue-600/6 to-purple-600/4 rounded-full blur-[180px]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-12 gap-20 items-center">
            {/* 左侧视觉 */}
            <div className="oauth-visual col-span-7">
              <div className="relative rounded-xl bg-gradient-to-b from-[#0e0e1a] to-[#08080f] border border-[#181830] p-8">
                {/* 头部 */}
                <div className="flex items-center gap-5 pb-5 border-b border-[#141424]">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
                      <circle cx="16" cy="16" r="6" fill="white" fillOpacity="0.3" />
                      <circle cx="14" cy="14" r="2" fill="white" fillOpacity="0.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-white">StarApp</p>
                    <p className="text-[12px] text-[#505060]">star-app.example.com</p>
                  </div>
                </div>

                {/* 权限 */}
                <div className="py-6 space-y-3">
                  <p className="text-[9px] text-[#383848] tracking-[0.15em] uppercase mb-4">请求以下权限</p>
                  {["读取用户资料", "管理邮箱地址", "访问头像"].map((name) => (
                    <div key={name} className="flex items-center justify-between py-3 px-4 rounded-lg bg-[#06060c] border border-[#101018]">
                      <span className="text-[14px] text-[#808088]">{name}</span>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2 6.5L5 9.5L11 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[12px]">已授权</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 pt-4 border-t border-[#141424]">
                  <button className="flex-1 py-3.5 bg-white text-[#020208] rounded-lg text-[14px] font-medium hover:bg-[#f5f5f8] transition-colors duration-200">授权</button>
                  <button className="flex-1 py-3.5 bg-[#10101a] text-[#606068] rounded-lg text-[14px] hover:bg-[#141420] transition-colors duration-200">拒绝</button>
                </div>
              </div>
            </div>

            {/* 右侧文字 */}
            <div className="oauth-content col-span-5">
              <p className="section-label text-[9px] tracking-[0.3em] text-[#383848] uppercase mb-6">02 / 授权</p>
              <h2 className="section-title text-[42px] font-medium tracking-tight text-white leading-[1.1] mb-5">应用接入</h2>
              <p className="text-[14px] text-[#484858] leading-[1.8] mb-8">OAuth 2.0 + OpenID Connect 标准协议，权限透明可查。</p>
              <div className="flex gap-6">
                <div className="p-4 rounded-lg bg-[#0a0a14] border border-[#141424]">
                  <p className="text-[13px] font-medium text-white mb-1">OAuth 2.0</p>
                  <p className="text-[11px] text-[#404050]">行业标准协议</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0a0a14] border border-[#141424]">
                  <p className="text-[13px] font-medium text-white mb-1">OIDC</p>
                  <p className="text-[11px] text-[#404050]">身份认证标准</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Section 4: 统计 ========== */}
      <section className="stats relative px-16 py-40 border-t border-[#0c0c18]">
        <div className="max-w-5xl mx-auto">
          <p className="section-label text-[9px] tracking-[0.3em] text-[#383848] uppercase mb-12">03 / 数据</p>

          <div className="grid grid-cols-3 gap-6">
            {[
              { num: "99.9", unit: "%", label: "可用性", desc: "全年运行保障" },
              { num: "50", unit: "ms", label: "响应速度", desc: "平均认证延迟" },
              { num: "256", unit: "-bit", label: "加密等级", desc: "AES端到端加密" },
            ].map(({ num, unit, label, desc }) => (
              <div key={label} className="stat-item group p-10 rounded-xl bg-gradient-to-b from-[#0a0a12] to-[#060608] border border-[#121220] hover:border-[#1e1e30] transition-all duration-300">
                <p className="text-[48px] font-light tracking-tight text-white leading-none">{num}<span className="text-[22px] text-[#404050]">{unit}</span></p>
                <p className="text-[15px] font-medium text-[#888890] mt-4 group-hover:text-white transition-colors">{label}</p>
                <p className="text-[12px] text-[#404050] mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Section 5: 功能列表 ========== */}
      <section className="feature-list relative px-16 py-40 border-t border-[#0c0c18]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-12 gap-20">
            <div className="col-span-4">
              <p className="section-label text-[9px] tracking-[0.3em] text-[#383848] uppercase mb-6">04 / 特性</p>
              <h2 className="section-title text-[42px] font-medium tracking-tight text-white leading-[1.1]">核心功能</h2>
            </div>

            <div className="col-span-8 rounded-xl bg-[#08080f] border border-[#101018] overflow-hidden">
              {[
                { num: "01", title: "单点登录", desc: "一次登录，访问所有已接入应用" },
                { num: "02", title: "会话管理", desc: "查看并管理所有活跃会话" },
                { num: "03", title: "安全日志", desc: "完整的登录历史和操作记录" },
                { num: "04", title: "组织管理", desc: "创建团队，分配角色，管理成员" },
                { num: "05", title: "API 接入", desc: "提供 RESTful API 和 SDK" },
              ].map(({ num, title, desc }) => (
                <div key={title} className="feature-row group flex items-center justify-between py-5 px-8 hover:bg-[#0c0c18] transition-colors duration-200 cursor-pointer border-b border-[#0e0e18] last:border-b-0">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] text-[#2a2a3a] font-mono w-5">{num}</span>
                    <span className="text-[14px] text-[#909098] group-hover:text-white transition-colors duration-200">{title}</span>
                  </div>
                  <span className="text-[12px] text-[#404048] group-hover:text-[#585860] transition-colors duration-200">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="cta-section relative px-16 py-52 border-t border-[#0c0c18]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/10 to-transparent rounded-full blur-[200px]" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="cta-logo-wrap inline-flex items-center justify-center mb-12">
            <svg width="80" height="80" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="url(#cta-ring)" strokeWidth="0.75" fill="none" opacity="0.3" />
              <circle cx="16" cy="16" r="10" fill="url(#cta-fill)" />
              <circle cx="13" cy="13" r="2.5" fill="white" fillOpacity="0.4" />
              <defs>
                <linearGradient id="cta-ring" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#818cf8" />
                </linearGradient>
                <radialGradient id="cta-fill" cx="30%" cy="30%" r="70%" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          <h2 className="text-[clamp(48px,9vw,96px)] font-medium tracking-tight leading-[1] mb-6">
            <span className="cta-h1 block text-white">准备好</span>
            <span className="cta-h2 grad-text block bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-300 bg-[length:200%_auto] bg-clip-text text-transparent">开始了吗</span>
          </h2>

          <p className="cta-body text-[16px] text-[#505060] mb-10">免费注册，即刻拥有专属账号中心。</p>

          <Link href="/sign-up" className="cta-btn group inline-flex items-center gap-3 px-10 py-5 bg-white text-[#020208] rounded-full text-[15px] font-medium hover:bg-[#f5f5f8] transition-all duration-200">
            创建账号
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="relative px-16 py-8 border-t border-[#0c0c18]">
        <div className="footer-content flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="11" stroke="#60a5fa" strokeWidth="1" fill="none" opacity="0.4" />
              <circle cx="16" cy="16" r="7" fill="#3b82f6" fillOpacity="0.3" />
              <circle cx="14" cy="14" r="1.5" fill="white" fillOpacity="0.4" />
            </svg>
            <p className="text-[11px] text-[#404050]">StarX</p>
          </div>
          <div className="flex gap-8 text-[11px] text-[#404050]">
            <Link href="/sign-in" className="hover:text-[#606068] transition-colors duration-200">登录</Link>
            <Link href="/sign-up" className="hover:text-[#606068] transition-colors duration-200">注册</Link>
            <Link href="/admin" className="hover:text-[#606068] transition-colors duration-200">管理</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
