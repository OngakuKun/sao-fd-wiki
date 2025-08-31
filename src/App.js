import './App.css';
import { useEffect, useState } from 'react';

function getDataURL() {
    if (process.env.NODE_ENV === "development") {
        return process.env.PUBLIC_URL + "/data.json";
    }
    return "https://raw.githubusercontent.com/OngakuKun/sao-fd-wiki/dev/Data.json";
}

const LANG_EN = "en";
const LANG_DE = "de";

function LanguageSwitcher({ language, setLanguage }) {
  const [open, setOpen] = useState(false);

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
  ];

  const current = languages.find(l => l.code === language);

  return (
    <div className="lang-switcher">
      <button onClick={() => setOpen(!open)} className="lang-btn">
        <span className="flag">{current.flag}</span> {current.label} ▾
      </button>
      {open && (
        <ul className="lang-dropdown">
          {languages.map(l => (
            <li key={l.code}>
              <button
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
              >
                <span className="flag">{l.flag}</span> {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getTranslation(obj, lang) {
  if (!obj || typeof obj !== "object") return obj || "";

  if (obj[lang]) return obj[lang];

  const otherLang = lang === LANG_DE ? LANG_EN : LANG_DE;
  if (obj[otherLang]) return `[${otherLang.toUpperCase()}] ` + obj[otherLang];

  return "";
}

function getElementLabel(key, elements) {
    return elements[key] || `[MISSING] ${key}`
}

function ExtractQuests({title, questList, typeList, language}) {
    return (
        <div>
            <h2 className="quest-type-header"> {title} </h2>
            <div className="quest-grid">
                {questList.map((quest, index) => (
                    <div key={quest.id + index} className="quest-card">
                        <h3>{quest.nameText}</h3>
                        <p> {typeList.weak[language] + ": " + quest.weakText} </p>
                        <p> {typeList.res[language] + ": " + quest.resText} </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function App() {
    const [data, setData] = useState(null);
    const [language, setLanguage] = useState(LANG_EN);

    useEffect(() => {
        const url = getDataURL();
        console.log("Fetching:", url);
        fetch(url)
            .then((res) => res.json())
            .then((json) => setData(json))
            .catch((err) => console.error('Error loading data:', err));
    }, []);
    
    let bossQuests = []
    let coopQuests = []

    if (data) {
        bossQuests = data.quests
            .filter(q => q.id === "boss")
            .map(q => ({
                ...q,
                nameText: getTranslation(q.name, language),
                weakText: getElementLabel(q.weak, data.elements[language]),
                resText:  getElementLabel(q.res, data.elements[language])
            }));
        coopQuests = data.quests
            .filter(q => q.id === "coop")
            .map(q => ({
                ...q,
                nameText: getTranslation(q.name, language),
                weakText: getElementLabel(q.weak, data.elements[language]),
                resText:  getElementLabel(q.res, data.elements[language])
            }));
    }

    return (
        <div className="App">
            <header className="App-header">
                <div className="App-header-title">
                    Sword Art Online: Fractured Daydream Wiki
                </div>
                <div className="App-header-search">
                    <span>Press <kbd className="App-header-search-kbd">/</kbd> to search</span>
                </div>
                {/* Language Switch */}
                <div className="App-header-lang">
                    <LanguageSwitcher language={language} setLanguage={setLanguage} />
                </div>
            </header>
            <main>
                {data ? (
                    <>
                <ExtractQuests
                    title={getTranslation(data.types.boss, language)}
                    questList={bossQuests}
                    typeList={data.types}
                    language={language}
                    />
                <ExtractQuests
                    title={getTranslation(data.types.coop, language)}
                    questList={coopQuests}
                    typeList={data.types}
                    language={language}
                    />
                    </>
                ) : (
                        <div>Loading...</div>
                    )}
            </main>
            <footer>
                Made with GithubPages and React
            </footer>
        </div>
    );
}

export default App;
