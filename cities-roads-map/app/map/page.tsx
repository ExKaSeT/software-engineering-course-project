'use client';
import dynamic from 'next/dynamic';

const MapCanvas = dynamic(
  () => import('@/components/MapCanvas'),
  { ssr: false }
);

export default function MapPage() {
  return <MapCanvas />;
}
