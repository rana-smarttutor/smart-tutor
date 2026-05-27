import { LiveClock } from "@/components/live-clock";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { getPublicInstituteData } from "@/lib/data-store";

export const revalidate = 3600; // Cache for 1 hour

export default async function ContactPage() {
  const data = await getPublicInstituteData();
  const mapQuery = encodeURIComponent(data.profile.address);
  const mapSrc =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.017136012903!2d72.99560617520503!3d19.062984182138877!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c1c3896c493f%3A0xd9b13c31e18e745e!2sSmartIQ%20Academy!5e0!3m2!1sen!2sin!4v1776943936994!5m2!1sen!2sin";

  return (
    <main className="section-shell pb-24 pt-12">
      <section className="mb-20 text-center lg:text-left relative">
        <div className="absolute top-0 left-0 -z-10 h-64 w-64 bg-blue-400/10 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-8xl font-black tracking-tight text-[var(--color-heading)] leading-[1] mb-8">
            Get in <span className="text-blue-600">Touch.</span>
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed text-[var(--color-muted)] font-medium max-w-2xl">
            Have questions about admissions, batches, or career guidance? 
            Reach out via WhatsApp, call, or visit our Vashi campus.
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <RevealOnScroll className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {data.contactMethods.map((item) => (
              <div
                key={item.label}
                className="relative overflow-hidden group rounded-3xl p-6 transition-all duration-500 hover:translate-y-[-4px] hover:shadow-xl border border-[var(--color-border)] shadow-sm bg-white dark:bg-slate-900"
              >
                {/* Decorative background glow based on item color */}
                <div 
                  className="absolute top-0 right-0 -z-10 h-24 w-24 blur-[40px] opacity-10 rounded-full translate-x-1/4 -translate-y-1/4 transition-opacity group-hover:opacity-30"
                  style={{ backgroundColor: item.color }}
                />
                
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-500 group-hover:scale-110"
                      style={{ backgroundColor: item.color || "var(--color-primary)" }}
                    >
                      {item.icon === "Phone" && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      )}
                      {item.icon === "WhatsApp" && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.672 1.433 5.661 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      )}
                      {item.icon === "Instagram" && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                      )}
                      {item.icon === "Email" && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-0.5">{item.label}</p>
                      <p className="text-base font-black text-[var(--color-heading)] truncate">{item.value}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs leading-relaxed text-[var(--color-muted)] font-bold mb-6 flex-grow">
                    {item.description}
                  </p>
                  
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="group/link inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-black text-xs text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                    style={{ backgroundColor: item.color || "var(--color-primary)" }}
                  >
                    Connect
                    <svg className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl p-8 bg-gradient-to-br from-[#1e40af] to-[#3730a3] text-white shadow-xl relative overflow-hidden group border border-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-all"></div>
            <div className="relative z-10">
              <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-3">Direct Guidance</p>
              <h2 className="text-2xl font-black mb-5 leading-tight text-white">Visit the Campus for <br/>Expert Counselling</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center border border-white/20 text-white shadow-inner">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-200 mb-0.5">Location</p>
                    <p className="text-base font-bold leading-relaxed">{data.profile.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-200 mb-0.5">Hours</p>
                    <p className="text-base font-bold">{data.profile.hours}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {data.contactActions.filter(a => a.style === "primary").map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white text-blue-800 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-blue-50 hover:scale-105 transition-all shadow-md"
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <div className="space-y-6">
          <div className="rounded-3xl p-5 shadow-lg border border-[var(--color-border)] bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label m-0">Live Status</p>
              <LiveClock label="" className="sm:min-w-0" />
            </div>
            <div className="media-frame map-frame h-[400px] overflow-hidden rounded-2xl border-none shadow-inner">
              <div className="map-frame-inner h-full">
                <iframe
                  title="Smart Tutors campus location"
                  src={mapSrc}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[0.2] contrast-[1.1]"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
               <p className="text-xs font-bold text-[var(--color-muted)] leading-relaxed flex-1">
                 {data.profile.address}
               </p>
               <a
                href={`https://maps.google.com/?q=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-blue-700 hover:scale-105 transition-all shadow-md whitespace-nowrap"
              >
                Open Maps
              </a>
            </div>
          </div>

          <div className="rounded-3xl p-6 border-t-4 border-blue-600 shadow-lg border-x border-b border-[var(--color-border)] bg-white dark:bg-slate-900">
            <p className="section-label mb-4 text-blue-600">Leadership Desk</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-[var(--color-heading)] leading-tight">{data.profile.directorName}</p>
                <p className="text-[10px] font-bold text-blue-600 mt-0.5 uppercase tracking-widest">{data.profile.directorTitle}</p>
              </div>
            </div>
            <p className="text-xs leading-6 text-[var(--color-muted)] font-bold bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
              {data.profile.affiliatedInstitutes.join(" | ")}
            </p>
          </div>

          <div className="rounded-3xl p-6 shadow-lg border border-[var(--color-border)] bg-white dark:bg-slate-900">
             <p className="section-label mb-4">Social Network</p>
             <div className="grid grid-cols-2 gap-3">
                {data.socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col gap-2 rounded-2xl bg-[var(--color-background-strong)] p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md border border-[var(--color-border)] hover:border-blue-200"
                    style={{ borderTop: `4px solid ${item.color}` }}
                  >
                    <div>
                      <p className="text-xs font-black text-[var(--color-heading)] leading-tight">{item.label}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mt-0.5">Official</p>
                    </div>
                  </a>
                ))}
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
