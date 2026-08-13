import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI xatosi:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      // Ranglar mavzu o'zgaruvchilaridan olinadi — qorong'i mavzuda oq karta ko'zni qamashtirardi.
      <main
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={{ backgroundColor: "var(--aa-bg)" }}
      >
        <section
          className="w-full max-w-lg rounded-3xl p-7 text-center sm:p-10"
          style={{
            border: "1px solid var(--aa-border)",
            backgroundColor: "var(--aa-surface-solid)",
            boxShadow: "var(--aa-shadow-md)",
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black"
            style={{ backgroundColor: "rgba(110, 22, 34,.12)", color: "#e06a6a" }}
          >
            !
          </div>
          <h1 className="mt-5 text-2xl font-black" style={{ color: "var(--aa-text)" }}>
            Sahifada kutilmagan xatolik
          </h1>
          <p
            className="mt-3 text-sm font-medium leading-6"
            style={{ color: "var(--aa-text-secondary)" }}
          >
            Ma'lumotlaringiz o'chmadi. Sahifani yangilab ko'ring. Xato takrorlansa administratorga
            murojaat qiling.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#6e1622] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4d0f18]"
              style={{ minHeight: 48 }}
            >
              Sahifani yangilash
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="rounded-xl px-5 py-3 text-sm font-black transition"
              style={{
                minHeight: 48,
                border: "1px solid var(--aa-border-strong)",
                backgroundColor: "var(--aa-surface-muted)",
                color: "var(--aa-text)",
              }}
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
