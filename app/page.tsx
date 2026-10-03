'use client';
import dynamic from 'next/dynamic';

// The planner uses canvas, WebGL and localStorage, so it renders only in the browser.
const Planner = dynamic(() => import('@/components/Planner'), {
  ssr: false,
  loading: () => <div className="boot">Opening your design…</div>,
});

export default function Page() {
  return <Planner />;
}
