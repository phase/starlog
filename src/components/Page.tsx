import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";

export default function Page() {
  return (
    <div className="container mx-auto p-4" style={{ maxWidth: "850px" }}>
      <div className="my-4">
        <h1 className="text-2xl font-bold tracking-tight">Starlog</h1>
        <p className="text-sm">
          <span className="text-gray-700">A dashboard for GitHub stars by</span>{" "}
          <a
            href="https://jadon.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Jadon
          </a>
          <span className="text-gray-700">. </span>
          <span className="text-gray-400 text-xs">
            It's{" "}
            <a
              href="https://github.com/phase/starlog"
              target="_blank"
              className="text-blue-400 hover:underline"
            >
              open source
            </a>
            !
          </span>
        </p>
      </div>
      <AuthForm />
      <p className="mb-8 mt-1 text-gray-400 text-xs">
        Runs clientside using{" "}
        <a
          href="https://docs.github.com/en/graphql/guides/forming-calls-with-graphql"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          GitHub's GraphQL API
        </a>
        . Click{" "}
        <span
          className="text-blue-400 hover:underline"
          onClick={() => localStorage.clear()}
        >
          here
        </span>{" "}
        to clear cache.
      </p>
      <Dashboard />
    </div>
  );
}
