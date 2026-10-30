import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface LoginViewProps {
  onLogin: (session: { employeeId: string; name: string; role: string; branch: string; token?: string }) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [employeeId, setEmployeeId] = useState('AR-RM-8041');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom uploaded background state with multi-tier failover
  const [bgUrl, setBgUrl] = useState('/ar30oct.png');
  const [isCustomBg, setIsCustomBg] = useState(true);

  const handleBgError = () => {
    if (bgUrl === '/ar30oct.png') {
      // Failover to synced Workstation1.png
      setBgUrl('/Workstation1.png');
    } else {
      // Absolute fallback safety toggle to corporate Unsplash background
      setBgUrl('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2070');
      setIsCustomBg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Please provide a valid Employee ID.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await authService.login(employeeId.trim(), password);
      setLoading(false);
      onLogin(session);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center md:justify-end p-4 md:p-6 lg:p-12 xl:p-16 overflow-hidden font-sans bg-[#FAF6EE]">
      {/* Background Image Layer with beautiful warm luxury overlay */}
      <div className="absolute inset-0 z-0 select-none">
        <img
          src={bgUrl}
          onError={handleBgError}
          alt="Anand Rathi Private Wealth Office"
          className="w-full h-full object-cover filter brightness-[1.02] contrast-[1.02]"
          referrerPolicy="no-referrer"
        />

        {/* Dynamic premium overlays to guarantee high visual quality and maximum text readability */}
        {isCustomBg ? (
          // Custom beautiful warm beige integration overlay
          <div className="absolute inset-0 bg-[#C89B3C]/[0.01] mix-blend-multiply" />
        ) : (
          <>
            {/* Deep, rich luxurious dark gradient overlay for fallback images to ensure readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/25 md:from-[#17130B]/90 md:via-[#1D170C]/50 md:to-transparent" />
            {/* Elegant architectural vector grid lines overlay */}
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#E8E2D7_1px,transparent_1px),linear-gradient(to_bottom,#E8E2D7_1px,transparent_1px)] bg-[size:4rem_4rem]" />

            {/* Absolute radial gold-yellow sun symbol/ambiance overlay */}
            <div className="absolute left-[10%] top-[15%] w-80 h-80 rounded-full bg-[#C89B3C]/10 blur-[80px]" />
            <div className="absolute right-[5%] bottom-[5%] w-[450px] h-[450px] rounded-full bg-[#C89B3C]/5 blur-[120px]" />
          </>
        )}
      </div>

      {/* LEFT CONTENT AREA: BRANDING & PROGRESSIVE METAPHOR (only visible on fallback where branding is not already pre-baked into background) */}
      {!isCustomBg && (
        <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-[50%] lg:w-[55%] p-8 lg:p-16 flex-col justify-between z-10 text-white select-none animate-fade-in">

          {/* Top Header - Logo and brand */}
          <div className="text-left">
            <h1 className="text-3xl font-display font-bold tracking-wider text-[#D4AF37]">
              ANAND RATHI
            </h1>
            <div className="w-16 h-[1.5px] bg-[#D4AF37] mt-2.5"></div>
          </div>

          {/* Growth & Coin visual representation aligned perfectly */}
          <div className="flex flex-col items-start max-w-md pl-4">
            <div className="flex items-end gap-6 mb-8 mt-4">
              {/* Architectural office skyscrapers */}
              <div className="flex items-end gap-1.5 border-b border-white/20 pb-1">
                <div className="w-4.5 h-16 bg-gradient-to-t from-[#D4AF37]/10 to-[#D4AF37]/30 rounded-t-sm border border-[#D4AF37]/20" />
                <div className="w-5 h-24 bg-gradient-to-t from-[#D4AF37]/20 to-[#D4AF37]/50 rounded-t-sm border border-[#D4AF37]/30" />
                <div className="w-4 h-12 bg-gradient-to-t from-[#D4AF37]/5 to-[#D4AF37]/20 rounded-t-sm border border-[#D4AF37]/15" />
              </div>

              {/* Central sprout plant metaphor */}
              <div className="flex flex-col items-center">
                <div className="relative flex flex-col items-center">
                  {/* Sprout vector */}
                  <div className="w-[1.5px] h-10 bg-[#D4AF37] relative">
                    <div className="absolute -left-1.5 top-2 w-3 h-2 bg-[#D4AF37] rounded-full rotate-12" />
                    <div className="absolute -right-1.5 top-4 w-3 h-2 bg-[#D4AF37] rounded-full -rotate-12" />
                    <div className="absolute -left-2 top-6 w-3.5 h-2.5 bg-[#D4AF37] rounded-full rotate-45" />
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#D4AF37] rounded-full" />
                  </div>
                  {/* Glass seed jar */}
                  <div className="w-12 h-12 rounded-xl bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 flex items-center justify-center shadow-md mt-2">
                    <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Stepped coin stacks */}
              <div className="flex items-end gap-1.5 pb-0.5">
                <div className="w-4.5 h-5 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-sm" />
                <div className="w-4.5 h-8 bg-[#D4AF37]/35 border border-[#D4AF37]/45 rounded-sm" />
                <div className="w-4.5 h-12 bg-[#D4AF37]/50 border border-[#D4AF37]/60 rounded-sm" />
                <div className="w-4.5 h-16 bg-[#D4AF37]/65 border border-[#D4AF37]/75 rounded-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-[#FAF6EE] tracking-wide">
                Simplifying Wealth, Amplifying Growth
              </h2>
              <p className="text-xs text-amber-100/75 leading-relaxed">
                Securing generational wealth through absolute transparency, disciplined research, and institutional integrity.
              </p>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center gap-2.5 text-amber-100/60">
            <ShieldCheck className="w-4.5 h-4.5 text-[#D4AF37]" />
            <span className="text-[10px] uppercase tracking-wider font-bold">
              Anand Rathi Institutional Workstation Secured Port
            </span>
          </div>
        </div>
      )}

      {/* RIGHT SIDE: FLOATING INTERACTIVE CARD OVERLAY - Styled to overlap precisely with custom background template */}
      <div
        className="w-full bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden text-left z-10 transition-all duration-500 flex flex-col justify-center"
        style={{
          width: '495px',
          height: '601px',
          marginRight: '63.35px'
        }}
      >
        {/* Gold top hairline decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4AF37]" />

        {/* Core branding inside card */}
        <div
          className="text-center"
          style={{
            marginBottom: '32px',
            marginTop: '0px',
            marginRight: '0px',
            marginLeft: '0px',
            paddingBottom: '0px',
            paddingTop: '0px',
            paddingRight: '0px',
            height: '156.85px',
            width: '410.4px'
          }}
        >
          <h2
            style={{ fontFamily: "'Cormorant SC', serif", fontSize: '45.5px', color: '#a86b00', lineHeight: '31.35px', marginRight: '0px', marginBottom: '39px', marginTop: '24px', paddingLeft: '0px', paddingRight: '0px' }}
            className="font-semibold tracking-wide"
          >
            AnandRathi
          </h2>
          <p
            style={{ fontFamily: "'Lato', sans-serif", fontSize: '18px', letterSpacing: '0.4em', color: '#3d3d3d', lineHeight: '11.5px', marginTop: '-27px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px', paddingTop: '3px', paddingBottom: '4px', paddingLeft: '0px', paddingRight: '0px', width: '413.4px', height: '22.5px' }}
            className="uppercase font-bold"
          >
            workstation
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div className="w-3 h-[1px] bg-[#D4AF37]/40"></div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            <div className="w-3 h-[1px] bg-[#D4AF37]/40"></div>
          </div>
          <p
            style={{ fontSize: '12px' }}
            className="text-gray-400 mt-2 font-medium"
          >
            Employee Login Portal
          </p>
        </div>

        <div className="text-center mb-6">
          <h3
            style={{ fontSize: '30px', lineHeight: '27px', fontFamily: "'Open Sans', sans-serif", fontWeight: 'bold', marginTop: '-9px' }}
            className="text-gray-800"
          >
            Welcome Login
          </h3>
          <div className="w-8 h-[1.5px] bg-[#D4AF37] mx-auto mt-1.5"></div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold mb-4">
            {error}
          </div>
        )}

        {/* Quick Demo Role Selector for presentation */}
        <div className="mb-4">
          <label className="text-[9px] text-gray-400 uppercase tracking-wider font-bold block mb-1.5 text-center">
            Select Role to Demo Login
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => { setEmployeeId('AR-ADMIN-0001'); setPassword('password123'); }}
              className={`py-1 px-1.5 text-[9.5px] font-bold rounded-lg border transition-all ${employeeId === 'AR-ADMIN-0001' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => { setEmployeeId('AR-RM-8041'); setPassword('password123'); }}
              className={`py-1 px-1.5 text-[9.5px] font-bold rounded-lg border transition-all ${employeeId === 'AR-RM-8041' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
            >
              Rel. Manager
            </button>
            <button
              type="button"
              onClick={() => { setEmployeeId('AR-HEAD-0001'); setPassword('password123'); }}
              className={`py-1 px-1.5 text-[9.5px] font-bold rounded-lg border transition-all ${employeeId === 'AR-HEAD-0001' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
            >
              Branch Head
            </button>
            <button
              type="button"
              onClick={() => { setEmployeeId('AR-COMP-0001'); setPassword('password123'); }}
              className={`py-1 px-1.5 text-[9.5px] font-bold rounded-lg border transition-all ${employeeId === 'AR-COMP-0001' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
            >
              Compliance
            </button>
            <button
              type="button"
              onClick={() => { setEmployeeId('AR-RES-0001'); setPassword('password123'); }}
              className={`py-1 px-1.5 text-[9.5px] font-bold rounded-lg border transition-all ${employeeId === 'AR-RES-0001' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
            >
              Research
            </button>
            <button
              type="button"
              onClick={() => { setEmployeeId('AR-AUDIT-0001'); setPassword('password123'); }}
              className={`py-1 px-1.5 text-[9.5px] font-bold rounded-lg border transition-all ${employeeId === 'AR-AUDIT-0001' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
            >
              Auditor
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          style={{ lineHeight: '17px', fontSize: '23px', marginBottom: '0px', paddingBottom: '0px' }}
        >
          {/* Employee ID */}
          <div>
            <label htmlFor="input-empid" className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Employee ID
            </label>
            <div className="relative mt-1.5">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-empid"
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. AR-RM-8041"
                className="w-full pl-10 pr-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all font-sans text-gray-800 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="input-password" className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Password
              </label>
            </div>
            <div className="relative mt-1.5">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-11 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all font-sans text-gray-800 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div
            className="text-right"
            style={{
              marginTop: '0px',
              marginBottom: '33px',
              marginRight: '1px',
              marginLeft: '0px'
            }}
          >
            <a
              href="#forgot"
              style={{ fontSize: '12px', marginTop: '8px' }}
              className="text-[#D4AF37] font-bold hover:underline inline-block"
            >
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D4AF37] hover:bg-[#c49f2c] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Securing session gateway...</span>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>USER LOGIN</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
