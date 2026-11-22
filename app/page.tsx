import { redirect } from "next/navigation"; import { hasSession } from "@/lib/auth"; import Dashboard from "@/components/dashboard";
export default async function Home(){if(!(await hasSession()))redirect("/login");return <Dashboard/>}

[executed on device: nutjukka-hplaptop15seq2xxx (28cbea08-3486-4a36-9ad7-3323c44d7ecd)]

Note: you've used 92% of this month's Desktop Commander usage. Visit https://mcp.desktopcommander.app/ to learn more about usage and resets.