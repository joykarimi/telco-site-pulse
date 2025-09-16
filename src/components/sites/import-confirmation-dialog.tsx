
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ImportConfirmationDialogProps {
    selectedMonth: number;
    selectedYear: number;
    onConfirm: () => void;
}

const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));

export const ImportConfirmationDialog = ({ selectedMonth, selectedYear, onConfirm }: ImportConfirmationDialogProps) => {
    const monthName = months[selectedMonth - 1];

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import from Excel
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Import Period</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to import an Excel file for the period of <span className="font-bold">{monthName} {selectedYear}</span>.
                        Please ensure this is the correct period before proceeding. The existing data for this month will be overwritten.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Confirm & Select File</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
