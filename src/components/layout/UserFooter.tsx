
import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const UserFooter: React.FC = () => {
    const { user, signOut } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <div className="p-4 border-t border-border mt-auto">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {getInitials(user.displayName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-sm text-foreground truncate">{user.displayName}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut} className="ml-auto shrink-0 hover:bg-accent/10">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};

export default React.memo(UserFooter);
