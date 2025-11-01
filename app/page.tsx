"use client";

import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/NodeEditor').then(m => m.NodeEditor), { ssr: false });

export default function Page() {
  return (
    <main className="h-screen w-screen">
      <Editor />
    </main>
  );
}
