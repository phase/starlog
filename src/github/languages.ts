import * as path from "path";
import * as yaml from "js-yaml";

interface LanguageColors {
  [language: string]: string;
}

export default async function fetchLanguageColors(): Promise<LanguageColors> {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/github-linguist/linguist/refs/heads/main/lib/linguist/languages.yml",
    );

    const yamlContent = await response.text();
    const languagesData = yaml.load(yamlContent) as Record<string, any>;

    const languageColors: LanguageColors = {};
    for (const [language, details] of Object.entries(languagesData)) {
      if (details.color) {
        languageColors[language] = details.color;
      }
    }

    return languageColors;
  } catch (error) {
    console.error("Error fetching or parsing languages:", error);
    return {};
  }
}

async function saveLanguageColors() {
  const languageColors = await fetchLanguageColors();

  const outputDir = path.join(
    import.meta.dir,
    "..",
    "..",
    "src",
    "assets",
    "data",
  );

  const outputPath = path.join(outputDir, "languageColors.json");
  await Bun.write(outputPath, JSON.stringify(languageColors, null, 2));

  console.log(`Language colors saved to ${outputPath}`);
}

const isMain = typeof Bun !== "undefined" && import.meta.path === Bun.main;
if (isMain) {
  saveLanguageColors();
}
