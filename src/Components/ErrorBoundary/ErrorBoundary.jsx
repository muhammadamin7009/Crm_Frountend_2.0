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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/60 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-700">
            !
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Sahifada kutilmagan xatolik</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            Ma'lumotlaringiz o'chmadi. Sahifani yangilab ko'ring. Xato takrorlansa administratorga
            murojaat qiling.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#991b1b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#7f1d1d]"
            >
              Sahifani yangilash
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
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
