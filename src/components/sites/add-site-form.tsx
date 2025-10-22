import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { addSiteDefinition, getSiteDefinitions } from "@/lib/firebase/firestore"; // Corrected import

interface AddSiteFormProps {
    onSiteAdded: () => void;
    selectedMonth: number;
    selectedYear: number;
}

export function AddSiteForm({ onSiteAdded, selectedMonth, selectedYear }: AddSiteFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [siteName, setSiteName] = useState("");
    const [siteType, setSiteType] = useState("");
    const { toast } = useToast();

    const handleCheckSite = async () => {
        if (!siteName.trim() || !siteType.trim()) {
            toast({ title: "Error", description: "Please fill in both site name and type.", variant: "destructive" });
            return;
        }

        try {
            // Instead of getSiteDefinitionByName, we check if a site with the same name already exists
            const existingSites = await getSiteDefinitions();
            const siteExists = existingSites.some(site => site.name.toLowerCase() === siteName.toLowerCase());

            if (siteExists) {
                toast({ title: "Error", description: "A site with this name already exists.", variant: "destructive" });
            } else {
                setIsConfirmOpen(true);
            }
        } catch (error) {
            console.error("Error checking site existence: ", error);
            toast({ title: "Error", description: "Failed to check site existence.", variant: "destructive" });
        }
    };

    const handleCreateSite = async () => {
        try {
            await addSiteDefinition({ name: siteName, type: siteType }); // Corrected function call
            toast({ title: "Success", description: `Site \'${siteName}\' added successfully.` });
            onSiteAdded();
            setIsConfirmOpen(false);
            setIsOpen(false);
            setSiteName("");
            setSiteType("");
        } catch (error) {
            console.error("Error adding new site: ", error);
            toast({ title: "Error", description: "Failed to add new site.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Add Site</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add a New Site</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new site below. Click save when you\'re done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="site-name" className="text-right">Name</Label>
                        <Input id="site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="col-span-3" placeholder="e.g., Site Alpha" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="site-type" className="text-right">Type</Label>
                        <Select onValueChange={setSiteType} value={siteType}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Rooftop">Rooftop</SelectItem>
                                <SelectItem value="Greenfield">Greenfield</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCheckSite}>Save</Button>
                </DialogFooter>
            </DialogContent>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Site?</DialogTitle>
                        <DialogDescription>
                            A site with this name does not exist. Would you like to create it?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSite}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
