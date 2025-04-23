'use client';
import React, { ChangeEvent } from 'react';

interface HeaderProps {
  onExport: () => void;
  onImport: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddCity: () => void;
  onDelete: () => void;
}

export function Header({ onExport, onImport, onAddCity, onDelete }: HeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-100 shadow-card flex items-center px-4 z-10">
      <button onClick={ onExport } className="mr-2 px-3 py-1 rounded-xl shadow-subtle">
        Export
      </button>
      <button onClick={ () => fileInputRef.current?.click() } className="mr-2 px-3 py-1 rounded-xl shadow-subtle">
        Import
      </button>
      <button onClick={ onAddCity } className="mr-2 px-3 py-1 bg-primary rounded-xl text-white shadow-subtle">
        Add City
      </button>
      <button onClick={ onDelete }
              className="mr-2 px-3 py-1 bg-red-500 rounded-xl text-white shadow-subtle hover:bg-red-600 transition">
        Delete Selected
      </button>
      <input
        type="file"
        accept="application/json"
        ref={ fileInputRef }
        className="hidden"
        onChange={ onImport }
      />
    </header>
  );
}

export default Header;