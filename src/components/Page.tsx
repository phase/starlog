import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">GitHub Stars Dashboard</h1>
      <AuthForm />
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
