import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trolle - Maintenance",
};

export default function MaintenanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
