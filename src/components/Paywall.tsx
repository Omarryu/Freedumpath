import { useEffect, useRef, useState } from 'react';
import { Lock, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/supabase';
import { sfx } from '../sfx';

interface Props {
  user: User;
  trialExpired: boolean;
  trialHoursLeft: number;
  onSubscribed: () => void;
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const LIFETIME_PRICE_DISPLAY = '$25';
const TRIAL_EXPIRED = 'Your 24-hour free trial has ended. Get lifetime access for a one-time payment of ' + LIFETIME_PRICE_DISPLAY + ' — pay once, play forever.';
const TRIAL_ACTIVE = (h: number) => `Your free trial is active — ${h} hour${h === 1 ? '' : 's'} left. Unlock lifetime access now so you never lose your progress.`;

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, string>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
      }) => { render: (selector: string) => void };
    };
  }
}

export default function Paywall({ user, trialExpired, trialHoursLeft, onSubscribed }: Props) {
  const [error, setError] = useState('');
  const [sdkLoading, setSdkLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const buttonsRendered = useRef(false);

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setError('Payments are not yet configured. Please check back soon.');
      setSdkLoading(false);
      return;
    }
    if (buttonsRendered.current) return;

    const existing = document.getElementById('paypal-sdk');
    const onReady = () => {
      setSdkLoading(false);
      renderButtons();
    };

    if (existing) {
      if (window.paypal) onReady();
      else existing.addEventListener('load', onReady);
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD&intent=capture`;
    script.onload = onReady;
    script.onerror = () => {
      setSdkLoading(false);
      setError("Couldn't load PayPal. Check your connection and try again.");
    };
    document.body.appendChild(script);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderButtons = () => {
    if (!window.paypal || buttonsRendered.current) return;
    buttonsRendered.current = true;

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },

      createOrder: async () => {
        setError('');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please sign in again to continue.');
          throw new Error('No active session');
        }
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not start checkout');
        return data.id;
      },

      onApprove: async (data: { orderID: string }) => {
        setCapturing(true);
        setError('');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setError('Please sign in again to continue.');
            return;
          }
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-capture-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ order_id: data.orderID }),
          });
          const result = await res.json();
          if (!res.ok || !result.granted) {
            throw new Error(result.error || 'Payment could not be completed.');
          }
          sfx.click();
          onSubscribed();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong finalizing your payment.';
          setError(msg);
        } finally {
          setCapturing(false);
        }
      },

      onError: (err: unknown) => {
        console.error('PayPal error:', err);
        setError('Something went wrong with PayPal. No charge was made.');
      },
    }).render('#paypal-button-container');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/534220/pexels-photo-534220.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-amber-950/40" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mb-3 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30">
            <Lock size={28} className="text-amber-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Continue Your Journey</h1>
          <p className="text-slate-400 text-sm mt-2">
            {trialExpired ? TRIAL_EXPIRED : TRIAL_ACTIVE(trialHoursLeft)}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span className="text-5xl font-black text-amber-400">{LIFETIME_PRICE_DISPLAY}</span>
            <span className="text-slate-400 font-medium">one-time</span>
          </div>
          <p className="text-center text-slate-500 text-xs mb-6">Pay once. Play forever. No subscription.</p>

          <ul className="space-y-3 mb-6">
            {[
              'Unlimited, permanent access to FreedomPath',
              'Keep all your saved progress',
              'Every archetype, life event, and milestone',
              'Cloud saves across devices',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-slate-200 text-sm">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {!trialExpired && (
            <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/25 rounded-xl px-3 py-2.5 mb-5">
              <Clock size={15} className="text-sky-400 flex-shrink-0" />
              <p className="text-sky-300 text-xs">
                Trial active — {trialHoursLeft} hour{trialHoursLeft === 1 ? '' : 's'} remaining. Unlock lifetime access anytime to avoid interruption.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={15} className="text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-rose-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <div className="relative min-h-[45px]">
            {(sdkLoading || capturing) && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/80 rounded-xl text-slate-400 text-xs font-medium">
                <Loader2 size={16} className="animate-spin" />
                {capturing ? 'Finalizing your payment...' : 'Loading payment options...'}
              </div>
            )}
            <div id="paypal-button-container" />
          </div>

          <button
            onClick={onSubscribed}
            className="w-full mt-4 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
          >
            I've already paid — refresh
          </button>

          <p className="text-center text-slate-600 text-xs mt-5">
            Signed in as {user.email}
          </p>
        </div>
      </div>
    </div>
  );
}
