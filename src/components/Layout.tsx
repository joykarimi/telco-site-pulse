
import React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
    // The new sidebar is self-contained and manages its own state.
    // We just need to place it and the main content.

    // We need to add padding to the main content to avoid it being overlapped by the fixed sidebar.
    // The sidebar width is 256px when expanded and 80px when collapsed.
    // We can use a media query for mobile, where the sidebar is a sheet.

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:pl-80 flex-1 flex flex-col">
                <Header />
                <div className="flex-1 overflow-y-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
