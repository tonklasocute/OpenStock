import React from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {auth} from "@/lib/better-auth/auth";

const Layout = async ({ children }: { children : React.ReactNode }) => {

    const session = await auth.api.getSession({headers: await headers()});

    if (session?.user) redirect('/')

    return (
        <main className="auth-layout">
            {children}
        </main>
    )
}
export default Layout
