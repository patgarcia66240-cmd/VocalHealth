// Converts spoken French numbers to digit representations for measurement input.
export function parseFrenchToNumbers(text: string): string {
  if (!text) return "";

  let clean = text.toLowerCase();

  clean = clean.replace(/\bsur\b/g, " ");
  clean = clean.replace(/\bvirgule\b/g, ".");
  clean = clean.replace(/-et-/g, " ");
  clean = clean.replace(/-et\b/g, " ");
  clean = clean.replace(/\bet\b/g, " ");
  clean = clean.replace(/-/g, " ");

  const replacements: [string, string][] = [
    ["quatre vingt seize", "96"],
    ["quatre-vingt-seize", "96"],
    ["quatre vingt quinze", "95"],
    ["quatre-vingt-quinze", "95"],
    ["quatre vingt quatorze", "94"],
    ["quatre-vingt-quatorze", "94"],
    ["quatre vingt treize", "93"],
    ["quatre-vingt-treize", "93"],
    ["quatre vingt douze", "92"],
    ["quatre-vingt-douze", "92"],
    ["quatre vingt onze", "91"],
    ["quatre-vingt-onze", "91"],
    ["quatre vingt dix", "90"],
    ["quatre-vingt-dix", "90"],
    ["quatre vingt neuf", "89"],
    ["quatre-vingt-neuf", "89"],
    ["quatre vingt huit", "88"],
    ["quatre-vingt-huit", "88"],
    ["quatre vingt sept", "87"],
    ["quatre-vingt-sept", "87"],
    ["quatre vingt six", "86"],
    ["quatre-vingt-six", "86"],
    ["quatre vingt cinq", "85"],
    ["quatre-vingt-cinq", "85"],
    ["quatre vingt quatre", "84"],
    ["quatre-vingt-quatre", "84"],
    ["quatre vingt trois", "83"],
    ["quatre-vingt-trois", "83"],
    ["quatre vingt deux", "82"],
    ["quatre-vingt-deux", "82"],
    ["quatre vingt un", "81"],
    ["quatre-vingt-un", "81"],
    ["quatre vingt", "80"],
    ["quatre-vingt", "80"],
    ["soixante seize", "76"],
    ["soixante-seize", "76"],
    ["soixante quinze", "75"],
    ["soixante-quinze", "75"],
    ["soixante quatorze", "74"],
    ["soixante-quatorze", "74"],
    ["soixante treize", "73"],
    ["soixante-treize", "73"],
    ["soixante douze", "72"],
    ["soixante-douze", "72"],
    ["soixante dix", "70"],
    ["soixante-dix", "70"],
    ["dix sept", "17"],
    ["dix-sept", "17"],
    ["dix huit", "18"],
    ["dix-huit", "18"],
    ["dix neuf", "19"],
    ["dix-neuf", "19"],
    ["vingt et un", "21"],
    ["vingt-et-un", "21"],
    ["trente et un", "31"],
    ["trente-et-un", "31"],
    ["quarante et un", "41"],
    ["quarante-et-un", "41"],
    ["cinquante et un", "51"],
    ["cinquante-et-un", "51"],
    ["soixante et un", "61"],
    ["soixante-et-un", "61"],
    ["cent vingt", "120"],
    ["cent trente", "130"],
    ["cent quarante", "140"],
    ["cent cinquante", "150"],
    ["cent soixante", "160"],
    ["vingt", "20"],
    ["trente", "30"],
    ["quarante", "40"],
    ["cinquante", "50"],
    ["soixante", "60"],
    ["cent", "100"],
    ["seize", "16"],
    ["quinze", "15"],
    ["quatorze", "14"],
    ["treize", "13"],
    ["douze", "12"],
    ["onze", "11"],
    ["dix", "10"],
    ["neuf", "9"],
    ["huit", "8"],
    ["sept", "7"],
    ["six", "6"],
    ["cinq", "5"],
    ["quatre", "4"],
    ["trois", "3"],
    ["deux", "2"],
    ["un", "1"],
    ["une", "1"],
    ["zéro", "0"],
    ["zero", "0"],
  ];

  for (const [word, digit] of replacements) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    clean = clean.replace(regex, digit);
  }

  return clean;
}

export function cleanInputToDigits(val: string, step: 1 | 2): string {
  if (!val) return "";

  const withDigits = parseFrenchToNumbers(val);
  const digits = withDigits.match(/\d+/g);

  if (!digits || digits.length === 0) return "";

  if (step === 1) {
    if (digits.length >= 2) {
      return `${digits[0]}/${digits[1]}`;
    }

    const single = digits[0];
    if (single.length >= 3) {
      if (single.length === 3) {
        return `${single.slice(0, 2)}/${single.slice(2)}`;
      }
      if (single.length === 4) {
        return `${single.slice(0, 2)}/${single.slice(2)}`;
      }
    }

    return single;
  }

  return digits[0];
}
