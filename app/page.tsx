import Link from "next/link";

const features = [
  {
    title: "Vidéos de fond en boucle",
    desc: "Importez vos propres vidéos de louange ou collez une URL, et laissez-les tourner en boucle derrière vos versets.",
  },
  {
    title: "Bibliothèque de versets",
    desc: "Recherchez parmi des versets populaires (Louis Segond) ou saisissez librement votre propre texte et référence.",
  },
  {
    title: "Fenêtre de projection dédiée",
    desc: "Ouvrez l'écran de diffusion sur un second écran ou un vidéoprojecteur, pendant que vous gardez le contrôle depuis votre poste.",
  },
  {
    title: "Mise à jour en temps réel",
    desc: "Changez de verset, coupez l'écran ou ajustez le style : la sortie live se met à jour instantanément.",
  },
  {
    title: "Style personnalisable",
    desc: "Police, taille, couleur, contour, position du texte et opacité du voile sombre — tout est réglable.",
  },
  {
    title: "100% dans le navigateur",
    desc: "Aucune installation. Vos présentations sont sauvegardées localement, prêtes à être rejouées à tout moment.",
  },
];

const steps = [
  { n: "1", title: "Créez une présentation", desc: "Donnez-lui un nom, comme le titre de votre culte ou de votre événement." },
  { n: "2", title: "Ajoutez une vidéo et des versets", desc: "Importez une vidéo de fond et composez votre liste de versets à projeter." },
  { n: "3", title: "Ouvrez la sortie live", desc: "Affichez-la sur le vidéoprojecteur et pilotez le déroulé depuis votre écran de contrôle." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent2" />
            <span className="text-lg font-semibold tracking-tight">VerseFlow</span>
          </div>
          <nav className="hidden gap-8 text-sm text-white/70 sm:flex">
            <a href="#fonctionnalites" className="hover:text-white">Fonctionnalités</a>
            <a href="#comment-ca-marche" className="hover:text-white">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-white">Tarifs</a>
          </nav>
          <Link
            href="/studio"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Ouvrir le studio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-accent2">
          Projection de versets bibliques
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Projetez vos versets bibliques sur une vidéo, en direct, comme ProPresenter
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
          VerseFlow est un outil léger, pensé pour les églises et équipes de louange :
          préparez votre déroulé de versets, choisissez une vidéo de fond, et diffusez
          le tout sur grand écran en quelques clics — sans logiciel à installer.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio"
            className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-white shadow-lg shadow-accent/30 hover:bg-accent/90"
          >
            Commencer gratuitement
          </Link>
          <a
            href="#comment-ca-marche"
            className="rounded-lg border border-white/15 px-6 py-3 text-base font-semibold text-white/80 hover:bg-white/5"
          >
            Voir comment ça marche
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl">
          <div className="relative aspect-video w-full bg-gradient-to-br from-black via-[#101425] to-black">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-xl px-8 text-center">
                <p className="font-serif text-2xl italic text-white text-shadow-strong sm:text-3xl">
                  &laquo; L&apos;Éternel est mon berger : je ne manquerai de rien. &raquo;
                </p>
                <p className="mt-4 text-sm uppercase tracking-widest text-accent2">
                  Psaumes 23:1
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Tout ce qu&apos;il faut pour projeter</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-panel p-6">
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="comment-ca-marche" className="border-y border-white/10 bg-white/[0.02] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Comment ça marche</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-white">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tarifs" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Tarifs</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
          Version bêta actuellement gratuite et sans limite — vos présentations sont
          sauvegardées dans votre navigateur.
        </p>
        <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-accent/40 bg-panel p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-accent2">Bêta</p>
          <p className="mt-2 text-4xl font-bold">0 €</p>
          <p className="mt-1 text-sm text-white/50">pendant la phase bêta</p>
          <ul className="mt-6 space-y-2 text-left text-sm text-white/70">
            <li>✓ Présentations illimitées</li>
            <li>✓ Vidéos de fond illimitées</li>
            <li>✓ Sortie de projection dédiée</li>
            <li>✓ Bibliothèque de versets intégrée</li>
          </ul>
          <Link
            href="/studio"
            className="mt-8 block rounded-lg bg-accent px-6 py-3 text-center text-base font-semibold text-white hover:bg-accent/90"
          >
            Créer ma première présentation
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-white/40">
        VerseFlow — un outil de projection pour l&apos;église, inspiré de ProPresenter.
      </footer>
    </main>
  );
}
