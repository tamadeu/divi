"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from "@/components/ui/toaster";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
};

export default MainLayout;