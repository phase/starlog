import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";
import ThemeToggle from "@/components/ThemeToggle";

export default function Page() {
  return (
    <div className="container mx-auto p-4" style={{ maxWidth: "850px" }}>
      <div className="my-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Starlog</h1>
          <p className="text-sm text-muted-foreground">
            A dashboard for GitHub stars by{" "}
            <a
              href="https://jadon.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Jadon
            </a>
            . <span className="text-xs">It's{" "}
            <a
              href="https://github.com/phase/starlog"
              target="_blank"
              className="text-primary hover:underline"
            >
              open source
            </a>
            !</span>
          </p>
        </div>
        <ThemeToggle />
      </div>
      <AuthForm />
      <p className="mb-8 mt-1 text-xs text-muted-foreground">
        Runs clientside using{" "}
        <a
          href="https://docs.github.com/en/graphql/guides/forming-calls-with-graphql"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          GitHub's GraphQL API
        </a>
        . Click{" "}
        <span className="text-primary hover:underline" onClick={() => localStorage.clear()}>
          here
        </span>{" "}
        to clear cache.
      </p>
      <Dashboard />
    </div>
  );
}
