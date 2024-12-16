import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";

export default function Page() {
  return (
    <div className="container mx-auto p-4" style={{ maxWidth: "850px" }}>
      <h1 className="text-2xl font-bold mb-4">GitHub Stars</h1>
      <AuthForm />
      <Dashboard />
    </div>
  );
}
