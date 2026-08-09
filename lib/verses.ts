export interface VerseEntry {
  reference: string;
  text: string;
}

// Sélection de versets populaires — texte Louis Segond (1910), domaine public.
export const verseLibrary: VerseEntry[] = [
  { reference: "Jean 3:16", text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." },
  { reference: "Psaumes 23:1", text: "L'Éternel est mon berger: je ne manquerai de rien." },
  { reference: "Philippiens 4:13", text: "Je puis tout par celui qui me fortifie." },
  { reference: "Jérémie 29:11", text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance." },
  { reference: "Romains 8:28", text: "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein." },
  { reference: "Proverbes 3:5-6", text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers." },
  { reference: "Ésaïe 41:10", text: "Ne crains rien, car je suis avec toi; ne prends pas d'inquiétude, car je suis ton Dieu; je te fortifie, je viens à ton secours, je te soutiens de ma droite triomphante." },
  { reference: "Matthieu 6:33", text: "Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus." },
  { reference: "Psaumes 46:1", text: "Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse." },
  { reference: "Jean 14:6", text: "Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi." },
  { reference: "Romains 12:2", text: "Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence, afin que vous discerniez quelle est la volonté de Dieu." },
  { reference: "Galates 5:22-23", text: "Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance." },
  { reference: "Psaumes 119:105", text: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier." },
  { reference: "Matthieu 11:28", text: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos." },
  { reference: "1 Corinthiens 13:4-7", text: "L'amour est patient, il est plein de bonté; l'amour n'est point envieux; l'amour ne se vante point, il ne s'enfle point d'orgueil." },
  { reference: "Psaumes 27:1", text: "L'Éternel est ma lumière et mon salut: de qui aurais-je crainte? L'Éternel est le soutien de ma vie: de qui aurais-je peur?" },
  { reference: "Josué 1:9", text: "Fortifie-toi et prends courage, ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi partout où tu iras." },
  { reference: "Éphésiens 2:8-9", text: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu." },
  { reference: "Psaumes 91:1-2", text: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant. Je dis à l'Éternel: Mon refuge et ma forteresse, mon Dieu en qui je me confie!" },
  { reference: "Marc 11:24", text: "C'est pourquoi je vous dis: Tout ce que vous demanderez en priant, croyez que vous l'avez reçu, et vous le verrez s'accomplir." },
  { reference: "Romains 10:9", text: "Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l'a ressuscité des morts, tu seras sauvé." },
  { reference: "Psaumes 34:18", text: "L'Éternel est près de ceux qui ont le cœur brisé, et il sauve ceux qui ont l'esprit dans l'abattement." },
  { reference: "Hébreux 11:1", text: "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas." },
  { reference: "Colossiens 3:23", text: "Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes." },
  { reference: "Psaumes 121:1-2", text: "Je lève mes yeux vers les montagnes... D'où me viendra le secours? Le secours me vient de l'Éternel, qui a fait les cieux et la terre." },
  { reference: "1 Jean 4:19", text: "Pour nous, nous l'aimons, parce qu'il nous a aimés le premier." },
  { reference: "2 Corinthiens 5:17", text: "Si quelqu'un est en Christ, il est une nouvelle création. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles." },
  { reference: "Psaumes 139:14", text: "Je te loue de ce que je suis une créature si merveilleuse. Tes œuvres sont admirables, et mon âme le reconnaît bien." },
  { reference: "Matthieu 28:20", text: "Et voici, je suis avec vous tous les jours, jusqu'à la fin du monde." },
  { reference: "Nombres 6:24-26", text: "Que l'Éternel te bénisse, et qu'il te garde! Que l'Éternel fasse luire sa face sur toi, et qu'il t'accorde sa grâce! Que l'Éternel tourne sa face vers toi, et qu'il te donne la paix!" },
  { reference: "Psaumes 100:1-2", text: "Poussez vers l'Éternel des cris de joie, vous tous, habitants de la terre! Servez l'Éternel, avec joie, venez avec allégresse en sa présence!" },
  { reference: "Jean 1:1", text: "Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu." },
  { reference: "Romains 5:8", text: "Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous." },
  { reference: "Psaumes 37:4", text: "Fais de l'Éternel tes délices, et il te donnera ce que ton cœur désire." },
  { reference: "Philippiens 4:6-7", text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces." },
  { reference: "Genèse 1:1", text: "Au commencement, Dieu créa les cieux et la terre." },
  { reference: "Psaumes 103:1-2", text: "Mon âme, bénis l'Éternel! Que tout ce qui est en moi bénisse son saint nom! Mon âme, bénis l'Éternel, et n'oublie aucun de ses bienfaits!" },
  { reference: "Luc 1:37", text: "Car rien n'est impossible à Dieu." },
  { reference: "1 Pierre 5:7", text: "Et déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous." },
  { reference: "Apocalypse 21:4", text: "Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n'y aura plus ni deuil, ni cri, ni douleur, car les premières choses ont disparu." },
];

export function searchVerses(query: string): VerseEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return verseLibrary;
  return verseLibrary.filter(
    (v) =>
      v.reference.toLowerCase().includes(q) || v.text.toLowerCase().includes(q)
  );
}
