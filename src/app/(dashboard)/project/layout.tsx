import { Sidebar } from "@/src/components/layout/Sidebar";
import { auth } from "@clerk/nextjs/server"
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,  
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <div className="flex min-h-dvh flex-col bg-gray-50 md:h-screen md:flex-row">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
    )
}
